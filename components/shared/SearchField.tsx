import filterStyles from "@/styles/tableFilter.module.css";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  id?: string;
  name?: string;
  className?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showClear?: boolean;
};

export default function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  ariaLabel = "Search",
  id,
  name,
  className,
  disabled,
  autoFocus,
  showClear = true,
}: Props) {
  const rootClass = [filterStyles.searchField, className].filter(Boolean).join(" ");

  return (
    <div className={rootClass} role="search">
      <i className={`fa-solid fa-magnifying-glass ${filterStyles.searchFieldIcon}`} aria-hidden="true" />
      <input
        id={id}
        name={name}
        type="search"
        className={filterStyles.searchFieldInput}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="off"
        enterKeyHint="search"
      />
      {showClear && value.trim().length > 0 && !disabled ? (
        <button
          type="button"
          className={filterStyles.searchFieldClear}
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}