import mysql from "mysql2/promise";
import { Product, ProductMessage, User, Order } from "@secondhand/shared/src/index.js";

const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "200508140086",
  database: process.env.DB_NAME || "secondhand",
};

let pool: mysql.Pool;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      ...DB_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
};

const CREATE_USERS_TABLE = `
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  status ENUM('active', 'pending_review', 'rejected') NOT NULL DEFAULT 'active',
  reviewNote TEXT,
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
  status ENUM('completed') NOT NULL DEFAULT 'completed',
  createdAt DATETIME NOT NULL,
  INDEX idx_buyerId (buyerId),
  INDEX idx_sellerId (sellerId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

export const initDb = async () => {
  const p = getPool();

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

  await p.query(CREATE_USERS_TABLE);
  await p.query(CREATE_PRODUCTS_TABLE);
  await p.query(CREATE_MESSAGES_TABLE);
  await p.query(CREATE_ORDERS_TABLE);

  const [rows] = await p.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM users"
  );
  if (rows[0].cnt === 0) {
    const now = new Date();
    await p.query(
      "INSERT INTO users (id, username, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["u-admin", "admin", "admin123", "admin", "active", now]
    );
    await p.query(
      "INSERT INTO users (id, username, password, role, status, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      ["u-demo-user", "user01", "user123", "user", "active", now]
    );
  }

  const [productRows] = await p.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM products"
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
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
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
        sp
      );
    }
  }

  const [msgRows] = await p.query<mysql.RowDataPacket[]>(
    "SELECT COUNT(*) AS cnt FROM messages"
  );
  if (msgRows[0].cnt === 0) {
    await p.query(
      "INSERT INTO messages (id, productId, fromUserId, fromUsername, content, createdAt) VALUES (?, ?, ?, ?, ?, ?)",
      [
        "m-sample-1",
        "p-sample-1",
        "u-admin",
        "admin",
        "这台还在吗？可以小刀吗？",
        new Date(),
      ]
    );
  }
};

export const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function rowToUser(row: mysql.RowDataPacket): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role,
    status: row.status,
    reviewNote: row.reviewNote || undefined,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function rowToProduct(row: mysql.RowDataPacket): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    price: Number(row.price),
    category: row.category,
    images: typeof row.images === "string" ? JSON.parse(row.images) : row.images,
    campus: row.campus,
    brand: row.brand || undefined,
    model: row.model || undefined,
    memory: row.memory || undefined,
    latitude: row.latitude != null ? Number(row.latitude) : undefined,
    longitude: row.longitude != null ? Number(row.longitude) : undefined,
    status: row.status,
    rejectionReason: row.rejectionReason || undefined,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    createdAt: new Date(row.createdAt).toISOString(),
    updatedAt: new Date(row.updatedAt).toISOString(),
  };
}

function rowToMessage(row: mysql.RowDataPacket): ProductMessage {
  return {
    id: row.id,
    productId: row.productId || "",
    fromUserId: row.fromUserId,
    fromUsername: row.fromUsername,
    toUserId: row.toUserId || undefined,
    toUsername: row.toUsername || undefined,
    content: row.content,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function rowToOrder(row: mysql.RowDataPacket): Order {
  return {
    id: row.id,
    productId: row.productId,
    productTitle: row.productTitle,
    buyerId: row.buyerId,
    buyerName: row.buyerName,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    price: Number(row.price),
    status: row.status,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

export const readUsers = async (): Promise<User[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM users"
  );
  return rows.map(rowToUser);
};

export const findUserById = async (id: string): Promise<User | null> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM users WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? rowToUser(rows[0]) : null;
};

export const findUserByUsername = async (
  username: string
): Promise<User | null> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM users WHERE username = ?",
    [username]
  );
  return rows.length > 0 ? rowToUser(rows[0]) : null;
};

export const createUser = async (user: User): Promise<User> => {
  await getPool().query(
    "INSERT INTO users (id, username, password, role, status, reviewNote, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      user.id,
      user.username,
      user.password,
      user.role,
      user.status,
      user.reviewNote || null,
      new Date(user.createdAt),
    ]
  );
  return user;
};

export const updateUser = async (
  id: string,
  fields: Partial<User>
): Promise<void> => {
  const sets: string[] = [];
  const values: any[] = [];
  if (fields.username !== undefined) {
    sets.push("username = ?");
    values.push(fields.username);
  }
  if (fields.password !== undefined) {
    sets.push("password = ?");
    values.push(fields.password);
  }
  if (fields.role !== undefined) {
    sets.push("role = ?");
    values.push(fields.role);
  }
  if (fields.status !== undefined) {
    sets.push("status = ?");
    values.push(fields.status);
  }
  if (fields.reviewNote !== undefined) {
    sets.push("reviewNote = ?");
    values.push(fields.reviewNote);
  }
  if (sets.length === 0) return;
  values.push(id);
  await getPool().query(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, values);
};

export const deleteUser = async (id: string): Promise<void> => {
  await getPool().query("DELETE FROM users WHERE id = ?", [id]);
};

export const readProducts = async (): Promise<Product[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM products"
  );
  return rows.map(rowToProduct);
};

export const findProductById = async (id: string): Promise<Product | null> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM products WHERE id = ?",
    [id]
  );
  return rows.length > 0 ? rowToProduct(rows[0]) : null;
};

export const findProductsBySellerId = async (
  sellerId: string
): Promise<Product[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM products WHERE sellerId = ?",
    [sellerId]
  );
  return rows.map(rowToProduct);
};

export const findApprovedProducts = async (): Promise<Product[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM products WHERE status = 'approved'"
  );
  return rows.map(rowToProduct);
};

export const findAvailableProducts = async (): Promise<Product[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM products WHERE status = 'approved'"
  );
  return rows.map(rowToProduct);
};

export const createProduct = async (product: Product): Promise<Product> => {
  await getPool().query(
    `INSERT INTO products (id, title, description, price, category, images, campus, brand, model, memory, latitude, longitude, status, rejectionReason, sellerId, sellerName, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      product.id,
      product.title,
      product.description,
      product.price,
      product.category,
      JSON.stringify(product.images),
      product.campus,
      product.brand || null,
      product.model || null,
      product.memory || null,
      product.latitude ?? null,
      product.longitude ?? null,
      product.status,
      product.rejectionReason || null,
      product.sellerId,
      product.sellerName,
      new Date(product.createdAt),
      new Date(product.updatedAt),
    ]
  );
  return product;
};

