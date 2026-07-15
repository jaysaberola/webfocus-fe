import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug } from "@/services/publicPageService";
import { getPublicArticles, getCategories, getArchive } from "@/services/articleService";
import LeftSidebar from "@/components/News/LeftSidebar";
import NewsList from "@/components/News/NewsList";

type Props = {
  pageData: any;
  articles: any[];
  categories: any[];
  archives: Record<string, { month: number; total: number }[]>;
};

export default function NewsPage({ articles, categories, archives }: Props) {
  return (
    <div className="container">
      <div className="row">
        {/* MAIN CONTENT */}
        <div className="col-md-8 col-lg-9">
          <NewsList articles={articles} />
        </div>

        {/* SIDEBAR */}
        <div className="col-md-4 col-lg-3">
          <div className="sidebar2 p-t-80 p-b-80 p-l-20 p-l-0-md p-t-0-md">
            <LeftSidebar categories={categories} archive={archives} />
          </div>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps({ query }: any) {
  try {
    const [pageRes, articlesRes, categoriesRes, archiveRes] =
      await Promise.all([
        getPublicPageBySlug("news"),
        getPublicArticles({
          search: query.search || null,
          category: query.category || null,
          year: query.year || null,
          month: query.month || null,
        }),
        getCategories(),
        getArchive(),
      ]);

    return {
      props: {
        pageData: pageRes.data,
        articles: articlesRes.data.data ?? [],
        categories: categoriesRes.data ?? [],
        archives: archiveRes.data ?? {},
      },
    };
  } catch (error: any) {
    console.error("NEWS SSR ERROR:", error?.response?.data || error);
    return {
      props: {
        pageData: null,
        articles: [],
        categories: [],
        archives: {},
      },
    };
  }
}

NewsPage.Layout = LandingPageLayout;
