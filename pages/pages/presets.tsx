"use client";

import Tooltip from "@/components/UI/Tooltip";
import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import {
  layoutPresetService,
  LayoutPreset,
} from "@/services/layoutPresetService";
import ConfirmModal from "@/components/UI/ConfirmModal";
import CategoryCombobox from "@/components/UI/CategoryCombobox";
import { toast } from "@/lib/toast";

type AdvancedSearchValues = Record<string, string>;

function PresetPage() {
  const [presets, setPresets] = useState<LayoutPreset[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [recentlyDeletedPresets, setRecentlyDeletedPresets] = useState<LayoutPreset[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("recentlyDeletedPresets_layout_presets");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LayoutPreset[];
      // prune entries older than 14 days
      const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
      return parsed.filter((p: any) => {
        try {
          return p?.deleted_at ? new Date(p.deleted_at).getTime() >= cutoff : true;
        } catch {
          return true;
        }
      });
    } catch {
      return [];
    }
  });

  // persist recently deleted presets so Trash view survives page refresh
  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem("recentlyDeletedPresets_layout_presets", JSON.stringify(recentlyDeletedPresets));
    } catch {
      // ignore
    }
  }, [recentlyDeletedPresets]);

  /* =========================
   Fetch Presets
  ========================== */
  const isRowDeleted = (row: any) => {
    if (row?.deleted_at) return true;
    if (row?.is_deleted) return true;
    const visibility = (row?.visibility ?? "").toString().trim().toLowerCase();
    if (visibility === "deleted") return true;
    const status = ((row as any)?.status ?? "").toString().trim().toLowerCase();
    if (status === "deleted") return true;
    return false;
  };

  const markRowDeletedLocal = (row: any) => {
    const nowIso = new Date().toISOString();
    return {
      ...row,
      deleted_at: row.deleted_at ?? nowIso,
      is_deleted: true,
      visibility: row.visibility ?? "Deleted",
      status: (row as any).status ?? "Deleted",
    } as LayoutPreset;
  };

  const fetchPresets = async (overrides?: { sortBy?: string; sortOrder?: string; perPage?: number; showDeleted?: boolean; page?: number; search?: string; silent?: boolean }) => {
    try {
      const silent = overrides?.silent ?? false;
      if (!silent) setLoading(true);

      const useSearch = overrides?.search ?? search;
      const usePage = overrides?.page ?? currentPage;
      const usePerPage = overrides?.perPage ?? perPage;
      const useSortBy = overrides?.sortBy ?? sortBy;
      const useSortOrder = (overrides?.sortOrder
        ? (String(overrides.sortOrder).toLowerCase() === "asc" ? "asc" : "desc")
        : sortOrder) as "asc" | "desc";
      const useShowDeleted = overrides?.showDeleted ?? showDeleted;

      const deletedFlag = useShowDeleted ? 1 : 0;

      const params: any = {
        search: useSearch,
        name: advancedSearchValues.name || undefined,
        category: advancedSearchValues.category || undefined,
        status: advancedSearchValues.status || undefined,
        page: usePage,
        per_page: usePerPage,
        sort_by: useSortBy === "modified" ? "name" : useSortBy,
        sort_order: useSortOrder,
        ...(deletedFlag
          ? {
              show_deleted: deletedFlag,
              with_trashed: 1,
              only_trashed: 1,
              only_deleted: 1,
            }
          : {}),
      };

      let res: any;
      try {
        res = await layoutPresetService.getAll(params as any);
      } catch (err: any) {
        console.error("layoutPresets.getAll failed", err?.response?.status, err?.response?.data || err?.message);
        // If the backend rejects complex params (422/500), retry with a minimal param set.
        const simpleParams: any = {
          search: useSearch,
          page: usePage,
          per_page: usePerPage,
        };

        try {
          res = await layoutPresetService.getAll(simpleParams);
        } catch (err2: any) {
          console.error("layoutPresets.getAll fallback failed", err2?.response?.status, err2?.response?.data || err2?.message);
          const serverMsg = err2?.response?.data?.message || err?.response?.data?.message || err2?.message || err?.message;
          toast.error(serverMsg || "Failed to load presets");
          return;
        }
      }

      let apiRows: LayoutPreset[] = Array.isArray(res?.data?.data) ? res.data.data : [];
      let rows: LayoutPreset[] = useShowDeleted ? apiRows.filter(isRowDeleted) : apiRows.filter((r) => !isRowDeleted(r));

      if (useShowDeleted && rows.length === 0) {
        const fallbackParams: any = {
          ...params,
          with_trashed: 1,
        };

        res = await layoutPresetService.getAll(fallbackParams);
        apiRows = Array.isArray(res?.data?.data) ? res.data.data : [];
        rows = apiRows.filter(isRowDeleted);
      }

      if (useShowDeleted && recentlyDeletedPresets.length > 0) {
        const byId = new Map<number, LayoutPreset>();
        for (const r of rows) byId.set((r as any).id, r);
        for (const r of recentlyDeletedPresets) {
          if (!byId.has((r as any).id) && isRowDeleted(r)) byId.set((r as any).id, r);
        }
        rows = Array.from(byId.values());
      }

      rows = sortRowsClientSide(rows, useSortBy === "modified" ? "name" : useSortBy, useSortOrder);

      setPresets(rows);
      setSelectedIds([]);
      setCurrentPage(res?.data?.meta?.current_page ?? res?.data?.current_page ?? usePage);
      setTotalPages(res?.data?.meta?.last_page ?? res?.data?.last_page ?? 1);
    } catch (err) {
      toast.error("Failed to load presets");
    } finally {
      if (!(overrides?.silent ?? false)) setLoading(false);
    }
  };

  const [form, setForm] = useState({
    name: "",
    category: "",
    thumbnail: null as File | null,
    content: "",
    is_active: true,
  });

  const [editingId, setEditingId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const openAddModal = async () => {
    setEditingId(null);
    setIsEditMode(false);
    setThumbnailPreview(null);

    setForm({
      name: "",
      category: "",
      thumbnail: null,
      content: "",
      is_active: true,
    });

    const bootstrap = await import("bootstrap");
    const modal = new bootstrap.Modal(
      document.getElementById("presetModal")!
    );
    modal.show();
  };

  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [restoreTitle, setRestoreTitle] = useState<string | null>(null);

  const openRestoreConfirm = (id: number, title?: string) => {
    setRestoreId(id);
    setRestoreTitle(title ?? null);
    setRestoreModalOpen(true);
  };

  const doRestore = async () => {
    if (!restoreId) return;
    try {
      await layoutPresetService.restore(restoreId);
      toast.success("Preset restored");
      setRestoreModalOpen(false);
      setRecentlyDeletedPresets((prev) => prev.filter((p) => p.id !== restoreId));
      if (showDeleted) {
        setShowDeleted(false);
        setCurrentPage(1);
        fetchPresets({ showDeleted: false, page: 1 });
      } else {
        fetchPresets();
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.error(serverMsg || "Failed to restore preset");
    }
  };

  const openEditModal = async (preset: LayoutPreset) => {
    setEditingId(preset.id);
    setIsEditMode(true);
    setThumbnailPreview(null);

    setForm({
      name: preset.name,
      category: preset.category || "",
      thumbnail: null,
      content: preset.content,
      is_active: preset.is_active,
    });

    const bootstrap = await import("bootstrap");
    const modal = new bootstrap.Modal(
      document.getElementById("presetModal")!
    );
    modal.show();
  };

  const submitForm = async () => {
    if (!form.name || !form.content) {
      toast.error("Name and content are required.");
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("category", form.category);
    fd.append("content", form.content);
    fd.append("is_active", form.is_active ? "1" : "0");

    if (form.thumbnail) {
      fd.append("thumbnail", form.thumbnail);
    }

    try {
      if (isEditMode && editingId) {
        await layoutPresetService.update(editingId, fd);
        toast.success("Preset updated successfully");
      } else {
        await layoutPresetService.create(fd);
        toast.success("Preset created successfully");
      }

      // Reset form
      setForm({
        name: "",
        category: "",
        thumbnail: null,
        content: "",
        is_active: true,
      });

      setEditingId(null);
      setIsEditMode(false);

      // Reload table
      fetchPresets();

      // Close modal
      const bootstrap = await import("bootstrap");
      const modalEl = document.getElementById("presetModal");
      if (modalEl) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }

    } catch (err) {
      toast.error("Something went wrong.");
    }
  };

  const buildPresetFormData = (preset: Pick<LayoutPreset, "name" | "category" | "content" | "is_active">) => {
    const fd = new FormData();
    fd.append("name", preset.name);
    fd.append("category", preset.category || "");
    fd.append("content", preset.content);
    fd.append("is_active", preset.is_active ? "1" : "0");
    return fd;
  };

  const bulkSetActive = async (active: boolean) => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one preset");
      return;
    }
    if (showDeleted) {
      toast.error("Bulk actions are disabled in Trash view");
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedIds.map(async (id) => {
          const preset = presets.find((item) => item.id === id);
          if (!preset) {
            throw new Error(`Preset ${id} not found`);
          }

          await layoutPresetService.update(
            id,
            buildPresetFormData({
              name: preset.name,
              category: preset.category,
              content: preset.content,
              is_active: active,
            })
          );
        })
      );

      const ok = results.filter((result) => result.status === "fulfilled").length;
      const fail = results.length - ok;
      if (fail === 0) {
        toast.success(`${active ? "Activated" : "Deactivated"} ${ok} preset(s)`);
      } else {
        toast.error(`Updated ${ok}, failed ${fail}`);
      }

      setSelectedIds([]);
      fetchPresets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to update selected presets");
    } finally {
      setLoading(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) {
      setShowBulkDeleteConfirm(false);
      toast.error("Select at least one preset");
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled(
        selectedIds.map(async (id) => {
          await deletePresetSoftFirst(id);
          await rememberDeletedById(id);
        })
      );

      const ok = results.filter((result) => result.status === "fulfilled").length;
      const fail = results.length - ok;
      if (fail === 0) {
        toast.success(`Trashed ${ok} preset(s)`);
      } else {
        toast.error(`Trashed ${ok}, failed ${fail}`);
      }

      setShowBulkDeleteConfirm(false);
      setSelectedIds([]);
      fetchPresets();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to trash selected presets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(fetchPresets, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted, advancedSearchValues]);

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview);
      }
    };
  }, [thumbnailPreview]);

  useEffect(() => {
    setSelectedIds([]);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted]);

  /* =========================
   Sorting (Client Side)
  ========================== */
  const sortRowsClientSide = (
    rows: LayoutPreset[],
    by: string,
    order: "asc" | "desc"
  ) => {
    const direction = order === "asc" ? 1 : -1;
    return [...rows].sort((a: any, b: any) => {
      const av = a?.[by];
      const bv = b?.[by];

      if (typeof av === "boolean") {
        return (Number(av) - Number(bv)) * direction;
      }

      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();

      if (as < bs) return -1 * direction;
      if (as > bs) return 1 * direction;
      return 0;
    });
  };

  const sortedPresets = useMemo(
    () => sortRowsClientSide(presets, sortBy, sortOrder),
    [presets, sortBy, sortOrder]
  );

  const displayRows = useMemo(() => {
    return sortedPresets.map((r, idx) => ({
      ...r,
      seq: (currentPage - 1) * perPage + idx + 1,
    }));
  }, [sortedPresets, currentPage, perPage]);

  const existingCategories = useMemo(() => {
    const cats = presets
      .map((p) => p.category?.trim())
      .filter((c): c is string => !!c);
    return Array.from(new Set(cats)).sort();
  }, [presets]);

  /* =========================
   Delete
  ========================== */
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string | null>(null);

  const openDeleteConfirm = (id: number, title?: string) => {
    setDeleteId(id);
    setDeleteTitle(title ?? null);
    setDeleteModalOpen(true);
  };

  const rememberDeletedById = async (id: number) => {
    const fromList = presets.find((p) => p.id === id);
    if (fromList) {
      const deletedRow = markRowDeletedLocal(fromList);
      setRecentlyDeletedPresets((prev) => {
        const next = [deletedRow, ...prev.filter((p) => p.id !== id)];
        return next.slice(0, 50);
      });
      return;
    }

    try {
      const res = await layoutPresetService.getById(id);
      const deletedRow = markRowDeletedLocal(res.data?.data ?? res.data);
      setRecentlyDeletedPresets((prev) => {
        const next = [deletedRow, ...prev.filter((p) => p.id !== id)];
        return next.slice(0, 50);
      });
    } catch {
      // ignore
    }
  };

  const deletePresetSoftFirst = async (id: number) => {
    try {
      await layoutPresetService.postDelete(id);
      return;
    } catch (err1: any) {
      console.warn("postDelete failed", err1?.response?.status, err1?.response?.data || err1?.message);
      try {
        await layoutPresetService.postMethodDelete(id);
        return;
      } catch (err2: any) {
        console.warn("postMethodDelete failed", err2?.response?.status, err2?.response?.data || err2?.message);
        try {
          await layoutPresetService.postDeleteByPayload(id);
          return;
        } catch (err3: any) {
          console.warn("postDeleteByPayload failed", err3?.response?.status, err3?.response?.data || err3?.message);
          await layoutPresetService.delete(id);
        }
      }
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayRows.map((r) => r.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  /* =========================
   Columns
  ========================== */
  const columns: Column<LayoutPreset>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={displayRows.length > 0 && displayRows.every((r) => selectedIds.includes(r.id))}
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
      key: "seq",
      header: "#",
      width: 60,
      render: (row) => (row as any).seq,
    },
    {
      key: "name",
      header: "Preset Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => (
        <div>
          {showDeleted || isRowDeleted(row) ? (
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-muted" style={{ textDecoration: "line-through" }}>
                {row.name}
              </span>
            </div>
          ) : (
            <span className="fw-bold text-primary">{row.name}</span>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      sortField: "category",
      render: (row) => row.category || "-",
    },
    {
      key: "thumbnail",
      header: "Thumbnail",
      render: (row) =>
        row.thumbnail ? (
          <img
            src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${row.thumbnail}`}
            className="rounded border"
            style={{ width: "60px" }}
          />
        ) : (
          <span className="text-muted small">No Image</span>
        ),
    },
    {
      key: "is_active",
      header: "Status",
      sortable: true,
      sortField: "is_active",
      render: (row) => {
        if (showDeleted || isRowDeleted(row)) {
          return <span className="badge bg-danger">Deleted</span>;
        }
        return (
          <span className={`badge ${row.is_active ? "bg-success" : "bg-secondary"}`}>
            {row.is_active ? "Active" : "Inactive"}
          </span>
        );
      },
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          {showDeleted ? (
            <button
              className="btn btn-link p-0 text-success"
              onClick={() => openRestoreConfirm(row.id, row.name)}
              title="Restore"
            >
              <i className="fas fa-trash-restore"></i>
            </button>
          ) : (
            <>
              <button
                className="btn btn-link p-0 me-2 text-secondary"
                title="Edit"
                onClick={() => openEditModal(row)}
                type="button"
              >
                <i className="fas fa-edit" />
              </button>

              <button
                className="btn btn-link p-0 text-danger"
                title="Delete"
                onClick={() => openDeleteConfirm(row.id, row.name)}
                type="button"
              >
                <i className="fas fa-trash" />
              </button>

              {isRowDeleted(row) && (
                <button
                  className="btn btn-link p-0 ms-2 text-success"
                  onClick={() => openRestoreConfirm(row.id, row.name)}
                  title="Restore"
                >
                  <i className="fas fa-trash-restore"></i>
                </button>
              )}
            </>
          )}
        </>
      ),
    },
  ];

  /* =========================
   UI
  ========================== */
  return (
    <div className="container-fluid px-4 pt-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="mb-0 d-flex align-items-center gap-2">
          Layout Presets
          <Tooltip text="Reusable page layout templates that can be applied when creating or editing pages." />
        </h3>
      </div>
      <SearchBar
        placeholder="Search presets..."
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        actionsMenu={(
          <>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkSetActive(true)}
              type="button"
              disabled={showDeleted || selectedIds.length === 0 || loading}
            >
              Activate
            </button>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkSetActive(false)}
              type="button"
              disabled={showDeleted || selectedIds.length === 0 || loading}
            >
              Deactivate
            </button>
            <button
              className="list-group-item list-group-item-action text-danger"
              onClick={() => setShowBulkDeleteConfirm(true)}
              type="button"
              disabled={showDeleted || selectedIds.length === 0 || loading}
            >
              Delete
            </button>
          </>
        )}
        rightExtras={(
          <div className="d-flex align-items-center gap-2 flex-nowrap">
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

            <button
              type="button"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 18px", whiteSpace: "nowrap" }}
              onClick={openAddModal}
            >
              + Add Preset
            </button>
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
          { name: "name", label: "Preset Name" },
          { name: "category", label: "Category" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "- All Statuses -", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
          onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, showDeleted: sShowDeleted, perPage: sPerPage, advancedValues }) => {
            setSortBy(sBy === "modified" ? "name" : sBy);
            setSortOrder((String(sOrder).toLowerCase() === "asc" ? "asc" : "desc") as "asc" | "desc");
            setPerPage(sPerPage);
            setShowDeleted(!!sShowDeleted);
            setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
            setCurrentPage(1);
          }}
          initialSortBy={sortBy}
          initialSortOrder={sortOrder}
          initialShowDeleted={showDeleted}
          initialPerPage={perPage}
      />

      <DataTable<LayoutPreset>
        columns={columns}
        data={displayRows as any}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => {
          setPerPage(n);
          setCurrentPage(1);
        }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextBy, nextOrder) => {
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />

      {showDeleted && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mt-3" role="alert">
          <div>
            <strong>Trash view:</strong> showing deleted presets only.
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowDeleted(false)}>
            Back to list
          </button>
        </div>
      )}

      <ConfirmModal
        show={restoreModalOpen}
        title="Restore preset"
        message={<>You want to restore <strong>{restoreTitle}</strong>?</>}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        danger={false}
        confirmVariant="success"
        accentVariant="success"
        onConfirm={doRestore}
        onCancel={() => setRestoreModalOpen(false)}
      />

      <ConfirmModal
        show={deleteModalOpen}
        title="Move preset to Trash"
        message={<>Move <strong>{deleteTitle}</strong> to Trash? You can restore it later from the deleted list.</>}
        confirmLabel="Trash"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            setLoading(true);
            await deletePresetSoftFirst(deleteId);
            await rememberDeletedById(deleteId);
            toast.success("Preset deleted");
            setDeleteModalOpen(false);
            fetchPresets();
            return;
          } catch (err: any) {
            const serverMsg = err?.response?.data?.message || err?.message;
            toast.error(serverMsg || 'Failed to delete preset');
            return;
          } finally {
            setLoading(false);
          }
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <ConfirmModal
        show={showBulkDeleteConfirm}
        title="Move presets to Trash"
        message={<>Move selected <strong>{selectedIds.length}</strong> preset(s) to Trash?</>}
        confirmLabel="Trash"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      <div className="modal fade" id="presetModal" tabIndex={-1}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {isEditMode ? "Edit Preset" : "Add Preset"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
              />
            </div>

            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label d-flex align-items-center">
                  Name
                  <Tooltip text="Name of the layout preset used to identify it when selecting templates." />
                </label>
                <input
                  className="form-control"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>

              <div className="mb-3">
                <label className="form-label d-flex align-items-center">
                  Category
                  <Tooltip text="Optional grouping for presets such as Landing Pages, Hero Sections, or Contact Pages." />
                </label>
                <CategoryCombobox
                  value={form.category}
                  onChange={(val) => setForm({ ...form, category: val })}
                  suggestions={existingCategories}
                  placeholder="Type or select a category..."
                />
              </div>

              <div className="mb-3">
                <label className="form-label d-flex align-items-center">
                  Thumbnail Image
                  <Tooltip text="Preview image displayed when selecting this preset. Recommended size: around 600x400px." />
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;

                    setForm({ ...form, thumbnail: file });

                    if (file) {
                      setThumbnailPreview(URL.createObjectURL(file));
                    } else {
                      setThumbnailPreview(null);
                    }
                  }}
                />
                {/* New Upload Preview */}
                {thumbnailPreview && (
                  <div className="mb-3">
                    <label className="form-label d-flex align-items-center">
                      Preview
                      <Tooltip text="Preview of the uploaded thumbnail image." />
                    </label>
                    <img
                      src={thumbnailPreview}
                      className="img-fluid rounded border"
                      alt="Thumbnail Preview"
                    />
                  </div>
                )}
                {/* Current Thumbnail (Edit Mode) */}
                  {isEditMode && !form.thumbnail && (
                    <div className="mb-3">
                      <label className="form-label d-flex align-items-center">
                        Current Thumbnail
                        <Tooltip text="Existing thumbnail image currently assigned to this preset." />
                      </label>
                      <img
                        src={`${process.env.NEXT_PUBLIC_API_URL}/storage/${
                          presets.find(p => p.id === editingId)?.thumbnail
                        }`}
                        className="img-fluid rounded border"
                        alt="Current Thumbnail"
                      />
                    </div>
                  )}
              </div>

              <div className="mb-3">
                <label className="form-label d-flex align-items-center">
                  Content
                  <Tooltip text="HTML layout structure that will be inserted into the page editor when this preset is selected." />
                </label>
                <textarea
                  className="form-control"
                  rows={6}
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>

              <div className="form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                <label className="form-check-label d-flex align-items-center">
                  Active
                  <Tooltip text="Only active presets will appear in the layout preset selector when creating pages." />
                </label>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>

              <button
                className="btn btn-primary"
                onClick={submitForm}
              >
                {isEditMode ? "Update" : "Save"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

PresetPage.Layout = AdminLayout;
export default PresetPage;
