import { parseHostingClassification } from "@/lib/commerceAdmin/hostingTransactionTypes";
import { parseDealMeta } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { clientBillingInCharge, clientDisplayName, clientOwnerName } from "@/lib/commerceAdmin/clientHelpers";
import { paymentStatusLabel, type TxColumnKey } from "@/lib/commerceAdmin/transactionHelpers";
import { userFacingNotes } from "@/lib/commerceAdmin/hostingTransactionActions";
import type { CommerceServiceAdminRow } from "@/services/commerceAdminService";
import type { CustomerRow, CustomerServiceLine } from "@/services/customerService";
import {
  getSalesTransactions,
  type SalesTransaction,
} from "@/services/salesTransactionService";

export type ClientDealLineItem = {
  id: string;
  name: string;
  domain: string;
  period: string;
  listPrice: number;
  quantity: number;
  amount: number;
  discount: number;
  tax: number;
};

export type ClientDealRow = {
  id: string;
  transactionId?: number | null;
  transactionNo?: string | null;
  clientOwner: string;
  clientName: string;
  planName: string;
  stage: string;
  clientStatus: string;
  productStatus: string;
  subject: string;
  productCategory: string;
  domainName: string;
  contactName: string;
  closingDate: string;
  salesStatus: string;
  paymentTerms: string;
  paymentMethod: string;
  paymentStatus: string;
  expectedRevenue: number | null;
  probability: string;
  statusTriggerDate: string;
  joNumber: string;
  billingInCharge: string;
  dealStatus: string;
  invoiceStatus: string;
  invoiceSentDate: string;
  invoiceReceivedDate: string;
  paymentCommitmentDate: string;
  collectionNote: string;
  dealOwner: string;
  status: string;
  amount: number | null;
  items: ClientDealLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  adjustment: number;
  grandTotal: number;
};

export type DealColumnKey =
  | "clientOwner"
  | "clientName"
  | "planName"
  | "stage"
  | "clientStatus"
  | "productStatus"
  | "subject"
  | "productCategory"
  | "domain"
  | "contactName"
  | "closingDate"
  | "salesStatus"
  | "paymentTerms"
  | "paymentMethod"
  | "paymentStatus"
  | "expectedRevenue"
  | "probability"
  | "statusTriggerDate"
  | "joNumber"
  | "billingInCharge"
  | "dealStatus"
  | "invoiceStatus"
  | "invoiceSentDate"
  | "invoiceReceivedDate"
  | "paymentCommitmentDate"
  | "collectionNote";

export const DEAL_COLUMN_LABELS: Record<DealColumnKey, string> = {
  clientOwner: "Client Owner",
  probability: "Probability (%)",
  expectedRevenue: "Expected Revenue ₱",
  stage: "Stage",
  closingDate: "Closing Date",
  clientName: "Client Name",
  contactName: "Contact Name",
  clientStatus: "Client Status",
  productStatus: "Product Status",
  subject: "Subject",
  productCategory: "Product Category",
  salesStatus: "Sales Status",
  statusTriggerDate: "Status Trigger Date",
  joNumber: "JO Number",
  billingInCharge: "Billing-in-Charge",
  dealStatus: "Deal Status",
  paymentTerms: "Payment Terms",
  paymentMethod: "Payment Method",
  paymentStatus: "Payment Status",
  invoiceStatus: "Invoice Status",
  invoiceSentDate: "Invoice Sent Date",
  invoiceReceivedDate: "Invoice Received Date",
  paymentCommitmentDate: "Payment Commitment Date",
  collectionNote: "Collection Note",
  planName: "Plan Name",
  domain: "Domain",
};

export const DEFAULT_DEAL_COLUMNS: Record<DealColumnKey, boolean> = {
  clientOwner: true,
  probability: false,
  expectedRevenue: false,
  stage: true,
  closingDate: false,
  clientName: true,
  contactName: false,
  clientStatus: true,
  productStatus: false,
  subject: true,
  productCategory: true,
  salesStatus: false,
  statusTriggerDate: false,
  joNumber: false,
  billingInCharge: false,
  dealStatus: false,
  paymentTerms: false,
  paymentMethod: false,
  paymentStatus: false,
  invoiceStatus: false,
  invoiceSentDate: false,
  invoiceReceivedDate: false,
  paymentCommitmentDate: false,
  collectionNote: false,
  planName: false,
  domain: false,
};

