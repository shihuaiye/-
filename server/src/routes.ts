import { Router } from "express";
import { adminOnly, auth, AuthedRequest } from "./auth.js";
import {
  initDb,
  newId,
  readUsers,
  findUserById,
  findUserByUsername,
  createUser,
  updateUser,
  deleteUser,
  readProducts,
  findProductById,
  findProductsBySellerId,
  findApprovedProducts,
  createProduct,
  updateProduct,
  findMessagesByProductId,
  findMessagesByUserId,
  findConversationMessages,
  createMessage,
  readOrders,
  findOrdersByUserId,
  findOrdersByBuyerId,
  createOrder,
  findOrderById,
  updateOrderRating,
  findFavoriteProductIdsByUserId,
  toggleFavoriteProduct,
  getProfileStats,
} from "./db.js";
import { CreateProductBody, RegisterBody, Order } from "@secondhand/shared/src/index.js";

export const router = Router();

router.get("/health", async (_req, res) => {
  await initDb();
  res.json({ success: true, message: "ok" });
});

router.post("/auth/register", async (req, res) => {
  const body = req.body as RegisterBody;
  if (!body.username || !body.password || !body.role) {
    return res.status(400).json({ success: false, message: "缺少必填字段" });
  }
  const existing = await findUserByUsername(body.username);
  if (existing) {
    return res.status(409).json({ success: false, message: "用户名已存在" });
  }
  const isAdmin = body.role === "admin";
  const user = {
    id: newId("u"),
    username: body.username,
    password: body.password,
    role: body.role,
    status: isAdmin ? ("pending_review" as const) : ("active" as const),
    reviewNote: isAdmin ? "等待系统管理员审核" : undefined,
    createdAt: new Date().toISOString(),
  };
  await createUser(user);
  if (isAdmin) {
    return res.json({
      success: true,
      message: "管理员注册申请已提交，等待系统管理员审核",
    });
  }
  res.json({ success: true, data: { token: user.id, user } });
});

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  const user = await findUserByUsername(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: "用户名或密码错误" });
  }
  if (user.status === "pending_review") {
    return res.status(403).json({ success: false, message: "管理员账号待审核，请稍后重试" });
  }
  if (user.status === "rejected") {
    return res.status(403).json({
      success: false,
      message: `注册审核未通过：${user.reviewNote || "请联系管理员"}`,
    });
  }
  res.json({ success: true, data: { token: user.id, user } });
});

router.get("/auth/me", auth, async (req: AuthedRequest, res) => {
  const user = await findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  res.json({ success: true, data: user });
});

router.get("/products", auth, async (req: AuthedRequest, res) => {
  const mode = String(req.query.mode || "");

  if (req.role === "admin" || mode === "all") {
    const products = await readProducts();
    return res.json({ success: true, data: products });
  }

  if (mode === "mine") {
    const products = await findProductsBySellerId(req.userId!);
    return res.json({ success: true, data: products });
  }

  const products = await findApprovedProducts();
  return res.json({ success: true, data: products });
});

router.get("/products/:id", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });

  if (req.role !== "admin" && product.status !== "approved" && product.sellerId !== req.userId) {
    return res.status(403).json({ success: false, message: "无权查看该商品" });
  }

  res.json({ success: true, data: product });
});

router.post("/products", auth, async (req: AuthedRequest, res) => {
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

router.post("/products/:id/audit", auth, adminOnly, async (req, res) => {
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
    product.status = "approved";
    delete product.rejectionReason;
  } else {
    await updateProduct(product.id, {
      status: "rejected",
      rejectionReason: reason!.trim(),
      updatedAt: new Date().toISOString(),
    });
    product.status = "rejected";
    product.rejectionReason = reason!.trim();
  }
  product.updatedAt = new Date().toISOString();
  res.json({ success: true, data: product });
});

router.post("/products/:id/status", auth, adminOnly, async (req, res) => {
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
  product.status = status;
  product.updatedAt = new Date().toISOString();
  res.json({ success: true, data: product });
});

router.get("/products/:id/messages", auth, async (req, res) => {
  const productMessages = await findMessagesByProductId(req.params.id);
  res.json({ success: true, data: productMessages });
});

router.get("/favorites", auth, async (req: AuthedRequest, res) => {
  const favoriteProductIds = await findFavoriteProductIdsByUserId(req.userId!);
  res.json({ success: true, data: favoriteProductIds });
});

router.post("/products/:id/favorite", auth, async (req: AuthedRequest, res) => {
  const product = await findProductById(req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });
  const result = await toggleFavoriteProduct(req.userId!, req.params.id);
  res.json({ success: true, data: { productId: req.params.id, liked: result.liked } });
});

