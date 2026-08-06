import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { hasAnyPermission } from "@/lib/userPermissions";
import { isCustomerUser } from "@/lib/userRoles";

export type CmsNavChild = {
  label: string;
  href: string;
  permissions?: string[];
};

export type CmsNavItem = {
  label: string;
  icon: string;
  href: string;
  collapseMenus?: boolean;
  openInNewTab?: boolean;
  permissions?: string[];
  children?: CmsNavChild[];
};

const COMMERCE_PORTAL_PERMISSIONS = [
  "commerce_dashboard.view",
  "customers.manage",
  "sales_transactions.view",
  "sales_transactions.manage",
  "commerce_approvals.view",
  "commerce_managed.view",
  "commerce_contracts.view",
  "commerce_catalog.view",
  "commerce_notifications.view",
  "commerce_helpdesk.view",
  "reports.view",
];

export const CMS_NAV_ITEMS: CmsNavItem[] = [
  { label: "Dashboard", icon: "fa-solid fa-house", href: "/dashboard", collapseMenus: true, permissions: ["dashboard.view"] },
  { label: "Pages", icon: "fa-solid fa-file-lines", href: "/pages", permissions: ["pages.view"] },
  {
    label: "Banners",
    icon: "fa-solid fa-images",
    href: "/banners",
    permissions: ["albums.view"],
    children: [
      { label: "Manage Home Banners", href: "/banners/home", permissions: ["albums.view"] },
      { label: "Manage Albums", href: "/banners", permissions: ["albums.view"] },
      { label: "Create an Album", href: "/banners/create", permissions: ["albums.create"] },
    ],
  },
  { label: "Files", icon: "fa-solid fa-folder-open", href: "/files", permissions: ["file_manager.manage"] },
  { label: "Menu", icon: "fa-solid fa-bars", href: "/menu", permissions: ["menus.view"] },
  {
    label: "News",
    icon: "fa-solid fa-newspaper",
    href: "/news",
    permissions: ["news.view"],
    children: [
      { label: "Manage News", href: "/news", permissions: ["news.view"] },
      { label: "Manage News Categories", href: "/news/category_index", permissions: ["news_categories.view"] },
    ],
  },
  {
    label: "Settings",
    icon: "fa-solid fa-gear",
    href: "/settings",
    children: [
      { label: "Manage Account Settings", href: "/settings/account" },
      { label: "Manage Website Settings", href: "/settings/website", permissions: ["website_settings.edit"] },
      { label: "Manage Audit Trail", href: "/settings/audit", permissions: ["audit_logs.view"] },
    ],
  },
  { label: "Users", icon: "fa-solid fa-users", href: "/users", permissions: ["users.view"] },
  {
    label: "Account Management",
    icon: "fa-solid fa-user-shield",
    href: "/account-management",
    children: [
      { label: "Manage Roles", href: "/account-management/roles", permissions: ["roles.view"] },
      { label: "Manage Access Rights", href: "/account-management/access_rights", permissions: ["access_rights.manage"] },
    ],
  },
];

export const COMMERCE_PORTAL_ITEM: CmsNavItem = {
  label: "Commerce Control Center",
  icon: "fa-solid fa-store",
  href: "/public/commerce-admin",
  openInNewTab: true,
  permissions: COMMERCE_PORTAL_PERMISSIONS,
};

export const COMMERCE_TAB_PERMISSIONS: Record<CommerceAdminTab, string[]> = {
  dashboard: ["commerce_dashboard.view"],
  clients: ["customers.manage"],
  transactions: ["sales_transactions.view", "sales_transactions.manage"],
  approvals: ["commerce_approvals.view", "commerce_approvals.manage"],
  managed: ["commerce_managed.view", "commerce_managed.manage"],
  contracts: ["commerce_contracts.view", "commerce_contracts.manage"],
  catalog: ["commerce_catalog.view", "commerce_catalog.manage", "products.manage"],
  notifications: ["commerce_notifications.view", "commerce_notifications.manage"],
  helpdesk: ["commerce_helpdesk.view", "commerce_helpdesk.create", "commerce_helpdesk.update", "commerce_helpdesk.delete"],
  reports: ["reports.view"],
};

export function filterCmsNavItems(user: unknown, items: CmsNavItem[] = CMS_NAV_ITEMS): CmsNavItem[] {
  if (isCustomerUser(user)) return [];

  return items.reduce<CmsNavItem[]>((acc, item) => {
    if (item.children?.length) {
      const children = item.children.filter((child) => hasAnyPermission(user, child.permissions));
      if (children.length === 0) return acc;
      acc.push({ ...item, children });
      return acc;
    }

    if (!hasAnyPermission(user, item.permissions)) return acc;
    acc.push(item);
    return acc;
  }, []);
}

export function canAccessCommercePortal(user: unknown): boolean {
  if (isCustomerUser(user)) return false;
  return hasAnyPermission(user, COMMERCE_PORTAL_PERMISSIONS);
}

export function canAccessCommerceTab(user: unknown, tab: CommerceAdminTab): boolean {
  return hasAnyPermission(user, COMMERCE_TAB_PERMISSIONS[tab]);
}

export function getAccessibleCommerceTabs(user: unknown): CommerceAdminTab[] {
  return (Object.keys(COMMERCE_TAB_PERMISSIONS) as CommerceAdminTab[]).filter((tab) =>
    canAccessCommerceTab(user, tab)
  );
}

export function resolveCommerceTab(user: unknown, requested?: CommerceAdminTab): CommerceAdminTab {
  const allowed = getAccessibleCommerceTabs(user);
  if (allowed.length === 0) return "dashboard";
  if (requested && allowed.includes(requested)) return requested;
  return allowed[0];
}