export const DEAL_COLUMN_KEYS = Object.keys(DEAL_COLUMN_LABELS) as DealColumnKey[];

/** Fields with Column Visibility = YES. Plan Name and Domain stay reserved/off. */
export const DEAL_COLUMN_VISIBILITY_KEYS = DEAL_COLUMN_KEYS.filter(
  (key) => key !== "planName" && key !== "domain",
);

export function formatDealAmount(amount: number | null) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function orderAdminColumnValue(
  transaction: SalesTransaction,
  column: TxColumnKey,
  extras?: { assigned?: string | null },
) {
  const meta = parseDealMeta(transaction.notes);
  const itemName = String(transaction.items?.[0]?.name ?? "").trim();
  const stage = dealStage(transaction);
  const assigned = String(extras?.assigned ?? "").trim();

  switch (column) {
    case "clientOwner":
      return assigned || "Unassigned";
    case "probability":
      return dealProbability(stage, meta?.probability);
    case "expectedRevenue": {
      const fromMeta = Number(meta?.expectedRevenue);
      const amount =
        Number.isFinite(fromMeta) && String(meta?.expectedRevenue ?? "").trim() !== ""
          ? fromMeta
          : Number(transaction.grand_total ?? 0);
      return formatDealAmount(Number.isFinite(amount) ? amount : null);
    }
    case "stage":
      return stage;
    case "closingDate":
      return formatDealDate(meta?.closingDate || transaction.issued_date || transaction.transacted_at);
    case "clientName":
      return dash(transaction.customer_name);
    case "contactName":
      return metaText(meta?.contactName);
    case "clientStatus":
      return metaText(meta?.dealType);
    case "productStatus":
      return metaText(meta?.dealSubType);
    case "subject":
      return metaText(meta?.productCategory, dealSubjectFromName(itemName));
    case "productCategory":
      return metaText(meta?.productName, itemName || "—");
    case "salesStatus":
      return metaText(meta?.salesStatus, titleCaseStatus(transaction.order_status));
    case "statusTriggerDate":
      return formatDealDate(meta?.statusTriggerDate || transaction.created_at || transaction.transacted_at);
    case "joNumber":
      return metaText(meta?.joNumber, extractJoNumber(transaction.notes, transaction.transaction_no));
    case "billingInCharge":
      return metaText(meta?.billingInCharge);
    case "dealStatus":
      return metaText(meta?.dealStatus, resolveDealStatus(transaction));
    case "paymentTerms":
      return metaText(meta?.paymentTerms, paymentTermsFrom(transaction));
    case "paymentMethod":
      return metaText(meta?.paymentMethod, extractPaymentMethod(transaction.notes));
    case "paymentStatus":
      return metaText(meta?.paymentStatus, paymentStatusLabel(transaction.payment_status));
    case "invoiceStatus":
      return metaText(meta?.invoiceStatus, invoiceStatusFrom(transaction));
    case "invoiceSentDate":
      return formatDealDate(meta?.invoiceSentDate || transaction.issued_date || transaction.transacted_at);
    case "invoiceReceivedDate":
      return meta?.invoiceReceivedDate ? formatDealDate(meta.invoiceReceivedDate) : "—";
    case "paymentCommitmentDate":
      return formatDealDate(meta?.paymentCommitmentDate || transaction.due_date);
    case "collectionNote":
      return metaText(meta?.collectionNote, collectionNoteFrom(transaction.notes));
    default:
      return "—";
  }
}

function dash(value?: string | null) {
  const text = String(value ?? "").trim();
  return text || "—";
}

