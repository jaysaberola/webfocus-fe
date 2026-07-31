export function looksLikeDomain(name?: string | null) {
  if (!name) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(name.trim());
}

const WEB_DESIGN_PLANS = [
  "business starter launch",
  "custom professional corporate",
  "high-concurrency e-commerce plus",
];

export function isWebDesignPlan(name?: string | null, itemType?: string | null): boolean {
  const haystack = `${name ?? ""} ${itemType ?? ""}`.toLowerCase().trim();
  if (!haystack) return false;

  if (
    haystack.includes("design") ||
    haystack.includes("canvas") ||
    haystack.includes("web design") ||
    haystack.includes("web custom") ||
    haystack.includes("agency web") ||
    haystack.includes("figma")
  ) {
    return true;
  }

  const normalizedName = String(name ?? "").trim().toLowerCase();
  if (normalizedName && WEB_DESIGN_PLANS.includes(normalizedName)) {
    return true;
  }

  if (
    normalizedName &&
    /business starter|professional corporate|e-?commerce plus|starter launch|website template|web design/i.test(
      String(name)
    )
  ) {
    return true;
  }

  const normalizedType = String(itemType ?? "").trim().toLowerCase();
  return ["webdesign", "web_design", "design"].includes(normalizedType);
}

export function resolveServiceCategory(name?: string | null, itemType?: string | null): string {
  const haystack = `${name ?? ""} ${itemType ?? ""}`.toLowerCase().trim();
  if (!haystack) return "Service";

  if (haystack.includes("domain") || looksLikeDomain(name)) {
    return "Secure Domain";
  }
  if (haystack.includes("dms") || haystack.includes("document")) {
    return "DMS";
  }
  if (isWebDesignPlan(name, itemType)) {
    return "Custom Web Design";
  }
  if (haystack.includes("credit")) {
    return "Account Credit";
  }
  if (
    haystack.includes("hosting") ||
    haystack.includes("cloud") ||
    haystack.includes("server") ||
    haystack.includes("shared") ||
    haystack.includes("micro") ||
    haystack.includes("dedicated")
  ) {
    return "Hosting";
  }

  return "Hosting";
}

export function resolveServiceCategoryFromItems(
  items: Array<{ name?: string | null; item_type?: string | null }>
): string {
  if (!items.length) return "Service";

  for (const item of items) {
    if (isWebDesignPlan(item.name, item.item_type)) {
      return "Custom Web Design";
    }
  }

  const primary = items[0];
  return resolveServiceCategory(primary?.name, primary?.item_type);
}

export function isAddonLineItem(name?: string | null) {
  if (!name) return false;
  return /add\s*ons?_/i.test(name);
}

export function joinPlanNames(names: Array<string | null | undefined>) {
  return names.map((name) => String(name ?? "").trim()).filter(Boolean).join(" + ");
}
