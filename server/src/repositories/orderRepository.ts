import type { Order } from "@secondhand/shared/src/index.js";
import { getPool } from "../db/pool.js";
import { rowToOrder } from "./mappers.js";

export const readOrders = async (): Promise<Order[]> => {
  const [rows] = await getPool().query("SELECT * FROM orders ORDER BY createdAt DESC");
  return rows.map(rowToOrder);
};

export const findOrderById = async (id: string): Promise<Order | null> => {
  const [rows] = await getPool().query("SELECT * FROM orders WHERE id = ?", [id]);
  return rows.length > 0 ? rowToOrder(rows[0]) : null;
};

export const findOrdersByUserId = async (userId: string): Promise<Order[]> => {
  const [rows] = await getPool().query(
    "SELECT * FROM orders WHERE buyerId = ? OR sellerId = ? ORDER BY createdAt DESC",
    [userId, userId],
  );
  return rows.map(rowToOrder);
};

export const findOrdersByBuyerId = async (buyerId: string): Promise<Order[]> => {
  const [rows] = await getPool().query("SELECT * FROM orders WHERE buyerId = ?", [
    buyerId,
  ]);
  return rows.map(rowToOrder);
};

export const findOrdersBySellerId = async (sellerId: string): Promise<Order[]> => {
  const [rows] = await getPool().query(
    "SELECT * FROM orders WHERE sellerId = ? ORDER BY createdAt DESC",
    [sellerId],
  );
  return rows.map(rowToOrder);
};

export const createOrder = async (order: Order): Promise<Order> => {
  await getPool().query(
    "INSERT INTO orders (id, productId, productTitle, buyerId, buyerName, sellerId, sellerName, price, status, buyerConfirmed, sellerConfirmed, rating, ratedAt, reviewText, reviewImages, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
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
      order.buyerConfirmed ? 1 : 0,
      order.sellerConfirmed ? 1 : 0,
      order.rating ?? null,
      order.ratedAt ? new Date(order.ratedAt) : null,
      order.reviewText || null,
      order.reviewImages?.length ? JSON.stringify(order.reviewImages) : null,
      new Date(order.createdAt),
    ],
  );
  return order;
};

export const updateOrder = async (
  id: string,
  fields: Partial<{
    status: Order["status"];
    buyerConfirmed: boolean;
    sellerConfirmed: boolean;
  }>,
): Promise<void> => {
  const sets: string[] = [];
  const values: unknown[] = [];
  if (fields.status !== undefined) {
    sets.push("status = ?");
    values.push(fields.status);
  }
  if (fields.buyerConfirmed !== undefined) {
    sets.push("buyerConfirmed = ?");
    values.push(fields.buyerConfirmed ? 1 : 0);
  }
  if (fields.sellerConfirmed !== undefined) {
    sets.push("sellerConfirmed = ?");
    values.push(fields.sellerConfirmed ? 1 : 0);
  }
  if (sets.length === 0) return;
  values.push(id);
  await getPool().query(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`, values);
};

export const findInProgressOrderByProductId = async (
  productId: string,
): Promise<Order | null> => {
  const [rows] = await getPool().query(
    "SELECT * FROM orders WHERE productId = ? AND status = 'in_progress' LIMIT 1",
    [productId],
  );
  return rows.length > 0 ? rowToOrder(rows[0]) : null;
};

export const countCompletedOrdersBySellerId = async (sellerId: string): Promise<number> => {
  const [rows] = await getPool().query(
    "SELECT COUNT(*) AS cnt FROM orders WHERE sellerId = ? AND status = 'completed'",
    [sellerId],
  );
  return Number(rows[0]?.cnt || 0);
};

export const updateOrderReview = async (
  orderId: string,
  buyerId: string,
  data: { rating: number; reviewText?: string; reviewImages?: string[] },
): Promise<Order | null> => {
  await getPool().query(
    "UPDATE orders SET rating = ?, ratedAt = ?, reviewText = ?, reviewImages = ? WHERE id = ? AND buyerId = ?",
    [
      data.rating,
      new Date(),
      data.reviewText?.trim() || null,
      data.reviewImages?.length ? JSON.stringify(data.reviewImages) : null,
      orderId,
      buyerId,
    ],
  );
  return findOrderById(orderId);
};

/** @deprecated 使用 updateOrderReview */
export const updateOrderRating = updateOrderReview;
