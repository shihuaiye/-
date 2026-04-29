import type {
  Conversation,
  Order,
  Product,
  ProductMessage,
  Role,
  User,
} from "../types";

const API = "http://localhost:3100/api";

type ApiResponse<T> = { success: boolean; message?: string; data: T };

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API}${path}`, init);
  return res.json();
}

export const api = {
  auth: {
    me: (headers: HeadersInit) => request<User>("/auth/me", { headers }),
    login: (payload: { username: string; password: string }) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    register: (payload: {
      username: string;
      password: string;
      role: Role;
      school?: string;
    }) =>
      request<{ token?: string; user?: User }>("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
  },
  products: {
    all: (headers: HeadersInit) =>
      request<Product[]>("/products?mode=all", { headers }),
    market: (headers: HeadersInit) =>
      request<Product[]>("/products", { headers }),
    mine: (headers: HeadersInit) =>
      request<Product[]>("/products?mode=mine", { headers }),
    detail: (id: string, headers: HeadersInit) =>
      request<Product>(`/products/${id}`, { headers }),
    create: (
      payload: {
        title: string;
        description: string;
        price: number;
        category: string;
        images: string[];
        campus: string;
        brand?: string;
        model?: string;
        memory?: string;
        latitude?: number;
        longitude?: number;
      },
      headers: HeadersInit,
    ) =>
      request<Product>("/products", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      }),
    audit: (
      id: string,
      action: "approve" | "reject",
      reason: string,
      headers: HeadersInit,
    ) =>
      request<Product>(`/products/${id}/audit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action, reason }),
      }),
    status: (
      id: string,
      status: "approved" | "offline",
      headers: HeadersInit,
    ) =>
      request<Product>(`/products/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ status }),
      }),
    soldBySeller: (id: string, buyerName: string, headers: HeadersInit) =>
      request<{ product: Product; order: Order }>(`/products/${id}/sold`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ buyerName }),
      }),
    purchase: (id: string, headers: HeadersInit) =>
      request<{ product: Product; order: Order }>(`/products/${id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
      }),
  },
  messages: {
    byProduct: (id: string, headers: HeadersInit) =>
      request<ProductMessage[]>(`/products/${id}/messages`, { headers }),
    sendToProduct: (id: string, content: string, headers: HeadersInit) =>
      request<ProductMessage>(`/products/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ content }),
      }),
  },
  conversations: {
    list: (headers: HeadersInit) =>
      request<Conversation[]>("/conversations", { headers }),
    detail: (userId: string, headers: HeadersInit) =>
      request<ProductMessage[]>(`/conversations/${userId}`, { headers }),
    send: (userId: string, content: string, headers: HeadersInit) =>
      request<ProductMessage>(`/conversations/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ content }),
      }),
  },
  admin: {
    users: (headers: HeadersInit) =>
      request<User[]>("/admin/users", { headers }),
    userDetail: (id: string, headers: HeadersInit) =>
      request<User>(`/admin/users/${id}`, { headers }),
    saveUser: (id: string, payload: Partial<User>, headers: HeadersInit) =>
      request<User>(`/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(payload),
      }),
    reviewUser: (
      id: string,
      action: "approve" | "reject",
      note: string,
      headers: HeadersInit,
    ) =>
      request<User>(`/admin/users/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ action, note }),
      }),
    deleteUser: (id: string, headers: HeadersInit) =>
      request<{}>(`/admin/users/${id}`, { method: "DELETE", headers }),
  },
  orders: {
    list: (headers: HeadersInit) => request<Order[]>("/orders", { headers }),
  },
  recommendations: {
    list: (headers: HeadersInit) =>
      request<Product[]>("/recommendations", { headers }),
  },
};
