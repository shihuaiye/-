import {
  createMessage,
  createOrder,
  findOrderById,
  findProductById,
  findUserById,
  newId,
  updateOrder,
  updateProduct,
  findInProgressOrderByProductId,
} from "./repositories/index.js";
import type { Order, Product } from "@secondhand/shared/src/index.js";

export const SYSTEM_USER_ID = "system";
export const SYSTEM_USERNAME = "系统";

const ORDER_TAG_RE = /^\[ORDER:([^\]]+)\]\s*/;

export const parseOrderIdFromContent = (content: string): string | null => {
  const m = content.match(ORDER_TAG_RE);
  return m ? m[1] : null;
};

export const stripOrderTag = (content: string): string =>
  content.replace(ORDER_TAG_RE, "");

export const withOrderTag = (orderId: string, text: string) =>
  `[ORDER:${orderId}] ${text}`;

export const sendSystemMessage = async (
  toUserId: string,
  content: string,
  productId = "",
  orderId?: string
) => {
  const recipient = await findUserById(toUserId);
  if (!recipient) return;
  const body = orderId ? withOrderTag(orderId, content) : content;
  await createMessage({
    id: newId("m"),
    productId,
    fromUserId: SYSTEM_USER_ID,
    fromUsername: SYSTEM_USERNAME,
    toUserId,
    toUsername: recipient.username,
    content: body,
    createdAt: new Date().toISOString(),
  });
};

const completeOrder = async (order: Order, product: Product) => {
  await updateOrder(order.id, {
    status: "completed",
    buyerConfirmed: true,
    sellerConfirmed: true,
  });
  await updateProduct(product.id, {
    status: "sold",
    updatedAt: new Date().toISOString(),
  });
};

export const tryCompleteOrder = async (orderId: string): Promise<Order | null> => {
  const order = await findOrderById(orderId);
  if (!order || order.status !== "in_progress") return order;
  if (!order.buyerConfirmed || !order.sellerConfirmed) return order;
  const product = await findProductById(order.productId);
  if (!product) return order;
  await completeOrder(order, product);
  return findOrderById(orderId);
};

export const createPurchaseOrder = async (
  product: Product,
  buyerId: string,
  buyerName: string
): Promise<Order> => {
  const existing = await findInProgressOrderByProductId(product.id);
  if (existing) {
    throw new Error("该商品已有进行中的交易");
  }
  const order: Order = {
    id: newId("o"),
    productId: product.id,
    productTitle: product.title,
    buyerId,
    buyerName,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    price: product.price,
    status: "in_progress",
    buyerConfirmed: true,
    sellerConfirmed: false,
    createdAt: new Date().toISOString(),
  };
  await createOrder(order);
  await sendSystemMessage(
    product.sellerId,
    `买家「${buyerName}」申请购买「${product.title}」，请在系统通知中确认或拒绝交易。`,
    product.id,
    order.id
  );
  return order;
};

export const sellerConfirmOrder = async (
  orderId: string,
  sellerId: string
): Promise<Order> => {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("订单不存在");
  if (order.sellerId !== sellerId) throw new Error("只有卖家可以确认交易");
  if (order.status !== "in_progress") throw new Error("订单状态不可确认");

  await updateOrder(orderId, { sellerConfirmed: true });
  const updated = await findOrderById(orderId);
  if (!updated) throw new Error("订单不存在");

  await sendSystemMessage(
    order.buyerId,
    `恭喜，卖家「${order.sellerName}」（${order.productTitle}）确认交易！`,
    order.productId,
    order.id
  );

  if (updated.buyerConfirmed && updated.sellerConfirmed) {
    const product = await findProductById(order.productId);
    if (product) await completeOrder(updated, product);
    return (await findOrderById(orderId))!;
  }
  return updated;
};

export const sellerRejectOrder = async (
  orderId: string,
  sellerId: string
): Promise<Order> => {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("订单不存在");
  if (order.sellerId !== sellerId) throw new Error("只有卖家可以拒绝交易");
  if (order.status !== "in_progress") throw new Error("订单状态不可拒绝");

  await updateOrder(orderId, { status: "cancelled", sellerConfirmed: false });
  const updated = (await findOrderById(orderId))!;

  await sendSystemMessage(
    order.buyerId,
    `抱歉，卖家「${order.sellerName}」（${order.productTitle}）拒绝交易，看看其他好物吧`,
    order.productId,
    order.id
  );
  return updated;
};

export const buyerConfirmOrder = async (
  orderId: string,
  buyerId: string
): Promise<Order> => {
  const order = await findOrderById(orderId);
  if (!order) throw new Error("订单不存在");
  if (order.buyerId !== buyerId) throw new Error("只有买家可以确认完成");
  if (order.status !== "in_progress") throw new Error("订单状态不可确认");

  await updateOrder(orderId, { buyerConfirmed: true });
  const updated = await findOrderById(orderId);
  if (!updated) throw new Error("订单不存在");

  if (updated.buyerConfirmed && updated.sellerConfirmed) {
    const product = await findProductById(order.productId);
    if (product) await completeOrder(updated, product);
    return (await findOrderById(orderId))!;
  }
  return updated;
};
