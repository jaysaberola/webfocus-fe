export function looksLikeDomain(name?: string | null) {
  const input = String(name ?? "").trim();
  if (!input || /^(?:₱\s*)?\d+(?:[.,]\d+)?$/.test(input) || /^[\d.]+$/.test(input)) return false;
  if (!/\.[a-z]{2,}$/i.test(input)) return false;
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(input);
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
    haystack.includes("web development") ||
    haystack.includes("web-dev") ||
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
    /business starter|professional corporate|e-?commerce plus|starter launch|website template|web design|web development/i.test(
      String(name)
    )
  ) {
    return true;
  }

  const normalizedType = String(itemType ?? "").trim().toLowerCase();
  return ["webdesign", "web_design", "design", "web_development", "webdevelopment"].includes(normalizedType);
}

export function resolveServiceCategory(name?: string | null, itemType?: string | null): string {
  const haystack = `${name ?? ""} ${itemType ?? ""}`.toLowerCase().trim();
  if (!haystack) return "Service";

  if (isAddonLineItem(name, itemType)) {
    return "Add-ons";
  }
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
    if (isAddonLineItem(item.name, item.item_type)) continue;
    if (isWebDesignPlan(item.name, item.item_type)) {
      return "Custom Web Design";
    }
  }

  const primary = items.find((item) => !isAddonLineItem(item.name, item.item_type)) ?? items[0];
  return resolveServiceCategory(primary?.name, primary?.item_type);
}

export function toCustomerPlanFamily(category?: string | null): string {
  const needle = String(category || "").toLowerCase();
  if (!needle.trim()) return "Hosting";
  if (/add[\s_-]*ons?|hosting add-on/.test(needle)) return "Add-ons";
  if (needle.includes("domain")) return "Domains";
  if (needle.includes("dms") || needle.includes("document")) return "DMS";
  if (needle.includes("design") || needle.includes("canvas") || needle.includes("agency")) {
    return "Web Design";
  }
  return "Hosting";
}

export function looksLikeCustomerPlanFamily(value?: string | null): boolean {
  const plan = String(value || "").trim();
  if (!plan) return false;
  return /^(Hosting|Web Design|Domains|DMS|Add-ons)( \+ (Hosting|Web Design|Domains|DMS|Add-ons))*$/.test(
    plan
  );
}

export function customerPlanLabelFromParts(params: {
  serviceName?: string | null;
  plan?: string | null;
  items?: Array<{ name?: string | null; item_type?: string | null; detail?: string | null }> | string | null;
}): string {
  const plan = String(params.plan || "").trim();
  if (looksLikeCustomerPlanFamily(plan)) return plan;

  const list = Array.isArray(params.items) ? params.items : [];
  const addonItems = list.filter(
    (item) => isAddonLineItem(item.name, item.item_type) || isAddonLineItem(item.detail)
  );
  const coreItems = list.filter(
    (item) => !isAddonLineItem(item.name, item.item_type) && !isAddonLineItem(item.detail)
  );
  const families = Array.from(
    new Set(
      coreItems
        .map((item) => toCustomerPlanFamily(item.name || item.detail))
        .filter((family) => family !== "Add-ons")
    )
  );

  if (!families.length) {
    if (addonItems.length) return "Add-ons";
    const family = toCustomerPlanFamily(params.serviceName || plan);
    const blob = `${params.serviceName ?? ""} ${plan} ${typeof params.items === "string" ? params.items : ""}`;
    if (/add[\s_-]*ons?|hosting add-on/i.test(blob) && family !== "Add-ons") {
      return `${family} + Add-ons`;
    }
    return family;
  }

  const label = families.join(" + ");
  return addonItems.length ? `${label} + Add-ons` : label;
}

export function isAddonLineItem(name?: string | null, itemType?: string | null) {
  const type = String(itemType ?? "").toLowerCase().trim();
  if (["addon", "add-on", "add_on", "addons"].includes(type)) return true;
  const haystack = String(name ?? "").toLowerCase();
  if (!haystack) return false;
  return /add[\s_-]*ons?|hosting add-on/i.test(haystack);
}

export function joinPlanNames(names: Array<string | null | undefined>) {
  return names.map((name) => String(name ?? "").trim()).filter(Boolean).join(" + ");
}
