"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FlatItem } from "./types";
import { INDENT } from "./treeUtils";

interface Props {
  item: FlatItem;
  flatItems: FlatItem[];
  onUpdate: (items: FlatItem[]) => void;
  onRemove: (id: number) => void;
}

export default function SortableItem({
  item,
  flatItems,
  onUpdate,
  onRemove,
}: Props) {
  const { setNodeRef, attributes, listeners, transform, transition } =
    useSortable({ id: item.id });

  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState(item.label);
  const [target, setTarget] = useState(item.target ?? "");
  const [openInNewTab, setOpenInNewTab] = useState(!!item.openInNewTab);
  const isUrl = item.type === "url";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: item.depth * INDENT,
  };

  useEffect(() => {
    if (!open) return;
    setLabel(item.label);
    setTarget(item.target ?? "");
    setOpenInNewTab(!!item.openInNewTab);
  }, [open, item.label, item.target, item.openInNewTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const saveChanges = () => {
    const updated = flatItems.map((i) =>
      i.id === item.id
        ? {
            ...i,
            label,
            ...(isUrl ? { target, openInNewTab } : {}),
          }
        : i
    );

    onUpdate(updated);
    setOpen(false);
  };

  const modal =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="cms-menu-item-overlay" role="presentation" onClick={() => setOpen(false)}>
            <div
              className="cms-menu-item-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby={`menu-item-edit-title-${item.id}`}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="cms-menu-item-modal__header">
                <h5 id={`menu-item-edit-title-${item.id}`}>
                  Edit {isUrl ? "Custom URL" : "Menu Item"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                />
              </div>

              <div className="cms-menu-item-modal__body">
                <div className="mb-3">
                  <label className="form-label" htmlFor={`menu-item-label-${item.id}`}>
                    Label
                  </label>
                  <input
                    id={`menu-item-label-${item.id}`}
                    className="form-control"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    autoFocus
                  />
                </div>

                {isUrl ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label" htmlFor={`menu-item-url-${item.id}`}>
                        Target URL
                      </label>
                      <input
                        id={`menu-item-url-${item.id}`}
                        className="form-control"
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                      />
                    </div>

                    <div className="form-check">
                      <input
                        id={`menu-item-open-new-tab-${item.id}`}
                        className="form-check-input"
                        type="checkbox"
                        checked={openInNewTab}
                        onChange={(e) => setOpenInNewTab(e.target.checked)}
                      />
                      <label
                        className="form-check-label"
                        htmlFor={`menu-item-open-new-tab-${item.id}`}
                      >
                        Open Link in New Tab
                      </label>
                    </div>
                  </>
                ) : item.target ? (
                  <p className="text-muted small mb-0">Link: {item.target}</p>
                ) : null}
              </div>

              <div className="cms-menu-item-modal__footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setOpen(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={saveChanges}
                  disabled={!label.trim() || (isUrl && !target.trim())}
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div className="border rounded bg-light p-2 d-flex justify-content-between align-items-center">
        <div {...attributes} {...listeners} style={{ cursor: "grab" }} aria-label="Drag to reorder">
          ☰
        </div>

        <div className="flex-grow-1 ms-2">
          <div className="fw-semibold">{item.label}</div>
          {item.target ? (
            <div className="text-muted small">
              {item.target}
              {item.openInNewTab ? " • Opens in new tab" : ""}
            </div>
          ) : null}
        </div>

        <div className="btn-group btn-group-sm">
          <button type="button" className="btn btn-outline-primary" onClick={() => setOpen(true)}>
            Edit
          </button>
          <button type="button" className="btn btn-outline-danger" onClick={() => onRemove(item.id)}>
            ✕
          </button>
        </div>
      </div>
      {modal}
    </div>
  );
}
