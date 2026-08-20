import { useEffect, useRef, useState } from "react";
import {
  getWebDesignPackageById,
  type TemplateGroup,
  type WebsiteTemplate,
} from "@/lib/servicesCatalog";
import { openCanvas7TemplatePreview } from "@/lib/canvasTemplateCatalog";
import { warmCanvasPreview } from "@/lib/canvasPreviewWarmup";
import {
  TEMPLATE_NAV_NEXT_ICON,
  TEMPLATE_NAV_PREV_ICON,
  templateSlideClass,
  type TemplateSlideDirection,
} from "@/lib/templateNav";
import styles from "@/styles/services.module.css";

type PreviewViewport = "desktop" | "tablet" | "mobile";

const DEVICE_OPTIONS: Array<{ key: PreviewViewport; label: string; icon: string }> = [
  { key: "desktop", label: "Desktop", icon: "fa-desktop" },
  { key: "tablet", label: "Tablet", icon: "fa-tablet-screen-button" },
  { key: "mobile", label: "Mobile", icon: "fa-mobile-screen-button" },
];

type TemplatePreviewModalProps = {
  open: boolean;
  template: WebsiteTemplate | null;
  group: TemplateGroup | null;
  onClose: () => void;
  onContinueSetup?: (packageName: string, price: number) => void;
  onNavigate?: (direction: "prev" | "next") => void;
  slideDirection?: TemplateSlideDirection;
};

