import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "./components/AppSidebar.tsx";
import { AuthView } from "./components/AuthView.tsx";
import {
  AccountDetailModal,
  ProductDetailModal,
  RatingModal,
  EditProductModal,
  SellerProfileModal,
} from "./components/modals.tsx";
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
import { useAuth } from "./hooks/useAuth.ts";
import { useProducts } from "./hooks/useProducts.ts";
import { useOrders } from "./hooks/useOrders.ts";
import { useMessages } from "./hooks/useMessages.ts";
import { useMarket } from "./hooks/useMarket.ts";
import { useRecommendations } from "./hooks/useRecommendations.ts";
import { useQuickReplies } from "./hooks/useQuickReplies.ts";
import type {
  Category,
  Conversation,
  PublishForm,
  Role,
  SellerPublicProfile,
  Status,
  Tab,
  User,
} from "./types";

export function App() {
  const auth = useAuth();
  const { token, user, authHeaders, login, register, logout, loginForm, setLoginForm, regForm, setRegForm, showRegister, setShowRegister, passwordStrength } = auth;

  const products = useProducts(authHeaders, user);
  const ordersHook = useOrders(authHeaders, user);
  const messagesHook = useMessages(authHeaders, user, user?.id);
  const { recommendations, recommendReason, loadRecommendations } = useRecommendations(authHeaders);
  const quickReplies = useQuickReplies(authHeaders);

  const [activeTab, setActiveTab] = useState<Tab>("market");
  const [adminProductTab, setAdminProductTab] = useState<Status | "all">("all");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [profileStats, setProfileStats] = useState({
    trustScore: 0,
    likesCount: 0,
    ratingCount: 0,
  });
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerPublicProfile | null>(null);
  const [sellerProfileLoading, setSellerProfileLoading] = useState(false);
  const [accountDetail, setAccountDetail] = useState<User | null>(null);
  const [accountForm, setAccountForm] = useState({
    username: "",
    password: "",
    role: "user" as Role,
    status: "active" as "active" | "pending_review" | "rejected",
    reviewNote: "",
  });
  const [publishForm, setPublishForm] = useState<PublishForm>({
    title: "",
    description: "",
    price: "",
    category: "daily" as Category,
    images: [],
    school: "武汉大学",
    schoolDetail: "信息学部",
    campus: "武汉大学 · 信息学部",
    latitude: 30.5289,
    longitude: 114.3598,
    brand: "",
    model: "",
    memory: "",
  });

  const favoritesKey = user ? `sh-favorites-${user.id}` : "sh-favorites-guest";
  const cartKey = user ? `sh-cart-${user.id}` : "sh-cart-guest";

  const market = useMarket(products.marketProducts, userLocation);

  const loadProfileStats = async () => {
    if (!token || !user) return;
    const json = await api.profile.stats(authHeaders());
    if (json.success) setProfileStats(json.data);
  };

  const loadFavorites = async () => {
    if (!token || !user) return;
    const json = await api.favorites.list(authHeaders());
    if (json.success) {
      setFavorites(json.data);
      localStorage.setItem(favoritesKey, JSON.stringify(json.data));
    }
  };

  const loadUsers = async () => {
    if (user?.role !== "admin") return;
    const json = await api.admin.users(authHeaders());
    if (json.success) setAllUsers(json.data);
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
    const next = cart.includes(id) ? cart.filter((x) => x !== id) : [...cart, id];
    setCart(next);
    localStorage.setItem(cartKey, JSON.stringify(next));
  };

  const loadDetail = async (id: string) => {
    const p = await products.loadDetail(id);
    if (!p) return;
    const msgJson = await api.messages.byProduct(id, authHeaders());
    if (msgJson.success) messagesHook.setMessages(msgJson.data);
  };

  const sendMessage = async () => {
    if (!products.detail) return;
    await messagesHook.sendProductMessage(products.detail.id);
  };

  const publish = async () => {
    const ok = await products.publish(publishForm);
    if (ok) {
      setPublishForm({
        title: "",
        description: "",
        price: "",
        category: "daily",
        images: [],
        school: "武汉大学",
        schoolDetail: "信息学部",
        campus: "武汉大学 · 信息学部",
        latitude: 30.5289,
        longitude: 114.3598,
        brand: "",
        model: "",
        memory: "",
      });
    }
  };

  const onPublishImagesSelected = async (files: FileList | null) => {
    const images = await products.onPublishImagesSelected(files);
    if (images.length) setPublishForm((prev) => ({ ...prev, images }));
  };

  const refreshAfterOrderChange = () =>
    Promise.all([
      products.loadMarket(),
      products.loadMine(),
      ordersHook.loadOrders(),
      messagesHook.loadConversations(),
      products.loadAllForAdmin(),
      messagesHook.chatTarget
        ? messagesHook.loadChatMessages(messagesHook.chatTarget.userId)
        : Promise.resolve(),
    ]).catch(console.error);

  const buyFromCart = async (product: Parameters<typeof products.buyNow>[0]) => {
    const ok = await products.buyNow(product);
    if (!ok) return;
    toggleCart(product.id);
    await refreshAfterOrderChange();
    setActiveTab("messages");
    await messagesHook.openSystemChat();
  };

  const openSellerProfile = async (sellerId: string) => {
    if (sellerId === user?.id) return;
    setSellerProfileLoading(true);
    const json = await api.profile.seller(sellerId, authHeaders());
    setSellerProfileLoading(false);
    if (!json.success) return alert(json.message);
    setSellerProfile(json.data);
  };

  const loadAccountDetail = async (id: string) => {
    const json = await api.admin.userDetail(id, authHeaders());
    if (!json.success) return alert(json.message);
    setAccountDetail(json.data);
    setAccountForm({
      username: json.data.username || "",
      password: "",
      role: json.data.role || "user",
      status: json.data.status || "active",
      reviewNote: json.data.reviewNote || "",
    });
  };

  const saveAccountDetail = async () => {
    if (!accountDetail) return;
    const json = await api.admin.saveUser(accountDetail.id, accountForm, authHeaders());
    if (!json.success) return alert(json.message);
    alert("账号信息已更新");
    await loadUsers();
    setAccountDetail(json.data);
  };

  const reviewAdminUser = async (id: string, action: "approve" | "reject") => {
    const note =
      prompt(action === "approve" ? "审核备注（可选）" : "拒绝理由（建议填写）") || "";
    const json = await api.admin.reviewUser(id, action, note, authHeaders());
    if (!json.success) return alert(json.message);
    await loadUsers();
  };

  const deleteUser = async (id: string, username: string) => {
    if (
      !confirm(
        `确认删除账号「${username}」？将同时删除其发布的全部商品，该操作不可撤销。`,
      )
    ) {
      return;
    }
    const json = await api.admin.deleteUser(id, authHeaders());
    if (!json.success) return alert(json.message);
    alert(json.message || "账号及关联商品已删除");
    await Promise.all([
      loadUsers(),
      products.loadAllForAdmin(),
      products.loadMarket(),
      products.loadMine(),
    ]);
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

  const favoriteProducts = products.marketProducts.filter((p) => favorites.includes(p.id));

  const adminFilteredProducts =
    adminProductTab === "all"
      ? products.allProducts
      : products.allProducts.filter((p) => p.status === adminProductTab);

  const adminStats = useMemo(() => {
    const count = (status: Status) =>
      products.allProducts.filter((p) => p.status === status).length;
    return {
      pending: count("pending"),
      approved: count("approved"),
      rejected: count("rejected"),
      offline: count("offline"),
      sold: count("sold"),
    };
  }, [products.allProducts]);

  const hasUnreadMessages = useMemo(
    () =>
      messagesHook.conversations.some(
        (conv) => conv.lastTime > messagesHook.lastSeenMessageTime,
      ),
    [messagesHook.conversations, messagesHook.lastSeenMessageTime],
  );

  const bootstrap = async () => {
    await Promise.all([
      products.loadMarket(),
      products.loadMine(),
      messagesHook.loadConversations(),
      ordersHook.loadOrders(),
      loadRecommendations(),
      loadFavorites(),
      loadProfileStats(),
      quickReplies.loadQuickReplies(),
    ]);
    if (user?.role === "admin") {
      await Promise.all([products.loadAllForAdmin(), loadUsers()]);
      setActiveTab("manage");
    }
  };

  useEffect(() => {
    if (!token || !user) return;
    bootstrap().catch(console.error);
  }, [token, user?.id, user?.role]);

  useEffect(() => {
    if (!token || !user || userLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => undefined,
    );
  }, [token, user?.id, userLocation]);

  useEffect(() => {
    if (!user) return;
    setFavorites(JSON.parse(localStorage.getItem(favoritesKey) || "[]"));
    setCart(JSON.parse(localStorage.getItem(cartKey) || "[]"));
  }, [user?.id]);

  useEffect(() => {
    if (activeTab === "messages" && messagesHook.conversations.length > 0) {
      messagesHook.markMessagesAsSeen();
    }
  }, [activeTab, messagesHook.conversations.length]);

  useEffect(() => {
    market.setPage(1);
  }, [market.keyword, market.categoryFilter, market.sortBy]);

  useEffect(() => {
    if (!token || !user) return;
    const timer = window.setInterval(() => {
      messagesHook.loadConversations().catch(console.error);
      ordersHook.loadOrders().catch(console.error);
      loadRecommendations().catch(console.error);
      loadFavorites().catch(console.error);
      loadProfileStats().catch(console.error);
      if (products.detail) loadDetail(products.detail.id).catch(console.error);
      if (messagesHook.chatTarget) {
        messagesHook.loadChatMessages(messagesHook.chatTarget.userId).catch(console.error);
      }
    }, 5000);
    return () => window.clearInterval(timer);
  }, [token, user?.id, products.detail?.id, messagesHook.chatTarget?.userId]);

  const openChatWithProduct = async (target: Conversation) => {
    await messagesHook.openChat(target);
    if (target.productId) {
      const json = await api.products.detail(target.productId, authHeaders());
      if (json.success) messagesHook.setRelatedProduct(json.data);
    } else {
      messagesHook.setRelatedProduct(null);
    }
  };

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
        conversationsCount={messagesHook.conversations.length}
        hasUnreadMessages={hasUnreadMessages}
        onTabChange={setActiveTab}
        onOpenMessages={() => {
          setActiveTab("messages");
          messagesHook.loadConversations();
          messagesHook.markMessagesAsSeen();
        }}
        onLogout={logout}
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
          <header className="page-header profile-page-header">
            <div className="page-title">个人中心</div>
            <div className="page-actions">
              <button className="btn-ghost" onClick={logout}>
                退出登录
              </button>
            </div>
          </header>
        )}
        {activeTab === "publish" && (
          <header className="page-header">
            <div className="page-title">发布闲置</div>
          </header>
        )}

        <div className={activeTab === "messages" ? "content-no-pad" : "content-scroll"}>
          {activeTab === "market" && (
            <MarketTab
              keyword={market.keyword}
              setKeyword={market.setKeyword}
              categoryFilter={market.categoryFilter}
              setCategoryFilter={market.setCategoryFilter}
              sortBy={market.sortBy}
              setSortBy={market.setSortBy}
              userLocation={userLocation}
              pickCurrentLocation={pickCurrentLocation}
              pagedMarket={market.pagedMarket}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              loadDetail={loadDetail}
              page={market.page}
              pageCount={market.pageCount}
              setPage={market.setPage}
              recommendations={recommendations}
              recommendReason={recommendReason}
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
              myProducts={products.myProducts}
              markAsSold={products.markAsSold}
              loadDetail={loadDetail}
              mySales={ordersHook.mySales}
              myPurchases={ordersHook.myPurchases}
              profileStats={profileStats}
              onRateOrder={ordersHook.setPendingRatingOrder}
              onDeleteProduct={products.deleteMyProduct}
              onEditProduct={products.setEditingProduct}
            />
          )}

          {activeTab === "publish" && (
            <PostPublishTab
              publishForm={publishForm}
              setPublishForm={setPublishForm}
              onPublishImagesSelected={onPublishImagesSelected}
              publish={publish}
            />
          )}

          {activeTab === "manage" && user.role === "admin" && (
            <ManageTab
              adminStats={adminStats}
              adminProductTab={adminProductTab}
              setAdminProductTab={setAdminProductTab}
              allProducts={products.allProducts}
              adminFilteredProducts={adminFilteredProducts}
              audit={products.audit}
              toggleStatus={products.toggleStatus}
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
              conversations={messagesHook.conversations}
              lastSeenMessageTime={messagesHook.lastSeenMessageTime}
              openChat={openChatWithProduct}
              chatTarget={messagesHook.chatTarget}
              relatedProduct={messagesHook.relatedProduct}
              chatMessages={messagesHook.chatMessages}
              user={user}
              chatInput={messagesHook.chatInput}
              setChatInput={messagesHook.setChatInput}
              setChatImageFile={messagesHook.setChatImageFile}
              sendChatMessage={messagesHook.sendChatMessage}
              quickReplies={quickReplies.allReplies}
              onQuickReply={messagesHook.sendQuickReply}
              quickRepliesEditor={{
                custom: quickReplies.custom,
                draft: quickReplies.draft,
                setDraft: quickReplies.setDraft,
                showEditor: quickReplies.showEditor,
                setShowEditor: quickReplies.setShowEditor,
                addCustom: quickReplies.addCustom,
                removeCustom: quickReplies.removeCustom,
                saveCustom: quickReplies.saveCustom,
              }}
              buyNow={buyFromCart}
              orders={ordersHook.orders}
              onSellerConfirmOrder={async (id) => {
                await ordersHook.handleSellerConfirmOrder(id);
                await refreshAfterOrderChange();
              }}
              onSellerRejectOrder={async (id) => {
                await ordersHook.handleSellerRejectOrder(id);
                await refreshAfterOrderChange();
              }}
              onBuyerConfirmOrder={async (id) => {
                await ordersHook.handleBuyerConfirmOrder(id);
                await refreshAfterOrderChange();
              }}
            />
          )}
        </div>
      </main>

      <ProductDetailModal
        detail={products.detail}
        setDetail={products.setDetail}
        favorites={favorites}
        toggleFavorite={toggleFavorite}
        user={user}
        messages={messagesHook.messages}
        setMessageImageFile={messagesHook.setMessageImageFile}
        messageInput={messagesHook.messageInput}
        setMessageInput={messagesHook.setMessageInput}
        sendMessage={sendMessage}
        onSellerClick={openSellerProfile}
        onBuyNow={buyFromCart}
      />

      <SellerProfileModal
        profile={sellerProfile}
        loading={sellerProfileLoading}
        onClose={() => setSellerProfile(null)}
        onViewProduct={(id) => {
          setSellerProfile(null);
          loadDetail(id);
        }}
      />

      <AccountDetailModal
        accountDetail={accountDetail}
        accountForm={accountForm}
        setAccountForm={setAccountForm}
        setAccountDetail={setAccountDetail}
        saveAccountDetail={saveAccountDetail}
      />

      <RatingModal
        order={ordersHook.pendingRatingOrder}
        onClose={() => ordersHook.setPendingRatingOrder(null)}
        onSubmit={(review) => {
          if (!ordersHook.pendingRatingOrder) return;
          return ordersHook
            .rateOrder(ordersHook.pendingRatingOrder, review)
            .then(loadProfileStats);
        }}
      />

      <EditProductModal
        product={products.editingProduct}
        setProduct={products.setEditingProduct}
        onSave={products.updateMyProduct}
      />
    </div>
  );
}
