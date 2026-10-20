import { useCallback, useEffect, useMemo, useState } from "react";
import LeadCrmForm from "@/components/CommerceAdmin/LeadCrmForm";
import SortableTableHead from "@/components/CommerceAdmin/SortableTableHead";
import ResizableTableFrame from "@/components/UI/ResizableTableFrame";
import { TableFilterShell } from "@/components/shared/TableFilterPanel";
import { emptyDateRange, rowMatchesDateRange, type DateRangeValue } from "@/lib/dateRangeHelpers";
import { getLeads, type CrmLeadRow } from "@/services/leadService";
import styles from "@/styles/commerceAdmin.module.css";

type View = "list" | "create" | "edit";

type LeadSortKey =
  | "company-asc"
  | "company-desc"
  | "newest"
  | "oldest"
  | "status-asc"
  | "status-desc"
  | "source-asc"
  | "source-desc";

const LEAD_COLUMNS = ["company", "contact", "leadSource", "status", "owner", "created"] as const;

const LEAD_COLUMN_LABELS: Record<(typeof LEAD_COLUMNS)[number], string> = {
  company: "Company",
  contact: "Contact",
  leadSource: "Lead Source",
  status: "Status",
  owner: "Owner",
  created: "Created Date",
};

const PAGE_SIZE = 10;

function leadOwnerName(row: CrmLeadRow) {
  const owner = row.lead_owner;
  if (!owner) return "Unassigned";
  return (
    String(owner.name || "").trim() ||
    `${owner.fname || ""} ${owner.lname || ""}`.trim() ||
    owner.email ||
    "Unassigned"
  );
}

function leadContactPerson(row: CrmLeadRow) {
  const person = [row.salutation, row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return person || "—";
}

function formatLeadCreated(row: CrmLeadRow) {
  if (!row.created_at) return "—";
  const date = new Date(row.created_at);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

function sortLeads(rows: CrmLeadRow[], sortBy: LeadSortKey) {
  const copy = [...rows];
  const compareText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: "base" });
  copy.sort((a, b) => {
    switch (sortBy) {
      case "company-asc":
        return compareText(a.company || "", b.company || "");
      case "company-desc":
        return compareText(b.company || "", a.company || "");
      case "status-asc":
        return compareText(a.lead_status || "", b.lead_status || "");
      case "status-desc":
        return compareText(b.lead_status || "", a.lead_status || "");
      case "source-asc":
        return compareText(a.lead_source || "", b.lead_source || "");
      case "source-desc":
        return compareText(b.lead_source || "", a.lead_source || "");
      case "oldest":
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      case "newest":
      default:
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }
  });
  return copy;
}

function toggleLeadSort(current: LeadSortKey, column: "company" | "status" | "source" | "created"): LeadSortKey {
  if (column === "created") {
    return current === "newest" ? "oldest" : "newest";
  }
  if (column === "company") {
    return current === "company-asc" ? "company-desc" : "company-asc";
  }
  if (column === "status") {
    return current === "status-asc" ? "status-desc" : "status-asc";
  }
  return current === "source-asc" ? "source-desc" : "source-asc";
}

function isLeadColumnSorted(sortBy: LeadSortKey, column: "company" | "status" | "source" | "created") {
  if (column === "created") return sortBy === "newest" || sortBy === "oldest";
  if (column === "company") return sortBy === "company-asc" || sortBy === "company-desc";
  if (column === "status") return sortBy === "status-asc" || sortBy === "status-desc";
  return sortBy === "source-asc" || sortBy === "source-desc";
}

function leadSortDirection(sortBy: LeadSortKey, column: "company" | "status" | "source" | "created"): "asc" | "desc" {
  if (column === "created") return sortBy === "oldest" ? "asc" : "desc";
  if (sortBy.endsWith("-desc")) return "desc";
  return "asc";
}

