import type { CustomerRow } from "@/services/customerService";

export type ClientSortKey =
  | "name-asc"
  | "name-desc"
  | "newest"
  | "oldest"
  | "owner-asc"
  | "owner-desc"
  | "billing-asc"
  | "billing-desc"
  | "classification-asc"
  | "classification-desc";

export type ClientFilterKey = "all" | "New" | "Existing" | "Active" | "Disabled";

export type ClientColumnKey = "name" | "owner" | "created" | "billing" | "classification";

export const CLIENT_COLUMN_LABELS: Record<ClientColumnKey, string> = {
  name: "Client Name",
  owner: "Client Owner",
  created: "Created Time",
  billing: "Billing-In-Charge",
  classification: "Client Classification",
};

export const DEFAULT_CLIENT_COLUMNS: Record<ClientColumnKey, boolean> = {
  name: true,
  owner: true,
  created: true,
  billing: true,
  classification: true,
};

export function clientDisplayName(client: CustomerRow) {
  return String(client.company || client.name || "").trim() || "—";
}

export function clientOwnerName(client: CustomerRow) {
  const assigned =
    String(client.owner?.name || client.owner_name || "").trim() ||
    String(client.owner?.email || "").trim();
  return assigned || "Unassigned";
}

export function clientIsAssigned(client: CustomerRow) {
  return Boolean(client.owner_id || client.owner?.id);
}

export function clientBillingInCharge(client: CustomerRow) {
  return String(client.billing_in_charge || client.email || "").trim() || "—";
}

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

export function clientClassification(client: CustomerRow): "New" | "Existing" {
  const stored = String(client.client_classification ?? "").trim().toLowerCase();
  if (stored === "existing") return "Existing";
  if (stored === "new") return "New";
  return clientActiveServicesCount(client) > 0 ? "Existing" : "New";
}

export function formatClientCreatedTime(client: CustomerRow) {
  const raw = client.created_at;
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return String(client.date_registered || "—");
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function filterClients(rows: CustomerRow[], filter: ClientFilterKey) {
  if (filter === "all") return rows;
  if (filter === "New" || filter === "Existing") {
    return rows.filter((row) => clientClassification(row) === filter);
  }
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
        return compareStrings(clientDisplayName(a), clientDisplayName(b), "asc");
      case "name-desc":
        return compareStrings(clientDisplayName(a), clientDisplayName(b), "desc");
      case "newest":
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      case "oldest":
        return new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime();
      case "owner-asc":
        return compareStrings(clientOwnerName(a), clientOwnerName(b), "asc");
      case "owner-desc":
        return compareStrings(clientOwnerName(a), clientOwnerName(b), "desc");
      case "billing-asc":
        return compareStrings(clientBillingInCharge(a), clientBillingInCharge(b), "asc");
      case "billing-desc":
        return compareStrings(clientBillingInCharge(a), clientBillingInCharge(b), "desc");
      case "classification-asc":
        return compareStrings(clientClassification(a), clientClassification(b), "asc");
      case "classification-desc":
        return compareStrings(clientClassification(a), clientClassification(b), "desc");
      default:
        return 0;
    }
  });

  return sorted;
}
