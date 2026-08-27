import { useEffect, useMemo, useState } from "react";
import {
  dealSubjectFromName,
  fetchCustomerDealTransactions,
  formatDealAmount,
} from "@/lib/commerceAdmin/clientDealHelpers";
import { highlightSearch } from "@/lib/commerceAdmin/highlightSearch";
import { clientDisplayName, clientOwnerName } from "@/lib/commerceAdmin/clientHelpers";
import ResizableTableFrame from "@/components/UI/ResizableTableFrame";
import type { CustomerRow } from "@/services/customerService";
import type { SalesTransaction } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

const SECTION_PAGE_SIZE = 5;

type Props = {
  search: string;
  clients: CustomerRow[];
  onOpenClient: (client: CustomerRow) => void;
};

type DealHit = {
  id: string;
  client: CustomerRow;
  owner: string;
  amount: number;
  name: string;
  closingDate: string;
  clientName: string;
  stage: string;
  contactName: string;
};

type InvoiceHit = {
  id: string;
  client: CustomerRow;
  subject: string;
  invoiceDate: string;
  status: string;
  clientName: string;
  owner: string;
  grandTotal: number;
  contactName: string;
};

function formatShortDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function staffName(transaction: SalesTransaction) {
  const user = transaction.user;
  if (!user) return "";
  return [user.fname, user.lname].filter(Boolean).join(" ").trim() || String(user.email ?? "").trim();
}

function dealStage(transaction: SalesTransaction) {
  const order = String(transaction.order_status ?? "").toLowerCase();
  const payment = String(transaction.payment_status ?? "").toLowerCase();
  if (["paid", "completed", "success"].includes(payment) || ["completed", "delivered", "closed won"].includes(order)) {
    return "Closed Won";
  }
  if (["cancelled", "canceled", "failed"].includes(order)) return "Closed Lost";
  if (["pending", "processing"].includes(order) || payment === "pending") return "Pending";
  return transaction.order_status || "Open";
}

function invoiceStatus(transaction: SalesTransaction) {
  const order = String(transaction.order_status ?? "").trim();
  if (order) return order.replace(/\b\w/g, (c) => c.toUpperCase());
  const payment = String(transaction.payment_status ?? "").trim();
  return payment ? payment.replace(/\b\w/g, (c) => c.toUpperCase()) : "—";
}

function phoneOf(client: CustomerRow) {
  return String(client.mobile || client.phone || "").trim() || "—";
}

