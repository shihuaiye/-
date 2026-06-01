import { Router } from "express";
import { BUILTIN_QUICK_REPLIES } from "@secondhand/shared/src/index.js";
import { auth, type AuthedRequest } from "../auth/middleware.js";
import {
  countCompletedOrdersBySellerId,
  findProductsBySellerId,
  getProfileStats,
  getQuickReplies,
  setQuickReplies,
  findUserById,
} from "../repositories/index.js";

export const profileRouter = Router();

profileRouter.get("/stats", auth, async (req: AuthedRequest, res) => {
  const stats = await getProfileStats(req.userId!);
  res.json({ success: true, data: stats });
});

profileRouter.get("/quick-replies", auth, async (req: AuthedRequest, res) => {
  const custom = await getQuickReplies(req.userId!);
  res.json({
    success: true,
    data: { builtin: [...BUILTIN_QUICK_REPLIES], custom },
  });
});

profileRouter.put("/quick-replies", auth, async (req: AuthedRequest, res) => {
  const custom = Array.isArray(req.body?.custom) ? req.body.custom : [];
  const saved = await setQuickReplies(req.userId!, custom);
  res.json({
    success: true,
    data: { builtin: [...BUILTIN_QUICK_REPLIES], custom: saved },
  });
});

export const userProfileRouter = Router();

userProfileRouter.get("/:id/profile", auth, async (req, res) => {
  const seller = await findUserById(req.params.id);
  if (!seller) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  const products = await findProductsBySellerId(seller.id);
  const listed = products.filter((p) => p.status === "approved");
  const publishedCount = products.filter((p) =>
    ["approved", "offline", "sold"].includes(p.status),
  ).length;
  const stats = await getProfileStats(seller.id);
  const completedOrderCount = await countCompletedOrdersBySellerId(seller.id);
  const school =
    listed[0]?.campus || products.find((p) => p.campus)?.campus || "未填写";
  res.json({
    success: true,
    data: {
      id: seller.id,
      username: seller.username,
      trustScore: stats.trustScore,
      school,
      publishedCount,
      completedOrderCount,
      products: listed,
    },
  });
});
