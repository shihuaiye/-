import { Router } from "express";
import {
  buyerConfirmOrder,
  sellerConfirmOrder,
  sellerRejectOrder,
} from "../orderFlow.js";
import { auth, type AuthedRequest } from "../auth/middleware.js";
import {
  findOrderById,
  findOrdersByUserId,
  findProductById,
  readOrders,
  updateOrderReview,
} from "../repositories/index.js";
import type { OrderReviewBody } from "@secondhand/shared/src/index.js";

export const ordersRouter = Router();

ordersRouter.get("/", auth, async (req: AuthedRequest, res) => {
  if (req.role === "admin") {
    return res.json({ success: true, data: await readOrders() });
  }
  res.json({ success: true, data: await findOrdersByUserId(req.userId!) });
});

ordersRouter.post("/:id/seller-confirm", auth, async (req: AuthedRequest, res) => {
  try {
    const order = await sellerConfirmOrder(req.params.id, req.userId!);
    const product = await findProductById(order.productId);
    res.json({ success: true, data: { order, product } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "操作失败";
    res.status(400).json({ success: false, message });
  }
});

ordersRouter.post("/:id/seller-reject", auth, async (req: AuthedRequest, res) => {
  try {
    const order = await sellerRejectOrder(req.params.id, req.userId!);
    const product = await findProductById(order.productId);
    res.json({ success: true, data: { order, product } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "操作失败";
    res.status(400).json({ success: false, message });
  }
});

ordersRouter.post("/:id/buyer-confirm", auth, async (req: AuthedRequest, res) => {
  try {
    const order = await buyerConfirmOrder(req.params.id, req.userId!);
    const product = await findProductById(order.productId);
    res.json({ success: true, data: { order, product } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "操作失败";
    res.status(400).json({ success: false, message });
  }
});

ordersRouter.post("/:id/rate", auth, async (req: AuthedRequest, res) => {
  const body = req.body as OrderReviewBody;
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    return res.status(400).json({ success: false, message: "评分必须是 1 到 10 之间的整数" });
  }
  const reviewText =
    typeof body.reviewText === "string" ? body.reviewText.trim().slice(0, 500) : undefined;
  let reviewImages: string[] | undefined;
  if (Array.isArray(body.reviewImages)) {
    reviewImages = body.reviewImages
      .filter((img) => typeof img === "string" && img.trim().length > 0)
      .slice(0, 3);
  }
  const order = await findOrderById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "订单不存在" });
  if (order.buyerId !== req.userId) {
    return res.status(403).json({ success: false, message: "只能评价自己的购买订单" });
  }
  if (order.status !== "completed") {
    return res.status(400).json({ success: false, message: "仅已完成订单可评价" });
  }
  if (order.rating !== undefined) {
    return res.status(400).json({ success: false, message: "该订单已评价" });
  }
  const updated = await updateOrderReview(order.id, req.userId!, {
    rating,
    reviewText,
    reviewImages,
  });
  if (!updated) {
    return res.status(404).json({ success: false, message: "订单不存在" });
  }
  res.json({ success: true, data: updated });
});
