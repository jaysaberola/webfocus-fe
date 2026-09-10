import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  cartCategoryLabel,
  cartCount,
  formatCartItemPrice,
  formatCartSubtotalLabel,
  isPendingQuotationCartItem,
  PublicCartItem,
  readPublicCart,
  removePublicCartItem,
} from "@/lib/publicCart";
import {
  resolveWebDesignCartMeta,
  webDesignAdditionalServicesLabel,
} from "@/lib/webDesignSetup";
import { canUsePublicCart, getStaffCartBlockReason } from "@/lib/publicCartAccess";
import { usePublicCartDrawer } from "./PublicCartDrawerContext";
import styles from "@/styles/publicCartDrawer.module.css";

function cartItemTitle(item: PublicCartItem) {
  const meta = resolveWebDesignCartMeta(item);
  if (meta?.templateLabel) return `${meta.templateLabel} · ${item.name}`;
  return item.name;
}

function cartItemMetaLines(item: PublicCartItem) {
  const meta = resolveWebDesignCartMeta(item);
  const lines: string[] = [];

  if (meta) {
    if (meta.packageName && meta.packageName !== item.name) {
      lines.push(meta.packageName);
    } else if (item.category) {
      const label = cartCategoryLabel(item.category);
      if (label && label.toLowerCase() !== "design") {
        lines.push(label);
      } else {
        lines.push("Agency Web Design");
      }
    } else {
      lines.push("Agency Web Design");
    }
    if (meta.templateLabel) lines.push(`Template: ${meta.templateLabel}`);
    const extras = webDesignAdditionalServicesLabel(meta);
    if (extras) lines.push(`Add-ons: ${extras}`);
    return lines;
  }

  if (item.category) {
    const label = cartCategoryLabel(item.category);
    if (label) lines.push(label);
  }
  if (item.qty > 1) lines.push(`Qty: ${item.qty}`);
  return lines;
}

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
          <div>
            <h2 className={styles.title}>Cart</h2>
            {itemCount > 0 ? (
              <p className={styles.subtitle}>
                {itemCount} item{itemCount === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          <button type="button" className={styles.closeBtn} aria-label="Close cart" onClick={closeDrawer}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.body}>
          {items.length === 0 ? (
            <div className={styles.emptyWrap}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <i className="fa-solid fa-bag-shopping" />
              </span>
              <p className={styles.emptyState}>Your shopping cart is currently empty.</p>
              <p className={styles.emptyHint}>Browse services to add packages to your cart.</p>
            </div>
          ) : (
            <div className={styles.itemList}>
              {items.map((item) => {
                const pending = isPendingQuotationCartItem(item);
                const metaLines = cartItemMetaLines(item);
                return (
                  <article key={item.key} className={styles.itemCard}>
                    <div className={styles.itemHead}>
                      <span className={styles.itemBadge}>{cartCategoryLabel(item.category)}</span>
                      <button
                        type="button"
                        className={styles.removeBtn}
                        aria-label={`Remove ${item.name} from cart`}
                        onClick={() => removeItem(item.key)}
                      >
                        <i className="fa-regular fa-trash-can" aria-hidden="true" />
                      </button>
                    </div>

                    <h3 className={styles.itemName}>{cartItemTitle(item)}</h3>

                    <div className={styles.itemMetaRow}>
                      <span
                        className={pending ? styles.pricePending : styles.priceValue}
                      >
                        {formatCartItemPrice(item)}
                      </span>
                      {!pending && item.qty > 1 ? (
                        <span className={styles.qtyChip}>Qty {item.qty}</span>
                      ) : null}
                    </div>

                    {metaLines.length > 0 ? (
                      <ul className={styles.metaList}>
                        {metaLines.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Subtotal</span>
            <strong className={styles.summaryValue}>{formatCartSubtotalLabel(items)}</strong>
          </div>

          {staffBlockReason && items.length > 0 ? (
            <p className={styles.staffNotice}>{staffBlockReason}</p>
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

          <Link href={browseHref} className={styles.browseBtn} onClick={closeDrawer}>
            Keep Browsing
          </Link>
        </div>
      </aside>
    </div>
  );
}
