import { Router } from "express";
import { toPublicUser } from "../auth/publicUser.js";
import { hashPassword, isPasswordHashed, verifyPassword } from "../auth/password.js";
import { signToken } from "../auth/jwt.js";
import { auth, type AuthedRequest } from "../auth/middleware.js";
import {
  createUser,
  findUserById,
  findUserByUsername,
  newId,
  updateUser,
} from "../repositories/index.js";
import type { RegisterBody } from "@secondhand/shared/src/index.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const body = req.body as RegisterBody;
  if (!body.username || !body.password || !body.role) {
    return res.status(400).json({ success: false, message: "缺少必填字段" });
  }
  const existing = await findUserByUsername(body.username);
  if (existing) {
    return res.status(409).json({ success: false, message: "用户名已存在" });
  }
  const isAdmin = body.role === "admin";
  const hashed = await hashPassword(body.password);
  const user = {
    id: newId("u"),
    username: body.username,
    password: hashed,
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
  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    success: true,
    data: { token, user: toPublicUser(user) },
  });
});

authRouter.post("/login", async (req, res) => {
  const { username, password } = req.body as { username: string; password: string };
  const user = await findUserByUsername(username);
  if (!user || !(await verifyPassword(password, user.password))) {
    return res.status(401).json({ success: false, message: "用户名或密码错误" });
  }
  if (!isPasswordHashed(user.password)) {
    await updateUser(user.id, { password: await hashPassword(password) });
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
  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    success: true,
    data: { token, user: toPublicUser(user) },
  });
});

authRouter.get("/me", auth, async (req: AuthedRequest, res) => {
  const user = await findUserById(req.userId!);
  if (!user) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  res.json({ success: true, data: toPublicUser(user) });
});
