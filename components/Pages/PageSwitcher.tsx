import { useEffect, useMemo, useRef, useState } from "react";
import {
  getPagesSwitcherListCached,
  getPagesSwitcherListCachedSync,
  prefetchPagesSwitcherList,
  type PageSwitcherItem,
} from "@/lib/pagesListCache";

export type { PageSwitcherItem };

type PageSwitcherProps = {
  currentPageId: number;
  currentTitle: string;
  onSelect: (pageId: number) => void;
};

export default function PageSwitcher({ currentPageId, currentTitle, onSelect }: PageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<PageSwitcherItem[]>(() => getPagesSwitcherListCachedSync() ?? []);
  const [refreshing, setRefreshing] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;

    prefetchPagesSwitcherList();
    getPagesSwitcherListCached()
      .then((rows) => {
        if (alive) setPages(rows);
      })
      .catch(() => {
        if (alive) setPages((current) => (current.length ? current : []));
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    let alive = true;
    setRefreshing(true);

    getPagesSwitcherListCached()
      .then((rows) => {
        if (alive) setPages(rows);
      })
      .finally(() => {
        if (alive) setRefreshing(false);
      });

    return () => {
      alive = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const displayPages = useMemo(() => {
    if (!currentPageId || pages.some((page) => page.id === currentPageId)) {
      return pages;
    }

    return [
      {
        id: currentPageId,
        title: currentTitle || "Untitled page",
        label: "",
        visibility: "Published",
      },
      ...pages,
    ];
  }, [pages, currentPageId, currentTitle]);

  const filtered = query.trim()
    ? displayPages.filter((page) => {
        const needle = query.trim().toLowerCase();
        const haystack = `${page.title} ${page.label} ${page.slug || ""}`.toLowerCase();
        return haystack.includes(needle);
      })
    : displayPages;

  const showLoading = open && refreshing && displayPages.length === 0;

  const handleSelect = (pageId: number) => {
    setOpen(false);
    setQuery("");
    if (pageId !== currentPageId) onSelect(pageId);
  };

  return (
    <div className="page-switcher" ref={rootRef}>
      <button
        type="button"
        className="page-switcher__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="page-switcher__trigger-label">Editing</span>
        <span className="page-switcher__trigger-title">{currentTitle || "Untitled page"}</span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
      </button>

      {open ? (
        <div className="page-switcher__panel" role="listbox" aria-label="Switch page">
          <div className="page-switcher__search-wrap">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
            <input
              type="search"
              className="page-switcher__search"
              placeholder="Search pages..."
              value={query}
              autoFocus
              onChange={(event) => setQuery(event.target.value)}
            />
            {refreshing && displayPages.length > 0 ? (
              <span className="page-switcher__refresh-indicator" aria-hidden="true">
                <i className="fa-solid fa-rotate" />
              </span>
            ) : null}
          </div>

          <div className="page-switcher__list">
            {showLoading ? (
              <div className="page-switcher__empty">Loading pages...</div>
            ) : filtered.length ? (
              filtered.map((page) => {
                const active = page.id === currentPageId;
                return (
                  <button
                    key={page.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`page-switcher__item${active ? " is-active" : ""}`}
                    onClick={() => handleSelect(page.id)}
                  >
                    <span className="page-switcher__item-main">
                      <strong>{page.title}</strong>
                      {page.label ? <span className="page-switcher__item-label">{page.label}</span> : null}
                    </span>
                    <span className={`page-switcher__badge page-switcher__badge--${page.visibility.toLowerCase()}`}>
                      {page.visibility}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="page-switcher__empty">No pages found.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
