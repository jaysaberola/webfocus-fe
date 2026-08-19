import type { SalesTransaction } from "@/services/salesTransactionService";
import {
  buildNotesWithHostingClassification,
  stripHostingMeta,
  type HostingClassification,
} from "@/lib/commerceAdmin/hostingTransactionTypes";

export type HostingActionUpdate = {
  notes: string;
  order_status?: string;
  payment_status?: string;
  successMessage: string;
};

function appendActionLog(notes: string, subType: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  const entry = `[HOSTING_ACTION ${stamp}] ${subType}`;
  if (notes.includes(entry)) return notes;
  return notes ? `${notes}\n${entry}` : entry;
}

function classifiedNotes(transaction: SalesTransaction, classification: HostingClassification) {
  return buildNotesWithHostingClassification(transaction.notes, classification);
}

function processingAction(
  transaction: SalesTransaction,
  classification: HostingClassification,
  successMessage: string,
): HostingActionUpdate {
  return {
    notes: appendActionLog(classifiedNotes(transaction, classification), classification.subType),
    order_status: "processing",
    successMessage,
  };
}

export function buildHostingRenewalUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `Renewal recorded for ${transaction.transaction_no}. Hosting service renewal is processing.`,
  );
}

export function buildHostingNewUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `New hosting order recorded for ${transaction.transaction_no}. Provisioning is processing.`,
  );
}

export function buildHostingUpgradeUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `Upgrade/Downgrade request recorded for ${transaction.transaction_no}.`,
  );
}

export function buildHostingAddonUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `Add-on request recorded for ${transaction.transaction_no}.`,
  );
}

export function buildHostingSuspensionUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return {
    notes: appendActionLog(
      `${classifiedNotes(transaction, classification)}\nHosting service marked for suspension.`,
      classification.subType,
    ),
    order_status: "processing",
    successMessage: `Suspension request recorded for ${transaction.transaction_no}.`,
  };
}

export function buildHostingResumptionUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `Resumption request recorded for ${transaction.transaction_no}. Service reactivation is processing.`,
  );
}

export function buildHostingCancellationUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return {
    notes: appendActionLog(
      `${classifiedNotes(transaction, classification)}\nHosting service cancellation requested.`,
      classification.subType,
    ),
    order_status: "cancelled",
    successMessage: `Cancellation recorded for ${transaction.transaction_no}.`,
  };
}

export function buildHostingMigrationUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `Migration request recorded for ${transaction.transaction_no}.`,
  );
}

export function buildHostingFreeTrialUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `Free trial recorded for ${transaction.transaction_no}.`,
  );
}

export function buildHostingPlatformChangeUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `Platform change request recorded for ${transaction.transaction_no}.`,
  );
}

export function buildHostingFtpUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return processingAction(
    transaction,
    classification,
    `FTP upload/download request recorded for ${transaction.transaction_no}.`,
  );
}

export function buildHostingOthersUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  return {
    notes: appendActionLog(classifiedNotes(transaction, classification), classification.subType),
    successMessage: `Hosting action "${classification.subType}" recorded for ${transaction.transaction_no}.`,
  };
}

const HOSTING_ACTION_BUILDERS: Record<string, (tx: SalesTransaction, cls: HostingClassification) => HostingActionUpdate> = {
  Renewal: buildHostingRenewalUpdate,
  "New Hosting": buildHostingNewUpdate,
  New: buildHostingNewUpdate,
  Upgrade: buildHostingUpgradeUpdate,
  Downgrade: buildHostingUpgradeUpdate,
  "Upgrade/Downgrade": buildHostingUpgradeUpdate,
  "Add ons": buildHostingAddonUpdate,
  "Add On": buildHostingAddonUpdate,
  Suspension: buildHostingSuspensionUpdate,
  Resumption: buildHostingResumptionUpdate,
  Cancellation: buildHostingCancellationUpdate,
  Deletion: buildHostingCancellationUpdate,
  Migration: buildHostingMigrationUpdate,
  "Free Trial": buildHostingFreeTrialUpdate,
  "Change Platform": buildHostingPlatformChangeUpdate,
  "FTP Upload/Download": buildHostingFtpUpdate,
  Others: buildHostingOthersUpdate,
};

export function resolveHostingActionUpdate(
  transaction: SalesTransaction,
  classification: HostingClassification,
): HostingActionUpdate {
  const builder = HOSTING_ACTION_BUILDERS[classification.subType] ?? buildHostingOthersUpdate;
  return builder(transaction, classification);
}

export function hostingActionSummary(notes?: string | null) {
  if (!notes) return null;
  const matches = notes.match(/\[HOSTING_ACTION \d{4}-\d{2}-\d{2}\] ([^\n]+)/g);
  if (!matches?.length) return null;
  return matches[matches.length - 1].replace(/\[HOSTING_ACTION \d{4}-\d{2}-\d{2}\]\s*/, "");
}

export function userFacingNotes(notes?: string | null) {
  const stripped = stripHostingMeta(notes);
  return stripped
    .split("\n")
    .filter((line) => !line.startsWith("[DEAL_META]"))
    .join("\n")
    .replace(/\[HOSTING_ACTION \d{4}-\d{2}-\d{2}\][^\n]*/g, "")
    .trim();
}

export function mergeEditedTransactionNotes(
  originalNotes: string | null | undefined,
  editedBody: string,
  classification: HostingClassification | null,
) {
  const actionLines = (originalNotes ?? "").match(/\[HOSTING_ACTION[^\n]*/g) ?? [];
  let result = editedBody.trim();

  if (classification) {
    result = buildNotesWithHostingClassification(result, classification);
  }

  if (actionLines.length) {
    result = result ? `${result}\n${actionLines.join("\n")}` : actionLines.join("\n");
  }

  return result;
}
