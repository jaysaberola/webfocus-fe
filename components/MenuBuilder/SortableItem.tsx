"use client";

import { useState } from "react";
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    marginLeft: item.depth * INDENT,
  };

  /* ================= UPDATE ITEM ================= */
  const saveChanges = () => {
    const updated = flatItems.map((i) =>
      i.id === item.id
        ? {
            ...i,
            label,
            ...(item.type === "url" ? { target, openInNewTab } : {}),
          }
        : i
    );

    onUpdate(updated);
    setOpen(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <div className="border rounded bg-light p-2 d-flex justify-content-between align-items-center">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          style={{ cursor: "grab" }}
        >
          ☰
        </div>

        <div className="flex-grow-1 ms-2">
          <div className="fw-semibold">{item.label}</div>

          {item.target && (
            <div className="text-muted small">
              {item.target}
              {item.openInNewTab ? " • Opens in new tab" : ""}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="btn-group btn-group-sm">
          <button
            className="btn btn-outline-primary"
            onClick={() => setOpen(true)}
          >
            Edit
          </button>
          <button
            className="btn btn-outline-danger"
            onClick={() => onRemove(item.id)}
          >
            ✕
          </button>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {open && (
        <div className="modal d-block" tabIndex={-1}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Edit {item.type === "page" ? "Page" : "URL"}
                </h5>
                <button
                  className="btn-close"
                  onClick={() => setOpen(false)}
                />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Label</label>
                  <input
                    className="form-control"
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                  />
                </div>

                {item.type === "url" && (
                  <>
                    <div className="mb-3">
                      <label className="form-label">Target URL</label>
                      <input
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
                )}
              </div>

              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveChanges}
                  disabled={!label.trim()}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
