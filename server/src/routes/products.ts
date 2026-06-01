import { Router } from "express";
import { auth, adminOnly, type AuthedRequest } from "../auth/middleware.js";
import {
  createProduct,
  deleteProduct,
  findApprovedProducts,
  findProductById,
  findProductsBySellerId,
  findUserById,
  newId,
  readProducts,
  toggleFavoriteProduct,
  updateProduct,
  createOrder,
} from "../repositories/index.js";
import { createPurchaseOrder } from "../orderFlow.js";
import type { CreateProductBody, Order, Product } from "@secondhand/shared/src/index.js";

export const productsRouter = Router();

productsRouter.get("/", auth, async (req: AuthedRequest, res) => {
  const mode = String(req.query.mode || "");
  if (req.role === "admin" || mode === "all") {
    return res.json({ success: true, data: await readProducts() });
  }
  if (mode === "mine") {
    return res.json({
      success: true,
      data: await findProductsBySellerId(req.userId!),
    });
  }
  return res.json({ success: true, data: await findApprovedProducts() });
});

productsRouter.get("/:id", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  if (
    req.role !== "admin" &&
    product.status !== "approved" &&
    product.sellerId !== req.userId
  ) {
    return res.status(403).json({ success: false, message: "无权查看该商品" });
  }
  res.json({ success: true, data: product });
});

productsRouter.post("/", auth, async (req: AuthedRequest, res) => {
  if (req.role !== "user" && req.role !== "admin") {
    return res.status(403).json({ success: false, message: "当前角色不可发布" });
  }
  const body = req.body as CreateProductBody;
  if (!body.title || !body.description || !body.campus || !body.category) {
    return res.status(400).json({ success: false, message: "缺少必填字段" });
  }
  if (!Array.isArray(body.images) || body.images.length === 0) {
    return res.status(400).json({ success: false, message: "请至少上传一张商品图片" });
  }
  if (body.category === "digital" && (!body.brand || !body.model || !body.memory)) {
    return res.status(400).json({
      success: false,
      message: "数码商品必须填写品牌、型号和内存容量",
    });
  }
  const currentUser = await findUserById(req.userId!);
  const now = new Date().toISOString();
  const product = {
    id: newId("p"),
    title: body.title,
    description: body.description,
    price: Number(body.price || 0),
    category: body.category,
    images: body.images,
    campus: body.campus,
    brand: body.brand,
    model: body.model,
    memory: body.memory,
    latitude: typeof body.latitude === "number" ? body.latitude : undefined,
    longitude: typeof body.longitude === "number" ? body.longitude : undefined,
    status: "pending" as const,
    sellerId: req.userId!,
    sellerName: currentUser?.username || "unknown",
    createdAt: now,
    updatedAt: now,
  };
  await createProduct(product);
  res.json({ success: true, data: product });
});

productsRouter.post("/:id/audit", auth, adminOnly, async (req, res) => {
  const { action, reason } = req.body as { action: "approve" | "reject"; reason?: string };
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  if (action === "reject" && !reason?.trim()) {
    return res.status(400).json({ success: false, message: "拒绝时必须填写理由" });
  }
  if (action === "approve") {
    await updateProduct(product.id, {
      status: "approved",
      rejectionReason: undefined,
      updatedAt: new Date().toISOString(),
    });
  } else {
    await updateProduct(product.id, {
      status: "rejected",
      rejectionReason: reason!.trim(),
      updatedAt: new Date().toISOString(),
    });
  }
  const updated = await findProductById(product.id);
  res.json({ success: true, data: updated });
});

productsRouter.post("/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body as { status: "offline" | "approved" | "sold" };
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  if (status !== "offline" && status !== "approved" && status !== "sold") {
    return res.status(400).json({ success: false, message: "状态不合法" });
  }
  await updateProduct(product.id, {
    status,
    updatedAt: new Date().toISOString(),
  });
  res.json({ success: true, data: await findProductById(product.id) });
});

productsRouter.put("/:id", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  if (product.sellerId !== req.userId && req.role !== "admin") {
    return res.status(403).json({ success: false, message: "无权修改该商品" });
  }
  if (product.status === "sold") {
    return res.status(400).json({ success: false, message: "已售出商品不可修改" });
  }
  const body = req.body as Partial<CreateProductBody>;
  const now = new Date().toISOString();
  const updateFields: Partial<Product> = {
    updatedAt: now,
    status: "pending",
    rejectionReason: undefined,
  };
  if (body.title !== undefined) updateFields.title = body.title;
  if (body.description !== undefined) updateFields.description = body.description;
  if (body.price !== undefined) updateFields.price = Number(body.price);
  if (body.category !== undefined) updateFields.category = body.category;
  if (body.images !== undefined) updateFields.images = body.images;
  if (body.campus !== undefined) updateFields.campus = body.campus;
  if (body.brand !== undefined) updateFields.brand = body.brand;
  if (body.model !== undefined) updateFields.model = body.model;
  if (body.memory !== undefined) updateFields.memory = body.memory;
  if (body.latitude !== undefined) updateFields.latitude = body.latitude;
  if (body.longitude !== undefined) updateFields.longitude = body.longitude;
  await updateProduct(product.id, updateFields);
  res.json({ success: true, data: await findProductById(product.id) });
});

productsRouter.delete("/:id", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  if (product.sellerId !== req.userId && req.role !== "admin") {
    return res.status(403).json({ success: false, message: "无权删除该商品" });
  }
  await deleteProduct(product.id);
  res.json({ success: true, message: "商品已删除" });
});

productsRouter.post("/:id/sold", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  if (product.sellerId !== req.userId && req.role !== "admin") {
    return res.status(403).json({ success: false, message: "只有卖家可以标记为已售" });
  }
  if (product.status !== "approved") {
    return res.status(400).json({ success: false, message: "只有已通过的商品可以标记为已售" });
  }
  const newOrder: Order = {
    id: newId("o"),
    productId: product.id,
    productTitle: product.title,
    buyerId: req.body?.buyerId || "u-system",
    buyerName: req.body?.buyerName || "系统模拟",
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    price: product.price,
    status: "completed",
    buyerConfirmed: true,
    sellerConfirmed: true,
    createdAt: new Date().toISOString(),
  };
  await updateProduct(product.id, {
    status: "sold",
    updatedAt: new Date().toISOString(),
  });
  await createOrder(newOrder);
  res.json({
    success: true,
    data: { product: { ...product, status: "sold" as const }, order: newOrder },
  });
});

productsRouter.post("/:id/favorite", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  const result = await toggleFavoriteProduct(req.userId!, req.params.id);
  res.json({ success: true, data: { productId: req.params.id, liked: result.liked } });
});

productsRouter.post("/:id/purchase", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  if (product.status !== "approved") {
    return res.status(400).json({ success: false, message: "该商品当前不可购买" });
  }
  if (product.sellerId === req.userId) {
    return res.status(400).json({ success: false, message: "不能购买自己发布的商品" });
  }
  const buyer = await findUserById(req.userId!);
  if (!buyer) return res.status(404).json({ success: false, message: "用户不存在" });
  try {
    const newOrder = await createPurchaseOrder(product, req.userId!, buyer.username);
    res.json({ success: true, data: { product, order: newOrder } });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "下单失败";
    res.status(400).json({ success: false, message });
  }
});
