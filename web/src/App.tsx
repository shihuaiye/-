import { useEffect, useMemo, useState } from "react";

type Role = "admin" | "user";
type Status = "pending" | "approved" | "rejected" | "offline";
type Category = "digital" | "book" | "daily" | "ticket" | "other";
type Tab = "market" | "favorites" | "mine" | "manage" | "accounts";

type User = {
  id: string;
  username: string;
  role: Role;
  status?: "active" | "pending_review" | "rejected";
  reviewNote?: string;
};

type Product = {
  id: string;
  title: string;
  description: string;
  price: number;
  category: Category;
  images: string[];
  campus: string;
  brand?: string;
  model?: string;
  memory?: string;
  status: Status;
  rejectionReason?: string;
  sellerName: string;
  createdAt: string;
};

type ProductMessage = {
  id: string;
  productId: string;
  fromUserId: string;
  fromUsername: string;
  toUserId?: string;
  toUsername?: string;
  content: string;
  createdAt: string;
};

type Conversation = {
  userId: string;
  username: string;
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  productId?: string;
};

type Order = {
  id: string;
  productId: string;
  productTitle: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  status: "completed";
  createdAt: string;
};

const API = "http://localhost:3100/api";
const PAGE_SIZE = 6;

const passwordStrength = (pwd: string) => {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { label: "弱", color: "#dc2626", pass: false };
  if (score <= 2) return { label: "中", color: "#f59e0b", pass: true };
  return { label: "强", color: "#16a34a", pass: true };
};

