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

export type ClientAdvancedFilterField =
  | "none"
  | "owner"
  | "billing"
  | "classification"
  | "client_type"
  | "contact_person"
  | "status"
  | "name";

export type ClientAdvancedFilter = {
  field: ClientAdvancedFilterField;
  value: string;
};

export const CLIENT_ADVANCED_FILTER_FIELDS: Array<{
  id: ClientAdvancedFilterField;
  label: string;
}> = [
  { id: "none", label: "None" },
  { id: "owner", label: "Client Owner" },
  { id: "billing", label: "Billing-in-Charge" },
  { id: "classification", label: "Client Classification" },
  { id: "client_type", label: "Client Type" },
  { id: "contact_person", label: "Billing Contact Information" },
  { id: "status", label: "Status" },
  { id: "name", label: "Client Name" },
];

export const emptyClientAdvancedFilter: ClientAdvancedFilter = {
  field: "none",
  value: "",
};

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

export function clientTypeLabel(client: CustomerRow) {
  return String(client.client_type ?? "").trim() || "—";
}

export function clientContactPerson(client: CustomerRow) {
  return String(client.contact_person ?? "").trim() || "—";
}

function matchesNeedle(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function applyClientAdvancedFilter(rows: CustomerRow[], filter: ClientAdvancedFilter) {
  if (!filter.field || filter.field === "none" || !filter.value.trim()) {
    return rows;
  }

  const value = filter.value.trim();

  return rows.filter((row) => {
    switch (filter.field) {
      case "owner":
        return clientOwnerName(row) === value;
      case "billing":
        return clientBillingInCharge(row) === value;
      case "classification":
        return clientClassification(row) === value;
      case "client_type":
        return clientTypeLabel(row) === value;
      case "contact_person":
        return clientContactPerson(row) === value;
      case "status":
        return clientDisplayStatus(row) === value;
      case "name":
        return matchesNeedle(clientDisplayName(row), value);
      default:
        return true;
    }
  });
}

export function uniqueClientFilterValues(
  rows: CustomerRow[],
  field: ClientAdvancedFilterField,
): string[] {
  if (field === "none" || field === "name") return [];

  const values = rows.map((row) => {
    switch (field) {
      case "owner":
        return clientOwnerName(row);
      case "billing":
        return clientBillingInCharge(row);
      case "classification":
        return clientClassification(row);
      case "client_type":
        return clientTypeLabel(row);
      case "contact_person":
        return clientContactPerson(row);
      case "status":
        return clientDisplayStatus(row);
      default:
        return "";
    }
  });

  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b),
  );
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
