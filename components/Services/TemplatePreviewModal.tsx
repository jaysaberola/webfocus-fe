import { useEffect, useState } from "react";
import {
  formatPeso,
  getWebDesignPackageById,
  type TemplateGroup,
  type WebsiteTemplate,
} from "@/lib/servicesCatalog";
import { openCanvas7TemplatePreview } from "@/lib/canvasTemplateCatalog";
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
  const packageInfo = template ? getWebDesignPackageById(template.packageId) : undefined;

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open) setViewport("desktop");
  }, [open, template?.id]);

  useEffect(() => {
    setFrameLoading(true);
  }, [template?.previewUrl]);

  if (!open || !template || !group) return null;

  const templateIndex = group.templates.findIndex((item) => item.id === template.id);
  const showNavigation = Boolean(onNavigate && group.templates.length > 1);

  const viewportWidth =
    viewport === "desktop" ? "100%" : viewport === "tablet" ? "834px" : "390px";

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
        <div
          key={template.id}
          className={`${styles.templatePreviewHeader} ${templateSlideClass(styles, slideDirection)}`}
        >
          <div>
            <p className={styles.templatePreviewKicker}>Canvas 7 · {group.title}</p>
            <h2 id="template-preview-title">{template.label}</h2>
            <p className={styles.templatePreviewSummary}>{template.summary}</p>
          </div>
          <button type="button" className={styles.templatePreviewClose} aria-label="Close preview" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.templatePreviewToolbar}>
          {showNavigation ? (
            <div className={styles.templatePreviewNav}>
              <button
                type="button"
                className={styles.templatePreviewNavBtn}
                onClick={() => onNavigate?.("prev")}
                aria-label="Previous template"
              >
                <i className={TEMPLATE_NAV_PREV_ICON} aria-hidden="true" />
                Previous
              </button>
              <span className={styles.templatePreviewNavCounter}>
                {templateIndex + 1} / {group.templates.length}
              </span>
              <button
                type="button"
                className={styles.templatePreviewNavBtn}
                onClick={() => onNavigate?.("next")}
                aria-label="Next template"
              >
                Next
                <i className={TEMPLATE_NAV_NEXT_ICON} aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div className={styles.templatePreviewDevices} role="tablist" aria-label="Preview device size">
            {DEVICE_OPTIONS.map(({ key, label, icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={viewport === key}
                className={
                  viewport === key
                    ? `${styles.templatePreviewDeviceBtn} ${styles.templatePreviewDeviceBtnActive}`
                    : styles.templatePreviewDeviceBtn
                }
                onClick={() => setViewport(key)}
              >
                <i className={`fa-solid ${icon}`} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <button type="button" className={styles.templatePreviewExternalBtn} onClick={handleOpenNewTab}>
            Open in New Tab
          </button>
        </div>

        <div className={styles.templatePreviewFrameWrap}>
          <div
            key={template.id}
            className={`${styles.templatePreviewFrameShell} ${templateSlideClass(styles, slideDirection)}`}
            style={{ width: viewportWidth }}
          >
            {frameLoading ? (
              <div className={styles.templatePreviewFrameLoading} role="status" aria-live="polite">
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
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={() => setFrameLoading(false)}
            />
          </div>
        </div>

        <div className={styles.templatePreviewFooter}>
          <div>
            <p className={styles.templatePreviewPackageLabel}>Recommended package</p>
            <strong>{packageInfo?.name || group.title}</strong>
            {packageInfo ? <span>{`${formatPeso(packageInfo.price)} one-off`}</span> : null}
          </div>
          <div className={styles.templatePreviewFooterActions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Close
            </button>
            {packageInfo && onContinueSetup ? (
              <button
                type="button"
                className={styles.primaryBtnInline}
                onClick={() => onContinueSetup(packageInfo.name, packageInfo.price)}
              >
                Continue
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
