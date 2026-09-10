import {
  dealSubjectFromName,
  fetchCustomerDealTransactions,
  formatDealAmount,
  formatDealDate,
} from "@/lib/commerceAdmin/clientDealHelpers";
import { parseDealMeta, toApiOrderStatus, toApiPaymentStatus } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { clientDisplayName, clientOwnerName } from "@/lib/commerceAdmin/clientHelpers";
import { regionForProvince } from "@/lib/commerceAdmin/phAddressCatalog";
import { paymentStatusLabel } from "@/lib/commerceAdmin/transactionHelpers";
import type { CustomerRow } from "@/services/customerService";
import type { SalesTransaction } from "@/services/salesTransactionService";

const INVOICE_META_PREFIX = "[INVOICE_META]";

export const INVOICE_FORM_STATUS_OPTIONS = [
  "Approved",
  "Cancelled",
  "Created",
  "Delivered",
  "Paid",
  "Partially Paid",
] as const;

export const INVOICE_CURRENCY_OPTIONS = ["PHP", "USD"] as const;

export type InvoiceLineItem = {
  id: string;
  productName: string;
  description: string;
  listPrice: string;
  quantity: string;
  discount: string;
  tax: string;
};

export type ClientInvoiceFormState = {
  invoiceOwnerId: string;
  subject: string;
  invoiceDate: string;
  dueDate: string;
  clientId: string;
  contactName: string;
  currency: string;
  status: string;
  collectionDate: string;
  officialReceipt: string;
  exchangeRate: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingRegion: string;
  billingCode: string;
  billingCountry: string;
  items: InvoiceLineItem[];
  adjustment: string;
};

