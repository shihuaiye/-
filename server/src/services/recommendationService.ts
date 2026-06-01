import type { Product } from "@secondhand/shared/src/index.js";
import {
  findFavoriteProductIdsByUserId,
  findOrdersByBuyerId,
  findProductsBySellerId,
  readProducts,
} from "../repositories/index.js";

type ScoreContext = {
  userId: string;
  favoriteIds: Set<string>;
  purchasedProductIds: Set<string>;
  preferredCategories: Map<string, number>;
  preferredCampus: string | null;
  sellerIds: Set<string>;
};

const scoreProduct = (product: Product, ctx: ScoreContext): number => {
  if (product.sellerId === ctx.userId) return -1;
  if (ctx.purchasedProductIds.has(product.id)) return -1;

  let score = 0;
  const categoryWeight = ctx.preferredCategories.get(product.category) ?? 0;
  score += categoryWeight * 12;

  if (ctx.favoriteIds.has(product.id)) score += 25;

  if (ctx.preferredCampus && product.campus.includes(ctx.preferredCampus)) {
    score += 8;
  }

  const daysSince =
    (Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 3) score += 10;
  else if (daysSince <= 7) score += 6;
  else if (daysSince <= 14) score += 3;

  if (product.price <= 50) score += 2;
  if (ctx.sellerIds.has(product.sellerId)) score += 4;

  return score;
};

export const getRecommendations = async (
  userId: string,
  limit = 8,
): Promise<{ items: Product[]; reason: string }> => {
  const [products, orders, favoriteIds, myListed] = await Promise.all([
    readProducts(),
    findOrdersByBuyerId(userId),
    findFavoriteProductIdsByUserId(userId),
    findProductsBySellerId(userId),
  ]);

  const approved = products.filter((p) => p.status === "approved");
  const purchasedProductIds = new Set(orders.map((o) => o.productId));
  const preferredCategories = new Map<string, number>();

  for (const order of orders) {
    const product = products.find((p) => p.id === order.productId);
    if (!product) continue;
    preferredCategories.set(
      product.category,
      (preferredCategories.get(product.category) ?? 0) + 1,
    );
  }

  for (const favId of favoriteIds) {
    const product = products.find((p) => p.id === favId);
    if (!product) continue;
    preferredCategories.set(
      product.category,
      (preferredCategories.get(product.category) ?? 0) + 0.5,
    );
  }

  const preferredCampus =
    myListed.find((p) => p.campus)?.campus ||
    orders
      .map((o) => products.find((p) => p.id === o.productId)?.campus)
      .find(Boolean) ||
    null;

  const ctx: ScoreContext = {
    userId,
    favoriteIds: new Set(favoriteIds),
    purchasedProductIds,
    preferredCategories,
    preferredCampus,
    sellerIds: new Set(orders.map((o) => o.sellerId)),
  };

  const scored = approved
    .map((p) => ({ product: p, score: scoreProduct(p, ctx) }))
    .filter((x) => x.score >= 0)
    .sort((a, b) => b.score - a.score || b.product.createdAt.localeCompare(a.product.createdAt));

  let reason = "为你精选校园好物";
  if (preferredCategories.size > 0) {
    const top = [...preferredCategories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    const labels: Record<string, string> = {
      digital: "数码",
      book: "书籍",
      daily: "日用",
      ticket: "票券",
      other: "其他",
    };
    reason = `根据你的浏览与成交偏好，推荐${labels[top] ?? ""}类闲置`;
  } else if (favoriteIds.length > 0) {
    reason = "根据你的收藏兴趣推荐";
  }

  const items = scored.slice(0, limit).map((x) => x.product);
  if (items.length < limit) {
    const picked = new Set(items.map((p) => p.id));
    const filler = approved
      .filter((p) => !picked.has(p.id) && p.sellerId !== userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    for (const p of filler) {
      if (items.length >= limit) break;
      items.push(p);
    }
  }

  return { items, reason };
};
