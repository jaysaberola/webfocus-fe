import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import AssignClientOwnerModal from "@/components/CommerceAdmin/modals/AssignClientOwnerModal";
import OrderProductDetailsPanel from "@/components/CommerceAdmin/OrderProductDetailsPanel";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import {
  buildClientDealRows,
  fetchCustomerDealTransactions,
  formatDealAmount,
  type ClientDealRow,
} from "@/lib/commerceAdmin/clientDealHelpers";
import { scrollToClientSection } from "@/lib/commerceAdmin/clientScrollHelpers";
import { fetchCommerceServices } from "@/services/commerceAdminService";
import { getCustomer, type CustomerRow } from "@/services/customerService";
import styles from "@/styles/commerceAdmin.module.css";

const DEAL_PAGE_SIZE = 10;

type Props = {
  client: CustomerRow;
  onClientUpdated?: (payload: {
    id: number;
    owner_id: number | null;
    owner: CustomerRow["owner"];
    owner_name: string | null;
  }) => void;
  onEditClient?: () => void;
};

export default function ClientDealsPanel({ client, onClientUpdated, onEditClient }: Props) {
  const router = useRouter();
  const [dealRows, setDealRows] = useState<ClientDealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<ClientDealRow | null>(null);
  const productDetailsRef = useRef<HTMLDivElement | null>(null);

  const reloadDeals = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);
    setSelectedOrder(null);

    Promise.all([
      fetchCustomerDealTransactions(Number(client.id)),
      getCustomer(client.id, { silent: true }).catch(() => null),
      fetchCommerceServices(undefined, Number(client.id), { perPage: 500 }).catch(() => []),
    ])
      .then(([transactions, detail, services]) => {
        if (cancelled) return;
        const enriched: CustomerRow = {
          ...client,
          website: detail?.website ?? client.website,
        };
        setDealRows(buildClientDealRows(enriched, transactions, services));
      })
      .catch(() => {
        if (!cancelled) setDealRows(buildClientDealRows(client, []));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client, reloadKey]);

  const totalPages = Math.max(1, Math.ceil(dealRows.length / DEAL_PAGE_SIZE));
  const paginatedDeals = useMemo(() => {
    const start = (page - 1) * DEAL_PAGE_SIZE;
    return dealRows.slice(start, start + DEAL_PAGE_SIZE);
  }, [dealRows, page]);
  const rangeStart = dealRows.length ? (page - 1) * DEAL_PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * DEAL_PAGE_SIZE, dealRows.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (!selectedOrder) return;
    requestAnimationFrame(() => {
      scrollToClientSection(productDetailsRef.current);
    });
  }, [selectedOrder]);

  return (
    <div className={styles.clientDealsBlock}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Orders</h3>
          <p className={styles.panelSubtitle}>Orders and services for this client.</p>
        </div>
        <div className={styles.dealsHeaderActions}>
          <button type="button" className={styles.dealsActionBtn} onClick={() => setAssignOpen(true)}>
            Assign
          </button>
          <button
            type="button"
            className={styles.dealsActionBtn}
            onClick={() => {
              void router.replace(
                {
                  pathname: COMMERCE_ADMIN_PATH,
                  query: {
                    tab: "orders",
                    createOrder: "1",
                    customerId: String(client.id),
                  },
                },
                undefined,
                { shallow: true },
              );
            }}
          >
            New Order
          </button>
          <button type="button" className={styles.dealsActionBtn} onClick={() => onEditClient?.()}>
            Edit
          </button>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={`${styles.table} ${styles.dealsTable}`}>
          <thead>
            <tr>
              <th>Order Owner</th>
              <th>Status</th>
              <th>Subject</th>
              <th>Domain Name</th>
              <th>Order Status</th>
              <th className={styles.dealsAmount}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading orders...</td>
              </tr>
            ) : paginatedDeals.length === 0 ? (
              <tr>
                <td colSpan={6}>No orders found for this client.</td>
              </tr>
            ) : (
              paginatedDeals.map((deal) => (
                <tr
                  key={deal.id}
                  className={selectedOrder?.id === deal.id ? styles.rowDealOpen : undefined}
                >
                  <td className={styles.dealsNowrap}>{deal.dealOwner}</td>
                  <td className={styles.dealsNowrap}>{deal.status}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.dealsSubject}
                      onClick={() =>
                        setSelectedOrder((current) => (current?.id === deal.id ? null : deal))
                      }
                    >
                      {deal.subject}
                    </button>
                  </td>
                  <td className={styles.dealsNowrap}>{deal.domainName || "—"}</td>
                  <td className={styles.dealsNowrap}>
                    {deal.dealStatus.toLowerCase() === "active" ? (
                      <span className={styles.badgePaid}>ACTIVE</span>
                    ) : (
                      <span className={styles.badgeMuted}>{deal.dealStatus}</span>
                    )}
                  </td>
                  <td className={styles.dealsAmount}>{formatDealAmount(deal.amount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.paginationBar}>
        <div className={styles.paginationInfo}>
          Showing {dealRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
        </div>
        <div className={styles.paginationControls}>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            disabled={page <= 1 || dealRows.length === 0}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            aria-label="Previous orders page"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <span className={styles.paginationRange}>
            {dealRows.length === 0 ? "0 to 0" : `${rangeStart} - ${rangeEnd}`}
          </span>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            disabled={page >= totalPages || dealRows.length === 0}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            aria-label="Next orders page"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>

      {selectedOrder ? (
        <div
          ref={productDetailsRef}
          id="client-section-product-details"
          className={styles.clientEditScrollTarget}
        >
          <OrderProductDetailsPanel order={selectedOrder} onClose={() => setSelectedOrder(null)} />
        </div>
      ) : null}

      <AssignClientOwnerModal
        open={assignOpen}
        client={client}
        onClose={() => setAssignOpen(false)}
        onAssigned={(payload) => {
          onClientUpdated?.(payload);
          reloadDeals();
        }}
      />
    </div>
  );
}
