import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  cartCategoryLabel,
  cartCount,
  formatCartItemPrice,
  formatCartSubtotalLabel,
  PublicCartItem,
  readPublicCart,
  removePublicCartItem,
} from "@/lib/publicCart";
import { canUsePublicCart, getStaffCartBlockReason } from "@/lib/publicCartAccess";
import { usePublicCartDrawer } from "./PublicCartDrawerContext";
import styles from "@/styles/publicCartDrawer.module.css";

export default function PublicCartDrawer() {
  const router = useRouter();
  const { isOpen, closeDrawer } = usePublicCartDrawer();
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const refreshCart = () => {
    setItems(readPublicCart());
    setIsLoggedIn(canUsePublicCart());
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
    document.body.classList.add("public-cart-drawer-open");
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.classList.remove("public-cart-drawer-open");
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, closeDrawer]);

  const itemCount = cartCount(items);
  const checkoutHref = isLoggedIn ? "/public/cart" : "/public/cart?signin=1";
  const browseHref =
    router.pathname === "/public/services"
      ? router.asPath || "/public/services"
      : router.pathname.startsWith("/public/product")
        ? "/public/products"
        : "/public/services";
  const staffBlockReason = getStaffCartBlockReason();

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
                      <span className={styles.itemPrice}>{formatCartItemPrice(item)}</span>
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
              Subtotal <strong>{formatCartSubtotalLabel(items)}</strong>
            </span>
          </div>

          {staffBlockReason && items.length > 0 ? (
            <p className={styles.emptyState}>{staffBlockReason}</p>
          ) : null}

          {staffBlockReason ? (
            <button
              type="button"
              className={styles.checkoutBtn}
              onClick={() => {
                window.alert(staffBlockReason);
                closeDrawer();
              }}
            >
              Cart Unavailable for Staff
            </button>
          ) : (
            <Link href={checkoutHref} className={styles.checkoutBtn} onClick={closeDrawer}>
              {isLoggedIn ? "Checkout" : "Sign In & Checkout"}
            </Link>
          )}

          <Link
            href={browseHref}
            className={styles.browseBtn}
            onClick={closeDrawer}
          >
            Keep Browsing
          </Link>

          
        </div>
      </aside>
    </div>
  );
}
