import Link from "next/link";
import Image from "next/image";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import BlogSidebar from "@/components/blog/BlogSidebar";
import { blogPosts } from "@/data/blogPosts";
import BlogImageSlider from "@/components/blog/BlogImageSlider";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { getPublicPageBySlug } from "@/services/publicPageService";

type Props = {
  posts: typeof blogPosts;
  currentPage: number;
  totalPages: number;
  viewMode: "grid" | "list";
};

export default function BlogPage({ posts, currentPage, totalPages, viewMode: initialViewMode }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode || "list");

  useEffect(() => {
    setViewMode(initialViewMode || "list");
  }, [initialViewMode]);

  const setMode = (mode: "grid" | "list") => {
    setViewMode(mode);
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          view: mode,
        },
      },
      undefined,
      { shallow: true }
    );
  };

  return (
    <div className="container-fluid px-4 pt-3">
      <div className="row">

        {/* MAIN CONTENT */}
        <div className="col-md-8 col-lg-9">
          <div className="p-t-80 p-b-124 bo5-r h-full p-r-50 p-r-0-md bo-none-md">

            <div
              className="p-b-50 d-flex align-items-start justify-content-between flex-wrap"
              style={{ gap: 12 }}
            >
              <div>
                <h3 className="txt33">Blog</h3>
                <p className="txt14 m-t-10" style={{ marginBottom: 0 }}>
                  Explore our latest posts
                </p>
              </div>

              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <span className="txt27" style={{ margin: 0 }}>
                  View
                </span>
                <div className="btn-group" role="group" aria-label="Blog view mode">
                  <button
                    type="button"
                    onClick={() => setMode("grid")}
                    className={`btn btn-sm ${viewMode === "grid" ? "btn-secondary" : "btn-outline-secondary"}`}
                    aria-pressed={viewMode === "grid"}
                    title="Grid view"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="3" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="12" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("list")}
                    className={`btn btn-sm ${viewMode === "list" ? "btn-secondary" : "btn-outline-secondary"}`}
                    aria-pressed={viewMode === "list"}
                    title="List view"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "grid" ? (
              <div className="row">
                {posts.map((post) => (
                  <div key={post.id} className="col-sm-6 col-lg-6 p-b-40">
                    <Link
                      href={`/public/blog/${post.slug}`}
                      className="dis-block"
                      style={{ textDecoration: "none", height: "100%" }}
                    >
                      <div
                        className="blo4 bo-rad-10 of-hidden"
                        style={{ width: "100%", display: "flex", flexDirection: "column", height: "100%" }}
                      >
                        <div
                          className="hov-img-zoom"
                          style={{ aspectRatio: "4 / 3", width: "100%", overflow: "hidden", position: "relative" }}
                        >
                          <Image
                            src={`/images/${post.images?.[0] || "blog-01.jpg"}`}
                            alt={post.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 50vw"
                            style={{ objectFit: "cover", objectPosition: "center" }}
                          />
                          <div className="date-blo4 flex-col-c-m">
                            <span className="txt30 m-b-4">{post.day}</span>
                            <span className="txt31">{post.month}</span>
                          </div>
                        </div>

                        <div className="p-20" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <h4 className="p-b-10" style={{ marginTop: 8 }}>
                            <span className="tit9">{post.title}</span>
                          </h4>

                          <div className="txt32 flex-w p-b-10">
                            <span>
                              by {post.author}
                              <span className="m-r-6 m-l-4">|</span>
                            </span>
                            <span>
                              {post.fullDate}
                              <span className="m-r-6 m-l-4">|</span>
                            </span>
                            <span>{post.comments} Comments</span>
                          </div>

                          <p
                            className="txt14"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {post.excerpt}
                          </p>

                          <span className="txt4 m-t-15 color0-hov" style={{ marginTop: "auto" }}>
                            Continue Reading →
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="blo4 p-b-63">
                  <div className="pic-blo4 hov-img-zoom bo-rad-10 pos-relative">

                    {/* SINGLE LINK ONLY */}
                    <Link href={`/public/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                      <BlogImageSlider images={post.images} alt={post.title} />
                    </Link>

                    <div className="date-blo4 flex-col-c-m">
                      <span className="txt30 m-b-4">{post.day}</span>
                      <span className="txt31">{post.month}</span>
                    </div>
                  </div>

                  <div className="text-blo4 p-t-33">
                    <h4 className="p-b-16">
                      <Link
                        href={`/public/blog/${post.slug}`}
                        className="tit9"
                        style={{ textDecoration: "none" }}
                      >
                        {post.title}
                      </Link>
                    </h4>

                    <div className="txt32 flex-w p-b-24">
                      <span>
                        by {post.author}
                        <span className="m-r-6 m-l-4">|</span>
                      </span>
                      <span>
                        {post.fullDate}
                        <span className="m-r-6 m-l-4">|</span>
                      </span>
                      <span>
                        {post.categories}
                        <span className="m-r-6 m-l-4">|</span>
                      </span>
                      <span>{post.comments} Comments</span>
                    </div>

                    <p>{post.excerpt}</p>

                    <Link
                      href={`/public/blog/${post.slug}`}
                      className="dis-block txt4 m-t-30"
                      style={{ textDecoration: "none" }}
                    >
                      Continue Reading
                      <i className="fa-solid fa-arrow-right-long m-l-10" />
                    </Link>
                  </div>
                </div>
              ))
            )}

            {/* PAGINATION */}
            <div className="pagination flex-l-m flex-w m-l--6 p-t-25">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                const view = viewMode === "grid" ? "grid" : "list";
                return (
                  <Link
                    key={page}
                    href={`/public/blog?page=${page}&view=${view}`}
                    className={`item-pagination flex-c-m trans-0-4 ${
                      page === currentPage ? "active-pagination" : ""
                    }`}
                    style={{ textDecoration: "none" }}
                  >
                    {page}
                  </Link>
                );
              })}
            </div>

          </div>
        </div>

        {/* SIDEBAR */}
        <div className="col-md-4 col-lg-3">
          <BlogSidebar />
        </div>

      </div>
    </div>
  );
}

BlogPage.Layout = LandingPageLayout;

export async function getServerSideProps({ query }: any) {
  const PER_PAGE = 2;
  const viewMode = query.view === "grid" ? "grid" : "list";

  let filteredPosts = [...blogPosts];

  // SEARCH
  if (query.search) {
    const keyword = query.search.toLowerCase();
    filteredPosts = filteredPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(keyword) ||
        post.excerpt.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword)
    );
  }

  // CATEGORY
  if (query.category) {
    filteredPosts = filteredPosts.filter((post) =>
      post.categories.includes(query.category)
    );
  }

  // ARCHIVE
  if (query.month) {
    filteredPosts = filteredPosts.filter((post) =>
      `${post.month} ${post.fullDate.split(" ").pop()}` === query.month
    );
  }

  // PAGINATION
  const currentPage = Number(query.page) || 1;
  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  const paginatedPosts = filteredPosts.slice(start, end);
  const totalPages = Math.ceil(filteredPosts.length / PER_PAGE);

  const res = await getPublicPageBySlug("blog");

  return {
    props: {
      posts: paginatedPosts,
      currentPage,
      totalPages,
      viewMode,
      pageData: res.data
    },
  };
}