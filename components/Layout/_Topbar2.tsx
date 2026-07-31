
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { getCurrentUserCached, initialsForUser, readStoredCurrentUser, resolveAvatarUrl, subscribeCurrentUserUpdated } from "@/lib/currentUser";
import { getWebsiteSettingsCached, readStoredWebsiteSettings, resolveWebsiteAssetUrl, subscribeWebsiteSettingsUpdated } from "@/lib/websiteSettings";
import type { User } from "@/services/accountService";
import { logout } from "@/services/authService";
import { useCmsHelp } from "@/lib/cmsHelp/CmsHelpContext";

type TopbarProps = {
  onToggleSidebar?: () => void;
  sidebarToggleRef?: React.Ref<HTMLButtonElement>;
  sidebarHidden?: boolean;
  isMobile?: boolean;
};

export default function Topbar({ onToggleSidebar, sidebarToggleRef, sidebarHidden = false, isMobile = false }: TopbarProps) {
  const router = useRouter();
  const { openHelp } = useCmsHelp();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(() => readStoredCurrentUser());
  const [logoUrl, setLogoUrl] = React.useState<string | undefined>(() => {
    const stored = readStoredWebsiteSettings();
    return stored ? resolveWebsiteAssetUrl((stored as any)?.company_logo) : undefined;
  });
  const [logoFailed, setLogoFailed] = React.useState(false);

  const refreshUser = React.useCallback(async (opts?: { force?: boolean }) => {
    try {
      const u = await getCurrentUserCached({ force: opts?.force === true });
      setCurrentUser(u);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    refreshUser({ force: false });
    const unsub = subscribeCurrentUserUpdated(() => refreshUser({ force: true }));
    return () => unsub();
  }, [refreshUser]);

  const refreshLogo = React.useCallback(async (opts?: { force?: boolean }) => {
    try {
      const s = await getWebsiteSettingsCached({ force: opts?.force === true });
      setLogoUrl(resolveWebsiteAssetUrl((s as any)?.company_logo));
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    refreshLogo({ force: false });
    const unsub = subscribeWebsiteSettingsUpdated(() => {
      const stored = readStoredWebsiteSettings();
      setLogoUrl(resolveWebsiteAssetUrl((stored as any)?.company_logo));
    });
    return () => unsub();
  }, [refreshLogo]);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const avatarUrl = React.useMemo(() => resolveAvatarUrl(currentUser?.avatar), [currentUser?.avatar]);
  const initials = React.useMemo(() => initialsForUser(currentUser), [currentUser]);

  React.useEffect(() => {
    if (!menuOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    router.push("/");
  };

  return (
    <>
      <nav className="navbar navbar-light cms-topbar px-4">
        <div className="container-fluid w-100 flex-grow-1 d-flex justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center cms-topbar__brand-area">
          <button
            type="button"
            className="btn btn-outline-secondary cms-topbar__sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label={isMobile ? "Toggle sidebar" : sidebarHidden ? "Show sidebar" : "Hide sidebar"}
            title={isMobile ? "Toggle sidebar" : sidebarHidden ? "Show sidebar" : "Hide sidebar"}
            ref={sidebarToggleRef}
          >
            <i
              className={`fa-solid ${
                isMobile || sidebarHidden ? "fa-bars" : "fa-angles-left"
              }`}
              aria-hidden="true"
            />
          </button>

          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="cms-topbar__logo"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <img
              src="/images/logo.png"
              alt="Logo"
              className="cms-topbar__logo"
            />
          )}
        </div>

        <div className="cms-topbar__user-menu-wrap" ref={menuRef}>
          <button
            type="button"
            className="cms-topbar__user-btn"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            aria-label="User menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="cms-topbar__user-avatar">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" />
              ) : (
                <span className="cms-topbar__user-initials">{initials}</span>
              )}
            </span>
          </button>

          {menuOpen ? (
            <div className="cms-topbar__user-menu" role="menu" aria-label="User menu">
              <Link
                href="/settings/account"
                className="cms-topbar__user-menu-item"
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                Account
              </Link>
              <button
                type="button"
                className="cms-topbar__user-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  openHelp();
                }}
              >
                Help
              </button>
              <hr className="cms-topbar__user-menu-divider" />
              <button
                type="button"
                className="cms-topbar__user-menu-item cms-topbar__user-menu-item--logout"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setShowLogoutConfirm(true);
                }}
              >
                Logout
              </button>
            </div>
          ) : null}
        </div>
        </div>
      </nav>

      <ConfirmModal
        show={showLogoutConfirm}
        title="Logout"
        message={<div>Are you sure you want to log out?</div>}
        danger={false}
        confirmLabel="Yes, log out"
        cancelLabel="Cancel"
        confirmVariant="primary"
        accentVariant="primary"
        onCancel={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
      />
    </>
  );
}