export const updateProduct = async (
  id: string,
  fields: Partial<Product>
): Promise<void> => {
  const sets: string[] = [];
  const values: any[] = [];
  if (fields.status !== undefined) {
    sets.push("status = ?");
    values.push(fields.status);
  }
  if (fields.rejectionReason !== undefined) {
    sets.push("rejectionReason = ?");
    values.push(fields.rejectionReason);
  }
  if (fields.rejectionReason === null) {
    sets.push("rejectionReason = NULL");
    values.pop();
  }
  if (fields.updatedAt !== undefined) {
    sets.push("updatedAt = ?");
    values.push(new Date(fields.updatedAt));
  }
  if (sets.length === 0) return;
  values.push(id);
  await getPool().query(
    `UPDATE products SET ${sets.join(", ")} WHERE id = ?`,
    values
  );
};

export const readMessages = async (): Promise<ProductMessage[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM messages ORDER BY createdAt ASC"
  );
  return rows.map(rowToMessage);
};

export const findMessagesByProductId = async (
  productId: string
): Promise<ProductMessage[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM messages WHERE productId = ? ORDER BY createdAt ASC",
    [productId]
  );
  return rows.map(rowToMessage);
};

export const findMessagesByUserId = async (
  userId: string
): Promise<ProductMessage[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM messages WHERE fromUserId = ? OR toUserId = ? ORDER BY createdAt ASC",
    [userId, userId]
  );
  return rows.map(rowToMessage);
};

export const findConversationMessages = async (
  userId1: string,
  userId2: string
): Promise<ProductMessage[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM messages WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?) ORDER BY createdAt ASC",
    [userId1, userId2, userId2, userId1]
  );
  return rows.map(rowToMessage);
};

export const createMessage = async (
  message: ProductMessage
): Promise<ProductMessage> => {
  await getPool().query(
    "INSERT INTO messages (id, productId, fromUserId, fromUsername, toUserId, toUsername, content, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      message.id,
      message.productId || "",
      message.fromUserId,
      message.fromUsername,
      message.toUserId || null,
      message.toUsername || null,
      message.content,
      new Date(message.createdAt),
    ]
  );
  return message;
};

export const readOrders = async (): Promise<Order[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders ORDER BY createdAt DESC"
  );
  return rows.map(rowToOrder);
};

export const findOrdersByUserId = async (
  userId: string
): Promise<Order[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders WHERE buyerId = ? OR sellerId = ? ORDER BY createdAt DESC",
    [userId, userId]
  );
  return rows.map(rowToOrder);
};

export const findOrdersByBuyerId = async (
  buyerId: string
): Promise<Order[]> => {
  const [rows] = await getPool().query<mysql.RowDataPacket[]>(
    "SELECT * FROM orders WHERE buyerId = ?",
    [buyerId]
  );
  return rows.map(rowToOrder);
};

export const createOrder = async (order: Order): Promise<Order> => {
  await getPool().query(
    "INSERT INTO orders (id, productId, productTitle, buyerId, buyerName, sellerId, sellerName, price, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      order.id,
      order.productId,
      order.productTitle,
      order.buyerId,
      order.buyerName,
      order.sellerId,
      order.sellerName,
      order.price,
      order.status,
      new Date(order.createdAt),
    ]
  );
  return order;
};
