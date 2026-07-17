import React, { useRef, useState } from "react";

export type AdvancedSearchField = {
  name: string;
  label: string;
  type?: "text" | "date" | "select";
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

type AdvancedSearchValues = Record<string, string>;

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  // optional extra controls to render inline on the left (e.g., page size selector)
  leftExtras?: React.ReactNode;
  // optional actions menu to render when Actions is clicked
  actionsMenu?: React.ReactNode;
  // optional callback when filters are applied
  onApplyFilters?: (filters: { sortBy: string; sortOrder: string; showDeleted: boolean; perPage: number; advancedValues?: AdvancedSearchValues }) => void;
  // initial filter values (kept in sync)
  initialSortBy?: string;
  initialSortOrder?: string;
  initialShowDeleted?: boolean;
  initialPerPage?: number;
  // optional show-deleted toggle control
  showDeletedToggle?: boolean;
  showDeletedLabel?: string;
  showSearchInput?: boolean;
  // hide the Filters button when false
  showFiltersButton?: boolean;
  // hide the Actions button when false
  showActionsButton?: boolean;
  // optional extra elements to render to the right of the search input
  rightExtras?: React.ReactNode;
  // externally control filters visibility
  filtersOpen?: boolean;
  onFiltersOpenChange?: (open: boolean) => void;
  // render filters as centered modal when true
  filtersAsModal?: boolean;
  // when externally opening filters, force modal rendering for that open action
  externalOpenAsModal?: boolean;
  advancedFields?: AdvancedSearchField[];
  advancedSearchTitle?: string;
  onAdvancedSearch?: (values: AdvancedSearchValues) => void;
  advancedSearchUpdatesInput?: boolean;
}

const defaultAdvancedFields: AdvancedSearchField[] = [
  { name: "title", label: "Title" },
  { name: "label", label: "Label" },
  { name: "content", label: "Content" },
  { name: "album", label: "Album", type: "select", options: [{ label: "- All Albums -", value: "" }] },
  { name: "lastModifiedBy", label: "Last Modified by", type: "select", options: [{ label: "- All Users -", value: "" }] },
  {
    name: "visibility",
    label: "Visibility",
    type: "select",
    options: [
      { label: "- All Visibility -", value: "" },
      { label: "Published", value: "published" },
      { label: "Private", value: "private" },
      { label: "Draft", value: "draft" },
    ],
  },
  { name: "seoTitle", label: "SEO Title" },
  { name: "seoDescription", label: "SEO Description" },
  { name: "seoKeyword", label: "SEO Keyword" },
  { name: "dateFrom", label: "Date Modified (From)", type: "date" },
  { name: "dateTo", label: "Date Modified (To)", type: "date" },
];

