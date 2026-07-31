export function looksLikeDomain(name?: string | null) {
  if (!name) return false;
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(name.trim());
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
  if (
    haystack.includes("design") ||
    haystack.includes("canvas") ||
    haystack.includes("web design") ||
    haystack.includes("web custom")
  ) {
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

export function isAddonLineItem(name?: string | null) {
  if (!name) return false;
  return /add\s*ons?_/i.test(name);
}

export function joinPlanNames(names: Array<string | null | undefined>) {
  return names.map((name) => String(name ?? "").trim()).filter(Boolean).join(" + ");
}
