import type { SalesTransaction } from "@/services/salesTransactionService";
import { transactionServiceCategory } from "@/lib/commerceAdmin/transactionHelpers";

export const HOSTING_SERVICE_NAME = "HOSTING";

export type HostingTypeName =
  | "Cloud Hosting"
  | "Shared Hosting"
  | "Dedicated Hosting"
  | "Bare Metal Hosting";

export const HOSTING_TYPE_SUBTYPES: Record<HostingTypeName, string[]> = {
  "Cloud Hosting": ["New", "Renewal", "Upgrade", "Others"],
  "Shared Hosting": [
    "Add ons",
    "Change Platform",
    "Deletion",
    "Downgrade",
    "Free Trial",
    "FTP Upload/Download",
    "New Hosting",
    "Others",
    "Renewal",
    "Resumption",
    "Suspension",
    "Upgrade",
  ],
  "Dedicated Hosting": [
    "Cancellation",
    "Migration",
    "New",
    "Others",
    "Renewal",
    "Upgrade/Downgrade",
  ],
  "Bare Metal Hosting": [
    "Add On",
    "Cancellation",
    "Free Trial",
    "Migration",
    "New",
    "Others",
    "Renewal",
    "Upgrade/Downgrade",
  ],
};

export const HOSTING_TYPE_NAMES = Object.keys(HOSTING_TYPE_SUBTYPES) as HostingTypeName[];

const HOSTING_META_PREFIX = "[HOSTING_META]";

export type HostingClassification = {
  serviceName: typeof HOSTING_SERVICE_NAME;
  typeName: HostingTypeName;
  subType: string;
};

export function isHostingTransaction(transaction: SalesTransaction) {
  return transactionServiceCategory(transaction) === "Hosting";
}

export function inferHostingTypeName(transaction: SalesTransaction): HostingTypeName {
  const saved = parseHostingClassification(transaction.notes);
  if (saved?.typeName) return saved.typeName;

  const haystack = [
    transactionServiceCategory(transaction),
    ...(transaction.items ?? []).map((item) => `${item.name ?? ""} ${item.item_type ?? ""}`),
    transaction.notes ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (haystack.includes("bare metal") || haystack.includes("baremetal")) {
    return "Bare Metal Hosting";
  }
  if (haystack.includes("dedicated")) {
    return "Dedicated Hosting";
  }
  if (haystack.includes("cloud")) {
    return "Cloud Hosting";
  }
  if (haystack.includes("shared") || haystack.includes("starter") || haystack.includes("deluxe")) {
    return "Shared Hosting";
  }

  return "Shared Hosting";
}

export function parseHostingClassification(notes?: string | null): HostingClassification | null {
  if (!notes) return null;
  const match = notes.match(/\[HOSTING_META\](\{[\s\S]*?\})/);
  if (!match?.[1]) return null;

  try {
    const parsed = JSON.parse(match[1]) as Partial<HostingClassification>;
    if (!parsed.typeName || !parsed.subType) return null;
    return {
      serviceName: HOSTING_SERVICE_NAME,
      typeName: parsed.typeName as HostingTypeName,
      subType: parsed.subType,
    };
  } catch {
    return null;
  }
}

export function stripHostingMeta(notes?: string | null) {
  if (!notes) return "";
  return notes.replace(/\[HOSTING_META\]\{[\s\S]*?\}\s*/g, "").trim();
}

export function buildNotesWithHostingClassification(
  notes: string | null | undefined,
  classification: HostingClassification,
) {
  const body = stripHostingMeta(notes);
  const meta = `${HOSTING_META_PREFIX}${JSON.stringify(classification)}`;
  return body ? `${meta}\n${body}` : meta;
}

export function hostingSubTypesForTransaction(transaction: SalesTransaction) {
  return HOSTING_TYPE_SUBTYPES[inferHostingTypeName(transaction)] ?? [];
}

export function hostingClassificationLabel(transaction: SalesTransaction) {
  const saved = parseHostingClassification(transaction.notes);
  if (saved) {
    return `${saved.typeName} · ${saved.subType}`;
  }
  return inferHostingTypeName(transaction);
}
