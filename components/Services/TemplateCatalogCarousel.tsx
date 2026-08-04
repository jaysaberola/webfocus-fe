import { useEffect, useMemo, useState } from "react";
import type { TemplateGroup, WebsiteTemplate } from "@/lib/servicesCatalog";
import {
  TEMPLATE_CAROUSEL_NEXT_ICON,
  TEMPLATE_CAROUSEL_PREV_ICON,
  templateSlideClass,
  type TemplateSlideDirection,
} from "@/lib/templateNav";
import { serviceCardGridClass } from "./serviceCardGridClass";
import TemplateCatalogImage from "./TemplateCatalogImage";
import styles from "@/styles/services.module.css";

const PAGE_SIZE = 3;

type TemplateCatalogCarouselProps = {
  group: TemplateGroup;
  onPreview: (group: TemplateGroup, template: WebsiteTemplate) => void;
  counterLabel?: string;
  /** Prioritize first-page images for LCP (first template group only). */
  priorityImages?: boolean;
};

function prefetchImages(urls: string[]) {
  if (typeof window === "undefined") return;
  urls.forEach((url) => {
    if (!url) return;
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  });
}

export default function TemplateCatalogCarousel({
  group,
  onPreview,
  counterLabel = "templates",
  priorityImages = false,
}: TemplateCatalogCarouselProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState<TemplateSlideDirection>("next");
  const total = group.templates.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    setPageIndex(0);
    setSlideDirection("next");
  }, [group.packageId]);

  const visibleTemplates = useMemo(
    () => group.templates.slice(pageIndex * PAGE_SIZE, pageIndex * PAGE_SIZE + PAGE_SIZE),
    [group.templates, pageIndex]
  );

  // Warm the next carousel page so pagination feels instant.
  useEffect(() => {
    if (typeof window === "undefined" || total <= PAGE_SIZE) return;

    const nextPage = (pageIndex + 1) % pageCount;
    const urls = group.templates
      .slice(nextPage * PAGE_SIZE, nextPage * PAGE_SIZE + PAGE_SIZE)
      .map((template) => template.image);

    let cancelled = false;
    const run = () => {
      if (!cancelled) prefetchImages(urls);
    };

    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const idleId = hasIdleCallback ? window.requestIdleCallback(run, { timeout: 1200 }) : null;
    const timeoutId = hasIdleCallback ? null : window.setTimeout(run, 250);

    return () => {
      cancelled = true;
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [group.templates, pageIndex, pageCount, total]);

  if (total === 0) return null;

  const rangeStart = pageIndex * PAGE_SIZE + 1;
  const rangeEnd = Math.min((pageIndex + 1) * PAGE_SIZE, total);

  const goPrev = () => {
    setSlideDirection("prev");
    setPageIndex((current) => (current - 1 + pageCount) % pageCount);
  };

  const goNext = () => {
    setSlideDirection("next");
    setPageIndex((current) => (current + 1) % pageCount);
  };

  return (
    <div className={styles.templateCatalogCarousel}>
      <div className={styles.templateCatalogCarouselStage}>
        <button
          type="button"
          className={styles.templateCatalogCarouselNav}
          onClick={goPrev}
          aria-label="Previous templates"
        >
          <i className={TEMPLATE_CAROUSEL_PREV_ICON} aria-hidden="true" />
        </button>

        <div
          key={pageIndex}
          className={`${serviceCardGridClass(PAGE_SIZE)} ${templateSlideClass(styles, slideDirection)}`}
        >
          {visibleTemplates.map((template, index) => (
            <article key={template.id} className={styles.templateCatalogCard}>
              <button
                type="button"
                className={styles.templateCatalogButton}
                onClick={() => onPreview(group, template)}
                aria-label={`Preview ${template.label} template`}
              >
                <TemplateCatalogImage
                  src={template.image}
                  alt={template.alt}
                  priority={priorityImages && pageIndex === 0 && index < 2}
                />
                <div className={styles.templateCatalogFooter}>
                  <h5>{template.label}</h5>
                </div>
              </button>
            </article>
          ))}
        </div>

        <button
          type="button"
          className={styles.templateCatalogCarouselNav}
          onClick={goNext}
          aria-label="Next templates"
        >
          <i className={TEMPLATE_CAROUSEL_NEXT_ICON} aria-hidden="true" />
        </button>
      </div>

      <p className={styles.templateCatalogCarouselCounter}>
        {rangeStart}–{rangeEnd} of {total} {counterLabel}
      </p>
    </div>
  );
}
