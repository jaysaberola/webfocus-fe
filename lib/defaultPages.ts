const normalizeKey = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const extractSlugFromUrl = (value: unknown) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  try {
    const pathname = new URL(raw).pathname;
    const parts = pathname.split("/").filter(Boolean);
    return normalizeKey(parts[parts.length - 1] || "");
  } catch {
    const parts = raw.split("/").filter(Boolean);
    return normalizeKey(parts[parts.length - 1] || raw);
  }
};

const DEFAULT_PAGE_KEYS = new Set([
  "home",
  "products",
  "news",
  "contact us",
  "footer",
]);

type DefaultPageCandidate = {
  slug?: string | null;
  label?: string | null;
  title?: string | null;
  name?: string | null;
  url?: string | null;
};

export const isDefaultProtectedPage = (page: DefaultPageCandidate) => {
  const candidates = [
    normalizeKey(page.slug),
    normalizeKey(page.label),
    normalizeKey(page.title),
    normalizeKey(page.name),
    extractSlugFromUrl(page.url),
  ].filter(Boolean);

  return candidates.some((value) => DEFAULT_PAGE_KEYS.has(value));
};
