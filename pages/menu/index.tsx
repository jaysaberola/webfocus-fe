import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { deleteMenu, getMenus, MenuRow, activateMenu, postMethodDeleteMenu, updateMenuName, restoreMenu, setMenuInactive } from "@/services/menuService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import Link from "next/link";

type AdvancedSearchValues = Record<string, string>;

function ManageMenus() {
  const router = useRouter();

  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [showDeleted, setShowDeleted] = useState<boolean>(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [selected, setSelected] = useState<MenuRow | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [menuName, setMenuName] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<MenuRow | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const silentSortFetchRef = useRef(false);

  /* ======================
   * Fetch Menus
   * ====================== */
  const isRowDeleted = (row: any) => {
    if (!row) return false;
    if (row.deleted_at) return true;
    if (row.is_deleted === true) return true;
    if (row.is_deleted === 1 || row.is_deleted === "1") return true;
    if (row.deleted === true) return true;
    const raw = (row.status ?? row.visibility ?? "").toString().trim().toLowerCase();
    if (raw === "deleted") return true;
    return false;
  };

  const sortRowsClientSide = (rows: MenuRow[], sortByKey: string, order: string) => {
    const direction = String(order).toLowerCase() === "asc" ? 1 : -1;
    const copy = [...rows];

    const getName = (r: MenuRow) => (r?.name ?? "").toString().toLowerCase();
    const getModifiedMs = (r: MenuRow) => {
      const raw: any = (r as any)?.updated_at ?? (r as any)?.updated_at_formatted ?? (r as any)?.updated;
      if (!raw) return 0;
      const ms = new Date(raw).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    copy.sort((a, b) => {
      if (sortByKey === "name") {
        const av = getName(a);
        const bv = getName(b);
        if (av < bv) return -1 * direction;
        if (av > bv) return 1 * direction;
        return 0;
      }
      return (getModifiedMs(a) - getModifiedMs(b)) * direction;
    });
    return copy;
  };

  const fetchMenus = async (opts?: { showDeleted?: boolean; page?: number; silent?: boolean }) => {
    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const effectiveShowDeleted = opts?.showDeleted ?? showDeleted;
      const deletedFlag = effectiveShowDeleted ? 1 : 0;
      const effectivePage = opts?.page ?? currentPage;

      const baseParams: any = {
        search,
        name: advancedSearchValues.name || undefined,
        status: advancedSearchValues.status || undefined,
        date_modified_from: advancedSearchValues.dateModifiedFrom || undefined,
        date_modified_to: advancedSearchValues.dateModifiedTo || undefined,
        page: effectivePage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const requestOnce = async (extra: any) => {
        const res = await getMenus({ ...baseParams, ...extra }, { silent });
        const apiRows: any[] = Array.isArray(res?.data?.data) ? res.data.data : [];
        const lastPage = res?.data?.last_page ?? 1;
        return { apiRows, lastPage };
      };

      const attempts: any[] = effectiveShowDeleted
        ? [
            // common Laravel soft-delete conventions
            { show_deleted: 1, with_trashed: 1, only_trashed: 1, only_deleted: 1 },
            { show_deleted: true, with_trashed: 1, only_trashed: 1 },
            { show_deleted: 1 },
            { only_trashed: 1, with_trashed: 1 },
            // backend-specific alternates
            { trashed: 1, with_trashed: 1 },
            { deleted: 1 },
            { status: "deleted" },
          ]
        : [
            { show_deleted: 0 },
          ];

      let apiRows: any[] = [];
      let lastPage: number = 1;
      let lastError: any = null;

      for (const extra of attempts) {
        try {
          const res = await requestOnce(extra);
          apiRows = res.apiRows;
          lastPage = res.lastPage;

          // If trash view, require at least one detectable deleted row.
          // Otherwise, continue trying alternate flags.
          if (!effectiveShowDeleted) break;
          if (apiRows.some((r) => isRowDeleted(r))) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (effectiveShowDeleted && apiRows.length === 0 && lastError) {
        throw lastError;
      }

      const filteredRows = effectiveShowDeleted
        ? apiRows.filter((r) => isRowDeleted(r))
        : apiRows.filter((r) => !isRowDeleted(r));

      const sortedRows = sortRowsClientSide(filteredRows as MenuRow[], sortBy, sortOrder);
      setMenus(sortedRows);
      setTotalPages(lastPage);
    } catch (err) {
      console.error("Failed to load menus", err);
    } finally {
      if (!(opts?.silent ?? false)) setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await activateMenu(id);
      fetchMenus(); // refresh list
    } catch (err) {
      console.error("Failed to activate menu", err);
      toast.error("Failed to activate menu");
    }
  };

  const openSettingsMenu = (e: React.MouseEvent, row: MenuRow) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + window.scrollY, left: rect.left });
    setSelected(row);
    setMenuName(row.name);
    setShowSettingsMenu(true);
  };

  const doQuickEditSave = async () => {
    if (!selected) return;
    if (!menuName.trim()) {
      toast.error("Menu name is required");
      return;
    }
    try {
      await updateMenuName(selected.id, menuName.trim());
      toast.success("Menu updated");
      setShowQuickEdit(false);
      setSelected(null);
      fetchMenus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update menu");
    }
  };

  const doDelete = async () => {
    if (!selected) return;
    if (selected.is_active) {
      toast.error("You can't delete the active menu. Activate another menu first.");
      return;
    }
    try {
      try {
        await deleteMenu(selected.id);
      } catch {
        await postMethodDeleteMenu(selected.id);
      }
      toast.success("Menu deleted");
      setShowDeleteConfirm(false);
      setSelected(null);
      // Keep current view (do not auto-switch to Trash)
      setSelectedIds([]);
      fetchMenus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete menu");
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreMenu(restoreTarget.id);
      try {
        await setMenuInactive(restoreTarget.id);
      } catch {
        // Best-effort: if backend doesn't allow update here, still consider restore successful.
      }
      toast.success("Restored successfully");
      setShowRestoreConfirm(false);
      setRestoreTarget(null);
      // match Manage News behavior: go back to main list after restore
      setShowDeleted(false);
      setCurrentPage(1);
      fetchMenus({ showDeleted: false, page: 1 });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to restore menu");
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const timeout = setTimeout(() => fetchMenus({ silent }), 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted, advancedSearchValues]);

  useEffect(() => {
    setSelectedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage, sortBy, sortOrder, showDeleted, search]);

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(menus.map((m) => m.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const selectedRows = menus.filter((m) => selectedIds.includes(m.id));
    const activeIds = selectedRows.filter((m) => m.is_active).map((m) => m.id);
    const deletableIds = selectedRows.filter((m) => !m.is_active).map((m) => m.id);

    if (deletableIds.length === 0) {
      toast.error("No deletable menus selected. Active menu cannot be deleted.");
      setShowBulkDeleteConfirm(false);
      return;
    }

    try {
      const results = await Promise.allSettled(
        deletableIds.map(async (id) => {
          try {
            await deleteMenu(id);
          } catch {
            await postMethodDeleteMenu(id);
          }
        })
      );

      const okCount = results.filter((r) => r.status === "fulfilled").length;
      const failCount = results.length - okCount;

      if (okCount > 0) toast.success(`Deleted ${okCount} menu(s)`);
      if (activeIds.length > 0) toast.info(`Skipped ${activeIds.length} active menu(s)`);
      if (failCount > 0) toast.error(`Failed to delete ${failCount} menu(s)`);

      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchMenus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete selected menus");
    }
  };

  const bulkSetActive = async () => {
    if (selectedIds.length !== 1) return;
    const id = selectedIds[0];
    const row = menus.find((m) => m.id === id);
    if (!row || row.is_active) return;
    try {
      await activateMenu(id);
      toast.success("Menu activated");
      setSelectedIds([]);
      fetchMenus();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to activate menu");
    }
  };

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<MenuRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={menus.length > 0 && menus.every((m) => selectedIds.includes(m.id))}
          onChange={(e) => toggleSelectAll(e.target.checked)}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => toggleRow(row.id, e.target.checked)}
        />
      ),
    },
    {
      key: "name",
      header: "Menu Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className={showDeleted ? "fw-bold text-decoration-line-through text-muted" : "fw-bold text-primary"}>
          {row.name}
          {showDeleted && (
            <span className="badge bg-danger ms-2" style={{ fontSize: 11, verticalAlign: "middle" }}>
              Deleted
            </span>
          )}
        </span>
      ),
    },
    {
      key: "is_active",
      header: "Menu Status",
      sortable: true,
      sortField: "is_active",
      defaultSortOrder: "desc",
      render: (row) => (
        <span
          className={`badge ${
            row.is_active ? "bg-success" : "bg-secondary"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "updated_at_formatted",
      header: "Date Modified",
      sortable: true,
      sortField: "updated_at",
      sortLabel: "Date Modified",
      defaultSortOrder: "desc",
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          {showDeleted ? (
            <button
              className="btn btn-link p-0 text-success"
              title="Restore"
              onClick={() => {
                setRestoreTarget(row);
                setShowRestoreConfirm(true);
              }}
              type="button"
            >
              <i className="fas fa-trash-restore"></i>
            </button>
          ) : (
            <>
              {/* Edit */}
              <button
                className="btn btn-link p-0 me-2 text-secondary"
                title="Edit"
                onClick={() => router.push(`/menu/edit/${row.id}`)}
                type="button"
              >
                <i className="fas fa-edit" />
              </button>

              {/* Set Active */}
              <button
                className="btn btn-link p-0"
                title={
                  row.is_active
                    ? "This menu is currently active"
                    : "Set as active menu"
                }
                onClick={() => handleActivate(row.id)}
                style={{
                  color: row.is_active ? "#198754" : "#6c757d",
                  opacity: row.is_active ? 0.5 : 1,
                }}
                type="button"
              >
                <i
                  className={`fas ${
                    row.is_active ? "fa-toggle-on" : "fa-toggle-off"
                  }`}
                />
              </button>

              {/* Settings (Quick Edit / Delete) */}
              <button
                className="btn btn-link p-0 ms-2 text-secondary"
                title="Settings: click to open actions (Quick Edit/Delete) for this menu"
                aria-label="Settings: click to open actions"
                onClick={(e) => openSettingsMenu(e, row)}
                type="button"
              >
                <i className="fas fa-cogs" />
              </button>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">Manage Menus</h3>

      <SearchBar
        placeholder="Search Menus"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}

        actionsMenu={(
          <>
            <button
              className="list-group-item list-group-item-action"
              onClick={bulkSetActive}
              type="button"
              disabled={showDeleted || selectedIds.length !== 1 || !!menus.find((m) => m.id === selectedIds[0])?.is_active}
            >
              Set Active
            </button>
            <button
              className="list-group-item list-group-item-action text-danger"
              onClick={() => setShowBulkDeleteConfirm(true)}
              type="button"
              disabled={showDeleted || selectedIds.length === 0}
            >
              Delete
            </button>
          </>
        )}
        rightExtras={(
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-success d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 18px", whiteSpace: "nowrap" }}
              onClick={() => setShowAdvancedModal(true)}
            >
              <span style={{ lineHeight: 1, textAlign: "center", display: "inline-block" }}>
                Advanced Search
              </span>
            </button>

            <Link
              href="/menu/create"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 24px", whiteSpace: "nowrap" }}
            >
              Create Menu
            </Link>
          </div>
        )}
        filtersOpen={showAdvancedModal}
        onFiltersOpenChange={(open) => {
          if (!open) setShowAdvancedModal(false);
        }}
        externalOpenAsModal={true}
        advancedSearchUpdatesInput={false}
        onAdvancedSearch={(values) => setAdvancedSearchValues(values)}
        advancedFields={[
          { name: "name", label: "Menu Name" },
          {
            name: "status",
            label: "Menu Status",
            type: "select",
            options: [
              { label: "- All Statuses -", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
          { name: "dateModifiedFrom", label: "Date Modified (From)", type: "date" },
          { name: "dateModifiedTo", label: "Date Modified (To)", type: "date" },
        ]}
        onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, showDeleted: sDeleted, perPage: sPerPage, advancedValues }) => {
          setSortBy(sBy === "modified" ? "updated_at" : sBy === "title" ? "name" : sBy);
          setSortOrder(sOrder);
          setShowDeleted(sDeleted);
          setPerPage(sPerPage);
          setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
          setCurrentPage(1);
        }}
        initialSortBy={sortBy === "updated_at" ? "modified" : sortBy === "name" ? "title" : sortBy}
        initialSortOrder={sortOrder}
        initialPerPage={perPage}
        initialShowDeleted={showDeleted}
      />

      <DataTable<MenuRow>
        columns={columns}
        data={menus}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => { setPerPage(n); setCurrentPage(1); }}
        sortBy={sortBy}
        sortOrder={(String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc") as any}
        onSortChange={(nextBy, nextOrder) => {
          silentSortFetchRef.current = true;
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />

      {/* Small anchored dropdown menu (near cogs icon) */}
      {showSettingsMenu && selected && menuPos && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 1055 }} onClick={() => setShowSettingsMenu(false)} />
          <div style={{ position: "fixed", top: menuPos.top, left: menuPos.left, zIndex: 1060 }}>
            <div className="card shadow-sm compact-dropdown" style={{ width: 140 }}>
              <div className="list-group list-group-flush">
                <button
                  className="list-group-item list-group-item-action"
                  onClick={() => {
                    setShowSettingsMenu(false);
                    setShowQuickEdit(true);
                  }}
                  style={{ padding: "6px 8px" }}
                  type="button"
                  title="Click to quickly edit this menu"
                  aria-label="Quick edit menu"
                >
                  Quick Edit
                </button>
                <button
                  className={`list-group-item list-group-item-action ${
                    selected.is_active ? "text-secondary" : "text-danger"
                  }`}
                  onClick={() => {
                    if (selected.is_active) return;
                    setShowSettingsMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  style={{ padding: "6px 8px" }}
                  type="button"
                  disabled={selected.is_active}
                  title={selected.is_active ? "Can't delete the active menu" : "Click to move this menu to Trash"}
                  aria-label={selected.is_active ? "Cannot delete active menu" : "Move menu to Trash"}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Edit Modal (menu name only) */}
      {showQuickEdit && selected && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: "rgba(0,0,0,0.5)", zIndex: 1060 }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="card" style={{ width: 420 }}>
              <div className="card-body">
                <h5 className="card-title mb-3">Quick Edit Menu</h5>

                <div className="mb-3">
                  <label className="form-label">Menu Name</label>
                  <input
                    className="form-control"
                    value={menuName}
                    onChange={(e) => setMenuName(e.target.value)}
                    placeholder="Enter menu name"
                  />
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => {
                      setShowQuickEdit(false);
                      setSelected(null);
                    }}
                    type="button"
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={doQuickEditSave} type="button" disabled={!menuName.trim()}>
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={showDeleteConfirm && !!selected}
        title="Confirm Delete"
        message={<p>Delete menu <strong>{selected?.name}</strong>?</p>}
        confirmLabel="Delete"
        danger
        onConfirm={doDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setSelected(null);
        }}
      />

      <ConfirmModal
        show={showBulkDeleteConfirm}
        title="Confirm Delete"
        message={<p>Delete selected <strong>{selectedIds.length}</strong> menu(s)? Active menus will be skipped.</p>}
        confirmLabel="Delete"
        danger
        onConfirm={bulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      <ConfirmModal
        show={showRestoreConfirm && !!restoreTarget}
        title="Confirm Restore"
        message={<p>Restore menu <strong>{restoreTarget?.name}</strong>?</p>}
        confirmLabel="Restore"
        danger={false}
        confirmVariant="success"
        accentVariant="success"
        onConfirm={confirmRestore}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setRestoreTarget(null);
        }}
      />
    </div>
  );
}

ManageMenus.Layout = AdminLayout;
export default ManageMenus;
