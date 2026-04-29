import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { AppSidebar } from "./components/AppSidebar";
import { AuthView } from "./components/AuthView";
import { AccountsTab, CartTab, ManageTab, MarketTab, MessagesTab, PostProfileTab, PostPublishTab, } from "./components/tabs";
import { PRESET_LOCATIONS } from "./constants/locations";
import { api } from "./services/api";
import { PAGE_SIZE, distanceKm, passwordStrength, toBase64 } from "./utils";
export function App() {
    const [token, setToken] = useState(localStorage.getItem("sh-token") || "");
    const [user, setUser] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [marketProducts, setMarketProducts] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [allUsers, setAllUsers] = useState([]);
    const [activeTab, setActiveTab] = useState("market");
    const [adminProductTab, setAdminProductTab] = useState("all");
    const [detail, setDetail] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");
    const [messageImageFile, setMessageImageFile] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [favorites, setFavorites] = useState([]);
    const [cart, setCart] = useState([]);
    const [keyword, setKeyword] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [sortBy, setSortBy] = useState("distance");
    const [page, setPage] = useState(1);
    const [conversations, setConversations] = useState([]);
    const [chatTarget, setChatTarget] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [chatImageFile, setChatImageFile] = useState(null);
    const [relatedProduct, setRelatedProduct] = useState(null);
    const [lastSeenMessageTime, setLastSeenMessageTime] = useState("");
    const [orders, setOrders] = useState([]);
    const [myPurchases, setMyPurchases] = useState([]);
    const [mySales, setMySales] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [userLocation, setUserLocation] = useState(null);
    const [accountDetail, setAccountDetail] = useState(null);
    const [accountForm, setAccountForm] = useState({
        username: "",
        password: "",
        role: "user",
        status: "active",
        reviewNote: "",
    });
    const [loginForm, setLoginForm] = useState({ username: "", password: "" });
    const [regForm, setRegForm] = useState({
        username: "",
        password: "",
        role: "user",
        school: "武汉大学",
    });
    const [publishForm, setPublishForm] = useState({
        title: "",
        description: "",
        price: 0,
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
    const [manualLocationLabel, setManualLocationLabel] = useState("");
    const authHeaders = () => token ? { Authorization: `Bearer ${token}` } : {};
    const favoritesKey = user ? `sh-favorites-${user.id}` : "sh-favorites-guest";
    const cartKey = user ? `sh-cart-${user.id}` : "sh-cart-guest";
    const messageSeenKey = user ? `sh-msg-seen-${user.id}` : "sh-msg-seen-guest";
    const fetchMe = async () => {
        if (!token)
            return;
        const json = await api.auth.me(authHeaders());
        if (!json.success)
            return;
        setUser(hydrateUser(json.data));
    };
    const hydrateUser = (user) => {
        const school = localStorage.getItem(`sh-school-${user.username}`);
        return school ? { ...user, school } : user;
    };
    const login = async () => {
        const json = await api.auth.login(loginForm);
        if (!json.success)
            return alert(json.message);
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
        if (!json.success)
            return alert(json.message);
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
        if (json.success)
            setAllProducts(json.data);
    };
    const loadMarket = async () => {
        const json = await api.products.market(authHeaders());
        if (json.success)
            setMarketProducts(json.data);
    };
    const loadMine = async () => {
        const json = await api.products.mine(authHeaders());
        if (json.success)
            setMyProducts(json.data);
    };
    const loadUsers = async () => {
        if (user?.role !== "admin")
            return;
        const json = await api.admin.users(authHeaders());
        if (json.success)
            setAllUsers(json.data);
    };
    const loadDetail = async (id) => {
        const json = await api.products.detail(id, authHeaders());
        if (!json.success)
            return alert(json.message);
        setDetail(json.data);
        const msgJson = await api.messages.byProduct(id, authHeaders());
        if (msgJson.success)
            setMessages(msgJson.data);
    };
    const sendMessage = async () => {
        if (!detail)
            return;
        const content = messageInput.trim();
        const imageData = messageImageFile ? await toBase64(messageImageFile) : "";
        if (!content && !imageData)
            return;
        const finalContent = imageData
            ? content
                ? `${content}\n[图片: ${imageData}]`
                : `[图片: ${imageData}]`
            : content;
        const json = await api.messages.sendToProduct(detail.id, finalContent, authHeaders());
        if (!json.success)
            return alert(json.message);
        setMessageInput("");
        setMessageImageFile(null);
        await loadDetail(detail.id);
    };
    const publish = async () => {
        if (!publishForm.images.length) {
            return alert("请至少选择一张商品图片");
        }
        const payload = {
            title: publishForm.title,
            description: publishForm.description,
            price: Number(publishForm.price),
            category: publishForm.category,
            images: publishForm.images,
            campus: `${publishForm.school}${publishForm.schoolDetail ? ` · ${publishForm.schoolDetail}` : ""}`,
            brand: publishForm.brand || undefined,
            model: publishForm.model || undefined,
            memory: publishForm.memory || undefined,
            latitude: publishForm.latitude,
            longitude: publishForm.longitude,
        };
        const json = await api.products.create(payload, authHeaders());
        if (!json.success)
            return alert(json.message);
        alert("发布成功，等待审核");
        setPublishForm({
            title: "",
            description: "",
            price: 0,
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
    };
    const audit = async (id, action) => {
        const reason = action === "reject" ? prompt("请输入拒绝理由") || "" : "";
        const json = await api.products.audit(id, action, reason, authHeaders());
        if (!json.success)
            return alert(json.message);
        await Promise.all([loadAllForAdmin(), loadMarket()]);
    };
    const toggleStatus = async (id, status) => {
        const json = await api.products.status(id, status, authHeaders());
        if (!json.success)
            return alert(json.message);
        await Promise.all([loadAllForAdmin(), loadMarket()]);
    };
    const reviewAdminUser = async (id, action) => {
        const note = prompt(action === "approve" ? "审核备注（可选）" : "拒绝理由（建议填写）") || "";
        const json = await api.admin.reviewUser(id, action, note, authHeaders());
        if (!json.success)
            return alert(json.message);
        await loadUsers();
    };
    const deleteUser = async (id, username) => {
        if (!confirm(`确认删除账号 ${username}？该操作不可撤销。`))
            return;
        const json = await api.admin.deleteUser(id, authHeaders());
        if (!json.success)
            return alert(json.message);
        await loadUsers();
    };
    const loadAccountDetail = async (id) => {
        const json = await api.admin.userDetail(id, authHeaders());
        if (!json.success)
            return alert(json.message);
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
        if (!accountDetail)
            return;
        const json = await api.admin.saveUser(accountDetail.id, accountForm, authHeaders());
        if (!json.success)
            return alert(json.message);
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
        if (!navigator.geolocation)
            return alert("当前浏览器不支持定位");
        navigator.geolocation.getCurrentPosition((position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            setUserLocation({ latitude, longitude });
            setPublishForm((prev) => ({ ...prev, latitude, longitude }));
        }, () => alert("定位失败，请检查定位权限"));
    };
    const onPublishImagesSelected = async (files) => {
        if (!files || files.length === 0)
            return;
        const imageFiles = Array.from(files).slice(0, 6);
        const images = await Promise.all(imageFiles.map((f) => toBase64(f)));
        setPublishForm((prev) => ({ ...prev, images }));
    };
    const toggleFavorite = (id) => {
        const next = favorites.includes(id)
            ? favorites.filter((x) => x !== id)
            : [...favorites, id];
        setFavorites(next);
        localStorage.setItem(favoritesKey, JSON.stringify(next));
    };
    const toggleCart = (id) => {
        const next = cart.includes(id)
            ? cart.filter((x) => x !== id)
            : [...cart, id];
        setCart(next);
        localStorage.setItem(cartKey, JSON.stringify(next));
    };
    const applyManualLocation = () => {
        const location = PRESET_LOCATIONS.find((loc) => loc.label === manualLocationLabel);
        if (!location)
            return;
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
        if (!token || !user)
            return;
        const json = await api.conversations.list(authHeaders());
        if (json.success)
            setConversations(json.data);
    };
    const openChat = async (target) => {
        setChatTarget(target);
        markMessagesAsSeen();
        const json = await api.conversations.detail(target.userId, authHeaders());
        if (json.success)
            setChatMessages(json.data);
    };
    const loadChatMessages = async (targetUserId) => {
        const json = await api.conversations.detail(targetUserId, authHeaders());
        if (json.success)
            setChatMessages(json.data);
    };
    const sendChatMessage = async () => {
        if (!chatTarget)
            return;
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
            }
            else {
                finalContent = `[图片: ${imageData}]`;
            }
        }
        const json = await api.conversations.send(chatTarget.userId, finalContent, authHeaders());
        if (!json.success)
            return alert(json.message);
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
        }
        catch (error) {
            console.error("Auto scroll error:", error);
        }
    }, [chatMessages]);
    useEffect(() => {
        if (!token || !user)
            return;
        const timer = window.setInterval(() => {
            loadConversations().catch(console.error);
            loadOrders().catch(console.error);
            loadRecommendations().catch(console.error);
            if (detail) {
                loadDetail(detail.id).catch(console.error);
            }
            if (chatTarget) {
                loadChatMessages(chatTarget.userId).catch(console.error);
            }
        }, 5000);
        return () => window.clearInterval(timer);
    }, [token, user, detail?.id, chatTarget?.userId]);
    const contactSeller = async () => {
        if (!detail || !user)
            return;
        if (detail.sellerId === user.id) {
            alert("这是您自己发布的商品，无需联系卖家");
            return;
        }
        setRelatedProduct(detail);
        const targetConv = {
            userId: detail.sellerId,
            username: detail.sellerName,
            lastMessage: "",
            lastTime: new Date().toISOString(),
            unreadCount: 0,
            productId: detail.id,
        };
        await openChat(targetConv);
    };
    const markAsSold = async (product) => {
        if (!confirm(`确认将"${product.title}"标记为已售出？`))
            return;
        const buyerName = prompt("请输入买家昵称（可留空，默认系统模拟成交）")?.trim() ||
            "系统模拟";
        const json = await api.products.soldBySeller(product.id, buyerName, authHeaders());
        if (!json.success)
            return alert(json.message);
        alert("商品已标记为售出");
        await Promise.all([
            loadMine(),
            loadMarket(),
            loadAllForAdmin(),
            loadOrders(),
        ]);
    };
    const buyFromCart = async (product) => {
        if (!user)
            return;
        if (product.sellerId === user.id) {
            alert("不能购买自己发布的商品");
            return;
        }
        if (!confirm(`确认购买 "${product.title}" 吗？`))
            return;
        const json = await api.products.purchase(product.id, authHeaders());
        if (!json.success)
            return alert(json.message);
        alert("下单成功，交易已完成");
        toggleCart(product.id);
        await Promise.all([
            loadMarket(),
            loadMine(),
            loadOrders(),
            loadAllForAdmin(),
        ]);
    };
    const loadOrders = async () => {
        if (!token || !user)
            return;
        const json = await api.orders.list(authHeaders());
        if (json.success) {
            setOrders(json.data);
            setMyPurchases(json.data.filter((o) => o.buyerId === user.id));
            setMySales(json.data.filter((o) => o.sellerId === user.id));
        }
    };
    const loadRecommendations = async () => {
        if (!token || !user)
            return;
        const json = await api.recommendations.list(authHeaders());
        if (json.success)
            setRecommendations(json.data);
    };
    const logout = () => {
        localStorage.removeItem("sh-token");
        localStorage.removeItem("sh-username");
        localStorage.removeItem("sh-password");
        setToken("");
        setUser(null);
        setDetail(null);
        setCart([]);
    };
    const filteredMarket = useMemo(() => {
        const byKeyword = marketProducts.filter((p) => `${p.title}${p.description}${p.campus}`
            .toLowerCase()
            .includes(keyword.toLowerCase()));
        let result = categoryFilter === "all"
            ? byKeyword
            : byKeyword.filter((p) => p.category === categoryFilter);
        if (sortBy === "price-asc") {
            result = [...result].sort((a, b) => a.price - b.price);
        }
        else if (sortBy === "price-desc") {
            result = [...result].sort((a, b) => b.price - a.price);
        }
        else if (sortBy === "time") {
            result = [...result].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        else if (sortBy === "distance" && userLocation) {
            result = [...result].sort((a, b) => distanceKm(userLocation, a) - distanceKm(userLocation, b));
        }
        return result;
    }, [marketProducts, keyword, categoryFilter, sortBy, userLocation]);
    const pagedMarket = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredMarket.slice(start, start + PAGE_SIZE);
    }, [filteredMarket, page]);
    const pageCount = Math.max(1, Math.ceil(filteredMarket.length / PAGE_SIZE));
    const favoriteProducts = marketProducts.filter((p) => favorites.includes(p.id));
    const cartProducts = marketProducts.filter((p) => cart.includes(p.id));
    const adminFilteredProducts = adminProductTab === "all"
        ? allProducts
        : allProducts.filter((p) => p.status === adminProductTab);
    const adminStats = useMemo(() => {
        const count = (status) => allProducts.filter((p) => p.status === status).length;
        return {
            pending: count("pending"),
            approved: count("approved"),
            rejected: count("rejected"),
            offline: count("offline"),
            sold: count("sold"),
        };
    }, [allProducts]);
    const hasUnreadMessages = useMemo(() => {
        if (!conversations.length)
            return false;
        return conversations.some((conv) => conv.lastTime > lastSeenMessageTime);
    }, [conversations, lastSeenMessageTime]);
    useEffect(() => {
        fetchMe();
    }, [token]);
    useEffect(() => {
        if (!token || !user)
            return;
        loadMarket().catch(console.error);
        loadMine().catch(console.error);
        loadConversations().catch(console.error);
        loadOrders().catch(console.error);
        loadRecommendations().catch(console.error);
        if (user.role === "admin") {
            loadAllForAdmin().catch(console.error);
            loadUsers().catch(console.error);
            setActiveTab("manage");
        }
        else {
            setActiveTab("market");
        }
    }, [token, user?.role]);
    useEffect(() => {
        if (!token || !user || userLocation || !navigator.geolocation)
            return;
        navigator.geolocation.getCurrentPosition((position) => {
            setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            });
        }, () => { });
    }, [token, user?.id, userLocation]);
    useEffect(() => {
        if (!user)
            return;
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
        return (_jsx(AuthView, { loginForm: loginForm, regForm: regForm, showRegister: showRegister, strength: strength, setLoginForm: setLoginForm, setRegForm: setRegForm, setShowRegister: setShowRegister, onLogin: login, onRegister: register }));
    }
    return (_jsxs("div", { className: "layout", children: [_jsx(AppSidebar, { user: user, activeTab: activeTab, conversationsCount: conversations.length, hasUnreadMessages: hasUnreadMessages, onTabChange: setActiveTab, onOpenMessages: () => {
                    setActiveTab("messages");
                    loadConversations();
                    markMessagesAsSeen();
                } }), _jsxs("main", { className: "main", children: [activeTab === "market" && (_jsx("header", { className: "page-header", children: _jsxs("div", { className: "page-title", children: ["\u5546\u54C1\u5E7F\u573A", _jsx("span", { className: "page-subtitle", children: "\u73DE\u73C8\u4F18\u9009" })] }) })), activeTab === "cart" && (_jsx("header", { className: "page-header", children: _jsx("div", { className: "page-title", children: "\u6536\u85CF\u4E0E\u8D2D\u7269\u8F66" }) })), activeTab === "profile" && (_jsxs("header", { className: "page-header", children: [_jsx("div", { className: "page-title", children: "\u4E2A\u4EBA\u4E2D\u5FC3" }), _jsx("div", { className: "page-actions", children: _jsx("button", { onClick: logout, children: "\u9000\u51FA\u767B\u5F55" }) })] })), activeTab === "publish" && (_jsx("header", { className: "page-header", children: _jsx("div", { className: "page-title", children: "\u53D1\u5E03\u95F2\u7F6E" }) })), _jsxs("div", { className: activeTab === "messages" ? "content-no-pad" : "content-scroll", children: [activeTab === "market" && (_jsx(MarketTab, { keyword: keyword, setKeyword: setKeyword, categoryFilter: categoryFilter, setCategoryFilter: setCategoryFilter, sortBy: sortBy, setSortBy: setSortBy, userLocation: userLocation, pickCurrentLocation: pickCurrentLocation, pagedMarket: pagedMarket, favorites: favorites, toggleFavorite: toggleFavorite, loadDetail: loadDetail, page: page, pageCount: pageCount, setPage: setPage, recommendations: recommendations, cart: cart, toggleCart: toggleCart })), activeTab === "cart" && (_jsx(CartTab, { favoriteProducts: favoriteProducts, toggleFavorite: toggleFavorite, loadDetail: loadDetail, buyNow: buyFromCart })), activeTab === "profile" && (_jsx(PostProfileTab, { user: user, myProducts: myProducts, markAsSold: markAsSold, loadDetail: loadDetail, mySales: mySales, myPurchases: myPurchases })), activeTab === "publish" && (_jsx(PostPublishTab, { publishForm: publishForm, setPublishForm: setPublishForm, onPublishImagesSelected: onPublishImagesSelected, publish: publish, presetLocations: PRESET_LOCATIONS })), activeTab === "manage" && user.role === "admin" && (_jsx(ManageTab, { adminStats: adminStats, adminProductTab: adminProductTab, setAdminProductTab: setAdminProductTab, allProducts: allProducts, adminFilteredProducts: adminFilteredProducts, audit: audit, toggleStatus: toggleStatus })), activeTab === "accounts" && user.role === "admin" && (_jsx(AccountsTab, { allUsers: allUsers, user: user, loadAccountDetail: loadAccountDetail, reviewAdminUser: reviewAdminUser, deleteUser: deleteUser })), activeTab === "messages" && (_jsx(MessagesTab, { conversations: conversations, lastSeenMessageTime: lastSeenMessageTime, openChat: openChat, chatTarget: chatTarget, relatedProduct: relatedProduct, chatMessages: chatMessages, user: user, chatInput: chatInput, setChatInput: setChatInput, setChatImageFile: setChatImageFile, sendChatMessage: sendChatMessage, buyNow: buyFromCart }))] })] })] }));
}
