import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { adminOnly, auth, AuthedRequest } from "./auth.js";
import {
  DATA_DIR,
  initDb,
  newId,
  readMessages,
  readProducts,
  readUsers,
  writeMessages,
  writeProducts,
  writeUsers,
} from "./db.js";
import { CreateProductBody, RegisterBody } from "@secondhand/shared/src/index.js";

type Order = {
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
  const users = await readUsers();
  if (users.some((u) => u.username === body.username)) {
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
  users.push(user);
  await writeUsers(users);
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
  const users = await readUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
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
  const users = await readUsers();
  const user = users.find((u) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  res.json({ success: true, data: user });
});

router.get("/products", auth, async (req: AuthedRequest, res) => {
  const products = await readProducts();
  const mode = String(req.query.mode || "");

  if (req.role === "admin" || mode === "all") {
    return res.json({ success: true, data: products });
  }

  if (mode === "mine") {
    return res.json({
      success: true,
      data: products.filter((p) => p.sellerId === req.userId),
    });
  }

  // 买家/卖家默认看到展示页数据（仅已通过）
  return res.json({
    success: true,
    data: products.filter((p) => p.status === "approved"),
  });
});

router.get("/products/:id", auth, async (req: AuthedRequest, res) => {
  const products = await readProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ success: false, message: "商品不存在" });

  // 管理员可看全部；非管理员只能看已通过或自己创建的商品
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

  const users = await readUsers();
  const currentUser = users.find((u) => u.id === req.userId);
  const products = await readProducts();
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
  products.push(product);
  await writeProducts(products);
  res.json({ success: true, data: product });
});

router.post("/products/:id/audit", auth, adminOnly, async (req, res) => {
  const { action, reason } = req.body as { action: "approve" | "reject"; reason?: string };
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "商品不存在" });
  if (action === "reject" && !reason?.trim()) {
    return res.status(400).json({ success: false, message: "拒绝时必须填写理由" });
  }
  if (action === "approve") {
    products[idx].status = "approved";
    delete products[idx].rejectionReason;
  } else {
    products[idx].status = "rejected";
    products[idx].rejectionReason = reason!.trim();
  }
  products[idx].updatedAt = new Date().toISOString();
  await writeProducts(products);
  res.json({ success: true, data: products[idx] });
});

router.post("/products/:id/status", auth, adminOnly, async (req, res) => {
  const { status } = req.body as { status: "offline" | "approved" | "sold" };
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "商品不存在" });
  if (status !== "offline" && status !== "approved" && status !== "sold") {
    return res.status(400).json({ success: false, message: "状态不合法" });
  }
  products[idx].status = status;
  products[idx].updatedAt = new Date().toISOString();
  await writeProducts(products);
  res.json({ success: true, data: products[idx] });
});

router.get("/products/:id/messages", auth, async (req, res) => {
  const productId = req.params.id;
  const messages = await readMessages();
  const productMessages = messages
    .filter((m) => m.productId === productId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json({ success: true, data: productMessages });
});

router.post("/products/:id/messages", auth, async (req: AuthedRequest, res) => {
  const content = String(req.body?.content || "").trim();
  if (!content) {
    return res.status(400).json({ success: false, message: "留言内容不能为空" });
  }
  const users = await readUsers();
  const currentUser = users.find((u) => u.id === req.userId);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  const products = await readProducts();
  const product = products.find((p) => p.id === req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "商品不存在" });
  }
  const messages = await readMessages();
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
  messages.push(newMessage);
  await writeMessages(messages);
  res.json({ success: true, data: newMessage });
});

router.get("/conversations", auth, async (req: AuthedRequest, res) => {
  const messages = await readMessages();
  const userMessages = messages.filter(
    (m) => m.fromUserId === req.userId || m.toUserId === req.userId
  );
  const conversationMap = new Map<string, any>();
  userMessages.forEach((msg) => {
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
  const targetUserId = req.params.userId;
  const messages = await readMessages();
  const chatMessages = messages
    .filter(
      (m) =>
        (m.fromUserId === req.userId && m.toUserId === targetUserId) ||
        (m.fromUserId === targetUserId && m.toUserId === req.userId)
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json({ success: true, data: chatMessages });
});

router.post("/conversations/:userId", auth, async (req: AuthedRequest, res) => {
  const content = String(req.body?.content || "").trim();
  if (!content) {
    return res.status(400).json({ success: false, message: "消息内容不能为空" });
  }
  const users = await readUsers();
  const currentUser = users.find((u) => u.id === req.userId);
  const targetUser = users.find((u) => u.id === req.params.userId);
  if (!currentUser || !targetUser) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  const messages = await readMessages();
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
  messages.push(newMessage);
  await writeMessages(messages);
  res.json({ success: true, data: newMessage });
});

router.get("/admin/users", auth, adminOnly, async (_req, res) => {
  const users = await readUsers();
  res.json({ success: true, data: users });
});

router.get("/admin/users/:id", auth, adminOnly, async (req, res) => {
  const users = await readUsers();
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "用户不存在" });
  res.json({ success: true, data: user });
});

router.put("/admin/users/:id", auth, adminOnly, async (req: AuthedRequest, res) => {
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "用户不存在" });
  const target = users[idx];
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
    const exists = users.some((u) => u.id !== target.id && u.username === username);
    if (exists) return res.status(409).json({ success: false, message: "用户名已存在" });
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
  users[idx] = target;
  await writeUsers(users);
  res.json({ success: true, data: target });
});

