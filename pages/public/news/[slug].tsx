import Head from "next/head";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getArticleBySlug } from "@/services/articleService";
import { getMenuById } from "@/services/menuService";
import { articleToAlbum } from "@/schemas/articleToAlbum";

type Props = {
  pageData: any;
  article: any;
};

export default function NewsDetailPage({ article }: Props) {
  return (
    <>
      <Head>
        <title>{article.meta_title || article.name}</title>
        <meta
          name="description"
          content={article.meta_description || article.teaser}
        />
      </Head>

      <div className="container-fluid px-4 pt-3">
        {/* TITLE */}
        <h1 className="fw-bold text-primary mb-2">
          {article.name}
        </h1>

        {/* META */}
        <div className="text-muted small mb-4">
          Posted on {article.date}
          {article.user?.name && <> &nbsp;|&nbsp; By {article.user.name}</>}
          {article.category?.name && <> &nbsp;|&nbsp; {article.category.name}</>}
        </div>

        {/* FEATURED IMAGE */}
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


        {/* CONTENT */}
        <div
          className="article-content"
          dangerouslySetInnerHTML={{ __html: article.contents }}
        />
      </div>
    </>
  );
}

export async function getServerSideProps({ params }: any) {
  try {
    const res = await getArticleBySlug(params.slug);

    // Replace any CMS_MENU placeholders with rendered menu HTML
    let article = res.data;
    let contents = article.contents || "";

    const matches = Array.from(contents.matchAll(/<!--\s*CMS_MENU:(\d+)\s*-->/g));
    const menuIds = [...new Set(matches.map((m) => Number((m as RegExpMatchArray)[1])))] as number[];

    for (const mid of menuIds) {
      try {
        const mres: any = await getMenuById(mid);
        const menu = mres?.data?.data ?? mres?.data ?? null;
        if (!menu) continue;

        const renderItems = (items: any[]): string => {
          if (!Array.isArray(items) || !items.length) return "";
          let html = "<ul class=\"cms-menu\">";
          for (const it of items) {
            const label = it.title || it.name || it.label || it.text || "Untitled";
            const href = it.url || it.link || it.path || (it.page ? `/pages/${it.page.slug || it.page.id}` : "#");
            const openInNewTabValue =
              it?.openInNewTab ??
              it?.open_in_new_tab ??
              it?.newTab ??
              it?.targetBlank ??
              it?.target_blank ??
              it?.targetAttr ??
              it?.target_attr;
            const openInNewTab =
              openInNewTabValue === true ||
              openInNewTabValue === 1 ||
              ["true", "1", "yes", "_blank"].includes(String(openInNewTabValue ?? "").trim().toLowerCase()) ||
              /^https?:\/\//i.test(String(href || ""));
            const targetAttrs = openInNewTab ? ' target="_blank" rel="noopener noreferrer"' : "";
            html += `<li><a href=\"${href}\"${targetAttrs}>${label}</a>`;
            const children = it.children || it.items || it.child || [];
            if (Array.isArray(children) && children.length) {
              html += renderItems(children);
            }
            html += `</li>`;
          }
          html += "</ul>";
          return html;
        };

        const menuHtml = `<nav class=\"cms-menu-root\"><h4>${menu.name || "Menu"}</h4>${renderItems(Array.isArray(menu.items) ? menu.items : [])}</nav>`;

        const token = new RegExp(`<!--\\s*CMS_MENU:${mid}\\s*-->`, "g");
        contents = contents.replace(token, menuHtml);
      } catch (err) {
        // ignore failed menu fetches
      }
    }

    article = { ...article, contents };

    return {
      props: {
        pageData: {
          title: res.data.name,
          album: articleToAlbum(res.data),
        },
        article,
      },
    };
  } catch {
    return { notFound: true };
  }
}

NewsDetailPage.Layout = LandingPageLayout;
