import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug, PublicPage } from "@/services/publicPageService";
import { composeContentFromGrapes, extractGrapesParts, normalizeLineEndings } from "@/lib/grapesContent";
import { cleanupPublicPageScripts } from "@/lib/publicPageScripts";
import { stabilizeAboutPage } from "@/lib/stabilizeAboutPage";
import { initHomeBrandMarquee } from "@/lib/initHomeBrandMarquee";
import { useEffect, useMemo, useRef } from "react";

interface PublicPageViewProps {
  pageData: PublicPage;
}

export default function PublicPageView({ pageData }: PublicPageViewProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  const htmlContent = useMemo(() => {
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

  useEffect(() => {
    return () => {
      cleanupPublicPageScripts();
    };
  }, [pageData?.slug]);

  useEffect(() => {
    const slug = String(pageData?.slug || "").toLowerCase();
    if (slug !== "about" && slug !== "about-us") return;

    const root = contentRef.current;
    if (!root) return;

    const run = () => stabilizeAboutPage(root);

    run();
    const t1 = window.setTimeout(run, 0);
    const t2 = window.setTimeout(run, 120);
    const t3 = window.setTimeout(run, 900);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [htmlContent, pageData?.slug]);

  useEffect(() => {
    const slug = String(pageData?.slug || "").toLowerCase();
    if (slug !== "home") return;

    const root = contentRef.current;
    if (!root) return;

    const run = () => initHomeBrandMarquee(root);

    run();
    const t1 = window.setTimeout(run, 0);
    const t2 = window.setTimeout(run, 150);
    const t3 = window.setTimeout(run, 600);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [htmlContent, pageData?.slug]);

  if (!pageData) return <div>Page not found</div>;

  return (
    <div
      ref={contentRef}
      className="public-page-content"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}

const PAGES_WITHOUT_LAYOUT_BANNER = new Set(["about", "about-us", "news", "services"]);

export async function getServerSideProps(context: any) {
  const { page } = context.params;
  const slug = String(page || "").toLowerCase();

  try {
    const res = await getPublicPageBySlug(page);
    const pageData = res.data;
    const isGrapesPage =
      pageData?.content_type === "grapes" || Boolean(pageData?.grapes_html);
    // Home keeps the layout banner (MainBanner + domain search); other Grapes pages use their own hero.
    const hideBanner =
      PAGES_WITHOUT_LAYOUT_BANNER.has(slug) || (slug !== "home" && isGrapesPage);

    return {
      props: {
        pageData,
        layout: { fullWidth: true, hideBanner },
      },
    };
  } catch {
    return { notFound: true };
  }
}

PublicPageView.Layout = LandingPageLayout;
