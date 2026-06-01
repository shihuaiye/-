import { getPool } from "../db/pool.js";

export const findFavoriteProductIdsByUserId = async (userId: string): Promise<string[]> => {
  const [rows] = await getPool().query(
    "SELECT productId FROM favorites WHERE userId = ? ORDER BY createdAt DESC",
    [userId],
  );
  return rows.map((row) => row.productId);
};

export const toggleFavoriteProduct = async (
  userId: string,
  productId: string,
): Promise<{ liked: boolean }> => {
  const [rows] = await getPool().query(
    "SELECT 1 AS existsFlag FROM favorites WHERE userId = ? AND productId = ?",
    [userId, productId],
  );
  if (rows.length > 0) {
    await getPool().query(
      "DELETE FROM favorites WHERE userId = ? AND productId = ?",
      [userId, productId],
    );
    return { liked: false };
  }
  await getPool().query(
    "INSERT INTO favorites (userId, productId, createdAt) VALUES (?, ?, ?)",
    [userId, productId, new Date()],
  );
  return { liked: true };
};

export const findFavoriteProductIdsForUser = findFavoriteProductIdsByUserId;
