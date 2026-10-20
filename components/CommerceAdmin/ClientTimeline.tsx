import { useEffect, useMemo, useState } from "react";
import styles from "@/styles/commerceAdmin.module.css";

const PROFILE_PREVIEW_COUNT = 8;
const INVOICE_EVENT_PREVIEW_COUNT = 5;

export type ClientAuditEntry = {
  id?: number | string;
  event?: string | null;
  auditable_type?: string | null;
  auditable_id?: number | string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  actor_name?: string | null;
  created_at?: string | null;
  transaction_no?: string | null;
  invoice_id?: string | null;
};

export type ClientInvoiceTimelineRow = {
  id: number;
  transaction_no: string;
  invoice_id: string;
  grand_total?: string | number | null;
  payment_status?: string | null;
  order_status?: string | null;
  transacted_at?: string | null;
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
  { label: "Authorized contacts & signatories", keys: ["contact_information"] },
  {
    label: "Billing address",
    keys: ["address_street", "address_city", "address_province", "address_region", "address_zip", "address_country"],
  },
  {
    label: "Shipping address",
    keys: ["shipping_street", "shipping_city", "shipping_province", "shipping_region", "shipping_zip", "shipping_country"],
  },
  {
    label: "Business details",
    keys: ["industry", "tax_classification", "tin_number", "other_numbers", "client_classification", "client_type", "ownership"],
  },
  {
    label: "Billing settings",
    keys: ["currency", "exchange_rate", "billing_in_charge", "workdrive_folder_url", "workdrive_folder_id"],
  },
];

function auditableModel(auditableType?: string | null) {
  return String(auditableType ?? "")
    .split("\\")
    .pop()
    ?.toLowerCase() ?? "";
}

