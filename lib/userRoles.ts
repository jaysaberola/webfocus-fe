import { isAdminLikeUser } from "@/lib/adminPreviewAccess";

const normalizeRoleName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

export const getUserRoleNames = (user: unknown): string[] => {
  if (!user || typeof user !== "object") return [];

  const candidate = user as Record<string, unknown>;
  const roles = [
    candidate.role,
    candidate.user_type,
    candidate.type,
    ...(Array.isArray(candidate.roles)
      ? candidate.roles.map((role) =>
          typeof role === "string" ? role : (role as { name?: string; role?: string })?.name ?? (role as { role?: string })?.role
        )
      : []),
  ]
    .map(normalizeRoleName)
    .filter(Boolean);

  return Array.from(new Set(roles));
};

export const isCustomerUser = (user: unknown) => {
  if (!user || typeof user !== "object") return false;
  if (isAdminLikeUser(user)) return false;
  return getUserRoleNames(user).includes("customer");
};

export { isAdminLikeUser };