export function formatDealDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return dash(value);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function titleCaseStatus(value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text) return "—";
  return text.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function dealStage(transaction?: SalesTransaction | null) {
  const metaStage = String(parseDealMeta(transaction?.notes)?.stage ?? "").trim();
  if (metaStage) return metaStage;
  if (!transaction) return "Qualification";
  const order = String(transaction.order_status ?? "").toLowerCase();
  const payment = String(transaction.payment_status ?? "").toLowerCase();
  if (["paid", "completed", "success"].includes(payment) || ["completed", "delivered", "closed won"].includes(order)) {
    return "Closed Won";
  }
  if (["cancelled", "canceled", "failed"].includes(order)) return "Closed Lost";
  if (["pending", "processing"].includes(order) || payment === "pending") return "Qualification";
  return titleCaseStatus(transaction.order_status) === "—" ? "Qualification" : titleCaseStatus(transaction.order_status);
}

function dealProbability(stage: string, metaProbability?: string) {
  const fromMeta = String(metaProbability ?? "").trim();
  if (fromMeta) return fromMeta.endsWith("%") ? fromMeta : `${fromMeta}%`;
  if (stage === "Closed Won") return "100%";
  if (stage === "Closed Lost") return "0%";
  if (stage === "Negotiation/Review") return "70%";
  if (stage === "Proposal Submitted") return "60%";
  if (stage === "Sales Manager's Approval") return "50%";
  return "10%";
}

function extractPaymentMethod(notes?: string | null) {
  const match = String(notes ?? "").match(/Payment:\s*([^·\n]+)/i);
  return dash(match?.[1]);
}

function extractJoNumber(notes?: string | null, transactionNo?: string | null) {
  const match = String(notes ?? "").match(/\bJO[- ]?\d[\w-]*/i);
  if (match?.[0]) return match[0];
  const fromNo = String(transactionNo ?? "").match(/\bJO[- ]?\d[\w-]*/i);
  return fromNo?.[0] || "—";
}

