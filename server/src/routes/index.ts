import { Router } from "express";
import { initDb } from "../db/init.js";
import { authRouter } from "./auth.js";
import { productsRouter } from "./products.js";
import { favoritesRouter } from "./favorites.js";
import { messagesRouter, conversationsRouter } from "./messages.js";
import { ordersRouter } from "./orders.js";
import { adminRouter } from "./admin.js";
import { profileRouter, userProfileRouter } from "./profile.js";
import { recommendationsRouter } from "./recommendations.js";

export const router = Router();

router.get("/health", async (_req, res) => {
  await initDb();
  res.json({ success: true, message: "ok" });
});

router.use("/auth", authRouter);
router.use("/products", productsRouter);
router.use("/favorites", favoritesRouter);
router.use(messagesRouter);
router.use("/conversations", conversationsRouter);
router.use("/orders", ordersRouter);
router.use("/admin", adminRouter);
router.use("/profile", profileRouter);
router.use("/users", userProfileRouter);
router.use("/recommendations", recommendationsRouter);
