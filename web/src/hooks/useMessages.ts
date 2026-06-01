import { useCallback, useEffect, useState } from "react";
import { api } from "../services/api.ts";
import type { Conversation, Product, ProductMessage, User } from "../types";
import { SYSTEM_USER_ID } from "../constants.ts";
import { toBase64 } from "../utils.ts";

export function useMessages(
  authHeaders: () => HeadersInit,
  user: User | null,
  userId?: string,
) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatTarget, setChatTarget] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ProductMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [relatedProduct, setRelatedProduct] = useState<Product | null>(null);
  const [lastSeenMessageTime, setLastSeenMessageTime] = useState("");
  const [messages, setMessages] = useState<ProductMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [messageImageFile, setMessageImageFile] = useState<File | null>(null);

  const messageSeenKey = user ? `sh-msg-seen-${user.id}` : "sh-msg-seen-guest";

  const markMessagesAsSeen = useCallback(() => {
    const now = new Date().toISOString();
    setLastSeenMessageTime(now);
    localStorage.setItem(messageSeenKey, now);
  }, [messageSeenKey]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const json = await api.conversations.list(authHeaders());
    if (json.success) setConversations(json.data);
  }, [authHeaders, user]);

  const loadChatMessages = useCallback(
    async (targetUserId: string) => {
      const json = await api.conversations.detail(targetUserId, authHeaders());
      if (json.success) setChatMessages(json.data);
    },
    [authHeaders],
  );

  const openChat = useCallback(
    async (target: Conversation) => {
      setChatTarget(target);
      markMessagesAsSeen();
      await loadChatMessages(target.userId);
    },
    [loadChatMessages, markMessagesAsSeen],
  );

  const openSystemChat = useCallback(async () => {
    const systemTarget: Conversation = {
      userId: SYSTEM_USER_ID,
      username: "系统通知",
      lastMessage: "",
      lastTime: new Date().toISOString(),
      unreadCount: 0,
      isSystem: true,
    };
    await openChat(systemTarget);
    return systemTarget;
  }, [openChat]);

  const sendChatMessage = async () => {
    if (!chatTarget) return;
    const content = chatInput.trim();
    const imageData = chatImageFile ? await toBase64(chatImageFile) : "";
    if (!content && !imageData) return alert("请输入消息内容或选择图片");
    const finalContent = imageData
      ? content
        ? `${content}\n[图片: ${imageData}]`
        : `[图片: ${imageData}]`
      : content;
    const json = await api.conversations.send(
      chatTarget.userId,
      finalContent,
      authHeaders(),
    );
    if (!json.success) return alert(json.message);
    setChatInput("");
    setChatImageFile(null);
    await openChat(chatTarget);
  };

  const sendQuickReply = async (text: string) => {
    setChatInput(text);
    if (!chatTarget || chatTarget.userId === SYSTEM_USER_ID) return;
    const json = await api.conversations.send(chatTarget.userId, text, authHeaders());
    if (!json.success) return alert(json.message);
    setChatInput("");
    await openChat(chatTarget);
  };

  const sendProductMessage = async (productId: string) => {
    const content = messageInput.trim();
    const imageData = messageImageFile ? await toBase64(messageImageFile) : "";
    if (!content && !imageData) return;
    const finalContent = imageData
      ? content
        ? `${content}\n[图片: ${imageData}]`
        : `[图片: ${imageData}]`
      : content;
    const json = await api.messages.sendToProduct(productId, finalContent, authHeaders());
    if (!json.success) return alert(json.message);
    setMessageInput("");
    setMessageImageFile(null);
    const msgJson = await api.messages.byProduct(productId, authHeaders());
    if (msgJson.success) setMessages(msgJson.data);
  };

  useEffect(() => {
    if (!userId) return;
    setLastSeenMessageTime(localStorage.getItem(messageSeenKey) || "");
  }, [userId, messageSeenKey]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => {
        const container = document.getElementById("chat-messages-container");
        if (container) container.scrollTop = container.scrollHeight;
      }, 100);
    }
  }, [chatMessages]);

  return {
    conversations,
    chatTarget,
    setChatTarget,
    chatMessages,
    chatInput,
    setChatInput,
    chatImageFile,
    setChatImageFile,
    relatedProduct,
    setRelatedProduct,
    lastSeenMessageTime,
    messages,
    setMessages,
    messageInput,
    setMessageInput,
    messageImageFile,
    setMessageImageFile,
    loadConversations,
    openChat,
    openSystemChat,
    sendChatMessage,
    sendQuickReply,
    sendProductMessage,
    markMessagesAsSeen,
    loadChatMessages,
  };
}
