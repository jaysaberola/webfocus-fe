import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { blogPosts } from "@/data/blogPosts";

/* ======================
   DERIVED DATA
====================== */

// categories from posts
const categories = Array.from(
  new Set(
    blogPosts.flatMap((post) =>
      post.categories.split(",").map((c) => c.trim())
    )
  )
);

// popular posts (top 5 by comments)
const popularPosts = [...blogPosts]
  .sort((a, b) => b.comments - a.comments)
  .slice(0, 5);

// archive grouped by month/year
const archives = blogPosts.reduce<Record<string, number>>((acc, post) => {
  const key = `${post.month} ${post.fullDate.split(" ").pop()}`;
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

export default function BlogSidebar() {
  const router = useRouter();
  const view = typeof router.query.view === "string" ? router.query.view : undefined;

  const onSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = (e.currentTarget.search as HTMLInputElement).value;
    if (!value) return;

    const viewSuffix = view ? `&view=${encodeURIComponent(view)}` : "";
    router.push(`/public/blog?search=${encodeURIComponent(value)}${viewSuffix}`);
  };

  return (
    <div className="sidebar2 p-t-80 p-b-80 p-l-20 p-l-0-md p-t-0-md">

      {/* SEARCH */}
      <form
        onSubmit={onSearch}
        className="search-sidebar2 size12 bo2 pos-relative"
      >
        <input
          name="search"
          className="input-search-sidebar2 txt10 p-l-20 p-r-55"
          placeholder="Search"
        />
        <button className="btn-search-sidebar2 flex-c-m ti-search trans-0-4" />
      </form>

      {/* CATEGORIES */}
      <div className="categories">
        <h4 className="txt33 bo5-b p-b-35 p-t-58">Categories</h4>
        <ul>
          {categories.map((cat) => (
            <li key={cat} className="bo5-b p-t-8 p-b-8">
              <Link
                href={{
                  pathname: "/public/blog",
                  query: {
                    category: cat,
                    ...(view ? { view } : {}),
                  },
                }}
                className="txt27"
                style={{ textDecoration: "none" }}
              >
                {cat}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* MOST POPULAR */}
      <div className="popular">
        <h4 className="txt33 p-b-35 p-t-58">Most popular</h4>
        <ul>
          {popularPosts.map((post) => (
            <li key={post.id} className="flex-w m-b-25">
              <div
                className="size16 bo-rad-10 wrap-pic-w of-hidden m-r-18"
                style={{ position: "relative" }}
              >
                <Link href={`/public/blog/${post.slug}`} style={{ textDecoration: "none" }}>
                  <Image
                    src={`/images/${post.images[0]}`}
                    alt={post.title}
                    fill
                    sizes="70px"
                    style={{ objectFit: "cover", objectPosition: "center" }}
                  />
                </Link>
              </div>

              <div className="size28">
                <Link
                  href={`/public/blog/${post.slug}`}
                  className="dis-block txt28 m-b-8"
                  style={{ textDecoration: "none" }}
                >
                  {post.title}
                </Link>
                <span className="txt14">{post.fullDate}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* ARCHIVE */}
      <div className="archive">
        <h4 className="txt33 p-b-20 p-t-43">Archive</h4>
        <ul>
          {Object.entries(archives).map(([month, count]) => (
            <li key={month} className="flex-sb-m p-t-8 p-b-8">
              <Link
                href={{
                  pathname: "/public/blog",
                  query: {
                    month,
                    ...(view ? { view } : {}),
                  },
                }}
                className="txt27"
                style={{ textDecoration: "none" }}
              >
                {month}
              </Link>
              <span className="txt29">({count})</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
