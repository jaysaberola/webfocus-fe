import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug, PublicPage } from "@/services/publicPageService";
import { buildPublicPageHtml, normalizeGrapesPageData } from "@/lib/grapesContent";
import { cleanupPublicPageScripts } from "@/lib/publicPageScripts";
import { stabilizeAboutPage } from "@/lib/stabilizeAboutPage";
import { initHomeBrandMarquee } from "@/lib/initHomeBrandMarquee";
import { useEffect, useRef } from "react";

interface PublicPageViewProps {
  pageData: PublicPage;
  htmlContent: string;
}

export default function PublicPageView({ pageData, htmlContent }: PublicPageViewProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);

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
      suppressHydrationWarning
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
    const pageData = normalizeGrapesPageData(res.data);
    const htmlContent = buildPublicPageHtml(pageData);
    const isGrapesPage =
      pageData?.content_type === "grapes" || Boolean(pageData?.grapes_html);
    // Home keeps the layout banner (MainBanner + domain search); other Grapes pages use their own hero.
    const hideBanner =
      PAGES_WITHOUT_LAYOUT_BANNER.has(slug) || (slug !== "home" && isGrapesPage);

    return {
      props: {
        pageData,
        htmlContent,
        layout: { fullWidth: true, hideBanner },
      },
    };
  } catch {
    return { notFound: true };
  }
}

PublicPageView.Layout = LandingPageLayout;
