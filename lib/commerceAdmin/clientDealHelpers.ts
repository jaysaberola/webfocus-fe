import { parseHostingClassification } from "@/lib/commerceAdmin/hostingTransactionTypes";
import { clientBillingInCharge, clientDisplayName, clientOwnerName } from "@/lib/commerceAdmin/clientHelpers";
import { paymentStatusLabel } from "@/lib/commerceAdmin/transactionHelpers";
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
  clientName: "Client Name",
  planName: "Plan Name",
  stage: "Stage",
  clientStatus: "Client Status",
  productStatus: "Product Status",
  subject: "Subject",
  productCategory: "Product Category",
  domain: "Domain",
  contactName: "Contact Name",
  closingDate: "Closing Date",
  salesStatus: "Sales Status",
  paymentTerms: "Payment Terms",
  paymentMethod: "Payment Method",
  paymentStatus: "Payment Status",
  expectedRevenue: "Expected Revenue ₱",
  probability: "Probability (%)",
  statusTriggerDate: "Status Trigger Date",
  joNumber: "JO Number",
  billingInCharge: "Billing-in-Charge",
  dealStatus: "Deal Status",
  invoiceStatus: "Invoice Status",
  invoiceSentDate: "Invoice Sent Date",
  invoiceReceivedDate: "Invoice Received Date",
  paymentCommitmentDate: "Payment Commitment Date",
  collectionNote: "Collection Note",
};

export const DEFAULT_DEAL_COLUMNS: Record<DealColumnKey, boolean> = {
  clientOwner: true,
  clientName: true,
  planName: false,
  stage: true,
  clientStatus: true,
  productStatus: false,
  subject: true,
  productCategory: true,
  domain: false,
  contactName: false,
  closingDate: false,
  salesStatus: false,
  paymentTerms: false,
  paymentMethod: false,
  paymentStatus: false,
  expectedRevenue: false,
  probability: false,
  statusTriggerDate: false,
  joNumber: false,
  billingInCharge: false,
  dealStatus: false,
  invoiceStatus: false,
  invoiceSentDate: false,
  invoiceReceivedDate: false,
  paymentCommitmentDate: false,
  collectionNote: false,
};

export const DEAL_COLUMN_KEYS = Object.keys(DEAL_COLUMN_LABELS) as DealColumnKey[];

export function formatDealAmount(amount: number | null) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
  if (!transaction) return "Open";
  const order = String(transaction.order_status ?? "").toLowerCase();
  const payment = String(transaction.payment_status ?? "").toLowerCase();
  if (["paid", "completed", "success"].includes(payment) || ["completed", "delivered", "closed won"].includes(order)) {
    return "Closed Won";
  }
  if (["cancelled", "canceled", "failed"].includes(order)) return "Closed Lost";
  if (["pending", "processing"].includes(order) || payment === "pending") return "Pending";
  return titleCaseStatus(transaction.order_status) === "—" ? "Open" : titleCaseStatus(transaction.order_status);
}

function dealProbability(stage: string) {
  if (stage === "Closed Won") return "100%";
  if (stage === "Closed Lost") return "0%";
  if (stage === "Pending") return "50%";
  return "20%";
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

  if (
    hay.includes("add on") ||
    hay.includes("addon") ||
    hay.includes("whois") ||
    hay.includes("static ip") ||
    hay.includes("dedicated ip") ||
    hay.includes("sitelock") ||
    hay.includes("codeguard") ||
    hay.includes("magic spam") ||
    hay.includes("imunify") ||
    hay.includes("immunify") ||
    hay.includes("ssl") ||
    hay.includes("secure socket") ||
    hay.includes("back-up") ||
    hay.includes("backup") ||
    hay.includes("storage") ||
    hay.includes("eset") ||
    hay.includes("ms sql") ||
    hay.includes("cpanel") ||
    hay.includes("plesk")
  ) {
    return "Add ons";
  }

  if (
    hay.includes("web dev") ||
    hay.includes("webdesign") ||
    hay.includes("web design") ||
    hay.includes("piecemeal") ||
    hay.includes("figma") ||
    hay.includes("starter launch") ||
    hay.includes("professional corporate") ||
    hay.includes("e-commerce") ||
    hay.includes("ecommerce")
  ) {
    return "Web Development Piecemeal";
  }

  if (looksLikeDomain(raw) || hay.includes("domain") || hay.includes("tld") || hay.includes(".ph") || hay.includes(".com")) {
    return "Domain Registration";
  }

  return "Dedicated Server";
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
  const stage = dealStage(transaction);
  const clientOwner = clientOwnerName(client);
  const ownerFallback = clientOwner !== "Unassigned" ? clientOwner : clientBillingInCharge(client);

  return {
    clientOwner: ownerFallback || "—",
    clientName: clientDisplayName(client),
    planName: matchingPlanName(itemName, client, adminServices),
    stage,
    clientStatus: dealType,
    productStatus: resolveProductStatus(transaction ?? null, dealType),
    productCategory: dash(itemName),
    domainName: domain,
    contactName: dash(client.contact_person),
    closingDate: formatDealDate(transaction?.issued_date ?? transaction?.transacted_at),
    salesStatus: titleCaseStatus(transaction?.order_status),
    paymentTerms: paymentTermsFrom(transaction),
    paymentMethod: extractPaymentMethod(transaction?.notes),
    paymentStatus: transaction ? paymentStatusLabel(transaction.payment_status) : "—",
    expectedRevenue: amount,
    probability: dealProbability(stage),
    statusTriggerDate: formatDealDate(transaction?.created_at ?? transaction?.transacted_at),
    joNumber: extractJoNumber(transaction?.notes, transaction?.transaction_no),
    billingInCharge: clientBillingInCharge(client),
    dealStatus,
    invoiceStatus: invoiceStatusFrom(transaction),
    invoiceSentDate: formatDealDate(transaction?.issued_date ?? transaction?.transacted_at),
    invoiceReceivedDate: "—",
    paymentCommitmentDate: formatDealDate(transaction?.due_date),
    collectionNote: collectionNoteFrom(transaction?.notes),
    dealOwner: ownerFallback || "—",
    status: dealType,
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

      rows.push({
        id: `${transaction.id}:${item.id ?? itemName}`,
        transactionId: transaction.id,
        transactionNo: transaction.transaction_no,
        subject: dealSubjectFromName(itemName),
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
