import { useCallback, useEffect, useMemo, useState } from "react";
import AssignClientOwnerModal from "@/components/CommerceAdmin/modals/AssignClientOwnerModal";
import CreateClientOrderModal from "@/components/CommerceAdmin/modals/CreateClientOrderModal";
import {
  buildClientDealRows,
  fetchCustomerDealTransactions,
  formatDealAmount,
  type ClientDealRow,
} from "@/lib/commerceAdmin/clientDealHelpers";
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
  const [dealRows, setDealRows] = useState<ClientDealRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [assignOpen, setAssignOpen] = useState(false);
  const [newDealOpen, setNewDealOpen] = useState(false);

  const reloadDeals = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setPage(1);

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

  return (
    <div className={styles.clientDealsBlock}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Deals</h3>
          <p className={styles.panelSubtitle}>Orders and services for this client.</p>
        </div>
        <div className={styles.dealsHeaderActions}>
          <button type="button" className={styles.dealsActionBtn} onClick={() => setAssignOpen(true)}>
            Assign
          </button>
          <button type="button" className={styles.dealsActionBtn} onClick={() => setNewDealOpen(true)}>
            New Deal
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
              <th>Deal Owner</th>
              <th>Status</th>
              <th>Subject</th>
              <th>Domain Name</th>
              <th>Deal Status</th>
              <th className={styles.dealsAmount}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6}>Loading deals...</td>
              </tr>
            ) : paginatedDeals.length === 0 ? (
              <tr>
                <td colSpan={6}>No deals found for this client.</td>
              </tr>
            ) : (
              paginatedDeals.map((deal) => (
                <tr key={deal.id}>
                  <td className={styles.dealsNowrap}>{deal.dealOwner}</td>
                  <td className={styles.dealsNowrap}>{deal.status}</td>
                  <td>
                    <span className={styles.dealsSubject}>{deal.subject}</span>
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
            aria-label="Previous deals page"
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
            aria-label="Next deals page"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>

      <AssignClientOwnerModal
        open={assignOpen}
        client={client}
        onClose={() => setAssignOpen(false)}
        onAssigned={(payload) => {
          onClientUpdated?.(payload);
          reloadDeals();
        }}
      />
      <CreateClientOrderModal
        open={newDealOpen}
        defaultCustomerId={Number(client.id)}
        onClose={() => setNewDealOpen(false)}
        onCreated={() => {
          setNewDealOpen(false);
          reloadDeals();
        }}
      />
    </div>
  );
}
