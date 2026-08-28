import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicFooter } from "@/services/publicPageService";
import { getFooterCached, useStoredPublicFooter } from "@/lib/publicFooterCache";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import { rewritePublicHtmlHrefs } from "@/lib/publicMenuLinks";
import { activateCmsPageAnimations } from "@/lib/publicPageScripts";

function buildFooterHtml(footer: PublicFooter | null) {
  if (!footer) return "";

  const hasGrapesFields = Boolean(footer.grapes_html || footer.grapes_css || footer.grapes_js);
  const isGrapes = footer.content_type === "grapes" || hasGrapesFields;

  let html = "";
  if (!isGrapes) {
    html = footer.contents || "";
  } else {
    const parsed = extractGrapesParts(footer.contents || "");
    html = composeContentFromGrapes({
      grapes_html: (footer.grapes_html || "").trim() || parsed.grapes_html,
      grapes_css: (footer.grapes_css || "").trim() || parsed.grapes_css,
      grapes_js: (footer.grapes_js || "").trim() || parsed.grapes_js,
    });
  }

  return rewritePublicHtmlHrefs(html);
}

export default function LandingFooter() {
  const cachedFooter = useStoredPublicFooter();
  const [fetchedFooter, setFetchedFooter] = useState<PublicFooter | null>(null);
  const footer = fetchedFooter ?? cachedFooter;
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let alive = true;

    getFooterCached()
      .then((data) => {
        if (alive && data) setFetchedFooter(data);
      })
      .catch(() => {
        if (!alive) return;
      });

    return () => {
      alive = false;
    };
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

  useEffect(() => {
    return activateCmsPageAnimations(contentRef.current);
  }, [html]);

  if (!html) {
    return <footer className="public-site-footer-host public-site-footer-host--placeholder" aria-hidden="true" />;
  }

  return (
    <footer className="public-site-footer-host">
      <div ref={contentRef} dangerouslySetInnerHTML={{ __html: html }} />
    </footer>
  );
}
