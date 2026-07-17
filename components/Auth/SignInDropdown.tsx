import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  fetchCurrentCustomer,
  getStoredCustomer,
  PublicCustomer,
} from "@/services/publicCustomerService";
import { User } from "@/services/accountService";
import { customerDisplayName } from "@/lib/customerPortal/mockData";
import { getCurrentUserCached, resolveAvatarUrl } from "@/lib/currentUser";
import { readStoredAuthToken } from "@/lib/authToken";
import { isAdminLikeUser } from "@/lib/userRoles";
import { signOutAdminAndStayOnSite, signOutCustomerAndStayOnSite } from "@/lib/publicSignOut";
import { usePublicCartDrawer } from "@/components/Cart/PublicCartDrawerContext";
import styles from "@/styles/signInDropdown.module.css";

type SignInDropdownProps = {
  buttonClassName?: string;
  chevronClassName?: string;
  onNavigate?: () => void;
};

export default function SignInDropdown({ buttonClassName, chevronClassName, onNavigate }: SignInDropdownProps) {
  const [open, setOpen] = useState(false);
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const { openDrawer: openCartDrawer } = usePublicCartDrawer();

  useEffect(() => {
    const syncFromStorage = () => {
      if (!readStoredAuthToken()) {
        setCustomer(null);
        setAdminUser(null);
        return;
      }
      setCustomer(getStoredCustomer());
    };

    syncFromStorage();

    if (!readStoredAuthToken()) return;

    let alive = true;
    fetchCurrentCustomer({ silent: true, force: true })
      .then((user) => {
        if (!alive) return;
        setCustomer(user);
        setAdminUser(null);
      })
      .catch(async () => {
        if (!alive) return;
        setCustomer(null);

        try {
          const user = await getCurrentUserCached({ force: true });
          if (isAdminLikeUser(user)) {
            setAdminUser(user);
            return;
          }
        } catch {
          // ignore
        }

        setAdminUser(null);
      });

    window.addEventListener("public-customer-updated", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      alive = false;
      window.removeEventListener("public-customer-updated", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  const signOut = () => {
    close();
    signOutCustomerAndStayOnSite();
  };

  const signOutAdmin = () => {
    close();
    signOutAdminAndStayOnSite();
  };

  const displayName = customerDisplayName(customer?.fname, customer?.lname);
  const initial = (displayName.charAt(0) || "C").toUpperCase();
  const customerAvatarUrl = resolveAvatarUrl(customer?.avatar);
  const adminDisplayName = customerDisplayName(adminUser?.fname, adminUser?.lname) || "Admin User";
  const adminInitial = (adminDisplayName.charAt(0) || "A").toUpperCase();

  if (adminUser) {
    return (
      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          className={`${styles.loggedInBtn} ${buttonClassName || ""}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.avatar}>{adminInitial}</span>
          <span className={styles.loggedInName}>{adminDisplayName}</span>
          <i className={`fas fa-chevron-down ${chevronClassName || ""}`} aria-hidden="true" />
        </button>
        {open && (
          <div className={styles.accountPanel} role="menu" aria-label="Admin menu">
            <div className={styles.accountHeader}>
              <span className={styles.avatarLarge}>{adminInitial}</span>
              <div className={styles.accountMeta}>
                <p className={styles.accountName}>{adminDisplayName}</p>
                <p className={styles.accountEmail}>{adminUser.email}</p>
              </div>
            </div>

            <nav className={styles.accountMenu}>
              <Link href="/dashboard" className={styles.menuItem} role="menuitem" onClick={close}>
                <i className="fa-solid fa-layer-group" aria-hidden="true" />
                CMS Admin
              </Link>
              <Link href="/public/commerce-admin" className={styles.menuItem} role="menuitem" onClick={close}>
                <i className="fa-solid fa-store" aria-hidden="true" />
                Commerce Control Center
              </Link>
            </nav>

            <button type="button" className={styles.signOutItem} role="menuitem" onClick={signOutAdmin}>
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  if (customer) {
    return (
      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          className={`${styles.loggedInBtn} ${buttonClassName || ""}`}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          <span className={styles.avatar}>
            {customerAvatarUrl ? <img src={customerAvatarUrl} alt="" /> : initial}
          </span>
          <span className={styles.loggedInName}>{displayName}</span>
          <i className={`fas fa-chevron-down ${chevronClassName || ""}`} aria-hidden="true" />
        </button>
        {open && (
          <div className={styles.accountPanel} role="menu" aria-label="Account menu">
            <div className={styles.accountHeader}>
              <span className={styles.avatarLarge}>
                {customerAvatarUrl ? <img src={customerAvatarUrl} alt="" /> : initial}
              </span>
              <div className={styles.accountMeta}>
                <p className={styles.accountName}>{displayName}</p>
                <p className={styles.accountEmail}>{customer.email}</p>
              </div>
            </div>

            <nav className={styles.accountMenu}>
              <Link href="/public/dashboard" className={styles.menuItem} role="menuitem" onClick={close}>
                <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                Dashboard
              </Link>
              <button
                type="button"
                className={styles.menuItem}
                role="menuitem"
                onClick={() => {
                  openCartDrawer();
                  close();
                }}
              >
                <i className="fa-solid fa-cart-shopping" aria-hidden="true" />
                My Cart
              </button>
              <Link href="/public/dashboard?tab=account" className={styles.menuItem} role="menuitem" onClick={close}>
                <i className="fa-solid fa-user" aria-hidden="true" />
                Account Settings
              </Link>
            </nav>

            <button type="button" className={styles.signOutItem} role="menuitem" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={buttonClassName}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <i className="fa-regular fa-user" aria-hidden="true" />
        <span>Sign In</span>
        <i className={`fas fa-chevron-down ${chevronClassName || ""}`} aria-hidden="true" />
      </button>

      {open && (
        <div className={styles.panel} role="dialog" aria-label="Sign in options">
          <button type="button" className={styles.closeBtn} aria-label="Close" onClick={() => setOpen(false)}>
            ×
          </button>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Registered Users</h3>
            <p className={styles.sectionText}>Have an account? Sign in now.</p>
            <Link href="/public/login" className={styles.actionLink} onClick={close}>
              Sign In
            </Link>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>New Customer</h3>
            <p className={styles.sectionText}>
              New to WebFocus Solutions, Inc.? Create an account to get started today.
            </p>
            <Link href="/public/signup" className={styles.actionLink} onClick={close}>
              Create an Account
            </Link>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Administrator</h3>
            <p className={styles.sectionText}>
              WebFocus staff and admin users can sign in to the CMS or commerce control center.
            </p>
            <div className={styles.adminLinks}>
              <Link href="/?redirect=/dashboard" className={styles.adminLink} onClick={close}>
                <i className="fa-solid fa-layer-group" aria-hidden="true" />
                CMS Admin Sign In
              </Link>
              <Link href="/?redirect=/public/commerce-admin" className={styles.adminLink} onClick={close}>
                <i className="fa-solid fa-store" aria-hidden="true" />
                Commerce Control Center
              </Link>
            </div>
          </section>

          <section className={styles.quickLinks}>
            <p className={styles.quickLabel}>Quick Links</p>
            <div className={styles.quickRow}>
              <Link href="/public/forgot-password" className={styles.quickLink} onClick={close}>
                Forgot Password
              </Link>
              <Link href="/public/contact-us" className={styles.quickLink} onClick={close}>
                Contact Support
              </Link>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
