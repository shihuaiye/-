export type UserRole = "admin" | "user";

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  status: "active" | "pending_review" | "rejected";
  reviewNote?: string;
  createdAt: string;
}

export type ProductStatus = "pending" | "approved" | "rejected" | "offline" | "sold";

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: "digital" | "book" | "daily" | "ticket" | "other";
  images: string[];
  campus: string;
  brand?: string;
  model?: string;
  memory?: string;
  latitude?: number;
  longitude?: number;
  status: ProductStatus;
  rejectionReason?: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginBody {
  username: string;
  password: string;
}

export interface RegisterBody {
  username: string;
  password: string;
  role: UserRole;
}

export interface CreateProductBody {
  title: string;
  description: string;
  price: number;
  category: "digital" | "book" | "daily" | "ticket" | "other";
  images: string[];
  campus: string;
  brand?: string;
  model?: string;
  memory?: string;
  latitude?: number;
  longitude?: number;
}

export interface ProductMessage {
  id: string;
  productId: string;
  fromUserId: string;
  fromUsername: string;
  toUserId?: string;
  toUsername?: string;
  content: string;
  createdAt: string;
}
