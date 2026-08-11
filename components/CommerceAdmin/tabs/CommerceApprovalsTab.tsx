import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveCommerceProfileChange,
  fetchCommerceApprovals,
  rejectCommercePaymentProof,
  rejectCommerceProfileChange,
  verifyCommercePaymentProof,
  type CommercePaymentProofRow,
} from "@/services/commerceAdminService";
import {
  approvalAmountLabel,
  approvalDueDate,
  approvalIssuedDate,
  approvalPlanLabel,
  approvalQueueType,
  approvalServiceLabel,
  sortApprovals,
  type ApprovalSortKey,
} from "@/lib/commerceAdmin/approvalHelpers";
import {
  approvalSortDirection,
  isApprovalColumnSorted,
  toggleApprovalSort,
  type ApprovalColumnKey,
} from "@/lib/commerceAdmin/tableSortHelpers";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import CommerceBulkSelectionBar from "@/components/CommerceAdmin/CommerceBulkSelectionBar";
import {
  CommerceSelectAllHead,
  CommerceSelectRowCell,
} from "@/components/CommerceAdmin/CommerceSelectCells";
import TableFilterPanel, { TableFilterShell } from "@/components/shared/TableFilterPanel";
import { useRowSelection } from "@/lib/useRowSelection";
import { exportRowsToExcel } from "@/lib/commerceAdmin/exportTableExcel";
import {
  emptyDateRange,
  rowMatchesDateRange,
  rowMatchesSearch,
  type DateRangeValue,
} from "@/lib/dateRangeHelpers";
import {
  applyTableFilter,
  emptyTableFilter,
  isTableFilterActive,
  type TableFilterFieldDef,
  type TableFilterState,
} from "@/lib/tableFilterHelpers";
import ApprovalReviewModal from "@/components/CommerceAdmin/modals/ApprovalReviewModal";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

const PAGE_SIZE = 5;

const APPROVAL_FILTER_FIELDS: TableFilterFieldDef[] = [
  { id: "kind", label: "Queue Type" },
  { id: "status", label: "Status" },
  { id: "client", label: "Client" },
  { id: "email", label: "Email" },
  { id: "invoiceId", label: "Invoice #" },
  { id: "serviceName", label: "Service Name" },
  { id: "plan", label: "Plan" },
  { id: "proofNo", label: "Proof #" },
];

