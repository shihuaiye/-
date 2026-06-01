import mysql from "mysql2/promise";
import { hashPassword } from "../auth/password.js";
import { env } from "../config/env.js";
import { getPool } from "./pool.js";

const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'pending_review', 'rejected') NOT NULL DEFAULT 'active',
  reviewNote TEXT,
  quickReplies JSON,
  createdAt DATETIME NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_PRODUCTS_TABLE = `
CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  category ENUM('digital', 'book', 'daily', 'ticket', 'other') NOT NULL,
  images JSON NOT NULL,
  campus VARCHAR(128) NOT NULL,
  brand VARCHAR(128),
  model VARCHAR(128),
  memory VARCHAR(128),
  latitude DOUBLE,
  longitude DOUBLE,
  status ENUM('pending', 'approved', 'rejected', 'offline', 'sold') NOT NULL DEFAULT 'pending',
  rejectionReason TEXT,
  sellerId VARCHAR(64) NOT NULL,
  sellerName VARCHAR(64) NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_status (status),
  INDEX idx_sellerId (sellerId),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_MESSAGES_TABLE = `
CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(64) PRIMARY KEY,
  productId VARCHAR(64) NOT NULL DEFAULT '',
  fromUserId VARCHAR(64) NOT NULL,
  fromUsername VARCHAR(64) NOT NULL,
  toUserId VARCHAR(64),
  toUsername VARCHAR(64),
  content TEXT NOT NULL,
  createdAt DATETIME NOT NULL,
  INDEX idx_productId (productId),
  INDEX idx_fromUserId (fromUserId),
  INDEX idx_toUserId (toUserId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_ORDERS_TABLE = `
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(64) PRIMARY KEY,
  productId VARCHAR(64) NOT NULL,
  productTitle VARCHAR(255) NOT NULL,
  buyerId VARCHAR(64) NOT NULL,
  buyerName VARCHAR(64) NOT NULL,
  sellerId VARCHAR(64) NOT NULL,
  sellerName VARCHAR(64) NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(32) NOT NULL DEFAULT 'in_progress',
  buyerConfirmed TINYINT(1) NOT NULL DEFAULT 0,
  sellerConfirmed TINYINT(1) NOT NULL DEFAULT 0,
  rating TINYINT UNSIGNED,
  ratedAt DATETIME,
  reviewText TEXT,
  reviewImages JSON,
  createdAt DATETIME NOT NULL,
  INDEX idx_buyerId (buyerId),
  INDEX idx_sellerId (sellerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const CREATE_FAVORITES_TABLE = `
CREATE TABLE IF NOT EXISTS favorites (
  userId VARCHAR(64) NOT NULL,
  productId VARCHAR(64) NOT NULL,
  createdAt DATETIME NOT NULL,
  PRIMARY KEY (userId, productId),
  INDEX idx_favorites_userId (userId),
  INDEX idx_favorites_productId (productId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const initDb = async () => {
  const tempPool = mysql.createPool({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    waitForConnections: true,
  });
  await tempPool.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.db.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
  );
  await tempPool.end();

  const p = getPool();
  await p.query(CREATE_USERS_TABLE);
  await p.query(CREATE_PRODUCTS_TABLE);
  await p.query(CREATE_MESSAGES_TABLE);
  await p.query(CREATE_ORDERS_TABLE);
  await p.query(CREATE_FAVORITES_TABLE);

  try {
    await p.query("ALTER TABLE users ADD COLUMN quickReplies JSON NULL AFTER reviewNote");
  } catch (error: unknown) {
    const err = error as { code?: string };
    if (err?.code !== "ER_DUP_FIELDNAME") throw error;
  }

  const migrations = [
    "ALTER TABLE orders ADD COLUMN rating TINYINT UNSIGNED NULL AFTER status",
    "ALTER TABLE orders ADD COLUMN ratedAt DATETIME NULL AFTER rating",
    "ALTER TABLE orders ADD COLUMN buyerConfirmed TINYINT(1) NOT NULL DEFAULT 0 AFTER status",
    "ALTER TABLE orders ADD COLUMN sellerConfirmed TINYINT(1) NOT NULL DEFAULT 0 AFTER buyerConfirmed",
    "ALTER TABLE orders MODIFY COLUMN status VARCHAR(32) NOT NULL DEFAULT 'in_progress'",
    "ALTER TABLE orders ADD COLUMN reviewText TEXT NULL AFTER ratedAt",
    "ALTER TABLE orders ADD COLUMN reviewImages JSON NULL AFTER reviewText",
  ];
  for (const sql of migrations) {
    try {
      await p.query(sql);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err?.code !== "ER_DUP_FIELDNAME") throw error;
    }
  }

  await p
    .query(
      "UPDATE orders SET buyerConfirmed = 1, sellerConfirmed = 1 WHERE status = 'completed'",
    )
    .catch(() => undefined);

  const [rows] = await p.query<mysql.RowDataPacket[]>("SELECT COUNT(*) AS cnt FROM users");
  if (rows[0].cnt === 0) {
    const now = new Date();
    const adminHash = await hashPassword("admin123");
    const userHash = await hashPassword("user123");
    await p.query(
      "INSERT INTO users (id, username, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["u-admin", "admin", adminHash, "admin", "active", now],
    );
    await p.query(
      "INSERT INTO users (id, username, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["u-demo-user", "user01", userHash, "user", "active", now],
    );
  }

  const [productRows] = await p.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM products",
  );
  if (productRows[0].cnt === 0) {
    const now = new Date();
    const sampleProducts = [
      [
        "p-sample-1",
        "MacBook Air M1 8+256",
        "大二自用，轻微使用痕迹，电池健康良好，送电脑包。",
        4200,
        "digital",
        JSON.stringify([
          "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
        ]),
        "主校区",
        "Apple",
        "MacBook Air M1",
        "8GB+256GB",
        null,
        null,
        "approved",
        null,
        "u-demo-user",
        "user01",
        now,
        now,
      ],
      [
        "p-sample-2",
        "高数教材（同济第七版）",
        "内容完整，有少量笔记，适合期末复习。",
        25,
        "book",
        JSON.stringify([
          "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80",
        ]),
        "南校区",
        null,
        null,
        null,
        null,
        null,
        "approved",
        null,
        "u-demo-user",
        "user01",
        now,
        now,
      ],
      [
        "p-sample-3",
        "桌面台灯",
        "可三档调光，宿舍可用，九成新。",
        35,
        "daily",
        JSON.stringify([
          "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=900&q=80",
        ]),
        "东校区",
        null,
        null,
        null,
        null,
        null,
        "approved",
        null,
        "u-demo-user",
        "user01",
        now,
        now,
      ],
    ];
    for (const sp of sampleProducts) {
      await p.query(
        `INSERT INTO products (id, title, description, price, category, images, campus, brand, model, memory, latitude, longitude, status, rejectionReason, sellerId, sellerName, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        sp,
      );
    }
  }
};
