import { Router } from "express";
import { SYSTEM_USER_ID } from "../orderFlow.js";
import { auth, type AuthedRequest } from "../auth/middleware.js";
import {
  createMessage,
  findConversationMessages,
  findMessagesByProductId,
  findMessagesByUserId,
  findProductById,
  findUserById,
  newId,
} from "../repositories/index.js";

export const messagesRouter = Router();

messagesRouter.get("/products/:id/messages", auth, async (req, res) => {
  const data = await findMessagesByProductId(req.params.id);
  res.json({ success: true, data });
});

messagesRouter.post("/products/:id/messages", auth, async (req: AuthedRequest, res) => {
  const content = String(req.body?.content || "").trim();
  if (!content) {
    return res.status(400).json({ success: false, message: "留言内容不能为空" });
  }
  const currentUser = await findUserById(req.userId!);
  if (!currentUser) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
  const product = await findProductById(req.params.id);
  if (!product) {
    return res.status(404).json({ success: false, message: "商品不存在" });
  }
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
  await createMessage(newMessage);
  res.json({ success: true, data: newMessage });
});

export const conversationsRouter = Router();

conversationsRouter.get("/", auth, async (req: AuthedRequest, res) => {
  const messages = await findMessagesByUserId(req.userId!);
  const conversationMap = new Map<string, Record<string, unknown>>();
  let systemConv: Record<string, unknown> | null = null;

  messages.forEach((msg) => {
    if (msg.fromUserId === SYSTEM_USER_ID && msg.toUserId === req.userId) {
      const preview = msg.content.replace(/^\[ORDER:[^\]]+\]\s*/, "");
      if (!systemConv) {
        systemConv = {
          userId: SYSTEM_USER_ID,
          username: "系统通知",
          lastMessage: preview,
          lastTime: msg.createdAt,
          unreadCount: 1,
          productId: msg.productId,
          isSystem: true,
        };
      } else {
        if (msg.createdAt > (systemConv.lastTime as string)) {
          systemConv.lastMessage = preview;
          systemConv.lastTime = msg.createdAt;
        }
        systemConv.unreadCount = (systemConv.unreadCount as number) + 1;
      }
      return;
    }
    if (
      msg.fromUserId === SYSTEM_USER_ID ||
      (msg.fromUserId === req.userId && msg.toUserId === SYSTEM_USER_ID)
    ) {
      return;
    }
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
      const conv = conversationMap.get(otherId)!;
      if (msg.createdAt > (conv.lastTime as string)) {
        conv.lastMessage = msg.content;
        conv.lastTime = msg.createdAt;
      }
      if (msg.toUserId === req.userId) {
        conv.unreadCount = (conv.unreadCount as number) + 1;
      }
    }
  });

  const conversations = Array.from(conversationMap.values());
  if (systemConv) conversations.unshift(systemConv);
  conversations.sort((a, b) =>
    (b.lastTime as string).localeCompare(a.lastTime as string),
  );
  res.json({ success: true, data: conversations });
});

conversationsRouter.get("/:userId", auth, async (req: AuthedRequest, res) => {
  if (req.params.userId === SYSTEM_USER_ID) {
    const all = await findMessagesByUserId(req.userId!);
    const chatMessages = all
      .filter((m) => m.fromUserId === SYSTEM_USER_ID && m.toUserId === req.userId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return res.json({ success: true, data: chatMessages });
  }
  const chatMessages = await findConversationMessages(req.userId!, req.params.userId);
  res.json({ success: true, data: chatMessages });
});

conversationsRouter.post("/:userId", auth, async (req: AuthedRequest, res) => {
  if (req.params.userId === SYSTEM_USER_ID) {
    return res.status(400).json({ success: false, message: "无法向系统发送私信" });
  }
  const content = String(req.body?.content || "").trim();
  if (!content) {
    return res.status(400).json({ success: false, message: "消息内容不能为空" });
  }
  const currentUser = await findUserById(req.userId!);
  const targetUser = await findUserById(req.params.userId);
  if (!currentUser || !targetUser) {
    return res.status(404).json({ success: false, message: "用户不存在" });
  }
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
  await createMessage(newMessage);
  res.json({ success: true, data: newMessage });
});
