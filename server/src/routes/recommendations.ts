import { Router } from "express";
import { auth, type AuthedRequest } from "../auth/middleware.js";
import { getRecommendations } from "../services/recommendationService.js";

export const recommendationsRouter = Router();

recommendationsRouter.get("/", auth, async (req: AuthedRequest, res) => {
  const { items, reason } = await getRecommendations(req.userId!);
  res.json({
    success: true,
    data: { items, reason },
  });
});