export default function CommerceLeadsTab() {
  const [view, setView] = useState<View>("list");
  const [rows, setRows] = useState<CrmLeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editLead, setEditLead] = useState<CrmLeadRow | null>(null);
  const [page, setPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<LeadSortKey>("newest");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeValue>(emptyDateRange);

  const reload = useCallback(() => {
    setLoading(true);
    getLeads({ search: search.trim() || undefined, page, per_page: PAGE_SIZE }, { silent: true })
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
  }, [page, search]);

  useEffect(() => {
    if (view !== "list") return;
    reload();
  }, [view, reload]);

  const dateFilteredRows = useMemo(
    () => rows.filter((row) => rowMatchesDateRange(row.created_at, dateRange)),
    [rows, dateRange],
  );

  const sortedRows = useMemo(() => sortLeads(dateFilteredRows, sortBy), [dateFilteredRows, sortBy]);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const rangeStart = totalRecords === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, totalRecords);

  const openEdit = (row: CrmLeadRow) => {
    setEditLead(row);
    setView("edit");
  };

  if (view === "create") {
    return (
      <LeadCrmForm
        mode="create"
        onBack={() => setView("list")}
        onSaved={(options) => {
          if (options?.andNew) {
            setView("create");
            reload();
            return;
          }
          setView("list");
        }}
      />
    );
  }

  if (view === "edit" && editLead) {
    return (
      <LeadCrmForm
        mode="edit"
        lead={editLead}
        onBack={() => {
          setEditLead(null);
          setView("list");
        }}
        onSaved={() => {
          setEditLead(null);
          setView("list");
        }}
      />
    );
  }

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Leads</h3>
          <p className={styles.panelSubtitle}>Capture and track sales leads before they become clients.</p>
        </div>
        <button type="button" className={styles.primaryBtnSm} onClick={() => setView("create")}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          <span className={styles.toolbarLabelFull}>Create Lead</span>
          <span className={styles.toolbarLabelShort}>Create</span>
        </button>
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
        searchPlaceholder="Search leads..."
        dateRange={dateRange}
        onDateRangeChange={(next) => {
          setDateRange(next);
          setPage(1);
        }}
        panel={null}
      >
        {loading ? (
          <p className={styles.emptyState}>Loading leads...</p>
        ) : (
          <>
            <ResizableTableFrame
              storageKey="commerceAdmin:leads"
              columns={[...LEAD_COLUMNS]}
              labels={LEAD_COLUMN_LABELS}
              stackOnMobile
              className={styles.tableWrap}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <SortableTableHead
                      label={LEAD_COLUMN_LABELS.company}
                      active={isLeadColumnSorted(sortBy, "company")}
                      direction={leadSortDirection(sortBy, "company")}
                      onClick={() => setSortBy((current) => toggleLeadSort(current, "company"))}
                    />
                    <th>{LEAD_COLUMN_LABELS.contact}</th>
                    <SortableTableHead
                      label={LEAD_COLUMN_LABELS.leadSource}
                      active={isLeadColumnSorted(sortBy, "source")}
                      direction={leadSortDirection(sortBy, "source")}
                      onClick={() => setSortBy((current) => toggleLeadSort(current, "source"))}
                    />
                    <SortableTableHead
                      label={LEAD_COLUMN_LABELS.status}
                      active={isLeadColumnSorted(sortBy, "status")}
                      direction={leadSortDirection(sortBy, "status")}
                      onClick={() => setSortBy((current) => toggleLeadSort(current, "status"))}
                    />
                    <th>{LEAD_COLUMN_LABELS.owner}</th>
                    <SortableTableHead
                      label={LEAD_COLUMN_LABELS.created}
                      active={isLeadColumnSorted(sortBy, "created")}
                      direction={leadSortDirection(sortBy, "created")}
                      onClick={() => setSortBy((current) => toggleLeadSort(current, "created"))}
                    />
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.length === 0 ? (
                    <tr>
                      <td colSpan={LEAD_COLUMNS.length}>No leads found.</td>
                    </tr>
                  ) : (
                    sortedRows.map((row) => (
                      <tr key={row.id}>
                        <td data-label={LEAD_COLUMN_LABELS.company}>
                          <button type="button" className={styles.tableCellLink} onClick={() => openEdit(row)}>
                            {row.company || "—"}
                          </button>
                        </td>
                        <td data-label={LEAD_COLUMN_LABELS.contact}>{leadContactPerson(row)}</td>
                        <td data-label={LEAD_COLUMN_LABELS.leadSource}>{row.lead_source || "—"}</td>
                        <td data-label={LEAD_COLUMN_LABELS.status}>
                          {row.lead_status ? (
                            <span className={styles.badgeMuted}>{row.lead_status}</span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td data-label={LEAD_COLUMN_LABELS.owner}>{leadOwnerName(row)}</td>
                        <td data-label={LEAD_COLUMN_LABELS.created}>{formatLeadCreated(row)}</td>
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
