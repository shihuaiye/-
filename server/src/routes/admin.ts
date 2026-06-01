import { Router } from "express";
import { toPublicUser } from "../auth/publicUser.js";
import { hashPassword, isPasswordHashed } from "../auth/password.js";
import { auth, adminOnly, type AuthedRequest } from "../auth/middleware.js";
import {
  deleteProductsBySellerId,
  deleteUser,
  findUserById,
  findUserByUsername,
  readUsers,
  updateUser,
} from "../repositories/index.js";

export const adminRouter = Router();

adminRouter.get("/users", auth, adminOnly, async (_req, res) => {
  const users = await readUsers();
  res.json({ success: true, data: users.map(toPublicUser) });
});

adminRouter.get("/users/:id", auth, adminOnly, async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "用户不存在" });
  res.json({ success: true, data: toPublicUser(user) });
});

adminRouter.put("/users/:id", auth, adminOnly, async (req: AuthedRequest, res) => {
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
    const plain = String(body.password).trim();
    if (!plain) {
      return res.status(400).json({ success: false, message: "密码不能为空" });
    }
    target.password = isPasswordHashed(plain) ? plain : await hashPassword(plain);
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
  const patch: Parameters<typeof updateUser>[1] = {
    username: target.username,
    role: target.role,
    status: target.status,
    reviewNote: target.reviewNote,
  };
  if (body.password !== undefined) patch.password = target.password;
  await updateUser(target.id, patch);
  res.json({ success: true, data: toPublicUser(target) });
});

adminRouter.post("/users/:id/review", auth, adminOnly, async (req, res) => {
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
  res.json({ success: true, data: toPublicUser(target) });
});

adminRouter.delete("/users/:id", auth, adminOnly, async (req: AuthedRequest, res) => {
  const target = await findUserById(req.params.id);
  if (!target) return res.status(404).json({ success: false, message: "用户不存在" });
  if (target.id === req.userId) {
    return res.status(400).json({ success: false, message: "不能删除当前登录账号" });
  }
  if (target.id === "u-admin") {
    return res.status(400).json({ success: false, message: "不能删除系统管理员" });
  }
  const productCount = await deleteProductsBySellerId(target.id);
  await deleteUser(req.params.id);
  res.json({
    success: true,
    message: `已删除账号及其发布的 ${productCount} 件商品`,
    data: { productCount },
  });
});