export default function CommerceApprovalsTab() {
  const [rows, setRows] = useState<CommercePaymentProofRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<ApprovalSortKey>("date-desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [draftFilter, setDraftFilter] = useState<TableFilterState>(emptyTableFilter);
  const [appliedFilter, setAppliedFilter] = useState<TableFilterState>(emptyTableFilter);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [page, setPage] = useState(1);
  const [reviewTarget, setReviewTarget] = useState<CommercePaymentProofRow | null>(null);
  const [exporting, setExporting] = useState(false);

  const getFilterValue = useCallback((row: CommercePaymentProofRow, fieldId: string) => {
    switch (fieldId) {
      case "kind":
        return approvalQueueType(row);
      case "status":
        return String(row.status || "Pending Review").trim();
      case "client":
        return String(row.client ?? "").trim();
      case "email":
        return String(row.email ?? "").trim();
      case "invoiceId":
        return String(row.invoiceId ?? "").trim();
      case "serviceName":
        return approvalServiceLabel(row);
      case "plan":
        return approvalPlanLabel(row);
      case "proofNo":
        return String(row.proofNo ?? "").trim();
      default:
        return "";
    }
  }, []);

  const load = () => {
    setLoading(true);
    fetchCommerceApprovals("Pending Review")
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [sortBy, appliedFilter, viewMode, search, dateRange]);

  const processedRows = useMemo(() => {
    const filtered = applyTableFilter(rows, appliedFilter, APPROVAL_FILTER_FIELDS, getFilterValue)
      .filter((row) =>
        rowMatchesSearch(
          [
            row.proofNo,
            row.invoiceId,
            row.client,
            row.email,
            approvalServiceLabel(row),
            row.status,
            approvalQueueType(row),
          ],
          search,
        ),
      )
      .filter((row) =>
        rowMatchesDateRange(row.submittedAt || approvalIssuedDate(row) || row.issuedDate, dateRange),
      );
    return sortApprovals(filtered, sortBy);
  }, [rows, appliedFilter, sortBy, getFilterValue, search, dateRange]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / PAGE_SIZE));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return processedRows.slice(start, start + PAGE_SIZE);
  }, [processedRows, page]);

  const getApprovalRowId = useCallback(
    (row: CommercePaymentProofRow) => String(row.id),
    []
  );
  const selection = useRowSelection(paginatedRows, getApprovalRowId);
  const hasSelection = selection.selectedCount > 0;

  const selectedRows = useMemo(() => {
    const ids = new Set(selection.selectedIds);
    return processedRows.filter((row) => ids.has(String(row.id)));
  }, [processedRows, selection.selectedIds]);

  const rangeStart = processedRows.length ? (page - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(page * PAGE_SIZE, processedRows.length);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const handleVerify = async (row: CommercePaymentProofRow) => {
    try {
      setBusyId(row.id);
      if (row.kind === "profile_change") {
        await approveCommerceProfileChange(row.id);
        toast.success(`Approved profile change ${row.proofNo}. Customer profile updated.`);
      } else {
        await verifyCommercePaymentProof(row.id);
        toast.success(`Verified ${row.proofNo}. Customer billing updated.`);
      }
      setReviewTarget((current) => (current?.id === row.id ? null : current));
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to approve queue item.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async (row: CommercePaymentProofRow) => {
    const reason = window.prompt("Optional rejection note for the customer:");
    if (reason === null) return;

    try {
      setBusyId(row.id);
      if (row.kind === "profile_change") {
        await rejectCommerceProfileChange(row.id, reason || undefined);
        toast.success(`Rejected profile change ${row.proofNo}. Customer notified.`);
      } else {
        await rejectCommercePaymentProof(row.id, reason || undefined);
        toast.success(`Rejected ${row.proofNo}. Customer notified.`);
      }
      setReviewTarget((current) => (current?.id === row.id ? null : current));
      load();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to reject queue item.");
    } finally {
      setBusyId(null);
    }
  };

  const handleAction = async (row: CommercePaymentProofRow, action: string) => {
    if (action === "view") {
      setReviewTarget(row);
      return;
    }
    if (action === "edit") {
      toast.info(
        row.kind === "profile_change"
          ? "Review the requested profile fields, then approve or reject the request."
          : "Edit approval details from the linked invoice or transaction record.",
      );
      return;
    }
    if (action === "pay") {
      await handleVerify(row);
      return;
    }
    if (action === "file") {
      if (row.fileUrl) {
        window.open(row.fileUrl, "_blank", "noopener,noreferrer");
        return;
      }
      if (row.kind === "profile_change") {
        toast.info("No pending profile photo attached to this request.");
        return;
      }
      toast.error("No receipt file attached.");
      return;
    }
    if (action === "reject") {
      await handleReject(row);
    }
  };

  const handleColumnSort = (column: ApprovalColumnKey) => {
    setSortBy((current) => toggleApprovalSort(current, column));
  };

  const renderSortableHead = (column: ApprovalColumnKey, label: string) => (
    <SortableTableHead
      key={column}
      label={label}
      active={isApprovalColumnSorted(sortBy, column)}
      direction={approvalSortDirection(sortBy, column) ?? "asc"}
      onClick={() => handleColumnSort(column)}
    />
  );

  const renderActionSelect = (row: CommercePaymentProofRow) => (
    <select
      className={styles.actionSelect}
      defaultValue=""
      disabled={busyId === row.id}
      onChange={(e) => {
        const value = e.target.value;
        e.target.value = "";
        if (value) void handleAction(row, value);
      }}
    >
      <option value="" disabled>
        Actions...
      </option>
      <option value="view">
        {row.kind === "profile_change" ? "View Profile Changes" : "View Service Details"}
      </option>
      <option value="edit">Edit</option>
      <option value="pay">
        {row.kind === "profile_change" ? "Approve Profile Change" : "Approve Order"}
      </option>
      {row.fileUrl ? <option value="file">Attached File</option> : null}
      <option value="reject">
        {row.kind === "profile_change" ? "Reject Profile Change" : "Reject Purchase"}
      </option>
    </select>
  );

  const handleExportSelected = () => {
    if (selectedRows.length === 0 || exporting) return;
    setExporting(true);
    try {
      exportRowsToExcel(
        ["Invoice #", "Service Name", "Plan", "Client", "Issued Date", "Due Date", "Amount", "Status"],
        selectedRows.map((row) => [
          row.invoiceId || row.proofNo,
          approvalServiceLabel(row),
          approvalPlanLabel(row),
          row.client,
          approvalIssuedDate(row),
          approvalDueDate(row),
          approvalAmountLabel(row),
          row.status || "Pending Review",
        ]),
        "approvals",
      );
    } finally {
      setExporting(false);
    }
  };

  const renderApprovalGridCard = (row: CommercePaymentProofRow) => (
    <article key={row.id} className={styles.txGridCard}>
      <div className={styles.txGridCardTop}>
        <span className={styles.monoCell}>{row.invoiceId || row.proofNo}</span>
        <span className={styles.badgePending}>{row.status || "Pending Review"}</span>
      </div>
      <div>
        <div className={styles.txGridLabel}>Service Name</div>
        <div className={styles.txGridValue}>{approvalServiceLabel(row)}</div>
      </div>
      <div>
        <div className={styles.txGridLabel}>Plan</div>
        <div className={styles.txGridValue}>{approvalPlanLabel(row)}</div>
      </div>
      <div className={styles.txGridMeta}>
        <span>Client: {row.client}</span>
        <span>Issued: {approvalIssuedDate(row)}</span>
        <span>Due: {approvalDueDate(row)}</span>
      </div>
      {row.fileName ? <div className={styles.approvalFileInline}>{row.fileName}</div> : null}
      <div className={styles.txGridFooter}>
        <strong className={styles.amountCell}>{approvalAmountLabel(row)}</strong>
        <button
          type="button"
          className={styles.primaryBtnSm}
          disabled={busyId === row.id}
          onClick={() => void handleVerify(row)}
        >
          {row.kind === "profile_change" ? "Approve Profile" : "Approve"}
        </button>
      </div>
      <div>{renderActionSelect(row)}</div>
    </article>
  );

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Provisioning &amp; Payment Proof Approvals</h3>
          <p className={styles.panelSubtitle}>
            Review pending server deployment requests, uploaded payment receipts, and customer profile change requests.
          </p>
        </div>
        <div className={styles.analyticsToggle}>
          <button
            type="button"
            className={viewMode === "list" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn}
            onClick={() => setViewMode("list")}
          >
            <i className="fa-solid fa-list" aria-hidden="true" /> List
          </button>
          <button
            type="button"
            className={viewMode === "grid" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn}
            onClick={() => setViewMode("grid")}
          >
            <i className="fa-solid fa-table-cells" aria-hidden="true" /> Grid
          </button>
        </div>
      </div>

      {hasSelection ? (
        <CommerceBulkSelectionBar
          selectedCount={selection.selectedCount}
          entityLabel="approval"
          exporting={exporting}
          onExport={handleExportSelected}
          onClear={selection.clearSelection}
          showDelete={false}
        />
      ) : null}

      {loading ? (
        <p className={styles.emptyState}>Loading approvals...</p>
      ) : (
        <TableFilterShell
          open={filterOpen}
          active={isTableFilterActive(appliedFilter)}
          total={processedRows.length}
          onToggle={() => setFilterOpen((open) => !open)}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search approvals..."
          dateRange={dateRange}
          onDateRangeChange={(next) => {
            setDateRange(next);
            setPage(1);
          }}
          sortControl={
            <select
              className={styles.selectInline}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ApprovalSortKey)}
              aria-label="Sort approvals"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Amount (High to Low)</option>
              <option value="amount-asc">Amount (Low to High)</option>
            </select>
          }
          panel={
            <TableFilterPanel
              rows={rows}
              fields={APPROVAL_FILTER_FIELDS}
              draft={draftFilter}
              applied={appliedFilter}
              getValue={getFilterValue}
              onDraftChange={setDraftFilter}
              onApply={() => {
                setAppliedFilter(draftFilter);
                setPage(1);
              }}
              onClear={() => {
                setDraftFilter(emptyTableFilter);
                setAppliedFilter(emptyTableFilter);
                setPage(1);
              }}
              onClose={() => setFilterOpen(false)}
            />
          }
        >
          {viewMode === "list" ? (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <CommerceSelectAllHead
                        allSelected={selection.allSelected}
                        someSelected={selection.someSelected}
                        onToggleAll={selection.toggleAll}
                        disabled={paginatedRows.length === 0}
                      />
                      {renderSortableHead("invoice", "Invoice #")}
                      {renderSortableHead("service", "Service Name")}
                      {renderSortableHead("plan", "Plan")}
                      {renderSortableHead("client", "Client")}
                      {renderSortableHead("issued", "Issued Date")}
                      {renderSortableHead("due", "Due Date")}
                      {renderSortableHead("amount", "Amount")}
                      {renderSortableHead("status", "Status")}
                      <th className={styles.tableActionHead}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={10}>No pending approvals or verification items found matching filter.</td>
                      </tr>
                    ) : (
                      paginatedRows.map((row) => (
                        <tr
                          key={row.id}
                          className={selection.isSelected(row) ? styles.rowSelected : undefined}
                        >
                          <CommerceSelectRowCell
                            checked={selection.isSelected(row)}
                            onChange={() => selection.toggleRow(row)}
                            label={`Select approval ${row.invoiceId || row.proofNo}`}
                          />
                          <td className={styles.monoCell}>
                            <button
                              type="button"
                              className={styles.tableCellLink}
                              onClick={() => void handleAction(row, "view")}
                            >
                              {row.invoiceId || row.proofNo}
                            </button>
                          </td>
                          <td className={styles.txServiceCell}>{approvalServiceLabel(row)}</td>
                          <td className={styles.txPlanCell}>
                            <strong>{approvalPlanLabel(row)}</strong>
                          </td>
                          <td>{row.client}</td>
                          <td>{approvalIssuedDate(row)}</td>
                          <td>{approvalDueDate(row)}</td>
                          <td className={styles.amountCell}>{approvalAmountLabel(row)}</td>
                          <td className={styles.statusCell}>
                            <span className={styles.badgePending}>{row.status || "Pending Review"}</span>
                          </td>
                          <td className={styles.tableActionCell}>{renderActionSelect(row)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className={styles.paginationBar}>
                <div className={styles.paginationInfo}>
                  Showing {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
                </div>
                <div className={styles.paginationControls}>
                  <button
                    type="button"
                    className={styles.secondaryBtnSm}
                    disabled={page <= 1 || processedRows.length === 0}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    aria-label="Previous page"
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  </button>
                  <span className={styles.paginationRange}>
                    {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
                  </span>
                  <button
                    type="button"
                    className={styles.secondaryBtnSm}
                    disabled={page >= totalPages || processedRows.length === 0}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    aria-label="Next page"
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={styles.txGrid}>
                {paginatedRows.length === 0 ? (
                  <p className={styles.emptyState}>No pending approvals or verification items found matching filter.</p>
                ) : (
                  paginatedRows.map(renderApprovalGridCard)
                )}
              </div>

              <div className={styles.paginationBar}>
                <div className={styles.paginationInfo}>
                  Showing {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
                </div>
                <div className={styles.paginationControls}>
                  <button
                    type="button"
                    className={styles.secondaryBtnSm}
                    disabled={page <= 1 || processedRows.length === 0}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    aria-label="Previous page"
                  >
                    <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                  </button>
                  <span className={styles.paginationRange}>
                    {processedRows.length === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
                  </span>
                  <button
                    type="button"
                    className={styles.secondaryBtnSm}
                    disabled={page >= totalPages || processedRows.length === 0}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    aria-label="Next page"
                  >
                    <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </>
          )}
        </TableFilterShell>
      )}

      <ApprovalReviewModal
        open={!!reviewTarget}
        row={reviewTarget}
        busy={reviewTarget ? busyId === reviewTarget.id : false}
        onClose={() => setReviewTarget(null)}
        onApprove={(row) => void handleVerify(row)}
        onReject={(row) => void handleReject(row)}
      />
    </section>
  );
}
