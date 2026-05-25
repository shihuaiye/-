import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "./components/AppSidebar.tsx";
import { AuthView } from "./components/AuthView.tsx";
import { AccountDetailModal, ProductDetailModal, RatingModal, EditProductModal } from "./components/modals.tsx";
import {
  AccountsTab,
  CartTab,
  ManageTab,
  MarketTab,
  MessagesTab,
  PostProfileTab,
  PostPublishTab,
} from "./components/tabs.tsx";
import { api } from "./services/api.ts";
import type {
  Category,
  Conversation,
  Order,
  Product,
  ProductMessage,
  PublishForm,
  ProfileStats,
  Role,
  Status,
  Tab,
  User,
} from "./types";
import { PAGE_SIZE, distanceKm, passwordStrength, toBase64, getProductLocation, PRESET_LOCATIONS } from "./utils.ts";

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
  const [messageImageFile, setMessageImageFile] = useState<File | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);

  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [sortBy, setSortBy] = useState<
    "default" | "distance" | "price-asc" | "price-desc" | "time"
  >("time");
  const [page, setPage] = useState(1);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatTarget, setChatTarget] = useState<Conversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ProductMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatImageFile, setChatImageFile] = useState<File | null>(null);
  const [relatedProduct, setRelatedProduct] = useState<Product | null>(null);
  const [lastSeenMessageTime, setLastSeenMessageTime] = useState("");

  const [orders, setOrders] = useState<Order[]>([]);
  const [myPurchases, setMyPurchases] = useState<Order[]>([]);
  const [mySales, setMySales] = useState<Order[]>([]);
  const [profileStats, setProfileStats] = useState<ProfileStats>({
    trustScore: 0,
    likesCount: 0,
    ratingCount: 0,
  });
  const [pendingRatingOrder, setPendingRatingOrder] = useState<Order | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [accountDetail, setAccountDetail] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    password: "",
    role: "user" as Role,
    status: "active" as "active" | "pending_review" | "rejected",
    reviewNote: "",
  });

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [regForm, setRegForm] = useState({
    username: "",
    password: "",
    role: "user" as Role,
    school: "武汉大学",
  });
  const [publishForm, setPublishForm] = useState<PublishForm>({
    title: "",
    description: "",
    price: "",
    category: "daily" as Category,
    images: [] as string[],
    school: "武汉大学",
    schoolDetail: "",
    campus: "",
    brand: "",
    model: "",
    memory: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [manualLocationLabel, setManualLocationLabel] = useState("");

  const authHeaders = (): HeadersInit =>
    token ? { Authorization: `Bearer ${token}` } : {};
  const favoritesKey = user ? `sh-favorites-${user.id}` : "sh-favorites-guest";
  const cartKey = user ? `sh-cart-${user.id}` : "sh-cart-guest";
  const messageSeenKey = user ? `sh-msg-seen-${user.id}` : "sh-msg-seen-guest";

  const fetchMe = async () => {
    if (!token) return;
    const json = await api.auth.me(authHeaders());
    if (!json.success) return;
    setUser(hydrateUser(json.data));
  };

  const hydrateUser = (user: User) => {
    const school = localStorage.getItem(`sh-school-${user.username}`);
    return school ? { ...user, school } : user;
  };

  const login = async () => {
    const json = await api.auth.login(loginForm);
    if (!json.success) return alert(json.message);
    setToken(json.data.token);
    setUser(hydrateUser(json.data.user));
    localStorage.setItem("sh-token", json.data.token);
    localStorage.setItem("sh-username", loginForm.username);
    localStorage.setItem("sh-password", loginForm.password);
  };

  const register = async () => {
    const strength = passwordStrength(regForm.password);
    if (!strength.pass)
      return alert("密码强度过弱，请至少满足8位并包含数字/字母组合");
    const json = await api.auth.register(regForm);
    if (!json.success) return alert(json.message);
    if (regForm.school) {
      localStorage.setItem(`sh-school-${regForm.username}`, regForm.school);
    }
    alert(json.message || "注册成功，请登录");
    setShowRegister(false);
    setRegForm({
      username: "",
      password: "",
      role: "user",
      school: "武汉大学",
    });
  };

  const loadAllForAdmin = async () => {
    const json = await api.products.all(authHeaders());
    if (json.success) setAllProducts(json.data);
  };

  const loadMarket = async () => {
    const json = await api.products.market(authHeaders());
    if (json.success) setMarketProducts(json.data);
  };

  const loadMine = async () => {
    const json = await api.products.mine(authHeaders());
    if (json.success) setMyProducts(json.data);
  };

  const loadUsers = async () => {
    if (user?.role !== "admin") return;
    const json = await api.admin.users(authHeaders());
    if (json.success) setAllUsers(json.data);
  };

  const loadDetail = async (id: string) => {
    const json = await api.products.detail(id, authHeaders());
    if (!json.success) return alert(json.message);
    setDetail(json.data);
    const msgJson = await api.messages.byProduct(id, authHeaders());
    if (msgJson.success) setMessages(msgJson.data);
  };

  const sendMessage = async () => {
    if (!detail) return;
    const content = messageInput.trim();
    const imageData = messageImageFile ? await toBase64(messageImageFile) : "";
    if (!content && !imageData) return;
    const finalContent = imageData
      ? content
        ? `${content}\n[图片: ${imageData}]`
        : `[图片: ${imageData}]`
      : content;
    const json = await api.messages.sendToProduct(
      detail.id,
      finalContent,
      authHeaders(),
    );
    if (!json.success) return alert(json.message);
    setMessageInput("");
    setMessageImageFile(null);
    await loadDetail(detail.id);
  };

  const publish = async () => {
    console.log("publish called", { publishForm });
    if (!publishForm.images.length) {
      alert("请至少选择一张商品图片");
      return;
    }
    if (!publishForm.title.trim()) {
      alert("请填写商品名称");
      return;
    }
    if (!publishForm.description.trim()) {
      alert("请填写商品描述");
      return;
    }
    const priceNum = Number(publishForm.price);
    if (!publishForm.price.trim() || !Number.isFinite(priceNum) || priceNum <= 0) {
      alert("请填写有效价格");
      return;
    }
    try {
      const payload = {
        title: publishForm.title,
        description: publishForm.description,
        price: priceNum,
        category: publishForm.category,
        images: publishForm.images,
        campus: `${publishForm.school}${publishForm.schoolDetail ? ` · ${publishForm.schoolDetail}` : ""}`,
        brand: publishForm.brand || undefined,
        model: publishForm.model || undefined,
        memory: publishForm.memory || undefined,
        latitude: publishForm.latitude,
        longitude: publishForm.longitude,
      };
      console.log("sending payload", payload);
      const json = await api.products.create(payload, authHeaders());
      console.log("response", json);
      if (!json.success) {
        alert(json.message || "发布失败");
        return;
      }
      alert("发布成功，等待审核");
      setPublishForm({
        title: "",
        description: "",
        price: "",
        category: "daily",
        images: [],
        school: "武汉大学",
        schoolDetail: "",
        campus: "",
        brand: "",
        model: "",
        memory: "",
        latitude: undefined,
        longitude: undefined,
      });
      await Promise.all([loadMine(), loadMarket(), loadAllForAdmin()]);
    } catch (error) {
      console.error("publish error", error);
      alert("发布失败，请检查网络连接");
    }
  };

  const audit = async (id: string, action: "approve" | "reject") => {
    let reason = "";
    if (action === "reject") {
      reason = prompt("请输入拒绝理由（必填）：")?.trim() || "";
      if (!reason) {
        alert("拒绝时必须填写理由");
        return;
      }
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

  const reviewAdminUser = async (id: string, action: "approve" | "reject") => {
    const note =
      prompt(
        action === "approve" ? "审核备注（可选）" : "拒绝理由（建议填写）",
      ) || "";
    const json = await api.admin.reviewUser(id, action, note, authHeaders());
    if (!json.success) return alert(json.message);
    await loadUsers();
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`确认删除账号 ${username}？该操作不可撤销。`)) return;
    const json = await api.admin.deleteUser(id, authHeaders());
    if (!json.success) return alert(json.message);
    await loadUsers();
  };

  const loadAccountDetail = async (id: string) => {
    const json = await api.admin.userDetail(id, authHeaders());
    if (!json.success) return alert(json.message);
    setAccountDetail(json.data);
    setAccountForm({
      username: json.data.username || "",
      password: json.data.password || "",
      role: json.data.role || "user",
      status: json.data.status || "active",
      reviewNote: json.data.reviewNote || "",
    });
  };

  const saveAccountDetail = async () => {
    if (!accountDetail) return;
    const json = await api.admin.saveUser(
      accountDetail.id,
      accountForm,
      authHeaders(),
    );
    if (!json.success) return alert(json.message);
    alert("账号信息已更新");
    await loadUsers();
    setAccountDetail(json.data);
  };

  const markMessagesAsSeen = () => {
    const now = new Date().toISOString();
    setLastSeenMessageTime(now);
    localStorage.setItem(messageSeenKey, now);
  };

  const pickCurrentLocation = () => {
    if (!navigator.geolocation) return alert("当前浏览器不支持定位");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setUserLocation({ latitude, longitude });
        setPublishForm((prev) => ({ ...prev, latitude, longitude }));
      },
      () => alert("定位失败，请检查定位权限"),
    );
  };

  const onPublishImagesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).slice(0, 6);
    const images = await Promise.all(imageFiles.map((f) => toBase64(f)));
    setPublishForm((prev) => ({ ...prev, images }));
  };

  const loadFavorites = async () => {
    if (!token || !user) return;
    const json = await api.favorites.list(authHeaders());
    if (json.success) {
      setFavorites(json.data);
      localStorage.setItem(favoritesKey, JSON.stringify(json.data));
    }
  };

  const loadProfileStats = async () => {
    if (!token || !user) return;
    const json = await api.profile.stats(authHeaders());
    if (json.success) setProfileStats(json.data);
  };

  const toggleFavorite = async (id: string) => {
    if (!token || !user) {
      const next = favorites.includes(id)
        ? favorites.filter((x) => x !== id)
        : [...favorites, id];
      setFavorites(next);
      localStorage.setItem(favoritesKey, JSON.stringify(next));
      return;
    }
    const json = await api.favorites.toggle(id, authHeaders());
    if (!json.success) return alert(json.message);
    await loadFavorites();
  };

  const toggleCart = (id: string) => {
    const next = cart.includes(id)
      ? cart.filter((x) => x !== id)
      : [...cart, id];
    setCart(next);
    localStorage.setItem(cartKey, JSON.stringify(next));
  };

  const applyManualLocation = () => {
    const location = PRESET_LOCATIONS.find(
      (loc) => loc.label === manualLocationLabel,
    );
    if (!location) return;
    setPublishForm((prev) => ({
      ...prev,
      campus: location.campus,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
    setUserLocation({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const loadConversations = async () => {
    if (!token || !user) return;
    const json = await api.conversations.list(authHeaders());
    if (json.success) setConversations(json.data);
  };

  const openChat = async (target: Conversation) => {
    setChatTarget(target);
    markMessagesAsSeen();
    const json = await api.conversations.detail(target.userId, authHeaders());
    if (json.success) setChatMessages(json.data);
  };

  const loadChatMessages = async (targetUserId: string) => {
    const json = await api.conversations.detail(targetUserId, authHeaders());
    if (json.success) setChatMessages(json.data);
  };

  const sendChatMessage = async () => {
    if (!chatTarget) return;
    const content = chatInput.trim();
    const imageData = chatImageFile ? await toBase64(chatImageFile) : "";

    if (!content && !imageData) {
      alert("请输入消息内容或选择图片");
      return;
    }

    let finalContent = content;
    if (imageData) {
      if (content) {
        finalContent = `${content}\n[图片: ${imageData}]`;
      } else {
        finalContent = `[图片: ${imageData}]`;
      }
    }

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

  useEffect(() => {
    try {
      if (chatMessages.length > 0) {
        setTimeout(() => {
          const container = document.getElementById("chat-messages-container");
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        }, 100);
      }
    } catch (error) {
      console.error("Auto scroll error:", error);
    }
  }, [chatMessages]);

  useEffect(() => {
    if (!token || !user) return;
    const timer = window.setInterval(() => {
      loadConversations().catch(console.error);
      loadOrders().catch(console.error);
      loadRecommendations().catch(console.error);
      loadFavorites().catch(console.error);
      loadProfileStats().catch(console.error);
      if (detail) {
        loadDetail(detail.id).catch(console.error);
      }
      if (chatTarget) {
        loadChatMessages(chatTarget.userId).catch(console.error);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [token, user, detail?.id, chatTarget?.userId]);

  const markAsSold = async (product: Product) => {
    if (!confirm(`确认将"${product.title}"标记为已售出？`)) return;
    const buyerName =
      prompt("请输入买家昵称（可留空，默认系统模拟成交）")?.trim() ||
      "系统模拟";
    const json = await api.products.soldBySeller(
      product.id,
      buyerName,
      authHeaders(),
    );
    if (!json.success) return alert(json.message);
    alert("商品已标记为售出");
    await Promise.all([
      loadMine(),
      loadMarket(),
      loadAllForAdmin(),
      loadOrders(),
    ]);
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
    const json = await api.products.update(editingProduct.id, updatedFields, authHeaders());
    if (!json.success) return alert(json.message);
    alert("商品已更新，等待审核");
    setEditingProduct(null);
    await Promise.all([loadMine(), loadMarket(), loadAllForAdmin()]);
  };

  const buyFromCart = async (product: Product) => {
    if (!user) return;
    if (product.sellerId === user.id) {
      alert("不能购买自己发布的商品");
      return;
    }
    if (!confirm(`确认购买 "${product.title}" 吗？`)) return;
    const json = await api.products.purchase(product.id, authHeaders());
    if (!json.success) return alert(json.message);
    alert("下单成功，交易已完成");
    setPendingRatingOrder(json.data.order);
    toggleCart(product.id);
    void Promise.all([
      loadMarket(),
      loadMine(),
      loadOrders(),
      loadAllForAdmin(),
    ]).catch((error) => {
      console.error("refresh after purchase failed", error);
    });
  };

  const loadOrders = async () => {
    if (!token || !user) return;
    const json = await api.orders.list(authHeaders());
    if (json.success) {
      setOrders(json.data);
      setMyPurchases(json.data.filter((o: Order) => o.buyerId === user!.id));
      setMySales(json.data.filter((o: Order) => o.sellerId === user!.id));
    }
  };

  const rateOrder = async (order: Order, rating: number) => {
    const json = await api.orders.rate(order.id, rating, authHeaders());
    if (!json.success) return alert(json.message);
    alert("评分提交成功");
    setPendingRatingOrder(null);
    await Promise.all([loadOrders(), loadProfileStats()]);
  };

  const loadRecommendations = async () => {
    if (!token || !user) return;
    const json = await api.recommendations.list(authHeaders());
    if (json.success) setRecommendations(json.data);
  };

  const logout = () => {
    localStorage.removeItem("sh-token");
    localStorage.removeItem("sh-username");
    localStorage.removeItem("sh-password");
    setToken("");
    setUser(null);
    setDetail(null);
    setFavorites([]);
    setCart([]);
    setProfileStats({
      trustScore: 0,
      likesCount: 0,
      ratingCount: 0,
    });
    setPendingRatingOrder(null);
  };

  const filteredMarket = useMemo(() => {
    const byKeyword = marketProducts.filter((p) =>
      `${p.title}${p.description}${p.campus}`
        .toLowerCase()
        .includes(keyword.toLowerCase()),
    );
    let result =
      categoryFilter === "all"
        ? byKeyword
        : byKeyword.filter((p) => p.category === categoryFilter);
    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === "time") {
      result = [...result].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "distance" && userLocation) {
      result = [...result].sort((a, b) => {
        const locA = getProductLocation(a);
        const locB = getProductLocation(b);
        if (!locA && !locB) return 0;
        if (!locA) return 1;
        if (!locB) return -1;
        return distanceKm(userLocation, locA) - distanceKm(userLocation, locB);
      });
    }
    return result;
  }, [marketProducts, keyword, categoryFilter, sortBy, userLocation]);

  const pagedMarket = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMarket.slice(start, start + PAGE_SIZE);
  }, [filteredMarket, page]);

  const pageCount = Math.max(1, Math.ceil(filteredMarket.length / PAGE_SIZE));
  const favoriteProducts = marketProducts.filter((p) =>
    favorites.includes(p.id),
  );
  const cartProducts = marketProducts.filter((p) => cart.includes(p.id));
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
      sold: count("sold"),
    };
  }, [allProducts]);

  const hasUnreadMessages = useMemo(() => {
    if (!conversations.length) return false;
    return conversations.some((conv) => conv.lastTime > lastSeenMessageTime);
  }, [conversations, lastSeenMessageTime]);

  useEffect(() => {
    fetchMe();
  }, [token]);

  useEffect(() => {
    if (!token || !user) return;
    loadMarket().catch(console.error);
    loadMine().catch(console.error);
    loadConversations().catch(console.error);
    loadOrders().catch(console.error);
    loadRecommendations().catch(console.error);
    loadFavorites().catch(console.error);
    loadProfileStats().catch(console.error);
    if (user.role === "admin") {
      loadAllForAdmin().catch(console.error);
      loadUsers().catch(console.error);
      setActiveTab("manage");
    } else {
      setActiveTab("market");
    }
  }, [token, user?.role]);

  useEffect(() => {
    if (!token || !user || userLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => { },
    );
  }, [token, user?.id, userLocation]);

  useEffect(() => {
    if (!user) return;
    setFavorites(JSON.parse(localStorage.getItem(favoritesKey) || "[]"));
    setCart(JSON.parse(localStorage.getItem(cartKey) || "[]"));
    setLastSeenMessageTime(localStorage.getItem(messageSeenKey) || "");
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "messages" && conversations.length > 0) {
      markMessagesAsSeen();
    }
  }, [activeTab, conversations.length]);

  useEffect(() => {
    setPage(1);
  }, [keyword, categoryFilter, sortBy]);

  useEffect(() => {
    const savedUsername = localStorage.getItem("sh-username");
    const savedPassword = localStorage.getItem("sh-password");
    if (savedUsername) {
      setLoginForm({ username: savedUsername, password: savedPassword || "" });
    }
  }, []);

  if (!token || !user) {
    const strength = passwordStrength(regForm.password);
    return (
      <AuthView
        loginForm={loginForm}
        regForm={regForm}
        showRegister={showRegister}
        strength={strength}
        setLoginForm={setLoginForm}
        setRegForm={setRegForm}
        setShowRegister={setShowRegister}
        onLogin={login}
        onRegister={register}
      />
    );
  }

  return (
    <div className="layout">
      <AppSidebar
        user={user}
        activeTab={activeTab}
        conversationsCount={conversations.length}
        hasUnreadMessages={hasUnreadMessages}
        onTabChange={setActiveTab}
        onOpenMessages={() => {
          setActiveTab("messages");
          loadConversations();
          markMessagesAsSeen();
        }}
      />

      <main className="main">
        {activeTab === "market" && (
          <header className="page-header">
            <div className="page-title">
              商品广场
              <span className="page-subtitle">珞珈优选</span>
            </div>
          </header>
        )}

        {activeTab === "cart" && (
          <header className="page-header">
            <div className="page-title">收藏与购物车</div>
          </header>
        )}

        {activeTab === "profile" && (
          <header className="page-header">
            <div className="page-title">个人中心</div>
            <div className="page-actions">
              <button onClick={logout}>退出登录</button>
            </div>
          </header>
        )}

        {activeTab === "publish" && (
          <header className="page-header">
            <div className="page-title">发布闲置</div>
          </header>
        )}

        <div
          className={
            activeTab === "messages" ? "content-no-pad" : "content-scroll"
          }
        >
          {activeTab === "market" && (
            <MarketTab
              keyword={keyword}
              setKeyword={setKeyword}
              categoryFilter={categoryFilter}
              setCategoryFilter={setCategoryFilter}
              sortBy={sortBy}
              setSortBy={setSortBy}
              userLocation={userLocation}
              pickCurrentLocation={pickCurrentLocation}
              pagedMarket={pagedMarket}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              loadDetail={loadDetail}
              page={page}
              pageCount={pageCount}
              setPage={setPage}
              recommendations={recommendations}
              cart={cart}
              toggleCart={toggleCart}
            />
          )}

          {activeTab === "cart" && (
            <CartTab
              favoriteProducts={favoriteProducts}
              toggleFavorite={toggleFavorite}
              loadDetail={loadDetail}
              buyNow={buyFromCart}
            />
          )}

          {activeTab === "profile" && (
            <PostProfileTab
              user={user}
              myProducts={myProducts}
              markAsSold={markAsSold}
              loadDetail={loadDetail}
              mySales={mySales}
              myPurchases={myPurchases}
              profileStats={profileStats}
              onRateOrder={setPendingRatingOrder}
              onDeleteProduct={deleteMyProduct}
              onEditProduct={setEditingProduct}
            />
          )}

          {activeTab === "publish" && (
            <PostPublishTab
              publishForm={publishForm}
              setPublishForm={setPublishForm}
              onPublishImagesSelected={onPublishImagesSelected}
              publish={publish}
              presetLocations={PRESET_LOCATIONS}
            />
          )}

          {activeTab === "manage" && user.role === "admin" && (
            <ManageTab
              adminStats={adminStats}
              adminProductTab={adminProductTab}
              setAdminProductTab={setAdminProductTab}
              allProducts={allProducts}
              adminFilteredProducts={adminFilteredProducts}
              audit={audit}
              toggleStatus={toggleStatus}
              loadDetail={loadDetail}
            />
          )}

          {activeTab === "accounts" && user.role === "admin" && (
            <AccountsTab
              allUsers={allUsers}
              user={user}
              loadAccountDetail={loadAccountDetail}
              reviewAdminUser={reviewAdminUser}
              deleteUser={deleteUser}
            />
          )}

          {activeTab === "messages" && (
            <MessagesTab
              conversations={conversations}
              lastSeenMessageTime={lastSeenMessageTime}
              openChat={openChat}
              chatTarget={chatTarget}
              relatedProduct={relatedProduct}
              chatMessages={chatMessages}
              user={user}
              chatInput={chatInput}
              setChatInput={setChatInput}
              setChatImageFile={setChatImageFile}
              sendChatMessage={sendChatMessage}
              buyNow={buyFromCart}
            />
          )}
        </div>
      </main>

      <ProductDetailModal
        detail={detail}
        setDetail={setDetail}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        user={user}
        messages={messages}
        setMessageImageFile={setMessageImageFile}
        messageInput={messageInput}
        setMessageInput={setMessageInput}
        sendMessage={sendMessage}
      />

      <AccountDetailModal
        accountDetail={accountDetail}
        accountForm={accountForm}
        setAccountForm={setAccountForm}
        setAccountDetail={setAccountDetail}
        saveAccountDetail={saveAccountDetail}
      />

      <RatingModal
        order={pendingRatingOrder}
        onClose={() => setPendingRatingOrder(null)}
        onSubmit={(rating) => {
          if (!pendingRatingOrder) return;
          return rateOrder(pendingRatingOrder, rating);
        }}
      />

      <EditProductModal
        product={editingProduct}
        setProduct={setEditingProduct}
        onSave={updateMyProduct}
      />
    </div>
  );
}
