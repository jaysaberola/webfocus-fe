// components/UI/CategoryCombobox.tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
}

export default function CategoryCombobox({ value, onChange, suggestions, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setFiltered(suggestions);
    } else {
      setFiltered(
        suggestions.filter((s) =>
          s.toLowerCase().includes(value.toLowerCase())
        )
      );
    }
  }, [value, suggestions]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <input
        className="form-control"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul
          className="list-group shadow-sm"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 1055,
            maxHeight: 200,
            overflowY: "auto",
            borderRadius: "0 0 6px 6px",
          }}
        >
          {filtered.map((s) => (
            <li
              key={s}
              className="list-group-item list-group-item-action"
              style={{ cursor: "pointer" }}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                onChange(s);
                setOpen(false);
              }}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}