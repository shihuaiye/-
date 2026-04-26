export type Role = "admin" | "user";
export type Status = "pending" | "approved" | "rejected" | "offline" | "sold";
export type Category = "digital" | "book" | "daily" | "ticket" | "other";
export type Tab = "market" | "favorites" | "cart" | "messages" | "mine" | "manage" | "accounts";

export type User = {
  id: string;
  username: string;
  role: Role;
  password?: string;
  status?: "active" | "pending_review" | "rejected";
  reviewNote?: string;
};

export type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  campus: string;
  brand?: string;
  model?: string;
  memory?: string;
  latitude?: number;
  longitude?: number;
  status: Status;
  rejectionReason?: string;
  sellerId: string;
  sellerName: string;
  createdAt: string;
};

export type ProductMessage = {
  id: string;
  productId: string;
  fromUserId: string;
  fromUsername: string;
  toUserId?: string;
  toUsername?: string;
  content: string;
  createdAt: string;
};

export type Conversation = {
  userId: string;
  username: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  productId?: string;
};

export type Order = {
  id: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  status: "completed";
  createdAt: string;
};

export type PublishForm = {
  title: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  campus: string;
  brand: string;
  model: string;
  memory: string;
  latitude: number | undefined;
  longitude: number | undefined;
};
