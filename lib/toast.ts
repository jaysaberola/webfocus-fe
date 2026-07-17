export type ToastType = "success" | "danger" | "warning" | "info";
export type ToastVariant = "default" | "cart";

type ToastPayload = {
  message: string;
  type: ToastType;
  variant?: ToastVariant;
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
};
