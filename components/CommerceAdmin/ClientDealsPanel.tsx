import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import AssignClientOwnerModal from "@/components/CommerceAdmin/modals/AssignClientOwnerModal";
import LookupHoverActions from "@/components/CommerceAdmin/LookupHoverActions";
import ResizableTableHead from "@/components/CommerceAdmin/ResizableTableHead";
import ColumnResizeLines from "@/components/CommerceAdmin/ColumnResizeLines";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import { useResizableColumns } from "@/lib/commerceAdmin/useResizableColumns";
import {
  buildClientDealRows,
  DEAL_COLUMN_VISIBILITY_KEYS,
  DEAL_COLUMN_LABELS,
  DEFAULT_DEAL_COLUMNS,
  fetchCustomerDealTransactions,
  formatDealAmount,
  type ClientDealRow,
  type DealColumnKey,
} from "@/lib/commerceAdmin/clientDealHelpers";
import { clientIsAssigned, clientOwnerName } from "@/lib/commerceAdmin/clientHelpers";
import { toast } from "@/lib/toast";
import { assignCommerceCustomerOwner, fetchCommerceServices } from "@/services/commerceAdminService";
import { getCustomer, type CustomerRow } from "@/services/customerService";
import { type SalesTransaction } from "@/services/salesTransactionService";
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
  onEditDeal?: (transaction: SalesTransaction) => void;
};

function dealCellValue(deal: ClientDealRow, column: DealColumnKey) {
  switch (column) {
    case "clientOwner":
      return deal.clientOwner;
    case "clientName":
      return deal.clientName;
    case "dealName":
      return deal.dealName;
    case "planName":
      return deal.planName;
    case "stage":
      return deal.stage;
    case "clientStatus":
      return deal.clientStatus;
    case "productStatus":
      return deal.productStatus;
    case "productCategory":
      return deal.productCategory;
    case "domain":
      return deal.domainName;
    case "contactName":
      return deal.contactName;
    case "closingDate":
      return deal.closingDate;
    case "salesStatus":
      return deal.salesStatus;
    case "paymentTerms":
      return deal.paymentTerms;
    case "paymentMethod":
      return deal.paymentMethod;
    case "paymentStatus":
      return deal.paymentStatus;
    case "expectedRevenue":
      return formatDealAmount(deal.expectedRevenue);
    case "dealAmount":
      return formatDealAmount(deal.amount);
    case "probability":
      return deal.probability;
    case "statusTriggerDate":
      return deal.statusTriggerDate;
    case "joNumber":
      return deal.joNumber;
    case "billingInCharge":
      return deal.billingInCharge;
    case "invoiceStatus":
      return deal.invoiceStatus;
    case "invoiceSentDate":
      return deal.invoiceSentDate;
    case "invoiceReceivedDate":
      return deal.invoiceReceivedDate;
    case "paymentCommitmentDate":
      return deal.paymentCommitmentDate;
    case "collectionNote":
      return deal.collectionNote;
    case "dealStatus":
      return deal.dealStatus;
    case "contractStatus":
      return deal.contractStatus;
    default:
      return "—";
  }
}

