import Link from "next/link";
import { useRouter } from "next/router";
import styles from "@/styles/news.module.css";

type PaginationMeta = {
  current_page: number;
  last_page: number;
  total: number;
};

type Props = {
  pagination: PaginationMeta;
};

export default function NewsPagination({ pagination }: Props) {
  const router = useRouter();

  if (!pagination || pagination.last_page <= 1) return null;

  const { current_page, last_page } = pagination;

  const buildHref = (page: number) => {
    const query = { ...router.query, page: String(page) };
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value == null || value === "") return;
      params.set(key, String(value));
    });

    const qs = params.toString();
    return qs ? `/public/news?${qs}` : "/public/news";
  };

  const pages: number[] = [];
  const start = Math.max(1, current_page - 2);
  const end = Math.min(last_page, current_page + 2);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return (
    <nav className={styles.pagination} aria-label="News pagination">
      <Link
        href={buildHref(Math.max(1, current_page - 1))}
        className={`${styles.pageBtn} ${current_page <= 1 ? styles.pageBtnDisabled : ""}`}
        aria-disabled={current_page <= 1}
      >
        Prev
      </Link>

      {pages.map((page) => (
        <Link
          key={page}
          href={buildHref(page)}
          className={`${styles.pageBtn} ${page === current_page ? styles.pageBtnActive : ""}`}
          aria-current={page === current_page ? "page" : undefined}
        >
          {page}
        </Link>
      ))}

      <Link
        href={buildHref(Math.min(last_page, current_page + 1))}
        className={`${styles.pageBtn} ${current_page >= last_page ? styles.pageBtnDisabled : ""}`}
        aria-disabled={current_page >= last_page}
      >
        Next
      </Link>
    </nav>
  );
}
