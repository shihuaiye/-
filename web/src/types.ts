export type {
  UserRole as Role,
  User,
  PublicUser,
  Product,
  ProductStatus as Status,
  ProductMessage,
  Order,
  OrderReviewBody,
  OrderStatus,
  SellerPublicProfile,
  QuickRepliesPayload,
  RecommendationFeed,
} from "@secondhand/shared/src/index.js";

export type Category = "digital" | "book" | "daily" | "ticket" | "other";

export { BUILTIN_QUICK_REPLIES, SYSTEM_USER_ID } from "./constants.ts";

export type Tab =
  | "market"
  | "cart"
  | "messages"
  | "profile"
  | "publish"
  | "manage"
  | "accounts";

export type ProfileStats = {
  trustScore: number;
  likesCount: number;
  ratingCount: number;
};

export type Conversation = {
  userId: string;
  username: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  productId?: string;
  isSystem?: boolean;
};

export type PublishForm = {
  title: string;
  description: string;
  price: string;
  category: import("@secondhand/shared/src/index.js").Product["category"];
  images: string[];
  school: string;
  schoolDetail: string;
  campus: string;
  brand: string;
  model: string;
  memory: string;
  latitude: number | undefined;
  longitude: number | undefined;
};
