import type { Conversation, Product, ProductMessage, Role, User } from "../types";

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
