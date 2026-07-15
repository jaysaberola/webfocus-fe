import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuditRow, getAuditTrails } from "@/services/auditService";
import Tooltip from "@/components/UI/Tooltip";

type AuditEventFilter = "all" | "created" | "updated" | "deleted" | "restored";

const modelLabel = (auditableType: string) => {
  const tail = (auditableType || "").split("\\").pop() || auditableType || "Record";
  // normalize common model names to your UI wording
  if (tail.toLowerCase() === "article") return "News";
  return tail;
};

const actorLabel = (row: AuditRow) => {
  const fname = row.user?.fname?.trim() ?? "";
  const lname = row.user?.lname?.trim() ?? "";
  const name = `${fname} ${lname}`.trim();
  return name || row.user?.email || "System";
};

const eventMeta = (eventRaw: string) => {
  const event = (eventRaw || "").toLowerCase();
  if (event.includes("create")) return { icon: "fas fa-plus", badge: "text-bg-success", label: "Created" };
  if (event.includes("update")) return { icon: "fas fa-pen", badge: "text-bg-primary", label: "Updated" };
  if (event.includes("delete")) return { icon: "fas fa-trash", badge: "text-bg-danger", label: "Deleted" };
  if (event.includes("restore")) return { icon: "fas fa-rotate-left", badge: "text-bg-warning", label: "Restored" };
  return { icon: "fas fa-circle", badge: "text-bg-secondary", label: eventRaw || "Event" };
};

const timeAgo = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  const abs = Math.abs(sec);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];

  for (const [unit, s] of units) {
    if (abs >= s || unit === "second") {
      const v = Math.round(sec / s);
      return rtf.format(-v, unit);
    }
  }
  return "—";
};

const dayBucketLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Unknown";

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfThatDay = new Date(d);
  startOfThatDay.setHours(0, 0, 0, 0);

  const diffDays = Math.round((startOfToday.getTime() - startOfThatDay.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const entityHref = (row: AuditRow) => {
  const t = (row.auditable_type || "").split("\\").pop()?.toLowerCase() ?? "";
  const id = row.auditable_id;
  if (!id) return null;

  if (t === "page") return `/pages/edit/${id}`;
  if (t === "article") return `/news/edit/${id}`;
  if (t === "album") return `/banners/edit/${id}`;
  if (t === "menu") return `/menu/edit/${id}`;
  if (t === "user") return `/users/edit/${id}`;
  return null;
};

export default function RecentActivity() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<AuditEventFilter>("all");

  const perPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchActivity = async (opts?: { silent?: boolean; page?: number }) => {
    try {
      if (!opts?.silent) setLoading(true);
      setError(null);

      const requestedPage = opts?.page ?? currentPage;
      const res = await getAuditTrails({
        search: search.trim() || undefined,
        page: requestedPage,
        per_page: perPage,
      });

      const payload: any = (res as any)?.data;
      const items: AuditRow[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];

      const nextTotalPages =
        Number(payload?.last_page ?? payload?.meta?.last_page ?? payload?.data?.last_page ?? payload?.data?.meta?.last_page) || 1;
      const nextCurrentPage =
        Number(payload?.current_page ?? payload?.meta?.current_page ?? payload?.data?.current_page ?? payload?.data?.meta?.current_page) ||
        requestedPage;

      setRows(items);
      setTotalPages(nextTotalPages);
      setCurrentPage(nextCurrentPage);
    } catch (err) {
      console.error("Failed to load recent activity", err);
      setError("Failed to load recent activity.");
      setRows([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventFilter]);

  useEffect(() => {
    fetchActivity({ page: currentPage, silent: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const filtered = useMemo(() => {
    if (eventFilter === "all") return rows;
    return rows.filter((r) => {
      const e = (r.event || "").toLowerCase();
      return e.includes(eventFilter);
    });
  }, [rows, eventFilter]);

  const limited = filtered;

  const grouped = useMemo(() => {
    const m = new Map<string, AuditRow[]>();
    for (const r of limited) {
      const key = dayBucketLabel(r.created_at);
      const list = m.get(key) ?? [];
      list.push(r);
      m.set(key, list);
    }
    // preserve insertion order (audits are usually newest-first)
    return Array.from(m.entries());
  }, [limited]);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxButtons = 5;

    const safeTotal = Math.max(1, totalPages);
    const safeCurrent = Math.min(Math.max(1, currentPage), safeTotal);

    let start = Math.max(1, safeCurrent - Math.floor(maxButtons / 2));
    let end = Math.min(safeTotal, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);

    for (let p = start; p <= end; p++) pages.push(p);
    return { pages, safeCurrent, safeTotal };
  }, [currentPage, totalPages]);

  return (
    <div className="card cms-panel shadow-sm border-0 h-100 d-flex flex-column">
      <div className="card-header cms-panel__header">
        <div className="d-flex flex-column flex-md-row gap-2 align-items-md-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="cms-panel__badge">
              <i className="fas fa-clock-rotate-left" />
            </span>
            <div>
              <h4 className="mb-0 cms-panel__title d-flex align-items-center gap-2">
                Recent Activity
                <Tooltip text="Shows the latest actions performed in the CMS such as creating, updating, deleting, or restoring records." />
              </h4>
              <div className="text-muted small d-flex align-items-center gap-1">
                Latest changes across the CMS
                <Tooltip text="Displays the most recent content and system changes performed by users." />
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2 align-items-center justify-content-md-end">
            <div className="input-group input-group-sm" style={{ width: 260 }}>
              <span className="input-group-text">
                <i className="fas fa-magnifying-glass" />
              </span>
              <input
                className="form-control"
                placeholder="Search activity"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Tooltip text="Search activity by user name, content type, or event." />
            </div>

            <select
              className="form-select form-select-sm"
              style={{ width: 140 }}
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value as AuditEventFilter)}
              aria-label="Filter events"
            >
              <option value="all">All</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="restored">Restored</option>
            </select>
            <Tooltip text="Filter activity by event type such as created, updated, deleted, or restored." />

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => fetchActivity({ silent: false, page: currentPage })}
              disabled={loading}
            >
              <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-rotate"} me-2`} />
              Refresh
            </button>

            <Link href="/settings/audit" className="btn btn-sm btn-outline-primary">
              <i className="fas fa-table-list me-2" />
              Audit Logs
            </Link>
            <Tooltip text="Open the full audit log history with detailed records." />
          </div>
        </div>
      </div>

      <div className="p-3 flex-grow-1 d-flex flex-column" style={{ minHeight: 0 }}>
        {error && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
            <div>
              <i className="fas fa-triangle-exclamation me-2" />
              {error}
            </div>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => fetchActivity()}>
              Retry
            </button>
          </div>
        )}

        <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
          {loading ? (
            <ul className="list-group list-group-flush cms-activity">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i} className="list-group-item cms-activity__item">
                  <div className="d-flex align-items-start justify-content-between gap-3">
                    <div className="d-flex align-items-start gap-2" style={{ minWidth: 0 }}>
                      <span className="badge rounded-pill text-bg-secondary">
                        <i className="fas fa-circle" />
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div className="cms-skeleton cms-skeleton--line" aria-hidden="true" />
                        <div className="cms-skeleton cms-skeleton--line mt-2" aria-hidden="true" style={{ maxWidth: 220 }} />
                      </div>
                    </div>
                    <span className="cms-skeleton cms-skeleton--pill" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ul>
          ) : limited.length === 0 ? (
            <div className="text-center py-4">
              <div className="fw-semibold">No activity found</div>
              <div className="text-muted small">Try clearing search or changing the filter.</div>
            </div>
          ) : (
            <div className="cms-activity-groups">
              {grouped.map(([label, list]) => (
                <div key={label} className="mb-3">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="text-uppercase text-muted small fw-semibold">{label}</div>
                    <div className="text-muted small">{list.length} item(s)</div>
                  </div>

                  <ul className="list-group list-group-flush cms-activity">
                    {list.map((row) => {
                      const meta = eventMeta(row.event);
                      const when = timeAgo(row.created_at);
                      const model = modelLabel(row.auditable_type);
                      const href = entityHref(row);

                      return (
                        <li key={row.id} className="list-group-item cms-activity__item">
                          <div className="d-flex align-items-start justify-content-between gap-3">
                            <div className="d-flex align-items-start gap-2" style={{ minWidth: 0 }}>
                              <span className={`badge rounded-pill ${meta.badge}`} title={meta.label}>
                                <i className={meta.icon} />
                              </span>

                              <div style={{ minWidth: 0 }}>
                                <div className="d-flex flex-wrap gap-2 align-items-center">
                                  <div className="fw-semibold text-truncate">{actorLabel(row)}</div>
                                  <span className="text-muted small">{meta.label.toLowerCase()}</span>
                                  <span className="badge bg-dark-subtle text-dark">
                                    {model} #{row.auditable_id}
                                  </span>
                                </div>

                                <div className="text-muted small d-flex flex-wrap gap-2">
                                  <span className="text-truncate" title={row.ip_address || undefined}>
                                    {row.ip_address ? `IP: ${row.ip_address}` : ""}
                                  </span>
                                  {href && (
                                    <Link href={href} className="text-decoration-none">
                                      Open record
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className="cms-activity__time" title={new Date(row.created_at).toLocaleString()}>
                              {when}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && limited.length > 0 && pageNumbers.safeTotal > 1 && (
          <nav aria-label="Recent activity pagination" className="mt-2 pt-2 border-top">
            <ul className="pagination pagination-sm mb-0 justify-content-end">
              <li className={`page-item ${pageNumbers.safeCurrent <= 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  disabled={pageNumbers.safeCurrent <= 1}
                  aria-label="First page"
                >
                  «
                </button>
              </li>

              <li className={`page-item ${pageNumbers.safeCurrent <= 1 ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={pageNumbers.safeCurrent <= 1}
                  aria-label="Previous page"
                >
                  Prev
                </button>
              </li>

              {pageNumbers.pages.map((p) => (
                <li key={p} className={`page-item ${p === pageNumbers.safeCurrent ? "active" : ""}`}>
                  <button className="page-link" type="button" onClick={() => setCurrentPage(p)}>
                    {p}
                  </button>
                </li>
              ))}

              <li className={`page-item ${pageNumbers.safeCurrent >= pageNumbers.safeTotal ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(pageNumbers.safeTotal, p + 1))}
                  disabled={pageNumbers.safeCurrent >= pageNumbers.safeTotal}
                  aria-label="Next page"
                >
                  Next
                </button>
              </li>

              <li className={`page-item ${pageNumbers.safeCurrent >= pageNumbers.safeTotal ? "disabled" : ""}`}>
                <button
                  className="page-link"
                  type="button"
                  onClick={() => setCurrentPage(pageNumbers.safeTotal)}
                  disabled={pageNumbers.safeCurrent >= pageNumbers.safeTotal}
                  aria-label="Last page"
                >
                  »
                </button>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
