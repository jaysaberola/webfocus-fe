import { useEffect, useState } from "react";
import {
  formatPeso,
  getWebDesignPackageById,
  type TemplateGroup,
  type WebsiteTemplate,
} from "@/lib/servicesCatalog";
import { openCanvas7TemplatePreview } from "@/lib/canvasTemplateCatalog";
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
  onAddPackage?: (packageName: string, price: number, detail: string) => void;
};

export default function TemplatePreviewModal({
  open,
  template,
  group,
  onClose,
  onAddPackage,
}: TemplatePreviewModalProps) {
  const [viewport, setViewport] = useState("desktop" as PreviewViewport);
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

  if (!open || !template || !group) return null;

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
        <div className={styles.templatePreviewHeader}>
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
          <div className={styles.templatePreviewFrameShell} style={{ width: viewportWidth }}>
            <iframe
              key={template.previewUrl}
              title={`${template.label} Canvas 7 preview`}
              className={styles.templatePreviewFrame}
              src={template.previewUrl}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
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
            {packageInfo && onAddPackage ? (
              <button
                type="button"
                className={styles.primaryBtnInline}
                onClick={() => onAddPackage(packageInfo.name, packageInfo.price, "Agency Web Design")}
              >
                Add Package to Cart
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
