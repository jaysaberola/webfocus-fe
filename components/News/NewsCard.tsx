import Link from "next/link";

export default function NewsCard({ article }: any) {
  const date = new Date(article.date);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "short" });
  const year = date.getFullYear();

  return (
    <div className="blo4 p-b-63">
      <div className="pic-blo4 hov-img-zoom bo-rad-10 pos-relative">
        <Link href={`/public/news/${article.slug}`}>
          <img
            src={
              article.thumbnail_url
                ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${article.thumbnail_url}`
                : article.image_url
            }
            alt={article.name}
            loading="lazy"
            decoding="async"
          />
        </Link>

        {/* DATE BADGE */}
        <div className="date-blo4 flex-col-c-m">
          <span className="txt30 m-b-4">{day}</span>
          <span className="txt31">
            {month}, {year}
          </span>
        </div>
      </div>

      <div className="text-blo4 p-t-33">
        <h4 className="p-b-16">
          <Link href={`/public/news/${article.slug}`} className="tit9">
            {article.name}
          </Link>
        </h4>

        <div className="txt32 flex-w p-b-24">
          <span>
            by {article.user?.fname}
            <span className="m-r-6 m-l-4">|</span>
          </span>

          <span>
            {date.toDateString()}
            <span className="m-r-6 m-l-4">|</span>
          </span>

          <span>
            {article.category?.name}
          </span>
        </div>

        <p>{article.teaser}</p>

        <Link
          href={`/public/news/${article.slug}`}
          className="dis-block txt4 m-t-30"
        >
          Continue Reading
          <i className="fa-solid fa-arrow-right-long m-l-10" />
        </Link>
      </div>
    </div>
  );
}
