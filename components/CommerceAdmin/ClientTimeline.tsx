import styles from "@/styles/commerceAdmin.module.css";

export type ClientAuditEntry = {
  id?: number | string;
  event?: string | null;
  auditable_type?: string | null;
  auditable_id?: number | string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  actor_name?: string | null;
  created_at?: string | null;
};

const IGNORED_FIELDS = new Set([
  "id",
  "created_at",
  "updated_at",
  "remember_token",
  "password",
  "email_verified_at",
  "user_id",
  "customer_id",
]);

const FILE_FIELDS: Record<string, string> = {
  bir_certificate: "BIR Certificate",
  business_permit: "Business Permit",
  sec_dti_registration: "SEC/DTI Registration",
  valid_id_signatories: "Valid ID of Signatories",
  gen_info_sheet: "Customer Info Sheet",
  avatar: "Profile photo",
};

const FIELD_GROUPS: Array<{ label: string; keys: string[] }> = [
  { label: "Client name", keys: ["fname", "lname", "mname", "company"] },
  { label: "Contact information", keys: ["email", "mobile", "phone", "contact_person"] },
  { label: "Billing address", keys: ["address_street", "address_city", "address_province", "address_region", "address_zip", "address_country"] },
  { label: "Shipping address", keys: ["shipping_street", "shipping_city", "shipping_province", "shipping_region", "shipping_zip", "shipping_country"] },
  { label: "Business details", keys: ["industry", "tax_classification", "tin_number", "other_numbers", "client_classification", "client_type", "ownership"] },
  { label: "Billing settings", keys: ["currency", "exchange_rate", "billing_in_charge", "workdrive_folder_url", "workdrive_folder_id"] },
];

function modelName(auditableType?: string | null) {
  const raw = String(auditableType ?? "").split("\\").pop() ?? "";
  const key = raw.toLowerCase();
  if (key === "user") return "Client profile";
  if (key === "salestransaction") return "Order";
  if (key === "customerservice") return "Service";
  return raw.replace(/([a-z])([A-Z])/g, "$1 $2") || "Record";
}

function pickValue(values: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = values[key];
    if (value != null && String(value).trim() !== "") return value;
  }
  return null;
}

