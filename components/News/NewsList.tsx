import NewsItem from "./NewsItem";

type Props = {
  articles: any[];
};

export default function NewsList({ articles }: Props) {
  return (
    <div className="p-t-80 p-b-124 bo5-r h-full p-r-50 p-r-0-md bo-none-md">
      {articles.length === 0 ? (
        <div className="txt32 text-center p-t-50">
          No news available.
        </div>
      ) : (
        articles.map((article) => (
          <NewsItem key={article.id} article={article} />
        ))
      )}
    </div>
  );
}
