const API = "http://localhost:3100/api";
async function request(path, init) {
    const res = await fetch(`${API}${path}`, init);
    return res.json();
}
export const api = {
    auth: {
        me: (headers) => request("/auth/me", { headers }),
        login: (payload) => request("/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),
        register: (payload) => request("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        }),
    },
    products: {
        all: (headers) => request("/products?mode=all", { headers }),
        market: (headers) => request("/products", { headers }),
        mine: (headers) => request("/products?mode=mine", { headers }),
        detail: (id, headers) => request(`/products/${id}`, { headers }),
        create: (payload, headers) => request("/products", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(payload),
        }),
        audit: (id, action, reason, headers) => request(`/products/${id}/audit`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ action, reason }),
        }),
        status: (id, status, headers) => request(`/products/${id}/status`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ status }),
        }),
        soldBySeller: (id, buyerName, headers) => request(`/products/${id}/sold`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ buyerName }),
        }),
        purchase: (id, headers) => request(`/products/${id}/purchase`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
        }),
    },
    messages: {
        byProduct: (id, headers) => request(`/products/${id}/messages`, { headers }),
        sendToProduct: (id, content, headers) => request(`/products/${id}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ content }),
        }),
    },
    conversations: {
        list: (headers) => request("/conversations", { headers }),
        detail: (userId, headers) => request(`/conversations/${userId}`, { headers }),
        send: (userId, content, headers) => request(`/conversations/${userId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ content }),
        }),
    },
    admin: {
        users: (headers) => request("/admin/users", { headers }),
        userDetail: (id, headers) => request(`/admin/users/${id}`, { headers }),
        saveUser: (id, payload, headers) => request(`/admin/users/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify(payload),
        }),
        reviewUser: (id, action, note, headers) => request(`/admin/users/${id}/review`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...headers },
            body: JSON.stringify({ action, note }),
        }),
        deleteUser: (id, headers) => request(`/admin/users/${id}`, { method: "DELETE", headers }),
    },
    orders: {
        list: (headers) => request("/orders", { headers }),
    },
    recommendations: {
        list: (headers) => request("/recommendations", { headers }),
    },
};
