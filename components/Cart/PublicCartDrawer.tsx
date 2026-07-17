import Link from "next/link";
import { useEffect, useState } from "react";
import {
  cartCategoryLabel,
  cartCount,
  cartSubtotal,
  formatCartMoney,
  PublicCartItem,
  readPublicCart,
  removePublicCartItem,
} from "@/lib/publicCart";
import { readStoredAuthToken } from "@/lib/authToken";
import { getStoredCustomer } from "@/services/publicCustomerService";
import { usePublicCartDrawer } from "./PublicCartDrawerContext";
import styles from "@/styles/publicCartDrawer.module.css";

export default function PublicCartDrawer() {
  const { isOpen, closeDrawer } = usePublicCartDrawer();
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refreshCart = () => {
    setItems(readPublicCart());
    setIsLoggedIn(Boolean(readStoredAuthToken() && getStoredCustomer()));
  };

  useEffect(() => {
    refreshCart();
    window.addEventListener("public-cart-updated", refreshCart);
    window.addEventListener("storage", refreshCart);
    window.addEventListener("public-customer-updated", refreshCart);
    return () => {
      window.removeEventListener("public-cart-updated", refreshCart);
      window.removeEventListener("storage", refreshCart);
      window.removeEventListener("public-customer-updated", refreshCart);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    refreshCart();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDrawer();
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeDrawer]);

  const itemCount = cartCount(items);
  const subtotal = cartSubtotal(items);
  const checkoutHref = isLoggedIn ? "/public/cart" : "/public/cart?signin=1";

  const removeItem = (key: string) => {
    setItems(removePublicCartItem(key));
  };

  if (!isOpen) return null;

  return (
    <div className={styles.root} role="presentation">
      <button type="button" className={styles.backdrop} aria-label="Close cart" onClick={closeDrawer} />
      <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div className={styles.header}>
          <h2 className={styles.title}>Cart</h2>
          <button type="button" className={styles.closeBtn} aria-label="Close cart" onClick={closeDrawer}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <p className={styles.emptyState}>Your shopping cart is currently empty.</p>
          ) : (
            <div className={styles.itemList}>
              {items.map((item) => (
                <article key={item.key} className={styles.itemCard}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemBadge}>{cartCategoryLabel(item.category)}</span>
                    <div className={styles.itemTopRow}>
                      <h3 className={styles.itemName}>{item.name}</h3>
                      <span className={styles.itemPrice}>{formatCartMoney(item.price * item.qty)}</span>
                    </div>
                    {item.detail && <p className={styles.itemDetail}>{item.detail}</p>}
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    aria-label={`Remove ${item.name} from cart`}
                    onClick={() => removeItem(item.key)}
                  >
                    <i className="fa-regular fa-trash-can" aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.summaryRow}>
            <span>{itemCount} item{itemCount === 1 ? "" : "s"}</span>
            <span>
              Subtotal <strong>{formatCartMoney(subtotal)}</strong>
            </span>
          </div>

          <Link href={checkoutHref} className={styles.checkoutBtn} onClick={closeDrawer}>
            {isLoggedIn ? "Checkout" : "Sign In & Checkout"}
          </Link>

          <button type="button" className={styles.browseBtn} onClick={closeDrawer}>
            Keep Browsing
          </button>

          
        </div>
      </aside>
    </div>
  );
}
