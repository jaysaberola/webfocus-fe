import { addPublicCartItem } from "@/lib/publicCart";
import { canUsePublicCart, getAddToCartBlockReason } from "@/lib/publicCartAccess";
import { toast } from "@/lib/toast";
import {
  buildWebDesignMeta,
  formatWebDesignSetupDetail,
  type WebDesignSetupSelection,
} from "@/lib/webDesignSetup";

const WEB_DESIGN_AUTH_REDIRECT = `/public/login?redirect=${encodeURIComponent("/public/cart")}&intent=webdesign`;

export function useServiceCart() {
  const guardCartAccess = () => {
    const reason = getAddToCartBlockReason();
    if (reason) {
      toast.info(reason);
      return false;
    }
    return true;
  };

  const addToCart = (
    name: string,
    price: number,
    category = "Service",
    detail?: string
  ) => {
    if (!guardCartAccess()) return;

    addPublicCartItem({
      key: `service:${category}:${name}`,
      name,
      price,
      qty: 1,
      category,
      detail,
    });
    toast.cartAdded(name);
  };

  const addWebDesignSetupToCart = (selection: WebDesignSetupSelection) => {
    if (!guardCartAccess()) return;

    addPublicCartItem({
      key: `service:Agency Web Design:${selection.packageName}:${selection.templateId || selection.templateLabel || "package"}`,
      name: selection.packageName,
      price: 0,
      qty: 1,
      category: "Agency Web Design",
      detail: formatWebDesignSetupDetail(selection),
      webDesign: buildWebDesignMeta(selection),
      pricingStatus: "pending_quotation",
      clientNotes: String(selection.clientNotes || "").trim() || undefined,
    });
    toast.cartAdded(selection.packageName);

    // Guests must sign in / create a Client account before continuing the quotation flow.
    if (!canUsePublicCart() && typeof window !== "undefined") {
      toast.info(
        "Sign in or create a Client account to continue. Your web design package is saved in the cart as Pending Quotation."
      );
      window.location.assign(WEB_DESIGN_AUTH_REDIRECT);
    }
  };

  return { addToCart, addWebDesignSetupToCart };
}
