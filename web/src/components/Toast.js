import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
let showToastFn;
export function showToast(message, type = "info") {
    if (showToastFn) {
        showToastFn(message, type);
    }
}
export function Toast() {
    const [toast, setToast] = useState({
        visible: false,
        message: "",
        type: "info",
    });
    useEffect(() => {
        showToastFn = (message, type = "info") => {
            setToast({ visible: true, message, type });
        };
    }, []);
    useEffect(() => {
        if (toast.visible) {
            const timer = setTimeout(() => {
                setToast((prev) => ({ ...prev, visible: false }));
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [toast.visible]);
    if (!toast.visible)
        return null;
    const icons = {
        success: "✓",
        error: "✕",
        info: "ℹ",
        warning: "⚠",
    };
    const colors = {
        success: "#22c55e",
        error: "#ef4444",
        info: "#ff5f6d",
        warning: "#f59e0b",
    };
    return (_jsx("div", { className: "toast-overlay", children: _jsxs("div", { className: "toast-container", style: { borderColor: colors[toast.type] }, children: [_jsx("div", { className: "toast-icon", style: { background: colors[toast.type] }, children: icons[toast.type] }), _jsx("p", { className: "toast-message", children: toast.message })] }) }));
}
export function ConfirmModal({ visible, title, message, confirmText = "确认", cancelText = "取消", onConfirm, onCancel, type = "primary", }) {
    if (!visible)
        return null;
    return (_jsx("div", { className: "modal-mask", onClick: onCancel, children: _jsxs("div", { className: "confirm-modal", onClick: (e) => e.stopPropagation(), children: [_jsx("h3", { children: title }), _jsx("p", { children: message }), _jsxs("div", { className: "confirm-actions", children: [_jsx("button", { className: "confirm-cancel", onClick: onCancel, children: cancelText }), _jsx("button", { className: `confirm-btn ${type}`, onClick: () => {
                                onConfirm();
                                onCancel();
                            }, children: confirmText })] })] }) }));
}
