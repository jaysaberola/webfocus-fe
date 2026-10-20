import { useCallback, useEffect, useMemo, useState } from "react";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import ResizableTableFrame from "@/components/UI/ResizableTableFrame";
import { TableFilterShell } from "@/components/shared/TableFilterPanel";
import { emptyDateRange, rowMatchesDateRange, type DateRangeValue } from "@/lib/dateRangeHelpers";
import {
  getInquiries,
  getInquiry,
  INQUIRY_STATUS_LABELS,
  updateInquiryStatus,
  type ContactInquiryRow,
  type InquiryStatus,
} from "@/services/inquiryService";
import { notifyCommerceNotificationsUpdated } from "@/services/commerceAdminService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  initialInquiryId?: number;
};

const INQUIRY_COLUMNS = ["inquiryType", "name", "email", "phone", "status", "received"] as const;

const INQUIRY_COLUMN_LABELS: Record<(typeof INQUIRY_COLUMNS)[number], string> = {
  inquiryType: "Inquiry Type",
  name: "Name",
  email: "Email",
  phone: "Contact Number",
  status: "Status",
  received: "Received",
};

const PAGE_SIZE = 10;

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc" | "status-asc" | "status-desc";

function inquiryName(row: ContactInquiryRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "—";
}

function formatReceived(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string) {
  if (status === "new") return styles.badgePending;
  if (status === "closed") return styles.badgeMuted;
  return styles.badgePaid;
}

