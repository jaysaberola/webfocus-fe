import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  getPagesSwitcherListCached,
  getPagesSwitcherListCachedSync,
  prefetchPagesSwitcherList,
  type PageSwitcherItem,
} from "@/lib/pagesListCache";

export type { PageSwitcherItem };

type PageSwitcherProps = {
  currentPageId?: number;
  currentTitle: string;
  onSelect: (pageId: number) => void;
  compact?: boolean;
  onCreatePage?: () => void;
  onViewAllPages?: () => void;
};

export default function PageSwitcher({
  currentPageId = 0,
  currentTitle,
  onSelect,
  compact = false,
  onCreatePage,
  onViewAllPages,
}: PageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<PageSwitcherItem[]>(() => getPagesSwitcherListCachedSync() ?? []);
  const [refreshing, setRefreshing] = useState(false);
  const [panelStyle, setPanelStyle] = useState<CSSProperties>();
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

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
      const target = event.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
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

  useEffect(() => {
    if (!open || !compact) return;

    const place = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(420, window.innerWidth - 24);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - width - 12));
      setPanelStyle({
        position: "fixed",
        top: Math.round(rect.bottom + 8),
        left,
        width,
        zIndex: 4000,
      });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, compact]);

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

  const panel = open ? (
    <div
      ref={panelRef}
      className="page-switcher__panel"
      role="listbox"
      aria-label="Switch page"
      style={compact ? panelStyle : undefined}
    >
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
      {onCreatePage || onViewAllPages ? (
        <div className="page-switcher__footer">
          {onViewAllPages ? (
            <button type="button" className="page-switcher__footer-btn" onClick={() => { setOpen(false); onViewAllPages(); }}>
              <i className="fa-solid fa-table-list" aria-hidden="true" />
              All pages
            </button>
          ) : null}
          {onCreatePage ? (
            <button type="button" className="page-switcher__footer-btn page-switcher__footer-btn--primary" onClick={() => { setOpen(false); onCreatePage(); }}>
              <i className="fa-solid fa-plus" aria-hidden="true" />
              New page
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div className={`page-switcher${compact ? " page-switcher--compact" : ""}`} ref={rootRef}>
      <button
        type="button"
        className="page-switcher__trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        title="Switch page"
        onClick={() => setOpen((prev) => !prev)}
      >
        {compact ? null : <span className="page-switcher__trigger-label">Editing</span>}
        <span className="page-switcher__trigger-title">{currentTitle || "Untitled page"}</span>
        <i className={`fa-solid fa-chevron-${open ? "up" : "down"}`} aria-hidden="true" />
      </button>

      {open && compact && typeof document !== "undefined" ? createPortal(panel, document.body) : panel}
    </div>
  );
}
