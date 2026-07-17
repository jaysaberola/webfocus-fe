import Link from "next/link";
import { useMemo, useState } from "react";
import NewsReveal from "@/components/News/NewsReveal";
import {
  estimateReadingTime,
  formatArticleDate,
  getArticleHeroFallback,
  getArticleImageCandidates,
  getAuthorInitials,
  getAuthorName,
  getCategoryStyle,
} from "@/lib/articleDisplay";
import styles from "@/styles/news.module.css";

type Props = {
  article: {
    name: string;
    teaser?: string | null;
    contents?: string | null;
    date?: string | null;
    slug?: string;
    thumbnail_url?: string | null;
    image_url?: string | null;
    category?: { id?: number; name?: string; slug?: string } | null;
    user?: { fname?: string; lname?: string; name?: string } | null;
  };
  backHref?: string;
  backLabel?: string;
  previewBanner?: React.ReactNode;
};

export default function NewsArticleView({
  article,
  backHref = "/public/news",
  backLabel = "Back to News",
  previewBanner,
}: Props) {
  const categoryStyle = getCategoryStyle(article.category);
  const imageCandidates = useMemo(() => getArticleImageCandidates(article), [article]);
  const fallbackImage = getArticleHeroFallback(article.category);
  const [imageIndex, setImageIndex] = useState(0);

  const imageSrc =
    imageCandidates[imageIndex] ||
    fallbackImage;

  const readingTime = estimateReadingTime(article.contents);
  const usingFallback = imageIndex >= imageCandidates.length || !imageCandidates.length;

  const handleImageError = () => {
    if (imageIndex < imageCandidates.length - 1) {
      setImageIndex((value) => value + 1);
      return;
    }
    if (imageSrc !== fallbackImage) {
      setImageIndex(imageCandidates.length);
    }
  };

  return (
    <article className={styles.detailPage}>
      <div className={styles.detailContainer}>
        {previewBanner}

        <NewsReveal immediate>
          <nav className={styles.detailNav} aria-label="Article navigation">
            <Link href={backHref} className={styles.backButton}>
              <span className={styles.backButtonIcon} aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </span>
              <span className={styles.backButtonCopy}>
                <span className={styles.backButtonLabel}>Return to</span>
                <span className={styles.backButtonTitle}>{backLabel.replace(/^Back to /i, "") || "News"}</span>
              </span>
            </Link>
          </nav>
        </NewsReveal>

        <NewsReveal immediate delay={40}>
          <div className={styles.detailArticleCard}>
            <header className={styles.detailMasthead}>
              <div className={styles.detailMastheadTop}>
                {article.category?.name && (
                  <span
                    className={styles.detailCategory}
                    style={{ background: categoryStyle.bg, color: categoryStyle.text }}
                  >
                    {article.category.name}
                  </span>
                )}
                <span className={styles.detailReadingTime}>{readingTime} min read</span>
              </div>

              <h1 className={styles.detailTitle}>{article.name}</h1>

              {article.teaser && <p className={styles.detailLead}>{article.teaser}</p>}
            </header>

            <figure className={`${styles.detailHeroImage} ${usingFallback ? styles.detailHeroFallback : ""}`}>
              <img src={imageSrc} alt={article.name} onError={handleImageError} />
              {usingFallback && article.category?.name && (
                <figcaption className={styles.detailHeroCaption}>{article.category.name}</figcaption>
              )}
            </figure>

            <div className={styles.detailBylineBar}>
              <div className={styles.detailAuthor}>
                <span
                  className={styles.detailAuthorAvatar}
                  style={{ background: `linear-gradient(135deg, ${categoryStyle.accent}, #004b93)` }}
                >
                  {getAuthorInitials(article.user)}
                </span>
                <div>
                  <strong>{getAuthorName(article.user)}</strong>
                  <span>{formatArticleDate(article.date)}</span>
                </div>
              </div>
            </div>

            <div
              className={styles.detailBody}
              dangerouslySetInnerHTML={{ __html: article.contents || "" }}
            />
          </div>
        </NewsReveal>

        <NewsReveal delay={120}>
          <footer className={styles.detailEnd}>
            <div className={styles.detailEndCard}>
              <span className={styles.detailEndLabel}>WebFocus Newsroom</span>
              <p>Stay updated with company releases, technical guides, and industry insights.</p>
              <Link href={backHref} className={styles.detailEndBtn}>
                Browse all articles
              </Link>
            </div>
          </footer>
        </NewsReveal>
      </div>
    </article>
  );
}