export default function CommerceInquiriesTab({ initialInquiryId }: Props) {
  const [rows, setRows] = useState<ContactInquiryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<SortKey>("newest");
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<ContactInquiryRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const reload = useCallback(() => {
    setLoading(true);
    getInquiries(
      {
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        page,
        per_page: PAGE_SIZE,
      },
      { silent: true },
    )
      .then((res) => {
        const data = Array.isArray(res?.data) ? res.data : [];
        setRows(data);
        setTotalRecords(Number(res?.total ?? data.length) || 0);
      })
      .catch(() => {
        setRows([]);
        setTotalRecords(0);
      })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    if (initialInquiryId && initialInquiryId > 0) {
      setSelectedId(initialInquiryId);
    }
  }, [initialInquiryId]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    getInquiry(selectedId, { silent: true })
      .then((row) => {
        setDetail(row);
        notifyCommerceNotificationsUpdated();
      })
      .catch(() => {
        toast.error("Unable to load inquiry.");
        setSelectedId(null);
      })
      .finally(() => setDetailLoading(false));
  }, [selectedId]);

  const filteredRows = useMemo(
    () => rows.filter((row) => rowMatchesDateRange(row.created_at, dateRange)),
    [rows, dateRange],
  );

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return inquiryName(a).localeCompare(inquiryName(b));
        case "name-desc":
          return inquiryName(b).localeCompare(inquiryName(a));
        case "status-asc":
          return (a.status || "").localeCompare(b.status || "");
        case "status-desc":
          return (b.status || "").localeCompare(a.status || "");
        case "oldest":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        case "newest":
        default:
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });
    return copy;
  }, [filteredRows, sortBy]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const rangeStart = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalRecords);

  const saveStatus = async (status: InquiryStatus) => {
    if (!detail) return;
    setSavingStatus(true);
    try {
      const updated = await updateInquiryStatus(detail.id, status);
      setDetail(updated);
      setRows((current) => current.map((row) => (row.id === updated.id ? { ...row, status: updated.status } : row)));
      toast.success("Inquiry status updated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  if (selectedId) {
    return (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <button type="button" className={styles.secondaryBtnSm} onClick={() => setSelectedId(null)}>
              <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to inquiries
            </button>
            <h3 className={styles.panelTitle} style={{ marginTop: "0.75rem" }}>
              Contact Us inquiry
            </h3>
            <p className={styles.panelSubtitle}>Submitted from the public Contact Us page.</p>
          </div>
        </div>

        {detailLoading || !detail ? (
          <p className={styles.emptyState}>Loading inquiry...</p>
        ) : (
          <div className={styles.clientCrmSection}>
            <div className={styles.clientCrmGrid}>
              <div className={styles.clientCrmCol}>
                <p className={styles.clientCrmField}>
                  <span className={styles.clientCrmFieldLabel}>Inquiry type</span>
                  <strong>{detail.inquiry_type}</strong>
                </p>
                <p className={styles.clientCrmField}>
                  <span className={styles.clientCrmFieldLabel}>Name</span>
                  <strong>{inquiryName(detail)}</strong>
                </p>
                <p className={styles.clientCrmField}>
                  <span className={styles.clientCrmFieldLabel}>Email</span>
                  <a href={`mailto:${detail.email}`}>{detail.email}</a>
                </p>
                <p className={styles.clientCrmField}>
                  <span className={styles.clientCrmFieldLabel}>Contact number</span>
                  {detail.contact_number}
                </p>
                <p className={styles.clientCrmField}>
                  <span className={styles.clientCrmFieldLabel}>Received</span>
                  {formatReceived(detail.created_at)}
                </p>
              </div>
              <div className={styles.clientCrmCol}>
                <label className={styles.clientCrmField}>
                  <span className={styles.clientCrmFieldLabel}>Customer Care status</span>
                  <select
                    className={styles.clientCrmInput}
                    value={detail.status}
                    disabled={savingStatus}
                    onChange={(e) => void saveStatus(e.target.value as InquiryStatus)}
                  >
                    {(Object.keys(INQUIRY_STATUS_LABELS) as InquiryStatus[]).map((key) => (
                      <option key={key} value={key}>
                        {INQUIRY_STATUS_LABELS[key]}
                      </option>
                    ))}
                  </select>
                </label>
                {detail.preferred_services?.length ? (
                  <p className={styles.clientCrmField}>
                    <span className={styles.clientCrmFieldLabel}>Preferred services</span>
                    {detail.preferred_services.join(", ")}
                  </p>
                ) : null}
              </div>
            </div>
            <label className={styles.clientCrmField}>
              <span className={styles.clientCrmFieldLabel}>Message</span>
              <div className={`${styles.clientCrmInput} ${styles.clientCrmTextarea}`} style={{ whiteSpace: "pre-wrap" }}>
                {detail.message}
              </div>
            </label>
          </div>
        )}
      </section>
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Inquiries</h3>
          <p className={styles.panelSubtitle}>
            Messages from the website Contact Us form, routed to Customer Care first.
          </p>
        </div>
      </div>

      <div className={styles.toolbarRow}>
        <div className={styles.toolbarFilters}>
          <select
            className={styles.selectInline}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {(Object.keys(INQUIRY_STATUS_LABELS) as InquiryStatus[]).map((key) => (
              <option key={key} value={key}>
                {INQUIRY_STATUS_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <TableFilterShell
        open={filterOpen}
        active={Boolean(dateRange.from || dateRange.to)}
        total={totalRecords}
        onToggle={() => setFilterOpen((open) => !open)}
        search={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPage(1);
        }}
        searchPlaceholder="Search inquiries..."
        dateRange={dateRange}
        onDateRangeChange={(next) => {
          setDateRange(next);
          setPage(1);
        }}
        panel={null}
      >
        {loading ? (
          <p className={styles.emptyState}>Loading inquiries...</p>
        ) : (
          <>
            <ResizableTableFrame
              storageKey="commerceAdmin:inquiries"
              columns={[...INQUIRY_COLUMNS]}
              labels={INQUIRY_COLUMN_LABELS}
              stackOnMobile
              className={styles.tableWrap}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{INQUIRY_COLUMN_LABELS.inquiryType}</th>
                    <SortableTableHead
                      label={INQUIRY_COLUMN_LABELS.name}
                      active={sortBy === "name-asc" || sortBy === "name-desc"}
                      direction={sortBy === "name-desc" ? "desc" : "asc"}
                      onClick={() => setSortBy((current) => (current === "name-asc" ? "name-desc" : "name-asc"))}
                    />
                    <th>{INQUIRY_COLUMN_LABELS.email}</th>
                    <th>{INQUIRY_COLUMN_LABELS.phone}</th>
                    <SortableTableHead
                      label={INQUIRY_COLUMN_LABELS.status}
                      active={sortBy === "status-asc" || sortBy === "status-desc"}
                      direction={sortBy === "status-desc" ? "desc" : "asc"}
                      onClick={() => setSortBy((current) => (current === "status-asc" ? "status-desc" : "status-asc"))}
                    />
                    <SortableTableHead
                      label={INQUIRY_COLUMN_LABELS.received}
                      active={sortBy === "newest" || sortBy === "oldest"}
                      direction={sortBy === "oldest" ? "asc" : "desc"}
                      onClick={() => setSortBy((current) => (current === "newest" ? "oldest" : "newest"))}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.length === 0 ? (
                    <tr>
                      <td colSpan={INQUIRY_COLUMNS.length}>No inquiries yet.</td>
                    </tr>
                  ) : (
                    sortedRows.map((row) => (
                      <tr key={row.id}>
                        <td data-label={INQUIRY_COLUMN_LABELS.inquiryType}>{row.inquiry_type}</td>
                        <td data-label={INQUIRY_COLUMN_LABELS.name}>
                          <button type="button" className={styles.tableCellLink} onClick={() => setSelectedId(row.id)}>
                            {inquiryName(row)}
                            {row.status === "new" && !row.read_at ? " · New" : ""}
                          </button>
                        </td>
                        <td data-label={INQUIRY_COLUMN_LABELS.email}>{row.email}</td>
                        <td data-label={INQUIRY_COLUMN_LABELS.phone}>{row.contact_number}</td>
                        <td data-label={INQUIRY_COLUMN_LABELS.status}>
                          <span className={statusBadgeClass(row.status)}>
                            {INQUIRY_STATUS_LABELS[row.status as InquiryStatus] || row.status}
                          </span>
                        </td>
                        <td data-label={INQUIRY_COLUMN_LABELS.received}>{formatReceived(row.created_at)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ResizableTableFrame>

            <div className={styles.paginationBar}>
              <div className={styles.paginationInfo}>
                Total Records: {totalRecords} · Showing {totalRecords === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
              </div>
              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page <= 1 || totalRecords === 0}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
                <span className={styles.paginationRange}>
                  {totalRecords === 0 ? "0 to 0" : `${rangeStart} to ${rangeEnd}`}
                </span>
                <button
                  type="button"
                  className={styles.secondaryBtnSm}
                  disabled={page >= totalPages || totalRecords === 0}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  aria-label="Next page"
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </TableFilterShell>
    </section>
  );
}
