export const CANVAS7_TEMPLATE_BASE =
  "https://projects.wsiph2.com/webdirectory/cerebro/webfocusph/template/Package-HTML/Canvas%207%20Files";

export const CANVAS7_THUMBNAIL_BASE = `${CANVAS7_TEMPLATE_BASE}/images/intro/niche/new`;

export function getCanvas7DemoUrl(page: string) {
  return `${CANVAS7_TEMPLATE_BASE}/${page}`;
}

export function getCanvas7ThumbnailUrl(fileName: string) {
  return `${CANVAS7_THUMBNAIL_BASE}/${fileName}`;
}

/** Thumbnail or intro image using a path relative to the Canvas 7 package root. */
export function getCanvas7IntroImageUrl(relativePath: string) {
  const normalized = relativePath.replace(/^\//, "");
  return `${CANVAS7_TEMPLATE_BASE}/${normalized}`;
}

export function openCanvas7TemplatePreview(previewUrl: string) {
  window.open(previewUrl, "_blank", "noopener,noreferrer");
  return true;
}
