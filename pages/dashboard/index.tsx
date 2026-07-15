import AdminLayout from "@/components/Layout/AdminLayout";
import WebsiteSummary from "@/components/UI/WebsiteSummary";
import RecentActivity from "@/components/UI/RecentActivity";
import StatsCards from "@/components/UI/StatsCards";
import { useEffect, useRef, useState } from "react";
import { getDashboardStats } from "@/services/dashboardService";
import Link from "next/link";

export default function DashboardIndex() {
  const [stats, setStats] = useState({
    pages: 0,
    albums: 0,
    news: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const summaryRef = useRef<HTMLDivElement | null>(null);
  const [summaryHeight, setSummaryHeight] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getDashboardStats();
        setStats({
          pages: res.data.data.pages_count,
          albums: res.data.data.albums_count,
          news: res.data.data.news_count,
        });
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
        setError("Failed to load dashboard stats.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const el = summaryRef.current;
    if (!el) return;

    const update = () => {
      const next = el.getBoundingClientRect().height;
      if (next > 0) setSummaryHeight(next);
    };

    update();

    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => update());
      ro.observe(el);
      return () => ro.disconnect();
    }

    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [loading, stats.pages, stats.albums, stats.news]);

  return (
    <div className="container-fluid px-4 pt-3">
      <div className="cms-dashboard__header mb-2">
        <div className="d-flex flex-column flex-lg-row gap-3 align-items-lg-center justify-content-between">
          <div>
            <h2 className="cms-dashboard__title mb-1">Welcome, Admin!</h2>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <Link href="/pages/create" className="btn btn-sm btn-primary">
              <i className="fas fa-plus me-2" />
              New Page
            </Link>
            <Link href="/news/create" className="btn btn-sm btn-outline-primary">
              <i className="far fa-newspaper me-2" />
              New News
            </Link>
            <Link href="/files" className="btn btn-sm btn-outline-secondary">
              <i className="fas fa-folder-open me-2" />
              File Manager
            </Link>
            <Link href="/menu" className="btn btn-sm btn-outline-secondary">
              <i className="fas fa-sitemap me-2" />
              Menus
            </Link>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="fas fa-triangle-exclamation me-2" />
            {error}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-light"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      <StatsCards
        pagesCount={stats.pages}
        albumsCount={stats.albums}
        newsCount={stats.news}
        loading={loading}
      />

      <section
        className="row g-3 g-lg-4 mb-4"
        style={summaryHeight ? ({ ["--cms-summary-height" as any]: `${summaryHeight}px` } as React.CSSProperties) : undefined}
      >
        <div className="col-12 col-lg-4">
          <div ref={summaryRef}>
            <WebsiteSummary
              stats={{ pages: stats.pages, albums: stats.albums, news: stats.news }}
              loading={loading}
            />
          </div>
        </div>

        <div
          className="col-12 col-lg-8 cms-dashboard__recent-col"
          style={summaryHeight ? { height: `${summaryHeight}px` } : undefined}
        >
          <RecentActivity />
        </div>
      </section>
    </div>
  );
}

DashboardIndex.Layout = AdminLayout;
