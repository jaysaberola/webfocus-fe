export type EditorContentType = "tiny" | "grapes";

export type GrapesParts = {
  grapes_html: string;
  grapes_css: string;
  grapes_js: string;
};

/** Normalize CRLF/CR to LF so SSR and client hydration match on Windows. */
export function normalizeLineEndings(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
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