function paymentTermsFrom(transaction?: SalesTransaction | null) {
  if (!transaction) return "—";
  const issued = Date.parse(String(transaction.issued_date || transaction.transacted_at || ""));
  const due = Date.parse(String(transaction.due_date || ""));
  if (!Number.isFinite(due)) return "—";
  if (!Number.isFinite(issued)) return `Due ${formatDealDate(transaction.due_date)}`;
  const days = Math.round((due - issued) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Due on receipt";
  return `Net ${days}`;
}

function invoiceStatusFrom(transaction?: SalesTransaction | null) {
  if (!transaction) return "—";
  const payment = String(transaction.payment_status ?? "").toLowerCase();
  if (payment === "paid") return "Paid";
  if (payment === "overdue") return "Overdue";
  if (payment === "failed") return "Failed";
  if (payment === "refunded") return "Refunded";
  return "Unpaid";
}

function collectionNoteFrom(notes?: string | null) {
  const cleaned = userFacingNotes(notes)
    .replace(/Client Order\s*·\s*/gi, "")
    .replace(/Payment:\s*[^·\n]+/gi, "")
    .replace(/\s*·\s*/g, " ")
    .trim();
  return dash(cleaned);
}

function looksLikeDomain(value: string) {
  return /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(
    value.trim(),
  );
}

function formatDomain(value?: string | null): string | null {
  let input = String(value ?? "").trim();
  if (!input || input === "—") return null;
  input = input.replace(/^https?:\/\//i, "");
  input = input.split("/")[0]?.trim() ?? "";
  if (!input || input === "—") return null;
  const extracted = extractDomain(input);
  return extracted || (looksLikeDomain(input) ? input : input);
}

function extractDomain(text: string): string | null {
  const match = String(text ?? "").match(/([a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\.[a-z]{2,})?)/i);
  return match?.[1] ?? null;
}

function resolveClientDomain(
  client: CustomerRow,
  adminServices: CommerceServiceAdminRow[] = [],
): string | null {
  const fromClient =
    formatDomain(client.website) ||
    formatDomain(client.domain) ||
    formatDomain(client.subject_domain);
  if (fromClient) return fromClient;

  for (const service of client.services ?? []) {
    const domain = formatDomain(service.domain);
    if (domain) return domain;
  }
  for (const service of adminServices) {
    const domain = formatDomain(service.domain ?? service.subjectDomain);
    if (domain) return domain;
  }
  return null;
}

function matchingServiceLine(
  itemName: string,
  client: CustomerRow,
  adminServices: CommerceServiceAdminRow[] = [],
) {
  const needle = itemName.trim().toLowerCase();
  if (!needle) return null;

  const fromClient = (client.services ?? []).find((service) => {
    const hay = [service.title, service.plan, service.plan_name, service.subject, service.product_category]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");
    return hay.includes(needle) || needle.includes(String(service.title ?? "").toLowerCase());
  });
  if (fromClient) return fromClient;

  return (
    adminServices.find((service) => {
      const hay = [service.title, service.plan, service.subject, service.productCategory, service.planName]
        .map((value) => String(value ?? "").toLowerCase())
        .join(" ");
      return hay.includes(needle) || needle.includes(String(service.title ?? "").toLowerCase());
    }) ?? null
  );
}

function matchingServiceStatus(
  itemName: string,
  client: CustomerRow,
  adminServices: CommerceServiceAdminRow[] = [],
) {
  const line = matchingServiceLine(itemName, client, adminServices);
  if (!line) return null;
  return "status" in line ? line.status : null;
}

function matchingPlanName(
  itemName: string,
  client: CustomerRow,
  adminServices: CommerceServiceAdminRow[] = [],
) {
  const line = matchingServiceLine(itemName, client, adminServices);
  if (!line) return "—";
  const named = line as CustomerServiceLine & CommerceServiceAdminRow;
  return dash(named.planName || named.plan_name || named.plan);
}

export function dealSubjectFromName(name: string): string {
  const raw = String(name ?? "").trim();
  if (!raw) return "—";
  const hay = raw.toLowerCase();

  if (hay.startsWith("add on") || hay.includes("addon")) return "Add On";
  if (hay.includes("bare metal")) return "Dedicated Bare Metal Server";
  if (hay.includes("dedicated cloud")) return "Dedicated Cloud Server";
  if (hay.includes("docukit") || hay.includes("filehold") || hay.includes("filecare")) {
    return "Document Management System";
  }
  if (
    hay.includes("domain") ||
    hay.includes("tld") ||
    looksLikeDomain(raw)
  ) {
    return "Domain Registration";
  }
  if (
    hay.includes("managed i.t") ||
    hay.includes("managed it") ||
    hay.includes("doc pedro") ||
    hay.includes("eset")
  ) {
    return "Managed I.T. Services";
  }
  if (hay.includes("resell")) return "Resellership";
  if (hay.includes("web development") || hay.includes("web dev") || hay.includes("web design")) {
    return "Web Development";
  }
  if (
    hay.includes("linux cloud") ||
    hay.includes("windows cloud") ||
    hay.includes("web hosting") ||
    hay.includes("shared")
  ) {
    return "Web Hosting - Shared";
  }
  if (hay.includes("other") || hay.includes("consultanc")) return "Others";
  return "—";
}

function resolveProductStatus(
  transaction: SalesTransaction | null,
  dealType: string,
) {
  const subType = String(parseHostingClassification(transaction?.notes)?.subType ?? "").trim();
  if (subType) return subType;
  if (dealType === "Renewal - New Price") return "Renewal - New Price";
  if (dealType === "Renewal") return "Renewal";
  return "New";
}

function metaText(value?: string | null, fallback = "—") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function crmFields(params: {
  client: CustomerRow;
  transaction?: SalesTransaction | null;
  itemName: string;
  dealType: string;
  domain: string;
  amount: number | null;
  dealStatus: string;
  adminServices?: CommerceServiceAdminRow[];
}) {
  const { client, transaction, itemName, dealType, domain, amount, dealStatus, adminServices = [] } = params;
  const meta = parseDealMeta(transaction?.notes);
  const stage = dealStage(transaction);
  const clientOwner = clientOwnerName(client);
  const ownerFallback = clientOwner !== "Unassigned" ? clientOwner : clientBillingInCharge(client);
  const metaRevenue = Number(meta?.expectedRevenue);
  const expectedRevenue =
    Number.isFinite(metaRevenue) && String(meta?.expectedRevenue ?? "").trim() !== ""
      ? metaRevenue
      : amount;

  return {
    clientOwner: ownerFallback || "—",
    clientName: clientDisplayName(client),
    planName: matchingPlanName(itemName, client, adminServices),
    stage,
    clientStatus: metaText(meta?.dealType, dealType),
    productStatus: metaText(meta?.dealSubType, resolveProductStatus(transaction ?? null, dealType)),
    productCategory: metaText(meta?.productName, dash(itemName)),
    domainName: domain,
    contactName: metaText(meta?.contactName, dash(client.contact_person)),
    closingDate: meta?.closingDate ? formatDealDate(meta.closingDate) : formatDealDate(transaction?.issued_date ?? transaction?.transacted_at),
    salesStatus: metaText(meta?.salesStatus, titleCaseStatus(transaction?.order_status)),
    paymentTerms: metaText(meta?.paymentTerms, paymentTermsFrom(transaction)),
    paymentMethod: metaText(meta?.paymentMethod, extractPaymentMethod(transaction?.notes)),
    paymentStatus: metaText(meta?.paymentStatus, transaction ? paymentStatusLabel(transaction.payment_status) : "—"),
    expectedRevenue,
    probability: dealProbability(stage, meta?.probability),
    statusTriggerDate: meta?.statusTriggerDate
      ? formatDealDate(meta.statusTriggerDate)
      : formatDealDate(transaction?.created_at ?? transaction?.transacted_at),
    joNumber: metaText(meta?.joNumber, extractJoNumber(transaction?.notes, transaction?.transaction_no)),
    billingInCharge: metaText(meta?.billingInCharge, clientBillingInCharge(client)),
    dealStatus: metaText(meta?.dealStatus, dealStatus),
    invoiceStatus: metaText(meta?.invoiceStatus, invoiceStatusFrom(transaction)),
    invoiceSentDate: meta?.invoiceSentDate
      ? formatDealDate(meta.invoiceSentDate)
      : formatDealDate(transaction?.issued_date ?? transaction?.transacted_at),
    invoiceReceivedDate: meta?.invoiceReceivedDate ? formatDealDate(meta.invoiceReceivedDate) : "—",
    paymentCommitmentDate: meta?.paymentCommitmentDate
      ? formatDealDate(meta.paymentCommitmentDate)
      : formatDealDate(transaction?.due_date),
    collectionNote: metaText(meta?.collectionNote, collectionNoteFrom(transaction?.notes)),
    dealOwner: ownerFallback || "—",
    status: metaText(meta?.dealType, dealType),
    amount,
  };
}

function resolveDealType(
  itemName: string,
  transaction: SalesTransaction,
  priorItemNames: Set<string>,
) {
  const hay = `${itemName} ${transaction.notes ?? ""} ${transaction.items?.map((item) => item.item_type).join(" ") ?? ""}`.toLowerCase();
  const subType = String(parseHostingClassification(transaction.notes)?.subType ?? "").toLowerCase();

  if (subType.includes("new price") || hay.includes("new price")) return "Renewal - New Price";
  if (
    subType.includes("renewal") ||
    hay.includes("renewal") ||
    priorItemNames.has(itemName.trim().toLowerCase())
  ) {
    return "Renewal";
  }
  return "New Service";
}

function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function formatPeriod(start?: string | null, end?: string | null) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  const validStart = startDate && !Number.isNaN(startDate.getTime()) ? startDate : null;
  const validEnd = endDate && !Number.isNaN(endDate.getTime()) ? endDate : null;
  if (!validStart && !validEnd) return "";
  const fmt = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  if (validStart && validEnd) return `${fmt(validStart)} - ${fmt(validEnd)}`;
  return fmt((validStart ?? validEnd) as Date);
}

function vatFromInclusive(amount: number) {
  if (amount <= 0) return 0;
  return Math.round((amount * 12) / 112 * 100) / 100;
}

function buildLineItems(
  transaction: SalesTransaction,
  items: Array<{
    id?: number | string;
    name?: string | null;
    price?: string | number | null;
    quantity?: string | number | null;
    total_price?: string | number | null;
  }>,
  domainFallback: string,
): ClientDealLineItem[] {
  const headerTax = money(transaction.tax_total);
  const period = formatPeriod(transaction.issued_date ?? transaction.transacted_at, transaction.due_date);
  const mapped = items.map((item, index) => {
    const quantity = Math.max(1, money(item.quantity) || 1);
    const listPrice = money(item.price);
    let amount = money(item.total_price);
    if (amount <= 0) amount = listPrice * quantity;
    const domain =
      formatDomain(looksLikeDomain(String(item.name ?? "")) ? String(item.name) : extractDomain(String(item.name ?? ""))) ||
      domainFallback;
    return {
      id: String(item.id ?? `${transaction.id}-${index}`),
      name: String(item.name ?? transaction.transaction_no ?? "Item").trim() || "Item",
      domain: domain === "—" ? "" : domain,
      period,
      listPrice,
      quantity,
      amount,
      discount: 0,
      tax: 0,
    };
  });

  const amountSum = mapped.reduce((sum, item) => sum + item.amount, 0);
  return mapped.map((item) => ({
    ...item,
    tax:
      headerTax > 0 && amountSum > 0
        ? Math.round((headerTax * (item.amount / amountSum)) * 100) / 100
        : vatFromInclusive(item.amount),
  }));
}

function totalsFromItems(items: ClientDealLineItem[], transaction?: SalesTransaction | null) {
  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const discountTotal = transaction ? money(transaction.discount_total) : items.reduce((sum, item) => sum + item.discount, 0);
  const taxTotal = transaction ? money(transaction.tax_total) : items.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = transaction ? money(transaction.grand_total) || subtotal : subtotal;
  return { subtotal, discountTotal, taxTotal, adjustment: 0, grandTotal };
}

function resolveDealStatus(transaction: SalesTransaction, serviceStatus?: string | null) {
  const service = String(serviceStatus ?? "").toLowerCase();
  if (service === "active") return "Active";

  const order = String(transaction.order_status ?? "").toLowerCase();
  const payment = String(transaction.payment_status ?? "").toLowerCase();
  if (["cancelled", "canceled", "expired", "failed"].includes(order)) return "Inactive";
  if (
    ["paid", "completed", "success"].includes(payment) ||
    ["completed", "active", "delivered", "live"].includes(order)
  ) {
    return "Active";
  }
  if (["pending", "processing", "provisioning"].includes(order) || payment === "pending") {
    return "Provisioning";
  }
  return "Active";
}

function extractTransactions(payload: unknown): SalesTransaction[] {
  if (!payload || typeof payload !== "object") return [];
  const body = payload as { data?: unknown; meta?: { last_page?: number } };
  if (Array.isArray(body.data)) return body.data as SalesTransaction[];
  if (body.data && typeof body.data === "object" && Array.isArray((body.data as { data?: unknown }).data)) {
    return (body.data as { data: SalesTransaction[] }).data;
  }
  return [];
}

export async function fetchCustomerDealTransactions(customerId: number): Promise<SalesTransaction[]> {
  const all: SalesTransaction[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await getSalesTransactions(
      { customer_id: customerId, per_page: 200, page },
      { silent: true },
    );
    all.push(...extractTransactions(res));
    lastPage = Number(res?.last_page ?? res?.meta?.last_page ?? 1) || 1;
    page += 1;
  } while (page <= lastPage);

  return all;
}

export function buildClientDealRows(
  client: CustomerRow,
  transactions: SalesTransaction[],
  adminServices: CommerceServiceAdminRow[] = [],
): ClientDealRow[] {
  const clientDomainValue = resolveClientDomain(client, adminServices);

  const sorted = [...transactions].sort((a, b) => {
    const byCreated =
      new Date(b.created_at ?? b.transacted_at ?? 0).getTime() -
      new Date(a.created_at ?? a.transacted_at ?? 0).getTime();
    return byCreated !== 0 ? byCreated : Number(b.id) - Number(a.id);
  });

  const seenItemNames = new Set<string>();
  const rows: ClientDealRow[] = [];

  for (const transaction of sorted) {
    const items = transaction.items?.length
      ? transaction.items
      : [
          {
            id: transaction.id,
            name: transaction.transaction_no,
            price: transaction.grand_total,
            quantity: 1,
            total_price: transaction.grand_total,
          },
        ];

    const lineItems = buildLineItems(transaction, items, clientDomainValue || "");
    const totals = totalsFromItems(lineItems, transaction);

    for (const item of items) {
      const itemName = String(item.name ?? "").trim();
      let amount = Number(item.total_price ?? Number(item.price || 0) * Number(item.quantity || 1));
      if (!Number.isFinite(amount) || amount <= 0) {
        const fallbackTotal = Number(transaction.grand_total);
        if (items.length === 1 && Number.isFinite(fallbackTotal) && fallbackTotal > 0) {
          amount = fallbackTotal;
        }
      }
      const domain =
        formatDomain(looksLikeDomain(itemName) ? itemName : extractDomain(itemName)) ||
        clientDomainValue ||
        "—";
      const dealType = resolveDealType(itemName, transaction, seenItemNames);
      const resolvedAmount = Number.isFinite(amount) && amount > 0 ? amount : null;
      const meta = parseDealMeta(transaction.notes);

      rows.push({
        id: `${transaction.id}:${item.id ?? itemName}`,
        transactionId: transaction.id,
        transactionNo: transaction.transaction_no,
        subject: metaText(meta?.productCategory, dealSubjectFromName(itemName)),
        ...crmFields({
          client,
          transaction,
          itemName,
          dealType,
          domain,
          amount: resolvedAmount,
          dealStatus: resolveDealStatus(transaction, matchingServiceStatus(itemName, client, adminServices)),
          adminServices,
        }),
        items: lineItems,
        ...totals,
      });

      if (itemName) seenItemNames.add(itemName.toLowerCase());
    }
  }

  if (rows.length > 0) return rows;

  if (client.services?.length) {
    return client.services.map((service, index) => {
      const domain = formatDomain(service.domain) || clientDomainValue || "—";
      const name = String(service.title || service.plan_name || service.subject || "Service");
      const items: ClientDealLineItem[] = [
        {
          id: `service:${service.id ?? index}`,
          name,
          domain: domain === "—" ? "" : domain,
          period: "",
          listPrice: 0,
          quantity: 1,
          amount: 0,
          discount: 0,
          tax: 0,
        },
      ];
      return {
        id: `service:${service.id ?? index}`,
        subject: dealSubjectFromName(String(service.product_category || service.subject || service.plan_name || service.title || "")),
        ...crmFields({
          client,
          itemName: name,
          dealType: "New Service",
          domain,
          amount: null,
          dealStatus: String(service.status || "Active"),
          adminServices,
        }),
        items,
        ...totalsFromItems(items),
      };
    });
  }

  return adminServices.map((service, index) => {
    const domain = formatDomain(service.domain ?? service.subjectDomain) || clientDomainValue || "—";
    const name = String(service.title || service.planName || service.subject || "Service");
    const items: ClientDealLineItem[] = [
      {
        id: `service:${service.id ?? index}`,
        name,
        domain: domain === "—" ? "" : domain,
        period: "",
        listPrice: 0,
        quantity: 1,
        amount: 0,
        discount: 0,
        tax: 0,
      },
    ];
    return {
      id: `service:${service.id ?? index}`,
      subject: dealSubjectFromName(String(service.productCategory || service.subject || service.planName || service.title || "")),
      ...crmFields({
        client,
        itemName: name,
        dealType: "New Service",
        domain,
        amount: null,
        dealStatus: String(service.status || "Active"),
        adminServices,
      }),
      items,
      ...totalsFromItems(items),
    };
  });
}
