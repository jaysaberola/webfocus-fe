import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AuditRow, getAuditTrails } from "@/services/auditService";
import { scheduleIdleTask } from "@/lib/referenceDataCache";
import Tooltip from "@/components/UI/Tooltip";

type AuditEventFilter = "all" | "created" | "updated" | "deleted" | "restored";

const modelLabel = (auditableType: string) => {
  const tail = (auditableType || "").split("\\").pop() || auditableType || "Record";
  if (tail.toLowerCase() === "article") return "News";
  if (tail.toLowerCase() === "salestransaction") return "Sales Transaction";
  return tail.replace(/([a-z])([A-Z])/g, "$1 $2");
};

const actorLabel = (row: AuditRow) => {
  const fname = row.user?.fname?.trim() ?? "";
  const lname = row.user?.lname?.trim() ?? "";
  const name = `${fname} ${lname}`.trim();
  return name || row.user?.email || "System";
};

const eventMeta = (eventRaw: string) => {
  const event = (eventRaw || "").toLowerCase();
  if (event.includes("create")) {
    return { icon: "fa-solid fa-plus", tone: "success", label: "Created" };
  }
  if (event.includes("update")) {
    return { icon: "fa-solid fa-pen", tone: "primary", label: "Updated" };
  }
  if (event.includes("delete")) {
    return { icon: "fa-solid fa-trash", tone: "danger", label: "Deleted" };
  }
  if (event.includes("restore")) {
    return { icon: "fa-solid fa-rotate-left", tone: "warning", label: "Restored" };
  }
  return { icon: "fa-solid fa-circle", tone: "secondary", label: eventRaw || "Event" };
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

  const diffDays = Math.round(
    (startOfToday.getTime() - startOfThatDay.getTime()) / (1000 * 60 * 60 * 24)
  );
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

export default function RecentActivity({ compact = false }: { compact?: boolean }) {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [eventFilter, setEventFilter] = useState<AuditEventFilter>("all");

  const perPage = compact ? 3 : 5;
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
        Number(
          payload?.last_page ??
            payload?.meta?.last_page ??
            payload?.data?.last_page ??
            payload?.data?.meta?.last_page
        ) || 1;
      const nextCurrentPage =
        Number(
          payload?.current_page ??
            payload?.meta?.current_page ??
            payload?.data?.current_page ??
            payload?.data?.meta?.current_page
        ) || requestedPage;

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
    let mounted = true;
    const cancel = scheduleIdleTask(() => {
      if (mounted) void fetchActivity({ page: 1, silent: false });
    }, 400);

    return () => {
      mounted = false;
      cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentPage === 1) return;
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
    <div
      className={`card cms-panel cms-activity-panel shadow-sm border-0 h-100 d-flex flex-column${
        compact ? " cms-panel--compact" : ""
      }`}
    >
      <div className="card-header cms-panel__header cms-activity-panel__header">
        <div className="cms-activity-panel__top">
          <div className="cms-activity-panel__heading">
            <span className="cms-panel__badge" aria-hidden="true">
              <i className="fas fa-clock-rotate-left" />
            </span>
            <div className="cms-activity-panel__heading-text">
              <h4 className="mb-0 cms-panel__title">
                Recent Activity
                <Tooltip text="Latest create, update, delete, and restore actions across the CMS." />
              </h4>
              <p className="cms-activity-panel__subtitle mb-0">Latest changes across the CMS</p>
            </div>
          </div>

          <div className="cms-panel__toolbar cms-activity-panel__toolbar">
            <div className="cms-activity-search input-group input-group-sm">
              <span className="input-group-text" aria-hidden="true">
                <i className="fas fa-magnifying-glass" />
              </span>
              <input
                className="form-control"
                placeholder="Search activity"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search activity"
                title="Search by user, content type, or event"
              />
            </div>

            <select
              className="form-select form-select-sm cms-activity-filter"
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value as AuditEventFilter)}
              aria-label="Filter events"
              title="Filter by event type"
            >
              <option value="all">All events</option>
              <option value="created">Created</option>
              <option value="updated">Updated</option>
              <option value="deleted">Deleted</option>
              <option value="restored">Restored</option>
            </select>

            <button
              type="button"
              className="btn btn-sm btn-outline-secondary cms-activity-action-btn"
              onClick={() => fetchActivity({ silent: false, page: currentPage })}
              disabled={loading}
              title="Refresh activity"
            >
              <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-rotate"}`} aria-hidden="true" />
              <span>Refresh</span>
            </button>

            <Link
              href="/settings/audit"
              className="btn btn-sm btn-outline-primary cms-activity-action-btn"
              title="Open full audit log"
            >
              <i className="fas fa-table-list" aria-hidden="true" />
              <span>Audit Logs</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="cms-activity-panel__body flex-grow-1 d-flex flex-column">
        {error && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between py-2" role="alert">
            <div>
              <i className="fas fa-triangle-exclamation me-2" />
              {error}
            </div>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => fetchActivity()}>
              Retry
            </button>
          </div>
        )}

        <div className="flex-grow-1 overflow-auto" style={{ minHeight: 0 }}>
          {loading ? (
            <ul className="list-unstyled cms-activity mb-0">
              {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
                <li key={i} className="cms-activity__item">
                  <div className="cms-activity__row">
                    <span className="cms-activity__event cms-activity__event--secondary" aria-hidden="true">
                      <i className="fa-solid fa-circle" />
                    </span>
                    <div className="cms-activity__content">
                      <div className="cms-skeleton cms-skeleton--line" aria-hidden="true" />
                      <div
                        className="cms-skeleton cms-skeleton--line mt-2"
                        aria-hidden="true"
                        style={{ maxWidth: 180 }}
                      />
                    </div>
                    <span className="cms-skeleton cms-skeleton--pill" aria-hidden="true" />
                  </div>
                </li>
              ))}
            </ul>
          ) : limited.length === 0 ? (
            <div className="cms-activity__empty">
              <div className="cms-activity__empty-icon">
                <i className="fas fa-clock-rotate-left" />
              </div>
              <div className="fw-semibold">No activity found</div>
              <div className="text-muted small">Try clearing search or changing the filter.</div>
            </div>
          ) : (
            <div className="cms-activity-groups">
              {grouped.map(([label, list]) => (
                <div key={label} className="cms-activity-group">
                  <div className="cms-activity-group__meta">
                    <div className="cms-activity-date">{label}</div>
                    <div className="cms-activity-group__count">{list.length} item(s)</div>
                  </div>

                  <ul className="list-unstyled cms-activity mb-0">
                    {list.map((row) => {
                      const meta = eventMeta(row.event);
                      const when = timeAgo(row.created_at);
                      const model = modelLabel(row.auditable_type);
                      const href = entityHref(row);

                      return (
                        <li key={row.id} className="cms-activity__item">
                          <div className="cms-activity__row">
                            <span
                              className={`cms-activity__event cms-activity__event--${meta.tone}`}
                              title={meta.label}
                            >
                              <i className={meta.icon} aria-hidden="true" />
                            </span>

                            <div className="cms-activity__content">
                              <div className="cms-activity__headline">
                                <span className="cms-activity__actor">{actorLabel(row)}</span>
                                <span className="cms-activity__verb">{meta.label.toLowerCase()}</span>
                                <span className="cms-activity__entity">
                                  {model} #{row.auditable_id}
                                </span>
                              </div>

                              <div className="cms-activity__meta">
                                {row.ip_address ? (
                                  <span className="cms-activity__ip" title={row.ip_address}>
                                    IP: {row.ip_address}
                                  </span>
                                ) : null}
                                {href ? (
                                  <Link href={href} className="cms-activity__open">
                                    Open record
                                  </Link>
                                ) : null}
                              </div>
                            </div>

                            <time
                              className="cms-activity__time"
                              dateTime={row.created_at}
                              title={new Date(row.created_at).toLocaleString()}
                            >
                              {when}
                            </time>
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
          <nav aria-label="Recent activity pagination" className="cms-activity-pagination">
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
