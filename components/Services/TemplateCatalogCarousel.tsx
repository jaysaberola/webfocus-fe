import { useEffect, useMemo, useState } from "react";
import type { TemplateGroup, WebsiteTemplate } from "@/lib/servicesCatalog";
import { warmCanvasPreview } from "@/lib/canvasPreviewWarmup";
import {
  TEMPLATE_CAROUSEL_NEXT_ICON,
  TEMPLATE_CAROUSEL_PREV_ICON,
} from "@/lib/templateNav";
import TemplateCatalogImage from "./TemplateCatalogImage";
import styles from "@/styles/services.module.css";

/** How many cards show on each side of the active slide. */
const SIDE_VISIBLE = 1;
const AUTOPLAY_MS = 3800;

type TemplateCatalogCarouselProps = {
  group: TemplateGroup;
  onPreview: (group: TemplateGroup, template: WebsiteTemplate) => void;
  counterLabel?: string;
  /** Prioritize first-page images for LCP (first template group only). */
  priorityImages?: boolean;
};

function wrapOffset(index: number, active: number, total: number) {
  if (total <= 0) return 0;
  let diff = index - active;
  const half = Math.floor(total / 2);
  if (diff > half) diff -= total;
  if (diff < -half) diff += total;
  return diff;
}

function coverTransform(offset: number) {
  const abs = Math.abs(offset);
  const x = offset * 58;
  const scale = Math.max(0.78, 1 - abs * 0.12);
  const rotateY = offset * -10;
  const y = abs * 2;
  return `translate(-50%, -50%) translateX(${x}%) translateY(${y}px) scale(${scale}) rotateY(${rotateY}deg)`;
}

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
  priorityImages = false,
}: TemplateCatalogCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = group.templates.length;

  useEffect(() => {
    setActiveIndex(0);
  }, [group.packageId]);

  useEffect(() => {
    if (total <= 1 || paused) return;
    if (typeof window === "undefined") return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(id);
  }, [total, paused, group.packageId]);

  const slides = useMemo(() => {
    return group.templates.map((template, index) => {
      const offset = wrapOffset(index, activeIndex, total);
      const visible = Math.abs(offset) <= SIDE_VISIBLE;
      return { template, index, offset, visible };
    });
  }, [group.templates, activeIndex, total]);

  useEffect(() => {
    if (typeof window === "undefined" || total <= 1) return;

    const urls: string[] = [];
    for (let step = 1; step <= SIDE_VISIBLE + 1; step += 1) {
      const next = group.templates[(activeIndex + step) % total];
      const prev = group.templates[(activeIndex - step + total) % total];
      if (next?.image) urls.push(next.image);
      if (prev?.image) urls.push(prev.image);
    }

    let cancelled = false;
    const run = () => {
      if (!cancelled) prefetchImages(urls);
    };

    const hasIdleCallback = typeof window.requestIdleCallback === "function";
    const idleId = hasIdleCallback ? window.requestIdleCallback(run, { timeout: 900 }) : null;
    const timeoutId = hasIdleCallback ? null : window.setTimeout(run, 180);

    return () => {
      cancelled = true;
      if (idleId !== null && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [group.templates, activeIndex, total]);

  if (total === 0) return null;

  const goPrev = () => {
    setActiveIndex((current) => (current - 1 + total) % total);
  };

  const goNext = () => {
    setActiveIndex((current) => (current + 1) % total);
  };

  const handleCardActivate = (index: number, template: WebsiteTemplate) => {
    if (index === activeIndex) {
      warmCanvasPreview(template.previewUrl);
      onPreview(group, template);
      return;
    }
    setActiveIndex(index);
    warmCanvasPreview(template.previewUrl);
  };

  return (
    <div className={styles.templateCoverflow}>
      <div
        className={styles.templateCoverflowViewport}
        aria-roledescription="carousel"
        aria-label="Website templates carousel"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
            setPaused(false);
          }
        }}
      >
        <button
          type="button"
          className={`${styles.templateCoverflowNav} ${styles.templateCoverflowNavPrev}`}
          onClick={goPrev}
          aria-label="Previous template"
        >
          <i className={TEMPLATE_CAROUSEL_PREV_ICON} aria-hidden="true" />
        </button>

        <div className={styles.templateCoverflowTrack}>
          {slides.map(({ template, index, offset, visible }) => {
            if (!visible) return null;

            const isActive = offset === 0;
            const abs = Math.abs(offset);

            return (
              <article
                key={template.id}
                className={[
                  styles.templateCoverflowCard,
                  isActive ? styles.templateCoverflowCardActive : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{
                  zIndex: SIDE_VISIBLE + 1 - abs,
                  transform: coverTransform(offset),
                  opacity: isActive ? 1 : Math.max(0.62, 1 - abs * 0.16),
                }}
                data-offset={offset}
              >
                <button
                  type="button"
                  className={styles.templateCoverflowButton}
                  onClick={() => handleCardActivate(index, template)}
                  onPointerEnter={() => warmCanvasPreview(template.previewUrl)}
                  onFocus={() => warmCanvasPreview(template.previewUrl)}
                  aria-label={
                    isActive
                      ? `Preview ${template.label} template`
                      : `Show ${template.label} template`
                  }
                  aria-current={isActive ? "true" : undefined}
                >
                    <TemplateCatalogImage
                      src={template.image}
                      alt={template.alt}
                      priority={priorityImages && (isActive || abs === 1)}
                      showPreviewHint={isActive}
                    />
                  {isActive ? (
                    <div className={styles.templateCoverflowFooter}>
                      <h5>{template.label}</h5>
                      <span>Click to preview</span>
                    </div>
                  ) : null}
                </button>
              </article>
            );
          })}
        </div>

        <button
          type="button"
          className={`${styles.templateCoverflowNav} ${styles.templateCoverflowNavNext}`}
          onClick={goNext}
          aria-label="Next template"
        >
          <i className={TEMPLATE_CAROUSEL_NEXT_ICON} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
