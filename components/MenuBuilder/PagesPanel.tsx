"use client";

import { useMemo, useState } from "react";
import { Page } from "./types";

interface PagesPanelProps {
  pages: Page[];
  checked: number[];
  onToggle: (id: number) => void;
  onAdd: () => void;
}

export default function PagesPanel({
  pages,
  checked,
  onToggle,
  onAdd,
}: PagesPanelProps) {
  const [search, setSearch] = useState("");

  const filteredPages = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pages;
    return pages.filter((page) => page.title.toLowerCase().includes(query));
  }, [pages, search]);

  return (
    <div className="cms-menu-panel" data-cms-tour="menu-panel-pages">
      <div className="cms-menu-panel__header">
        <h6>Pages</h6>
        <span className="cms-menu-panel__count">{checked.length} selected</span>
      </div>

      <input
        type="text"
        className="form-control form-control-sm mb-3"
        placeholder="Search pages..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <button
        className="btn btn-primary btn-sm w-100 mb-3"
        onClick={onAdd}
        disabled={checked.length === 0}
        type="button"
      >
        <i className="fa-solid fa-plus me-1" aria-hidden="true" />
        Add to Menu
      </button>

      <div className="cms-menu-panel__list">
        {filteredPages.length === 0 ? (
          <div className="text-muted small py-2">No pages found.</div>
        ) : (
          filteredPages.map((page) => (
            <label key={page.id} className="cms-menu-panel__item">
              <input
                type="checkbox"
                checked={checked.includes(page.id)}
                onChange={() => onToggle(page.id)}
              />
              <span>{page.title}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
