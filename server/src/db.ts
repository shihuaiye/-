import fs from "fs/promises";
import path from "path";
import { Product, ProductMessage, User } from "@secondhand/shared/src/index.js";

const dataDir = path.join(process.cwd(), "src", "data");
export const DATA_DIR = dataDir;
const usersFile = path.join(dataDir, "users.json");
const productsFile = path.join(dataDir, "products.json");
const messagesFile = path.join(dataDir, "messages.json");

const ensureInit = async () => {
  const users = await readUsers();
  const products = await readProducts();

  let changed = false;
  if (users.length === 0) {
    const now = new Date().toISOString();
    users.push({
      id: "u-admin",
      username: "admin",
      password: "admin123",
      role: "admin",
      status: "active",
      createdAt: now,
    });
    users.push({
      id: "u-demo-user",
      username: "user01",
      password: "user123",
      role: "user",
      status: "active",
      createdAt: now,
    });
    changed = true;
  }

  if (products.length === 0) {
    const now = new Date().toISOString();
    const sampleProducts: Product[] = [
      {
        id: "p-sample-1",
        title: "MacBook Air M1 8+256",
        description: "大二自用，轻微使用痕迹，电池健康良好，送电脑包。",
        price: 4200,
        category: "digital",
        images: [
          "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?auto=format&fit=crop&w=900&q=80",
          "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
        ],
        campus: "主校区",
        brand: "Apple",
        model: "MacBook Air M1",
        memory: "8GB+256GB",
        status: "approved",
        sellerId: "u-demo-user",
        sellerName: "user01",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "p-sample-2",
        title: "高数教材（同济第七版）",
        description: "内容完整，有少量笔记，适合期末复习。",
        price: 25,
        category: "book",
        images: [
          "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80"
        ],
        campus: "南校区",
        status: "approved",
        sellerId: "u-demo-user",
        sellerName: "user01",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "p-sample-3",
        title: "桌面台灯",
        description: "可三档调光，宿舍可用，九成新。",
        price: 35,
        category: "daily",
        images: [
          "https://images.unsplash.com/photo-1534073828943-f801091bb18c?auto=format&fit=crop&w=900&q=80"
        ],
        campus: "东校区",
        status: "approved",
        sellerId: "u-demo-user",
        sellerName: "user01",
        createdAt: now,
        updatedAt: now
      }
    ];
    await writeProducts(sampleProducts);
    changed = true;
  }

  if (changed) {
    await writeUsers(users);
  }

  const messages = await readMessages();
  if (messages.length === 0) {
    await writeMessages([
      {
        id: "m-sample-1",
        productId: "p-sample-1",
        fromUserId: "u-admin",
        fromUsername: "admin",
        content: "这台还在吗？可以小刀吗？",
        createdAt: new Date().toISOString(),
      },
    ]);
  }
};

export const initDb = ensureInit;

export const readUsers = async (): Promise<User[]> => {
  const raw = await fs.readFile(usersFile, "utf-8");
  return JSON.parse(raw) as User[];
};

export const writeUsers = async (users: User[]) => {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
};

export const readProducts = async (): Promise<Product[]> => {
  const raw = await fs.readFile(productsFile, "utf-8");
  return JSON.parse(raw) as Product[];
};

export const writeProducts = async (products: Product[]) => {
  await fs.writeFile(productsFile, JSON.stringify(products, null, 2));
};

export const readMessages = async (): Promise<ProductMessage[]> => {
  try {
    const raw = await fs.readFile(messagesFile, "utf-8");
    return JSON.parse(raw) as ProductMessage[];
  } catch {
    return [];
  }
};

export const writeMessages = async (messages: ProductMessage[]) => {
  await fs.writeFile(messagesFile, JSON.stringify(messages, null, 2));
};

export const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