export default function TemplatePreviewModal({
  open,
  template,
  group,
  onClose,
  onContinueSetup,
  onNavigate,
  slideDirection = "next",
}: TemplatePreviewModalProps) {
  const [viewport, setViewport] = useState("desktop" as PreviewViewport);
  const [frameLoading, setFrameLoading] = useState(true);
  const [frameScale, setFrameScale] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const packageInfo = template ? getWebDesignPackageById(template.packageId) : undefined;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") onNavigate?.("prev");
      if (event.key === "ArrowRight") onNavigate?.("next");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, onNavigate]);

  useEffect(() => {
    if (open) setViewport("desktop");
  }, [open, template?.id]);

  useEffect(() => {
    setFrameLoading(true);
  }, [template?.previewUrl, viewport]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const designWidth = viewport === "desktop" ? 1440 : viewport === "tablet" ? 834 : 390;

    const update = () => {
      const width = stage.clientWidth || designWidth;
      setFrameScale(Math.min(1, width / designWidth));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [open, viewport, template?.id]);

  useEffect(() => {
    if (!open || !group || !template) return;
    const currentIndex = group.templates.findIndex((item) => item.id === template.id);
    if (currentIndex < 0) return;
    const total = group.templates.length;
    const next = group.templates[(currentIndex + 1) % total];
    const prev = group.templates[(currentIndex - 1 + total) % total];
    if (next) warmCanvasPreview(next.previewUrl);
    if (prev && prev.id !== next?.id) warmCanvasPreview(prev.previewUrl);
  }, [open, group, template]);

  if (!open || !template || !group) return null;

  const templateIndex = group.templates.findIndex((item) => item.id === template.id);
  const showNavigation = Boolean(onNavigate && group.templates.length > 1);
  const designWidth = viewport === "desktop" ? 1440 : viewport === "tablet" ? 834 : 390;

  const handleOpenNewTab = () => {
    openCanvas7TemplatePreview(template.previewUrl);
  };

  return (
    <div className={styles.templatePreviewOverlay} role="presentation">
      <button type="button" className={styles.templatePreviewBackdrop} aria-label="Close preview" onClick={onClose} />
      <div
        className={styles.templatePreviewDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-preview-title"
      >
        <header className={styles.templatePreviewHeader}>
          <div className={styles.templatePreviewTitleBlock}>
            <p className={styles.templatePreviewKicker}>Canvas 7 · {group.title}</p>
            <h2 id="template-preview-title">{template.label}</h2>
          </div>

          <div className={styles.templatePreviewDevices} role="tablist" aria-label="Preview device size">
            {DEVICE_OPTIONS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={viewport === key}
                title={label}
                className={
                  viewport === key
                    ? `${styles.templatePreviewDeviceBtn} ${styles.templatePreviewDeviceBtnActive}`
                    : styles.templatePreviewDeviceBtn
                }
                onClick={() => setViewport(key)}
              >
                <i className={`fa-solid ${icon}`} aria-hidden="true" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className={styles.templatePreviewHeaderActions}>
            <button type="button" className={styles.templatePreviewExternalBtn} onClick={handleOpenNewTab}>
              <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
              Open live site
            </button>
            <button type="button" className={styles.templatePreviewClose} aria-label="Close preview" onClick={onClose}>
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className={styles.templatePreviewStudio}>
          {showNavigation ? (
            <button
              type="button"
              className={`${styles.templatePreviewSideBtn} ${styles.templatePreviewSideBtnPrev}`}
              onClick={() => onNavigate?.("prev")}
              aria-label="Previous template"
            >
              <i className={TEMPLATE_NAV_PREV_ICON} aria-hidden="true" />
            </button>
          ) : null}

          <div className={styles.templatePreviewFrameWrap}>
            <div
              key={`${template.id}-${viewport}`}
              ref={stageRef}
              className={`${styles.templatePreviewFrameShell} ${
                viewport === "tablet"
                  ? styles.templatePreviewFrameShellTablet
                  : viewport === "mobile"
                    ? styles.templatePreviewFrameShellMobile
                    : styles.templatePreviewFrameShellDesktop
              } ${templateSlideClass(styles, slideDirection)}`}
            >
              <div className={styles.templatePreviewChrome} aria-hidden="true">
                <span className={styles.templatePreviewChromeDots}>
                  <i />
                  <i />
                  <i />
                </span>
                <span className={styles.templatePreviewChromeUrl}>
                  preview.webfocus / {template.label.toLowerCase().replace(/\s+/g, "-")}
                </span>
              </div>
              <div className={styles.templatePreviewStage}>
                {frameLoading ? (
                  <div className={styles.templatePreviewFrameLoading} role="status" aria-live="polite">
                    {template.image ? (
                      <img
                        src={template.image}
                        alt=""
                        className={styles.templatePreviewPoster}
                        width={1200}
                        height={780}
                        decoding="async"
                      />
                    ) : null}
                    <span className={styles.templatePreviewFrameSpinner} aria-hidden="true" />
                    <span>Loading live preview…</span>
                  </div>
                ) : null}
                <iframe
                  key={template.previewUrl}
                  title={`${template.label} Canvas 7 preview`}
                  className={`${styles.templatePreviewFrame} ${
                    frameLoading ? styles.templatePreviewFrameHidden : ""
                  }`}
                  src={template.previewUrl}
                  loading="eager"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
                  style={{
                    width: designWidth,
                    height: frameScale > 0 ? `calc(100% / ${frameScale})` : "100%",
                    transform: `scale(${frameScale})`,
                  }}
                  onLoad={() => setFrameLoading(false)}
                />
              </div>
            </div>
          </div>

          {showNavigation ? (
            <button
              type="button"
              className={`${styles.templatePreviewSideBtn} ${styles.templatePreviewSideBtnNext}`}
              onClick={() => onNavigate?.("next")}
              aria-label="Next template"
            >
              <i className={TEMPLATE_NAV_NEXT_ICON} aria-hidden="true" />
            </button>
          ) : null}

          {showNavigation ? (
            <p className={styles.templatePreviewCounter}>
              {templateIndex + 1} <span>/</span> {group.templates.length}
            </p>
          ) : null}
        </div>

        <footer className={styles.templatePreviewFooter}>
          <div className={styles.templatePreviewPackage}>
            <p className={styles.templatePreviewPackageLabel}>Recommended package</p>
            <div className={styles.templatePreviewPackageRow}>
              <strong>{packageInfo?.name || group.title}</strong>
              <span className={styles.templatePreviewQuoteBadge}>Pending Quotation</span>
            </div>
            {template.summary ? (
              <p className={styles.templatePreviewSummary}>{template.summary}</p>
            ) : null}
          </div>
          <div className={styles.templatePreviewFooterActions}>
            <button type="button" className={styles.templatePreviewGhostBtn} onClick={onClose}>
              Close
            </button>
            {packageInfo && onContinueSetup ? (
              <button
                type="button"
                className={styles.templatePreviewContinueBtn}
                onClick={() => onContinueSetup(packageInfo.name, packageInfo.price)}
              >
                Continue with this template
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  );
}
