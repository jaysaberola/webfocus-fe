
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { getCurrentUserCached, initialsForUser, resolveAvatarUrl, subscribeCurrentUserUpdated } from "@/lib/currentUser";
import { getWebsiteSettingsCached, resolveWebsiteAssetUrl, subscribeWebsiteSettingsUpdated } from "@/lib/websiteSettings";
import type { User } from "@/services/accountService";
import { logout } from "@/services/authService";

type TopbarProps = {
  onToggleSidebar?: () => void;
  sidebarToggleRef?: React.Ref<HTMLButtonElement>;
  sidebarHidden?: boolean;
  isMobile?: boolean;
};

export default function Topbar({ onToggleSidebar, sidebarToggleRef, sidebarHidden = false, isMobile = false }: TopbarProps) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);
  const dropdownRef = React.useRef<any>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [logoUrl, setLogoUrl] = React.useState<string | undefined>(undefined);
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
    const unsub = subscribeWebsiteSettingsUpdated(() => refreshLogo({ force: true }));
    return () => unsub();
  }, [refreshLogo]);

  React.useEffect(() => {
    setLogoFailed(false);
  }, [logoUrl]);

  const avatarUrl = React.useMemo(() => resolveAvatarUrl(currentUser?.avatar), [currentUser?.avatar]);
  const initials = React.useMemo(() => initialsForUser(currentUser), [currentUser]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const init = async () => {
      try {
        const mod = await import('bootstrap');
        const Dropdown = (mod as any).Dropdown;
        const el = document.getElementById('userDropdown');
        if (el && Dropdown) {
          dropdownRef.current = new Dropdown(el);
        }
      } catch (err) {
        // ignore
      }
    };

    init();

    return () => {
      try {
        dropdownRef.current && dropdownRef.current.dispose && dropdownRef.current.dispose();
      } catch (e) {}
    };
  }, []);

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    router.push("/");
  };

  return (
    <>
      <nav className="navbar navbar-light bg-white shadow-sm px-4" style={{ minHeight: '56px', padding: '0 1.5rem' }}>
        <div className="container-fluid w-100 flex-grow-1 d-flex justify-content-between align-items-center gap-2">
        <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
          {onToggleSidebar && (
            <button
              type="button"
              className="btn btn-outline-secondary cms-topbar__sidebar-toggle"
              onClick={onToggleSidebar}
              aria-label={isMobile ? "Toggle sidebar" : sidebarHidden ? "Show sidebar" : "Hide sidebar"}
              title={isMobile ? "Toggle sidebar" : sidebarHidden ? "Show sidebar" : "Hide sidebar"}
              ref={sidebarToggleRef}
            >
              <i className={`fa-solid ${isMobile ? "fa-bars" : sidebarHidden ? "fa-bars" : "fa-left-long"}`} />
            </button>
          )}

          {logoUrl && !logoFailed ? (
            <img
              src={logoUrl}
              alt="Logo"
              onError={() => setLogoFailed(true)}
              style={{ height: 34, width: "auto", objectFit: "contain", display: "block" }}
            />
          ) : (
            <img
              src="/images/logo.png"
              alt="Logo"
              style={{ height: 34, width: "auto", objectFit: "contain", display: "block" }}
            />
          )}
        </div>

        <div className="d-flex align-items-center gap-2">
        <div className="dropdown">
          <button
            className="btn p-0 border-0 rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
            type="button"
            id="userDropdown"
            aria-expanded="false"
            style={{ width: "40px", height: "40px", background: "#0b1220", lineHeight: 0 }}
            onClick={() => dropdownRef.current?.toggle && dropdownRef.current.toggle()}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem", letterSpacing: 0.5 }}>
                {initials}
              </span>
            )}
          </button>

          <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li>
              <Link href="/settings/account" className="dropdown-item">
                Account Settings
              </Link>
            </li>
            <li>
              <Link href="" className="dropdown-item">
                Help
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button className="dropdown-item" onClick={() => setShowLogoutConfirm(true)}>
                Logout
            </button>
          </li>
        </ul>
        </div>
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
