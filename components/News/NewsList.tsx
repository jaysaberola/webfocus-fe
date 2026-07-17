import FeaturedNewsItem, { NewsCard } from "./NewsItem";
import NewsReveal from "./NewsReveal";
import styles from "@/styles/news.module.css";

type Props = {
  articles: any[];
  showFeatured?: boolean;
};

export default function NewsList({ articles, showFeatured = false }: Props) {
  const featured = showFeatured && articles.length > 0 ? articles[0] : null;
  const rest = showFeatured && articles.length > 1 ? articles.slice(1) : articles;

  if (!articles.length) {
    return (
      <div className={styles.empty}>
        <div className={styles.emptyIcon} aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <h3>No articles found</h3>
        <p>Try adjusting your search or browse all categories.</p>
      </div>
    );
  }

  return (
    <>
      {featured && (
        <NewsReveal>
          <FeaturedNewsItem article={featured} />
        </NewsReveal>
      )}

      <div className={styles.grid}>
        {rest.map((article, index) => (
          <NewsReveal key={article.id} delay={index * 80}>
            <NewsCard article={article} delay={index * 80} />
          </NewsReveal>
        ))}
      </div>
    </>
  );
}
