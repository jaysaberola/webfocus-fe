import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUserCached, initialsForUser, resolveAvatarUrl, subscribeCurrentUserUpdated } from "@/lib/currentUser";
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);

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
        { label: "Dashboard", icon: "fa-solid fa-house", href: "/dashboard" },
        {
          label: "Pages", icon: "fa-solid fa-file-lines", href: "/pages",
          children: [
            { label: "Manage Pages", href: "/pages" },
            { label: "Create a Page", href: "/pages/create" },
          ],
        },
        {
          label: "Banners", icon: "fa-solid fa-images", href: "/banners",
          children: [
            { label: "Manage Home Banner", href: "/banners/home" },
            { label: "Manage Subpage Banners", href: "/banners" },
            { label: "Create an Album", href: "/banners/create" },
          ],
        },
        { label: "Files", icon: "fa-solid fa-folder-open", href: "/files" },
        {
          label: "Menu", icon: "fa-solid fa-bars", href: "/menu",
          children: [
            { label: "Manage Menu", href: "/menu" },
            { label: "Create a Menu", href: "/menu/create" },
          ],
        },
        {
          label: "News", icon: "fa-solid fa-newspaper", href: "/news",
          children: [
            { label: "Manage News", href: "/news" },
            { label: "Create News", href: "/news/create" },
            { label: "Manage Categories", href: "/news/category_index" },
            { label: "Create a Category", href: "/news/category_create" },
          ],
        },
        {
          label: "Settings", icon: "fa-solid fa-gear", href: "/settings",
          children: [
            { label: "Account Settings", href: "/settings/account" },
            { label: "Website Settings", href: "/settings/website" },
            { label: "Audit Trail", href: "/settings/audit" },
          ],
        },
        {
          label: "Users", icon: "fa-solid fa-users", href: "/users",
          children: [
            { label: "Manage Users", href: "/users" },
            { label: "Create a User", href: "/users/create" },
          ],
        },
        {
          label: "Account Management", icon: "fa-solid fa-user-shield", href: "/account-management",
          children: [
            { label: "Roles", href: "/account-management/roles" },
            { label: "Access Rights", href: "/account-management/access_rights" },
          ],
        },
      ],
    },
  ];

  useEffect(() => {
    setOpenMenus((prev) => {
      const next = { ...prev };
      menuSections.flatMap((section: any) => section.items).forEach((item: any) => {
        if (item.children?.some((child: any) => isPathActive(child.href))) {
          next[item.href] = true;
        }
      });
      return next;
    });
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
                    onClick={onClose}
                    className={`sb-single-link${isActive(item.href) ? " sb-active" : ""}`}
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
