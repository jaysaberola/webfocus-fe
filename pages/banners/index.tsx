// pages/dashboard/albums.tsx
import { useEffect, useRef, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { getAlbums, AlbumRow, updateAlbumMeta, deleteAlbum, getAlbum, restoreAlbum } from "@/services/albumService";
import { OptionItem, getOptions } from "@/services/optionService";
import { toast } from "@/lib/toast";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { useRouter } from "next/router";
import Link from "next/link";

type AdvancedSearchValues = Record<string, string>;

function ManageAlbums() {
  const router = useRouter();

  const [albums, setAlbums] = useState<AlbumRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selected, setSelected] = useState<AlbumRow | null>(null);
  const [name, setName] = useState("");
  const [transitionIn, setTransitionIn] = useState("");
  const [transitionOut, setTransitionOut] = useState("");
  const [duration, setDuration] = useState<number>(2);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<AlbumRow | null>(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkRestoreConfirm, setShowBulkRestoreConfirm] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const [entranceOptions, setEntranceOptions] = useState<OptionItem[]>([]);
  const [exitOptions, setExitOptions] = useState<OptionItem[]>([]);
  const silentSortFetchRef = useRef(false);

  /* ======================
   * Fetch Albums
   * ====================== */
  const isRowDeleted = (row: any) => {
    if (!row) return false;
    if (row.deleted_at) return true;
    if (row.is_deleted === true) return true;
    if (row.is_deleted === 1 || row.is_deleted === "1") return true;
    if (row.deleted === true) return true;
    if (row.visibility && String(row.visibility).toLowerCase() === "deleted") return true;
    if (row.status && String(row.status).toLowerCase() === "deleted") return true;
    return false;
  };

  const sortRowsClientSide = (rows: AlbumRow[], sortByKey: string, order: string) => {
    const direction = String(order).toLowerCase() === "asc" ? 1 : -1;

    const copy = [...rows];
    copy.sort((a: any, b: any) => {
      const av = a?.[sortByKey];
      const bv = b?.[sortByKey];

      // number
      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * direction;
      }

      // date-ish
      if (sortByKey === "updated_at") {
        const ad = av ? new Date(av).getTime() : 0;
        const bd = bv ? new Date(bv).getTime() : 0;
        return (ad - bd) * direction;
      }

      // string fallback
      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();
      if (as < bs) return -1 * direction;
      if (as > bs) return 1 * direction;
      return 0;
    });
    return copy;
  };

  const fetchAlbums = async (opts?: { silent?: boolean }) => {
    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const res = await getAlbums({
        search,
        name: advancedSearchValues.name || undefined,
        total_images: advancedSearchValues.totalImages || undefined,
        date_updated_from: advancedSearchValues.dateUpdatedFrom || undefined,
        date_updated_to: advancedSearchValues.dateUpdatedTo || undefined,
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        // many backends expect 1/0 rather than true/false
        show_deleted: showDeleted ? 1 : 0,
      }, { silent });

      const apiRows: AlbumRow[] = Array.isArray(res?.data?.data) ? res.data.data : [];
      const filteredRows = showDeleted
        ? apiRows.filter((r: any) => isRowDeleted(r))
        : apiRows.filter((r: any) => !isRowDeleted(r));

      const sortedRows = sortRowsClientSide(filteredRows, sortBy, sortOrder);
      setAlbums(sortedRows);
      setTotalPages(res.data.meta.last_page);
    } catch (err) {
      console.error("Failed to load albums", err);
    } finally {
      if (!(opts?.silent ?? false)) setLoading(false);
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const timeout = setTimeout(() => fetchAlbums({ silent }), 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted, advancedSearchValues]);

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<AlbumRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={selectedIds.length > 0 && selectedIds.length === albums.length}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds(albums.map((a) => a.id));
            else setSelectedIds([]);
          }}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds((prev) => Array.from(new Set([...prev, row.id])));
            else setSelectedIds((prev) => prev.filter((id) => id !== row.id));
          }}
        />
      ),
    },
    {
      key: "name",
      header: "Album Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className={showDeleted || isRowDeleted(row) ? "fw-bold text-decoration-line-through text-muted" : "fw-bold text-primary"}>
          {row.name}
          {(showDeleted || isRowDeleted(row)) && (
            <span className="badge bg-danger ms-2" style={{ fontSize: 11, verticalAlign: "middle" }}>
              Deleted
            </span>
          )}
        </span>
      ),
    },
    {
      key: "total_images",
      header: "Total Images",
      sortable: true,
      sortField: "total_images",
      defaultSortOrder: "desc",
    },
    {
      key: "updated_at",
      header: "Date Updated",
      sortable: true,
      sortField: "updated_at",
      defaultSortOrder: "desc",
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          {showDeleted || isRowDeleted(row) ? (
            <button
              className="btn btn-link p-0 text-success"
              title="Restore album"
              aria-label="Restore album"
              onClick={() => {
                setRestoreTarget(row);
                setShowRestoreConfirm(true);
              }}
            >
              <i className="fas fa-trash-restore" />
            </button>
          ) : (
            <>
              <button
                className="btn btn-link p-0 me-2 text-secondary"
                title="Edit"
                onClick={() => router.push(`/banners/edit/${row.id}`)}
              >
                <i className="fas fa-edit" />
              </button>
              <button
                className="btn btn-link p-0 text-secondary"
                title="Settings: click to open actions (Quick Edit/Delete) for this album"
                aria-label="Settings: click to open actions"
                onClick={(e) => {
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setMenuPos({ top: rect.bottom + window.scrollY, left: rect.left });
                  setSelected(row);
                  setName(row.name);
                  setShowSettingsMenu(true);
                }}
              >
                <i className="fas fa-cogs" />
              </button>
            </>
          )}


        </>
      ),
    },
  ];

  const closeSettings = () => {
    setShowSettings(false);
    setSelected(null);
  };

  const saveSettings = async () => {
    if (!selected) return;
    try {
      // fetch existing album to preserve banners if server would replace missing fields
      const albumRes: any = await getAlbum(selected.id);
      const existingBanners = Array.isArray(albumRes?.data?.banners)
        ? albumRes.data.banners.map((b: any, i: number) => ({ id: b.id, order: i }))
        : [];

      await updateAlbumMeta(selected.id, { name, transition_in: transitionIn, transition_out: transitionOut, transition: duration, banners: existingBanners });
      toast.success("Album updated");
      closeSettings();
      fetchAlbums();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update album");
    }
  };

  // Open quick-edit from the small settings menu: load options and album, then open modal
  const openQuickEditFromMenu = async () => {
    if (!selected) return;
    try {
      const [entranceRes, exitRes] = await Promise.all([
        getOptions({ type: "animation", field_type: "entrance" }),
        getOptions({ type: "animation", field_type: "exit" }),
      ]);
      const entranceData = entranceRes?.data?.data || [];
      const exitData = exitRes?.data?.data || [];
      setEntranceOptions(entranceData);
      setExitOptions(exitData);

      // prefer album's saved transitions when available
      try {
        const albumRes: any = await getAlbum(selected.id);
        const album = albumRes?.data;
        if (album) {
          setTransitionIn(album.transition_in ? String(album.transition_in) : (entranceData[0] ? String(entranceData[0].id) : ""));
          setTransitionOut(album.transition_out ? String(album.transition_out) : (exitData[0] ? String(exitData[0].id) : ""));
          setDuration(album.transition ? Number(album.transition) : 2);
        } else {
          setTransitionIn(entranceData[0] ? String(entranceData[0].id) : "");
          setTransitionOut(exitData[0] ? String(exitData[0].id) : "");
          setDuration(2);
        }
      } catch (err) {
        setTransitionIn(entranceData[0] ? String(entranceData[0].id) : "");
        setTransitionOut(exitData[0] ? String(exitData[0].id) : "");
        setDuration(2);
      }

      setShowSettingsMenu(false);
      setShowSettings(true);
    } catch (err) {
      toast.error("Failed to load options");
      setShowSettingsMenu(false);
    }
  };

  // Bulk delete selected albums
  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteAlbum(id)));
      toast.success(`Deleted ${selectedIds.length} album(s)`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchAlbums();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete selected albums");
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await deleteAlbum(selected.id);
      toast.success("Album deleted");
      setShowDeleteConfirm(false);
      closeSettings();
      fetchAlbums();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete album");
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreAlbum(restoreTarget.id);
      toast.success("Album restored");
      setShowRestoreConfirm(false);
      setRestoreTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== restoreTarget.id));
      setAlbums((prev) => prev.filter((album) => album.id !== restoreTarget.id));
      setShowDeleted(false);
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to restore album");
    }
  };

  const confirmBulkRestore = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => restoreAlbum(id)));
      toast.success(`Restored ${selectedIds.length} album(s)`);
      setAlbums((prev) => prev.filter((album) => !selectedIds.includes(album.id)));
      setSelectedIds([]);
      setShowBulkRestoreConfirm(false);
      setShowDeleted(false);
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to restore selected albums");
    }
  };

  const openDeleteConfirm = () => setShowDeleteConfirm(true);
  const cancelDelete = () => setShowDeleteConfirm(false);

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">Manage Albums</h3>

      <SearchBar
        placeholder="Search by Album"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}

        actionsMenu={(
          <>
            {showDeleted ? (
              <button
                className="list-group-item list-group-item-action text-success"
                onClick={() => { setShowBulkRestoreConfirm(true); }}
              >
                Restore
              </button>
            ) : (
              <button
                className="list-group-item list-group-item-action text-danger"
                onClick={() => { setShowBulkDeleteConfirm(true); }}
              >
                Delete
              </button>
            )}
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
              href="/banners/create"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 24px", whiteSpace: "nowrap" }}
            >
              Create Album
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
          { name: "name", label: "Album Name" },
          { name: "totalImages", label: "Total Images" },
          { name: "dateUpdatedFrom", label: "Date Updated (From)", type: "date" },
          { name: "dateUpdatedTo", label: "Date Updated (To)", type: "date" },
        ]}
        initialSortBy={sortBy === 'updated_at' ? 'modified' : (sortBy === 'name' ? 'title' : sortBy)}
        initialSortOrder={sortOrder}
        initialShowDeleted={showDeleted}
        initialPerPage={perPage}
        onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, showDeleted: sDeleted, perPage: sPerPage, advancedValues }) => {
          setSortBy(sBy === 'modified' ? 'updated_at' : sBy === 'title' ? 'name' : sBy);
          setSortOrder(sOrder);
          setShowDeleted(sDeleted);
          setPerPage(sPerPage);
          setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
          setCurrentPage(1);
        }}
      />

      <DataTable<AlbumRow>
        columns={columns}
        data={albums}
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

      {/* Quick Settings Modal */}
      {showSettings && selected && (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="card" style={{ width: 480 }}>
              <div className="card-body">
                <h5 className="card-title">Quick Edit Album</h5>

                <div className="mb-2">
                  <label className="form-label">Album Name</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div className="mb-2">
                  <label className="form-label">Transition In</label>
                  <select className="form-control" value={transitionIn} onChange={(e) => setTransitionIn(e.target.value)}>
                    <option value="">Select</option>
                    {entranceOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Transition Out</label>
                  <select className="form-control" value={transitionOut} onChange={(e) => setTransitionOut(e.target.value)}>
                    <option value="">Select</option>
                    {exitOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Transition Duration (seconds)</label>
                  <input
                    type="range"
                    className="form-range"
                    min={1}
                    max={10}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                  <small className="text-muted">{duration}s</small>
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary" onClick={saveSettings}>Save</button>
                  <button className="btn btn-danger" onClick={openDeleteConfirm}>Delete</button>
                  <button className="btn btn-secondary" onClick={closeSettings}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={showDeleteConfirm && !!selected}
        title="Confirm Delete"
        message={(
          <p>Are you sure you want to delete the album <strong>{selected?.name}</strong>? This action cannot be undone.</p>
        )}
        onConfirm={handleDelete}
        onCancel={cancelDelete}
      />

      <ConfirmModal
        show={showRestoreConfirm && !!restoreTarget}
        title="Restore Album"
        message={(
          <p>Restore <strong>{restoreTarget?.name}</strong>?</p>
        )}
        confirmLabel="Restore"
        danger={false}
        confirmVariant="success"
        accentVariant="success"
        onConfirm={handleRestore}
        onCancel={() => {
          setShowRestoreConfirm(false);
          setRestoreTarget(null);
        }}
      />

      {/* Small anchored dropdown menu (near cog icon) */}
      {showSettingsMenu && selected && menuPos && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 1055 }} onClick={() => setShowSettingsMenu(false)} />
          <div style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 1060 }}>
            <div className="card shadow-sm compact-dropdown" style={{ width: 120 }}>
                <div className="list-group list-group-flush">
                  <button
                    className="list-group-item list-group-item-action"
                    onClick={openQuickEditFromMenu}
                    style={{padding:'6px 8px'}}
                    title="Click to quickly edit this album"
                    aria-label="Quick edit album"
                  >
                    Quick Edit
                  </button>
                  <button
                    className="list-group-item list-group-item-action text-danger"
                    onClick={() => { setShowSettingsMenu(false); setShowDeleteConfirm(true); }}
                    style={{padding:'6px 8px'}}
                    title="Click to delete this album"
                    aria-label="Delete album"
                  >
                    Delete
                  </button>
                </div>
              </div>
          </div>
        </>
      )}

      <ConfirmModal
        show={showBulkDeleteConfirm}
        title="Confirm Album(s) Delete"
        message={(
          <p>Are you sure you want to delete the selected <strong>{selectedIds.length}</strong> album(s)? This action cannot be undone.</p>
        )}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      <ConfirmModal
        show={showBulkRestoreConfirm}
        title="Restore Album(s)"
        message={(
          <p>Restore selected <strong>{selectedIds.length}</strong> album(s)?</p>
        )}
        confirmLabel="Restore"
        danger={false}
        confirmVariant="success"
        accentVariant="success"
        onConfirm={confirmBulkRestore}
        onCancel={() => setShowBulkRestoreConfirm(false)}
      />
    </div>
  );
}

ManageAlbums.Layout = AdminLayout;
export default ManageAlbums;
