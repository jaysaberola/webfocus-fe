import { ReactNode, useState } from "react";

type PageEditorSettingsPanelProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  tourId?: string;
};

export default function PageEditorSettingsPanel({
  title,
  children,
  defaultOpen = true,
  tourId,
}: PageEditorSettingsPanelProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`page-editor__settings-card${open ? "" : " is-collapsed"}`}
      {...(tourId ? { "data-cms-tour": tourId } : {})}
    >
      <button
        type="button"
        className="page-editor__settings-header"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={`${open ? "Hide" : "Show"} ${title}`}
      >
        <h5>{title}</h5>
        <span className="page-editor__settings-toggle" aria-hidden="true">
          <i className={`fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"}`} />
        </span>
      </button>
      <div className="page-editor__settings-body">{children}</div>
    </div>
  );
}
