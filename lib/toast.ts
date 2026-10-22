export type ToastType = "success" | "danger" | "warning" | "info";
export type ToastVariant = "default" | "cart" | "inbox";

export type InboxToastPriority = "default" | "warning" | "critical";

export type ToastPayload = {
  message: string;
  type: ToastType;
  variant?: ToastVariant;
  title?: string;
  body?: string;
  onClick?: () => void;
  inboxPriority?: InboxToastPriority;
  actionLabel?: string;
  unreadCount?: number;
};

type Listener = (toast: ToastPayload) => void;

class ToastEmitter {
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  emit(toast: ToastPayload) {
    this.listeners.forEach((listener) => listener(toast));
  }
}

export const toastEmitter = new ToastEmitter();

/* =======================
   Global Toast API
======================= */

export const toast = {
  success(message: string) {
    toastEmitter.emit({ message, type: "success" });
  },
  error(message: string) {
    toastEmitter.emit({ message, type: "danger" });
  },
  warning(message: string) {
    toastEmitter.emit({ message, type: "warning" });
  },
  info(message: string) {
    toastEmitter.emit({ message, type: "info" });
  },
  cartAdded(productName: string) {
    toastEmitter.emit({
      message: `Added ${productName.toUpperCase()} to cart!`,
      type: "success",
      variant: "cart",
    });
  },
  inbox(payload: {
    title: string;
    body?: string;
    onClick?: () => void;
    priority?: InboxToastPriority;
    actionLabel?: string;
    unreadCount?: number;
  }) {
    const title = String(payload.title || "New notification").trim() || "New notification";
    const body = String(payload.body || "").trim();
    const priority = payload.priority ?? "default";
    const type: ToastType =
      priority === "critical" ? "danger" : priority === "warning" ? "warning" : "info";
    toastEmitter.emit({
      message: body || title,
      type,
      variant: "inbox",
      title,
      body,
      onClick: payload.onClick,
      inboxPriority: priority,
      actionLabel: payload.actionLabel,
      unreadCount: payload.unreadCount,
    });
  },
};
