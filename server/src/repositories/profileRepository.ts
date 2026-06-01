import { getPool } from "../db/pool.js";

export const getProfileStats = async (
  userId: string,
): Promise<{ trustScore: number; likesCount: number; ratingCount: number }> => {
  const [ratingRows] = await getPool().query(
    "SELECT AVG(rating) AS avgRating, COUNT(rating) AS ratingCount FROM orders WHERE sellerId = ? AND rating IS NOT NULL",
    [userId],
  );
  const [likeRows] = await getPool().query(
    "SELECT COUNT(*) AS likesCount FROM favorites f INNER JOIN products p ON p.id = f.productId WHERE p.sellerId = ?",
    [userId],
  );
  const avgRating = Number(ratingRows[0]?.avgRating || 0);
  const ratingCount = Number(ratingRows[0]?.ratingCount || 0);
  const likesCount = Number(likeRows[0]?.likesCount || 0);
  return {
    trustScore: ratingCount > 0 ? Math.round(avgRating * 10) / 10 : 0,
    likesCount,
    ratingCount,
  };
};
