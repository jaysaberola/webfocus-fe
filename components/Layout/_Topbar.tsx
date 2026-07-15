
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Menu from "./_Menu";
import styles from "@/styles/_topbar.module.css";
import { getWebsiteSettingsCached, resolveWebsiteAssetUrl, subscribeWebsiteSettingsUpdated } from "@/lib/websiteSettings";
import { cartCount, readPublicCart } from "@/lib/publicCart";
import { getStoredCustomer } from "@/services/publicCustomerService";

export default function LandingTopbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoAlt, setLogoAlt] = useState<string>("Logo");
  const [navAlignment, setNavAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [customerName, setCustomerName] = useState("");
  const [cartItemsCount, setCartItemsCount] = useState(0);

  useEffect(() => {
    let alive = true;

    const refresh = async (opts?: { force?: boolean }) => {
      try {
        const s = await getWebsiteSettingsCached({ force: opts?.force === true });
        if (!alive) return;

        const url = resolveWebsiteAssetUrl((s as any)?.company_logo) ?? null;
        setNavAlignment((s as any)?.nav_alignment ?? 'center');
        setLogoUrl(url);
        setLogoAlt((s as any)?.website_name || (s as any)?.company_name || "Logo");
      } catch {
        // ignore
      }
    };

    refresh({ force: false });
    const unsub = subscribeWebsiteSettingsUpdated(() => refresh({ force: true }));
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    const refreshCustomer = () => {
      const customer = getStoredCustomer();
      setCustomerName(customer ? `${customer.fname ?? ""} ${customer.lname ?? ""}`.trim() || "My Account" : "");
    };
    const refreshCart = () => setCartItemsCount(cartCount(readPublicCart()));
    refreshCustomer();
    refreshCart();
    window.addEventListener("public-customer-updated", refreshCustomer);
    window.addEventListener("public-cart-updated", refreshCart);
    window.addEventListener("storage", refreshCart);
    return () => {
      window.removeEventListener("public-customer-updated", refreshCustomer);
      window.removeEventListener("public-cart-updated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  useEffect(() => {
    // compute threshold: if there's a banner, stay transparent until user scrolls
    // past the banner height. Otherwise use a small default threshold.
    const bannerEl = document.querySelector('.page-banner') as HTMLElement | null;
    const threshold = bannerEl ? Math.max(20, bannerEl.offsetHeight - 40) : 20;

    const onScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 991) setMobileOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      return;
    }

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <header className={`${styles['topbar-dark']} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles['topbar-inner']}>
        <div className="left">
          <Link href="/public/home" className={styles.brand}>
            <span className={styles['logo-box']}>
              <img
                src={logoUrl || "/images/logo-light.png"}
                alt={logoAlt}
                className={styles['logo-img']}
              />
            </span>

          </Link>
        </div>

        <div className={styles.right}>
          <div className={styles['search-wrapper']}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!searchQuery) return;
                // Navigate to a search results page if available
                try {
                  window.location.href = `/public/search?q=${encodeURIComponent(searchQuery)}`;
                } catch (err) {
                  // fallback
                  console.log('search:', searchQuery);
                }
              }}
            >
              <input
                ref={inputRef}
                className={styles['search-input']}
                aria-label="Search"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onBlur={() => setSearchOpen(false)}
              />
              <button
                type="button"
                className={styles['search-icon']}
                aria-label="Open search"
                onClick={() => {
                  setSearchOpen((v) => !v);
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
              >
                <i className="fa fa-search" aria-hidden="true"></i>
              </button>
            </form>
          </div>
          <button
            type="button"
            className={styles["mobile-toggle"]}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="landing-topbar-nav"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span className={styles["mobile-toggle-bar"]} />
            <span className={styles["mobile-toggle-bar"]} />
            <span className={styles["mobile-toggle-bar"]} />
          </button>

          <div className={styles.socials}>
            <Link href="/public/cart" className={styles['social-icon']} aria-label="Cart" title="Cart" style={{ position: "relative" }}>
              <i className="fa fa-shopping-cart" aria-hidden="true"></i>
              {cartItemsCount > 0 && (
                <span style={{
                  position: "absolute",
                  top: -6,
                  right: -7,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 999,
                  background: "#ec1d25",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: "16px",
                  textAlign: "center",
                }}>{cartItemsCount}</span>
              )}
            </Link>
            <Link href={customerName ? "/public/account" : "/public/login"} className={styles['social-icon']} aria-label={customerName ? "My Account" : "Login"} title={customerName || "Login"}>
              <i className="fa fa-user" aria-hidden="true"></i>
            </Link>
            <a
              href="https://facebook.com/"
              className={styles['social-icon']}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <i className="fab fa-facebook-f" aria-hidden="true"></i>
            </a>

            <a
              href="https://instagram.com/"
              className={styles['social-icon']}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <i className="fab fa-instagram" aria-hidden="true"></i>
            </a>

            <a
              href="https://twitter.com/"
              className={styles['social-icon']}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <i className="fab fa-twitter" aria-hidden="true"></i>
            </a>
          </div>

          {mobileOpen && (
            <button
              type="button"
              className={styles.backdrop}
              aria-label="Close menu"
              onClick={closeMobileMenu}
            />
          )}

          <nav
            id="landing-topbar-nav"
            className={`${styles["nav-wrap"]} ${mobileOpen ? styles["nav-wrap-open"] : ""}`}
            data-align={navAlignment}
          >
            <ul className={styles["nav-list"]}>
              <Menu isMobile={mobileOpen} onNavigate={closeMobileMenu} />
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

