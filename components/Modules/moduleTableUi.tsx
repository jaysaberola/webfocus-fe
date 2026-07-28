import { ReactNode } from "react";

export function getCmsModuleStatusClass(status: string) {
  switch (status) {
    case "published":
    case "active":
      return "cms-module__status cms-module__status--published";
    case "private":
    case "inactive":
      return "cms-module__status cms-module__status--private";
    case "draft":
      return "cms-module__status cms-module__status--draft";
    case "deleted":
      return "cms-module__status cms-module__status--deleted";
    default:
      return "cms-module__status cms-module__status--default";
  }
}

export function cmsModuleStatusLabel(status: string) {
  switch (status) {
    case "published":
      return "Published";
    case "private":
      return "Private";
    case "draft":
      return "Draft";
    case "deleted":
      return "Deleted";
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    default:
      return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
  }
}

export function CmsModuleStatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={getCmsModuleStatusClass(status)}>
      {label || cmsModuleStatusLabel(status)}
    </span>
  );
}

export function CmsModuleLabelPill({ children }: { children: ReactNode }) {
  return <span className="cms-module__label-pill">{children}</span>;
}

export function CmsModuleDate({ value }: { value?: string | null }) {
  return <span className="cms-module__date">{value || "—"}</span>;
}

export function CmsModuleRowActions({ children }: { children: ReactNode }) {
  return <div className="cms-module__row-actions">{children}</div>;
}

export function CmsModuleTitleCell({
  title,
  href,
  subtitle,
  muted = false,
}: {
  title: string;
  href?: string;
  subtitle?: string;
  muted?: boolean;
}) {
  return (
    <div className="cms-module__title-cell">
      {href && !muted ? (
        <a href={href} target="_blank" rel="noreferrer" className="cms-module__title-link">
          {title}
        </a>
      ) : (
        <strong className={muted ? "cms-module__title-muted" : undefined}>{title}</strong>
      )}
      {subtitle ? <div className="cms-module__title-sub">{subtitle}</div> : null}
    </div>
  );
}

export function CmsModuleSortHeader({
  label,
  active,
  sortOrder,
  onClick,
}: {
  label: string;
  active: boolean;
  sortOrder: "asc" | "desc" | string;
  onClick: () => void;
}) {
  const iconClass = !active
    ? "fas fa-sort text-muted"
    : String(sortOrder).toLowerCase() === "asc"
      ? "fas fa-sort-up"
      : "fas fa-sort-down";

  return (
    <button type="button" className="cms-module__sort-btn" onClick={onClick} aria-label={`Sort by ${label}`}>
      <span>{label}</span>
      <i className={iconClass} />
    </button>
  );
}

export const DEFAULT_CMS_TABLE_PAGE_SIZE = 5;

export const cmsModuleTableProps = {
  wrapperClassName: "cms-table-wrap",
  tableClassName: "dt-enhanced-table",
};
