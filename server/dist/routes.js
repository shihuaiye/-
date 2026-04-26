import { Router } from "express";
import { adminOnly, auth } from "./auth.js";
import { initDb, newId, readProducts, readUsers, writeProducts, writeUsers, } from "./db.js";
export const router = Router();
router.get("/health", async (_req, res) => {
    await initDb();
    res.json({ success: true, message: "ok" });
});
router.post("/auth/register", async (req, res) => {
    const body = req.body;
    if (!body.username || !body.password || !body.role) {
        return res.status(400).json({ success: false, message: "缺少必填字段" });
    }
    if (body.role === "admin" && body.adminCode !== "CAMPUS-ADMIN-2026") {
        return res.status(403).json({
            success: false,
            message: "管理员注册需要正确的权限码",
        });
    }
    const users = await readUsers();
    if (users.some((u) => u.username === body.username)) {
        return res.status(409).json({ success: false, message: "用户名已存在" });
    }
    const user = {
        id: newId("u"),
        username: body.username,
        password: body.password,
        role: body.role,
        createdAt: new Date().toISOString(),
    };
    users.push(user);
    await writeUsers(users);
    res.json({ success: true, data: { token: user.id, user } });
});
router.post("/auth/login", async (req, res) => {
    const { username, password } = req.body;
    const users = await readUsers();
    const user = users.find((u) => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ success: false, message: "用户名或密码错误" });
    }
    res.json({ success: true, data: { token: user.id, user } });
});
router.get("/auth/me", auth, async (req, res) => {
    const users = await readUsers();
    const user = users.find((u) => u.id === req.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: "用户不存在" });
    }
    res.json({ success: true, data: user });
});
router.get("/products", auth, async (req, res) => {
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
router.get("/products/:id", auth, async (req, res) => {
    const products = await readProducts();
    const product = products.find((p) => p.id === req.params.id);
    if (!product)
        return res.status(404).json({ success: false, message: "商品不存在" });
    // 管理员可看全部；非管理员只能看已通过或自己创建的商品
    if (req.role !== "admin" && product.status !== "approved" && product.sellerId !== req.userId) {
        return res.status(403).json({ success: false, message: "无权查看该商品" });
    }
    res.json({ success: true, data: product });
});
router.post("/products", auth, async (req, res) => {
    if (req.role !== "user" && req.role !== "admin") {
        return res.status(403).json({ success: false, message: "当前角色不可发布" });
    }
    const body = req.body;
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
        status: "pending",
        sellerId: req.userId,
        sellerName: currentUser?.username || "unknown",
        createdAt: now,
        updatedAt: now,
    };
    products.push(product);
    await writeProducts(products);
    res.json({ success: true, data: product });
});
router.post("/products/:id/audit", auth, adminOnly, async (req, res) => {
    const { action, reason } = req.body;
    const products = await readProducts();
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ success: false, message: "商品不存在" });
    if (action === "reject" && !reason?.trim()) {
        return res.status(400).json({ success: false, message: "拒绝时必须填写理由" });
    }
    if (action === "approve") {
        products[idx].status = "approved";
        delete products[idx].rejectionReason;
    }
    else {
        products[idx].status = "rejected";
        products[idx].rejectionReason = reason.trim();
    }
    products[idx].updatedAt = new Date().toISOString();
    await writeProducts(products);
    res.json({ success: true, data: products[idx] });
});
router.post("/products/:id/status", auth, adminOnly, async (req, res) => {
    const { status } = req.body;
    const products = await readProducts();
    const idx = products.findIndex((p) => p.id === req.params.id);
    if (idx === -1)
        return res.status(404).json({ success: false, message: "商品不存在" });
    if (status !== "offline" && status !== "approved") {
        return res.status(400).json({ success: false, message: "状态不合法" });
    }
    products[idx].status = status;
    products[idx].updatedAt = new Date().toISOString();
    await writeProducts(products);
    res.json({ success: true, data: products[idx] });
});