function SectionPager({
  title,
  count,
  page,
  totalPages,
  onPage,
}: {
  title: string;
  count: number;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  const start = count ? (page - 1) * SECTION_PAGE_SIZE + 1 : 0;
  const end = Math.min(page * SECTION_PAGE_SIZE, count);
  return (
    <div className={styles.searchSectionHead}>
      <h4>
        {title} <span>{count}</span>
      </h4>
      <div className={styles.searchSectionPager}>
        <span>
          {count === 0 ? "0-0" : `${start}-${end}`}
        </span>
        <button type="button" disabled={page <= 1 || count === 0} onClick={() => onPage(page - 1)} aria-label={`Previous ${title}`}>
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={page >= totalPages || count === 0}
          onClick={() => onPage(page + 1)}
          aria-label={`Next ${title}`}
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default function ClientSearchResults({ search, clients, onOpenClient }: Props) {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);
  const [clientPage, setClientPage] = useState(1);
  const [dealPage, setDealPage] = useState(1);
  const [invoicePage, setInvoicePage] = useState(1);

  useEffect(() => {
    setClientPage(1);
    setDealPage(1);
    setInvoicePage(1);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    const matched = clients.slice(0, 25);
    if (!search.trim() || matched.length === 0) {
      setTransactions([]);
      setLoadingTx(false);
      return;
    }

    setLoadingTx(true);
    Promise.all(matched.map((client) => fetchCustomerDealTransactions(Number(client.id)).catch(() => [] as SalesTransaction[])))
      .then((groups) => {
        if (cancelled) return;
        setTransactions(groups.flat());
      })
      .finally(() => {
        if (!cancelled) setLoadingTx(false);
      });

    return () => {
      cancelled = true;
    };
  }, [clients, search]);

  const deals = useMemo<DealHit[]>(() => {
    const byId = new Map(clients.map((client) => [Number(client.id), client]));
    const rows: DealHit[] = [];
    for (const transaction of transactions) {
      const client = byId.get(Number(transaction.customer_id));
      if (!client) continue;
      const items = transaction.items?.length
        ? transaction.items
        : [{ id: transaction.id, name: transaction.transaction_no, total_price: transaction.grand_total, price: transaction.grand_total, quantity: 1 }];
      for (const item of items) {
        const amount = Number(item.total_price ?? Number(item.price || 0) * Number(item.quantity || 1));
        rows.push({
          id: `${transaction.id}:${item.id ?? item.name}`,
          client,
          owner: staffName(transaction) || clientOwnerName(client),
          amount: Number.isFinite(amount) ? amount : 0,
          name: String(item.name ?? "Order").trim() || "Order",
          closingDate: formatShortDate(transaction.issued_date ?? transaction.transacted_at),
          clientName: clientDisplayName(client),
          stage: dealStage(transaction),
          contactName: String(client.contact_person ?? "").trim() || "—",
        });
      }
    }
    return rows;
  }, [clients, transactions]);

  const invoices = useMemo<InvoiceHit[]>(() => {
    const byId = new Map(clients.map((client) => [Number(client.id), client]));
    return transactions.map((transaction) => {
      const client = byId.get(Number(transaction.customer_id));
      const firstName = transaction.items?.[0]?.name ?? transaction.transaction_no;
      return {
        id: String(transaction.id),
        client: client as CustomerRow,
        subject: dealSubjectFromName(String(firstName ?? "")),
        invoiceDate: formatShortDate(transaction.issued_date ?? transaction.transacted_at),
        status: invoiceStatus(transaction),
        clientName: client ? clientDisplayName(client) : String(transaction.customer_name ?? "—"),
        owner: staffName(transaction) || (client ? clientOwnerName(client) : "—"),
        grandTotal: Number(transaction.grand_total) || 0,
        contactName: String(client?.contact_person ?? "").trim() || "—",
      };
    }).filter((row) => row.client);
  }, [clients, transactions]);

  const clientPages = Math.max(1, Math.ceil(clients.length / SECTION_PAGE_SIZE));
  const dealPages = Math.max(1, Math.ceil(deals.length / SECTION_PAGE_SIZE));
  const invoicePages = Math.max(1, Math.ceil(invoices.length / SECTION_PAGE_SIZE));
  const pagedClients = clients.slice((clientPage - 1) * SECTION_PAGE_SIZE, clientPage * SECTION_PAGE_SIZE);
  const pagedDeals = deals.slice((dealPage - 1) * SECTION_PAGE_SIZE, dealPage * SECTION_PAGE_SIZE);
  const pagedInvoices = invoices.slice((invoicePage - 1) * SECTION_PAGE_SIZE, invoicePage * SECTION_PAGE_SIZE);

  return (
    <div className={styles.clientSearchResults}>
      <section className={styles.searchResultSection}>
        <SectionPager title="Clients" count={clients.length} page={clientPage} totalPages={clientPages} onPage={setClientPage} />
        <ResizableTableFrame
          storageKey="commerceAdmin:searchClients"
          columns={["owner", "name", "phone", "website"]}
          labels={{ owner: "Client Owner", name: "Client Name", phone: "Phone", website: "Website" }}
          className={styles.tableWrap}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Client Owner</th>
                <th>Client Name</th>
                <th>Phone</th>
                <th>Website</th>
              </tr>
            </thead>
            <tbody>
              {pagedClients.length === 0 ? (
                <tr>
                  <td colSpan={4}>No clients found.</td>
                </tr>
              ) : (
                pagedClients.map((client) => (
                  <tr key={String(client.id)}>
                    <td>{clientOwnerName(client)}</td>
                    <td>
                      <button type="button" className={styles.tableCellLink} onClick={() => onOpenClient(client)}>
                        {highlightSearch(clientDisplayName(client), search, styles.searchHit)}
                      </button>
                    </td>
                    <td>{phoneOf(client)}</td>
                    <td>{client.website || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ResizableTableFrame>
      </section>

      <section className={styles.searchResultSection}>
        <SectionPager title="Deals" count={deals.length} page={dealPage} totalPages={dealPages} onPage={setDealPage} />
        <ResizableTableFrame
          storageKey="commerceAdmin:searchDeals"
          columns={["owner", "amount", "name", "closing", "client", "stage", "contact"]}
          labels={{
            owner: "Deal Owner",
            amount: "Amount",
            name: "Deal Name",
            closing: "Closing Date",
            client: "Client Name",
            stage: "Stage",
            contact: "Contact Name",
          }}
          className={styles.tableWrap}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Deal Owner</th>
                <th>Amount</th>
                <th>Deal Name</th>
                <th>Closing Date</th>
                <th>Client Name</th>
                <th>Stage</th>
                <th>Contact Name</th>
              </tr>
            </thead>
            <tbody>
              {loadingTx ? (
                <tr>
                  <td colSpan={7}>Loading orders...</td>
                </tr>
              ) : pagedDeals.length === 0 ? (
                <tr>
                  <td colSpan={7}>No orders found.</td>
                </tr>
              ) : (
                pagedDeals.map((deal) => (
                  <tr key={deal.id}>
                    <td>{deal.owner}</td>
                    <td className={styles.dealsAmount}>{formatDealAmount(deal.amount)}</td>
                    <td>
                      <button type="button" className={styles.dealsSubject} onClick={() => onOpenClient(deal.client)}>
                        {deal.name}
                      </button>
                    </td>
                    <td>{deal.closingDate}</td>
                    <td>
                      <button type="button" className={styles.tableCellLink} onClick={() => onOpenClient(deal.client)}>
                        {highlightSearch(deal.clientName, search, styles.searchHit)}
                      </button>
                    </td>
                    <td>{deal.stage}</td>
                    <td>{deal.contactName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ResizableTableFrame>
      </section>

      <section className={styles.searchResultSection}>
        <SectionPager
          title="Invoices"
          count={invoices.length}
          page={invoicePage}
          totalPages={invoicePages}
          onPage={setInvoicePage}
        />
        <ResizableTableFrame
          storageKey="commerceAdmin:searchInvoices"
          columns={["subject", "date", "status", "client", "owner", "total", "contact"]}
          labels={{
            subject: "Subject",
            date: "Invoice Date",
            status: "Status",
            client: "Client Name",
            owner: "Invoice Owner",
            total: "Grand Total",
            contact: "Contact Name",
          }}
          className={styles.tableWrap}
        >
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Invoice Date</th>
                <th>Status</th>
                <th>Client Name</th>
                <th>Invoice Owner</th>
                <th>Grand Total</th>
                <th>Contact Name</th>
              </tr>
            </thead>
            <tbody>
              {loadingTx ? (
                <tr>
                  <td colSpan={7}>Loading invoices...</td>
                </tr>
              ) : pagedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>No invoices found.</td>
                </tr>
              ) : (
                pagedInvoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td>
                      <button type="button" className={styles.dealsSubject} onClick={() => onOpenClient(invoice.client)}>
                        {invoice.subject}
                      </button>
                    </td>
                    <td>{invoice.invoiceDate}</td>
                    <td>{invoice.status}</td>
                    <td>
                      <button type="button" className={styles.tableCellLink} onClick={() => onOpenClient(invoice.client)}>
                        {highlightSearch(invoice.clientName, search, styles.searchHit)}
                      </button>
                    </td>
                    <td>{invoice.owner}</td>
                    <td className={styles.dealsAmount}>{formatDealAmount(invoice.grandTotal)}</td>
                    <td>{invoice.contactName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ResizableTableFrame>
      </section>
    </div>
  );
}
