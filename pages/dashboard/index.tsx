import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getDashboardStatsCached } from "@/lib/dashboardStatsCache";

const WebsiteSummary = dynamic(() => import("@/components/UI/WebsiteSummary"), {
  loading: () => (
    <div className="card cms-panel shadow-sm border-0 cms-panel--compact h-100">
      <div className="card-body p-4">
        <div className="cms-skeleton cms-skeleton--line mb-2" aria-hidden="true" />
        <div className="cms-skeleton cms-skeleton--line" aria-hidden="true" style={{ maxWidth: "70%" }} />
      </div>
    </div>
  ),
});

const RecentActivity = dynamic(() => import("@/components/UI/RecentActivity"), {
  loading: () => (
    <div className="card cms-panel shadow-sm border-0 cms-panel--compact h-100">
      <div className="card-body p-4">
        <div className="cms-skeleton cms-skeleton--line mb-2" aria-hidden="true" />
        <div className="cms-skeleton cms-skeleton--line" aria-hidden="true" style={{ maxWidth: "55%" }} />
      </div>
    </div>
  ),
});

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function formatToday() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default function DashboardIndex() {
  const [stats, setStats] = useState({ pages: 0, albums: 0, news: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [todayLabel, setTodayLabel] = useState("");

  useEffect(() => {
    setGreeting(getGreeting());
    setTodayLabel(formatToday());
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchStats = async () => {
      try {
        setError(null);
        const data = await getDashboardStatsCached();
        if (!mounted) return;
        setStats({
          pages: data.pages_count,
          albums: data.albums_count,
          news: data.news_count,
        });
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
        if (!mounted) return;
        setError("Failed to load dashboard stats.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchStats();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="cms-dashboard cms-dashboard--fit">
      <header className="cms-dashboard__hero cms-dashboard__hero--compact">
        <div className="cms-dashboard__hero-inner">
          <div className="cms-dashboard__hero-top">
            <div>
              <p className="cms-dashboard__kicker mb-1">Dashboard</p>
              <h1 className="cms-dashboard__title mb-1">{greeting}, Admin</h1>
              <p className="cms-dashboard__subtitle mb-0">{todayLabel || "\u00A0"}</p>
            </div>
            <div className="cms-dashboard__actions">
              <Link href="/pages/create" className="btn btn-sm btn-light">
                <i className="fas fa-plus me-1" /> New Page
              </Link>
              <Link href="/news/create" className="btn btn-sm btn-outline-light">
                <i className="far fa-newspaper me-1" /> News
              </Link>
              <Link href="/files" className="btn btn-sm btn-outline-light">
                <i className="fas fa-folder-open me-1" /> Files
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="cms-dashboard__metrics" aria-label="Content overview">
        <Link href="/pages" className="cms-metric-card cms-metric-card--pages">
          <span className="cms-metric-card__icon"><i className="fas fa-layer-group" /></span>
          <span className="cms-metric-card__body">
            <span className="cms-metric-card__label">Pages</span>
            <strong className="cms-metric-card__value">{loading ? "—" : stats.pages}</strong>
            <span className="cms-metric-card__hint">Manage site pages</span>
          </span>
          <i className="fas fa-arrow-right cms-metric-card__arrow" />
        </Link>
        <Link href="/banners" className="cms-metric-card cms-metric-card--albums">
          <span className="cms-metric-card__icon"><i className="fas fa-images" /></span>
          <span className="cms-metric-card__body">
            <span className="cms-metric-card__label">Albums</span>
            <strong className="cms-metric-card__value">{loading ? "—" : stats.albums}</strong>
            <span className="cms-metric-card__hint">Banner galleries</span>
          </span>
          <i className="fas fa-arrow-right cms-metric-card__arrow" />
        </Link>
        <Link href="/news" className="cms-metric-card cms-metric-card--news">
          <span className="cms-metric-card__icon"><i className="far fa-newspaper" /></span>
          <span className="cms-metric-card__body">
            <span className="cms-metric-card__label">News</span>
            <strong className="cms-metric-card__value">{loading ? "—" : stats.news}</strong>
            <span className="cms-metric-card__hint">Articles & updates</span>
          </span>
          <i className="fas fa-arrow-right cms-metric-card__arrow" />
        </Link>
      </section>

      <section className="cms-dashboard__quicklinks" aria-label="Quick links">
        <Link href="/pages/create" className="cms-quicklink">
          <i className="fas fa-wand-magic-sparkles" />
          <span>Visual page builder</span>
          <i className="fas fa-chevron-right cms-quicklink__chevron" />
        </Link>
        <Link href="/settings/website" className="cms-quicklink">
          <i className="fas fa-sliders" />
          <span>Website settings</span>
          <i className="fas fa-chevron-right cms-quicklink__chevron" />
        </Link>
        <Link href="/menu" className="cms-quicklink">
          <i className="fas fa-bars-staggered" />
          <span>Navigation menu</span>
          <i className="fas fa-chevron-right cms-quicklink__chevron" />
        </Link>
        <Link href="/users" className="cms-quicklink">
          <i className="fas fa-users" />
          <span>Team & users</span>
          <i className="fas fa-chevron-right cms-quicklink__chevron" />
        </Link>
      </section>

      {error && (
        <div className="alert alert-danger py-2 px-3 mb-0 cms-dashboard__alert" role="alert">
          <i className="fas fa-triangle-exclamation me-2" />
          {error}
        </div>
      )}

      <section className="cms-dashboard__grid">
        <WebsiteSummary
          stats={{ pages: stats.pages, albums: stats.albums, news: stats.news }}
          loading={loading}
          compact
        />
        <RecentActivity compact />
      </section>
    </div>
  );
}

DashboardIndex.Layout = AdminLayout;
