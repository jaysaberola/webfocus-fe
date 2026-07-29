import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUserCached, initialsForUser, readStoredCurrentUser, resolveAvatarUrl, subscribeCurrentUserUpdated } from "@/lib/currentUser";
import type { User } from "@/services/accountService";
type SidebarProps = {
  isOpen?: boolean;
  isMobile?: boolean;
  onClose?: () => void;
  width?: number | string;
};

export default function Sidebar({ isOpen, isMobile, onClose, width }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredCurrentUser());
  const [userLoaded, setUserLoaded] = useState(() => readStoredCurrentUser() != null);

  const refreshUser = async (opts?: { force?: boolean }) => {
    try {
      const u = await getCurrentUserCached({ force: opts?.force === true });
      setCurrentUser(u);
    } catch {
    } finally {
      setUserLoaded(true);
    }
  };

  useEffect(() => {
    refreshUser({ force: false });
    const unsub = subscribeCurrentUserUpdated(() => refreshUser({ force: true }));
    return () => unsub();
  }, []);

  const userInitials = useMemo(() => initialsForUser(currentUser), [currentUser]);
  const avatarUrl = useMemo(() => resolveAvatarUrl(currentUser?.avatar), [currentUser?.avatar]);

  const isActive = (href: string) => pathname === href;
  const isPathActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const toggleMenu = (key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const collapseAllMenus = () => setOpenMenus({});

  const handleSingleNavClick =
    (item: { href: string; collapseMenus?: boolean }) => () => {
      onClose?.();
      if (item.collapseMenus) {
        collapseAllMenus();
      }
    };
  const menuSections = [
    {
      label: "Portals",
      items: [
        { label: "Commerce Control Center", icon: "fa-solid fa-store", href: "/public/commerce-admin" },
      ],
    },
    {
      label: "CMS",
      items: [
        { label: "Dashboard", icon: "fa-solid fa-house", href: "/dashboard", collapseMenus: true },
        { label: "Pages", icon: "fa-solid fa-file-lines", href: "/pages" },
        {
          label: "Banners", icon: "fa-solid fa-images", href: "/banners",
          children: [
            { label: "Manage Home Banners", href: "/banners/home" },
            { label: "Manage Albums", href: "/banners" },
            { label: "Create an Album", href: "/banners/create" },
          ],
        },
        { label: "Files", icon: "fa-solid fa-folder-open", href: "/files" },
        { label: "Menu", icon: "fa-solid fa-bars", href: "/menu" },
        {
          label: "News", icon: "fa-solid fa-newspaper", href: "/news",
          children: [
            { label: "Manage News", href: "/news" },
            { label: "Manage News Categories", href: "/news/category_index" },
          ],
        },
        {
          label: "Settings", icon: "fa-solid fa-gear", href: "/settings",
          children: [
            { label: "Manage Account Settings", href: "/settings/account" },
            { label: "Manage Website Settings", href: "/settings/website" },
            { label: "Manage Audit Trail", href: "/settings/audit" },
          ],
        },
        { label: "Users", icon: "fa-solid fa-users", href: "/users" },
        {
          label: "Account Management", icon: "fa-solid fa-user-shield", href: "/account-management",
          children: [
            { label: "Manage Roles", href: "/account-management/roles" },
            { label: "Manage Access Rights", href: "/account-management/access_rights" },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
    const next: Record<string, boolean> = {};
    menuSections.flatMap((section: any) => section.items).forEach((item: any) => {
      if (item.children?.some((child: any) => isPathActive(child.href))) {
        next[item.href] = true;
      }
    });
    setOpenMenus(next);
  }, [pathname]);
  const sidebarWidth = width != null
    ? (typeof width === "number" ? `${width}px` : width)
    : undefined;

  return (
    <aside
      className={[
        "sb-root",
        isMobile ? (isOpen ? "sb-mobile-open" : "sb-mobile-closed") : "",
      ].join(" ")}
      style={sidebarWidth ? ({ ["--cms-sidebar-width" as string]: sidebarWidth } as React.CSSProperties) : undefined}
      aria-hidden={isMobile && !isOpen ? true : undefined}
    >
      <div className="sb-header">
        <div className="sb-brand">
          <div className="sb-brand-icon">
            <i className="fa-solid fa-layer-group" />
          </div>
          <div className="sb-brand-text">
            <span className="sb-brand-title">WebFocus</span>
            <span className="sb-brand-sub">Admin Portal</span>
          </div>
        </div>
        <button
          type="button"
          className="sb-close-btn d-lg-none"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="sb-user">
        <div className="sb-avatar">
          {avatarUrl
            ? <img src={avatarUrl} alt="Avatar" />
            : <span>{userInitials}</span>
          }
        </div>
        <div style={{ minWidth: 0 }}>
          <div className="sb-username">
            {currentUser
              ? `${currentUser.fname} ${currentUser.lname}`.trim()
              : userLoaded ? "User" : "Loading..."}
          </div>
          <div className="sb-role">Admin</div>
        </div>
      </div>

      <div className="sb-viewsite">
        <Link href="/public/home" target="_blank" rel="noopener noreferrer">
          <span className="sb-viewsite-dot" />
          View Website
          <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: 10, opacity: 0.7 }} />
        </Link>
      </div>

      <nav className="sb-nav">
        {menuSections.map((section: any) => (
          <div key={section.label}>
            <div className="sb-section-label">{section.label}</div>

            {section.items.map((item: any) => {
              const hasChildren = Boolean(item.children);
              const childActive = hasChildren && item.children.some((c: any) => isPathActive(c.href));
              const parentActive = isPathActive(item.href);
              const isExpanded = !!openMenus[item.href];
              const highlightParent = parentActive || childActive || isExpanded;

              if (!hasChildren) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleSingleNavClick(item)}
                    data-cms-tour={`nav${item.href}`}
                    className={`sb-single-link${isPathActive(item.href) ? " sb-active" : ""}`}
                  >
                    <i className={`${item.icon} sb-nav-icon`} />
                    <span className="sb-nav-label">{item.label}</span>
                  </Link>
                );
              }

              return (
                <div key={item.href}>
                  <button
                    type="button"
                    className={`sb-parent-btn${highlightParent ? " sb-active" : ""}`}
                    onClick={() => toggleMenu(item.href)}
                  >
                    <i className={`${item.icon} sb-nav-icon`} />
                    <span className="sb-nav-label">{item.label}</span>
                    <i className={`fa-solid fa-chevron-down sb-chevron${isExpanded ? " open" : ""}`} />
                  </button>

                  {isExpanded && (
                    <div className="sb-submenu">
                      {item.children.map((child: any) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={onClose}
                          data-cms-tour={`nav${child.href}`}
                          className={`sb-child-link${isActive(child.href) ? " sb-active" : ""}`}
                        >
                          <span className="sb-child-dot" />
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sb-footer">© {new Date().getFullYear()} WebFocus CMS</div>
    </aside>
  );
}
