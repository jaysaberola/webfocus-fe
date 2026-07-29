import { addPublicCartItem } from "@/lib/publicCart";
import { toast } from "@/lib/toast";
import {
  formatWebDesignSetupDetail,
  type WebDesignSetupSelection,
} from "@/lib/webDesignSetup";

export function useServiceCart() {
  const addToCart = (
    name: string,
    price: number,
    category = "Service",
    detail?: string
  ) => {
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