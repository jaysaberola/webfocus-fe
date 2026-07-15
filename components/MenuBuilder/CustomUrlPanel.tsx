"use client";

import { useState } from "react";
import { MenuItem } from "./types";

interface Props {
  onAdd: (item: MenuItem) => void;
}

export default function CustomUrlPanel({ onAdd }: Props) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [openInNewTab, setOpenInNewTab] = useState(false);

  const handleAdd = () => {
    if (!label.trim() || !url.trim()) return;

    onAdd({
      id: Date.now(), // unique temp id
      label,
      type: "url",
      target: url,
      openInNewTab,
      children: [],
    });

    setLabel("");
    setUrl("");
    setOpenInNewTab(false);
  };

  return (
    <div className="border rounded p-3 mt-3">
      <h6>Custom URL</h6>

      <div className="mb-2">
        <input
          className="form-control"
          placeholder="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="mb-2">
        <input
          className="form-control"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </div>

      <div className="form-check mb-3">
        <input
          id="custom-url-open-new-tab"
          className="form-check-input"
          type="checkbox"
          checked={openInNewTab}
          onChange={(e) => setOpenInNewTab(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="custom-url-open-new-tab">
          Open Link in New Tab
        </label>
      </div>

      <button
        className="btn btn-success btn-sm w-100"
        onClick={handleAdd}
        disabled={!label || !url}
      >
        + ADD
      </button>
    </div>
  );
}
