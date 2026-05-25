import fs from "fs/promises";
import path from "path";
import mysql from "mysql2/promise";
import { User, Product, ProductMessage } from "@secondhand/shared/src/index.js";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "******",
  database: process.env.DB_NAME || "secondhand",
};

const DATA_DIR = path.join(process.cwd(), "src", "data");

type OrderData = {
  id: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  status: "completed";
  createdAt: string;
  rating?: number;
  ratedAt?: string;
};

async function migrate() {
  console.log("开始数据迁移：JSON -> MySQL");
  console.log("=====================================");

  const tempPool = mysql.createPool({
    host: DB_CONFIG.host,
    port: DB_CONFIG.port,
    user: DB_CONFIG.user,
    password: DB_CONFIG.password,
    waitForConnections: true,
  });

  await tempPool.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await tempPool.end();
  console.log("数据库已创建/确认");

  const pool = mysql.createPool({
    ...DB_CONFIG,
    waitForConnections: true,
    connectionLimit: 5,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
      status ENUM('active', 'pending_review', 'rejected') NOT NULL DEFAULT 'active',
      reviewNote TEXT,
      createdAt DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(64) PRIMARY KEY,
      productId VARCHAR(64) NOT NULL,
      productTitle VARCHAR(255) NOT NULL,
      buyerId VARCHAR(64) NOT NULL,
      buyerName VARCHAR(64) NOT NULL,
      sellerId VARCHAR(64) NOT NULL,
      sellerName VARCHAR(64) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      status ENUM('completed') NOT NULL DEFAULT 'completed',
      rating TINYINT UNSIGNED,
      ratedAt DATETIME,
      createdAt DATETIME NOT NULL,
      INDEX idx_buyerId (buyerId),
      INDEX idx_sellerId (sellerId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      userId VARCHAR(64) NOT NULL,
      productId VARCHAR(64) NOT NULL,
      createdAt DATETIME NOT NULL,
      PRIMARY KEY (userId, productId),
      INDEX idx_favorites_userId (userId),
      INDEX idx_favorites_productId (productId)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  console.log("表结构已创建/确认");

  // 迁移用户
  try {
    const usersRaw = await fs.readFile(path.join(DATA_DIR, "users.json"), "utf-8");
    const users: User[] = JSON.parse(usersRaw);
    for (const u of users) {
      await pool.query(
        `INSERT IGNORE INTO users (id, username, password, role, status, reviewNote, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          u.id,
          u.username,
          u.password,
          (u.role as string) === "buyer" ? "user" : u.role,
          u.status || "active",
          u.reviewNote || null,
          new Date(u.createdAt),
        ]
      );
    }
    console.log(`用户迁移完成: ${users.length} 条`);
  } catch (e) {
    console.log("用户数据迁移跳过（文件不存在或为空）");
  }

  // 迁移商品
  try {
    const productsRaw = await fs.readFile(path.join(DATA_DIR, "products.json"), "utf-8");
    const products: Product[] = JSON.parse(productsRaw);
    for (const p of products) {
      await pool.query(
        `INSERT IGNORE INTO products (id, title, description, price, category, images, campus, brand, model, memory, latitude, longitude, status, rejectionReason, sellerId, sellerName, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.id,
          p.title,
          p.description,
          p.price,
          p.category,
          JSON.stringify(p.images),
          p.campus,
          p.brand || null,
          p.model || null,
          p.memory || null,
          p.latitude ?? null,
          p.longitude ?? null,
          p.status,
          p.rejectionReason || null,
          p.sellerId,
          p.sellerName,
          new Date(p.createdAt),
          new Date(p.updatedAt),
        ]
      );
    }
    console.log(`商品迁移完成: ${products.length} 条`);
  } catch (e) {
    console.log("商品数据迁移跳过（文件不存在或为空）");
  }

  // 迁移消息
  try {
    const messagesRaw = await fs.readFile(path.join(DATA_DIR, "messages.json"), "utf-8");
    const messages: ProductMessage[] = JSON.parse(messagesRaw);
    for (const m of messages) {
      await pool.query(
        `INSERT IGNORE INTO messages (id, productId, fromUserId, fromUsername, toUserId, toUsername, content, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          m.id,
          m.productId || "",
          m.fromUserId,
          m.fromUsername,
          m.toUserId || null,
          m.toUsername || null,
          m.content,
          new Date(m.createdAt),
        ]
      );
    }
    console.log(`消息迁移完成: ${messages.length} 条`);
  } catch (e) {
    console.log("消息数据迁移跳过（文件不存在或为空）");
  }

  // 迁移订单
  try {
    const ordersRaw = await fs.readFile(path.join(DATA_DIR, "orders.json"), "utf-8");
    const orders: OrderData[] = JSON.parse(ordersRaw);
    for (const o of orders) {
      await pool.query(
        `INSERT IGNORE INTO orders (id, productId, productTitle, buyerId, buyerName, sellerId, sellerName, price, status, rating, ratedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          o.id,
          o.productId,
          o.productTitle,
          o.buyerId,
          o.buyerName,
          o.sellerId,
          o.sellerName,
          o.price,
          o.status,
          o.rating ?? null,
          o.ratedAt ? new Date(o.ratedAt) : null,
          new Date(o.createdAt),
        ]
      );
    }
    console.log(`订单迁移完成: ${orders.length} 条`);
  } catch (e) {
    console.log("订单数据迁移跳过（文件不存在或为空）");
  }

  await pool.end();
  console.log("=====================================");
  console.log("数据迁移完成！所有 JSON 数据已导入 MySQL。");
}

migrate().catch((err) => {
  console.error("迁移失败:", err);
  process.exit(1);
});
