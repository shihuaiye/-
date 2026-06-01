import type mysql from "mysql2/promise";
import type { Order, Product, ProductMessage, User } from "@secondhand/shared/src/index.js";

export const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function rowToUser(row: mysql.RowDataPacket): User {
  return {
    id: row.id,
    username: row.username,
    password: row.password,
    role: row.role,
    status: row.status,
    reviewNote: row.reviewNote || undefined,
    createdAt: new Date(row.createdAt).toISOString(),
    quickReplies: row.quickReplies
      ? typeof row.quickReplies === "string"
        ? JSON.parse(row.quickReplies)
        : row.quickReplies
      : undefined,
  };
}

export function rowToProduct(row: mysql.RowDataPacket): Product {
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

export function rowToMessage(row: mysql.RowDataPacket): ProductMessage {
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

export function rowToOrder(row: mysql.RowDataPacket): Order {
  const status = row.status as Order["status"];
  return {
    id: row.id,
    productId: row.productId,
    productTitle: row.productTitle,
    buyerId: row.buyerId,
    buyerName: row.buyerName,
    sellerId: row.sellerId,
    sellerName: row.sellerName,
    price: Number(row.price),
    status:
      status === "in_progress" || status === "cancelled" ? status : "completed",
    buyerConfirmed: Boolean(row.buyerConfirmed),
    sellerConfirmed: Boolean(row.sellerConfirmed),
    createdAt: new Date(row.createdAt).toISOString(),
    rating: row.rating != null ? Number(row.rating) : undefined,
    ratedAt: row.ratedAt ? new Date(row.ratedAt).toISOString() : undefined,
    reviewText: row.reviewText || undefined,
    reviewImages:
      row.reviewImages == null
        ? undefined
        : typeof row.reviewImages === "string"
          ? JSON.parse(row.reviewImages)
          : row.reviewImages,
  };
}
