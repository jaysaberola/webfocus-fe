import Head from "next/head";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { requireAdminPreviewAccess } from "@/lib/adminPreviewAccess";
import { composeContentFromGrapes, extractGrapesParts } from "@/lib/grapesContent";
import { getPageById } from "@/services/pageService";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GetServerSidePropsContext } from "next";

type PreviewPageData = {
  id: number;
  title: string;
  slug?: string;
  content: string;
  content_type?: "tiny" | "grapes";
  grapes_html?: string;
  grapes_css?: string;
  grapes_js?: string;
  album?: any | null;
  status?: string;
};

export default function AdminPagePreview() {
  const router = useRouter();
  const { id } = router.query;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [pageData, setPageData] = useState<PreviewPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const pageId = Number(id);
    if (!Number.isFinite(pageId) || pageId <= 0) {
      setError("Invalid page preview request.");
      setLoading(false);
      return;
    }

    let alive = true;

    getPageById(pageId)
      .then((res) => {
        if (!alive) return;

        const page = res.data || {};
        setPageData({
          id: Number(page.id || pageId),
          title: String(page.name || page.title || page.label || `Page ${pageId}`),
          slug: page.slug ? String(page.slug) : undefined,
          content: String(page.contents || page.content || ""),
          content_type: page.content_type,
          grapes_html: page.grapes_html || undefined,
          grapes_css: page.grapes_css || undefined,
          grapes_js: page.grapes_js || undefined,
          album: page.album || null,
          status: page.status ? String(page.status) : undefined,
        });
        setError(null);
      })
      .catch((err: any) => {
        if (!alive) return;
        const message = err?.response?.data?.message || err?.message || "Unable to load page preview.";
        setError(message);
        setPageData(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [id, router.isReady]);

  const htmlContent = useMemo(() => {
    if (!pageData) return "";

    const hasGrapesFields = Boolean(pageData.grapes_html || pageData.grapes_css || pageData.grapes_js);
    const isGrapes = pageData.content_type === "grapes" || hasGrapesFields;

    if (!isGrapes) return pageData.content || "";

    const parsed = extractGrapesParts(pageData.content || "");
    const grapesHtml = (pageData.grapes_html || "").trim() || parsed.grapes_html;
    const grapesCss = (pageData.grapes_css || "").trim() || parsed.grapes_css;
    const grapesJs = (pageData.grapes_js || "").trim() || parsed.grapes_js;

    return composeContentFromGrapes({
      grapes_html: grapesHtml,
      grapes_css: grapesCss,
      grapes_js: grapesJs,
    });
  }, [pageData]);

  useEffect(() => {
    const root = contentRef.current;
    if (!root || !pageData) return;

    const scripts = Array.from(root.querySelectorAll("script"));
    if (!scripts.length) return;

    const win = window as Window & {
      __cmsExecutedScripts?: Set<string>;
      __cmsExecutedInlineScripts?: Set<string>;
      __cmsLoadedScriptSrc?: Set<string>;
    };

    if (!win.__cmsExecutedScripts) win.__cmsExecutedScripts = new Set<string>();
    if (!win.__cmsExecutedInlineScripts) win.__cmsExecutedInlineScripts = new Set<string>();
    if (!win.__cmsLoadedScriptSrc) win.__cmsLoadedScriptSrc = new Set<string>();

    const executionKey = `${pageData.id}::${htmlContent}`;
    if (win.__cmsExecutedScripts.has(executionKey)) {
      return;
    }
    win.__cmsExecutedScripts.add(executionKey);

    scripts.forEach((oldScript) => {
      const src = oldScript.getAttribute("src") || "";
      const inlineSource = (oldScript.textContent || "").trim();
      const inlineKey = `${pageData.id}::inline::${inlineSource}`;
      const srcKey = src ? `src::${src}` : "";

      if (srcKey && win.__cmsLoadedScriptSrc?.has(srcKey)) {
        oldScript.parentNode?.removeChild(oldScript);
        return;
      }

      if (!src && inlineSource && win.__cmsExecutedInlineScripts?.has(inlineKey)) {
        oldScript.parentNode?.removeChild(oldScript);
        return;
      }

      const nextScript = document.createElement("script");
      Array.from(oldScript.attributes).forEach((attr) => {
        nextScript.setAttribute(attr.name, attr.value);
      });

      if (inlineSource) {
        nextScript.text = `(() => {\n${inlineSource}\n})();`;
      }

      if (srcKey) {
        win.__cmsLoadedScriptSrc?.add(srcKey);
      } else if (inlineSource) {
        win.__cmsExecutedInlineScripts?.add(inlineKey);
      }

      oldScript.parentNode?.replaceChild(nextScript, oldScript);
    });
  }, [htmlContent, pageData]);

  return (
    <LandingPageLayout
      pageData={{
        title: pageData?.title,
        album: pageData?.album || null,
      }}
      layout={{ fullWidth: true }}
    >
      <Head>
        <meta name="robots" content="noindex,nofollow,noarchive" />
        <title>{pageData?.title || "Page Preview"}</title>
      </Head>

      {loading ? (
        <div className="container py-5">
          <div className="text-center text-muted">Loading page preview...</div>
        </div>
      ) : error ? (
        <div className="container py-5">
          <div className="alert alert-danger mb-0">Unable to load page preview.</div>
        </div>
      ) : pageData ? (
        <div
          ref={contentRef}
          className="public-page-content"
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      ) : (
        <div className="container py-5">
          <div className="alert alert-warning mb-0">Page preview is unavailable.</div>
        </div>
      )}
    </LandingPageLayout>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const allowed = await requireAdminPreviewAccess(ctx);
  if (!allowed) {
    return { notFound: true };
  }

  return { props: {} };
}
