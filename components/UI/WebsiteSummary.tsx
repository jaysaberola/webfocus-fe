import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { websiteService } from "@/services/websiteService";
import { getUsers } from "@/services/userService";
import { getPages } from "@/services/pageService";
import { getArticles } from "@/services/articleService";
import Tooltip from "@/components/UI/Tooltip";

type WebsiteSummaryStats = {
  pages?: number;
  albums?: number;
  news?: number;
};

type WebsiteSummaryProps = {
  stats?: WebsiteSummaryStats;
  loading?: boolean;
};

type WebsiteSettingsSnapshot = {
  company_name?: string;
  website_name?: string;
  email?: string;
  company_logo?: string | null;
  website_favicon?: string | null;
  google_analytics?: string | null;
  google_map?: string | null;
  google_recaptcha_sitekey?: string | null;
};

export default function WebsiteSummary({ stats, loading = false }: WebsiteSummaryProps) {
  const [settings, setSettings] = useState<WebsiteSettingsSnapshot | null>(null);
  const [socialCount, setSocialCount] = useState<number | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [usersTotal, setUsersTotal] = useState<number | null>(null);

  const [breakdownLoading, setBreakdownLoading] = useState(true);
  const [breakdown, setBreakdown] = useState<{
    pages?: { published?: number | null; private?: number | null; draft?: number | null; deleted?: number | null };
    news?: { published?: number | null; private?: number | null; draft?: number | null; deleted?: number | null };
    users?: { active?: number | null; inactive?: number | null };
  }>({});

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setSettingsLoading(true);
        const [s, socials, usersRes] = await Promise.all([
          websiteService.getSettings(),
          websiteService.getSocials().catch(() => ({ data: [] })),
          getUsers({ page: 1, per_page: 1 }).catch(() => null),
        ]);

        if (!mounted) return;
        setSettings(s);
        const count = Array.isArray((socials as any)?.data) ? (socials as any).data.filter(Boolean).length : 0;
        setSocialCount(count);

        const usersPayload: any = (usersRes as any);
        const total =
          Number(usersPayload?.meta?.total ?? usersPayload?.data?.meta?.total ?? usersPayload?.total ?? usersPayload?.data?.total) || null;
        setUsersTotal(total);
      } catch (err) {
        if (!mounted) return;
        setSettings(null);
        setSocialCount(null);
        setUsersTotal(null);
      } finally {
        if (!mounted) return;
        setSettingsLoading(false);
      }
    };

    const isRowDeleted = (row: any) => {
      if (!row) return false;
      if (row.deleted_at) return true;
      if (row.is_deleted === true) return true;
      if (row.is_deleted === 1 || row.is_deleted === "1") return true;
      if (row.deleted === true) return true;
      const raw = (row.status ?? row.visibility ?? "").toString().trim().toLowerCase();
      if (raw === "deleted") return true;
      return false;
    };

    const normalizeStatus = (row: any) => {
      if (isRowDeleted(row)) return "deleted";
      const raw = (row.status ?? row.visibility ?? "").toString().trim().toLowerCase();
      if (!raw) return "";
      if (raw === "publish" || raw === "published" || raw === "public") return "published";
      if (raw === "private") return "private";
      if (raw === "draft") return "draft";
      if (raw === "deleted") return "deleted";
      return raw;
    };

    const fetchAllPages = async (paramsBase: any) => {
      const perPage = 200;
      const maxPages = 20;
      const all: any[] = [];

      let page = 1;
      let lastPage = 1;
      while (page <= lastPage && page <= maxPages) {
        const res = await getPages({ ...paramsBase, page, per_page: perPage } as any);
        const rows: any[] = Array.isArray((res as any)?.data?.data) ? (res as any).data.data : [];
        const meta = (res as any)?.data?.meta;
        lastPage = Number(meta?.last_page ?? meta?.lastPage ?? 1) || 1;
        all.push(...rows);
        page++;

        // Stop if backend doesn't paginate and returns everything
        if (rows.length < perPage) break;
      }
      return all;
    };

    const fetchAllArticles = async (paramsBase: any) => {
      const perPage = 200;
      const maxPages = 20;
      const all: any[] = [];

      let page = 1;
      let lastPage = 1;
      while (page <= lastPage && page <= maxPages) {
        const payload: any = await getArticles({ ...paramsBase, page, per_page: perPage } as any);
        const rows: any[] = Array.isArray(payload?.data) ? payload.data : [];
        lastPage = Number(payload?.last_page ?? payload?.meta?.last_page ?? 1) || 1;
        all.push(...rows);
        page++;

        if (rows.length < perPage) break;
      }
      return all;
    };

    const fetchAllUsers = async (paramsBase: any) => {
      const perPage = 200;
      const maxPages = 20;
      const all: any[] = [];

      let page = 1;
      let lastPage = 1;
      while (page <= lastPage && page <= maxPages) {
        const payload: any = await getUsers({ ...paramsBase, page, per_page: perPage } as any);
        // getUsers() returns the raw axios payload (commonly { data: { data: [...], meta: {...} } })
        const rows: any[] = Array.isArray(payload?.data?.data)
          ? payload.data.data
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const meta = payload?.meta ?? payload?.data?.meta;
        lastPage = Number(meta?.last_page ?? meta?.lastPage ?? payload?.last_page ?? 1) || 1;
        all.push(...rows);
        page++;

        if (rows.length < perPage) break;
      }
      return all;
    };

    const loadBreakdown = async () => {
      try {
        setBreakdownLoading(true);

        const [pagesRows, pagesDeletedRows, newsRows, newsDeletedRows, userRows] = await Promise.all([
          fetchAllPages({}),
          fetchAllPages({ show_deleted: 1, with_trashed: 1, only_trashed: 1, only_deleted: 1 }).catch(() => []),
          fetchAllArticles({}),
          fetchAllArticles({ show_deleted: 1, with_trashed: 1, only_trashed: 1, only_deleted: 1 }).catch(() => []),
          fetchAllUsers({}),
        ]);

        const pagesCounts = { published: 0, private: 0, draft: 0, deleted: 0 };
        for (const r of pagesRows) {
          const st = normalizeStatus(r);
          if (st === "published") pagesCounts.published++;
          else if (st === "private") pagesCounts.private++;
          else if (st === "draft") pagesCounts.draft++;
          else if (st === "deleted") pagesCounts.deleted++;
        }
        // Prefer deleted-only query if it works; otherwise fall back to deleted seen in the main list.
        const deletedPagesByQuery = pagesDeletedRows.filter(isRowDeleted).length;
        if (deletedPagesByQuery > 0) pagesCounts.deleted = deletedPagesByQuery;

        const newsCounts = { published: 0, private: 0, draft: 0, deleted: 0 };
        for (const r of newsRows) {
          const st = normalizeStatus(r);
          if (st === "published") newsCounts.published++;
          else if (st === "private") newsCounts.private++;
          else if (st === "draft") newsCounts.draft++;
          else if (st === "deleted") newsCounts.deleted++;
        }
        const deletedNewsByQuery = newsDeletedRows.filter(isRowDeleted).length;
        if (deletedNewsByQuery > 0) newsCounts.deleted = deletedNewsByQuery;

        const isUserActive = (u: any) => {
          const statusRaw = (u?.status ?? u?.state ?? u?.user_status ?? "").toString().trim().toLowerCase();
          if (statusRaw === "active") return true;
          if (statusRaw === "inactive" || statusRaw === "disabled") return false;

          const flag = u?.is_active ?? u?.active ?? u?.enabled;
          if (flag === true || flag === 1 || flag === "1") return true;
          if (flag === false || flag === 0 || flag === "0") return false;

          return false;
        };

        const usersCounts = { active: 0, inactive: 0 };
        for (const u of userRows) {
          if (isUserActive(u)) usersCounts.active++;
          else usersCounts.inactive++;
        }

        if (!mounted) return;
        setBreakdown({
          pages: {
            published: pagesCounts.published,
            private: pagesCounts.private,
            draft: pagesCounts.draft,
            deleted: pagesCounts.deleted,
          },
          news: {
            published: newsCounts.published,
            private: newsCounts.private,
            draft: newsCounts.draft,
            deleted: newsCounts.deleted,
          },
          users: {
            active: usersCounts.active,
            inactive: usersCounts.inactive,
          },
        });
      } catch {
        if (!mounted) return;
        setBreakdown({});
      } finally {
        if (!mounted) return;
        setBreakdownLoading(false);
      }
    };

    load();
    loadBreakdown();
    return () => {
      mounted = false;
    };
  }, []);

  const contentStats = useMemo(() => {
    return {
      pages: stats?.pages ?? 0,
      albums: stats?.albums ?? 0,
      news: stats?.news ?? 0,
      users: usersTotal,
    };
  }, [stats, usersTotal]);

  const isBusy = loading || settingsLoading;

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  const logoUrl = settings?.company_logo ? `${apiBase}/storage/${settings.company_logo}` : null;
  const faviconUrl = settings?.website_favicon ? `${apiBase}/storage/${settings.website_favicon}` : null;

  const checklist = useMemo(() => {
    const items = [
      { key: "logo", label: "Logo", ok: !!settings?.company_logo },
      { key: "favicon", label: "Favicon", ok: !!settings?.website_favicon },
      { key: "contact", label: "Contact Email", ok: !!settings?.email },
      { key: "analytics", label: "Analytics", ok: !!settings?.google_analytics },
      { key: "recaptcha", label: "reCAPTCHA", ok: !!settings?.google_recaptcha_sitekey },
      { key: "map", label: "Google Map", ok: !!settings?.google_map },
      { key: "social", label: "Social Links", ok: (socialCount ?? 0) > 0 },
    ];
    const done = items.filter((i) => i.ok).length;
    const total = items.length;
    const pct = total === 0 ? 0 : Math.round((done / total) * 100);
    return { items, done, total, pct };
  }, [settings, socialCount]);

  const ChecklistPill = ({ ok, label }: { ok: boolean; label: string }) => (
    <span className={`badge rounded-pill ${ok ? "text-bg-success" : "text-bg-secondary"}`}>
      <i className={`me-1 fas ${ok ? "fa-check" : "fa-minus"}`} />
      {label}
    </span>
  );

  type ExpandKey = "pages" | "albums" | "news" | "users";
  const [openKey, setOpenKey] = useState<ExpandKey | null>(null);

  const CountPill = ({ label, value, tone }: { label: string; value: number | null | undefined; tone: string }) => {
    if (breakdownLoading) return <span className="cms-skeleton cms-skeleton--pill" aria-hidden="true" />;
    return (
      <span className={`badge rounded-pill ${tone}`}>
        {label}: {value == null ? "—" : value}
      </span>
    );
  };

  const ExpandRow = ({
    k,
    label,
    value,
    icon,
    href,
    children,
  }: {
    k: ExpandKey;
    label: string;
    value: number | null;
    icon: string;
    href: string;
    children: ReactNode;
  }) => {
    const open = openKey === k;

    return (
      <div
        className="rounded-3"
        style={{ background: "rgba(248, 250, 252, 0.75)", border: "1px solid rgba(15, 23, 42, 0.06)" }}
      >
        <button
          type="button"
          className="w-100 d-flex align-items-center justify-content-between py-2 px-2 text-start bg-transparent border-0"
          onClick={() => setOpenKey((prev) => (prev === k ? null : k))}
        >
          <div className="d-flex align-items-center gap-2 text-truncate" style={{ minWidth: 0 }}>
            <i className={`${icon} text-muted`} />
            <span className="text-truncate">{label}</span>
          </div>

          <div className="d-flex align-items-center gap-2">
            {isBusy ? (
              <span className="cms-skeleton cms-skeleton--pill" aria-hidden="true" />
            ) : (
              <span className="badge bg-dark-subtle text-dark">{value == null ? "—" : value}</span>
            )}
            <i
              className="fas fa-chevron-right text-muted"
              aria-hidden="true"
              style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
            />
          </div>
        </button>

        {open && (
          <div className="px-2 pb-2">
            <div className="d-flex flex-wrap gap-2 align-items-center mb-2">
              <Link href={href} className="btn btn-sm btn-outline-primary">
                Open
              </Link>
            </div>
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="card cms-panel shadow-sm border-0">
      <div className="card-header cms-panel__header">
        <div className="d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="cms-panel__badge">
              <i className="fas fa-chart-pie" />
            </span>
            <h4 className="mb-0 cms-panel__title d-flex align-items-center gap-2">
              Website Summary
              <Tooltip text="Overview of your website setup status, content statistics, and quick management actions." />
            </h4>
          </div>
          <Link href="/settings/website" className="text-muted small text-decoration-none">
            Manage
            <Tooltip text="Open website settings such as company info, SEO, analytics, and branding." />
          </Link>
        </div>
      </div>

      <div className="list-group list-group-flush">
        <div className="list-group-item py-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong className="fs-6 text-uppercase text-muted d-flex align-items-center gap-2">
              Setup
              <Tooltip text="Tracks which essential website settings have already been configured." />
            </strong>
            <span className="text-muted small">{isBusy ? "Loading…" : `${checklist.done}/${checklist.total} complete`}</span>
          </div>

          <div className="mb-3">
            <div className="progress" style={{ height: 7, background: "rgba(15, 23, 42, 0.08)" }} aria-label="Setup completion">
              <div className="progress-bar" role="progressbar" style={{ width: `${isBusy ? 35 : checklist.pct}%` }} />
            </div>
            <div className="text-muted small mt-1">{isBusy ? "Checking settings…" : `${checklist.pct}% ready`}</div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            {settingsLoading ? (
              <>
                <span className="cms-skeleton cms-skeleton--pill" aria-hidden="true" />
                <span className="cms-skeleton cms-skeleton--pill" aria-hidden="true" />
                <span className="cms-skeleton cms-skeleton--pill" aria-hidden="true" />
              </>
            ) : (
              checklist.items.map((i) => <ChecklistPill key={i.key} ok={i.ok} label={i.label} />)
            )}
          </div>
        </div>

        <div className="list-group-item py-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <strong className="fs-6 text-uppercase text-muted d-flex align-items-center gap-2">
              Content
              <Tooltip text="Overview of your website content including pages, banner albums, news, and users." />
            </strong>
            <Link href="/pages" className="text-muted small text-decoration-none">
              View all
              <Tooltip text="Open the full content management section." />
            </Link>
          </div>

          <div className="d-grid gap-2">
            <ExpandRow k="pages" label="Pages" value={contentStats.pages} icon="fas fa-layer-group" href="/pages">
              <div className="d-flex flex-wrap gap-2 mb-2">
                <CountPill label="Published" value={breakdown.pages?.published} tone="text-bg-success" />
                <CountPill label="Private" value={breakdown.pages?.private} tone="text-bg-secondary" />
                <CountPill label="Draft" value={breakdown.pages?.draft} tone="text-bg-warning" />
                <CountPill label="Deleted" value={breakdown.pages?.deleted} tone="text-bg-danger" />
              </div>
              <div className="d-grid gap-2">
                <Link href="/pages/create" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-plus me-2" />
                  Create Page
                </Link>
                <Link href="/pages/presets" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-layer-group me-2" />
                  Layout Presets
                </Link>
              </div>
            </ExpandRow>

            <ExpandRow k="albums" label="Banner Albums" value={contentStats.albums} icon="fas fa-images" href="/banners">
              <div className="d-grid gap-2">
                <Link href="/banners/create" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-plus me-2" />
                  Create Album
                </Link>
                <Link href="/banners/home" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-house me-2" />
                  Home Banners
                </Link>
              </div>
            </ExpandRow>

            <ExpandRow k="news" label="News Articles" value={contentStats.news} icon="far fa-newspaper" href="/news">
              <div className="d-flex flex-wrap gap-2 mb-2">
                <CountPill label="Published" value={breakdown.news?.published} tone="text-bg-success" />
                <CountPill label="Private" value={breakdown.news?.private} tone="text-bg-secondary" />
                <CountPill label="Draft" value={breakdown.news?.draft} tone="text-bg-warning" />
                <CountPill label="Deleted" value={breakdown.news?.deleted} tone="text-bg-danger" />
              </div>
              <div className="d-grid gap-2">
                <Link href="/news/create" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-plus me-2" />
                  Create News
                </Link>
                <Link href="/news/category_index" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-tags me-2" />
                  Categories
                </Link>
              </div>
            </ExpandRow>

            <ExpandRow k="users" label="Users" value={contentStats.users} icon="fas fa-users" href="/users">
              <div className="d-flex flex-wrap gap-2 mb-2">
                <CountPill label="Active" value={breakdown.users?.active} tone="text-bg-success" />
                <CountPill label="Inactive" value={breakdown.users?.inactive} tone="text-bg-secondary" />
              </div>
              <div className="d-grid gap-2">
                <Link href="/users/create" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-user-plus me-2" />
                  Create User
                </Link>
                <Link href="/account-management/roles" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-user-shield me-2" />
                  Roles
                </Link>
                <Link href="/account-management/access_rights" className="btn btn-sm btn-outline-secondary">
                  <i className="fas fa-lock me-2" />
                  Access Rights
                </Link>
              </div>
              {usersTotal == null && !settingsLoading && (
                <div className="text-muted small mt-2">Users count unavailable (API did not provide totals).</div>
              )}
            </ExpandRow>
          </div>

          {!isBusy && contentStats.pages === 0 && contentStats.albums === 0 && contentStats.news === 0 && (
            <div className="text-muted small mt-2">No content stats available yet.</div>
          )}
        </div>

      </div>
    </div>
  );
}