router.post("/products/:id/messages", auth, async (req: AuthedRequest, res) => {
  const content = String(req.body?.content || "").trim();
  if (!content) {
    return res.status(400).json({ success: false, message: "留言内容不能为空" });
  }
  const currentUser = await findUserById(req.userId!);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  const product = await findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "商品不存在" });
  }
  const newMessage = {
    id: newId("m"),
    productId: req.params.id,
    fromUserId: req.userId!,
    fromUsername: currentUser.username,
    toUserId: product.sellerId,
    toUsername: product.sellerName,
    content,
    createdAt: new Date().toISOString(),
  };
  await createMessage(newMessage);
  res.json({ success: true, data: newMessage });
});

router.get("/conversations", auth, async (req: AuthedRequest, res) => {
  const messages = await findMessagesByUserId(req.userId!);
  const conversationMap = new Map<string, any>();
  messages.forEach((msg) => {
    const otherId = msg.fromUserId === req.userId ? msg.toUserId : msg.fromUserId;
    const otherName = msg.fromUserId === req.userId ? msg.toUsername : msg.fromUsername;
    if (!otherId || !otherName) return;
    if (!conversationMap.has(otherId)) {
      conversationMap.set(otherId, {
        userId: otherId,
        username: otherName,
        lastMessage: msg.content,
        lastTime: msg.createdAt,
        unreadCount: msg.toUserId === req.userId ? 1 : 0,
        productId: msg.productId,
      });
    } else {
      const conv = conversationMap.get(otherId);
      if (msg.createdAt > conv.lastTime) {
        conv.lastMessage = msg.content;
        conv.lastTime = msg.createdAt;
      }
      if (msg.toUserId === req.userId) {
        conv.unreadCount++;
      }
    }
  });
  const conversations = Array.from(conversationMap.values()).sort(
    (a, b) => b.lastTime.localeCompare(a.lastTime)
  );
  res.json({ success: true, data: conversations });
});

router.get("/conversations/:userId", auth, async (req: AuthedRequest, res) => {
  const chatMessages = await findConversationMessages(req.userId!, req.params.userId);
  res.json({ success: true, data: chatMessages });
});

router.post("/conversations/:userId", auth, async (req: AuthedRequest, res) => {
  const content = String(req.body?.content || "").trim();
  if (!content) {
    return res.status(400).json({ success: false, message: "消息内容不能为空" });
  }
  const currentUser = await findUserById(req.userId!);
  const targetUser = await findUserById(req.params.userId);
  if (!currentUser || !targetUser) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  const newMessage = {
    id: newId("m"),
    productId: "",
    fromUserId: req.userId!,
    fromUsername: currentUser.username,
    toUserId: req.params.userId,
    toUsername: targetUser.username,
    content,
    createdAt: new Date().toISOString(),
  };
  await createMessage(newMessage);
  res.json({ success: true, data: newMessage });
});

router.get("/admin/users", auth, adminOnly, async (_req, res) => {
  const users = await readUsers();
  res.json({ success: true, data: users });
});

router.get("/admin/users/:id", auth, adminOnly, async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "用户不存在" });
  res.json({ success: true, data: user });
});

router.put("/admin/users/:id", auth, adminOnly, async (req: AuthedRequest, res) => {
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ success: false, message: "用户不存在" });
  const body = req.body as Partial<{
    username: string;
    password: string;
    role: "admin" | "user";
    status: "active" | "pending_review" | "rejected";
    reviewNote: string;
  }>;
  if (body.username !== undefined) {
    const username = body.username.trim();
    if (!username) return res.status(400).json({ success: false, message: "用户名不能为空" });
    const existing = await findUserByUsername(username);
    if (existing && existing.id !== target.id) {
      return res.status(409).json({ success: false, message: "用户名已存在" });
    }
    target.username = username;
  }
  if (body.password !== undefined) {
    if (!String(body.password).trim()) {
      return res.status(400).json({ success: false, message: "密码不能为空" });
    }
    target.password = String(body.password);
  }
  if (body.role !== undefined) {
    target.role = body.role;
    if (body.role === "admin" && !target.status) {
      target.status = "active";
    }
  }
  if (body.status !== undefined) target.status = body.status;
  if (body.reviewNote !== undefined) target.reviewNote = body.reviewNote;
  if (target.id === req.userId && target.role !== "admin") {
    return res.status(400).json({ success: false, message: "不能把当前登录管理员降级为普通用户" });
  }
  await updateUser(target.id, {
    username: target.username,
    password: target.password,
    role: target.role,
    status: target.status,
    reviewNote: target.reviewNote,
  });
  res.json({ success: true, data: target });
});

