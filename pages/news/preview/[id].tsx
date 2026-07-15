import Head from "next/head";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { requireAdminPreviewAccess } from "@/lib/adminPreviewAccess";
import { getArticle } from "@/services/articleService";
import { getMenuById } from "@/services/menuService";
import { articleToAlbum } from "@/schemas/articleToAlbum";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import type { GetServerSidePropsContext } from "next";

type PreviewArticle = {
  id: number;
  name: string;
  teaser?: string;
  contents?: string;
  date?: string;
  status?: string;
  meta_title?: string;
  meta_description?: string;
  user?: { name?: string } | null;
  category?: { name?: string } | null;
  image_url?: string | null;
  thumbnail_url?: string | null;
};

const renderMenuItems = (items: any[]): string => {
  if (!Array.isArray(items) || !items.length) return "";

  let html = '<ul class="cms-menu">';
  for (const item of items) {
    const label = item.title || item.name || item.label || item.text || "Untitled";
    const href = item.url || item.link || item.path || (item.page ? `/pages/${item.page.slug || item.page.id}` : "#");
    const openInNewTabValue =
      item?.openInNewTab ??
      item?.open_in_new_tab ??
      item?.newTab ??
      item?.targetBlank ??
      item?.target_blank ??
      item?.targetAttr ??
      item?.target_attr;
    const openInNewTab =
      openInNewTabValue === true ||
      openInNewTabValue === 1 ||
      ["true", "1", "yes", "_blank"].includes(String(openInNewTabValue ?? "").trim().toLowerCase()) ||
      /^https?:\/\//i.test(String(href || ""));
    const targetAttrs = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
    html += `<li><a href="${href}"${targetAttrs}>${label}</a>`;

    const children = item.children || item.items || item.child || [];
    if (Array.isArray(children) && children.length) {
      html += renderMenuItems(children);
    }

    html += "</li>";
  }
  html += "</ul>";

  return html;
};

const resolveMenuPlaceholders = async (contents: string) => {
  let nextContents = contents || "";
  const matches = Array.from(nextContents.matchAll(/<!--\s*CMS_MENU:(\d+)\s*-->/g));
  const menuIds = [...new Set(matches.map((m) => Number((m as RegExpMatchArray)[1])))] as number[];

  for (const menuId of menuIds) {
    try {
      const response: any = await getMenuById(menuId);
      const menu = response?.data?.data ?? response?.data ?? null;
      if (!menu) continue;

      const menuHtml = `<nav class="cms-menu-root"><h4>${menu.name || "Menu"}</h4>${renderMenuItems(Array.isArray(menu.items) ? menu.items : [])}</nav>`;
      const token = new RegExp(`<!--\\s*CMS_MENU:${menuId}\\s*-->`, "g");
      nextContents = nextContents.replace(token, menuHtml);
    } catch {
      // ignore failed menu fetches in preview mode
    }
  }

  return nextContents;
};

export default function AdminNewsPreview() {
  const router = useRouter();
  const { id } = router.query;
  const [article, setArticle] = useState<PreviewArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!router.isReady || !id) return;

    const articleId = Number(id);
    if (!Number.isFinite(articleId) || articleId <= 0) {
      setError("Invalid news preview request.");
      setLoading(false);
      return;
    }

    let alive = true;

    (async () => {
      try {
        const data = await getArticle(articleId);
        const resolvedContents = await resolveMenuPlaceholders(String(data?.contents || ""));
        if (!alive) return;

        setArticle({
          ...data,
          id: Number(data?.id || articleId),
          name: String(data?.name || data?.title || `News ${articleId}`),
          contents: resolvedContents,
        });
        setError(null);
      } catch (err: any) {
        if (!alive) return;
        const message = err?.response?.data?.message || err?.message || "Unable to load news preview.";
        setError(message);
        setArticle(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [id, router.isReady]);

  return (
    <LandingPageLayout
      pageData={{
        title: article?.name,
        album: article ? articleToAlbum(article) : null,
      }}
      layout={{ fullWidth: true }}
    >
      <Head>
        <title>{article?.meta_title || article?.name || "News Preview"}</title>
        <meta name="description" content={article?.meta_description || article?.teaser || ""} />
        <meta name="robots" content="noindex,nofollow,noarchive" />
      </Head>

      {loading ? (
        <div className="container py-5">
          <div className="text-center text-muted">Loading news preview...</div>
        </div>
      ) : error ? (
        <div className="container py-5">
          <div className="alert alert-danger mb-0">Unable to load news preview.</div>
        </div>
      ) : article ? (
        <div className="container-fluid px-4 pt-3">
          <h1 className="fw-bold text-primary mb-2">{article.name}</h1>

          <div className="text-muted small mb-4">
            {article.date ? <>Posted on {article.date}</> : null}
            {article.date && article.user?.name ? <> &nbsp;|&nbsp; </> : null}
            {article.user?.name ? <>By {article.user.name}</> : null}
            {(article.date || article.user?.name) && article.category?.name ? <> &nbsp;|&nbsp; </> : null}
            {article.category?.name ? article.category.name : null}
          </div>

          {(article.thumbnail_url || article.image_url) && (
            <div className="mb-5 text-center">
              <img
                src={
                  article.thumbnail_url
                    ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.thumbnail_url}`
                    : `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.image_url}`
                }
                alt={article.name}
                className="img-fluid rounded"
                style={{ maxWidth: "500px" }}
              />
            </div>
          )}

          <div className="article-content" dangerouslySetInnerHTML={{ __html: article.contents || "" }} />
        </div>
      ) : (
        <div className="container py-5">
          <div className="alert alert-warning mb-0">News preview is unavailable.</div>
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
