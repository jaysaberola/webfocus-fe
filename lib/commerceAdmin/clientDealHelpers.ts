import { parseHostingClassification } from "@/lib/commerceAdmin/hostingTransactionTypes";
import { clientBillingInCharge, clientOwnerName } from "@/lib/commerceAdmin/clientHelpers";
import type { CommerceServiceAdminRow } from "@/services/commerceAdminService";
import type { CustomerRow } from "@/services/customerService";
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
  dealOwner: string;
  status: string;
  subject: string;
  domainName: string;
  dealStatus: string;
  amount: number | null;
  items: ClientDealLineItem[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  adjustment: number;
  grandTotal: number;
};

export function formatDealAmount(amount: number | null) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `₱ ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function staffDisplayName(user?: SalesTransaction["user"] | null) {
  if (!user) return "";
  return [user.fname, user.lname].filter(Boolean).join(" ").trim() || String(user.email ?? "").trim();
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

function matchingServiceStatus(
  itemName: string,
  client: CustomerRow,
  adminServices: CommerceServiceAdminRow[] = [],
) {
  const needle = itemName.trim().toLowerCase();
  if (!needle) return null;

  const fromClient = (client.services ?? []).find((service) => {
    const hay = [service.title, service.plan, service.subject, service.product_category]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");
    return hay.includes(needle) || needle.includes(String(service.title ?? "").toLowerCase());
  });
  if (fromClient?.status) return fromClient.status;

  const fromAdmin = adminServices.find((service) => {
    const hay = [service.title, service.plan, service.subject, service.productCategory, service.planName]
      .map((value) => String(value ?? "").toLowerCase())
      .join(" ");
    return hay.includes(needle) || needle.includes(String(service.title ?? "").toLowerCase());
  });
  return fromAdmin?.status ?? null;
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
  const ownerName = clientOwnerName(client);
  const ownerFallback =
    ownerName !== "Unassigned" ? ownerName : clientBillingInCharge(client);
  const clientDomainValue = resolveClientDomain(client, adminServices);

  const sorted = [...transactions].sort(
    (a, b) =>
      new Date(b.transacted_at ?? 0).getTime() -
      new Date(a.transacted_at ?? 0).getTime(),
  );

  const seenItemNames = new Set<string>();
  const rows: ClientDealRow[] = [];

  for (const transaction of sorted) {
    const owner = staffDisplayName(transaction.user) || ownerFallback || "—";
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

      rows.push({
        id: `${transaction.id}:${item.id ?? itemName}`,
        transactionId: transaction.id,
        transactionNo: transaction.transaction_no,
        dealOwner: owner,
        status: resolveDealType(itemName, transaction, seenItemNames),
        subject: dealSubjectFromName(itemName),
        domainName: domain,
        dealStatus: resolveDealStatus(transaction, matchingServiceStatus(itemName, client, adminServices)),
        amount: Number.isFinite(amount) && amount > 0 ? amount : null,
        items: lineItems,
        ...totals,
      });

      if (itemName) seenItemNames.add(itemName.toLowerCase());
    }
  }

  if (rows.length > 0) return rows.reverse();

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
        dealOwner: ownerFallback || "—",
        status: "New Service",
        subject: dealSubjectFromName(String(service.product_category || service.subject || service.plan_name || service.title || "")),
        domainName: domain,
        dealStatus: String(service.status || "Active"),
        amount: null,
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
      dealOwner: ownerFallback || "—",
      status: "New Service",
      subject: dealSubjectFromName(String(service.productCategory || service.subject || service.planName || service.title || "")),
      domainName: domain,
      dealStatus: String(service.status || "Active"),
      amount: null,
      items,
      ...totalsFromItems(items),
    };
  });
}
