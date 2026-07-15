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
    setOpenMenus((prev) => ({ [key]: !prev[key] }));
  };

  const menuSections = [
    {
      label: "CMS",
      items: [
        { label: "Dashboard", icon: "fa-solid fa-house", href: "/dashboard" },
        {
          label: "Pages", icon: "fa-solid fa-file-lines", href: "/pages",
          children: [
            { label: "Manage Pages", href: "/pages" },
            { label: "Create a Page", href: "/pages/create" },
            { label: "Layout Presets", href: "/pages/presets" },
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
    {
      label: "Ecommerce",
      items: [
        {
          label: "Customers", icon: "fa-solid fa-user-tag", href: "/customers",
          children: [
            { label: "Manage Customers", href: "/customers" },
            { label: "Create Customer", href: "/customers/create" },
          ],
        },
        { label: "Coupons", icon: "fa-solid fa-ticket", href: "/coupons" },
        { label: "Sales Transaction", icon: "fa-solid fa-receipt", href: "/sales-transactions" },
        {
          label: "Job Orders", icon: "fa-solid fa-list-check", href: "/job-orders",
          children: [
            { label: "Manage Job Orders", href: "/job-orders" },
            { label: "Create Job Orders", href: "/job-orders/create" },
          ],
        },
        {
          label: "Products", icon: "fa-solid fa-boxes-stacked", href: "/products",
          children: [
            { label: "Manage Products", href: "/products" },
            { label: "Create Product", href: "/products/create" },
            { label: "Create Category", href: "/products/category_create" },
          ],
        },
        {
          label: "Services", icon: "fa-solid fa-screwdriver-wrench", href: "/services",
          children: [
            { label: "Manage Services", href: "/services" },
            { label: "Create Service", href: "/services/create" },
            { label: "Create Category", href: "/services/category_create" },
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
    : "260px";

  return (
    <>
      <style>{`
        .sb-root {
          width: ${sidebarWidth};
          min-width: ${sidebarWidth};
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: linear-gradient(180deg, #0d1117 0%, #0f172a 55%, #0a0f1e 100%);
          border-right: 1px solid rgba(255,255,255,0.06);
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: rgba(255,255,255,0.08) transparent;
          transition: transform 0.25s ease;
          flex-shrink: 0;
          position: relative;
          z-index: 1201;
          backface-visibility: hidden;
          -webkit-font-smoothing: antialiased;
        }
        .sb-root.sb-mobile-closed {
          transform: translateX(-100%);
          position: fixed;
          left: 0; top: 0; bottom: 0;
        }
        .sb-root.sb-mobile-open {
          transform: none;
          position: fixed;
          left: 0; top: 0; bottom: 0;
        }
        @media (min-width: 992px) {
          .sb-root { transform: none !important; position: relative !important; }
        }
        .sb-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 18px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .sb-brand {
          font-size: 15px;
          font-weight: 700;
          color: #f8fafc;
          letter-spacing: 0.2px;
        }
        .sb-close-btn {
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(148,163,184,0.9);
          border-radius: 6px;
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.15s;
        }
        .sb-close-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .sb-user {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 16px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .sb-avatar {
          width: 38px; height: 38px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #1e40af);
          border: 2px solid rgba(59,130,246,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
          flex-shrink: 0; overflow: hidden;
        }
        .sb-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .sb-username {
          font-size: 13px; font-weight: 600;
          color: #f1f5f9; line-height: 1.3;
        }
        .sb-role {
          font-size: 11px;
          color: rgba(100,116,139,0.9);
          margin-top: 2px;
        }
        .sb-viewsite {
          padding: 11px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        .sb-viewsite a {
          display: flex; align-items: center; gap: 8px;
          font-size: 12.5px; color: rgba(148,163,184,0.8);
          text-decoration: none; font-weight: 500;
          transition: color 0.15s;
        }
        .sb-viewsite a:hover { color: #e2e8f0; }
        .sb-viewsite-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34,197,94,0.5);
          flex-shrink: 0;
        }
        .sb-section-label {
          padding: 16px 18px 6px;
          font-size: 10px; font-weight: 700;
          letter-spacing: 1.1px;
          color: rgba(71,85,105,0.9);
          text-transform: uppercase;
          flex-shrink: 0;
        }
        .sb-nav {
          flex: 1;
          padding: 2px 10px 12px;
          overflow-y: visible;
        }
        .sb-parent-btn {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s, border-color 0.15s;
          margin-bottom: 1px;
          color: rgba(203,213,225,0.85);
        }
        .sb-parent-btn:hover {
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
        }
        .sb-parent-btn.sb-active {
          background: rgba(59,130,246,0.14);
          border-color: rgba(59,130,246,0.22);
          color: #93c5fd;
        }
        .sb-parent-btn.sb-active .sb-nav-icon { color: #60a5fa; }
        .sb-single-link {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid transparent;
          text-decoration: none;
          color: rgba(203,213,225,0.85);
          transition: background 0.15s, border-color 0.15s;
          margin-bottom: 1px;
          font-size: 13px;
        }
        .sb-single-link:hover {
          background: rgba(255,255,255,0.05);
          color: #e2e8f0;
        }
        .sb-single-link.sb-active {
          background: rgba(59,130,246,0.14);
          border-color: rgba(59,130,246,0.22);
          color: #93c5fd;
        }
        .sb-single-link.sb-active .sb-nav-icon { color: #60a5fa; }
        .sb-nav-icon {
          font-size: 13px;
          color: rgba(100,116,139,0.8);
          width: 17px; text-align: center; flex-shrink: 0;
          transition: color 0.15s;
        }
        .sb-nav-label { font-size: 13px; flex: 1; font-weight: 500; }
        .sb-chevron {
          font-size: 9px;
          color: rgba(71,85,105,0.8);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .sb-chevron.open { transform: rotate(180deg); }
        .sb-submenu {
          margin: 2px 0 4px 17px;
          padding-left: 12px;
          border-left: 1px solid rgba(255,255,255,0.07);
        }
        .sb-child-link {
          display: flex; align-items: center;
          padding: 5px 8px;
          border-radius: 6px;
          text-decoration: none;
          color: rgba(148,163,184,0.75);
          font-size: 12px;
          transition: background 0.12s, color 0.12s;
          margin-bottom: 1px;
          gap: 7px;
        }
        .sb-child-link:hover {
          background: rgba(255,255,255,0.04);
          color: #cbd5e1;
        }
        .sb-child-link.sb-active {
          color: #93c5fd;
          background: rgba(59,130,246,0.1);
        }
        .sb-child-dot {
          width: 4px; height: 4px; border-radius: 50%;
          background: currentColor; opacity: 0.5; flex-shrink: 0;
        }
        .sb-child-link.sb-active .sb-child-dot { opacity: 1; }
        .sb-footer {
          padding: 14px 18px;
          border-top: 1px solid rgba(255,255,255,0.06);
          font-size: 11px;
          color: rgba(71,85,105,0.7);
          flex-shrink: 0;
        }
      `}</style>

      <aside
        className={[
          "sb-root",
          isMobile ? (isOpen ? "sb-mobile-open" : "sb-mobile-closed") : "",
        ].join(" ")}
        aria-hidden={isMobile && !isOpen ? true : undefined}
      >
        {/* Header */}
        <div className="sb-header">
          <span className="sb-brand">Admin Portal</span>
          <button
            type="button"
            className="sb-close-btn d-lg-none"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* User */}
        <div className="sb-user">
          <div className="sb-avatar">
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" />
              : <span>{userInitials}</span>
            }
          </div>
          <div>
            <div className="sb-username">
              {currentUser
                ? `${currentUser.fname} ${currentUser.lname}`.trim()
                : userLoaded ? "User" : "Loading..."}
            </div>
            <div className="sb-role">Admin</div>
          </div>
        </div>

        {/* View Website */}
        <div className="sb-viewsite">
          <Link href="/public/home" target="_blank" rel="noopener noreferrer">
            <span className="sb-viewsite-dot" />
            View Website
          </Link>
        </div>

        {/* Nav */}
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

        {/* Footer */}
        <div className="sb-footer">© {new Date().getFullYear()}</div>
      </aside>
    </>
  );
}