export default function SearchBar({
  placeholder = "Search...",
  value = "",
  onChange,
  leftExtras,
  actionsMenu,
  onApplyFilters,
  initialSortBy,
  initialSortOrder,
  initialShowDeleted,
  initialPerPage,
  showDeletedToggle = true,
  showDeletedLabel = "Show deleted only (Trash)",
  showSearchInput = true,
  showFiltersButton = true,
  showActionsButton = true,
  rightExtras,
  filtersOpen,
  onFiltersOpenChange,
  filtersAsModal = false,
  externalOpenAsModal = false,
  advancedFields = defaultAdvancedFields,
  advancedSearchTitle = "Advanced Search",
  onAdvancedSearch,
  advancedSearchUpdatesInput = true,
}: SearchBarProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const filtersBtnRef = useRef<HTMLButtonElement | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [filtersPos, setFiltersPos] = useState<{ top: number; left: number } | null>(null);
  const [renderFiltersAsModal, setRenderFiltersAsModal] = useState<boolean>(filtersAsModal);

  // filter state
  const [sortBy, setSortBy] = useState<string>(initialSortBy ?? "modified");
  const [sortOrder, setSortOrder] = useState<string>(initialSortOrder ?? "desc");
  const [showDeleted, setShowDeleted] = useState<boolean>(initialShowDeleted ?? false);
  const [perPage, setPerPage] = useState<number>(initialPerPage ?? 10);
  const [advancedValues, setAdvancedValues] = useState<AdvancedSearchValues>({});
  const advancedFieldNames = advancedFields.map((field) => field.name).join("|");

  // keep internal filter state in sync when parent changes initial props
  React.useEffect(() => {
    if (initialSortBy !== undefined) setSortBy(initialSortBy);
  }, [initialSortBy]);
  React.useEffect(() => {
    if (initialSortOrder !== undefined) setSortOrder(initialSortOrder);
  }, [initialSortOrder]);
  React.useEffect(() => {
    if (initialShowDeleted !== undefined) setShowDeleted(initialShowDeleted);
  }, [initialShowDeleted]);
  React.useEffect(() => {
    if (initialPerPage !== undefined) setPerPage(initialPerPage);
  }, [initialPerPage]);

  React.useEffect(() => {
    if (filtersOpen !== undefined) setShowFilters(filtersOpen);
    if (filtersOpen) {
      setRenderFiltersAsModal(externalOpenAsModal || filtersAsModal);
    }
  }, [filtersOpen]);

  React.useEffect(() => {
    setRenderFiltersAsModal(filtersAsModal);
  }, [filtersAsModal]);

  React.useEffect(() => {
    setAdvancedValues((current) => {
      const next: AdvancedSearchValues = {};
      for (const field of advancedFields) {
        next[field.name] = current[field.name] ?? "";
      }
      return next;
    });
  }, [advancedFieldNames]);

  React.useEffect(() => {
    if (!showFilters || renderFiltersAsModal || filtersPos) return;
    if (!filtersBtnRef.current) return;
    const rect = filtersBtnRef.current.getBoundingClientRect();
    setFiltersPos({ top: rect.bottom + window.scrollY, left: rect.left });
  }, [showFilters, renderFiltersAsModal, filtersPos]);

  // when `showDeleted` is toggled we want to auto-apply filters
  // but avoid doing this on the initial mount
  const mountedRef = useRef(false);
  React.useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    onApplyFilters?.({ sortBy, sortOrder, showDeleted, perPage });
    // only trigger when `showDeleted` changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDeleted]);

  const handleActionsClick = (e: React.MouseEvent) => {
    if (!actionsMenu) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 12);
    setMenuPos({ top: rect.bottom + 6, left: Math.max(8, left) });
    setShowMenu((s) => !s);
  };

  const handleFiltersClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const menuWidth = 320;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 12);
    setFiltersPos({ top: rect.bottom + 6, left: Math.max(8, left) });
    setRenderFiltersAsModal(filtersAsModal);
    const next = !showFilters;
    setShowFilters(next);
    onFiltersOpenChange?.(next);
  };

  const applyFilters = () => {
    onApplyFilters?.({ sortBy, sortOrder, showDeleted, perPage });
    setShowFilters(false);
    onFiltersOpenChange?.(false);
  };

  const closeFilters = () => {
    setShowFilters(false);
    onFiltersOpenChange?.(false);
  };

  const resetAdvancedForm = () => {
    const next = Object.fromEntries(advancedFields.map((field) => [field.name, ""]));
    setAdvancedValues(next);
    onAdvancedSearch?.(next);
    onChange?.("");
  };

  const handleAdvancedSearch = () => {
    const nextValues = Object.fromEntries(
      advancedFields.map((field) => [field.name, advancedValues[field.name] ?? ""])
    );
    const searchValue = advancedFields
      .map((field) => nextValues[field.name])
      .find((fieldValue) => fieldValue.trim() !== "");

    if (advancedSearchUpdatesInput) {
      onChange?.(searchValue ?? "");
    }
    onAdvancedSearch?.(nextValues);
    onApplyFilters?.({ sortBy, sortOrder, showDeleted, perPage, advancedValues: nextValues });
    setShowFilters(false);
    onFiltersOpenChange?.(false);
  };

  const resetFilters = () => {
    const next = { sortBy: "modified", sortOrder: "desc", showDeleted: false, perPage: 10 };
    setSortBy(next.sortBy);
    setSortOrder(next.sortOrder);
    setShowDeleted(next.showDeleted);
    setPerPage(next.perPage);
    onApplyFilters?.(next);
    setShowFilters(false);
    onFiltersOpenChange?.(false);
  };

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
      <div className="d-flex align-items-center flex-wrap gap-2" style={{ position: "relative" }}>
          <div>
            {showFiltersButton && (
              <button
                ref={filtersBtnRef}
                className={`btn btn-outline-secondary me-2 dropdown-toggle${showFilters ? " show" : ""}`}
                onClick={handleFiltersClick}
                aria-expanded={showFilters}
                aria-haspopup="true"
                type="button"
              >
                Filters
              </button>
            )}

            {showActionsButton && (
              <button
                ref={btnRef}
                className={`btn btn-outline-secondary dropdown-toggle${showMenu ? " show" : ""}`}
                onClick={handleActionsClick}
                aria-expanded={showMenu}
                aria-haspopup="true"
                type="button"
                disabled={!actionsMenu}
              >
                Actions
              </button>
            )}
          </div>

        {leftExtras}

        {showFilters && (
          <div>
            <div style={{ position: "fixed", inset: 0, zIndex: 1055 }} onClick={closeFilters} />
            {renderFiltersAsModal ? (
              <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ zIndex: 1060 }}>
                <div className="modal-dialog modal-lg modal-dialog-centered" role="document">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">{advancedSearchTitle}</h5>
                    </div>

                    <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                      <div className="row g-3">
                        {advancedFields.map((field) => {
                          const fieldType = field.type ?? "text";
                          const value = advancedValues[field.name] ?? "";
                          const fieldId = `advanced-${field.name}`;
                          const updateValue = (nextValue: string) => {
                            setAdvancedValues((current) => ({ ...current, [field.name]: nextValue }));
                          };

                          return (
                            <div key={field.name} className={fieldType === "date" ? "col-md-6" : "col-12"}>
                              <label className="form-label" htmlFor={fieldId}>{field.label}</label>
                              {fieldType === "select" ? (
                                <select
                                  id={fieldId}
                                  className="form-select"
                                  value={value}
                                  onChange={(e) => updateValue(e.target.value)}
                                >
                                  {(field.options ?? [{ label: "- All -", value: "" }]).map((option) => (
                                    <option key={`${field.name}-${option.value}`} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  id={fieldId}
                                  type={fieldType}
                                  className="form-control"
                                  placeholder={field.placeholder}
                                  value={value}
                                  onChange={(e) => updateValue(e.target.value)}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="modal-footer justify-content-between">
                      <button type="button" className="btn btn-info text-white" onClick={resetAdvancedForm}>Reset</button>
                      <div className="d-flex gap-2">
                        <button type="button" className="btn btn-secondary" onClick={closeFilters}>Close</button>
                        <button type="button" className="btn btn-success" onClick={handleAdvancedSearch}>Search</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="dropdown-menu show p-3 shadow"
                style={{ position: "fixed", top: filtersPos?.top ?? 0, left: filtersPos?.left ?? 0, zIndex: 1060, width: 320 }}
              >
                <h6 className="mb-2">Filters</h6>

                <div className="mb-2">
                  <small className="text-muted">Sort by</small>
                  <div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="sortBy" id="sortModified" checked={sortBy === "modified"} onChange={() => setSortBy("modified")} />
                      <label className="form-check-label" htmlFor="sortModified">Date modified</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="sortBy" id="sortTitle" checked={sortBy === "title"} onChange={() => setSortBy("title")} />
                      <label className="form-check-label" htmlFor="sortTitle">Title</label>
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <small className="text-muted">Sort order</small>
                  <div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="sortOrder" id="orderAsc" checked={sortOrder === "asc"} onChange={() => setSortOrder("asc")} />
                      <label className="form-check-label" htmlFor="orderAsc">Ascending</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="sortOrder" id="orderDesc" checked={sortOrder === "desc"} onChange={() => setSortOrder("desc")} />
                      <label className="form-check-label" htmlFor="orderDesc">Descending</label>
                    </div>
                  </div>
                </div>

                {showDeletedToggle && (
                  <div className="form-check mb-2">
                    <input className="form-check-input" type="checkbox" id="showDeleted" checked={showDeleted} onChange={(e) => setShowDeleted(e.target.checked)} />
                    <label className="form-check-label" htmlFor="showDeleted">{showDeletedLabel}</label>
                  </div>
                )}

                <div className="mb-3">
                  <small className="text-muted">Items displayed</small>
                  <div className="d-flex align-items-center gap-2">
                    <input type="range" className="form-range" min={5} max={100} step={1} value={perPage} onChange={(e) => setPerPage(Number(e.target.value))} style={{ flex: 1 }} />
                    <span className="badge bg-primary">{perPage}</span>
                  </div>
                </div>

                <div className="d-flex justify-content-between">
                  <button type="button" className="btn btn-light" onClick={resetFilters}>Reset</button>
                  <button type="button" className="btn btn-primary" onClick={applyFilters}>Apply filters</button>
                </div>
              </div>
            )}
          </div>
        )}

        {showMenu && actionsMenu && menuPos && (
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 1055 }}
              onClick={() => setShowMenu(false)}
              aria-hidden="true"
            />
            <div
              className="cms-options-menu card shadow-sm compact-dropdown"
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                zIndex: 1060,
                minWidth: 220,
              }}
            >
              <div className="cms-options-menu__header">Bulk Actions</div>
              <div className="list-group list-group-flush">
                {actionsMenu}
              </div>
            </div>
          </>
        )}
      </div>

      {showSearchInput && (
        <div className="d-flex align-items-center gap-2">
          <input
            type="text"
            className="form-control"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            style={{ maxWidth: 260 }}
          />
          {rightExtras}
        </div>
      )}
    </div>
  );
}
