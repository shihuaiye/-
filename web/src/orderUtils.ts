import type { Order, OrderStatus } from "./types";

const ORDER_TAG_RE = /^\[ORDER:([^\]]+)\]\s*/;

export const parseOrderIdFromContent = (content: string): string | null => {
  const m = content.match(ORDER_TAG_RE);
  return m ? m[1] : null;
};

export const stripOrderTag = (content: string): string =>
  content.replace(ORDER_TAG_RE, "");

export const orderStatusLabel = (status: OrderStatus): string => {
  switch (status) {
    case "in_progress":
      return "交易中";
    case "completed":
      return "交易完成";
    case "cancelled":
      return "交易终止";
    default:
      return status;
  }
};

export const orderStatusClass = (status: OrderStatus): string => {
  switch (status) {
    case "in_progress":
      return "order-status-progress";
    case "completed":
      return "order-status-done";
    case "cancelled":
      return "order-status-cancel";
    default:
      return "";
  }
};

export const findOrderById = (orders: Order[], id: string) =>
  orders.find((o) => o.id === id);
