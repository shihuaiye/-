import type { ProductMessage } from "@secondhand/shared/src/index.js";
import { getPool } from "../db/pool.js";
import { rowToMessage } from "./mappers.js";

export const findMessagesByProductId = async (
  productId: string,
): Promise<ProductMessage[]> => {
  const [rows] = await getPool().query(
    "SELECT * FROM messages WHERE productId = ? ORDER BY createdAt ASC",
    [productId],
  );
  return rows.map(rowToMessage);
};

export const findMessagesByUserId = async (userId: string): Promise<ProductMessage[]> => {
  const [rows] = await getPool().query(
    "SELECT * FROM messages WHERE fromUserId = ? OR toUserId = ? ORDER BY createdAt ASC",
    [userId, userId],
  );
  return rows.map(rowToMessage);
};

export const findConversationMessages = async (
  userId1: string,
  userId2: string,
): Promise<ProductMessage[]> => {
  const [rows] = await getPool().query(
    "SELECT * FROM messages WHERE (fromUserId = ? AND toUserId = ?) OR (fromUserId = ? AND toUserId = ?) ORDER BY createdAt ASC",
    [userId1, userId2, userId2, userId1],
  );
  return rows.map(rowToMessage);
};

export const createMessage = async (message: ProductMessage): Promise<ProductMessage> => {
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
    ],
  );
  return message;
};
