import Link from "next/link";

interface StatsCardsProps {
  pagesCount: number;
  albumsCount: number;
  newsCount?: number; // optional for now
  loading?: boolean;
}

export default function StatsCards({
  pagesCount,
  albumsCount,
  newsCount = 0,
  loading = false,
}: StatsCardsProps) {
  const StatValue = ({ value }: { value: number }) => {
    if (!loading) return <span className="cms-stat__value">{value}</span>;
    return <span className="cms-skeleton cms-skeleton--number" aria-hidden="true" />;
  };

  return (
    <section className="cms-stats mb-4">
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <Link href="/pages" className="cms-stat cms-stat--pages" aria-label="Open pages">
            <div className="cms-stat__icon">
              <i className="fas fa-layer-group" />
            </div>
            <div className="cms-stat__meta">
              <div className="cms-stat__label">Total Pages</div>
              <StatValue value={pagesCount} />
            </div>
          </Link>
        </div>

        <div className="col-12 col-md-4">
          <Link href="/banners" className="cms-stat cms-stat--albums" aria-label="Open banner albums">
            <div className="cms-stat__icon">
              <i className="fas fa-images" />
            </div>
            <div className="cms-stat__meta">
              <div className="cms-stat__label">Banner Albums</div>
              <StatValue value={albumsCount} />
            </div>
          </Link>
        </div>

        <div className="col-12 col-md-4">
          <Link href="/news" className="cms-stat cms-stat--news" aria-label="Open news">
            <div className="cms-stat__icon">
              <i className="far fa-newspaper" />
            </div>
            <div className="cms-stat__meta">
              <div className="cms-stat__label">Total News</div>
              <StatValue value={newsCount} />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