function modelName(auditableType?: string | null) {
  const raw = String(auditableType ?? "").split("\\").pop() ?? "";
  const key = raw.toLowerCase();
  if (key === "user") return "Client profile";
  if (key === "salestransaction") return "Invoice";
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

function parseTime(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function changedKeys(audit: ClientAuditEntry) {
  const oldValues = audit.old_values ?? {};
  const newValues = audit.new_values ?? {};
  return Array.from(new Set([...Object.keys(oldValues), ...Object.keys(newValues)])).filter(
    (key) => !IGNORED_FIELDS.has(key),
  );
}

function invoiceLabel(audit: ClientAuditEntry) {
  const fromApi = String(audit.invoice_id ?? "").trim();
  if (fromApi) return fromApi;
  const no = String(
    audit.transaction_no ?? pickValue(audit.new_values ?? {}, ["transaction_no"]) ?? pickValue(audit.old_values ?? {}, ["transaction_no"]) ?? "",
  ).trim();
  return no ? `INV-${no}` : "Invoice";
}

function summarizeOrderAudit(audit: ClientAuditEntry): string[] {
  const event = String(audit.event ?? "").toLowerCase();
  const oldValues = audit.old_values ?? {};
  const newValues = audit.new_values ?? {};
  const orderLabel = invoiceLabel(audit);
  const amount = formatMoney(pickValue(newValues, ["grand_total"]) ?? pickValue(oldValues, ["grand_total"]));

  if (event === "created") {
    return [amount ? `${orderLabel} issued — ${amount}` : `${orderLabel} issued`];
  }

  if (event === "deleted") {
    return [`${orderLabel} was cancelled`];
  }

  const lines: string[] = [];
  const paymentChanged =
    "payment_status" in newValues &&
    String(oldValues.payment_status ?? "") !== String(newValues.payment_status ?? "");
  const orderChanged =
    "order_status" in newValues && String(oldValues.order_status ?? "") !== String(newValues.order_status ?? "");
  const totalChanged =
    "grand_total" in newValues && String(oldValues.grand_total ?? "") !== String(newValues.grand_total ?? "");

  if (paymentChanged) {
    lines.push(`Payment status → ${String(newValues.payment_status ?? "updated")}`);
  }
  if (orderChanged) {
    lines.push(`Order status → ${String(newValues.order_status ?? "updated")}`);
  }
  if (totalChanged) {
    const nextAmount = formatMoney(newValues.grand_total);
    lines.push(nextAmount ? `Invoice total updated to ${nextAmount}` : "Invoice total updated");
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

  if (event === "created" || (!keys.length && event !== "deleted")) {
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
  const model = auditableModel(audit.auditable_type);
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
  const model = auditableModel(audit.auditable_type);
  const event = String(audit.event ?? "").toLowerCase();
  const keys = changedKeys(audit);

  if (event === "created") {
    if (model === "salestransaction") return "fa-solid fa-file-invoice-dollar";
    return "fa-solid fa-building";
  }
  if (keys.some((key) => key in FILE_FIELDS)) return "fa-solid fa-paperclip";
  if (event === "deleted") return "fa-solid fa-trash";
  if (model === "salestransaction") return "fa-solid fa-receipt";
  return "fa-solid fa-pen";
}

function isProfileAudit(audit: ClientAuditEntry) {
  return auditableModel(audit.auditable_type) === "user";
}

function isInvoiceAudit(audit: ClientAuditEntry) {
  return auditableModel(audit.auditable_type) === "salestransaction";
}

function sortNewestFirst(entries: ClientAuditEntry[]) {
  return [...entries].sort((a, b) => parseTime(b.created_at) - parseTime(a.created_at));
}

function buildInvoiceGroups(audits: ClientAuditEntry[], invoices: ClientInvoiceTimelineRow[]) {
  const groups = new Map<
    string,
    {
      invoiceId: string;
      transactionId: number | null;
      meta: ClientInvoiceTimelineRow | null;
      events: ClientAuditEntry[];
    }
  >();

  for (const row of invoices) {
    const invoiceId = row.invoice_id || `INV-${row.transaction_no}`;
    groups.set(invoiceId, {
      invoiceId,
      transactionId: row.id,
      meta: row,
      events: [],
    });
  }

  for (const audit of audits.filter(isInvoiceAudit)) {
    const invoiceId = invoiceLabel(audit);
    const existing = groups.get(invoiceId);
    if (existing) {
      existing.events.push(audit);
      continue;
    }
    groups.set(invoiceId, {
      invoiceId,
      transactionId: Number(audit.auditable_id) || null,
      meta: null,
      events: [audit],
    });
  }

  const result = Array.from(groups.values()).map((group) => {
    let events = sortNewestFirst(group.events);
    const hasCreated = events.some((entry) => String(entry.event ?? "").toLowerCase() === "created");
    const meta = group.meta;

    if (meta && !hasCreated) {
      const seed: ClientAuditEntry = {
        id: `invoice-seed-${meta.id}`,
        event: "created",
        auditable_type: "SalesTransaction",
        auditable_id: meta.id,
        created_at: meta.transacted_at ?? meta.created_at ?? null,
        actor_name: null,
        transaction_no: meta.transaction_no,
        invoice_id: group.invoiceId,
        old_values: {},
        new_values: {
          transaction_no: meta.transaction_no,
          grand_total: meta.grand_total,
          payment_status: meta.payment_status,
          order_status: meta.order_status,
        },
      };
      events = sortNewestFirst([...events, seed]);
    }

    const latestAt = events[0]?.created_at ?? meta?.created_at ?? meta?.transacted_at ?? null;
    return { ...group, events, latestAt };
  });

  return result.sort((a, b) => parseTime(b.latestAt) - parseTime(a.latestAt));
}

function eventSummaryText(audit: ClientAuditEntry) {
  return buildSummary(audit).join(" · ");
}

function CompactTimelineFeed({
  entries,
  previewCount,
  scrollWhenExpanded,
}: {
  entries: ClientAuditEntry[];
  previewCount?: number;
  scrollWhenExpanded?: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const limit = previewCount ?? entries.length;
  const canCollapse = entries.length > limit;
  const visible = showAll || !canCollapse ? entries : entries.slice(0, limit);
  const hiddenCount = entries.length - visible.length;

  let lastDate = "";

  return (
    <div className={styles.clientTimelineFeedWrap}>
      <ol
        className={`${styles.clientTimelineList} ${styles.clientTimelineListCompact}${
          showAll && scrollWhenExpanded && entries.length > 12 ? ` ${styles.clientTimelineScrollPane}` : ""
        }`}
      >
        {visible.map((audit) => {
          const when = formatWhen(audit.created_at);
          const showDate = when.date !== lastDate;
          lastDate = when.date;
          const summary = eventSummaryText(audit);
          const actor = audit.actor_name || "System";

          return (
            <li key={String(audit.id ?? `${audit.created_at}-${summary}`)} className={styles.clientTimelineCompactItem}>
              {showDate ? <div className={styles.clientTimelineCompactDate}>{when.date}</div> : null}
              <div className={styles.clientTimelineCompactRow}>
                <span className={styles.clientTimelineCompactDot} aria-hidden="true">
                  <i className={timelineIcon(audit)} aria-hidden="true" />
                </span>
                <div className={styles.clientTimelineCompactContent}>
                  <div className={styles.clientTimelineCompactMeta}>
                    <span>{when.time || "—"}</span>
                    <span aria-hidden="true">·</span>
                    <span>{actor}</span>
                  </div>
                  <p className={styles.clientTimelineCompactText}>{summary}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {canCollapse ? (
        <button
          type="button"
          className={styles.clientTimelineMoreBtn}
          onClick={() => setShowAll((current) => !current)}
          aria-expanded={showAll}
        >
          {showAll ? "Show fewer events" : `Show ${hiddenCount} more event${hiddenCount === 1 ? "" : "s"}`}
        </button>
      ) : null}
    </div>
  );
}

type InvoiceGroup = ReturnType<typeof buildInvoiceGroups>[number];

function InvoiceTimelineGroup({
  group,
  open,
  onToggle,
}: {
  group: InvoiceGroup;
  open: boolean;
  onToggle: () => void;
}) {
  const amount = formatMoney(group.meta?.grand_total);
  const paymentStatus = group.meta?.payment_status;
  const orderStatus = group.meta?.order_status;
  const latest = group.events[0];
  const latestSummary = latest ? eventSummaryText(latest) : "No activity recorded";
  const latestWhen = latest ? formatWhen(latest.created_at) : null;

  return (
    <article className={`${styles.clientTimelineInvoiceGroup}${open ? ` ${styles.clientTimelineInvoiceGroupOpen}` : ""}`}>
      <button type="button" className={styles.clientTimelineInvoiceTrigger} onClick={onToggle} aria-expanded={open}>
        <span className={styles.clientTimelineInvoiceChevron} aria-hidden="true">
          <i className={`fa-solid fa-chevron-${open ? "down" : "right"}`} />
        </span>
        <span className={styles.clientTimelineInvoiceTriggerMain}>
          <span className={styles.clientTimelineInvoiceTitleRow}>
            <strong>{group.invoiceId}</strong>
            {amount ? <span className={styles.clientTimelineInvoiceAmount}>{amount}</span> : null}
            <span className={styles.clientTimelineInvoiceEventCount}>
              {group.events.length} event{group.events.length === 1 ? "" : "s"}
            </span>
          </span>
          <span className={styles.clientTimelineInvoiceMeta}>
            {paymentStatus ? <span>Payment: {paymentStatus}</span> : null}
            {orderStatus ? <span>Order: {orderStatus}</span> : null}
            {group.latestAt ? <span>Updated {formatWhen(group.latestAt).date}</span> : null}
          </span>
          {!open ? (
            <span className={styles.clientTimelineInvoicePreview}>
              Latest: {latestSummary}
              {latestWhen?.time ? ` · ${latestWhen.time}` : ""}
            </span>
          ) : null}
        </span>
      </button>
      {open ? (
        <div className={styles.clientTimelineInvoiceBody}>
          <CompactTimelineFeed
            entries={group.events}
            previewCount={INVOICE_EVENT_PREVIEW_COUNT}
            scrollWhenExpanded
          />
        </div>
      ) : null}
    </article>
  );
}

type Props = {
  audits: ClientAuditEntry[];
  invoices?: ClientInvoiceTimelineRow[];
  createdAt?: string | null;
  clientName?: string | null;
};

export default function ClientTimeline({ audits, invoices = [], createdAt, clientName }: Props) {
  const [openInvoices, setOpenInvoices] = useState<Record<string, boolean>>({});

  const profileEntries = useMemo(() => {
    const profileAudits = sortNewestFirst(audits.filter(isProfileAudit));
    if (profileAudits.length > 0) {
      return profileAudits;
    }
    if (createdAt) {
      return [
        {
          id: "client-created",
          event: "created",
          auditable_type: "User",
          created_at: createdAt,
          actor_name: null,
          old_values: {},
          new_values: {},
        } satisfies ClientAuditEntry,
      ];
    }
    return [];
  }, [audits, createdAt]);

  const invoiceGroups = useMemo(() => buildInvoiceGroups(audits, invoices), [audits, invoices]);

  useEffect(() => {
    setOpenInvoices((current) => {
      const next = { ...current };
      invoiceGroups.forEach((group, index) => {
        if (next[group.invoiceId] === undefined) {
          next[group.invoiceId] = index === 0;
        }
      });
      return next;
    });
  }, [invoiceGroups]);

  const allInvoicesExpanded =
    invoiceGroups.length > 0 && invoiceGroups.every((group) => openInvoices[group.invoiceId]);

  const hasAny = profileEntries.length > 0 || invoiceGroups.some((group) => group.events.length > 0);

  if (!hasAny) {
    return <p className={styles.emptyState}>No timeline history found for this client.</p>;
  }

  const setAllInvoicesOpen = (open: boolean) => {
    setOpenInvoices(Object.fromEntries(invoiceGroups.map((group) => [group.invoiceId, open])));
  };

  return (
    <div className={styles.clientTimeline}>
      <div className={styles.clientTimelineHead}>
        <h4 className={styles.clientCrmSectionTitle}>Timeline</h4>
        {clientName ? <p className={styles.panelSubtitle}>{clientName}</p> : null}
      </div>

      <section className={styles.clientTimelineSection} aria-labelledby="client-timeline-profile-heading">
        <div className={styles.clientTimelineSectionHead}>
          <h5 id="client-timeline-profile-heading" className={styles.clientTimelineSectionTitle}>
            Client profile
          </h5>
          <p className={styles.clientTimelineSectionHint}>
            {profileEntries.length} update{profileEntries.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className={styles.clientTimelinePanel}>
          {profileEntries.length ? (
            <CompactTimelineFeed
              entries={profileEntries}
              previewCount={PROFILE_PREVIEW_COUNT}
              scrollWhenExpanded
            />
          ) : (
            <p className={styles.emptyState}>No profile updates recorded yet.</p>
          )}
        </div>
      </section>

      <section className={styles.clientTimelineSection} aria-labelledby="client-timeline-invoices-heading">
        <div className={styles.clientTimelineSectionHeadRow}>
          <div className={styles.clientTimelineSectionHead}>
            <h5 id="client-timeline-invoices-heading" className={styles.clientTimelineSectionTitle}>
              Invoices
            </h5>
            <p className={styles.clientTimelineSectionHint}>
              {invoiceGroups.length} invoice{invoiceGroups.length === 1 ? "" : "s"} · expand to see activity
            </p>
          </div>
          {invoiceGroups.length > 1 ? (
            <button
              type="button"
              className={styles.clientTimelineMoreBtn}
              onClick={() => setAllInvoicesOpen(!allInvoicesExpanded)}
            >
              {allInvoicesExpanded ? "Collapse all" : "Expand all"}
            </button>
          ) : null}
        </div>

        {invoiceGroups.length ? (
          <div className={styles.clientTimelineInvoiceStack}>
            {invoiceGroups.map((group) => (
              <InvoiceTimelineGroup
                key={group.invoiceId}
                group={group}
                open={Boolean(openInvoices[group.invoiceId])}
                onToggle={() =>
                  setOpenInvoices((current) => ({
                    ...current,
                    [group.invoiceId]: !current[group.invoiceId],
                  }))
                }
              />
            ))}
          </div>
        ) : (
          <div className={styles.clientTimelinePanel}>
            <p className={styles.emptyState}>No invoices or invoice activity for this client yet.</p>
          </div>
        )}
      </section>
    </div>
  );
}
