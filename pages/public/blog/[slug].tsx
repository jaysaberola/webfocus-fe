import Image from "next/image";
import { blogPosts } from "@/data/blogPosts";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import BlogSidebar from "@/components/blog/BlogSidebar";
import BlogImageSlider from "@/components/blog/BlogImageSlider";

type Props = {
  post: typeof blogPosts[number] | null;
};

export default function BlogDetailPage({ post }: Props) {
  if (!post) {
    return (
      <div className="container p-t-80">
        <h3>Post not found</h3>
      </div>
    );
  }

  return (
    <div className="container-fluid px-4 pt-3">
      <div className="row">

        {/* MAIN CONTENT */}
        <div className="col-md-8 col-lg-9">
          <div className="p-t-80 p-b-124 bo5-r p-r-50 h-full p-r-0-md bo-none-md">

            {/* BLOG CONTENT */}
            <div className="blo4 p-b-63">
              <div className="pic-blo4 hov-img-zoom bo-rad-10 pos-relative">
                <BlogImageSlider
                    images={post.images}
                    alt={post.title}
                />
                <div className="date-blo4 flex-col-c-m">
                  <span className="txt30 m-b-4">{post.day}</span>
                  <span className="txt31">{post.month}</span>
                </div>
              </div>

              <div className="text-blo4 p-t-33">
                <h4 className="p-b-16">{post.title}</h4>

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

                {post.content.split("\n").map((p, i) =>
                  p.trim() ? (
                    <p key={i} className="m-b-15">
                      {p}
                    </p>
                  ) : null
                )}
              </div>
            </div>

            {/* COMMENT FORM (UNCHANGED, AS REQUESTED) */}
            <form className="leave-comment p-t-10">
              <h4 className="txt33 p-b-14">Leave a Comment</h4>
              <p>Your email address will not be published. Required fields are marked *</p>

              <textarea
                className="bo-rad-10 size29 bo2 txt10 p-l-20 p-t-15 m-b-10 m-t-40"
                placeholder="Comment..."
              />

              <div className="size30 bo2 bo-rad-10 m-b-20">
                <input
                  type="text"
                  className="bo-rad-10 sizefull txt10 p-l-20"
                  placeholder="Name *"
                />
              </div>

              <div className="size30 bo2 bo-rad-10 m-b-20">
                <input
                  type="text"
                  className="bo-rad-10 sizefull txt10 p-l-20"
                  placeholder="Email *"
                />
              </div>

              <div className="size30 bo2 bo-rad-10 m-b-30">
                <input
                  type="text"
                  className="bo-rad-10 sizefull txt10 p-l-20"
                  placeholder="Website"
                />
              </div>

              <button
                type="submit"
                className="btn3 flex-c-m size31 txt11 trans-0-4"
              >
                Post Comment
              </button>
            </form>

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

BlogDetailPage.Layout = LandingPageLayout;

export async function getServerSideProps({ params }: any) {
  const post = blogPosts.find((p) => p.slug === params.slug) || null;
  return {
    props: {
      post,
      pageData: {
        title: post?.title ?? "Blog",
      },
    },
  };
}
