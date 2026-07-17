import { addPublicCartItem } from "@/lib/publicCart";
import { toast } from "@/lib/toast";

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

  return { addToCart };
}
