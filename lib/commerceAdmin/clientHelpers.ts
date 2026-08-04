import type { CustomerRow } from "@/services/customerService";

export type ClientSortKey =
  | "name-asc"
  | "name-desc"
  | "newest"
  | "id-asc"
  | "id-desc"
  | "email-asc"
  | "email-desc"
  | "service-asc"
  | "service-desc"
  | "status-asc"
  | "status-desc";

export type ClientFilterKey = "all" | "Active" | "Disabled";

export type ClientColumnKey = "id" | "name" | "email" | "service" | "status";

export const CLIENT_COLUMN_LABELS: Record<ClientColumnKey, string> = {
  id: "Client ID",
  name: "Company / Representative",
  email: "Business Email",
  service: "Active Services",
  status: "Status",
};

export const DEFAULT_CLIENT_COLUMNS: Record<ClientColumnKey, boolean> = {
  id: true,
  name: true,
  email: true,
  service: true,
  status: true,
};

export function clientActiveServicesCount(client: CustomerRow) {
  return Number(client.active_services_count ?? 0);
}

export function clientDisplayStatus(client: CustomerRow) {
  const raw = String(client.status ?? "").toLowerCase();
  if (raw === "inactive" || raw === "disabled" || raw === "0" || raw === "false") {
    return "Disabled";
  }
  return "Active";
}

export function filterClients(rows: CustomerRow[], filter: ClientFilterKey) {
  if (filter === "all") return rows;
  return rows.filter((row) => clientDisplayStatus(row) === filter);
}

function compareStrings(a: string, b: string, direction: "asc" | "desc") {
  const left = a.toLowerCase();
  const right = b.toLowerCase();
  if (left < right) return direction === "asc" ? -1 : 1;
  if (left > right) return direction === "asc" ? 1 : -1;
  return 0;
}

export function sortClients(rows: CustomerRow[], sortBy: ClientSortKey) {
  const sorted = [...rows];

  sorted.sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return compareStrings(a.name ?? "", b.name ?? "", "asc");
      case "name-desc":
        return compareStrings(a.name ?? "", b.name ?? "", "desc");
      case "newest":
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      case "id-asc":
        return a.id - b.id;
      case "id-desc":
        return b.id - a.id;
      case "email-asc":
        return compareStrings(a.email ?? "", b.email ?? "", "asc");
      case "email-desc":
        return compareStrings(a.email ?? "", b.email ?? "", "desc");
      case "service-asc":
        return clientActiveServicesCount(a) - clientActiveServicesCount(b);
      case "service-desc":
        return clientActiveServicesCount(b) - clientActiveServicesCount(a);
      case "status-asc":
        return compareStrings(clientDisplayStatus(a), clientDisplayStatus(b), "asc");
      case "status-desc":
        return compareStrings(clientDisplayStatus(a), clientDisplayStatus(b), "desc");
      default:
        return 0;
    }
  });

  return sorted;
}
