import { useEffect, useState } from "react";
import type {
  Conversation,
  Order,
  Product,
  ProductMessage,
  Role,
  SellerPublicProfile,
  User,
} from "../types";

export function EditProductModal(props: {
  product: Product | null;
  setProduct: (value: Product | null) => void;
  onSave: (updatedProduct: Partial<Product>) => void | Promise<void>;
}) {
  const { product, setProduct, onSave } = props;
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: 0,
    category: "other" as Product["category"],
    images: [] as string[],
    campus: "",
    brand: "",
    model: "",
    memory: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (product) {
      setForm({
        title: product.title,
        description: product.description,
        price: product.price,
        category: product.category,
        images: product.images,
        campus: product.campus,
        brand: product.brand || "",
        model: product.model || "",
        memory: product.memory || "",
      });
    }
  }, [product]);

  const toBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).slice(0, 6);
    const images = await Promise.all(fileArray.map((f) => toBase64(f)));
    setForm((prev) => ({ ...prev, images }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.campus) {
      alert("请填写标题、描述和校区");
      return;
    }
    if (form.images.length === 0) {
      alert("请至少上传一张商品图片");
      return;
    }
    if (form.category === "digital" && (!form.brand || !form.model || !form.memory)) {
      alert("数码商品必须填写品牌、型号和内存容量");
      return;
    }
    await onSave({
      title: form.title,
      description: form.description,
      price: form.price,
      category: form.category,
      images: form.images,
      campus: form.campus,
      brand: form.category === "digital" ? form.brand : undefined,
      model: form.category === "digital" ? form.model : undefined,
      memory: form.category === "digital" ? form.memory : undefined,
    });
  };

  if (!product) return null;

  return (
    <div className="modal-mask" onClick={() => setProduct(null)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: "90vh", overflowY: "auto" }}>
        <h3>编辑商品</h3>
        {product.status === "rejected" && product.rejectionReason && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <p style={{ color: "#dc2626", fontWeight: 600, margin: 0 }}>拒绝原因：{product.rejectionReason}</p>
            <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: 14 }}>请根据拒绝原因修改后重新提交</p>
          </div>
        )}
        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <label className="field-label">标题</label>
            <input
              className="field-input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="商品标题"
            />
          </div>
          <div>
            <label className="field-label">描述</label>
            <textarea
              className="field-input"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="商品描述"
              rows={3}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label className="field-label">价格</label>
              <input
                className="field-input"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                placeholder="价格"
              />
            </div>
            <div>
              <label className="field-label">分类</label>
              <select
                className="field-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Product["category"] })}
              >
                <option value="digital">数码</option>
                <option value="book">书籍</option>
                <option value="daily">日用</option>
                <option value="ticket">票券</option>
                <option value="other">其他</option>
              </select>
            </div>
          </div>
          <div>
            <label className="field-label">校区</label>
            <input
              className="field-input"
              value={form.campus}
              onChange={(e) => setForm({ ...form, campus: e.target.value })}
              placeholder="校区"
            />
          </div>
          {form.category === "digital" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <div>
                <label className="field-label">品牌</label>
                <input
                  className="field-input"
                  value={form.brand}
                  onChange={(e) => setForm({ ...form, brand: e.target.value })}
                  placeholder="品牌"
                />
              </div>
              <div>
                <label className="field-label">型号</label>
                <input
                  className="field-input"
                  value={form.model}
                  onChange={(e) => setForm({ ...form, model: e.target.value })}
                  placeholder="型号"
                />
              </div>
              <div>
                <label className="field-label">内存</label>
                <input
                  className="field-input"
                  value={form.memory}
                  onChange={(e) => setForm({ ...form, memory: e.target.value })}
                  placeholder="内存"
                />
              </div>
            </div>
          )}
          <div>
            <label className="field-label">商品图片</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
            />
            {form.images.length > 0 && (
              <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
                {form.images.map((img, i) => (
                  <img key={i} src={img} alt={`图片${i + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 8 }} />
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="row" style={{ marginTop: 16 }}>
          <button onClick={handleSubmit}>保存并重新提交审核</button>
          <button className="ghost" onClick={() => setProduct(null)}>取消</button>
        </div>
      </div>
    </div>
  );
}

export function AccountDetailModal(props: {
  accountDetail: User | null;
  accountForm: {
    username: string;
    password: string;
    role: Role;
    status: "active" | "pending_review" | "rejected";
    reviewNote: string;
  };
  setAccountForm: (value: {
    username: string;
    password: string;
    role: Role;
    status: "active" | "pending_review" | "rejected";
    reviewNote: string;
  }) => void;
  setAccountDetail: (value: User | null) => void;
  saveAccountDetail: () => void;
}) {
  const { accountDetail, accountForm, setAccountForm, setAccountDetail, saveAccountDetail } = props;
  if (!accountDetail) return null;
  return (
    <div className="modal-mask" onClick={() => setAccountDetail(null)}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>账号详情编辑：{accountDetail.username}</h3>
        <input
          placeholder="用户名"
          value={accountForm.username}
          onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
        />
        <input
          placeholder="密码"
          value={accountForm.password}
          onChange={(e) => setAccountForm({ ...accountForm, password: e.target.value })}
        />
        <select
          value={accountForm.role}
          onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value as Role })}
        >
          <option value="user">普通用户</option>
          <option value="admin">管理员</option>
        </select>
        <select
          value={accountForm.status}
          onChange={(e) =>
            setAccountForm({
              ...accountForm,
              status: e.target.value as "active" | "pending_review" | "rejected",
            })
          }
        >
          <option value="active">active</option>
          <option value="pending_review">pending_review</option>
          <option value="rejected">rejected</option>
        </select>
        <textarea
          placeholder="审核备注"
          value={accountForm.reviewNote}
          onChange={(e) => setAccountForm({ ...accountForm, reviewNote: e.target.value })}
        />
        <div className="row">
          <button onClick={saveAccountDetail}>保存修改</button>
          <button className="ghost" onClick={() => setAccountDetail(null)}>
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductDetailModal(props: {
  detail: Product | null;
  setDetail: (value: Product | null) => void;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  user: User;
  messages: ProductMessage[];
  setMessageImageFile: (value: File | null) => void;
  messageInput: string;
  setMessageInput: (value: string) => void;
  sendMessage: () => void;
  onSellerClick: (sellerId: string) => void;
  onBuyNow?: (product: Product) => void;
}) {
  const {
    detail,
    setDetail,
    favorites,
    toggleFavorite,
    user,
    messages,
    setMessageImageFile,
    messageInput,
    setMessageInput,
    sendMessage,
    onSellerClick,
    onBuyNow,
  } = props;
  if (!detail) return null;

  const isOwner = detail.sellerId === user?.id;
  const isFav = favorites.includes(detail.id);
  const canBuy = detail.status === "approved" && !isOwner && onBuyNow;

  const statusLabel: Record<string, string> = {
    approved: "售卖中",
    pending: "审核中",
    rejected: "已拒绝",
    offline: "已下线",
    sold: "已售出",
  };

  return (
    <div className="modal-mask" onClick={() => setDetail(null)}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <header className="detail-modal-header">
          <div>
            <h3 className="detail-modal-title">{detail.title}</h3>
            <span className={`detail-status-tag status-${detail.status}`}>
              {statusLabel[detail.status] || detail.status}
            </span>
          </div>
          <button
            type="button"
            className="detail-close-btn"
            aria-label="关闭"
            onClick={() => setDetail(null)}
          >
            ×
          </button>
        </header>

        <div className="detail-images">
          {detail.images.map((img, i) => (
            <img key={i} src={img} alt={`图片${i + 1}`} />
          ))}
        </div>

        <p className="detail-desc">{detail.description}</p>

        <div className="detail-price-block">
          <span className="detail-price">¥{detail.price}</span>
          <span className="detail-campus muted">{detail.campus}</span>
        </div>

        <div className="detail-meta-grid">
          <div className="detail-meta-item">
            <span className="detail-meta-label">卖家</span>
            {isOwner ? (
              <span>{detail.sellerName}（我）</span>
            ) : (
              <button
                type="button"
                className="link-btn"
                onClick={() => onSellerClick(detail.sellerId)}
              >
                {detail.sellerName}
              </button>
            )}
          </div>
          <div className="detail-meta-item">
            <span className="detail-meta-label">发布时间</span>
            <span>{new Date(detail.createdAt).toLocaleString("zh-CN")}</span>
          </div>
          {detail.category === "digital" && (
            <div className="detail-meta-item detail-meta-full">
              <span className="detail-meta-label">规格</span>
              <span>
                {detail.brand} / {detail.model} / {detail.memory}
              </span>
            </div>
          )}
        </div>

        <div className="detail-actions-bar">
          <button
            type="button"
            className={isFav ? "detail-action-btn fav active" : "detail-action-btn fav"}
            onClick={() => toggleFavorite(detail.id)}
          >
            {isFav ? "已收藏" : "收藏"}
          </button>
          {!isOwner && (
            <button
              type="button"
              className="detail-action-btn secondary"
              onClick={() => onSellerClick(detail.sellerId)}
            >
              卖家主页
            </button>
          )}
          {canBuy && (
            <button
              type="button"
              className="detail-action-btn primary"
              onClick={() => onBuyNow(detail)}
            >
              立即购买
            </button>
          )}
          <button
            type="button"
            className="detail-action-btn ghost"
            onClick={() => setDetail(null)}
          >
            关闭
          </button>
        </div>

        <section className="detail-messages-section">
          <h4 className="detail-section-title">商品留言</h4>
          <div className="message-list">
            {messages.length === 0 ? (
              <p className="muted">暂无留言，来问第一个问题吧</p>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="message-item">
                  <b>{m.fromUsername}</b>
                  <span className="muted">
                    {" "}
                    {new Date(m.createdAt).toLocaleString("zh-CN")}
                  </span>
                  {m.content.includes("[图片:") ? (
                    <div className="message-content">
                      {m.content.split("\n").map((line, i) =>
                        line.startsWith("[图片:") ? (
                          <img
                            key={i}
                            src={line.replace("[图片:", "").replace("]", "").trim()}
                            alt="留言图片"
                            className="chat-image"
                          />
                        ) : (
                          <p key={i}>{line}</p>
                        ),
                      )}
                    </div>
                  ) : (
                    <p>{m.content}</p>
                  )}
                </div>
              ))
            )}
          </div>
          <div className="detail-message-compose">
            <input
              type="file"
              accept="image/*"
              id="detail-message-image"
              className="hidden"
              onChange={(e) => setMessageImageFile(e.target.files?.[0] || null)}
            />
            <label htmlFor="detail-message-image" className="detail-message-image-label">
              添加图片
            </label>
            <input
              className="field-input detail-message-input"
              placeholder="输入留言内容..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <button type="button" className="detail-action-btn primary" onClick={sendMessage}>
              发送
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export function SellerProfileModal(props: {
  profile: SellerPublicProfile | null;
  loading: boolean;
  onClose: () => void;
  onViewProduct: (productId: string) => void;
}) {
  const { profile, loading, onClose, onViewProduct } = props;
  if (!profile && !loading) return null;

  return (
    <div className="modal-mask" onClick={onClose}>
      <div
        className="seller-profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="seller-profile-close"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>
        {loading ? (
          <p className="muted">加载中...</p>
        ) : profile ? (
          <>
            <h3>{profile.username}</h3>
            <div className="seller-profile-stats">
              <span>诚信分：{profile.trustScore.toFixed(1)}</span>
              <span>学校：{profile.school}</span>
              <span>已发布：{profile.publishedCount}</span>
              <span>成交订单：{profile.completedOrderCount}</span>
            </div>
            <h4 className="seller-profile-list-title">在售商品</h4>
            {profile.products.length === 0 ? (
              <p className="muted">暂无在售商品</p>
            ) : (
              <div className="seller-profile-products">
                {profile.products.map((p) => (
                  <div key={p.id} className="seller-profile-product-item">
                    <img src={p.images?.[0]} alt={p.title} />
                    <div className="seller-profile-product-main">
                      <b>{p.title}</b>
                      <span>¥{p.price}</span>
                    </div>
                    <button
                      type="button"
                      className="small"
                      onClick={() => onViewProduct(p.id)}
                    >
                      查看详情
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

export function OrderReviewPreview(props: { order: Order }) {
  const { order } = props;
  if (order.rating == null) return null;
  return (
    <div className="order-review-preview">
      <div className="order-review-score">评分 {order.rating}/10</div>
      {order.reviewText && <p className="order-review-text">{order.reviewText}</p>}
      {order.reviewImages && order.reviewImages.length > 0 && (
        <div className="order-review-images">
          {order.reviewImages.map((src, i) => (
            <img key={i} src={src} alt={`评价图${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RatingModal(props: {
  order: Order | null;
  onClose: () => void;
  onSubmit: (review: {
    rating: number;
    reviewText?: string;
    reviewImages?: string[];
  }) => void | Promise<void>;
}) {
  const { order, onClose, onSubmit } = props;
  const [rating, setRating] = useState(10);
  const [reviewText, setReviewText] = useState("");
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (order) {
      setRating(order.rating ?? 10);
      setReviewText(order.reviewText || "");
      setReviewImages(order.reviewImages || []);
    }
  }, [order]);

  const onImagesSelected = async (files: FileList | null) => {
    if (!files?.length) return;
    const remain = 3 - reviewImages.length;
    if (remain <= 0) return alert("最多上传 3 张评价图片");
    setUploading(true);
    try {
      const { toBase64 } = await import("../utils.ts");
      const picked = Array.from(files).slice(0, remain);
      const encoded = await Promise.all(picked.map((f) => toBase64(f)));
      setReviewImages((prev) => [...prev, ...encoded].slice(0, 3));
    } catch {
      alert("图片处理失败，请换一张试试");
    } finally {
      setUploading(false);
    }
  };

  if (!order) return null;

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card rating-modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>评价本次交易</h3>
        <p className="muted">订单：{order.productTitle}</p>
        <p className="muted">卖家：{order.sellerName}</p>

        <label className="field-label">星级评分（1-10）</label>
        <div className="rating-stars-grid">
          {Array.from({ length: 10 }, (_, index) => index + 1).map((star) => (
            <button
              key={star}
              type="button"
              className={rating >= star ? "rating-star-btn active" : "rating-star-btn"}
              onClick={() => setRating(star)}
            >
              ★ {star}
            </button>
          ))}
        </div>

        <label className="field-label">文字评价（选填）</label>
        <textarea
          className="field-input rating-review-textarea"
          placeholder="说说交易体验，如：描述相符、发货及时、态度友好…"
          maxLength={500}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
        />
        <p className="muted rating-char-count">{reviewText.length}/500</p>

        <label className="field-label">图片评价（选填，最多 3 张）</label>
        <div className="rating-review-images">
          {reviewImages.map((src, i) => (
            <div key={i} className="rating-review-image-slot">
              <img src={src} alt={`预览${i + 1}`} />
              <button
                type="button"
                className="rating-review-image-remove"
                onClick={() =>
                  setReviewImages((prev) => prev.filter((_, idx) => idx !== i))
                }
              >
                ×
              </button>
            </div>
          ))}
          {reviewImages.length < 3 && (
            <label className="rating-review-image-add">
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={uploading}
                onChange={(e) => {
                  onImagesSelected(e.target.files);
                  e.target.value = "";
                }}
              />
              {uploading ? "处理中…" : "+ 添加图片"}
            </label>
          )}
        </div>

        <div className="row rating-modal-actions">
          <button
            type="button"
            className="primary"
            onClick={() =>
              onSubmit({
                rating,
                reviewText: reviewText.trim() || undefined,
                reviewImages: reviewImages.length ? reviewImages : undefined,
              })
            }
          >
            提交评价
          </button>
          <button type="button" className="ghost" onClick={onClose}>
            稍后再评
          </button>
        </div>
      </div>
    </div>
  );
}

export function ChatModal(props: {
  chatTarget: Conversation | null;
  setChatTarget: (value: Conversation | null) => void;
  relatedProduct: Product | null;
  setRelatedProduct: (value: Product | null) => void;
  chatMessages: ProductMessage[];
  user: User | null;
  chatInput: string;
  setChatInput: (value: string) => void;
  setChatImageFile: (value: File | null) => void;
  sendChatMessage: () => void;
}) {
  const {
    chatTarget,
    setChatTarget,
    relatedProduct,
    setRelatedProduct,
    chatMessages,
    user,
    chatInput,
    setChatInput,
    setChatImageFile,
    sendChatMessage,
  } = props;
  if (!chatTarget) return null;
  return (
    <div className="modal-mask" onClick={() => { setChatTarget(null); setRelatedProduct(null); }}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <h3>与 {chatTarget.username} 对话</h3>
          {relatedProduct && (
            <div className="related-product">
              <img src={relatedProduct.images?.[0]} alt={relatedProduct.title} />
              <div>
                <b>{relatedProduct.title}</b>
                <span>¥{relatedProduct.price}</span>
              </div>
            </div>
          )}
        </div>
        <div className="chat-messages" id="chat-messages-container">
          {chatMessages.length === 0 ? (
            <div className="chat-empty">
              <p className="muted">暂无消息，开始对话吧！</p>
            </div>
          ) : (
            chatMessages.map((m) => (
              <div
                key={m.id}
                className={`chat-bubble ${m.fromUserId === user?.id ? "mine" : "other"}`}
              >
                <b>{m.fromUsername}</b>
                {m.content.includes("[图片:") ? (
                  <div className="message-content">
                    {m.content.split("\n").map((line, i) =>
                      line.startsWith("[图片:") ? (
                        <img
                          key={i}
                          src={line.replace("[图片:", "").replace("]", "")}
                          alt="图片消息"
                          className="chat-image"
                        />
                      ) : (
                        <p key={i}>{line}</p>
                      )
                    )}
                  </div>
                ) : (
                  <p>{m.content}</p>
                )}
                <span className="muted">
                  {new Date(m.createdAt).toLocaleTimeString("zh-CN")}
                </span>
              </div>
            ))
          )}
        </div>
        <div className="chat-input-area">
          <textarea
            placeholder="输入消息..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
              }
            }}
            rows={2}
          />
          <div className="image-input-row">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setChatImageFile(e.target.files?.[0] || null)}
              className="image-url-input"
            />
          </div>
          <button onClick={sendChatMessage} className="send-btn">
            发送消息
          </button>
        </div>
      </div>
    </div>
  );
}
