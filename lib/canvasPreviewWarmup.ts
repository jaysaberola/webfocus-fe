const warmed = new Set<string>();
const MAX_WARM_FRAMES = 2;
const warmFrames: HTMLIFrameElement[] = [];

/** Preload a Canvas 7 demo in a hidden iframe so Preview opens from cache. */
export function warmCanvasPreview(url: string) {
  if (typeof document === "undefined" || !url || warmed.has(url)) return;
  warmed.add(url);

  while (warmFrames.length >= MAX_WARM_FRAMES) {
    const oldest = warmFrames.shift();
    oldest?.remove();
  }

  const iframe = document.createElement("iframe");
  iframe.src = url;
  iframe.title = "Template preview warmup";
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.loading = "eager";
  iframe.sandbox = "allow-scripts allow-same-origin allow-forms";
  iframe.style.cssText =
    "position:absolute;width:0;height:0;border:0;opacity:0;pointer-events:none;left:-9999px;top:0";

  document.body.appendChild(iframe);
  warmFrames.push(iframe);
}

export function ensureCanvasOriginHints() {
  if (typeof document === "undefined") return;

  const origin = "https://projects.wsiph2.com";
  const ensure = (rel: string, attrs: Record<string, string>) => {
    const selector = `link[rel="${rel}"][href="${origin}"]`;
    if (document.head.querySelector(selector)) return;
    const link = document.createElement("link");
    link.rel = rel;
    link.href = origin;
    Object.entries(attrs).forEach(([key, value]) => {
      link.setAttribute(key, value);
    });
    document.head.appendChild(link);
  };

  ensure("dns-prefetch", {});
  ensure("preconnect", { crossorigin: "" });
}

export function preloadTemplateImages(urls: string[]) {
  if (typeof document === "undefined") return;

  urls.forEach((url) => {
    if (!url) return;
    const existing = document.head.querySelector(`link[rel="preload"][as="image"][href="${url}"]`);
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
  });
}
