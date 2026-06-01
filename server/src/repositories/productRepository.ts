import type { Product } from "@secondhand/shared/src/index.js";
import { getPool } from "../db/pool.js";
import { rowToProduct } from "./mappers.js";

export const readProducts = async (): Promise<Product[]> => {
  const [rows] = await getPool().query("SELECT * FROM products");
  return rows.map(rowToProduct);
};

export const findProductById = async (id: string): Promise<Product | null> => {
  const [rows] = await getPool().query("SELECT * FROM products WHERE id = ?", [id]);
  return rows.length > 0 ? rowToProduct(rows[0]) : null;
};

export const findProductsBySellerId = async (sellerId: string): Promise<Product[]> => {
  const [rows] = await getPool().query("SELECT * FROM products WHERE sellerId = ?", [
    sellerId,
  ]);
  return rows.map(rowToProduct);
};

export const findApprovedProducts = async (): Promise<Product[]> => {
  const [rows] = await getPool().query(
    "SELECT * FROM products WHERE status = 'approved'",
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
    ],
  );
  return product;
};

export const updateProduct = async (id: string, fields: Partial<Product>): Promise<void> => {
  const sets: string[] = [];
  const values: unknown[] = [];
  const fieldMap: [keyof Product, (v: unknown) => unknown][] = [
    ["title", (v) => v],
    ["description", (v) => v],
    ["price", (v) => v],
    ["category", (v) => v],
    ["images", (v) => JSON.stringify(v)],
    ["campus", (v) => v],
    ["brand", (v) => v || null],
    ["model", (v) => v || null],
    ["memory", (v) => v || null],
    ["latitude", (v) => v ?? null],
    ["longitude", (v) => v ?? null],
    ["status", (v) => v],
    ["rejectionReason", (v) => v || null],
    ["updatedAt", (v) => new Date(v as string)],
  ];
  for (const [key, transform] of fieldMap) {
    if (fields[key] !== undefined) {
      sets.push(`${key} = ?`);
      values.push(transform(fields[key]));
    }
  }
  if (sets.length === 0) return;
  values.push(id);
  await getPool().query(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`, values);
};

export const deleteProduct = async (id: string): Promise<void> => {
  await getPool().query("DELETE FROM products WHERE id = ?", [id]);
};

/** 删除卖家全部商品及关联收藏、商品留言 */
export const deleteProductsBySellerId = async (sellerId: string): Promise<number> => {
  const products = await findProductsBySellerId(sellerId);
  const productIds = products.map((p) => p.id);
  if (productIds.length > 0) {
    const placeholders = productIds.map(() => "?").join(",");
    await getPool().query(
      `DELETE FROM favorites WHERE productId IN (${placeholders})`,
      productIds,
    );
    await getPool().query(
      `DELETE FROM messages WHERE productId IN (${placeholders})`,
      productIds,
    );
  }
  const [result] = await getPool().query(
    "DELETE FROM products WHERE sellerId = ?",
    [sellerId],
  );
  const header = result[0] as { affectedRows?: number };
  return header.affectedRows ?? productIds.length;
};
