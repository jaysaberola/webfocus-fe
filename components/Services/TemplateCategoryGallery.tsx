import { useEffect, useMemo, useRef, useState } from "react";
import type { TemplateGroup, WebsiteTemplate, WebsiteTemplateCategory } from "@/lib/servicesCatalog";
import {
  getWebsiteTemplateCategory,
  WEBSITE_TEMPLATE_CATEGORIES,
} from "@/lib/servicesCatalog";
import { warmCanvasPreview } from "@/lib/canvasPreviewWarmup";
import {
  TEMPLATE_CAROUSEL_NEXT_ICON,
  TEMPLATE_CAROUSEL_PREV_ICON,
} from "@/lib/templateNav";
import TemplateCatalogImage from "./TemplateCatalogImage";
import styles from "@/styles/services.module.css";

type Props = {
  group: TemplateGroup;
  onPreview: (group: TemplateGroup, template: WebsiteTemplate) => void;
  priorityImages?: boolean;
};

function useVisibleCount() {
  const [count, setCount] = useState(3);

  useEffect(() => {
    const update = () => {
      if (window.matchMedia("(max-width: 560px)").matches) setCount(1);
      else if (window.matchMedia("(max-width: 900px)").matches) setCount(2);
      else setCount(3);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return count;
}

function LiveTemplateThumb({
  template,
  enabled,
  priority,
}: {
  template: WebsiteTemplate;
  enabled: boolean;
  priority?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.35);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    const update = () => {
      const width = el.clientWidth || 1;
      const height = el.clientHeight || 1;
      setScale(Math.max(width / 1440, height / 900));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setReady(false);
  }, [template.previewUrl]);

  return (
    <div ref={wrapRef} className={styles.templateLiveThumb}>
      <TemplateCatalogImage
        src={template.image}
        alt={template.alt}
        priority={priority}
        showPreviewHint={false}
      />
      {enabled ? (
        <iframe
          className={`${styles.templateLiveFrame} ${ready ? styles.templateLiveFrameReady : ""}`}
          src={template.previewUrl}
          title={`${template.label} live preview`}
          tabIndex={-1}
          aria-hidden
          loading={priority ? "eager" : "lazy"}
          sandbox="allow-scripts allow-same-origin allow-forms"
          style={{ transform: `scale(${scale})` }}
          onLoad={() => setReady(true)}
        />
      ) : null}
    </div>
  );
}

export default function TemplateCategoryGallery({ group, onPreview, priorityImages = false }: Props) {
  const [category, setCategory] = useState<"all" | WebsiteTemplateCategory>("all");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const visibleCount = useVisibleCount();

  const filtered = useMemo(() => {
    if (category === "all") return group.templates;
    return group.templates.filter((template) => getWebsiteTemplateCategory(template) === category);
  }, [category, group.templates]);

  const filteredGroup = useMemo(
    () => ({ ...group, templates: filtered }),
    [filtered, group]
  );

  const maxIndex = Math.max(0, filtered.length - visibleCount);
  const canSlide = filtered.length > visibleCount;

  useEffect(() => {
    setIndex(0);
  }, [category, visibleCount]);

  useEffect(() => {
    setIndex((current) => Math.min(current, maxIndex));
  }, [maxIndex]);

  useEffect(() => {
    if (!canSlide || paused) return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = window.setInterval(() => {
      setIndex((current) => (current >= maxIndex ? 0 : current + 1));
    }, 4000);

    return () => window.clearInterval(id);
  }, [canSlide, paused, maxIndex, category]);

  const goPrev = () => {
    setIndex((current) => (current <= 0 ? maxIndex : current - 1));
  };

  const goNext = () => {
    setIndex((current) => (current >= maxIndex ? 0 : current + 1));
  };

  return (
    <div className={styles.templateGallery}>
      <nav className={styles.templateGalleryNav} aria-label="Website template categories">
        {WEBSITE_TEMPLATE_CATEGORIES.map((item) => {
          const isActive = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={isActive ? styles.templateGalleryTabActive : styles.templateGalleryTab}
              aria-pressed={isActive}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {filtered.length === 0 ? (
        <p className={styles.templateGalleryEmpty}>No templates in this category yet.</p>
      ) : (
        <div
          className={styles.templateGalleryViewport}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {canSlide ? (
            <button
              type="button"
              className={`${styles.templateGalleryNavBtn} ${styles.templateGalleryNavPrev}`}
              onClick={goPrev}
              aria-label="Previous templates"
            >
              <i className={TEMPLATE_CAROUSEL_PREV_ICON} aria-hidden="true" />
            </button>
          ) : null}

          <div className={styles.templateGalleryWindow}>
            <div
              className={
                canSlide ? styles.templateGalleryTrack : styles.templateGalleryTrackCenter
              }
              style={{
                transform: `translateX(calc(-${index} * (100% / ${visibleCount})))`,
              }}
              role="list"
            >
              {filtered.map((template, templateIndex) => (
                <article key={template.id} className={styles.templateGallerySlide} role="listitem">
                  <div className={styles.templateGalleryCard}>
                    <button
                      type="button"
                      className={styles.templateGalleryCardBtn}
                      onClick={() => {
                        warmCanvasPreview(template.previewUrl);
                        onPreview(filteredGroup, template);
                      }}
                      onPointerEnter={() => warmCanvasPreview(template.previewUrl)}
                      aria-label={`Preview ${template.label} template`}
                    >
                      <LiveTemplateThumb
                        template={template}
                        enabled={templateIndex >= index && templateIndex < index + visibleCount + 1}
                        priority={priorityImages && templateIndex < visibleCount}
                      />
                      <span className={styles.templateGalleryPreviewHint}>Preview</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {canSlide ? (
            <button
              type="button"
              className={`${styles.templateGalleryNavBtn} ${styles.templateGalleryNavNext}`}
              onClick={goNext}
              aria-label="Next templates"
            >
              <i className={TEMPLATE_CAROUSEL_NEXT_ICON} aria-hidden="true" />
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
