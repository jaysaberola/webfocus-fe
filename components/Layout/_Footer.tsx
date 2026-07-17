import { useEffect, useMemo, useRef, useState } from "react";
import { getFooter, PublicFooter } from "@/services/publicPageService";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";

function buildFooterHtml(footer: PublicFooter | null) {
  if (!footer) return "";

  const hasGrapesFields = Boolean(footer.grapes_html || footer.grapes_css || footer.grapes_js);
  const isGrapes = footer.content_type === "grapes" || hasGrapesFields;

  if (!isGrapes) return footer.contents || "";

  const parsed = extractGrapesParts(footer.contents || "");
  return composeContentFromGrapes({
    grapes_html: (footer.grapes_html || "").trim() || parsed.grapes_html,
    grapes_css: (footer.grapes_css || "").trim() || parsed.grapes_css,
    grapes_js: (footer.grapes_js || "").trim() || parsed.grapes_js,
  });
}

export default function LandingFooter() {
  const [footer, setFooter] = useState<PublicFooter | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    getFooter()
      .then((res) => setFooter(res.data.data))
      .catch(() => setFooter(null));
  }, []);

  const html = useMemo(() => buildFooterHtml(footer), [footer]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || !html) return;

    const scripts = Array.from(root.querySelectorAll("script"));
    if (!scripts.length) return;

    scripts.forEach((oldScript) => {
      const nextScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        nextScript.setAttribute(attr.name, attr.value);
      });
      nextScript.text = oldScript.textContent || "";
      oldScript.replaceWith(nextScript);
    });
  }, [html]);

  if (!html) return null;

  return (
    <div
      ref={contentRef}
      className="public-site-footer-host"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
