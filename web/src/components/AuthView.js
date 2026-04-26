import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function AuthView({ loginForm, regForm, showRegister, strength, setLoginForm, setRegForm, setShowRegister, onLogin, onRegister, }) {
    return (_jsxs("div", { className: "layout-auth", children: [_jsxs("div", { className: "auth-card", children: [_jsx("h1", { children: "\u6821\u56ED\u4E8C\u624B\u4EA4\u6613\u5E73\u53F0" }), _jsx("p", { children: "\u6F14\u793A\u8D26\u53F7\uFF1Aadmin / admin123\uFF0C\u666E\u901A\u7528\u6237\uFF1Auser01 / user123" }), _jsx("input", { placeholder: "\u7528\u6237\u540D", value: loginForm.username, onChange: (e) => {
                            const username = e.target.value;
                            setLoginForm({
                                username,
                                password: username.trim() ? loginForm.password : "",
                            });
                            if (!username.trim()) {
                                localStorage.removeItem("sh-password");
                            }
                        } }), _jsx("input", { type: "password", placeholder: "\u5BC6\u7801", value: loginForm.password, onChange: (e) => setLoginForm({ ...loginForm, password: e.target.value }) }), _jsxs("div", { className: "row", children: [_jsx("button", { onClick: onLogin, children: "\u767B\u5F55" }), _jsx("button", { className: "ghost", onClick: () => setShowRegister(true), children: "\u53BB\u6CE8\u518C" }), _jsx("button", { className: "ghost danger", onClick: () => {
                                    setLoginForm({ username: "", password: "" });
                                    localStorage.removeItem("sh-username");
                                    localStorage.removeItem("sh-password");
                                }, children: "\u6E05\u9664" })] })] }), showRegister && (_jsx("div", { className: "modal-mask", onClick: () => setShowRegister(false), children: _jsxs("div", { className: "modal-card", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: "\u6CE8\u518C\u8D26\u53F7" }), _jsx("input", { placeholder: "\u7528\u6237\u540D", value: regForm.username, onChange: (e) => setRegForm({ ...regForm, username: e.target.value }) }), _jsx("input", { type: "password", placeholder: "\u5BC6\u7801", value: regForm.password, onChange: (e) => setRegForm({ ...regForm, password: e.target.value }) }), _jsxs("p", { style: { color: strength.color, margin: "0 0 10px" }, children: ["\u5BC6\u7801\u5F3A\u5EA6\uFF1A", strength.label] }), _jsxs("select", { value: regForm.role, onChange: (e) => setRegForm({ ...regForm, role: e.target.value }), children: [_jsx("option", { value: "user", children: "\u666E\u901A\u7528\u6237" }), _jsx("option", { value: "admin", children: "\u7BA1\u7406\u5458\uFF08\u9700\u5BA1\u6838\uFF09" })] }), _jsxs("div", { className: "row", children: [_jsx("button", { onClick: onRegister, children: "\u786E\u8BA4\u6CE8\u518C" }), _jsx("button", { className: "ghost", onClick: () => setShowRegister(false), children: "\u53D6\u6D88" })] })] }) }))] }));
}
