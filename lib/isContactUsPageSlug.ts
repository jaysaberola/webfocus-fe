export function isContactUsPageSlug(slug?: string | null) {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
  return normalized === "contact-us" || normalized === "contact";
}
