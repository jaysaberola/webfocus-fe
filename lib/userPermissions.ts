import { isAdminLikeUser } from "@/lib/adminPreviewAccess";

export function getUserPermissions(user: unknown): string[] {
  if (!user || typeof user !== "object") return [];
  const perms = (user as { permissions?: unknown }).permissions;
  if (!Array.isArray(perms)) return [];
  return perms.filter((perm): perm is string => typeof perm === "string");
}

export function hasPermission(user: unknown, permission?: string | null): boolean {
  if (!permission) return true;
  if (isAdminLikeUser(user)) return true;
  return getUserPermissions(user).includes(permission);
}

export function hasAnyPermission(user: unknown, permissions?: string[] | null): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (isAdminLikeUser(user)) return true;
  const owned = new Set(getUserPermissions(user));
  return permissions.some((perm) => owned.has(perm));
}

export function hasAllPermissions(user: unknown, permissions: string[]): boolean {
  if (permissions.length === 0) return true;
  if (isAdminLikeUser(user)) return true;
  const owned = new Set(getUserPermissions(user));
  return permissions.every((perm) => owned.has(perm));
}