export function App() {
  const [token, setToken] = useState(localStorage.getItem("sh-token") || "");
  const [user, setUser] = useState<User | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [marketProducts, setMarketProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("market");
  const [adminProductTab, setAdminProductTab] = useState<Status | "all">("all");
  const [detail, setDetail] = useState<Product | null>(null);
  const [messages, setMessages] = useState<ProductMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [showRegister, setShowRegister] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(
    JSON.parse(localStorage.getItem("sh-favorites") || "[]")
  );

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc" | "time">("default");
  const [page, setPage] = useState(1);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatTarget, setChatTarget] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ProductMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [myPurchases, setMyPurchases] = useState<Order[]>([]);
  const [mySales, setMySales] = useState<Order[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    password: "",
    role: "user" as Role,
  });
  const [publishForm, setPublishForm] = useState({
    title: "",
    description: "",
    price: 0,
    category: "daily" as Category,
    imagesText: "",
    campus: "",
    brand: "",
    model: "",
    memory: "",
  });

  const authHeaders = (): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};

  const fetchMe = async () => {
    if (!token) return;
    const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
    const json = await res.json();
    if (!json.success) return;
    setUser(json.data);
  };

  const login = async () => {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginForm),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    setToken(json.data.token);
    setUser(json.data.user);
    localStorage.setItem("sh-token", json.data.token);
    localStorage.setItem("sh-username", loginForm.username);
    localStorage.setItem("sh-password", loginForm.password);
  };

  const register = async () => {
    const strength = passwordStrength(regForm.password);
    if (!strength.pass) return alert("密码强度过弱，请至少满足8位并包含数字/字母组合");
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(regForm),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    alert(json.message || "注册成功，请登录");
    setShowRegister(false);
    setRegForm({ username: "", password: "", role: "user" });
  };

  const loadAllForAdmin = async () => {
    const res = await fetch(`${API}/products?mode=all`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) setAllProducts(json.data);
  };

  const loadMarket = async () => {
    const res = await fetch(`${API}/products`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) setMarketProducts(json.data);
  };

  const loadMine = async () => {
    const res = await fetch(`${API}/products?mode=mine`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) setMyProducts(json.data);
  };

  const loadUsers = async () => {
    if (user?.role !== "admin") return;
    const res = await fetch(`${API}/admin/users`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) setAllUsers(json.data);
  };

  const loadDetail = async (id: string) => {
    const res = await fetch(`${API}/products/${id}`, { headers: authHeaders() });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    setDetail(json.data);
    const msgRes = await fetch(`${API}/products/${id}/messages`, {
      headers: authHeaders(),
    });
    const msgJson = await msgRes.json();
    if (msgJson.success) setMessages(msgJson.data);
  };

  const sendMessage = async () => {
    if (!detail) return;
    const content = messageInput.trim();
    if (!content) return;
    const res = await fetch(`${API}/products/${detail.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    setMessageInput("");
    await loadDetail(detail.id);
  };

  const publish = async () => {
    const images = publishForm.imagesText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    const payload = {
      title: publishForm.title,
      description: publishForm.description,
      price: Number(publishForm.price),
      category: publishForm.category,
      images,
      campus: publishForm.campus,
      brand: publishForm.brand || undefined,
      model: publishForm.model || undefined,
      memory: publishForm.memory || undefined,
    };
    const res = await fetch(`${API}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    alert("发布成功，等待审核");
    setPublishForm({
      title: "",
      description: "",
      price: 0,
      category: "daily",
      imagesText: "",
      campus: "",
      brand: "",
      model: "",
      memory: "",
    });
    await Promise.all([loadMine(), loadMarket(), loadAllForAdmin()]);
  };

  const audit = async (id: string, action: "approve" | "reject") => {
    const reason = action === "reject" ? prompt("请输入拒绝理由") || "" : "";
    const res = await fetch(`${API}/products/${id}/audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action, reason }),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    await Promise.all([loadAllForAdmin(), loadMarket()]);
  };

  const toggleStatus = async (id: string, status: "approved" | "offline") => {
    const res = await fetch(`${API}/products/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    await Promise.all([loadAllForAdmin(), loadMarket()]);
  };

  const reviewAdminUser = async (id: string, action: "approve" | "reject") => {
    const note =
      prompt(action === "approve" ? "审核备注（可选）" : "拒绝理由（建议填写）") || "";
    const res = await fetch(`${API}/admin/users/${id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ action, note }),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    await loadUsers();
  };

  const toggleFavorite = (id: string) => {
    const next = favorites.includes(id)
      ? favorites.filter((x) => x !== id)
      : [...favorites, id];
    setFavorites(next);
    localStorage.setItem("sh-favorites", JSON.stringify(next));
  };

  const loadConversations = async () => {
    if (!token || !user) return;
    const res = await fetch(`${API}/conversations`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) setConversations(json.data);
  };

  const openChat = async (target: Conversation) => {
    setChatTarget(target);
    const res = await fetch(`${API}/conversations/${target.userId}`, {
      headers: authHeaders(),
    });
    const json = await res.json();
    if (json.success) setChatMessages(json.data);
  };

  const sendChatMessage = async () => {
    if (!chatTarget) return;
    const content = chatInput.trim();
    if (!content) return;
    const res = await fetch(`${API}/conversations/${chatTarget.userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ content }),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    setChatInput("");
    await openChat(chatTarget);
  };

  const contactSeller = async () => {
    if (!detail || !user) return;
    const targetConv: Conversation = {
      userId: detail.sellerId === user.id ? "" : detail.sellerId,
      username: detail.sellerName,
      lastMessage: "",
      lastTime: new Date().toISOString(),
      unreadCount: 0,
      productId: detail.id,
    };
    await openChat(targetConv);
  };

  const markAsSold = async (product: Product) => {
    if (!confirm(`确认将"${product.title}"标记为已售出？`)) return;
    const res = await fetch(`${API}/products/${product.id}/sold`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({}),
    });
    const json = await res.json();
    if (!json.success) return alert(json.message);
    alert("商品已标记为售出");
    await Promise.all([loadMine(), loadMarket(), loadAllForAdmin(), loadOrders()]);
  };

  const loadOrders = async () => {
    if (!token || !user) return;
    const res = await fetch(`${API}/orders`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) {
      setOrders(json.data);
      setMyPurchases(json.data.filter((o: Order) => o.buyerId === user!.id));
      setMySales(json.data.filter((o: Order) => o.sellerId === user!.id));
    }
  };

  const loadRecommendations = async () => {
    if (!token || !user) return;
    const res = await fetch(`${API}/recommendations`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) setRecommendations(json.data);
  };

  const logout = () => {
    localStorage.removeItem("sh-token");
    localStorage.removeItem("sh-username");
    localStorage.removeItem("sh-password");
    setToken("");
    setUser(null);
    setDetail(null);
  };

  const filteredMarket = useMemo(() => {
    const byKeyword = marketProducts.filter((p) =>
      `${p.title}${p.description}${p.campus}`
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );
    let result = categoryFilter === "all" ? byKeyword : byKeyword.filter((p) => p.category === categoryFilter);
    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "time") {
      result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [marketProducts, keyword, categoryFilter, sortBy]);

  const pagedMarket = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMarket.slice(start, start + PAGE_SIZE);
  }, [filteredMarket, page]);

  const pageCount = Math.max(1, Math.ceil(filteredMarket.length / PAGE_SIZE));
  const favoriteProducts = marketProducts.filter((p) => favorites.includes(p.id));
  const adminFilteredProducts =
    adminProductTab === "all"
      ? allProducts
      : allProducts.filter((p) => p.status === adminProductTab);

  const adminStats = useMemo(() => {
    const count = (status: Status) =>
      allProducts.filter((p) => p.status === status).length;
    return {
      pending: count("pending"),
      approved: count("approved"),
      rejected: count("rejected"),
      offline: count("offline"),
    };
  }, [allProducts]);

  useEffect(() => {
    fetchMe();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    loadMarket();
    loadMine();
    loadConversations();
    loadOrders();
    loadRecommendations();
    if (user.role === "admin") {
      loadAllForAdmin();
      loadUsers();
      setActiveTab("manage");
    } else {
      setActiveTab("market");
    }
  }, [token, user?.role]);

  useEffect(() => {
    setPage(1);
  }, [keyword, categoryFilter, sortBy]);

  if (!token || !user) {
    const strength = passwordStrength(regForm.password);
    useEffect(() => {
      const savedUsername = localStorage.getItem("sh-username");
      const savedPassword = localStorage.getItem("sh-password");
      if (savedUsername) {
        setLoginForm({ username: savedUsername, password: savedPassword || "" });
      }
    }, []);
    return (
      <div className="layout-auth">
        <div className="auth-card">
          <h1>校园二手交易平台</h1>
          <p>演示账号：admin / admin123，普通用户：user01 / user123</p>
          <input
            placeholder="用户名"
            value={loginForm.username}
            onChange={(e) =>
              setLoginForm({ ...loginForm, username: e.target.value })
            }
          />
          <input
            type="password"
            placeholder="密码"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({ ...loginForm, password: e.target.value })
            }
          />
          <div className="row">
            <button onClick={login}>登录</button>
            <button className="ghost" onClick={() => setShowRegister(true)}>
              去注册
            </button>
            <button
              className="ghost danger"
              onClick={() => {
                setLoginForm({ username: "", password: "" });
                localStorage.removeItem("sh-username");
                localStorage.removeItem("sh-password");
              }}
            >
              清除
            </button>
          </div>
        </div>

        {showRegister && (
          <div className="modal-mask" onClick={() => setShowRegister(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <h3>注册账号</h3>
              <input
                placeholder="用户名"
                value={regForm.username}
                onChange={(e) =>
                  setRegForm({ ...regForm, username: e.target.value })
                }
              />
              <input
                type="password"
                placeholder="密码"
                value={regForm.password}
                onChange={(e) =>
                  setRegForm({ ...regForm, password: e.target.value })
                }
              />
              <p style={{ color: strength.color, margin: "0 0 10px" }}>
                密码强度：{strength.label}
              </p>
              <select
                value={regForm.role}
                onChange={(e) =>
                  setRegForm({ ...regForm, role: e.target.value as Role })
                }
              >
                <option value="user">普通用户</option>
                <option value="admin">管理员（需审核）</option>
              </select>
              <div className="row">
                <button onClick={register}>确认注册</button>
                <button className="ghost" onClick={() => setShowRegister(false)}>
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="layout">
      <aside className="sider">
        <h2>Campus Market</h2>
        <button
          className={activeTab === "market" ? "menu active" : "menu"}
          onClick={() => setActiveTab("market")}
        >
          商品展示
        </button>
        <button
          className={activeTab === "favorites" ? "menu active" : "menu"}
          onClick={() => setActiveTab("favorites")}
        >
          我的收藏
        </button>
        <button
          className="menu"
          onClick={() => loadConversations()}
        >
          消息{conversations.length > 0 && `(${conversations.length})`}
        </button>
        <button
          className={activeTab === "mine" ? "menu active" : "menu"}
          onClick={() => setActiveTab("mine")}
        >
          发布/我的商品
        </button>
        {user.role === "admin" && (
          <button
            className={activeTab === "manage" ? "menu active" : "menu"}
            onClick={() => setActiveTab("manage")}
          >
            审核管理
          </button>
        )}
        {user.role === "admin" && (
          <button
            className={activeTab === "accounts" ? "menu active" : "menu"}
            onClick={() => setActiveTab("accounts")}
          >
            账号管理
          </button>
        )}
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            当前用户：{user.username}（{user.role === "admin" ? "管理员" : "普通用户"}）
          </div>
          <button onClick={logout}>退出登录</button>
        </header>

        {activeTab === "market" && (
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
                  onChange={(e) => setCategoryFilter(e.target.value as any)}
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
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="default">默认排序</option>
                  <option value="price-asc">价格从低到高</option>
                  <option value="price-desc">价格从高到低</option>
                  <option value="time">最新发布</option>
                </select>
              </div>
            </section>

            <section className="grid">
              {pagedMarket.map((p) => (
                <article key={p.id} className="product-card">
                  <img src={p.images?.[0]} alt={p.title} className="thumb" />
                  <div className="row">
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
                  <p className="muted">{p.description.slice(0, 52)}...</p>
                  <div className="row">
                    <strong>¥{p.price}</strong>
                    <span>{p.campus}</span>
                  </div>
                  <div className="meta">
                    发布时间：{new Date(p.createdAt).toLocaleDateString("zh-CN")}
                  </div>
                  <div className="seller-block">卖家：{p.sellerName}</div>
                  <button className="small" onClick={() => loadDetail(p.id)}>
                    查看详情
                  </button>
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
                          className={
                            favorites.includes(p.id) ? "small fav active" : "small fav"
                          }
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
                      <button className="small" onClick={() => loadDetail(p.id)}>
                        查看详情
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {activeTab === "favorites" && (
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
        )}

        {activeTab === "mine" && (
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
              <textarea
                placeholder="商品图片URL（可多张，每行一张）"
                value={publishForm.imagesText}
                onChange={(e) =>
                  setPublishForm({ ...publishForm, imagesText: e.target.value })
                }
              />
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
                  className={activeTab === "mine" ? "small" : "small ghost"}
                  onClick={() => { }}
                >
                  我卖出的({mySales.length})
                </button>
                <button
                  className="small ghost"
                  onClick={() => { }}
                >
                  我买的({myPurchases.length})
                </button>
              </div>
              {mySales.length > 0 && (
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
              {myPurchases.length > 0 && (
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
              {mySales.length === 0 && myPurchases.length === 0 && (
                <p className="muted">暂无交易记录</p>
              )}
            </section>
          </>
        )}

        {activeTab === "manage" && user.role === "admin" && (
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
                  className={
                    adminProductTab === "pending" ? "small" : "small ghost"
                  }
                  onClick={() => setAdminProductTab("pending")}
                >
                  待审核({adminStats.pending})
                </button>
                <button
                  className={
                    adminProductTab === "approved" ? "small" : "small ghost"
                  }
                  onClick={() => setAdminProductTab("approved")}
                >
                  已通过({adminStats.approved})
                </button>
                <button
                  className={
                    adminProductTab === "rejected" ? "small" : "small ghost"
                  }
                  onClick={() => setAdminProductTab("rejected")}
                >
                  已拒绝({adminStats.rejected})
                </button>
                <button
                  className={
                    adminProductTab === "offline" ? "small" : "small ghost"
                  }
                  onClick={() => setAdminProductTab("offline")}
                >
                  已下线({adminStats.offline})
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
        )}

        {activeTab === "accounts" && user.role === "admin" && (
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {detail && (
          <div className="modal-mask" onClick={() => setDetail(null)}>
            <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
              <h3>{detail.title}</h3>
              <div className="detail-images">
                {detail.images.map((img, i) => (
                  <img key={i} src={img} alt={`图片${i + 1}`} />
                ))}
              </div>
              <p>{detail.description}</p>
              <p>
                <b>价格：</b>¥{detail.price}
              </p>
              <p>
                <b>地点：</b>
                {detail.campus}
              </p>
              <p>
                <b>卖家：</b>
                {detail.sellerName}
              </p>
              <p>
                <b>发布时间：</b>
                {new Date(detail.createdAt).toLocaleString("zh-CN")}
              </p>
              {detail.category === "digital" && (
                <p>
                  <b>规格：</b>
                  {detail.brand} / {detail.model} / {detail.memory}
                </p>
              )}
              <div className="row">
                <button
                  className={
                    favorites.includes(detail.id) ? "small fav active" : "small fav"
                  }
                  onClick={() => toggleFavorite(detail.id)}
                >
                  {favorites.includes(detail.id) ? "取消收藏" : "收藏商品"}
                </button>
                {detail.sellerId !== user?.id && (
                  <button className="small" onClick={contactSeller}>
                    联系卖家
                  </button>
                )}
                <button className="ghost" onClick={() => setDetail(null)}>
                  关闭
                </button>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "12px 0" }} />
              <h4>联系卖家 / 留言</h4>
              <div className="message-list">
                {messages.map((m) => (
                  <div key={m.id} className="message-item">
                    <b>{m.fromUsername}</b>
                    <span className="muted">
                      {" "}
                      {new Date(m.createdAt).toLocaleString("zh-CN")}
                    </span>
                    <p>{m.content}</p>
                  </div>
                ))}
              </div>
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
        )}

        {chatTarget && (
          <div className="modal-mask" onClick={() => setChatTarget(null)}>
            <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
              <h3>与 {chatTarget.username} 对话</h3>
              <div className="chat-messages">
                {chatMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`chat-bubble ${m.fromUserId === user?.id ? "mine" : "other"}`}
                  >
                    <b>{m.fromUsername}</b>
                    <p>{m.content}</p>
                    <span className="muted">
                      {new Date(m.createdAt).toLocaleTimeString("zh-CN")}
                    </span>
                  </div>
                ))}
              </div>
              <div className="row">
                <input
                  placeholder="输入消息..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendChatMessage();
                  }}
                />
                <button onClick={sendChatMessage}>发送</button>
              </div>
            </div>
          </div>
        )}

        {!chatTarget && conversations.length > 0 && (
          <div className="modal-mask" onClick={() => { }}>
            <div className="chat-list-modal" onClick={(e) => e.stopPropagation()}>
              <h3>消息列表</h3>
              {conversations.map((conv) => (
                <div key={conv.userId} className="conv-item" onClick={() => openChat(conv)}>
                  <div className="row">
                    <b>{conv.username}</b>
                    {conv.unreadCount > 0 && (
                      <span className="badge">{conv.unreadCount}</span>
                    )}
                  </div>
                  <p className="muted">{conv.lastMessage}</p>
                  <span className="muted">
                    {new Date(conv.lastTime).toLocaleString("zh-CN")}
                  </span>
                </div>
              ))}
              <button className="ghost" onClick={() => setConversations([])}>
                关闭
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
