import { addPublicCartItem } from "@/lib/publicCart";
import { getAddToCartBlockReason } from "@/lib/publicCartAccess";
import { toast } from "@/lib/toast";
import {
  formatWebDesignSetupDetail,
  type WebDesignSetupSelection,
} from "@/lib/webDesignSetup";

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
      key: `service:Agency Web Design:${selection.packageName}`,
      name: selection.packageName,
      price: selection.packagePrice,
      qty: 1,
      category: "Agency Web Design",
      detail: formatWebDesignSetupDetail(selection),
    });
    toast.cartAdded(selection.packageName);
  };

  return { addToCart, addWebDesignSetupToCart };
}