export default function ClientDealsPanel({ client, onClientUpdated, onEditClient, onEditDeal }: Props) {
  const router = useRouter();
  const [dealRows, setDealRows] = useState<ClientDealRow[]>([]);
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [assignOpen, setAssignOpen] = useState(false);
  const [unassigning, setUnassigning] = useState(false);
  const [columnsVisible, setColumnsVisible] = useState(DEFAULT_DEAL_COLUMNS);
  const [colVisOpen, setColVisOpen] = useState(false);
  const colVisRef = useRef<HTMLDivElement>(null);
  const dealColumnLabel = useCallback((key: DealColumnKey) => DEAL_COLUMN_LABELS[key], []);
  const { containerRef, layoutFor, startResize } = useResizableColumns<DealColumnKey>(
    "commerceAdmin:dealColumnWidths",
    dealColumnLabel,
  );

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
          contact_person: detail?.contact_person ?? client.contact_person,
          billing_in_charge: detail?.billing_in_charge ?? client.billing_in_charge,
          owner: detail?.owner ?? client.owner,
          owner_name: detail?.owner_name ?? client.owner_name,
          owner_id: detail?.owner_id ?? client.owner_id,
        };
        setTransactions(transactions);
        setDealRows(buildClientDealRows(enriched, transactions, services));
      })
      .catch(() => {
        if (!cancelled) {
          setTransactions([]);
          setDealRows(buildClientDealRows(client, []));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [client, reloadKey]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (colVisRef.current && !colVisRef.current.contains(event.target as Node)) {
        setColVisOpen(false);
      }
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, []);

  const visibleColumns = useMemo(
    () => DEAL_COLUMN_VISIBILITY_KEYS.filter((key) => columnsVisible[key]),
    [columnsVisible],
  );
  const dealLayout = layoutFor(visibleColumns);

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

  const handleUnassignOwner = async () => {
    if (unassigning || !clientIsAssigned(client)) return;
    try {
      setUnassigning(true);
      const result = await assignCommerceCustomerOwner(Number(client.id), null);
      toast.success(result?.message || "Client owner unassigned.");
      if (result?.data) onClientUpdated?.(result.data);
      reloadDeals();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to unassign client owner.");
    } finally {
      setUnassigning(false);
    }
  };

  const openEditDeal = (deal?: ClientDealRow | null) => {
    const target = deal ?? dealRows.find((row) => row.transactionId);
    const transaction = transactions.find((row) => row.id === target?.transactionId);
    if (!transaction) {
      toast.info("Select a deal to edit.");
      return;
    }
    onEditDeal?.(transaction);
  };

  return (
    <div className={styles.clientDealsBlock}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Deals</h3>
          <p className={styles.panelSubtitle}>Deals and services for this client.</p>
        </div>
        <div className={styles.dealsHeaderActions}>
          <div className={styles.colVisWrap} ref={colVisRef}>
            <button
              type="button"
              className={styles.colVisBtn}
              onClick={(e) => {
                e.stopPropagation();
                setColVisOpen((open) => !open);
              }}
            >
              <i className="fa-solid fa-table-columns" aria-hidden="true" /> Column Visibility
            </button>
            {colVisOpen ? (
              <div className={`${styles.colVisPanel} ${styles.dealsColVisPanel}`}>
                <div className={styles.colVisTitle}>Toggle Columns</div>
                {DEAL_COLUMN_VISIBILITY_KEYS.map((key) => (
                  <label key={key} className={styles.colVisItem}>
                    <input
                      type="checkbox"
                      checked={columnsVisible[key]}
                      onChange={(e) =>
                        setColumnsVisible((current) => ({ ...current, [key]: e.target.checked }))
                      }
                    />
                    {DEAL_COLUMN_LABELS[key]}
                  </label>
                ))}
              </div>
            ) : null}
          </div>
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
          <button type="button" className={styles.dealsActionBtn} onClick={() => openEditDeal()}>
            Edit
          </button>
        </div>
      </div>

      <div
        className={`${styles.tableWrap} ${styles.resizableTableWrap}`}
        ref={containerRef}
        style={{ overflowX: dealLayout.overflowing ? "auto" : "hidden" }}
      >
        <div className={styles.resizableTableInner} style={{ width: dealLayout.innerWidth }}>
          <table
            className={`${styles.table} ${styles.dealsTable} ${styles.resizableTable}`}
            style={{ width: "100%" }}
          >
            <colgroup>
              {visibleColumns.map((column) => (
                <col key={column} style={{ width: dealLayout.widthOf(column) }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {visibleColumns.map((column) => (
                  <ResizableTableHead
                    key={column}
                    label={DEAL_COLUMN_LABELS[column]}
                    className={
                      column === "expectedRevenue" || column === "dealAmount"
                        ? styles.dealsAmount
                        : undefined
                    }
                  />
                ))}
              </tr>
            </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={Math.max(visibleColumns.length, 1)}>Loading deals...</td>
              </tr>
            ) : paginatedDeals.length === 0 ? (
              <tr>
                <td colSpan={Math.max(visibleColumns.length, 1)}>No deals found for this client.</td>
              </tr>
            ) : (
              paginatedDeals.map((deal) => (
                <tr key={deal.id}>
                  {visibleColumns.map((column) => {
                    if (column === "clientOwner") {
                      return (
                        <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
                          <LookupHoverActions
                            label={deal.clientOwner}
                            assigned={clientIsAssigned(client)}
                            editLabel="Edit Deal"
                            onEdit={() => openEditDeal(deal)}
                            onLabelClick={() => setAssignOpen(true)}
                            onUnassign={() => void handleUnassignOwner()}
                            unassigning={unassigning}
                          />
                        </td>
                      );
                    }
                    if (column === "clientName") {
                      return (
                        <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
                          <button
                            type="button"
                            className={styles.tableCellLink}
                            onClick={() => onEditClient?.()}
                          >
                            {deal.clientName}
                          </button>
                        </td>
                      );
                    }
                    if (column === "dealName") {
                      return (
                        <td key={column} className={styles.resizableCell}>
                          <button
                            type="button"
                            className={styles.tableCellLink}
                            onClick={() => openEditDeal(deal)}
                          >
                            {deal.dealName}
                          </button>
                        </td>
                      );
                    }
                    if (column === "dealStatus") {
                      return (
                        <td key={column} className={`${styles.dealsNowrap} ${styles.resizableCell}`}>
                          {deal.dealStatus.toLowerCase() === "active" ? (
                            <span className={styles.badgePaid}>ACTIVE</span>
                          ) : (
                            <span className={styles.badgeMuted}>{deal.dealStatus}</span>
                          )}
                        </td>
                      );
                    }
                    return (
                      <td
                        key={column}
                        className={[
                          styles.resizableCell,
                          column === "expectedRevenue" || column === "dealAmount"
                            ? styles.dealsAmount
                            : column === "collectionNote"
                              ? undefined
                              : styles.dealsNowrap,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {dealCellValue(deal, column)}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
          <ColumnResizeLines
            columns={visibleColumns}
            widthOf={dealLayout.widthOf}
            onResizeStart={(column, event) => startResize(column, event, visibleColumns)}
            labelOf={dealColumnLabel}
          />
        </div>
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
