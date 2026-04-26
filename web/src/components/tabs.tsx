import type {
  Category,
  Conversation,
  Order,
  Product,
  PublishForm,
  Status,
  User,
} from "../types";
import type { PresetLocation } from "../constants/locations";
import { distanceKm } from "../utils";

export function MarketTab(props: {
  keyword: string;
  setKeyword: (v: string) => void;
  categoryFilter: Category | "all";
  setCategoryFilter: (v: Category | "all") => void;
  sortBy: "default" | "price-asc" | "price-desc" | "time";
  setSortBy: (v: "default" | "price-asc" | "price-desc" | "time") => void;
  userLocation: { latitude: number; longitude: number } | null;
  pickCurrentLocation: () => void;
  pagedMarket: Product[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  loadDetail: (id: string) => void;
  page: number;
  pageCount: number;
  setPage: (updater: (n: number) => number) => void;
  recommendations: Product[];
  cart: string[];
  toggleCart: (id: string) => void;
}) {
  const {
    keyword,
    setKeyword,
    categoryFilter,
    setCategoryFilter,
    sortBy,
    setSortBy,
    userLocation,
    pickCurrentLocation,
    pagedMarket,
    favorites,
    toggleFavorite,
    loadDetail,
    page,
    pageCount,
    setPage,
    recommendations,
    cart,
    toggleCart,
  } = props;

  return (
    <>
      <section className="card">
        <div className="row wrap">
          <h3>商品广场</h3>
          <input
            className="search"
            placeholder="搜索商品"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <select
            className="category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | "all")}
          >
            <option value="all">全部分类</option>
            <option value="digital">数码</option>
            <option value="book">书籍</option>
            <option value="daily">日用</option>
            <option value="ticket">票券</option>
            <option value="other">其他</option>
          </select>
          <select
            className="sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "default" | "price-asc" | "price-desc" | "time")}
          >
            <option value="default">默认排序</option>
            <option value="price-asc">价格从低到高</option>
            <option value="price-desc">价格从高到低</option>
            <option value="time">最新发布</option>
          </select>
          <button className="small ghost" onClick={pickCurrentLocation}>
            {userLocation ? "已定位" : "获取定位"}
          </button>
        </div>
      </section>

      <section className="grid">
        {pagedMarket.map((p) => (
          <article key={p.id} className="product-card">
            <img src={p.images?.[0]} alt={p.title} className="thumb" />
            <div className="row">
              <h4>{p.title}</h4>
              <button
                className={favorites.includes(p.id) ? "small fav active" : "small fav"}
                onClick={() => toggleFavorite(p.id)}
              >
                {favorites.includes(p.id) ? "已收藏" : "收藏"}
              </button>
            </div>
            <p className="muted">{p.description.slice(0, 52)}...</p>
            <div className="row">
              <strong>¥{p.price}</strong>
              <span>{p.campus}</span>
            </div>
            <div className="meta">
              发布时间：{new Date(p.createdAt).toLocaleDateString("zh-CN")}
            </div>
            {userLocation && (
              <div className="meta">
                距离：
                {Number.isFinite(distanceKm(userLocation, p))
                  ? `${distanceKm(userLocation, p).toFixed(2)} km`
                  : "未知"}
              </div>
            )}
            <div className="seller-block">卖家：{p.sellerName}</div>
            <div className="row">
              <button className="small" onClick={() => loadDetail(p.id)}>
                查看详情
              </button>
              <button
                className={cart.includes(p.id) ? "small ghost" : "small"}
                onClick={() => toggleCart(p.id)}
              >
                {cart.includes(p.id) ? "移出购物车" : "加入购物车"}
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="card pagination">
        <button
          className="ghost"
          disabled={page <= 1}
          onClick={() => setPage((x) => Math.max(1, x - 1))}
        >
          上一页
        </button>
        <span>
          第 {page} / {pageCount} 页
        </span>
        <button
          className="ghost"
          disabled={page >= pageCount}
          onClick={() => setPage((x) => Math.min(pageCount, x + 1))}
        >
          下一页
        </button>
      </section>

      {recommendations.length > 0 && (
        <section className="card" style={{ marginTop: 24 }}>
          <h3>为你推荐</h3>
          <p className="muted">基于你的购买历史和浏览偏好推荐</p>
          <div className="grid">
            {recommendations.map((p) => (
              <article key={p.id} className="product-card">
                <img src={p.images?.[0]} alt={p.title} className="thumb" />
                <div className="row">
                  <h4>{p.title}</h4>
                  <button
                    className={favorites.includes(p.id) ? "small fav active" : "small fav"}
                    onClick={() => toggleFavorite(p.id)}
                  >
                    {favorites.includes(p.id) ? "已收藏" : "收藏"}
                  </button>
                </div>
                <p className="muted">{p.description.slice(0, 52)}...</p>
                <div className="row">
                  <strong>¥{p.price}</strong>
                  <span>{p.campus}</span>
                </div>
                <div className="meta">
                  发布时间：{new Date(p.createdAt).toLocaleDateString("zh-CN")}
                </div>
                <div className="row">
                  <button className="small" onClick={() => loadDetail(p.id)}>
                    查看详情
                  </button>
                  <button
                    className={cart.includes(p.id) ? "small ghost" : "small"}
                    onClick={() => toggleCart(p.id)}
                  >
                    {cart.includes(p.id) ? "移出购物车" : "加入购物车"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

export function FavoritesTab(props: {
  favoriteProducts: Product[];
  loadDetail: (id: string) => void;
  toggleFavorite: (id: string) => void;
}) {
  const { favoriteProducts, loadDetail, toggleFavorite } = props;
  return (
    <section className="card">
      <h3>我的收藏</h3>
      {favoriteProducts.length === 0 ? (
        <p className="muted">暂无收藏商品，去商品展示页看看吧。</p>
      ) : (
        <div className="grid">
          {favoriteProducts.map((p) => (
            <article key={p.id} className="product-card">
              <img src={p.images?.[0]} alt={p.title} className="thumb" />
              <h4>{p.title}</h4>
              <div className="row">
                <strong>¥{p.price}</strong>
                <span>{p.campus}</span>
              </div>
              <div className="row">
                <button className="small" onClick={() => loadDetail(p.id)}>
                  查看详情
                </button>
                <button className="small ghost" onClick={() => toggleFavorite(p.id)}>
                  取消收藏
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function MineTab(props: {
  publishForm: PublishForm;
  setPublishForm: (value: PublishForm) => void;
  onPublishImagesSelected: (files: FileList | null) => void;
  pickCurrentLocation: () => void;
  publish: () => void;
  myProducts: Product[];
  markAsSold: (product: Product) => void;
  historyTab: "sales" | "purchases";
  setHistoryTab: (value: "sales" | "purchases") => void;
  mySales: Order[];
  myPurchases: Order[];
  presetLocations: PresetLocation[];
  manualLocationLabel: string;
  setManualLocationLabel: (value: string) => void;
  applyManualLocation: () => void;
}) {
  const {
    publishForm,
    setPublishForm,
    onPublishImagesSelected,
    pickCurrentLocation,
    publish,
    myProducts,
    markAsSold,
    historyTab,
    setHistoryTab,
    mySales,
    myPurchases,
    presetLocations,
    manualLocationLabel,
    setManualLocationLabel,
    applyManualLocation,
  } = props;

  return (
    <>
      <section className="card">
        <h3>发布商品</h3>
        <input
          placeholder="标题"
          value={publishForm.title}
          onChange={(e) =>
            setPublishForm({ ...publishForm, title: e.target.value })
          }
        />
        <textarea
          placeholder="介绍"
          value={publishForm.description}
          onChange={(e) =>
            setPublishForm({ ...publishForm, description: e.target.value })
          }
        />
        <div className="row">
          <input
            type="number"
            placeholder="价格"
            value={publishForm.price}
            onChange={(e) =>
              setPublishForm({
                ...publishForm,
                price: Number(e.target.value),
              })
            }
          />
          <input
            placeholder="交易地点/校区"
            value={publishForm.campus}
            onChange={(e) =>
              setPublishForm({ ...publishForm, campus: e.target.value })
            }
          />
        </div>
        <select
          value={publishForm.category}
          onChange={(e) =>
            setPublishForm({
              ...publishForm,
              category: e.target.value as Category,
            })
          }
        >
          <option value="daily">日用</option>
          <option value="digital">数码</option>
          <option value="book">书籍</option>
          <option value="ticket">票券</option>
          <option value="other">其他</option>
        </select>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onPublishImagesSelected(e.target.files)}
        />
        <div className="muted">已选择图片：{publishForm.images.length} 张（最多6张）</div>
        <div className="row">
          <button className="small ghost" onClick={pickCurrentLocation}>
            使用当前位置
          </button>
          <select
            value={manualLocationLabel}
            onChange={(e) => setManualLocationLabel(e.target.value)}
          >
            <option value="">选择高校/城市定位</option>
            {presetLocations.map((loc) => (
              <option key={loc.label} value={loc.label}>
                {loc.label}
              </option>
            ))}
          </select>
          <button className="small ghost" onClick={applyManualLocation} disabled={!manualLocationLabel}>
            使用选中定位
          </button>
          <span className="muted">
            {publishForm.latitude && publishForm.longitude
              ? `已定位(${publishForm.latitude.toFixed(4)}, ${publishForm.longitude.toFixed(4)})`
              : "未定位"}
          </span>
        </div>
        {publishForm.category === "digital" && (
          <div className="row">
            <input
              placeholder="品牌（必填）"
              value={publishForm.brand}
              onChange={(e) =>
                setPublishForm({ ...publishForm, brand: e.target.value })
              }
            />
            <input
              placeholder="型号（必填）"
              value={publishForm.model}
              onChange={(e) =>
                setPublishForm({ ...publishForm, model: e.target.value })
              }
            />
            <input
              placeholder="内存容量（必填）"
              value={publishForm.memory}
              onChange={(e) =>
                setPublishForm({ ...publishForm, memory: e.target.value })
              }
            />
          </div>
        )}
        <button onClick={publish}>提交审核</button>
      </section>
      <section className="card">
        <h3>我的商品</h3>
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>价格</th>
              <th>状态</th>
              <th>拒绝原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {myProducts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>¥{p.price}</td>
                <td>{p.status}</td>
                <td>{p.rejectionReason || "-"}</td>
                <td>
                  {p.status === "approved" && (
                    <button
                      className="small danger"
                      onClick={() => markAsSold(p)}
                    >
                      标记已售
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="card">
        <h3>交易历史</h3>
        <div style={{ marginBottom: 12 }}>
          <button
            className={historyTab === "sales" ? "small" : "small ghost"}
            onClick={() => setHistoryTab("sales")}
          >
            我卖出的({mySales.length})
          </button>
          <button
            className={historyTab === "purchases" ? "small" : "small ghost"}
            onClick={() => setHistoryTab("purchases")}
          >
            我买的({myPurchases.length})
          </button>
        </div>
        {historyTab === "sales" && mySales.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>商品名称</th>
                <th>买家</th>
                <th>价格</th>
                <th>成交时间</th>
              </tr>
            </thead>
            <tbody>
              {mySales.map((o) => (
                <tr key={o.id}>
                  <td>{o.productTitle}</td>
                  <td>{o.buyerName}</td>
                  <td>¥{o.price}</td>
                  <td>{new Date(o.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {historyTab === "purchases" && myPurchases.length > 0 && (
          <table style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>商品名称</th>
                <th>卖家</th>
                <th>价格</th>
                <th>购买时间</th>
              </tr>
            </thead>
            <tbody>
              {myPurchases.map((o) => (
                <tr key={o.id}>
                  <td>{o.productTitle}</td>
                  <td>{o.sellerName}</td>
                  <td>¥{o.price}</td>
                  <td>{new Date(o.createdAt).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {historyTab === "sales" && mySales.length === 0 && (
          <p className="muted">暂无卖出记录</p>
        )}
        {historyTab === "purchases" && myPurchases.length === 0 && (
          <p className="muted">暂无交易记录</p>
        )}
      </section>
    </>
  );
}

export function CartTab(props: {
  cartProducts: Product[];
  removeFromCart: (id: string) => void;
  loadDetail: (id: string) => void;
  buyNow: (product: Product) => void;
}) {
  const { cartProducts, removeFromCart, loadDetail, buyNow } = props;
  return (
    <section className="card">
      <h3>购物车</h3>
      {cartProducts.length === 0 ? (
        <p className="muted">购物车为空，去商品展示页添加感兴趣的商品吧。</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>商品</th>
              <th>价格</th>
              <th>卖家</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {cartProducts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>¥{p.price}</td>
                <td>{p.sellerName}</td>
                <td>{p.status}</td>
                <td>
                  <button className="small" onClick={() => loadDetail(p.id)}>详情</button>
                  <button className="small ghost" onClick={() => removeFromCart(p.id)}>移除</button>
                  <button className="small" onClick={() => buyNow(p)} disabled={p.status !== "approved"}>
                    直接交易
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export function ManageTab(props: {
  adminStats: { pending: number; approved: number; rejected: number; offline: number; sold: number };
  adminProductTab: Status | "all";
  setAdminProductTab: (value: Status | "all") => void;
  allProducts: Product[];
  adminFilteredProducts: Product[];
  audit: (id: string, action: "approve" | "reject") => void;
  toggleStatus: (id: string, status: "approved" | "offline") => void;
}) {
  const {
    adminStats,
    adminProductTab,
    setAdminProductTab,
    allProducts,
    adminFilteredProducts,
    audit,
    toggleStatus,
  } = props;
  return (
    <>
      <section className="stats">
        <div className="stat">待审核 <b>{adminStats.pending}</b></div>
        <div className="stat">已通过 <b>{adminStats.approved}</b></div>
        <div className="stat">已拒绝 <b>{adminStats.rejected}</b></div>
        <div className="stat">已下线 <b>{adminStats.offline}</b></div>
        <div className="stat">已售出 <b>{adminStats.sold}</b></div>
      </section>
      <section className="card">
        <h3>审核管理</h3>
        <div className="row wrap" style={{ marginBottom: 12 }}>
          <button className={adminProductTab === "all" ? "small" : "small ghost"} onClick={() => setAdminProductTab("all")}>全部({allProducts.length})</button>
          <button className={adminProductTab === "pending" ? "small" : "small ghost"} onClick={() => setAdminProductTab("pending")}>待审核({adminStats.pending})</button>
          <button className={adminProductTab === "approved" ? "small" : "small ghost"} onClick={() => setAdminProductTab("approved")}>已通过({adminStats.approved})</button>
          <button className={adminProductTab === "rejected" ? "small" : "small ghost"} onClick={() => setAdminProductTab("rejected")}>已拒绝({adminStats.rejected})</button>
          <button className={adminProductTab === "offline" ? "small" : "small ghost"} onClick={() => setAdminProductTab("offline")}>已下线({adminStats.offline})</button>
          <button className={adminProductTab === "sold" ? "small" : "small ghost"} onClick={() => setAdminProductTab("sold")}>已售出({adminStats.sold})</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>标题</th>
              <th>分类</th>
              <th>价格</th>
              <th>状态</th>
              <th>拒绝原因</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {adminFilteredProducts.map((p) => (
              <tr key={p.id}>
                <td>{p.title}</td>
                <td>{p.category}</td>
                <td>¥{p.price}</td>
                <td>{p.status}</td>
                <td>{p.rejectionReason || "-"}</td>
                <td>
                  {p.status === "pending" && (
                    <>
                      <button className="small" onClick={() => audit(p.id, "approve")}>通过</button>
                      <button className="small danger" onClick={() => audit(p.id, "reject")}>拒绝</button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <button className="small danger" onClick={() => toggleStatus(p.id, "offline")}>下线</button>
                  )}
                  {p.status === "offline" && (
                    <button className="small" onClick={() => toggleStatus(p.id, "approved")}>恢复</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}

export function AccountsTab(props: {
  allUsers: User[];
  user: User;
  loadAccountDetail: (id: string) => void;
  reviewAdminUser: (id: string, action: "approve" | "reject") => void;
  deleteUser: (id: string, username: string) => void;
}) {
  const { allUsers, user, loadAccountDetail, reviewAdminUser, deleteUser } = props;
  return (
    <section className="card">
      <h3>账号管理（管理员注册审核）</h3>
      <table>
        <thead>
          <tr>
            <th>用户名</th>
            <th>角色</th>
            <th>状态</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {allUsers.map((u) => (
            <tr key={u.id}>
              <td>{u.username}</td>
              <td>{u.role}</td>
              <td>{u.status || "active"}</td>
              <td>{u.reviewNote || "-"}</td>
              <td>
                <button className="small ghost" onClick={() => loadAccountDetail(u.id)}>
                  详情/编辑
                </button>
                {u.role === "admin" && u.status === "pending_review" && (
                  <>
                    <button className="small" onClick={() => reviewAdminUser(u.id, "approve")}>通过</button>
                    <button className="small danger" onClick={() => reviewAdminUser(u.id, "reject")}>拒绝</button>
                  </>
                )}
                {u.id !== user.id && u.id !== "u-admin" && (
                  <button className="small danger" onClick={() => deleteUser(u.id, u.username)}>
                    删除账号
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function MessagesTab(props: {
  conversations: Conversation[];
  lastSeenMessageTime: string;
  openChat: (target: Conversation) => void;
}) {
  const { conversations, lastSeenMessageTime, openChat } = props;
  return (
    <section className="card">
      <h3>消息列表</h3>
      {conversations.length === 0 ? (
        <p className="muted">暂无消息会话</p>
      ) : (
        conversations.map((conv) => (
          <div key={conv.userId} className="conv-item" onClick={() => openChat(conv)}>
            <div className="row">
              <b>{conv.username}</b>
              {conv.lastTime > lastSeenMessageTime && <span className="badge">新</span>}
            </div>
            <p className="muted">{conv.lastMessage}</p>
            <span className="muted">{new Date(conv.lastTime).toLocaleString("zh-CN")}</span>
          </div>
        ))
      )}
    </section>
  );
}
