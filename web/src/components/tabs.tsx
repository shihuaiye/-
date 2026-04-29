import { useMemo, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import type {
  Category,
  Conversation,
  Order,
  Product,
  ProductMessage,
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
  sortBy: "default" | "distance" | "price-asc" | "price-desc" | "time";
  setSortBy: (
    v: "default" | "distance" | "price-asc" | "price-desc" | "time",
  ) => void;
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
      {/* 宣传语部分 */}
      <section className="hero-section">
        <div className="hero-content">
          <h2>珞珈优选</h2>
          <p>校园二手交易平台，让闲置物品焕发新生</p>
          <div className="hero-features">
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <span>海量商品</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <span>物美价廉</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🚀</span>
              <span>快速交易</span>
            </div>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://via.placeholder.com/400x300/FF5F6D/FFFFFF?text=珞珈优选"
            alt="珞珈优选"
          />
        </div>
      </section>

      <section className="card">
        <div className="market-actions">
          <div>
            <h3>商品广场</h3>
            <p className="muted">按关键词、分类或距离筛选你感兴趣的商品</p>
          </div>
          <div className="search-row">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                className="search"
                placeholder="搜索感兴趣的商品..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
              <button
                type="button"
                className="search-btn"
                onClick={() => setPage(() => 1)}
              >
                搜索
              </button>
            </div>
            <div className="filter-group">
              <select
                className="category"
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as Category | "all")
                }
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
                onChange={(e) =>
                  setSortBy(
                    e.target.value as
                      | "default"
                      | "distance"
                      | "price-desc"
                      | "price-asc"
                      | "time",
                  )
                }
              >
                <option value="distance">距离最近</option>
                <option value="time">最新发布</option>
                <option value="price-desc">价格由高到低</option>
                <option value="price-asc">价格由低到高</option>
              </select>
              <button className="small ghost" onClick={pickCurrentLocation}>
                {userLocation ? "已定位" : "获取定位"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid market-grid">
        {pagedMarket.map((p) => (
          <article key={p.id} className="product-card product-card-horizontal">
            <div className="product-media">
              <img src={p.images?.[0]} alt={p.title} className="thumb" />
            </div>
            <div className="product-body">
              <div className="product-title-row">
                <h4>{p.title}</h4>
                <button
                  className={
                    favorites.includes(p.id) ? "small fav active" : "small fav"
                  }
                  onClick={() => toggleFavorite(p.id)}
                >
                  {favorites.includes(p.id) ? "已收藏" : "收藏"}
                </button>
              </div>
              <p className="muted product-description">
                {p.description.slice(0, 100)}...
              </p>
              <div className="product-meta-row">
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
              <div className="meta">卖家：{p.sellerName}</div>
              <div className="product-actions-row">
                <button className="small" onClick={() => loadDetail(p.id)}>
                  详情
                </button>
                <button
                  className={
                    favorites.includes(p.id) ? "small fav active" : "small fav"
                  }
                  onClick={() => toggleFavorite(p.id)}
                >
                  {favorites.includes(p.id) ? "已收藏" : "收藏"}
                </button>
              </div>
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
                <button
                  className="small ghost"
                  onClick={() => toggleFavorite(p.id)}
                >
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
        <div className="muted">
          已选择图片：{publishForm.images.length} 张（最多6张）
        </div>
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
          <button
            className="small ghost"
            onClick={applyManualLocation}
            disabled={!manualLocationLabel}
          >
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

export function PostPublishTab(props: {
  publishForm: PublishForm;
  setPublishForm: (value: PublishForm) => void;
  onPublishImagesSelected: (files: FileList | null) => void;
  publish: () => void;
  presetLocations: PresetLocation[];
}) {
  const {
    publishForm,
    setPublishForm,
    onPublishImagesSelected,
    publish,
    presetLocations,
  } = props;

  const removeImageAt = (idx: number) => {
    setPublishForm({
      ...publishForm,
      images: publishForm.images.filter((_, i) => i !== idx),
    });
  };

  const categoryLabel: Record<Category, string> = {
    digital: "电子产品",
    book: "图书资料",
    daily: "生活用品",
    ticket: "票券",
    other: "其他",
  };

  return (
    <section className="publish-section">
      <div className="publish-card">
        <div className="publish-intro">
          <h2 className="publish-title">分享你的闲置好物</h2>
          <p className="publish-subtitle">
            清晰的图片和详细的描述能更快帮你找到买家哦！
          </p>
        </div>

        <form className="publish-form" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="field-label">上传图片（最多6张）</label>
            <div className="publish-image-grid">
              <input
                id="publish-images"
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => onPublishImagesSelected(e.target.files)}
              />

              {Array.from({ length: 6 }).map((_, i) => {
                const img = publishForm.images[i];
                if (img) {
                  return (
                    <div key={i} className="publish-image-slot filled">
                      <img
                        src={img}
                        alt={`预览${i + 1}`}
                        className="publish-image"
                      />
                      <button
                        type="button"
                        className="publish-image-remove"
                        onClick={() => removeImageAt(i)}
                      >
                        ×
                      </button>
                    </div>
                  );
                }

                return (
                  <label
                    key={i}
                    htmlFor="publish-images"
                    className="publish-image-slot empty"
                  >
                    <div className="publish-image-placeholder">点击上传</div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="publish-basic-grid">
            <div className="publish-span-2">
              <label className="field-label">商品名称</label>
              <input
                className="field-input"
                placeholder="例如：九成新考研数学全家桶"
                value={publishForm.title}
                onChange={(e) =>
                  setPublishForm({ ...publishForm, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="field-label">期望售价（¥）</label>
              <input
                className="field-input"
                type="number"
                placeholder="0.00"
                value={publishForm.price}
                onChange={(e) =>
                  setPublishForm({
                    ...publishForm,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="field-label">所属分类</label>
              <select
                className="field-input"
                value={publishForm.category}
                onChange={(e) =>
                  setPublishForm({
                    ...publishForm,
                    category: e.target.value as Category,
                  })
                }
              >
                {Object.keys(categoryLabel).map((k) => (
                  <option key={k} value={k}>
                    {categoryLabel[k as Category]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="field-label">详细描述</label>
            <textarea
              className="field-input publish-textarea"
              placeholder="请描述商品的成色、购买渠道、使用情况等，自提地点也请标注..."
              value={publishForm.description}
              onChange={(e) =>
                setPublishForm({ ...publishForm, description: e.target.value })
              }
            />
          </div>

          <div className="publish-location">
            <label className="field-label publish-location-title">
              学校选择
            </label>

            <div className="publish-chip-grid">
              {presetLocations.map((loc) => (
                <button
                  key={loc.label}
                  type="button"
                  className={
                    publishForm.school === loc.label ? "chip active" : "chip"
                  }
                  onClick={() =>
                    setPublishForm({ ...publishForm, school: loc.label })
                  }
                >
                  {loc.campus}
                </button>
              ))}
            </div>

            <div className="publish-location-actions">
              <input
                className="field-input"
                placeholder="填写具体校区 / 学部"
                value={publishForm.schoolDetail}
                onChange={(e) =>
                  setPublishForm({
                    ...publishForm,
                    schoolDetail: e.target.value,
                  })
                }
              />
            </div>
          </div>

          {publishForm.category === "digital" && (
            <div className="publish-digital-grid">
              <div>
                <label className="field-label">品牌（必填）</label>
                <input
                  className="field-input"
                  value={publishForm.brand}
                  placeholder="例如：Apple / 索尼 / 罗技"
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, brand: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="field-label">型号（必填）</label>
                <input
                  className="field-input"
                  value={publishForm.model}
                  placeholder="例如：Air 5 / G304 / WH-1000XM... "
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, model: e.target.value })
                  }
                />
              </div>
              <div className="publish-span-2">
                <label className="field-label">内存容量（必填）</label>
                <input
                  className="field-input"
                  value={publishForm.memory}
                  placeholder="例如：256G / 8G / 512GB..."
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, memory: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <div className="publish-submit-wrap">
            <button className="publish-submit" type="button" onClick={publish}>
              提交审核并发布
            </button>
          </div>
          <p className="publish-agree">
            发布即代表您同意《珞珈优选校园二手交易平台协议》
          </p>
        </form>
      </div>
    </section>
  );
}

export function PostProfileTab(props: {
  user: User;
  myProducts: Product[];
  markAsSold: (product: Product) => void;
  loadDetail: (id: string) => void;
  mySales: Order[];
  myPurchases: Order[];
}) {
  const { user, myProducts, markAsSold, loadDetail, mySales, myPurchases } =
    props;
  const [profileTab, setProfileTab] = useState<"published" | "orders">(
    "published",
  );

  const orders = useMemo(() => {
    const list = [...mySales, ...myPurchases];
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [mySales, myPurchases]);

  const statusBadge = (p: Product) => {
    switch (p.status) {
      case "approved":
        return { text: "售卖中", kind: "green" };
      case "offline":
        return { text: "已下线", kind: "slate" };
      case "pending":
        return { text: "待审核", kind: "blue" };
      case "rejected":
        return { text: "已拒绝", kind: "red" };
      case "sold":
        return { text: "已售出", kind: "gray" };
      default:
        return { text: p.status, kind: "slate" };
    }
  };

  const avatarText = user.username?.slice(0, 1).toUpperCase() || "U";
  const verifiedText = user.status === "active" ? "已认证学生" : "待审核";

  return (
    <section className="profile-section">
      <div className="profile-header-card">
        <div className="profile-bg-blob" />
        <div className="profile-avatar">{avatarText}</div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h2 className="profile-name">{user.username}</h2>
            <span className="profile-badge">{verifiedText}</span>
          </div>
          <div className="profile-detail-row">
            <div className="profile-detail-pill">诚信分：98</div>
            <div className="profile-detail-pill">
              {user.role === "admin"
                ? "管理员"
                : user.school || "武汉大学·信息学部"}
            </div>
          </div>
        </div>

        <div className="profile-stats">
          <div className="profile-stat">
            <div className="profile-stat-num">{myProducts.length}</div>
            <div className="profile-stat-label">已发布</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-num">
              {mySales.length + myPurchases.length}
            </div>
            <div className="profile-stat-label">成交订单</div>
          </div>
          <div className="profile-stat">
            <div className="profile-stat-num">0</div>
            <div className="profile-stat-label">被点赞</div>
          </div>
        </div>
      </div>

      <div className="tabs-row tabs-row-large">
        <button
          className={profileTab === "published" ? "tab-btn active" : "tab-btn"}
          onClick={() => setProfileTab("published")}
        >
          我发布的商品
        </button>
        <button
          className={profileTab === "orders" ? "tab-btn active" : "tab-btn"}
          onClick={() => setProfileTab("orders")}
        >
          订单列表
        </button>
      </div>

      {profileTab === "published" && (
        <div className="grid profile-grid">
          {myProducts.length === 0 ? (
            <p className="muted">暂无发布商品。</p>
          ) : (
            myProducts.map((p) => {
              const badge = statusBadge(p);
              return (
                <article key={p.id} className="profile-product-card">
                  <span className={`status-badge ${badge.kind}`}>
                    {badge.text}
                  </span>
                  <img
                    src={p.images?.[0]}
                    alt={p.title}
                    className="profile-product-thumb"
                  />
                  <h4 className="profile-product-title">{p.title}</h4>
                  <div className="profile-product-price-row">
                    <span className="profile-product-price">¥{p.price}</span>
                    <span className="muted">{p.campus}</span>
                  </div>
                  <div className="profile-product-actions">
                    <button className="small" onClick={() => loadDetail(p.id)}>
                      查看详情
                    </button>
                    {p.status === "approved" ? (
                      <button
                        className="small danger"
                        onClick={() => markAsSold(p)}
                      >
                        标记已售
                      </button>
                    ) : (
                      <button className="small ghost" disabled>
                        -
                      </button>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      {profileTab === "orders" && (
        <div className="orders-list">
          {orders.length === 0 ? (
            <p className="muted">暂无订单记录。</p>
          ) : (
            orders.map((o) => {
              const isSale = o.sellerId === user.id;
              const counterpart = isSale ? o.buyerName : o.sellerName;
              return (
                <div key={o.id} className="order-card">
                  <div className="order-icon" />
                  <div className="order-main">
                    <div className="order-top-row">
                      <span className="order-id">订单号：{o.id}</span>
                      <span className="order-status">交易完成</span>
                    </div>
                    <div className="order-title">{o.productTitle}</div>
                    <div className="order-meta">
                      {isSale ? "买家" : "卖家"}：{counterpart} ·{" "}
                      {new Date(o.createdAt).toLocaleString("zh-CN")}
                    </div>
                  </div>
                  <div className="order-side">
                    <div className="order-price">¥{o.price.toFixed(2)}</div>
                    <button
                      className="small"
                      onClick={() => loadDetail(o.productId)}
                    >
                      查看详情
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}

export function CartTab(props: {
  favoriteProducts: Product[];
  toggleFavorite: (id: string) => void;
  loadDetail: (id: string) => void;
  buyNow: (product: Product) => void;
}) {
  const { favoriteProducts, toggleFavorite, loadDetail, buyNow } = props;
  const [searchText, setSearchText] = useState("");

  const filteredFavorites = favoriteProducts.filter((p) =>
    `${p.title}${p.description}${p.campus}`
      .toLowerCase()
      .includes(searchText.toLowerCase()),
  );

  return (
    <section className="card page-card">
      <div className="cart-header-row">
        <div>
          <h3>我的收藏</h3>
          <p className="muted">在这里管理你已收藏的心仪商品。</p>
        </div>
        <div className="search-box compact">
          <input
            placeholder="搜索我的收藏"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <button
            type="button"
            className="search-btn"
            onClick={() => setSearchText(searchText)}
          >
            搜索
          </button>
        </div>
      </div>
      {filteredFavorites.length === 0 ? (
        <p className="muted">暂无收藏商品，去商品广场添加感兴趣的商品吧。</p>
      ) : (
        <div className="grid market-grid">
          {filteredFavorites.map((p) => (
            <article
              key={p.id}
              className="product-card product-card-horizontal"
            >
              <div className="product-media">
                <img src={p.images?.[0]} alt={p.title} className="thumb" />
              </div>
              <div className="product-body">
                <div className="product-title-row">
                  <h4>{p.title}</h4>
                  <button
                    className="small fav danger"
                    onClick={() => toggleFavorite(p.id)}
                  >
                    移除
                  </button>
                </div>
                <p className="muted product-description">
                  {p.description.slice(0, 96)}...
                </p>
                <div className="product-meta-row">
                  <strong>¥{p.price}</strong>
                  <span>{p.campus}</span>
                </div>
                <div className="product-action-grid">
                  <button
                    className="small action-btn"
                    onClick={() => loadDetail(p.id)}
                  >
                    查看详情
                  </button>
                  <button
                    className="small action-btn"
                    onClick={() => buyNow(p)}
                  >
                    购买
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export function ManageTab(props: {
  adminStats: {
    pending: number;
    approved: number;
    rejected: number;
    offline: number;
    sold: number;
  };
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
        <div className="stat">
          待审核 <b>{adminStats.pending}</b>
        </div>
        <div className="stat">
          已通过 <b>{adminStats.approved}</b>
        </div>
        <div className="stat">
          已拒绝 <b>{adminStats.rejected}</b>
        </div>
        <div className="stat">
          已下线 <b>{adminStats.offline}</b>
        </div>
        <div className="stat">
          已售出 <b>{adminStats.sold}</b>
        </div>
      </section>
      <section className="card">
        <h3>审核管理</h3>
        <div className="row wrap" style={{ marginBottom: 12 }}>
          <button
            className={adminProductTab === "all" ? "small" : "small ghost"}
            onClick={() => setAdminProductTab("all")}
          >
            全部({allProducts.length})
          </button>
          <button
            className={adminProductTab === "pending" ? "small" : "small ghost"}
            onClick={() => setAdminProductTab("pending")}
          >
            待审核({adminStats.pending})
          </button>
          <button
            className={adminProductTab === "approved" ? "small" : "small ghost"}
            onClick={() => setAdminProductTab("approved")}
          >
            已通过({adminStats.approved})
          </button>
          <button
            className={adminProductTab === "rejected" ? "small" : "small ghost"}
            onClick={() => setAdminProductTab("rejected")}
          >
            已拒绝({adminStats.rejected})
          </button>
          <button
            className={adminProductTab === "offline" ? "small" : "small ghost"}
            onClick={() => setAdminProductTab("offline")}
          >
            已下线({adminStats.offline})
          </button>
          <button
            className={adminProductTab === "sold" ? "small" : "small ghost"}
            onClick={() => setAdminProductTab("sold")}
          >
            已售出({adminStats.sold})
          </button>
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
                      <button
                        className="small"
                        onClick={() => audit(p.id, "approve")}
                      >
                        通过
                      </button>
                      <button
                        className="small danger"
                        onClick={() => audit(p.id, "reject")}
                      >
                        拒绝
                      </button>
                    </>
                  )}
                  {p.status === "approved" && (
                    <button
                      className="small danger"
                      onClick={() => toggleStatus(p.id, "offline")}
                    >
                      下线
                    </button>
                  )}
                  {p.status === "offline" && (
                    <button
                      className="small"
                      onClick={() => toggleStatus(p.id, "approved")}
                    >
                      恢复
                    </button>
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
  const { allUsers, user, loadAccountDetail, reviewAdminUser, deleteUser } =
    props;
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
                <button
                  className="small ghost"
                  onClick={() => loadAccountDetail(u.id)}
                >
                  详情/编辑
                </button>
                {u.role === "admin" && u.status === "pending_review" && (
                  <>
                    <button
                      className="small"
                      onClick={() => reviewAdminUser(u.id, "approve")}
                    >
                      通过
                    </button>
                    <button
                      className="small danger"
                      onClick={() => reviewAdminUser(u.id, "reject")}
                    >
                      拒绝
                    </button>
                  </>
                )}
                {u.id !== user.id && u.id !== "u-admin" && (
                  <button
                    className="small danger"
                    onClick={() => deleteUser(u.id, u.username)}
                  >
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
  chatTarget: Conversation | null;
  relatedProduct: Product | null;
  chatMessages: ProductMessage[];
  user: User;
  chatInput: string;
  setChatInput: (value: string) => void;
  setChatImageFile: (value: File | null) => void;
  sendChatMessage: () => void;
  buyNow: (product: Product) => void;
}) {
  const {
    conversations,
    lastSeenMessageTime,
    openChat,
    chatTarget,
    relatedProduct,
    chatMessages,
    user,
    chatInput,
    setChatInput,
    setChatImageFile,
    sendChatMessage,
    buyNow,
  } = props;

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  return (
    <section className="messages-layout">
      <div className="messages-sidebar">
        <div className="messages-sidebar-header">
          <h3>最近消息</h3>
          <button className="icon-btn ghost" type="button">
            筛选
          </button>
        </div>

        <div className="messages-conv-list">
          {conversations.length === 0 ? (
            <div className="chat-empty">
              <p className="muted">暂无消息会话</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.userId}
                className={
                  conv.userId === chatTarget?.userId
                    ? "conv-item active"
                    : "conv-item"
                }
                onClick={() => openChat(conv)}
              >
                <div className="row">
                  <b>{conv.username}</b>
                  {conv.lastTime > lastSeenMessageTime && (
                    <span className="badge">新</span>
                  )}
                </div>
                <p className="muted">{conv.lastMessage}</p>
                <span className="muted">
                  {new Date(conv.lastTime).toLocaleString("zh-CN")}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="messages-chat">
        {chatTarget ? (
          <>
            <header className="messages-chat-header">
              <div>
                <div className="messages-chat-name">{chatTarget.username}</div>
                <div className="messages-chat-tag">
                  {user.role === "admin" ? "管理员" : "普通用户"}
                </div>
              </div>
              <div className="messages-chat-actions">
                {/* 移除电话和更多按钮 */}
              </div>
            </header>

            {relatedProduct && (
              <div className="messages-related-product">
                <img
                  src={relatedProduct.images?.[0]}
                  alt={relatedProduct.title}
                />
                <div className="messages-related-product-main">
                  <b>{relatedProduct.title}</b>
                  <span>¥{relatedProduct.price}</span>
                </div>
                <button
                  className="small"
                  type="button"
                  onClick={() => buyNow(relatedProduct)}
                  disabled={relatedProduct.status !== "approved"}
                  title={
                    relatedProduct.status !== "approved"
                      ? "商品当前不可购买"
                      : "立即购买"
                  }
                >
                  立即购买
                </button>
              </div>
            )}

            <div className="messages-chat-body" id="chat-messages-container">
              {chatMessages.length === 0 ? (
                <div className="chat-empty">
                  <p className="muted">暂无消息，开始对话吧！</p>
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-bubble ${m.fromUserId === user.id ? "mine" : "other"}`}
                  >
                    <b>{m.fromUsername}</b>
                    {m.content.includes("[图片:") ? (
                      <div className="message-content">
                        {m.content
                          .split("\n")
                          .map((line, i) =>
                            line.startsWith("[图片:") ? (
                              <img
                                key={i}
                                src={line
                                  .replace("[图片:", "")
                                  .replace("]", "")
                                  .trim()}
                                alt="图片消息"
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
                    <span className="muted">
                      {new Date(m.createdAt).toLocaleTimeString("zh-CN")}
                    </span>
                  </div>
                ))
              )}
            </div>

            <footer className="messages-chat-input">
              <div className="messages-input-icons">
                <button
                  className="icon-btn ghost"
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  表情
                </button>
                <button
                  className="icon-btn ghost"
                  type="button"
                  onClick={() =>
                    document.getElementById("chat-image-input")?.click()
                  }
                >
                  图片
                </button>
                {/* 移除文件按钮 */}
              </div>

              <textarea
                className="messages-textarea"
                placeholder="在这里输入消息..."
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

              {showEmojiPicker && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "100%",
                    right: "0",
                    zIndex: 1000,
                  }}
                >
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      setChatInput((prev) => prev + emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                    theme="light"
                    skinTonesDisabled
                    searchDisabled
                    previewConfig={{ showPreview: false }}
                  />
                </div>
              )}

              <div className="messages-input-bottom">
                <input
                  id="chat-image-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setChatImageFile(e.target.files?.[0] || null)
                  }
                  className="messages-file-input"
                  style={{ display: "none" }}
                />
                <button
                  className="send-btn"
                  type="button"
                  onClick={sendChatMessage}
                  disabled={!chatTarget}
                >
                  发送
                </button>
              </div>
            </footer>
          </>
        ) : (
          <div className="messages-chat-empty">
            <div className="chat-empty">
              <p className="muted">请选择左侧的会话开始聊天。</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
