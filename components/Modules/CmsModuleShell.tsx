import Link from "next/link";
import { ReactNode } from "react";

export type CmsModuleStat = {
  label: string;
  value: string | number;
  tone?: "default" | "published" | "private" | "trash" | "draft" | "accent";
};

type CmsModuleShellProps = {
  title: string;
  description?: string;
  icon: string;
  className?: string;
  actions?: ReactNode;
  stats?: CmsModuleStat[];
  trashBanner?: ReactNode;
  toolbar?: ReactNode;
  children: ReactNode;
};

export default function CmsModuleShell({
  title,
  description,
  icon,
  className,
  actions,
  stats,
  trashBanner,
  toolbar,
  children,
}: CmsModuleShellProps) {
  return (
    <div className={["container-fluid px-4 pt-3 cms-module", className].filter(Boolean).join(" ")}>
      <div className="cms-module__hero" data-cms-tour="module-hero">
        <div className="cms-module__hero-copy">
          <h1>
            <i className={icon} aria-hidden="true" />
            {title}
          </h1>
          {description ? <p>{description}</p> : null}
        </div>
        {actions ? <div className="cms-module__hero-actions" data-cms-tour="module-create">{actions}</div> : null}
      </div>

      {stats && stats.length > 0 ? (
        <div className="cms-module__stats" data-cms-tour="module-stats">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`cms-module__stat${stat.tone && stat.tone !== "default" ? ` cms-module__stat--${stat.tone}` : ""}`}
            >
              <span className="cms-module__stat-label">{stat.label}</span>
              <span className="cms-module__stat-value">{stat.value}</span>
            </div>
          ))}
        </div>
      ) : null}

      {trashBanner}

      {toolbar ? <div className="cms-module__toolbar-card" data-cms-tour="module-toolbar">{toolbar}</div> : null}

      <div data-cms-tour="module-table">{children}</div>
    </div>
  );
}

export function CmsModuleTrashBanner({
  message,
  onBack,
  backLabel = "Back to list",
}: {
  message: ReactNode;
  onBack: () => void;
  backLabel?: string;
}) {
  return (
    <div className="cms-module__trash-banner" role="alert">
      <div>{message}</div>
      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}

export function CmsModuleCreateButton({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="btn btn-primary cms-module__create-btn" data-cms-tour="module-create">
      <i className="fa-solid fa-plus" aria-hidden="true" />
      {label}
    </Link>
  );
}

export function CmsModuleAdvancedSearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className="btn btn-outline-primary cms-module__toolbar-btn" data-cms-tour="module-advanced-search" onClick={onClick}>
      <i className="fa-solid fa-sliders me-2" aria-hidden="true" />
      Advanced Search
    </button>
  );
}