function todayInput() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function invoiceDateInput(value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeFormLineItem(item: Partial<InvoiceLineItem>, fallbackId: string): InvoiceLineItem {
  return {
    id: String(item.id || fallbackId),
    productName: String(item.productName ?? ""),
    description: String(item.description ?? ""),
    listPrice: String(item.listPrice ?? ""),
    quantity: String(item.quantity ?? "1"),
    discount: String(item.discount ?? "0"),
    tax: String(item.tax ?? "0"),
  };
}

export function invoiceAddressFromClient(client?: CustomerRow | null) {
  const province = String(client?.address_province ?? "").trim();
  const storedRegion = String(client?.address_region ?? "").trim();
  return {
    billingStreet: String(client?.address_street ?? "").trim(),
    billingCity: String(client?.address_city ?? "").trim(),
    billingState: province,
    billingRegion: storedRegion || regionForProvince(province) || "",
    billingCode: String(client?.address_zip ?? "").trim(),
    billingCountry: String(client?.address_country || "Philippines").trim() || "Philippines",
  };
}

export function hasClientBillingAddress(client?: CustomerRow | null) {
  const address = invoiceAddressFromClient(client);
  return Boolean(address.billingStreet || address.billingCity || address.billingState || address.billingCode);
}

export function emptyClientInvoiceForm(
  _client?: CustomerRow | null,
  overrides?: Partial<ClientInvoiceFormState>,
): ClientInvoiceFormState {
  // New invoices stay blank for the user to fill — only Invoice Date is automatic.
  return {
    invoiceOwnerId: "",
    subject: "",
    invoiceDate: todayInput(),
    dueDate: "",
    clientId: "",
    contactName: "",
    currency: "PHP",
    status: "",
    collectionDate: "",
    officialReceipt: "",
    exchangeRate: "1",
    items: [emptyInvoiceLineItem()],
    adjustment: "",
    billingStreet: "",
    billingCity: "",
    billingState: "",
    billingRegion: "",
    billingCode: "",
    billingCountry: "Philippines",
    ...overrides,
  };
}

export function hasInvoiceMeta(notes?: string | null) {
  return String(notes ?? "").includes(INVOICE_META_PREFIX);
}

export function parseInvoiceMeta(notes?: string | null): Partial<ClientInvoiceFormState> | null {
  const text = String(notes ?? "");
  const marker = text.indexOf(INVOICE_META_PREFIX);
  if (marker < 0) return null;
  const jsonLine = text
    .slice(marker + INVOICE_META_PREFIX.length)
    .split("\n")[0]
    ?.trim();
  if (!jsonLine?.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(jsonLine) as Partial<ClientInvoiceFormState>;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function buildInvoiceNotes(form: ClientInvoiceFormState) {
  return `${INVOICE_META_PREFIX}${JSON.stringify({
    subject: form.subject,
    invoiceDate: form.invoiceDate,
    dueDate: form.dueDate,
    contactName: form.contactName,
    currency: form.currency,
    status: form.status,
    collectionDate: form.collectionDate,
    officialReceipt: form.officialReceipt,
    exchangeRate: form.exchangeRate,
    billingStreet: form.billingStreet,
    billingCity: form.billingCity,
    billingState: form.billingState,
    billingRegion: form.billingRegion,
    billingCode: form.billingCode,
    billingCountry: form.billingCountry,
    items: form.items,
    adjustment: form.adjustment,
  })}`;
}

export function emptyInvoiceLineItem(): InvoiceLineItem {
  return {
    id: `inv-item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productName: "",
    description: "",
    listPrice: "",
    quantity: "1",
    discount: "0",
    tax: "0",
  };
}

export function invoiceMoney(value: string | number | null | undefined) {
  const amount = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(amount) ? amount : 0;
}

export function invoiceLineAmount(item: InvoiceLineItem) {
  return invoiceMoney(item.listPrice) * Math.max(0, invoiceMoney(item.quantity));
}

export function invoiceLineTotal(item: InvoiceLineItem) {
  return invoiceLineAmount(item) - invoiceMoney(item.discount) + invoiceMoney(item.tax);
}

export function invoiceTotals(items: InvoiceLineItem[], adjustment?: string) {
  const named = items.filter((item) => item.productName.trim());
  const subTotal = named.reduce((sum, item) => sum + invoiceLineAmount(item), 0);
  const discount = named.reduce((sum, item) => sum + invoiceMoney(item.discount), 0);
  const tax = named.reduce((sum, item) => sum + invoiceMoney(item.tax), 0);
  const adjustmentAmount = invoiceMoney(adjustment);
  return {
    subTotal,
    discount,
    tax,
    adjustment: adjustmentAmount,
    grandTotal: subTotal - discount + tax + adjustmentAmount,
  };
}

export function invoiceItemsForApi(items: InvoiceLineItem[]) {
  return items
    .filter((item) => item.productName.trim())
    .map((item) => ({
      name: item.productName.trim(),
      item_type: "invoice" as const,
      price: invoiceMoney(item.listPrice),
      quantity: Math.max(0, invoiceMoney(item.quantity)),
      total_price: invoiceLineAmount(item),
    }));
}

export function formatInvoiceAmount(value: number) {
  return value.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function validateClientInvoiceForm(form: ClientInvoiceFormState) {
  if (!String(form.subject ?? "").trim()) return "Product Category is required.";
  if (!String(form.clientId ?? "").trim()) return "Client Name is required.";
  if (!form.items.some((item) => item.productName.trim())) {
    return "Add at least one invoiced item.";
  }
  return null;
}

export function invoiceApiPaymentStatus(status: string) {
  const value = status.trim().toLowerCase();
  if (value === "paid") return "paid";
  if (value === "partially paid") return "pending";
  if (value.includes("cancelled") || value.includes("canceled")) return "cancelled";
  return toApiPaymentStatus(status);
}

export function invoiceApiOrderStatus(status: string) {
  return toApiOrderStatus(status);
}

export type ClientInvoiceRow = {
  id: string;
  transactionId: number;
  invoiceOwner: string;
  subject: string;
  invoiceDate: string;
  dueDate: string;
  clientName: string;
  contactName: string;
  currency: string;
  status: string;
  collectionDate: string;
  officialReceipt: string;
  exchangeRate: string;
  billingStreet: string;
  billingCity: string;
  billingState: string;
  billingCode: string;
  billingCountry: string;
  billingInCharge: string;
  wsiInvoiceNumber: string;
  grandTotal: number;
};

export type InvoiceColumnKey =
  | "clientName"
  | "billingInCharge"
  | "subject"
  | "invoiceDate"
  | "dueDate"
  | "collectionDate"
  | "wsiInvoiceNumber"
  | "officialReceipt"
  | "status"
  | "grandTotal"
  | "invoiceOwner"
  | "contactName"
  | "currency"
  | "exchangeRate"
  | "billingStreet"
  | "billingCity"
  | "billingState"
  | "billingCode"
  | "billingCountry";

export const INVOICE_COLUMN_LABELS: Record<InvoiceColumnKey, string> = {
  clientName: "Client Name",
  billingInCharge: "Billing-in-Charge",
  subject: "Product Category",
  invoiceDate: "Invoice Date",
  dueDate: "Due Date",
  collectionDate: "Collection Date",
  wsiInvoiceNumber: "WSI Invoice Number",
  officialReceipt: "Official Receipt",
  status: "Status",
  grandTotal: "Grand Total",
  invoiceOwner: "Invoice Owner",
  contactName: "Contact Name",
  currency: "Currency",
  exchangeRate: "Exchange Rate",
  billingStreet: "Billing Street",
  billingCity: "Billing City",
  billingState: "Billing State",
  billingCode: "Billing Code",
  billingCountry: "Billing Country",
};

export const DEFAULT_INVOICE_COLUMNS: Record<InvoiceColumnKey, boolean> = {
  clientName: true,
  billingInCharge: true,
  subject: true,
  invoiceDate: true,
  dueDate: true,
  collectionDate: true,
  wsiInvoiceNumber: true,
  officialReceipt: true,
  status: true,
  grandTotal: true,
  invoiceOwner: false,
  contactName: false,
  currency: false,
  exchangeRate: false,
  billingStreet: false,
  billingCity: false,
  billingState: false,
  billingCode: false,
  billingCountry: false,
};

export const INVOICE_COLUMN_VISIBILITY_KEYS: InvoiceColumnKey[] = [
  "clientName",
  "billingInCharge",
  "subject",
  "invoiceDate",
  "dueDate",
  "collectionDate",
  "wsiInvoiceNumber",
  "officialReceipt",
  "status",
  "grandTotal",
  "invoiceOwner",
  "contactName",
  "currency",
  "exchangeRate",
  "billingStreet",
  "billingCity",
  "billingState",
  "billingCode",
  "billingCountry",
];

function dash(value?: string | number | null, fallback?: string) {
  const text = String(value ?? "").trim();
  if (text) return text;
  const next = String(fallback ?? "").trim();
  return next || "—";
}

function assignedStaffName(transaction: SalesTransaction) {
  const user = transaction.user;
  if (!user) return "";
  return [user.fname, user.lname].filter(Boolean).join(" ").trim() || String(user.email ?? "").trim();
}

function invoiceStatus(transaction: SalesTransaction, metaStatus?: string | null) {
  const fromMeta = String(metaStatus ?? "").trim();
  if (fromMeta) return fromMeta;
  const payment = String(transaction.payment_status ?? "").toLowerCase();
  if (payment === "paid") return "Paid";
  if (payment === "overdue") return "Overdue";
  if (payment === "failed") return "Failed";
  if (payment === "refunded") return "Refunded";
  const label = paymentStatusLabel(transaction.payment_status);
  return label && label !== "—" ? label : "Unpaid";
}

export function invoiceFormFromTransaction(
  transaction: SalesTransaction,
  client: CustomerRow,
): ClientInvoiceFormState {
  const invoiceMeta = parseInvoiceMeta(transaction.notes);
  const meta = parseDealMeta(transaction.notes);
  const itemName = String(transaction.items?.[0]?.name ?? "").trim();
  const metaItems = Array.isArray(invoiceMeta?.items)
    ? invoiceMeta.items
        .filter((item) => String(item?.productName ?? "").trim())
        .map((item, index) => normalizeFormLineItem(item, `inv-item-${transaction.id}-${index}`))
    : [];
  const transactionItems = (transaction.items ?? []).map((item, index) =>
    normalizeFormLineItem(
      {
        id: String(item.id ?? `inv-item-${transaction.id}-${index}`),
        productName: String(item.name ?? "").trim(),
        listPrice: String(item.price ?? ""),
        quantity: String(item.quantity ?? "1"),
        discount: index === 0 ? String(transaction.discount_total ?? "0") : "0",
        tax: index === 0 ? String(transaction.tax_total ?? "0") : "0",
      },
      `inv-item-${transaction.id}-${index}`,
    ),
  );
  const items = metaItems.length ? metaItems : transactionItems;
  const clientAddress = invoiceAddressFromClient(client);
  const savedAddress = Boolean(
    String(invoiceMeta?.billingStreet ?? "").trim() ||
      String(invoiceMeta?.billingCity ?? "").trim() ||
      String(invoiceMeta?.billingState ?? "").trim() ||
      String(invoiceMeta?.billingCode ?? "").trim(),
  );

  return emptyClientInvoiceForm(client, {
    invoiceOwnerId: String(transaction.user_id || transaction.client_owner_id || client.owner_id || ""),
    subject: String(
      invoiceMeta?.subject || meta?.productCategory || dealSubjectFromName(itemName) || "",
    ).trim(),
    invoiceDate: invoiceDateInput(
      invoiceMeta?.invoiceDate || meta?.invoiceSentDate || transaction.issued_date || transaction.transacted_at,
    ),
    dueDate: invoiceDateInput(invoiceMeta?.dueDate || meta?.paymentCommitmentDate || transaction.due_date),
    clientId: String(transaction.customer_id || client.id || ""),
    contactName: String(invoiceMeta?.contactName || meta?.contactName || client.contact_person || ""),
    currency: String(invoiceMeta?.currency || client.currency || "PHP").trim() || "PHP",
    status: invoiceStatus(transaction, invoiceMeta?.status || meta?.invoiceStatus),
    collectionDate: invoiceDateInput(invoiceMeta?.collectionDate || meta?.invoiceReceivedDate),
    officialReceipt: invoiceDateInput(invoiceMeta?.officialReceipt),
    exchangeRate: String(invoiceMeta?.exchangeRate || client.exchange_rate || "1").trim() || "1",
    billingStreet: savedAddress ? String(invoiceMeta?.billingStreet ?? "").trim() : clientAddress.billingStreet,
    billingCity: savedAddress ? String(invoiceMeta?.billingCity ?? "").trim() : clientAddress.billingCity,
    billingState: savedAddress ? String(invoiceMeta?.billingState ?? "").trim() : clientAddress.billingState,
    billingRegion: savedAddress
      ? String(invoiceMeta?.billingRegion ?? "").trim() || regionForProvince(String(invoiceMeta?.billingState ?? ""))
      : clientAddress.billingRegion,
    billingCode: savedAddress ? String(invoiceMeta?.billingCode ?? "").trim() : clientAddress.billingCode,
    billingCountry: savedAddress
      ? String(invoiceMeta?.billingCountry || clientAddress.billingCountry).trim() || "Philippines"
      : clientAddress.billingCountry,
    items: items.length ? items : [emptyInvoiceLineItem()],
    adjustment: String(invoiceMeta?.adjustment ?? transaction.shipping_total ?? ""),
  });
}

export function invoiceCellValue(invoice: ClientInvoiceRow, column: InvoiceColumnKey) {
  if (column === "grandTotal") return formatDealAmount(invoice.grandTotal);
  const value = invoice[column];
  if (typeof value === "number") return formatDealAmount(value);
  return value || "—";
}

export function buildClientInvoiceRows(
  client: CustomerRow,
  transactions: SalesTransaction[],
): ClientInvoiceRow[] {
  const clientName = clientDisplayName(client);
  const owner = clientOwnerName(client);
  const currency = dash(client.currency || "PHP");
  const exchangeRate = dash(client.exchange_rate ?? "1");
  const billingStreet = dash(client.address_street);
  const billingCity = dash(client.address_city);
  const billingState = dash(client.address_province);
  const billingCode = dash(client.address_zip);
  const billingCountry = dash(client.address_country || "Philippines");

  return [...transactions]
    .sort((a, b) => {
      const byDate =
        new Date(b.issued_date ?? b.transacted_at ?? b.created_at ?? 0).getTime() -
        new Date(a.issued_date ?? a.transacted_at ?? a.created_at ?? 0).getTime();
      return byDate !== 0 ? byDate : Number(b.id) - Number(a.id);
    })
    .map((transaction) => {
      const invoiceMeta = parseInvoiceMeta(transaction.notes);
      const meta = parseDealMeta(transaction.notes);
      const itemName = String(transaction.items?.[0]?.name ?? transaction.transaction_no ?? "").trim();
      const invoiceOwner = assignedStaffName(transaction) || owner;
      const transactionNo = String(transaction.transaction_no ?? "").trim();

      return {
        id: String(transaction.id),
        transactionId: transaction.id,
        invoiceOwner: invoiceOwner || "Unassigned",
        subject: dash(
          invoiceMeta?.subject || meta?.productCategory,
          dealSubjectFromName(itemName),
        ),
        invoiceDate: formatDealDate(
          invoiceMeta?.invoiceDate || meta?.invoiceSentDate || transaction.issued_date || transaction.transacted_at,
        ),
        dueDate: formatDealDate(invoiceMeta?.dueDate || meta?.paymentCommitmentDate || transaction.due_date),
        clientName,
        contactName: dash(invoiceMeta?.contactName || meta?.contactName || client.contact_person),
        currency: dash(invoiceMeta?.currency, currency),
        status: invoiceStatus(transaction, invoiceMeta?.status || meta?.invoiceStatus),
        collectionDate: invoiceMeta?.collectionDate
          ? formatDealDate(invoiceMeta.collectionDate)
          : meta?.invoiceReceivedDate
            ? formatDealDate(meta.invoiceReceivedDate)
            : "—",
        officialReceipt: invoiceMeta?.officialReceipt
          ? formatDealDate(invoiceMeta.officialReceipt)
          : "—",
        exchangeRate: dash(invoiceMeta?.exchangeRate, exchangeRate),
        billingStreet: dash(invoiceMeta?.billingStreet, billingStreet),
        billingCity: dash(invoiceMeta?.billingCity, billingCity),
        billingState: dash(invoiceMeta?.billingState, billingState),
        billingCode: dash(invoiceMeta?.billingCode, billingCode),
        billingCountry: dash(invoiceMeta?.billingCountry, billingCountry),
        billingInCharge: dash(
          meta?.billingInCharge || client.billing_in_charge || transaction.customer?.billing_in_charge,
        ),
        wsiInvoiceNumber: dash(transactionNo ? `INV-${transactionNo}` : ""),
        grandTotal: Number(transaction.grand_total) || 0,
      };
    });
}

export function customerRowFromTransaction(transaction: SalesTransaction): CustomerRow {
  const customer = transaction.customer;
  const id = Number(customer?.id ?? transaction.customer_id ?? 0);
  const company = String(customer?.mname || customer?.company || "").trim();
  const personName = [customer?.fname, customer?.lname]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+(Customer|User)$/i, "")
    .trim();
  const fallbackName = String(transaction.customer_name ?? "")
    .replace(/\s+(Customer|User)$/i, "")
    .trim();
  const ownerName = customer?.owner
    ? [customer.owner.fname, customer.owner.lname].filter(Boolean).join(" ").trim() ||
      String(customer.owner.name ?? "").trim()
    : "";

  return {
    id,
    name: company || personName || fallbackName || "—",
    email: String(customer?.email || transaction.customer_email || ""),
    role: "customer",
    status: "Active",
    company: company || undefined,
    contact_person: customer?.contact_person ?? (personName || fallbackName || undefined),
    billing_in_charge: customer?.billing_in_charge ?? undefined,
    owner_id: customer?.owner_id ?? undefined,
    owner: customer?.owner
      ? {
          id: customer.owner.id,
          name: ownerName || customer.owner.email || null,
          email: customer.owner.email ?? null,
        }
      : null,
    owner_name: ownerName || null,
  };
}

export function buildGlobalInvoiceRows(transactions: SalesTransaction[]): ClientInvoiceRow[] {
  const invoiceTagged = transactions.filter((transaction) => hasInvoiceMeta(transaction.notes));
  const source = invoiceTagged.length > 0 ? invoiceTagged : transactions;

  const sorted = [...source].sort((a, b) => {
    const byDate =
      new Date(b.issued_date ?? b.transacted_at ?? b.created_at ?? 0).getTime() -
      new Date(a.issued_date ?? a.transacted_at ?? a.created_at ?? 0).getTime();
    return byDate !== 0 ? byDate : Number(b.id) - Number(a.id);
  });

  return sorted.flatMap((transaction) =>
    buildClientInvoiceRows(customerRowFromTransaction(transaction), [transaction]),
  );
}

export { fetchCustomerDealTransactions };
