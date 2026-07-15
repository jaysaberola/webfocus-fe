import { useRouter } from "next/router";
import { useState } from "react";

type Props = {
  categories: any[];
  archive: Record<string, { month: number; total: number }[]>;
};

const MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function LeftSidebar({ categories, archive }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(
    (router.query.search as string) || ""
  );
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});

  const pushQuery = (params: any) => {
    router.push({
      pathname: "/public/news",
      query: {
        ...router.query,
        ...params,
      },
    });
  };

  const toggleYear = (year: string) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  return (
    <>
      {/* SEARCH */}
      <div className="search-sidebar2 size12 bo2 pos-relative">
        <input
          className="input-search-sidebar2 txt10 p-l-20 p-r-55"
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pushQuery({ search })}
        />
        <button
          className="btn-search-sidebar2 flex-c-m ti-search trans-0-4"
          onClick={() => pushQuery({ search })}
        />
      </div>

      {/* CATEGORIES */}
      {categories.length > 0 && (
        <div className="categories">
          <h4 className="txt33 bo5-b p-b-35 p-t-58">
            Categories
          </h4>

          <ul>
            {categories.map((cat) => (
              <li key={cat.id} className="bo5-b p-t-8 p-b-8">
                <a
                  className="txt27"
                  style={{ cursor: "pointer" }}
                  onClick={() => pushQuery({ category: cat.slug })}
                >
                  {cat.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ARCHIVE */}
      {Object.keys(archive).length > 0 && (
        <div className="archive">
          <h4 className="txt33 p-b-20 p-t-43">
            Archive
          </h4>

          <ul>
            {Object.entries(archive).map(([year, months]) =>
              months.map((m) => (
                <li key={`${year}-${m.month}`} className="flex-sb-m p-t-8 p-b-8">
                  <a
                    className="txt27"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      pushQuery({ year, month: m.month })
                    }
                  >
                    {MONTHS[m.month]} {year}
                  </a>

                  <span className="txt29">
                    ({m.total})
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </>
  );
}
