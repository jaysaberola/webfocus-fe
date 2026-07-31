const SERVICE_TYPE_ORDER = [
  "Cloud Hosting",
  "Shared Hosting",
  "Dedicated Hosting",
  "Bare-Metal Hosting",
  "Custom Web Design",
  "Secure Domain",
  "Document Management System",
];

export function resolveServiceTypeLabel(service: any): string {
  if (!service) return "Service";

  const category = service.category;
  if (category && typeof category === "object") {
    const name = category.name ?? category.title;
    if (name) return String(name);
  }

  if (service.category_name) return String(service.category_name);
  if (typeof service.category === "string" && service.category.trim()) return service.category.trim();
  if (service.type) return String(service.type);
  if (service.category_id != null) return `Category ${service.category_id}`;

  return "Uncategorized";
}

export function groupServicesByType(services: any[]) {
  const groups = new Map<string, any[]>();

  for (const service of services) {
    const type = resolveServiceTypeLabel(service);
    const bucket = groups.get(type);
    if (bucket) bucket.push(service);
    else groups.set(type, [service]);
  }

  const sortedTypes = Array.from(groups.keys()).sort((a, b) => {
    const aIndex = SERVICE_TYPE_ORDER.indexOf(a);
    const bIndex = SERVICE_TYPE_ORDER.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sortedTypes.map((type) => ({
    type,
    services: groups.get(type) ?? [],
  }));
}
