import { useCallback, useState } from "react";
import { api } from "../services/api.ts";
import type { Order, OrderReviewBody, User } from "../types";

export function useOrders(authHeaders: () => HeadersInit, user: User | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [myPurchases, setMyPurchases] = useState<Order[]>([]);
  const [mySales, setMySales] = useState<Order[]>([]);
  const [pendingRatingOrder, setPendingRatingOrder] = useState<Order | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    const json = await api.orders.list(authHeaders());
    if (!json.success) return;
    setOrders(json.data);
    setMyPurchases(json.data.filter((o) => o.buyerId === user.id));
    setMySales(json.data.filter((o) => o.sellerId === user.id));
  }, [authHeaders, user]);

  const rateOrder = async (order: Order, review: OrderReviewBody) => {
    const json = await api.orders.rate(order.id, review, authHeaders());
    if (!json.success) return alert(json.message);
    alert("评价提交成功");
    setPendingRatingOrder(null);
    await loadOrders();
  };

  const handleSellerConfirmOrder = async (orderId: string) => {
    const json = await api.orders.sellerConfirm(orderId, authHeaders());
    if (!json.success) return alert(json.message);
    alert(
      json.data.order.status === "completed"
        ? "交易已完成"
        : "已确认，系统已通知买家",
    );
    await loadOrders();
  };

  const handleSellerRejectOrder = async (orderId: string) => {
    if (!confirm("确定拒绝该笔交易吗？")) return;
    const json = await api.orders.sellerReject(orderId, authHeaders());
    if (!json.success) return alert(json.message);
    alert("已拒绝交易");
    await loadOrders();
  };

  const handleBuyerConfirmOrder = async (orderId: string) => {
    const json = await api.orders.buyerConfirm(orderId, authHeaders());
    if (!json.success) return alert(json.message);
    alert("交易已完成");
    if (json.data.order.buyerId === user?.id) {
      setPendingRatingOrder(json.data.order);
    }
    await loadOrders();
  };

  return {
    orders,
    myPurchases,
    mySales,
    pendingRatingOrder,
    setPendingRatingOrder,
    loadOrders,
    rateOrder,
    handleSellerConfirmOrder,
    handleSellerRejectOrder,
    handleBuyerConfirmOrder,
  };
}
