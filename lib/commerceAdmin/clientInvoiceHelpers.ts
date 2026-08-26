import {
  dealSubjectFromName,
  fetchCustomerDealTransactions,
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
  "Draft",
  "Approved",
  "Sent to Client",
  "Paid",
  "Overdue",
  "Cancelled",
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

export function invoiceAddressFromClient(client?: CustomerRow | null) {
  const province = String(client?.address_province ?? "");
  const storedRegion = String(client?.address_region ?? "").trim();
  return {
    billingStreet: String(client?.address_street ?? ""),
    billingCity: String(client?.address_city ?? ""),
    billingState: province,
    billingRegion: storedRegion || regionForProvince(province) || "",
    billingCode: String(client?.address_zip ?? ""),
    billingCountry: String(client?.address_country || "Philippines").trim() || "Philippines",
  };
}

export function emptyClientInvoiceForm(
  client?: CustomerRow | null,
  overrides?: Partial<ClientInvoiceFormState>,
): ClientInvoiceFormState {
  return {
    invoiceOwnerId: client?.owner_id ? String(client.owner_id) : "",
    subject: "",
    invoiceDate: todayInput(),
    dueDate: "",
    clientId: client?.id ? String(client.id) : "",
    contactName: String(client?.contact_person ?? ""),
    currency: String(client?.currency || "PHP").trim() || "PHP",
    status: "Approved",
    collectionDate: "",
    officialReceipt: "",
    exchangeRate: String(client?.exchange_rate ?? "1").trim() || "1",
    items: [emptyInvoiceLineItem()],
    adjustment: "",
    ...invoiceAddressFromClient(client),
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
  return toApiPaymentStatus(status);
}

export function invoiceApiOrderStatus(status: string) {
  return toApiOrderStatus(status);
}

export type ClientInvoiceRow = {
  id: string;
  transactionId: number;
  invoiceOwner: string;
  productCategory: string;
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
};

export type InvoiceColumnKey =
  | "productCategory"
  | "clientName"
  | "invoiceOwner"
  | "invoiceDate"
  | "dueDate"
  | "contactName"
  | "currency"
  | "status"
  | "collectionDate"
  | "officialReceipt"
  | "exchangeRate"
  | "billingStreet"
  | "billingCity"
  | "billingState"
  | "billingCode"
  | "billingCountry";

export const INVOICE_COLUMN_LABELS: Record<InvoiceColumnKey, string> = {
  productCategory: "Product Category",
  clientName: "Client Name",
  invoiceOwner: "Invoice Owner",
  invoiceDate: "Invoice Date",
  dueDate: "Due Date",
  contactName: "Contact Name",
  currency: "Currency",
  status: "Status",
  collectionDate: "Collection Date",
  officialReceipt: "Official Receipt",
  exchangeRate: "Exchange Rate",
  billingStreet: "Billing Street",
  billingCity: "Billing City",
  billingState: "Billing State",
  billingCode: "Billing Code",
  billingCountry: "Billing Country",
};

export const DEFAULT_INVOICE_COLUMNS: Record<InvoiceColumnKey, boolean> = {
  productCategory: true,
  clientName: true,
  invoiceOwner: false,
  invoiceDate: false,
  dueDate: false,
  contactName: false,
  currency: false,
  status: false,
  collectionDate: false,
  officialReceipt: false,
  exchangeRate: false,
  billingStreet: false,
  billingCity: false,
  billingState: false,
  billingCode: false,
  billingCountry: false,
};

export const INVOICE_COLUMN_VISIBILITY_KEYS: InvoiceColumnKey[] = [
  "productCategory",
  "clientName",
  "invoiceOwner",
  "invoiceDate",
  "dueDate",
  "contactName",
  "currency",
  "status",
  "collectionDate",
  "officialReceipt",
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

export function invoiceCellValue(invoice: ClientInvoiceRow, column: InvoiceColumnKey) {
  return invoice[column] || "—";
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
        productCategory: dash(
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
        officialReceipt: dash(invoiceMeta?.officialReceipt, transactionNo ? `INV-${transactionNo}` : "—"),
        exchangeRate: dash(invoiceMeta?.exchangeRate, exchangeRate),
        billingStreet: dash(invoiceMeta?.billingStreet, billingStreet),
        billingCity: dash(invoiceMeta?.billingCity, billingCity),
        billingState: dash(invoiceMeta?.billingState, billingState),
        billingCode: dash(invoiceMeta?.billingCode, billingCode),
        billingCountry: dash(invoiceMeta?.billingCountry, billingCountry),
      };
    });
}

export { fetchCustomerDealTransactions };