router.post("/admin/users/:id/review", auth, adminOnly, async (req, res) => {
  const { action, note } = req.body as { action: "approve" | "reject"; note?: string };
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "用户不存在" });
  if (users[idx].role !== "admin") {
    return res.status(400).json({ success: false, message: "仅管理员申请需要审核" });
  }
  if (users[idx].status !== "pending_review") {
    return res.status(400).json({ success: false, message: "该账号不在待审核状态" });
  }
  users[idx].status = action === "approve" ? "active" : "rejected";
  users[idx].reviewNote = note || (action === "approve" ? "已通过系统管理员审核" : "管理员审核拒绝");
  await writeUsers(users);
  res.json({ success: true, data: users[idx] });
});

router.post("/products/:id/sold", auth, async (req: AuthedRequest, res) => {
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "商品不存在" });
  if (products[idx].sellerId !== req.userId && req.role !== "admin") {
    return res.status(403).json({ success: false, message: "只有卖家可以标记为已售" });
  }
  if (products[idx].status !== "approved") {
    return res.status(400).json({ success: false, message: "只有已通过的商品可以标记为已售" });
  }

  const ordersData = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "orders.json"), "utf-8").catch(() => "[]")
  ) as Order[];
  const newOrder = {
    id: newId("o"),
    productId: products[idx].id,
    productTitle: products[idx].title,
    buyerId: req.body?.buyerId || "u-system",
    buyerName: req.body?.buyerName || "系统模拟",
    sellerId: products[idx].sellerId,
    sellerName: products[idx].sellerName,
    price: products[idx].price,
    status: "completed" as const,
    createdAt: new Date().toISOString(),
  };

  products[idx].status = "sold";
  products[idx].updatedAt = new Date().toISOString();

  ordersData.push(newOrder);

  await Promise.all([
    writeProducts(products),
    fs.writeFile(path.join(DATA_DIR, "orders.json"), JSON.stringify(ordersData, null, 2)),
  ]);

  res.json({ success: true, data: { product: products[idx], order: newOrder } });
});

router.post("/products/:id/purchase", auth, async (req: AuthedRequest, res) => {
  const products = await readProducts();
  const idx = products.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "商品不存在" });
  const target = products[idx];
  if (target.status !== "approved") {
    return res.status(400).json({ success: false, message: "该商品当前不可购买" });
  }
  if (target.sellerId === req.userId) {
    return res.status(400).json({ success: false, message: "不能购买自己发布的商品" });
  }
  const users = await readUsers();
  const buyer = users.find((u) => u.id === req.userId);
  if (!buyer) return res.status(404).json({ success: false, message: "用户不存在" });
  const ordersData = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "orders.json"), "utf-8").catch(() => "[]")
  ) as Order[];
  const newOrder = {
    id: newId("o"),
    productId: target.id,
    productTitle: target.title,
    buyerId: req.userId!,
    buyerName: buyer.username,
    sellerId: target.sellerId,
    sellerName: target.sellerName,
    price: target.price,
    status: "completed" as const,
    createdAt: new Date().toISOString(),
  };
  products[idx].status = "sold";
  products[idx].updatedAt = new Date().toISOString();
  ordersData.push(newOrder);
  await Promise.all([
    writeProducts(products),
    fs.writeFile(path.join(DATA_DIR, "orders.json"), JSON.stringify(ordersData, null, 2)),
  ]);
  res.json({ success: true, data: { product: products[idx], order: newOrder } });
});

router.delete("/admin/users/:id", auth, adminOnly, async (req: AuthedRequest, res) => {
  const users = await readUsers();
  const target = users.find((u) => u.id === req.params.id);
  if (!target) return res.status(404).json({ success: false, message: "用户不存在" });
  if (target.id === req.userId) {
    return res.status(400).json({ success: false, message: "不能删除当前登录账号" });
  }
  if (target.id === "u-admin") {
    return res.status(400).json({ success: false, message: "不能删除系统管理员" });
  }
  const nextUsers = users.filter((u) => u.id !== req.params.id);
  await writeUsers(nextUsers);
  res.json({ success: true });
});

router.get("/orders", auth, async (req: AuthedRequest, res) => {
  const ordersData = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "orders.json"), "utf-8").catch(() => "[]")
  ) as Order[];

  if (req.role === "admin") {
    return res.json({ success: true, data: ordersData });
  }

  const userOrders = ordersData.filter(
    (o) => o.buyerId === req.userId || o.sellerId === req.userId
  );
  res.json({ success: true, data: userOrders });
});

router.get("/recommendations", auth, async (req: AuthedRequest, res) => {
  const products = await readProducts();
  const ordersData = JSON.parse(
    await fs.readFile(path.join(DATA_DIR, "orders.json"), "utf-8").catch(() => "[]")
  ) as Order[];
  const approvedProducts = products.filter((p) => p.status === "approved");

  const userPurchases = ordersData.filter((o) => o.buyerId === req.userId);
  const purchasedCategories = new Set(userPurchases.map((o) => {
    const product = products.find((p) => p.id === o.productId);
    return product?.category;
  }));

  let recommended = approvedProducts.filter((p) =>
    purchasedCategories.has(p.category) && !userPurchases.some((up) => up.productId === p.id)
  );

  if (recommended.length < 3) {
    const remaining = approvedProducts.filter(
      (p) => !recommended.includes(p) && !userPurchases.some((up) => up.productId === p.id)
    );
    recommended = [...recommended, ...remaining.slice(0, 5 - recommended.length)];
  }

  res.json({ success: true, data: recommended.slice(0, 6) });
});
