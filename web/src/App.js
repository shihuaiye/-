import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
const API = "http://localhost:3100/api";
const PAGE_SIZE = 6;
const passwordStrength = (pwd) => {
    let score = 0;
    if (pwd.length >= 8)
        score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd))
        score++;
    if (/\d/.test(pwd))
        score++;
    if (/[^A-Za-z0-9]/.test(pwd))
        score++;
    if (score <= 1)
        return { label: "弱", color: "#dc2626", pass: false };
    if (score <= 2)
        return { label: "中", color: "#f59e0b", pass: true };
    return { label: "强", color: "#16a34a", pass: true };
};
export function App() {
    const [token, setToken] = useState(localStorage.getItem("sh-token") || "");
    const [user, setUser] = useState(null);
    const [allProducts, setAllProducts] = useState([]);
    const [marketProducts, setMarketProducts] = useState([]);
    const [myProducts, setMyProducts] = useState([]);
    const [activeTab, setActiveTab] = useState("market");
    const [detail, setDetail] = useState(null);
    const [showRegister, setShowRegister] = useState(false);
    const [favorites, setFavorites] = useState(JSON.parse(localStorage.getItem("sh-favorites") || "[]"));
    const [keyword, setKeyword] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [loginForm, setLoginForm] = useState({ username: "", password: "" });
    const [regForm, setRegForm] = useState({
        username: "",
        password: "",
        role: "user",
        adminCode: "",
    });
    const [publishForm, setPublishForm] = useState({
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
    const authHeaders = () => (token ? { Authorization: `Bearer ${token}` } : {});
    const fetchMe = async () => {
        if (!token)
            return;
        const res = await fetch(`${API}/auth/me`, { headers: authHeaders() });
        const json = await res.json();
        if (!json.success)
            return;
        setUser(json.data);
    };
    const login = async () => {
        const res = await fetch(`${API}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(loginForm),
        });
        const json = await res.json();
        if (!json.success)
            return alert(json.message);
        setToken(json.data.token);
        setUser(json.data.user);
        localStorage.setItem("sh-token", json.data.token);
    };
    const register = async () => {
        const strength = passwordStrength(regForm.password);
        if (!strength.pass)
            return alert("密码强度过弱，请至少满足8位并包含数字/字母组合");
        const res = await fetch(`${API}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(regForm),
        });
        const json = await res.json();
        if (!json.success)
            return alert(json.message);
        alert("注册成功，请使用新账号登录");
        setShowRegister(false);
        setRegForm({ username: "", password: "", role: "user", adminCode: "" });
    };
    const loadAllForAdmin = async () => {
        const res = await fetch(`${API}/products?mode=all`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success)
            setAllProducts(json.data);
    };
    const loadMarket = async () => {
        const res = await fetch(`${API}/products`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success)
            setMarketProducts(json.data);
    };
    const loadMine = async () => {
        const res = await fetch(`${API}/products?mode=mine`, { headers: authHeaders() });
        const json = await res.json();
        if (json.success)
            setMyProducts(json.data);
    };
    const loadDetail = async (id) => {
        const res = await fetch(`${API}/products/${id}`, { headers: authHeaders() });
        const json = await res.json();
        if (!json.success)
            return alert(json.message);
        setDetail(json.data);
    };
    const publish = async () => {
        const images = publishForm.imagesText.split("\n").map((s) => s.trim()).filter(Boolean);
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
        if (!json.success)
            return alert(json.message);
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
    const audit = async (id, action) => {
        const reason = action === "reject" ? prompt("请输入拒绝理由") || "" : "";
        const res = await fetch(`${API}/products/${id}/audit`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ action, reason }),
        });
        const json = await res.json();
        if (!json.success)
            return alert(json.message);
        await Promise.all([loadAllForAdmin(), loadMarket()]);
    };
    const toggleStatus = async (id, status) => {
        const res = await fetch(`${API}/products/${id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ status }),
        });
        const json = await res.json();
        if (!json.success)
            return alert(json.message);
        await Promise.all([loadAllForAdmin(), loadMarket()]);
    };
    const toggleFavorite = (id) => {
        const next = favorites.includes(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
        setFavorites(next);
        localStorage.setItem("sh-favorites", JSON.stringify(next));
    };
    const logout = () => {
        localStorage.removeItem("sh-token");
        setToken("");
        setUser(null);
        setDetail(null);
    };
    const filteredMarket = useMemo(() => {
        const byKeyword = marketProducts.filter((p) => `${p.title}${p.description}${p.campus}`.toLowerCase().includes(keyword.toLowerCase()));
        if (categoryFilter === "all")
            return byKeyword;
        return byKeyword.filter((p) => p.category === categoryFilter);
    }, [marketProducts, keyword, categoryFilter]);
    const pagedMarket = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return filteredMarket.slice(start, start + PAGE_SIZE);
    }, [filteredMarket, page]);
    const pageCount = Math.max(1, Math.ceil(filteredMarket.length / PAGE_SIZE));
    const adminStats = useMemo(() => {
        const count = (status) => allProducts.filter((p) => p.status === status).length;
        return { pending: count("pending"), approved: count("approved"), rejected: count("rejected"), offline: count("offline") };
    }, [allProducts]);
    useEffect(() => {
        fetchMe();
    }, [token]);
    useEffect(() => {
        if (!token || !user)
            return;
        loadMarket();
        loadMine();
        if (user.role === "admin") {
            loadAllForAdmin();
            setActiveTab("manage");
        }
        else {
            setActiveTab("market");
        }
    }, [token, user?.role]);
    useEffect(() => {
        setPage(1);
    }, [keyword, categoryFilter]);
    if (!token || !user) {
        const strength = passwordStrength(regForm.password);
        return (_jsxs("div", { className: "layout-auth", children: [_jsxs("div", { className: "auth-card", children: [_jsx("h1", { children: "\u6821\u56ED\u4E8C\u624B\u4EA4\u6613\u5E73\u53F0" }), _jsx("p", { children: "\u6F14\u793A\u8D26\u53F7\uFF1Aadmin / admin123\uFF0C\u666E\u901A\u7528\u6237\uFF1Auser01 / user123" }), _jsx("input", { placeholder: "\u7528\u6237\u540D", value: loginForm.username, onChange: (e) => setLoginForm({ ...loginForm, username: e.target.value }) }), _jsx("input", { type: "password", placeholder: "\u5BC6\u7801", value: loginForm.password, onChange: (e) => setLoginForm({ ...loginForm, password: e.target.value }) }), _jsxs("div", { className: "row", children: [_jsx("button", { onClick: login, children: "\u767B\u5F55" }), _jsx("button", { className: "ghost", onClick: () => setShowRegister(true), children: "\u53BB\u6CE8\u518C" })] })] }), showRegister && (_jsx("div", { className: "modal-mask", onClick: () => setShowRegister(false), children: _jsxs("div", { className: "modal-card", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: "\u6CE8\u518C\u8D26\u53F7" }), _jsx("input", { placeholder: "\u7528\u6237\u540D", value: regForm.username, onChange: (e) => setRegForm({ ...regForm, username: e.target.value }) }), _jsx("input", { type: "password", placeholder: "\u5BC6\u7801", value: regForm.password, onChange: (e) => setRegForm({ ...regForm, password: e.target.value }) }), _jsxs("p", { style: { color: strength.color, margin: "0 0 10px" }, children: ["\u5BC6\u7801\u5F3A\u5EA6\uFF1A", strength.label] }), _jsxs("select", { value: regForm.role, onChange: (e) => setRegForm({ ...regForm, role: e.target.value }), children: [_jsx("option", { value: "user", children: "\u666E\u901A\u7528\u6237" }), _jsx("option", { value: "admin", children: "\u7BA1\u7406\u5458" })] }), regForm.role === "admin" && (_jsx("input", { placeholder: "\u7BA1\u7406\u5458\u6743\u9650\u7801", value: regForm.adminCode, onChange: (e) => setRegForm({ ...regForm, adminCode: e.target.value }) })), _jsxs("div", { className: "row", children: [_jsx("button", { onClick: register, children: "\u786E\u8BA4\u6CE8\u518C" }), _jsx("button", { className: "ghost", onClick: () => setShowRegister(false), children: "\u53D6\u6D88" })] })] }) }))] }));
    }
    return (_jsxs("div", { className: "layout", children: [_jsxs("aside", { className: "sider", children: [_jsx("h2", { children: "Campus Market" }), _jsx("button", { className: activeTab === "market" ? "menu active" : "menu", onClick: () => setActiveTab("market"), children: "\u5546\u54C1\u5C55\u793A" }), _jsx("button", { className: activeTab === "mine" ? "menu active" : "menu", onClick: () => setActiveTab("mine"), children: "\u53D1\u5E03/\u6211\u7684\u5546\u54C1" }), user.role === "admin" && _jsx("button", { className: activeTab === "manage" ? "menu active" : "menu", onClick: () => setActiveTab("manage"), children: "\u5BA1\u6838\u7BA1\u7406" })] }), _jsxs("main", { className: "main", children: [_jsxs("header", { className: "topbar", children: [_jsxs("div", { children: ["\u5F53\u524D\u7528\u6237\uFF1A", user.username, "\uFF08", user.role === "admin" ? "管理员" : "普通用户", "\uFF09"] }), _jsx("button", { onClick: logout, children: "\u9000\u51FA\u767B\u5F55" })] }), activeTab === "market" && (_jsxs(_Fragment, { children: [_jsx("section", { className: "card", children: _jsxs("div", { className: "row wrap", children: [_jsx("h3", { children: "\u5546\u54C1\u5E7F\u573A" }), _jsx("input", { className: "search", placeholder: "\u641C\u7D22\u5546\u54C1", value: keyword, onChange: (e) => setKeyword(e.target.value) }), _jsxs("select", { className: "category", value: categoryFilter, onChange: (e) => setCategoryFilter(e.target.value), children: [_jsx("option", { value: "all", children: "\u5168\u90E8\u5206\u7C7B" }), _jsx("option", { value: "digital", children: "\u6570\u7801" }), _jsx("option", { value: "book", children: "\u4E66\u7C4D" }), _jsx("option", { value: "daily", children: "\u65E5\u7528" }), _jsx("option", { value: "ticket", children: "\u7968\u5238" }), _jsx("option", { value: "other", children: "\u5176\u4ED6" })] })] }) }), _jsx("section", { className: "grid", children: pagedMarket.map((p) => (_jsxs("article", { className: "product-card", children: [_jsx("img", { src: p.images?.[0], alt: p.title, className: "thumb" }), _jsxs("div", { className: "row", children: [_jsx("h4", { children: p.title }), _jsx("button", { className: favorites.includes(p.id) ? "small fav active" : "small fav", onClick: () => toggleFavorite(p.id), children: favorites.includes(p.id) ? "已收藏" : "收藏" })] }), _jsxs("p", { className: "muted", children: [p.description.slice(0, 52), "..."] }), _jsxs("div", { className: "row", children: [_jsxs("strong", { children: ["\u00A5", p.price] }), _jsx("span", { children: p.campus })] }), _jsxs("div", { className: "meta", children: ["\u53D1\u5E03\u65F6\u95F4\uFF1A", new Date(p.createdAt).toLocaleDateString("zh-CN")] }), _jsxs("div", { className: "seller-block", children: ["\u5356\u5BB6\uFF1A", p.sellerName] }), _jsx("button", { className: "small", onClick: () => loadDetail(p.id), children: "\u67E5\u770B\u8BE6\u60C5" })] }, p.id))) }), _jsxs("section", { className: "card pagination", children: [_jsx("button", { className: "ghost", disabled: page <= 1, onClick: () => setPage((x) => Math.max(1, x - 1)), children: "\u4E0A\u4E00\u9875" }), _jsxs("span", { children: ["\u7B2C ", page, " / ", pageCount, " \u9875"] }), _jsx("button", { className: "ghost", disabled: page >= pageCount, onClick: () => setPage((x) => Math.min(pageCount, x + 1)), children: "\u4E0B\u4E00\u9875" })] })] })), activeTab === "mine" && (_jsxs(_Fragment, { children: [_jsxs("section", { className: "card", children: [_jsx("h3", { children: "\u53D1\u5E03\u5546\u54C1" }), _jsx("input", { placeholder: "\u6807\u9898", value: publishForm.title, onChange: (e) => setPublishForm({ ...publishForm, title: e.target.value }) }), _jsx("textarea", { placeholder: "\u4ECB\u7ECD", value: publishForm.description, onChange: (e) => setPublishForm({ ...publishForm, description: e.target.value }) }), _jsxs("div", { className: "row", children: [_jsx("input", { type: "number", placeholder: "\u4EF7\u683C", value: publishForm.price, onChange: (e) => setPublishForm({ ...publishForm, price: Number(e.target.value) }) }), _jsx("input", { placeholder: "\u4EA4\u6613\u5730\u70B9/\u6821\u533A", value: publishForm.campus, onChange: (e) => setPublishForm({ ...publishForm, campus: e.target.value }) })] }), _jsxs("select", { value: publishForm.category, onChange: (e) => setPublishForm({ ...publishForm, category: e.target.value }), children: [_jsx("option", { value: "daily", children: "\u65E5\u7528" }), _jsx("option", { value: "digital", children: "\u6570\u7801" }), _jsx("option", { value: "book", children: "\u4E66\u7C4D" }), _jsx("option", { value: "ticket", children: "\u7968\u5238" }), _jsx("option", { value: "other", children: "\u5176\u4ED6" })] }), _jsx("textarea", { placeholder: "\u5546\u54C1\u56FE\u7247URL\uFF08\u53EF\u591A\u5F20\uFF0C\u6BCF\u884C\u4E00\u5F20\uFF09", value: publishForm.imagesText, onChange: (e) => setPublishForm({ ...publishForm, imagesText: e.target.value }) }), publishForm.category === "digital" && (_jsxs("div", { className: "row", children: [_jsx("input", { placeholder: "\u54C1\u724C\uFF08\u5FC5\u586B\uFF09", value: publishForm.brand, onChange: (e) => setPublishForm({ ...publishForm, brand: e.target.value }) }), _jsx("input", { placeholder: "\u578B\u53F7\uFF08\u5FC5\u586B\uFF09", value: publishForm.model, onChange: (e) => setPublishForm({ ...publishForm, model: e.target.value }) }), _jsx("input", { placeholder: "\u5185\u5B58\u5BB9\u91CF\uFF08\u5FC5\u586B\uFF09", value: publishForm.memory, onChange: (e) => setPublishForm({ ...publishForm, memory: e.target.value }) })] })), _jsx("button", { onClick: publish, children: "\u63D0\u4EA4\u5BA1\u6838" })] }), _jsxs("section", { className: "card", children: [_jsx("h3", { children: "\u6211\u7684\u5546\u54C1" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6807\u9898" }), _jsx("th", { children: "\u4EF7\u683C" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u62D2\u7EDD\u539F\u56E0" })] }) }), _jsx("tbody", { children: myProducts.map((p) => (_jsxs("tr", { children: [_jsx("td", { children: p.title }), _jsxs("td", { children: ["\u00A5", p.price] }), _jsx("td", { children: p.status }), _jsx("td", { children: p.rejectionReason || "-" })] }, p.id))) })] })] })] })), activeTab === "manage" && user.role === "admin" && (_jsxs(_Fragment, { children: [_jsxs("section", { className: "stats", children: [_jsxs("div", { className: "stat", children: ["\u5F85\u5BA1\u6838 ", _jsx("b", { children: adminStats.pending })] }), _jsxs("div", { className: "stat", children: ["\u5DF2\u901A\u8FC7 ", _jsx("b", { children: adminStats.approved })] }), _jsxs("div", { className: "stat", children: ["\u5DF2\u62D2\u7EDD ", _jsx("b", { children: adminStats.rejected })] }), _jsxs("div", { className: "stat", children: ["\u5DF2\u4E0B\u7EBF ", _jsx("b", { children: adminStats.offline })] })] }), _jsxs("section", { className: "card", children: [_jsx("h3", { children: "\u5BA1\u6838\u7BA1\u7406" }), _jsxs("table", { children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { children: "\u6807\u9898" }), _jsx("th", { children: "\u5206\u7C7B" }), _jsx("th", { children: "\u4EF7\u683C" }), _jsx("th", { children: "\u72B6\u6001" }), _jsx("th", { children: "\u62D2\u7EDD\u539F\u56E0" }), _jsx("th", { children: "\u64CD\u4F5C" })] }) }), _jsx("tbody", { children: allProducts.map((p) => (_jsxs("tr", { children: [_jsx("td", { children: p.title }), _jsx("td", { children: p.category }), _jsxs("td", { children: ["\u00A5", p.price] }), _jsx("td", { children: p.status }), _jsx("td", { children: p.rejectionReason || "-" }), _jsxs("td", { children: [p.status === "pending" && (_jsxs(_Fragment, { children: [_jsx("button", { className: "small", onClick: () => audit(p.id, "approve"), children: "\u901A\u8FC7" }), _jsx("button", { className: "small danger", onClick: () => audit(p.id, "reject"), children: "\u62D2\u7EDD" })] })), p.status === "approved" && _jsx("button", { className: "small danger", onClick: () => toggleStatus(p.id, "offline"), children: "\u4E0B\u7EBF" }), p.status === "offline" && _jsx("button", { className: "small", onClick: () => toggleStatus(p.id, "approved"), children: "\u6062\u590D" })] })] }, p.id))) })] })] })] })), detail && (_jsx("div", { className: "modal-mask", onClick: () => setDetail(null), children: _jsxs("div", { className: "detail-modal", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: detail.title }), _jsx("div", { className: "detail-images", children: detail.images.map((img, i) => _jsx("img", { src: img, alt: `图片${i + 1}` }, i)) }), _jsx("p", { children: detail.description }), _jsxs("p", { children: [_jsx("b", { children: "\u4EF7\u683C\uFF1A" }), "\u00A5", detail.price] }), _jsxs("p", { children: [_jsx("b", { children: "\u5730\u70B9\uFF1A" }), detail.campus] }), _jsxs("p", { children: [_jsx("b", { children: "\u5356\u5BB6\uFF1A" }), detail.sellerName] }), _jsxs("p", { children: [_jsx("b", { children: "\u53D1\u5E03\u65F6\u95F4\uFF1A" }), new Date(detail.createdAt).toLocaleString("zh-CN")] }), detail.category === "digital" && (_jsxs("p", { children: [_jsx("b", { children: "\u89C4\u683C\uFF1A" }), detail.brand, " / ", detail.model, " / ", detail.memory] })), _jsxs("div", { className: "row", children: [_jsx("button", { className: favorites.includes(detail.id) ? "small fav active" : "small fav", onClick: () => toggleFavorite(detail.id), children: favorites.includes(detail.id) ? "取消收藏" : "收藏商品" }), _jsx("button", { className: "ghost", onClick: () => setDetail(null), children: "\u5173\u95ED" })] })] }) }))] })] }));
}