router.post("/admin/users/:id/review", auth, adminOnly, async (req, res) => {
  const { action, note } = req.body as { action: "approve" | "reject"; note?: string };
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ success: false, message: "用户不存在" });
  if (target.role !== "admin") {
    return res.status(400).json({ success: false, message: "仅管理员申请需要审核" });
  }
  if (target.status !== "pending_review") {
    return res.status(400).json({ success: false, message: "该账号不在待审核状态" });
  }
  const newStatus = action === "approve" ? "active" : "rejected";
  const reviewNote = note || (action === "approve" ? "已通过系统管理员审核" : "管理员审核拒绝");
  await updateUser(target.id, { status: newStatus, reviewNote });
  target.status = newStatus;
  target.reviewNote = reviewNote;
  res.json({ success: true, data: target });
});

router.post("/products/:id/sold", auth, async (req: AuthedRequest, res) => {
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
    createdAt: new Date().toISOString(),
  };

  await updateProduct(product.id, {
    status: "sold",
    updatedAt: new Date().toISOString(),
  });
  await createOrder(newOrder);

  product.status = "sold";
  product.updatedAt = new Date().toISOString();

  res.json({ success: true, data: { product, order: newOrder } });
});

router.post("/products/:id/purchase", auth, async (req: AuthedRequest, res) => {
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
  const newOrder: Order = {
    id: newId("o"),
    productId: product.id,
    productTitle: product.title,
    buyerId: req.userId!,
    buyerName: buyer.username,
    sellerId: product.sellerId,
    sellerName: product.sellerName,
    price: product.price,
    status: "completed",
    createdAt: new Date().toISOString(),
  };
  await updateProduct(product.id, {
    status: "sold",
    updatedAt: new Date().toISOString(),
  });
  await createOrder(newOrder);
  product.status = "sold";
  product.updatedAt = new Date().toISOString();
  res.json({ success: true, data: { product, order: newOrder } });
});

router.post("/orders/:id/rate", auth, async (req: AuthedRequest, res) => {
  const rating = Number(req.body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 10) {
    return res.status(400).json({ success: false, message: "评分必须是 1 到 10 之间的整数" });
  }
  const order = await findOrderById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: "订单不存在" });
  if (order.buyerId !== req.userId) {
    return res.status(403).json({ success: false, message: "只能评价自己的购买订单" });
  }
  if (order.rating !== undefined) {
    return res.status(400).json({ success: false, message: "该订单已评价" });
  }
  const updated = await updateOrderRating(order.id, req.userId!, rating);
  if (!updated) {
    return res.status(404).json({ success: false, message: "订单不存在" });
  }
  res.json({ success: true, data: updated });
});

router.delete("/admin/users/:id", auth, adminOnly, async (req: AuthedRequest, res) => {
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ success: false, message: "用户不存在" });
  if (target.id === req.userId) {
    return res.status(400).json({ success: false, message: "不能删除当前登录账号" });
  }
  if (target.id === "u-admin") {
    return res.status(400).json({ success: false, message: "不能删除系统管理员" });
  }
  await deleteUser(req.params.id);
  res.json({ success: true });
});

router.get("/orders", auth, async (req: AuthedRequest, res) => {
  if (req.role === "admin") {
    const ordersData = await readOrders();
    return res.json({ success: true, data: ordersData });
  }
  const userOrders = await findOrdersByUserId(req.userId!);
  res.json({ success: true, data: userOrders });
});

router.get("/profile/stats", auth, async (req: AuthedRequest, res) => {
  const stats = await getProfileStats(req.userId!);
  res.json({ success: true, data: stats });
});

router.get("/recommendations", auth, async (req: AuthedRequest, res) => {
  const products = await readProducts();
  const userOrders = await findOrdersByBuyerId(req.userId!);
  const approvedProducts = products.filter((p) => p.status === "approved");

  const purchasedCategories = new Set(userOrders.map((o) => {
    const product = products.find((p) => p.id === o.productId);
    return product?.category;
  }));

  let recommended = approvedProducts.filter((p) =>
    purchasedCategories.has(p.category) && !userOrders.some((up) => up.productId === p.id)
  );

  if (recommended.length < 3) {
    const remaining = approvedProducts.filter(
      (p) => !recommended.includes(p) && !userOrders.some((up) => up.productId === p.id)
    );
    recommended = [...recommended, ...remaining.slice(0, 5 - recommended.length)];
  }

  res.json({ success: true, data: recommended.slice(0, 6) });
});
