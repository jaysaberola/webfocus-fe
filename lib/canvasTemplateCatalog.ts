export const CANVAS7_TEMPLATE_BASE =
  "https://projects.wsiph2.com/webdirectory/cerebro/webfocusph/template/Package-HTML/Canvas%207%20Files";

export const CANVAS7_THUMBNAIL_BASE = `${CANVAS7_TEMPLATE_BASE}/images/intro/niche/new`;

export function getCanvas7DemoUrl(page: string) {
  return `${CANVAS7_TEMPLATE_BASE}/${page}`;
}

export function getCanvas7ThumbnailUrl(fileName: string) {
  return `${CANVAS7_THUMBNAIL_BASE}/${fileName}`;
}

export function openCanvas7TemplatePreview(previewUrl: string) {
  window.open(previewUrl, "_blank", "noopener,noreferrer");
  return true;
}
