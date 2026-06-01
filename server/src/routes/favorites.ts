import { Router } from "express";
import { auth, type AuthedRequest } from "../auth/middleware.js";
import { findFavoriteProductIdsByUserId } from "../repositories/index.js";

export const favoritesRouter = Router();

favoritesRouter.get("/", auth, async (req: AuthedRequest, res) => {
  const ids = await findFavoriteProductIdsByUserId(req.userId!);
  res.json({ success: true, data: ids });
});
