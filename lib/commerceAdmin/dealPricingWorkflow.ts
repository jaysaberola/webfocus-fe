import { parseDealMeta } from "@/lib/commerceAdmin/clientOrderFormHelpers";

export const PRICING_WORKFLOW = {
  missing: "missing_price",
  awaiting: "awaiting_price",
  review: "price_updated_review",
  ready: "draft_ready",
} as const;

export type PricingWorkflowStatus = (typeof PRICING_WORKFLOW)[keyof typeof PRICING_WORKFLOW];

export function pricingWorkflowFromNotes(notes?: string | null): PricingWorkflowStatus {
  const raw = String(parseDealMeta(notes)?.pricingWorkflowStatus ?? "").trim();
  if (raw === PRICING_WORKFLOW.awaiting) return PRICING_WORKFLOW.awaiting;
  if (raw === PRICING_WORKFLOW.review) return PRICING_WORKFLOW.review;
  if (raw === PRICING_WORKFLOW.ready) return PRICING_WORKFLOW.ready;
  return PRICING_WORKFLOW.missing;
}

export function pricingWorkflowLabel(status: PricingWorkflowStatus): string {
  switch (status) {
    case PRICING_WORKFLOW.awaiting:
      return "Awaiting price";
    case PRICING_WORKFLOW.review:
      return "Price updated — review";
    case PRICING_WORKFLOW.ready:
      return "Draft ready to complete";
    default:
      return "Missing price";
  }
}

export function isDraftTransaction(orderStatus?: string | null) {
  return String(orderStatus ?? "").trim().toLowerCase() === "draft";
}
