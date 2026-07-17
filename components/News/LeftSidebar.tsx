import { useRouter } from "next/router";
import { FormEvent, useMemo, useState } from "react";
import styles from "@/styles/news.module.css";

type Props = {
  categories: any[];
  archive: Record<string, { month: number; total: number }[]>;
};

const MONTHS = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function LeftSidebar({ categories, archive }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState((router.query.search as string) || "");
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});

  const activeCategory = (router.query.category as string) || "";
  const activeYear = (router.query.year as string) || "";
  const activeMonth = (router.query.month as string) || "";

  const pushQuery = (params: Record<string, string | undefined>) => {
    const nextQuery = { ...router.query, ...params, page: undefined };

    Object.keys(nextQuery).forEach((key) => {
      if (nextQuery[key] === undefined || nextQuery[key] === "") {
        delete nextQuery[key];
      }
    });

    router.push({ pathname: "/public/news", query: nextQuery });
  };

  const handleSearch = (event?: FormEvent) => {
    event?.preventDefault();
    pushQuery({ search: search.trim() || undefined });
  };

  const archiveYears = useMemo(
    () =>
      Object.entries(archive).sort(
        ([yearA], [yearB]) => Number(yearB) - Number(yearA)
      ),
    [archive]
  );

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarCard}>
        <h3 className={styles.sidebarTitle}>Search articles</h3>
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            className={styles.searchInput}
            type="search"
            placeholder="Search news..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <button type="submit" className={styles.searchBtn} aria-label="Search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </button>
        </form>
      </div>

      {categories.length > 0 && (
        <div className={styles.sidebarCard}>
          <h3 className={styles.sidebarTitle}>Categories</h3>
          <ul className={styles.sidebarList}>
            {categories.map((cat) => {
              const isActive = activeCategory === cat.slug;
              return (
                <li key={cat.id} className={styles.sidebarItem}>
                  <button
                    type="button"
                    className={`${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`}
                    onClick={() => pushQuery({ category: isActive ? undefined : cat.slug })}
                  >
                    <span>{cat.name}</span>
                    <span className={styles.sidebarCount}>{cat.articles_count ?? 0}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {archiveYears.length > 0 && (
        <div className={styles.sidebarCard}>
          <h3 className={styles.sidebarTitle}>Archive</h3>
          {archiveYears.map(([year, months]) => {
            const isOpen = openYears[year] ?? activeYear === year;
            return (
              <div key={year} className={styles.archiveGroup}>
                <button
                  type="button"
                  className={styles.archiveYear}
                  onClick={() =>
                    setOpenYears((prev) => ({ ...prev, [year]: !isOpen }))
                  }
                >
                  <span>{year}</span>
                  <span>{isOpen ? "−" : "+"}</span>
                </button>
                {isOpen && (
                  <ul className={styles.archiveMonths}>
                    {months.map((entry) => {
                      const isActive =
                        activeYear === year && activeMonth === String(entry.month);
                      return (
                        <li key={`${year}-${entry.month}`}>
                          <button
                            type="button"
                            className={styles.archiveMonthBtn}
                            onClick={() =>
                              pushQuery({
                                year,
                                month: isActive ? undefined : String(entry.month),
                              })
                            }
                          >
                            <span>
                              {MONTHS[entry.month]} {year}
                            </span>
                            <span className={styles.sidebarCount}>{entry.total}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}
