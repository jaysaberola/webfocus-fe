import { useEffect, useMemo, useState } from "react";
import type { TemplateGroup, WebsiteTemplate } from "@/lib/servicesCatalog";
import {
  TEMPLATE_CAROUSEL_NEXT_ICON,
  TEMPLATE_CAROUSEL_PREV_ICON,
  templateSlideClass,
  type TemplateSlideDirection,
} from "@/lib/templateNav";
import { serviceCardGridClass } from "./serviceCardGridClass";
import styles from "@/styles/services.module.css";

const PAGE_SIZE = 3;

type TemplateCatalogCarouselProps = {
  group: TemplateGroup;
  onPreview: (group: TemplateGroup, template: WebsiteTemplate) => void;
  counterLabel?: string;
};

export default function TemplateCatalogCarousel({
  group,
  onPreview,
  counterLabel = "templates",
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
          {visibleTemplates.map((template) => (
            <article key={template.id} className={styles.templateCatalogCard}>
              <button
                type="button"
                className={styles.templateCatalogButton}
                onClick={() => onPreview(group, template)}
                aria-label={`Preview ${template.label} template`}
              >
                <div className={styles.templateCatalogImageWrap}>
                  <img
                    src={template.image}
                    alt={template.alt}
                    width={400}
                    height={260}
                    loading="lazy"
                    decoding="async"
                    className={styles.templateCatalogImage}
                  />
                  <span className={styles.templateCatalogPreview}>Preview</span>
                </div>
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
