import { NextFunction, Request, Response } from "express";
import { readUsers } from "./db.js";

export interface AuthedRequest extends Request {
  userId?: string;
  role?: "admin" | "user";
}

export const auth = async (
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "未登录" });
  }
  const token = authHeader.replace("Bearer ", "");
  const users = await readUsers();
  const user = users.find((u) => u.id === token);
  if (!user) {
    return res.status(401).json({ success: false, message: "登录状态无效" });
  }
  req.userId = user.id;
  req.role = user.role;
  next();
};

export const adminOnly = (req: AuthedRequest, res: Response, next: NextFunction) => {
  if (req.role !== "admin") {
    return res.status(403).json({ success: false, message: "仅管理员可操作" });
  }
  next();
};
