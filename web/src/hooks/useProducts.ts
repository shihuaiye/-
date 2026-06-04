import { useCallback, useState } from "react";
import { api } from "../services/api.ts";
import type { Product, PublishForm, User } from "../types";
import { toBase64 } from "../utils.ts";

export function useProducts(
  authHeaders: () => HeadersInit,
  user: User | null,
) {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [marketProducts, setMarketProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [detail, setDetail] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadAllForAdmin = useCallback(async () => {
    const json = await api.products.all(authHeaders());
    if (json.success) setAllProducts(json.data);
  }, [authHeaders]);

  const loadMarket = useCallback(async () => {
    const json = await api.products.market(authHeaders());
    if (json.success) setMarketProducts(json.data);
  }, [authHeaders]);

  const loadMine = useCallback(async () => {
    const json = await api.products.mine(authHeaders());
    if (json.success) setMyProducts(json.data);
  }, [authHeaders]);

  const loadDetail = useCallback(
    async (id: string) => {
      const json = await api.products.detail(id, authHeaders());
      if (!json.success) return alert(json.message);
      setDetail(json.data);
      return json.data;
    },
    [authHeaders],
  );

  const publish = async (publishForm: PublishForm) => {
    if (!publishForm.images.length) return alert("请至少选择一张商品图片");
    if (!publishForm.school.trim() || !publishForm.schoolDetail.trim()) {
      return alert("请选择学校与校区");
    }
    if (!publishForm.title.trim()) return alert("请填写商品名称");
    if (!publishForm.description.trim()) return alert("请填写商品描述");
    const priceNum = Number(publishForm.price);
    if (!publishForm.price.trim() || !Number.isFinite(priceNum) || priceNum <= 0) {
      return alert("请填写有效价格");
    }
    const payload = {
      title: publishForm.title,
      description: publishForm.description,
      price: priceNum,
      category: publishForm.category,
      images: publishForm.images,
      campus:
        publishForm.campus ||
        `${publishForm.school} · ${publishForm.schoolDetail}`,
      brand: publishForm.brand || undefined,
      model: publishForm.model || undefined,
      memory: publishForm.memory || undefined,
      latitude: publishForm.latitude,
      longitude: publishForm.longitude,
    };
    const json = await api.products.create(payload, authHeaders());
    if (!json.success) return alert(json.message || "发布失败");
    alert("发布成功，等待审核");
    await Promise.all([loadMine(), loadMarket(), loadAllForAdmin()]);
    return true;
  };

  const onPublishImagesSelected = async (files: FileList | null): Promise<string[]> => {
    if (!files?.length) return [];
    const imageFiles = Array.from(files).slice(0, 6);
    return Promise.all(imageFiles.map((f) => toBase64(f)));
  };

  const audit = async (id: string, action: "approve" | "reject") => {
    let reason = "";
    if (action === "reject") {
      reason = prompt("请输入拒绝理由（必填）：")?.trim() || "";
      if (!reason) return alert("拒绝时必须填写理由");
    }
    const json = await api.products.audit(id, action, reason, authHeaders());
    if (!json.success) return alert(json.message);
    await Promise.all([loadAllForAdmin(), loadMarket()]);
  };

  const toggleStatus = async (id: string, status: "approved" | "offline") => {
    const json = await api.products.status(id, status, authHeaders());
    if (!json.success) return alert(json.message);
    await Promise.all([loadAllForAdmin(), loadMarket()]);
  };

  const markAsSold = async (product: Product) => {
    if (!confirm(`确认将"${product.title}"标记为已售出？`)) return;
    const buyerName =
      prompt("请输入买家昵称（可留空，默认系统模拟成交）")?.trim() || "系统模拟";
    const json = await api.products.soldBySeller(product.id, buyerName, authHeaders());
    if (!json.success) return alert(json.message);
    alert("商品已标记为售出");
    await Promise.all([loadMine(), loadMarket(), loadAllForAdmin()]);
  };

  const deleteMyProduct = async (product: Product) => {
    if (!confirm(`确认删除商品"${product.title}"？此操作不可撤销。`)) return;
    const json = await api.products.delete(product.id, authHeaders());
    if (!json.success) return alert(json.message);
    alert("商品已删除");
    await Promise.all([loadMine(), loadMarket(), loadAllForAdmin()]);
  };

  const updateMyProduct = async (updatedFields: Partial<Product>) => {
    if (!editingProduct) return;
    const json = await api.products.update(
      editingProduct.id,
      updatedFields,
      authHeaders(),
    );
    if (!json.success) return alert(json.message);
    alert("商品已更新，等待审核");
    setEditingProduct(null);
    await Promise.all([loadMine(), loadMarket(), loadAllForAdmin()]);
  };

  const buyNow = async (product: Product) => {
    if (!user) return false;
    if (product.sellerId === user.id) {
      alert("不能购买自己发布的商品");
      return false;
    }
    if (!confirm(`确认购买「${product.title}」吗？`)) return false;
    const json = await api.products.purchase(product.id, authHeaders());
    if (!json.success) {
      alert(json.message);
      return false;
    }
    alert("下单成功，已通知卖家确认");
    return true;
  };

  return {
    allProducts,
    marketProducts,
    myProducts,
    detail,
    setDetail,
    editingProduct,
    setEditingProduct,
    loadAllForAdmin,
    loadMarket,
    loadMine,
    loadDetail,
    publish,
    onPublishImagesSelected,
    audit,
    toggleStatus,
    markAsSold,
    deleteMyProduct,
    updateMyProduct,
    buyNow,
  };
}
