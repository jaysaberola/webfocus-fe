"use client";

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
  return (
    <div className="border rounded p-3">
      <h6>Pages</h6>

      <button
        className="btn btn-success btn-sm w-100 mb-3"
        onClick={onAdd}
        disabled={checked.length === 0}
      >
        + ADD
      </button>

      {pages.map((page) => (
        <div key={page.id} className="form-check mb-2">
          <input
            type="checkbox"
            className="form-check-input"
            checked={checked.includes(page.id)}
            onChange={() => onToggle(page.id)}
          />
          <label className="form-check-label">{page.title}</label>
        </div>
      ))}
    </div>
  );
}
