import { useEffect, useState } from "react";
import type { Conversation, Order, Product, ProductMessage, Role, User } from "../types";

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
  contactSeller: () => void;
  messages: ProductMessage[];
  setMessageImageFile: (value: File | null) => void;
  messageInput: string;
  setMessageInput: (value: string) => void;
  sendMessage: () => void;
}) {
  const {
    detail,
    setDetail,
    favorites,
    toggleFavorite,
    user,
    contactSeller,
    messages,
    setMessageImageFile,
    messageInput,
    setMessageInput,
    sendMessage,
  } = props;
  if (!detail) return null;
  return (
    <div className="modal-mask" onClick={() => setDetail(null)}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{detail.title}</h3>
        <div className="detail-images">
          {detail.images.map((img, i) => (
            <img key={i} src={img} alt={`图片${i + 1}`} />
          ))}
        </div>
        <p>{detail.description}</p>
        <p><b>价格：</b>¥{detail.price}</p>
        <p><b>地点：</b>{detail.campus}</p>
        <p><b>卖家：</b>{detail.sellerName}</p>
        <p><b>发布时间：</b>{new Date(detail.createdAt).toLocaleString("zh-CN")}</p>
        {detail.category === "digital" && (
          <p><b>规格：</b>{detail.brand} / {detail.model} / {detail.memory}</p>
        )}
        <div className="row">
          <button
            className={favorites.includes(detail.id) ? "small fav active" : "small fav"}
            onClick={() => toggleFavorite(detail.id)}
          >
            {favorites.includes(detail.id) ? "取消收藏" : "收藏商品"}
          </button>
          {detail.sellerId !== user?.id && (
            <button className="small contact-seller-btn" onClick={contactSeller}>
              💬 联系卖家
            </button>
          )}
          <button className="ghost" onClick={() => setDetail(null)}>关闭</button>
        </div>
        <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "12px 0" }} />
        <h4>联系卖家 / 留言</h4>
        <div className="message-list">
          {messages.map((m) => (
            <div key={m.id} className="message-item">
              <b>{m.fromUsername}</b>
              <span className="muted"> {new Date(m.createdAt).toLocaleString("zh-CN")}</span>
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
                    )
                  )}
                </div>
              ) : (
                <p>{m.content}</p>
              )}
            </div>
          ))}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setMessageImageFile(e.target.files?.[0] || null)}
        />
        <div className="row">
          <input
            placeholder="输入留言内容..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
          />
          <button onClick={sendMessage}>发送</button>
        </div>
      </div>
    </div>
  );
}

export function RatingModal(props: {
  order: Order | null;
  onClose: () => void;
  onSubmit: (rating: number) => void | Promise<void>;
}) {
  const { order, onClose, onSubmit } = props;
  const [rating, setRating] = useState(10);

  useEffect(() => {
    if (order) {
      setRating(order.rating ?? 10);
    }
  }, [order]);

  if (!order) return null;

  return (
    <div className="modal-mask" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>给卖家打分</h3>
        <p className="muted">订单：{order.productTitle}</p>
        <p className="muted">卖家：{order.sellerName}</p>
        <div className="rating-stars" style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "16px 0" }}>
          {Array.from({ length: 10 }, (_, index) => index + 1).map((star) => (
            <button
              key={star}
              type="button"
              className={rating >= star ? "rating-star active" : "rating-star"}
              onClick={() => setRating(star)}
              style={{
                minWidth: 40,
                minHeight: 40,
                borderRadius: 12,
                border: "1px solid #dbe3f1",
                background: rating >= star ? "#facc15" : "#f8fafc",
                color: rating >= star ? "#1f2937" : "#64748b",
                fontWeight: 700,
              }}
            >
              ★ {star}
            </button>
          ))}
        </div>
        <div className="row">
          <button onClick={() => onSubmit(rating)}>提交评分</button>
          <button className="ghost" onClick={onClose}>
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
