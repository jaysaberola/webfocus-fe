export type EditorContentType = "tiny" | "grapes";

export type GrapesParts = {
  grapes_html: string;
  grapes_css: string;
  grapes_js: string;
};

type GrapesPageLike = {
  content?: string | null;
  content_type?: string | null;
  grapes_html?: string | null;
  grapes_css?: string | null;
  grapes_js?: string | null;
};

/** Normalize CRLF/CR to LF so SSR and client hydration match on Windows. */
export function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function normalizeGrapesPageData<T extends GrapesPageLike>(page: T): T {
  return {
    ...page,
    content: normalizeLineEndings(page.content || ""),
    grapes_html: normalizeLineEndings(page.grapes_html || ""),
    grapes_css: normalizeLineEndings(page.grapes_css || ""),
    grapes_js: normalizeLineEndings(page.grapes_js || ""),
  };
}

export function buildPublicPageHtml(pageData: GrapesPageLike): string {
  const hasGrapesFields = Boolean(pageData?.grapes_html || pageData?.grapes_css || pageData?.grapes_js);
  const isGrapes = pageData?.content_type === "grapes" || hasGrapesFields;

  if (!isGrapes) return normalizeLineEndings(pageData?.content || "");

  const parsed = extractGrapesParts(pageData?.content || "");
  const grapesHtml = normalizeLineEndings((pageData?.grapes_html || "").trim() || parsed.grapes_html);
  const grapesCss = normalizeLineEndings((pageData?.grapes_css || "").trim() || parsed.grapes_css);
  const grapesJs = normalizeLineEndings((pageData?.grapes_js || "").trim() || parsed.grapes_js);

  return composeContentFromGrapes({
    grapes_html: grapesHtml,
    grapes_css: grapesCss,
    grapes_js: grapesJs,
  });
}

export const extractGrapesParts = (content: string): GrapesParts => {
  const raw = normalizeLineEndings(content || "");

  const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = raw.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  const grapes_css = (styleMatch?.[1] || "").trim();
  const grapes_js = (scriptMatch?.[1] || "").trim();

  let grapes_html = raw;
  if (styleMatch?.[0]) {
    grapes_html = grapes_html.replace(styleMatch[0], "");
  }
  if (scriptMatch?.[0]) {
    grapes_html = grapes_html.replace(scriptMatch[0], "");
  }

  return {
    grapes_html: grapes_html.trim(),
    grapes_css,
    grapes_js,
  };
};

export const composeContentFromGrapes = (parts: Partial<GrapesParts>) => {
  const html = normalizeLineEndings((parts.grapes_html || "").trim());
  const css = normalizeLineEndings((parts.grapes_css || "").trim());
  const js = normalizeLineEndings((parts.grapes_js || "").trim());

  const cssTag = css ? `\n<style>${css}</style>` : "";
  const jsTag = js ? `\n<script>${js}</script>` : "";

  return normalizeLineEndings(`${html}${cssTag}${jsTag}`.trim());
};
