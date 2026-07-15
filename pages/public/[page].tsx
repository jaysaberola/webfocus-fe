import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug, PublicPage } from "@/services/publicPageService";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import { useEffect, useMemo, useRef } from "react";

interface PublicPageViewProps {
  pageData: PublicPage;
}

export default function PublicPageView({ pageData }: PublicPageViewProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  const htmlContent = useMemo(() => {
    const hasGrapesFields = Boolean(pageData?.grapes_html || pageData?.grapes_css || pageData?.grapes_js);
    const isGrapes = pageData?.content_type === "grapes" || hasGrapesFields;

    if (!isGrapes) return pageData?.content || "";

    const parsed = extractGrapesParts(pageData?.content || "");
    const grapesHtml = (pageData?.grapes_html || "").trim() || parsed.grapes_html;
    const grapesCss = (pageData?.grapes_css || "").trim() || parsed.grapes_css;
    const grapesJs = (pageData?.grapes_js || "").trim() || parsed.grapes_js;

    return composeContentFromGrapes({
      grapes_html: grapesHtml,
      grapes_css: grapesCss,
      grapes_js: grapesJs,
    });
  }, [pageData]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root) return;

    const scripts = Array.from(root.querySelectorAll("script"));
    if (!scripts.length) return;

    const win = window as Window & {
      __cmsExecutedScripts?: Set<string>;
      __cmsExecutedInlineScripts?: Set<string>;
      __cmsLoadedScriptSrc?: Set<string>;
    };

    if (!win.__cmsExecutedScripts) {
      win.__cmsExecutedScripts = new Set<string>();
    }
    if (!win.__cmsExecutedInlineScripts) {
      win.__cmsExecutedInlineScripts = new Set<string>();
    }
    if (!win.__cmsLoadedScriptSrc) {
      win.__cmsLoadedScriptSrc = new Set<string>();
    }

    const executionKey = `${pageData?.id ?? "page"}::${htmlContent}`;
    if (win.__cmsExecutedScripts.has(executionKey)) {
      return;
    }
    win.__cmsExecutedScripts.add(executionKey);

    scripts.forEach((oldScript) => {
      const src = oldScript.getAttribute("src") || "";
      const inlineSource = (oldScript.textContent || "").trim();
      const inlineKey = `${pageData?.id ?? "page"}::inline::${inlineSource}`;
      const srcKey = src ? `src::${src}` : "";

      if (srcKey && win.__cmsLoadedScriptSrc?.has(srcKey)) {
        oldScript.parentNode?.removeChild(oldScript);
        return;
      }

      if (!src && inlineSource && win.__cmsExecutedInlineScripts?.has(inlineKey)) {
        oldScript.parentNode?.removeChild(oldScript);
        return;
      }

      const newScript = document.createElement("script");

      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });

      if (inlineSource) {
        newScript.text = `(() => {\n${inlineSource}\n})();`;
      }

      if (srcKey) {
        win.__cmsLoadedScriptSrc?.add(srcKey);
      } else if (inlineSource) {
        win.__cmsExecutedInlineScripts?.add(inlineKey);
      }

      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [htmlContent, pageData?.id]);

  if (!pageData) return <div>Page not found</div>;

  return (
    <div
      ref={contentRef}
      className="public-page-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

export async function getServerSideProps(context: any) {
  const { page } = context.params;

  try {
    const res = await getPublicPageBySlug(page);
    return { props: { pageData: res.data, layout: { fullWidth: true } } };
  } catch {
    return { notFound: true };
  }
}

PublicPageView.Layout = LandingPageLayout;
