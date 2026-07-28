export function resolveGuideIdFromPath(pathname: string): string {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";

  if (path.startsWith("/pages/create")) return "pages-create";
  if (path.startsWith("/pages/edit")) return "pages-edit";
  if (path.startsWith("/pages/presets")) return "pages";
  if (path.startsWith("/pages")) return "pages";

  if (path.startsWith("/banners/home")) return "banners-home";
  if (path.startsWith("/banners/create")) return "banners-create";
  if (path.startsWith("/banners/edit")) return "banners";
  if (path.startsWith("/banners")) return "banners";

  if (path.startsWith("/files")) return "files";

  if (path.startsWith("/menu/create")) return "menu-create";
  if (path.startsWith("/menu/edit")) return "menu";
  if (path.startsWith("/menu")) return "menu";

  if (path.startsWith("/news/create")) return "news-create";
  if (path.startsWith("/news/category")) return "news-categories";
  if (path.startsWith("/news/edit")) return "news";
  if (path.startsWith("/news")) return "news";

  if (path.startsWith("/settings/account")) return "settings-account";
  if (path.startsWith("/settings/website")) return "settings-website";
  if (path.startsWith("/settings/audit")) return "settings-audit";
  if (path.startsWith("/settings")) return "settings-website";

  if (path.startsWith("/users/create")) return "users";
  if (path.startsWith("/users/edit")) return "users";
  if (path.startsWith("/users")) return "users";

  if (path.startsWith("/account-management/access_rights")) return "access-rights";
  if (path.startsWith("/account-management/roles")) return "roles";
  if (path.startsWith("/account-management")) return "roles";

  if (path.startsWith("/dashboard") || path === "/") return "dashboard";

  return "dashboard";
}
