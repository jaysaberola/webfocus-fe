import { ChangeEvent, ReactNode, useState } from "react";

type CmsSettingsSectionProps = {
  title: string;
  description?: string;
  icon?: string;
  children: ReactNode;
  defaultOpen?: boolean;
};

export function CmsSettingsSection({
  title,
  description,
  icon,
  children,
  defaultOpen = true,
}: CmsSettingsSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`cms-settings-section${open ? "" : " is-collapsed"}`}>
      <button
        type="button"
        className="cms-settings-section__header"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <div className="cms-settings-section__header-copy">
          {icon ? <i className={icon} aria-hidden="true" /> : null}
          <div>
            <h3>{title}</h3>
            {description ? <p>{description}</p> : null}
          </div>
        </div>
        <span className="cms-settings-section__toggle" aria-hidden="true">
          <i className={`fa-solid ${open ? "fa-chevron-up" : "fa-chevron-down"}`} />
        </span>
      </button>
      <div className="cms-settings-section__body">{children}</div>
    </section>
  );
}

export function CmsSettingsLayout({ children }: { children: ReactNode }) {
  return <div className="cms-settings-layout">{children}</div>;
}

export function CmsSettingsGrid({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2 | 3;
}) {
  return (
    <div className={`cms-settings-grid cms-settings-grid--${columns}`}>
      {children}
    </div>
  );
}

export function CmsSettingsField({
  label,
  required,
  hint,
  children,
  span = 1,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  span?: 1 | 2 | 3;
}) {
  return (
    <div className={`cms-settings-field cms-settings-field--span-${span}`}>
      <label className="cms-settings-field__label">
        {label}
        {required ? <span className="cms-settings-field__required">*</span> : null}
      </label>
      <div className="cms-settings-field__control">{children}</div>
      {hint ? <p className="cms-settings-field__hint">{hint}</p> : null}
    </div>
  );
}

export function CmsSettingsFileField({
  label,
  previewUrl,
  fileName,
  hint,
  accept,
  onChange,
  previewVariant = "logo",
}: {
  label: string;
  previewUrl?: string | null;
  fileName?: string;
  hint?: string;
  accept?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  previewVariant?: "logo" | "favicon" | "avatar";
}) {
  return (
    <div className="cms-settings-file">
      <label className="cms-settings-field__label">{label}</label>
      <div className="cms-settings-file__card">
        <div className={`cms-settings-file__preview cms-settings-file__preview--${previewVariant}`}>
          {previewUrl ? (
            <img src={previewUrl} alt={label} />
          ) : (
            <span className="cms-settings-file__placeholder">
              <i className="fa-solid fa-image" aria-hidden="true" />
            </span>
          )}
        </div>
        <div className="cms-settings-file__meta">
          <div className="cms-settings-file__name">{fileName || "No file selected"}</div>
          {hint ? <div className="cms-settings-file__hint">{hint}</div> : null}
          <label className="btn btn-sm btn-outline-primary cms-settings-file__browse">
            <i className="fa-solid fa-folder-open me-1" aria-hidden="true" />
            Browse
            <input type="file" hidden accept={accept} onChange={onChange} />
          </label>
        </div>
      </div>
    </div>
  );
}

export function CmsSettingsChoicePills<T extends string>({
  label,
  hint,
  value,
  options,
  onChange,
}: {
  label: string;
  hint?: string;
  value: T;
  options: { value: T; label: string; icon?: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="cms-settings-field cms-settings-field--span-3">
      <label className="cms-settings-field__label">{label}</label>
      <div className="cms-settings-pills" role="radiogroup" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            className={`cms-settings-pills__btn${value === option.value ? " is-active" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.icon ? <i className={option.icon} aria-hidden="true" /> : null}
            {option.label}
          </button>
        ))}
      </div>
      {hint ? <p className="cms-settings-field__hint">{hint}</p> : null}
    </div>
  );
}

export function CmsSettingsFooter({
  children,
  onSave,
  saveLabel = "Save Changes",
  saving = false,
}: {
  children?: ReactNode;
  onSave?: () => void;
  saveLabel?: string;
  saving?: boolean;
}) {
  return (
    <div className="cms-settings-footer">
      <div className="cms-settings-footer__inner">
        {children}
        {onSave ? (
          <button
            type="button"
            className="btn btn-primary cms-settings-footer__save"
            onClick={onSave}
            disabled={saving}
          >
            <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
            {saveLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function CmsSettingsProfileCard({
  name,
  role,
  avatarUrl,
  initials,
}: {
  name: string;
  role?: string;
  avatarUrl?: string;
  initials: string;
}) {
  return (
    <div className="cms-settings-profile-card">
      <div className="cms-settings-profile-card__avatar">
        {avatarUrl ? (
          <img src={avatarUrl} alt={name} />
        ) : (
          <span>{initials.toUpperCase()}</span>
        )}
      </div>
      <div>
        <div className="cms-settings-profile-card__name">{name}</div>
        {role ? <div className="cms-settings-profile-card__role">{role}</div> : null}
      </div>
    </div>
  );
}

export function CmsSettingsUploadZone({
  label,
  hint,
  accept,
  multiple,
  dragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowse,
  inputRef,
  onInputChange,
}: {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  dragOver?: boolean;
  onDragOver?: (event: React.DragEvent) => void;
  onDragLeave?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onBrowse: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onInputChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      className={`cms-settings-upload-zone${dragOver ? " is-dragover" : ""}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="cms-settings-upload-zone__icon">
        <i className="fa-solid fa-cloud-arrow-up" aria-hidden="true" />
      </div>
      <div className="cms-settings-upload-zone__copy">
        <strong>{label}</strong>
        {hint ? <p>{hint}</p> : null}
      </div>
      <button type="button" className="btn btn-outline-primary btn-sm" onClick={onBrowse}>
        Browse files
      </button>
      {inputRef && onInputChange ? (
        <input
          ref={inputRef}
          type="file"
          className="d-none"
          multiple={multiple}
          accept={accept}
          onChange={onInputChange}
        />
      ) : null}
    </div>
  );
}
