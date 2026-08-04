import { getServices } from "@/services/serviceService";
import { getProducts } from "@/services/productService";
import { getAllPublicHostingAddons } from "@/services/publicHostingService";
import { isAddonLineItem } from "@/lib/serviceCategory";
import { formatAddonDisplayName, WEBDESIGN_PACKAGES } from "@/lib/servicesCatalog";
function serviceDisplayName(service: any): string {
  return String(service?.name ?? service?.title ?? "").trim();
}

function productDisplayName(product: any): string {
  return String(product?.name ?? product?.title ?? "").trim();
}

function isActiveCatalogItem(item: any): boolean {
  const status = String(item?.status ?? "").toLowerCase();
  if (status === "inactive") return false;
  if (item?.is_active === false || item?.is_active === 0) return false;
  return true;
}

function isCatalogAddonService(service: any): boolean {
  const metadata = service?.metadata;
  if (metadata && typeof metadata === "object" && metadata.item_type === "addon") {
    return true;
  }
  return isAddonLineItem(serviceDisplayName(service));
}

export async function fetchAllCatalogServices(): Promise<string[]> {
  const [serviceNames, productNames] = await Promise.all([
    fetchAllServiceNames(),
    fetchAllProductNames(),
  ]);

  const webDesignPackages = WEBDESIGN_PACKAGES.map((pkg) => pkg.name);

  return sortUniqueNames([...serviceNames, ...productNames, ...webDesignPackages]);
}

async function fetchAllServiceNames(): Promise<string[]> {
  const collected: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await getServices({ per_page: 100, page }, { silent: true });
    const batch = Array.isArray(res?.data) ? res.data : [];
    collected.push(...batch);
    lastPage = Number(res?.meta?.last_page ?? 1);
    page += 1;
  } while (page <= lastPage);

  return collected
    .filter((service) => isActiveCatalogItem(service) && !isCatalogAddonService(service))
    .map(serviceDisplayName)
    .filter(Boolean);
}

async function fetchAllProductNames(): Promise<string[]> {
  const collected: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await getProducts({ per_page: 100, page, status: "active" }, { silent: true });
    const batch = Array.isArray(res?.data) ? res.data : [];
    collected.push(...batch);
    lastPage = Number(res?.last_page ?? res?.meta?.last_page ?? 1);
    page += 1;
  } while (page <= lastPage);

  return collected
    .filter((product) => isActiveCatalogItem(product))
    .map(productDisplayName)
    .filter(Boolean);
}

export async function fetchAllCatalogAddons(): Promise<string[]> {
  const names: string[] = [];

  try {
    const addons = await getAllPublicHostingAddons();
    const nameCounts = new Map<string, number>();

    addons.forEach((addon) => {
      const baseName = String(addon.label ?? addon.name ?? "").trim();
      if (!baseName) return;
      nameCounts.set(baseName, (nameCounts.get(baseName) ?? 0) + 1);
    });

    addons.forEach((addon) => {
      const baseName = String(addon.label ?? addon.name ?? "").trim();
      if (!baseName) return;

      const duplicate = (nameCounts.get(baseName) ?? 0) > 1;
      const planType = String(addon.plan_type ?? "").trim();
      const label =
        duplicate && planType && planType !== "universal"
          ? `${baseName} (${planType.charAt(0).toUpperCase()}${planType.slice(1)})`
          : baseName;

      names.push(label);
    });
  } catch {
    /* fall through to service-catalog addon rows */
  }

  let page = 1;
  let lastPage = 1;
  const collected: any[] = [];

  do {
    const res = await getServices({ per_page: 100, page }, { silent: true });
    const batch = Array.isArray(res?.data) ? res.data : [];
    collected.push(...batch);
    lastPage = Number(res?.meta?.last_page ?? 1);
    page += 1;
  } while (page <= lastPage);

  collected
    .filter((service) => isActiveCatalogItem(service) && isCatalogAddonService(service))
    .map(serviceDisplayName)
    .filter(Boolean)
    .forEach((name) => names.push(formatAddonDisplayName(name)));

  return sortUniqueNames(names);
}

function sortUniqueNames(names: string[]) {
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}