function formatMoney(value: unknown) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return null;
  return `₱ ${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatWhen(value?: string | null) {
  if (!value) return { date: "—", time: "" };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: String(value), time: "" };
  return {
    date: date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

function changedKeys(audit: ClientAuditEntry) {
  const oldValues = audit.old_values ?? {};
  const newValues = audit.new_values ?? {};
  return Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)])).filter(
    (key) => !IGNORED_FIELDS.has(key),
  );
}

function summarizeOrderAudit(audit: ClientAuditEntry): string[] {
  const event = String(audit.event ?? "").toLowerCase();
  const oldValues = audit.old_values ?? {};
  const newValues = audit.new_values ?? {};
  const orderNo = String(pickValue(newValues, ["transaction_no"]) ?? pickValue(oldValues, ["transaction_no"]) ?? "").trim();
  const orderLabel = orderNo || "Order";
  const amount = formatMoney(pickValue(newValues, ["grand_total"]) ?? pickValue(oldValues, ["grand_total"]));

  if (event === "created") {
    return [amount ? `${orderLabel} placed — ${amount}` : `${orderLabel} placed`];
  }

  if (event === "deleted") {
    return [`${orderLabel} was cancelled`];
  }

  const lines: string[] = [];
  const paymentChanged =
    "payment_status" in newValues &&
    String(oldValues.payment_status ?? "") !== String(newValues.payment_status ?? "");
  const orderChanged =
    "order_status" in newValues &&
    String(oldValues.order_status ?? "") !== String(newValues.order_status ?? "");

  if (paymentChanged) {
    lines.push(`${orderLabel} payment status changed to ${String(newValues.payment_status ?? "updated")}`);
  }
  if (orderChanged) {
    lines.push(`${orderLabel} status changed to ${String(newValues.order_status ?? "updated")}`);
  }

  if (!lines.length) {
    return [`${orderLabel} updated`];
  }

  return lines;
}

function summarizeUserAudit(audit: ClientAuditEntry): string[] {
  const event = String(audit.event ?? "").toLowerCase();
  const oldValues = audit.old_values ?? {};
  const newValues = audit.new_values ?? {};
  const keys = changedKeys(audit);

  if (event === "created" || !keys.length) {
    return ["Client profile created"];
  }

  if (event === "deleted") {
    return ["Client profile removed"];
  }

  const lines: string[] = [];
  const usedKeys = new Set<string>();

  for (const [fileKey, label] of Object.entries(FILE_FIELDS)) {
    if (!keys.includes(fileKey)) continue;
    usedKeys.add(fileKey);
    const hadFile = oldValues[fileKey] != null && String(oldValues[fileKey]).trim() !== "";
    const hasFile = newValues[fileKey] != null && String(newValues[fileKey]).trim() !== "";
    if (!hadFile && hasFile) {
      lines.push(`${label} uploaded`);
    } else if (hadFile && !hasFile) {
      lines.push(`${label} removed`);
    } else {
      lines.push(`${label} updated`);
    }
  }

  if (keys.includes("owner_id")) {
    usedKeys.add("owner_id");
    lines.push("Client owner updated");
  }

  if (keys.includes("is_active")) {
    usedKeys.add("is_active");
    const active = newValues.is_active === true || newValues.is_active === 1 || newValues.is_active === "1";
    lines.push(active ? "Client marked as active" : "Client marked as inactive");
  }

  if (keys.includes("website")) {
    usedKeys.add("website");
    lines.push("Website updated");
  }

  for (const group of FIELD_GROUPS) {
    const touched = group.keys.filter((key) => keys.includes(key));
    if (!touched.length) continue;
    touched.forEach((key) => usedKeys.add(key));
    lines.push(`${group.label} updated`);
  }

  const remaining = keys.filter((key) => !usedKeys.has(key));
  if (remaining.length === 1) {
    const label = remaining[0].replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    lines.push(`${label} updated`);
  } else if (remaining.length > 1) {
    lines.push("Other client details updated");
  }

  if (!lines.length) {
    return ["Client profile updated"];
  }

  return Array.from(new Set(lines));
}

function buildSummary(audit: ClientAuditEntry): string[] {
  const model = String(audit.auditable_type ?? "").split("\\").pop()?.toLowerCase() ?? "";
  const event = String(audit.event ?? "updated").toLowerCase();
  const label = modelName(audit.auditable_type);

  if (model === "salestransaction") {
    return summarizeOrderAudit(audit);
  }

  if (model === "user") {
    return summarizeUserAudit(audit);
  }

  if (event === "created") return [`${label} created`];
  if (event === "deleted") return [`${label} removed`];
  if (event === "restored") return [`${label} restored`];
  return [`${label} updated`];
}

function timelineIcon(audit: ClientAuditEntry) {
  const model = String(audit.auditable_type ?? "").split("\\").pop()?.toLowerCase() ?? "";
  const event = String(audit.event ?? "").toLowerCase();
  const keys = changedKeys(audit);

  if (event === "created") {
    if (model === "salestransaction") return "fa-solid fa-cart-shopping";
    return "fa-solid fa-building";
  }
  if (keys.some((key) => key in FILE_FIELDS)) return "fa-solid fa-paperclip";
  if (event === "deleted") return "fa-solid fa-trash";
  if (model === "salestransaction") return "fa-solid fa-receipt";
  return "fa-solid fa-pen";
}

type Props = {
  audits: ClientAuditEntry[];
  createdAt?: string | null;
  clientName?: string | null;
};

export default function ClientTimeline({ audits, createdAt, clientName }: Props) {
  const entries =
    audits.length > 0
      ? audits
      : createdAt
        ? [
            {
              id: "client-created",
              event: "created",
              auditable_type: "User",
              created_at: createdAt,
              actor_name: null,
              old_values: {},
              new_values: {},
            } satisfies ClientAuditEntry,
          ]
        : [];

  if (!entries.length) {
    return <p className={styles.emptyState}>No timeline history found for this client.</p>;
  }

  let lastDate = "";

  return (
    <div className={styles.clientTimeline}>
      <div className={styles.clientTimelineHead}>
        <h4 className={styles.clientCrmSectionTitle}>Timeline History</h4>
        {clientName ? <p className={styles.panelSubtitle}>{clientName}</p> : null}
      </div>

      <ol className={styles.clientTimelineList}>
        {entries.map((audit) => {
          const when = formatWhen(audit.created_at);
          const showDate = when.date !== lastDate;
          lastDate = when.date;
          const lines = buildSummary(audit);

          return (
            <li key={String(audit.id ?? `${audit.created_at}-${lines[0]}`)} className={styles.clientTimelineItem}>
              {showDate ? <div className={styles.clientTimelineDate}>{when.date}</div> : null}
              <div className={styles.clientTimelineRow}>
                <div className={styles.clientTimelineRail} aria-hidden="true">
                  <span className={styles.clientTimelineDot}>
                    <i className={timelineIcon(audit)} aria-hidden="true" />
                  </span>
                </div>
                <div className={styles.clientTimelineCard}>
                  <div className={styles.clientTimelineMeta}>
                    <span>{when.time || "—"}</span>
                    <span>{audit.actor_name || "System"}</span>
                  </div>
                  <div className={styles.clientTimelineBody}>
                    {lines.map((line) => (
                      <p key={line}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
