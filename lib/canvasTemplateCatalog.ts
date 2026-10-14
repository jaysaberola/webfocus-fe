export const CANVAS7_TEMPLATE_BASE =
  "https://projects.wsiph2.com/webdirectory/cerebro/webfocusph/template/Package-HTML/Canvas%207%20Files";

export const CANVAS7_THUMBNAIL_BASE = `${CANVAS7_TEMPLATE_BASE}/images/intro/niche/new`;

export const CANVAS7_FONT_STYLESHEET =
  "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=PT+Serif:ital@0;1&family=Source+Sans+Pro:wght@300;400;600;700&family=Roboto:wght@300;400;500;700&family=Playfair+Display:wght@400;700&family=Nunito:wght@900&display=swap";

export const CANVAS7_CANVAS_STYLES = [
  CANVAS7_FONT_STYLESHEET,
  `${CANVAS7_TEMPLATE_BASE}/style.css`,
  `${CANVAS7_TEMPLATE_BASE}/css/font-icons.css`,
  `${CANVAS7_TEMPLATE_BASE}/one-page/css/et-line.css`,
  `${CANVAS7_TEMPLATE_BASE}/css/swiper.css`,
  `${CANVAS7_TEMPLATE_BASE}/one-page/onepage.css`,
  `${CANVAS7_TEMPLATE_BASE}/css/custom.css`,
];

export function getCanvas7DemoUrl(page: string) {
  return `${CANVAS7_TEMPLATE_BASE}/${page}`;
}

/** Same-origin preview that swaps the Canvas wordmark for the WebFocus logo. */
export function getCanvas7BrandedPreviewUrl(previewUrl: string) {
  if (!previewUrl) return previewUrl;
  return `/api/template-preview?url=${encodeURIComponent(previewUrl)}`;
}

export function getCanvas7ThumbnailUrl(fileName: string) {
  return `${CANVAS7_THUMBNAIL_BASE}/${fileName}`;
}

/** Thumbnail or intro image using a path relative to the Canvas 7 package root. */
export function getCanvas7IntroImageUrl(relativePath: string) {
  const normalized = relativePath.replace(/^\//, "");
  return `${CANVAS7_TEMPLATE_BASE}/${normalized}`;
}

export function htmlNeedsCanvas7Assets(html: string) {
  return /data-cms-site-template\s*=\s*["']?1|canvas7-onepage|data-cms-template\s*=\s*["']onepage-/.test(
    String(html || "")
  );
}

export function getCanvas7StylesheetMarkup() {
  return CANVAS7_CANVAS_STYLES.map((href) => `<link rel="stylesheet" href="${href}">`).join("\n");
}

export function getCanvas7PreviewBootstrap() {
  return `<script>document.documentElement.classList.add("stretched");document.body.classList.add("stretched");</script>`;
}

export function openCanvas7TemplatePreview(previewUrl: string) {
  window.open(previewUrl, "_blank", "noopener,noreferrer");
  return true;
}
