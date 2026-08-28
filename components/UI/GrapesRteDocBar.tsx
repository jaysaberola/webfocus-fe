"use client";

import { useEffect, useRef, useState } from "react";

type MenuItem = {
  label: string;
  action: string;
  shortcut?: string;
  disabled?: boolean;
};

type MenuGroup = {
  id: string;
  label: string;
  items: MenuItem[];
};

type GrapesRteDocBarProps = {
  editorReady: boolean;
  textToolbarVisible: boolean;
  rteHostRef: React.RefObject<HTMLDivElement | null>;
  onMenuAction: (action: string) => void;
  onRteAction: (action: string) => void;
  onOpenGuide?: () => void;
};

const MENUS: MenuGroup[] = [
  {
    id: "insert",
    label: "Insert",
    items: [
      { label: "Hero section", action: "cms:insert-hero" },
      { label: "Open library", action: "cms:open-library" },
    ],
  },
];

export default function GrapesRteDocBar({
  editorReady,
  textToolbarVisible,
  rteHostRef,
  onMenuAction,
  onRteAction,
  onOpenGuide,
}: GrapesRteDocBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (textToolbarVisible) setOpenMenu(null);
  }, [textToolbarVisible]);

  return (
    <div
      ref={barRef}
      className={`cms-grapes-doc-bar${textToolbarVisible ? " is-rte-mode" : ""}`}
      onMouseDown={(event) => {
        if (textToolbarVisible) event.preventDefault();
      }}
    >
      {!textToolbarVisible && (
        <div className="cms-grapes-doc-bar__menus">
          {MENUS.map((menu) => (
            <div key={menu.id} className="cms-grapes-doc-bar__menu">
              <button
                type="button"
                className={`cms-grapes-doc-bar__menu-btn${openMenu === menu.id ? " is-open" : ""}`}
                disabled={!editorReady}
                onClick={() => setOpenMenu((current) => (current === menu.id ? null : menu.id))}
              >
                {menu.label}
              </button>
              {openMenu === menu.id && (
                <div className="cms-grapes-doc-bar__dropdown" role="menu">
                  {menu.items.map((item) => (
                    <button
                      key={`${menu.id}-${item.label}`}
                      type="button"
                      className="cms-grapes-doc-bar__dropdown-item"
                      role="menuitem"
                      disabled={!editorReady || item.action === "noop" || item.disabled}
                      onClick={() => {
                        setOpenMenu(null);
                        if (item.action === "noop") return;
                        if (item.action.startsWith("rte:")) {
                          onRteAction(item.action.replace(/^rte:/, ""));
                          return;
                        }
                        onMenuAction(item.action);
                      }}
                    >
                      <span>{item.label}</span>
                      {item.shortcut && <span className="cms-grapes-doc-bar__shortcut">{item.shortcut}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          {onOpenGuide ? (
            <button
              type="button"
              className="cms-grapes-doc-bar__guide"
              data-cms-tour="grapes-guide"
              disabled={!editorReady}
              onClick={onOpenGuide}
            >
              <i className="fa-solid fa-circle-question" aria-hidden="true" />
              User guide
            </button>
          ) : null}
          <span className="cms-grapes-doc-bar__hint">Select any text block to show formatting tools</span>
        </div>
      )}

      <div
        ref={rteHostRef}
        className={`cms-grapes-rte-host${textToolbarVisible ? " is-active" : ""}`}
        aria-hidden={!textToolbarVisible}
      />
    </div>
  );
}
