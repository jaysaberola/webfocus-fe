import { useState } from "react";
import Link from "next/link";
import { PublicMenuItem } from "@/services/publicPageService";

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
  const [open, setOpen] = useState(false);

  const href = item.target;
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
      return new URL(url).pathname;
    } catch {
      return url;
    }
  };

  const hrefPath = normalizePath(href);
  const isCurrent =
    isInternal &&
    (currentPath === hrefPath ||
      currentPath.startsWith(hrefPath + "/"));

  const handleLinkClick = () => {
    if (isMobile) onNavigate?.();
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  return (
    <li
      className={`menu-item ${isCurrent ? "current" : ""} ${
        open ? "open" : ""
      }`}
    >
      <div className="menu-row">
        {isInternal ? (
          <Link href={href} className="menu-link" onClick={handleLinkClick}>
            <span>{item.label.toUpperCase()}</span>
          </Link>
        ) : (
          <a
            href={href}
            className="menu-link"
            target={opensInNewTab ? "_blank" : undefined}
            rel={opensInNewTab ? "noopener noreferrer" : undefined}
            onClick={handleLinkClick}
          >
            <span>{item.label.toUpperCase()}</span>
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
