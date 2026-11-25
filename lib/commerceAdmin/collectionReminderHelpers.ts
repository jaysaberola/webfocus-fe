import { patchDealMetaInNotes, parseDealMeta } from "@/lib/commerceAdmin/clientOrderFormHelpers";

export function notesAfterCollectionReminder(
  existingNotes: string | null | undefined,
  options?: { message?: string },
) {
  const message = String(options?.message ?? "").trim();
  const stamp = new Date().toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const logLine = message
    ? `Collection reminder · ${message} (${stamp})`
    : `Collection reminder sent (${stamp})`;

  const meta = parseDealMeta(existingNotes) ?? {};
  const priorSales = String(meta.salesNotes ?? "").trim();
  const salesNotes = priorSales ? `${priorSales}\n${logLine}` : logLine;

  return patchDealMetaInNotes(existingNotes, {
    collectionNote: "Reminded",
    salesNotes,
  });
}