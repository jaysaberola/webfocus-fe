import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import type { PublicMenuItem } from "@/services/publicPageService";
import { resolvePublicMenuHref } from "@/lib/publicMenuLinks";
import { prefetchPublicRoute } from "@/lib/prefetchPublicRoute";

export default function MenuItem({
  item,
  currentPath,
  isMobile = false,
  onNavigate,
}: {
  item: PublicMenuItem;
  currentPath: string;
  isMobile?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    const reset = () => setPressed(false);
    router.events.on("routeChangeComplete", reset);
    router.events.on("routeChangeError", reset);
    return () => {
      router.events.off("routeChangeComplete", reset);
      router.events.off("routeChangeError", reset);
    };
  }, [router]);

  const href = resolvePublicMenuHref(item);
  const isInternal = item.type === "page";
  const rawNewTabValue =
    item.openInNewTab ??
    item.open_in_new_tab ??
    item.newTab ??
    item.targetBlank ??
    item.target_blank ??
    item.targetAttr ??
    item.target_attr ??
    "";
  const normalizedNewTabValue = String(rawNewTabValue).trim().toLowerCase();
  const isExternalCustomUrl = item.type === "url" && /^https?:\/\//i.test(String(href || ""));
  const opensInNewTab =
    rawNewTabValue === true ||
    rawNewTabValue === 1 ||
    normalizedNewTabValue === "true" ||
    normalizedNewTabValue === "1" ||
    normalizedNewTabValue === "yes" ||
    normalizedNewTabValue === "_blank" ||
    isExternalCustomUrl;
  const hasChildren = item.children && item.children.length > 0;

  const normalizePath = (url: string) => {
    try {
      return new URL(url, "http://local").pathname;
    } catch {
      return url;
    }
  };

  const hrefPath = normalizePath(href);
  const isCurrent =
    isInternal &&
    (currentPath === hrefPath ||
      currentPath.startsWith(hrefPath + "/") ||
      (hrefPath !== "/" && currentPath.split("?")[0] === hrefPath));

  const handleLinkClick = () => {
    setPressed(true);
    if (isMobile) onNavigate?.();
  };

  const handlePrefetch = () => {
    if (isInternal) prefetchPublicRoute(router, href);
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <li
      className={`menu-item ${isCurrent ? "current" : ""} ${open ? "open" : ""} ${
        pressed ? "menu-item--pressed" : ""
      }`}
    >
      <div className="menu-row">
        {isInternal ? (
          <Link
            href={href}
            className="menu-link"
            prefetch
            scroll
            onClick={handleLinkClick}
            onMouseEnter={handlePrefetch}
            onFocus={handlePrefetch}
            onTouchStart={handlePrefetch}
          >
            <span>{item.label}</span>
            {item.label.toLowerCase().includes("news") && (
              <span className="menu-link__dot" aria-hidden="true" />
            )}
          </Link>
        ) : (
          <a
            href={href}
            className="menu-link"
            target={opensInNewTab ? "_blank" : undefined}
            rel={opensInNewTab ? "noopener noreferrer" : undefined}
            onClick={handleLinkClick}
          >
            <span>{item.label}</span>
            {item.label.toLowerCase().includes("news") && (
              <span className="menu-link__dot" aria-hidden="true" />
            )}
          </a>
        )}

        {hasChildren && isMobile && (
          <button
            type="button"
            className="submenu-toggle"
            aria-label={open ? "Collapse submenu" : "Expand submenu"}
            aria-expanded={open}
            onClick={handleToggleClick}
          />
        )}
      </div>

      {hasChildren && (
        <ul className="sub-menu-container">
          {item.children!.map((child) => (
            <MenuItem
              key={child.id}
              item={child}
              currentPath={currentPath}
              isMobile={isMobile}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
