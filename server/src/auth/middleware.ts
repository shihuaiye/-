import { NextFunction, Response } from "express";
import { findUserById } from "../repositories/userRepository.js";
import { verifyToken } from "./jwt.js";
import type { AuthedRequest } from "./types.js";

export type { AuthedRequest };

export const auth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "未登录" });
  }
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    const user = await findUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ success: false, message: "登录状态无效" });
    }
    req.userId = user.id;
    req.role = user.role;
    next();
  } catch {
    return res.status(401).json({ success: false, message: "登录已过期，请重新登录" });
  }
};

export const adminOnly = (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (req.role !== "admin") {
    return res.status(403).json({ success: false, message: "仅管理员可操作" });
  }
  next();
};
