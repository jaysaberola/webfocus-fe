export type CommerceStatusBadgeVariant = "paid" | "pending" | "provisioning" | "muted" | "purple";

export type CommerceStatusContext = "payment" | "invoice" | "deal" | "sales" | "technical";

export function formatCommerceStatusLabel(value?: string | null): string {
  const text = String(value ?? "").trim();
  if (!text || text === "—") return "—";

  const normalized = text.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const lower = normalized.toLowerCase();

  if (lower === "pending payment") return "Pending Payment";
  if (lower === "pending") return "Pending";
  if (lower === "unpaid") return "Unpaid";
  if (lower === "paid") return "Paid";
  if (lower === "active") return "Active";
  if (lower === "renew") return "Renew";
  if (lower === "provisioning") return "Provisioning";
  if (lower === "inactive") return "Inactive";
  if (lower === "overdue") return "Overdue";
  if (lower === "failed") return "Failed";
  if (lower === "refunded") return "Refunded";
  if (lower === "sent to client") return "Sent to Client";
  if (lower === "received by client") return "Received by Client";
  if (lower === "partially paid") return "Partially Paid";
  if (lower === "pending technical") return "Pending Technical";
  if (lower === "awaiting technical") return "Awaiting Technical";
  if (lower === "awaiting approval") return "Awaiting Approval";
  if (lower === "not approved") return "Not Approved";
  if (lower === "not assigned") return "Not Assigned";
  if (lower === "approved") return "Approved";

  return normalized
    .split(" ")
    .map((word) => {
      if (!word) return "";
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

export function formatPaymentStatusDisplay(metaValue?: string | null, transactionStatus?: string | null): string {
  const meta = String(metaValue ?? "").trim();
  if (meta && meta !== "—") {
    const lower = meta.toLowerCase();
    if (lower === "pending") return "Pending Payment";
    if (lower === "unpaid") return "Unpaid";
    if (lower === "paid") return "Paid";
    return formatCommerceStatusLabel(meta);
  }

  const raw = String(transactionStatus ?? "pending").toLowerCase();
  if (raw === "pending") return "Pending Payment";
  if (raw === "paid") return "Paid";
  if (raw === "failed") return "Failed";
  if (raw === "refunded") return "Refunded";
  if (raw === "overdue") return "Overdue";
  if (raw === "unpaid") return "Unpaid";
  return formatCommerceStatusLabel(transactionStatus);
}

export function commerceStatusBadgeVariant(
  label: string,
  context: CommerceStatusContext = "deal",
): CommerceStatusBadgeVariant {
  const lower = label.toLowerCase();

  if (
    lower === "paid" ||
    lower === "active" ||
    lower === "approved" ||
    lower === "received by client" ||
    lower === "delivered" ||
    lower === "closed won"
  ) {
    return "paid";
  }

  if (lower === "provisioning" || lower === "sent to client" || lower === "processing") {
    return "provisioning";
  }

  if (lower === "partially paid") {
    return "purple";
  }

  if (
    lower === "pending" ||
    lower === "pending payment" ||
    lower === "pending technical" ||
    lower === "awaiting technical" ||
    lower === "awaiting approval" ||
    lower === "unpaid" ||
    lower === "overdue" ||
    lower === "renew" ||
    lower === "expired" ||
    lower === "qualification" ||
    lower === "negotiation/review"
  ) {
    return "pending";
  }

  if (lower === "not approved" || lower === "not assigned") {
    return "muted";
  }

  if (
    lower === "inactive" ||
    lower === "cancelled" ||
    lower === "canceled" ||
    lower === "failed" ||
    lower === "refunded" ||
    lower === "closed lost"
  ) {
    return "muted";
  }

  if (context === "invoice" && lower.includes("sent")) return "provisioning";
  if (context === "invoice" && lower.includes("received")) return "paid";

  return "muted";
}
