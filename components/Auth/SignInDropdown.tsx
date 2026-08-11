import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  fetchCurrentCustomer,
  storeCustomer,
  type PublicCustomer,
} from "@/services/publicCustomerService";
import { customerDisplayName } from "@/lib/customerPortal/mockData";
import { getCurrentUserCached, notifyCurrentUserUpdated, resolveAvatarUrl } from "@/lib/currentUser";
import { readStoredAuthToken } from "@/lib/authToken";
import { getRoleDisplayLabel, isCmsPortalUser, isStaffUser } from "@/lib/userRoles";
import { scheduleIdleTask, useStoredPublicAuthState } from "@/lib/publicAuthState";
import { signOutAdminAndStayOnSite, signOutCustomerAndStayOnSite } from "@/lib/publicSignOut";
import { usePublicCartDrawer } from "@/components/Cart/PublicCartDrawerContext";
import styles from "@/styles/signInDropdown.module.css";

type SignInDropdownProps = {
  buttonClassName?: string;
  chevronClassName?: string;
  onNavigate?: () => void;
};

export default function SignInDropdown({ buttonClassName, chevronClassName, onNavigate }: SignInDropdownProps) {
  const { customer, adminUser } = useStoredPublicAuthState();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { openDrawer: openCartDrawer } = usePublicCartDrawer();

  useEffect(() => {
    if (!readStoredAuthToken()) return;

    let alive = true;

    const refreshSession = () => {
      fetchCurrentCustomer({ silent: true, force: true })
        .then((user) => {
          if (!alive) return;
          storeCustomer(user, { notify: true });
        })
        .catch(async () => {
          if (!alive) return;
          storeCustomer(null, { notify: true });

          try {
            const user = await getCurrentUserCached({ force: false });
            if (isStaffUser(user)) {
              notifyCurrentUserUpdated();
            }
          } catch {
            // ignore
          }
        });
    };

    const cancelIdle = scheduleIdleTask(refreshSession, 2500);
    return () => {
      alive = false;
      cancelIdle();
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
  const [customerAvatarFailed, setCustomerAvatarFailed] = useState(false);
  const [adminAvatarFailed, setAdminAvatarFailed] = useState(false);

  useEffect(() => {
    setCustomerAvatarFailed(false);
  }, [customer?.avatar]);

  useEffect(() => {
    setAdminAvatarFailed(false);
  }, [adminUser?.avatar]);
  const adminRoleLabel = getRoleDisplayLabel(adminUser);
  const customerAvatarUrl = resolveAvatarUrl(customer?.avatar);
  const adminDisplayName = customerDisplayName(adminUser?.fname, adminUser?.lname) || "Admin User";
  const adminInitial = (adminDisplayName.charAt(0) || "A").toUpperCase();
  const adminAvatarUrl = resolveAvatarUrl(adminUser?.avatar);
  const showCustomerAvatar = Boolean(customerAvatarUrl && !customerAvatarFailed);
  const showAdminAvatar = Boolean(adminAvatarUrl && !adminAvatarFailed);
  const showCmsPortalLink = isCmsPortalUser(adminUser);

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
          <span className={styles.avatar}>
            {showAdminAvatar ? (
              <img
                src={adminAvatarUrl}
                alt=""
                width={24}
                height={24}
                onError={() => setAdminAvatarFailed(true)}
              />
            ) : (
              adminInitial
            )}
          </span>
          <span className={styles.loggedInName}>{adminDisplayName}</span>
          <i className={`fas fa-chevron-down ${chevronClassName || ""}`} aria-hidden="true" />
        </button>
        {open && (
          <div className={styles.accountPanel} role="menu" aria-label="Admin menu">
            <div className={styles.accountHeader}>
              <span className={styles.avatarLarge}>
                {showAdminAvatar ? (
                  <img
                    src={adminAvatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    onError={() => setAdminAvatarFailed(true)}
                  />
                ) : (
                  adminInitial
                )}
              </span>
              <div className={styles.accountMeta}>
                <p className={styles.accountName}>{adminDisplayName}</p>
                <p className={styles.accountEmail}>{adminUser.email}</p>
                <p className={styles.accountRole}>{adminRoleLabel}</p>
              </div>
            </div>

            <nav className={styles.accountMenu}>
              {showCmsPortalLink ? (
                <a
                  href="/dashboard"
                  className={styles.menuItem}
                  role="menuitem"
                  onClick={(event) => {
                    event.preventDefault();
                    close();
                    window.location.assign("/dashboard");
                  }}
                >
                  <i className="fa-solid fa-layer-group" aria-hidden="true" />
                  CMS Admin
                </a>
              ) : null}
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
            {showCustomerAvatar ? (
              <img
                src={customerAvatarUrl}
                alt=""
                width={24}
                height={24}
                onError={() => setCustomerAvatarFailed(true)}
              />
            ) : (
              initial
            )}
          </span>
          <span className={styles.loggedInName}>{displayName}</span>
          <i className={`fas fa-chevron-down ${chevronClassName || ""}`} aria-hidden="true" />
        </button>
        {open && (
          <div className={styles.accountPanel} role="menu" aria-label="Account menu">
            <div className={styles.accountHeader}>
              <span className={styles.avatarLarge}>
                {showCustomerAvatar ? (
                  <img
                    src={customerAvatarUrl}
                    alt=""
                    width={40}
                    height={40}
                    onError={() => setCustomerAvatarFailed(true)}
                  />
                ) : (
                  initial
                )}
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
