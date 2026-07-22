
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Menu from "./_Menu";
import HeaderSearch from "./HeaderSearch";
import SignInDropdown from "@/components/Auth/SignInDropdown";
import { usePublicCartDrawer } from "@/components/Cart/PublicCartDrawerContext";
import styles from "@/styles/_topbar.module.css";
import { cartCount, readPublicCart } from "@/lib/publicCart";

const LOGO_SRC = "/images/webfocus-logo.png";

export default function LandingTopbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [logoFailed, setLogoFailed] = useState(false);
  const { openDrawer: openCartDrawer } = usePublicCartDrawer();

  useEffect(() => {
    const refreshCart = () => setCartItemsCount(cartCount(readPublicCart()));
    refreshCart();
    window.addEventListener("public-cart-updated", refreshCart);
    window.addEventListener("storage", refreshCart);
    return () => {
      window.removeEventListener("public-cart-updated", refreshCart);
      window.removeEventListener("storage", refreshCart);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
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
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles["topbar-inner"]}>
        <div className={styles.left}>
          <Link href="/public/home" className={styles.brand} onClick={closeMobileMenu} aria-label="WebFocus Solutions, Inc.">
            {!logoFailed ? (
              <img
                src={LOGO_SRC}
                alt="WebFocus Solutions, Inc."
                className={styles["logo-img-full"]}
                width={130}
                height={30}
                decoding="async"
                fetchPriority="high"
                onError={() => setLogoFailed(true)}
              />
            ) : (
              <span className={styles.wordmark}>
                <span className={styles["wordmark-row"]}>
                  <span className={styles["wordmark-web"]}>Web</span>
                  <span className={styles["wordmark-focus-block"]}>
                    <span className={styles["wordmark-focus"]}>Focus</span>
                    <span className={styles["wordmark-sub"]}>Solutions, Inc.</span>
                  </span>
                </span>
              </span>
            )}
          </Link>
        </div>

        <nav
          id="landing-topbar-nav"
          className={`${styles["nav-wrap"]} ${mobileOpen ? styles["nav-wrap-open"] : ""}`}
          aria-label="Main navigation"
        >
          <div className={styles["mobile-utilities"]}>
            <Link href="/public/search" className={styles["mobile-utility-link"]} onClick={closeMobileMenu}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              Search
            </Link>
            <Link href="/public/login" className={styles["mobile-utility-link"]} onClick={closeMobileMenu}>
              <i className="fa-regular fa-user" aria-hidden="true" />
              Sign In
            </Link>
          </div>
          <ul className={styles["nav-list"]}>
            <Menu isMobile={mobileOpen} onNavigate={closeMobileMenu} />
          </ul>
        </nav>

        <HeaderSearch />

        <div className={styles.actions}>
          <Link href="/public/search" className={`${styles["search-mobile-btn"]} ${styles["desktop-only"]}`} aria-label="Search" title="Search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </Link>

          <SignInDropdown
            buttonClassName={`${styles["portal-btn"]} ${styles["desktop-only"]}`}
            chevronClassName={styles["portal-chevron"]}
          />

          <div className={styles["icon-group"]}>
            <Link href="/public/contact-us" className={styles["contact-btn"]} aria-label="Contact us" title="Contact us">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
            </Link>

            <button
              type="button"
              className={styles["cart-btn"]}
              aria-label="Shopping cart"
              title="Cart"
              onClick={openCartDrawer}
            >
              <i className="fa fa-shopping-cart" aria-hidden="true" />
              {cartItemsCount > 0 && (
                <span className={styles["cart-badge"]}>{cartItemsCount}</span>
              )}
            </button>
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
        </div>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className={styles.backdrop}
          aria-label="Close menu"
          onClick={closeMobileMenu}
        />
      )}
    </header>
  );
}
