import NewsCard from "./NewsCard";

export default function NewsFeed({ articles }: any) {
  return (
    <div className="p-t-80 p-b-124 bo5-r h-full p-r-50 p-r-0-md bo-none-md">
      {articles.length === 0 ? (
        <div className="text-center txt32 p-t-50">
          No news available.
        </div>
      ) : (
        articles.map((article: any) => (
          <NewsCard key={article.id} article={article} />
        ))
      )}

      {/* Pagination (later) */}
      {/* <div className="pagination flex-l-m flex-w m-l--6 p-t-25"> */}
    </div>
  );
}
