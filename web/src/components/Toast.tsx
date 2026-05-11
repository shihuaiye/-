import { useEffect, useState } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

let showToastFn: (message: string, type?: ToastType) => void;

export function showToast(message: string, type: ToastType = "info") {
  if (showToastFn) {
    showToastFn(message, type);
  }
}

export function Toast() {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    showToastFn = (message: string, type: ToastType = "info") => {
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

  if (!toast.visible) return null;

  const icons: Record<ToastType, string> = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  };

  const colors: Record<ToastType, string> = {
    success: "#22c55e",
    error: "#ef4444",
    info: "#ff5f6d",
    warning: "#f59e0b",
  };

  return (
    <div className="toast-overlay">
      <div className="toast-container" style={{ borderColor: colors[toast.type] }}>
        <div
          className="toast-icon"
          style={{ background: colors[toast.type] }}
        >
          {icons[toast.type]}
        </div>
        <p className="toast-message">{toast.message}</p>
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "primary";
}

export function ConfirmModal({
  visible,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  onConfirm,
  onCancel,
  type = "primary",
}: ConfirmModalProps) {
  if (!visible) return null;

  return (
    <div className="modal-mask" onClick={onCancel}>
      <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button className="confirm-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            className={`confirm-btn ${type}`}
            onClick={() => {
              onConfirm();
              onCancel();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
