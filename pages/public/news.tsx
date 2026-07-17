import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import LeftSidebar from "@/components/News/LeftSidebar";
import NewsList from "@/components/News/NewsList";
import NewsPagination from "@/components/News/NewsPagination";
import { getPublicArticles, getCategories, getArchive } from "@/services/articleService";
import { getPublicPageBySlug } from "@/services/publicPageService";
import styles from "@/styles/news.module.css";

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

type Props = {
  pageData: any;
  articles: any[];
  pagination: {
    current_page: number;
    last_page: number;
    total: number;
  };
  categories: any[];
  archives: Record<string, { month: number; total: number }[]>;
  filters: {
    search?: string;
    category?: string;
    year?: string;
    month?: string;
  };
};

export default function NewsPage({
  articles,
  pagination,
  categories,
  archives,
  filters,
}: Props) {
  const router = useRouter();
  const hasFilters = Boolean(
    filters.search || filters.category || filters.year || filters.month
  );
  const showFeatured = !hasFilters && pagination.current_page === 1;

  const activeCategoryName = categories.find((cat) => cat.slug === filters.category)?.name;

  const clearFilters = () => {
    router.push("/public/news");
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.pageHead}>
          <p className={styles.pageEyebrow}>WebFocus Solutions, Inc.</p>
          <h1 className={styles.pageTitle}>News &amp; Updates</h1>
          <p className={styles.pageLead}>
            Hosting advisories, product launches, and company stories from our Philippine operations
            team.
          </p>
        </header>

        {hasFilters && (
          <div className={styles.filtersBar}>
            <span className={styles.filtersLabel}>Filtered by:</span>
            {filters.search && (
              <button type="button" className={styles.filterChip} onClick={clearFilters}>
                Search: {filters.search} ×
              </button>
            )}
            {filters.category && activeCategoryName && (
              <button type="button" className={styles.filterChip} onClick={clearFilters}>
                {activeCategoryName} ×
              </button>
            )}
            {filters.year && (
              <button type="button" className={styles.filterChip} onClick={clearFilters}>
                {filters.month
                  ? `${MONTHS[Number(filters.month)]} ${filters.year}`
                  : filters.year}{" "}
                ×
              </button>
            )}
            <button type="button" className={styles.clearFilters} onClick={clearFilters}>
              Clear all
            </button>
          </div>
        )}

        <div className={styles.layout}>
          <div className={styles.main}>
            <NewsList articles={articles} showFeatured={showFeatured} />
            <NewsPagination pagination={pagination} />
          </div>

          <LeftSidebar categories={categories} archive={archives} />
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ query }: any) {
  try {
    const page = Math.max(1, Number(query.page) || 1);
    const filters = {
      search: (query.search as string) || undefined,
      category: (query.category as string) || undefined,
      year: (query.year as string) || undefined,
      month: (query.month as string) || undefined,
    };

    const [pageRes, articlesRes, categoriesRes, archiveRes] = await Promise.all([
      getPublicPageBySlug("news"),
      getPublicArticles({
        ...filters,
        page,
        per_page: 9,
      }),
      getCategories(),
      getArchive(),
    ]);

    const articlesPayload = articlesRes.data;

    return {
      props: {
        pageData: {
          ...pageRes.data,
          slug: "news",
        },
        layout: { fullWidth: true, hideBanner: true },
        articles: articlesPayload.data ?? [],
        pagination: {
          current_page: articlesPayload.current_page ?? 1,
          last_page: articlesPayload.last_page ?? 1,
          total: articlesPayload.total ?? 0,
        },
        categories: categoriesRes.data ?? [],
        archives: archiveRes.data ?? {},
        filters: {
          search: filters.search || "",
          category: filters.category || "",
          year: filters.year || "",
          month: filters.month || "",
        },
      },
    };
  } catch (error: any) {
    console.error("NEWS SSR ERROR:", error?.response?.data || error);
    return {
      props: {
        pageData: { slug: "news", title: "News" },
        layout: { fullWidth: true, hideBanner: true },
        articles: [],
        pagination: { current_page: 1, last_page: 1, total: 0 },
        categories: [],
        archives: {},
        filters: {},
      },
    };
  }
}

NewsPage.Layout = LandingPageLayout;
