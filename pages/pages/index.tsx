import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { useEffect, useState, useRef } from "react";
import { getPages, getPageById, restorePage, deletePage, postDeletePage, postMethodDeletePage, postDeleteByPayload, updatePageStatus, updatePage } from "@/services/pageService";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { toast } from "@/lib/toast";
import { useRouter } from "next/router";
import Link from "next/link";
import { isDefaultProtectedPage } from "@/lib/defaultPages";
import { buildPublicPageMenuTarget } from "@/lib/publicMenuLinks";
import { TableOptionsMenu, TableRowActions } from "@/components/UI/TableRowActions";

interface PageRow {
  id: number;
  title: string;
  url: string;
  label: string;
  visibility: string;
  lastModified: string;
  slug?: string;
  deleted_at?: string | null;
  is_deleted?: boolean;
}

type PageAdvancedSearchValues = Record<string, string>;

export default function ManagePages() {
  const router = useRouter();
  const [pages, setPages] = useState<PageRow[]>([]);
  const [recentlyDeletedPages, setRecentlyDeletedPages] = useState<PageRow[]>([]);
  const [isLoading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [showDeleted, setShowDeleted] = useState(false);
  const [sortBy, setSortBy] = useState<string>('modified');
  const [sortOrder, setSortOrder] = useState<string>('desc');
  const [advancedSearchValues, setAdvancedSearchValues] = useState<PageAdvancedSearchValues>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [restoreModalOpen, setRestoreModalOpen] = useState(false);
  const [restoreId, setRestoreId] = useState<number | null>(null);
  const [restoreTitle, setRestoreTitle] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteTitle, setDeleteTitle] = useState<string | null>(null);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<number[]>([]);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const silentSortFetchRef = useRef(false);
  const hasMountedSearchRef = useRef(false);
  const activeFetchKeyRef = useRef<string | null>(null);
  const latestFetchSeqRef = useRef(0);
  const lastRateLimitToastAtRef = useRef(0);

  const applySort = (next: { sortBy?: string; sortOrder?: string }) => {
    const nextSortBy = next.sortBy ?? sortBy;
    const nextSortOrder = next.sortOrder ?? sortOrder;
    silentSortFetchRef.current = true;
    setSortBy(nextSortBy);
    setSortOrder(nextSortOrder);
    setCurrentPage(1);
  };

  const toggleSortField = (field: string, defaultOrder: 'asc' | 'desc') => {
    const normalizedField = field.toString();
    if (sortBy === normalizedField) {
      applySort({ sortOrder: (sortOrder === 'asc' ? 'desc' : 'asc') });
      return;
    }
    applySort({ sortBy: normalizedField, sortOrder: defaultOrder });
  };

  const SortHeader = ({ label, field, defaultOrder }: { label: string; field: string; defaultOrder: 'asc' | 'desc' }) => {
    const active = sortBy === field;
    const iconClass = !active
      ? 'fas fa-sort text-muted'
      : (sortOrder === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down');

    return (
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none d-inline-flex align-items-center gap-1"
        style={{ color: 'inherit', fontWeight: 600 }}
        onClick={() => toggleSortField(field, defaultOrder)}
        aria-label={`Sort by ${label}`}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        <i className={iconClass} />
      </button>
    );
  };

  const isRowDeleted = (row: PageRow) => {
    if (row.deleted_at) return true;
    if (row.is_deleted) return true;

    const visibility = (row.visibility ?? "").toString().trim().toLowerCase();
    if (visibility === "deleted") return true;

    const status = ((row as any).status ?? "").toString().trim().toLowerCase();
    if (status === "deleted") return true;

    return false;
  };

  const normalizePageStatus = (row: any) => {
    if (isRowDeleted(row)) return "deleted";
    const raw = (row.status ?? row.visibility ?? "").toString().trim().toLowerCase();
    if (!raw) return "";
    if (raw === "publish" || raw === "published" || raw === "public") return "published";
    if (raw === "private") return "private";
    if (raw === "draft") return "draft";
    if (raw === "deleted") return "deleted";
    return raw;
  };

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case "published":
        return "badge bg-success";
      case "private":
        return "badge bg-secondary";
      case "draft":
        return "badge bg-info text-dark";
      case "deleted":
        return "badge bg-danger";
      default:
        return "badge bg-light text-dark border";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "published":
        return "Published";
      case "private":
        return "Private";
      case "draft":
        return "Draft";
      case "deleted":
        return "Deleted";
      default:
        return status ? status.charAt(0).toUpperCase() + status.slice(1) : "—";
    }
  };

  const getPageViewUrl = (row: PageRow) => {
    const status = normalizePageStatus(row);
    if (status === "published" && row.slug) {
      return buildPublicPageMenuTarget(row.slug);
    }
    return `/pages/preview/${row.id}`;
  };

  const getPageViewHint = (row: PageRow) => {
    const status = normalizePageStatus(row);
    if (status === "published" && row.slug) {
      return buildPublicPageMenuTarget(row.slug);
    }
    return "Private preview available in admin";
  };

  const isProtectedRow = (row: PageRow) => isDefaultProtectedPage(row) && !isRowDeleted(row);

  const selectablePageIds = pages
    .filter((row) => !isProtectedRow(row))
    .map((row) => row.id);

  const actionableSelectedIds = selectedIds.filter((id) => {
    const row = pages.find((page) => page.id === id);
    return row ? !isProtectedRow(row) : true;
  });

  const sortRowsClientSide = (rows: PageRow[], sortByValue: string, sortOrderValue: string) => {
    const order = (sortOrderValue ?? "desc").toString().toLowerCase() === "asc" ? 1 : -1;
    const by = (sortByValue ?? "modified").toString().toLowerCase();

    const getTitle = (r: any) => (r?.label ?? r?.title ?? "").toString().toLowerCase();
    const getModifiedMs = (r: any) => {
      const raw = r?.lastModified ?? r?.updated_at ?? r?.updatedAt ?? r?.modified_at ?? r?.created_at;
      const ms = raw ? new Date(raw).getTime() : NaN;
      return Number.isFinite(ms) ? ms : 0;
    };

    return rows
      .map((r, idx) => ({ r, idx }))
      .sort((a, b) => {
        let cmp = 0;
        if (by === "title") {
          cmp = getTitle(a.r).localeCompare(getTitle(b.r));
        } else {
          cmp = getModifiedMs(a.r) - getModifiedMs(b.r);
        }
        if (cmp === 0) cmp = a.idx - b.idx;
        return cmp * order;
      })
      .map((x) => x.r);
  };

  const markRowDeletedLocal = (row: PageRow): PageRow => {
    const nowIso = new Date().toISOString();
    return {
      ...row,
      deleted_at: row.deleted_at ?? nowIso,
      is_deleted: true,
      visibility: (row.visibility ?? "").toString().trim() ? (row.visibility as any) : "Deleted",
      // If backend uses visibility/status as Deleted, keep it consistent.
      ...(String((row.visibility ?? "")).toLowerCase() === "deleted" ? {} : { visibility: "Deleted" } as any),
      ...(String(((row as any).status ?? "")).toLowerCase() === "deleted" ? {} : { status: "Deleted" } as any),
    };
  };

  const rememberDeletedById = async (id: number) => {
    // Try to capture the row from current list first
    const fromList = pages.find((p) => p.id === id);
    if (fromList) {
      const deletedRow = markRowDeletedLocal(fromList);
      setRecentlyDeletedPages((prev) => {
        const next = [deletedRow, ...prev.filter((p) => p.id !== id)];
        return next.slice(0, 50);
      });
      return;
    }

    // Fallback: try to fetch by id (may fail if hard-deleted)
    try {
      const res = await getPageById(id);
      const deletedRow = markRowDeletedLocal(res.data?.data ?? res.data);
      setRecentlyDeletedPages((prev) => {
        const next = [deletedRow, ...prev.filter((p) => p.id !== id)];
        return next.slice(0, 50);
      });
    } catch {
      // ignore
    }
  };

  const deletePageSoftFirst = async (id: number) => {
    // Prefer soft-delete endpoints first (POST action variants), then fallback to DELETE.
    // This increases likelihood the page is soft-deleted (restorable) instead of permanently removed.
    try {
      await postDeletePage(id);
      return;
    } catch (err1: any) {
      console.warn('postDeletePage failed', err1?.response?.status, err1?.response?.data || err1?.message);
      try {
        await postMethodDeletePage(id);
        return;
      } catch (err2: any) {
        console.warn('postMethodDeletePage failed', err2?.response?.status, err2?.response?.data || err2?.message);
        try {
          await postDeleteByPayload(id);
          return;
        } catch (err3: any) {
          console.warn('postDeleteByPayload failed', err3?.response?.status, err3?.response?.data || err3?.message);
          await deletePage(id);
        }
      }
    }
  };

  const bulkUpdateStatus = async (status: "published" | "private") => {
    if (actionableSelectedIds.length === 0) {
      toast.error("Select at least one page");
      return;
    }
    if (showDeleted) {
      toast.error("Bulk actions are disabled in Trash view");
      return;
    }

    try {
      setLoading(true);
      const results = await Promise.allSettled(
        actionableSelectedIds.map(async (id) => {
          try {
            await updatePage(id, { status });
          } catch {
            await updatePageStatus(id, status as any);
          }
        })
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      if (fail === 0) toast.success(`Updated ${ok} page(s) to ${status}`);
      else toast.error(`Updated ${ok}, failed ${fail}`);
      setSelectedIds([]);
      setSelectAll(false);
      fetchPages();
    } finally {
      setLoading(false);
    }
  };

  const openBulkDeleteConfirm = () => {
    if (actionableSelectedIds.length === 0) {
      toast.error("Select at least one page");
      return;
    }
    if (showDeleted) {
      toast.error("Bulk delete is disabled in Trash view");
      return;
    }
    setBulkDeleteIds(actionableSelectedIds);
    setBulkDeleteModalOpen(true);
  };

  const doBulkDelete = async () => {
    if (bulkDeleteIds.length === 0) return;
    try {
      setLoading(true);
      const results = await Promise.allSettled(
        bulkDeleteIds.map(async (id) => {
          await deletePageSoftFirst(id);
          await rememberDeletedById(id);
        })
      );
      const ok = results.filter((r) => r.status === "fulfilled").length;
      const fail = results.length - ok;
      if (fail === 0) toast.success(`Deleted ${ok} page(s)`);
      else toast.error(`Deleted ${ok}, failed ${fail}`);
      setBulkDeleteModalOpen(false);
      setBulkDeleteIds([]);
      setSelectedIds([]);
      setSelectAll(false);
      fetchPages();
    } finally {
      setLoading(false);
    }
  };

  const fetchPages = async (overrides?: { sortBy?: string; sortOrder?: string; perPage?: number; showDeleted?: boolean; page?: number; search?: string; advancedSearchValues?: PageAdvancedSearchValues; silent?: boolean }) => {
    const silent = overrides?.silent ?? false;
    const useSearch = overrides?.search ?? search;
    const useAdvancedSearchValues = overrides?.advancedSearchValues ?? advancedSearchValues;
    const usePage = overrides?.page ?? currentPage;
    const usePerPage = overrides?.perPage ?? perPage;
    const useSortBy = overrides?.sortBy ?? sortBy;
    const useSortOrder = overrides?.sortOrder ?? sortOrder;
    const useShowDeleted = overrides?.showDeleted ?? showDeleted;
    const requestKey = JSON.stringify({
      search: useSearch,
      advancedSearchValues: useAdvancedSearchValues,
      page: usePage,
      perPage: usePerPage,
      sortBy: useSortBy,
      sortOrder: useSortOrder,
      showDeleted: useShowDeleted,
    });

    if (activeFetchKeyRef.current === requestKey) {
      return;
    }

    activeFetchKeyRef.current = requestKey;
    const fetchSeq = ++latestFetchSeqRef.current;

    try {
      if (!silent) setLoading(true);

      const deletedFlag = useShowDeleted ? 1 : 0;

      const params: any = {
        search: useSearch,
        title: useAdvancedSearchValues.title || undefined,
        label: useAdvancedSearchValues.label || undefined,
        content: useAdvancedSearchValues.content || undefined,
        album: useAdvancedSearchValues.album || undefined,
        last_modified_by: useAdvancedSearchValues.lastModifiedBy || undefined,
        visibility: useAdvancedSearchValues.visibility || undefined,
        seo_title: useAdvancedSearchValues.seoTitle || undefined,
        seo_description: useAdvancedSearchValues.seoDescription || undefined,
        seo_keyword: useAdvancedSearchValues.seoKeyword || undefined,
        date_modified_from: useAdvancedSearchValues.dateFrom || undefined,
        date_modified_to: useAdvancedSearchValues.dateTo || undefined,
        page: usePage,
        per_page: usePerPage,
        // sorting
        sort_by: useSortBy,
        sort_order: useSortOrder,
        // Prefer numeric flags for backend query parsing (common in PHP/Laravel).
        // When toggled on, treat this as a Trash view (only deleted rows).
        show_deleted: deletedFlag,
        ...(deletedFlag
          ? {
              // common soft-delete query contracts
              with_trashed: 1,
              only_trashed: 1,
              only_deleted: 1,
            }
          : {}),
      };

      let res = await getPages(params, { silent });
      let apiRows: PageRow[] = res.data.data;
      // Be defensive: some APIs may still include deleted rows even when show_deleted=0.
      // Keep deleted rows exclusively in the Trash view.
      let rows = useShowDeleted ? apiRows.filter(isRowDeleted) : apiRows.filter((r) => !isRowDeleted(r));

      // If backend doesn't support only_trashed/only_deleted but does support include-deleted,
      // retry with a simpler contract and keep Trash-only behavior via client-side filtering.
      if (useShowDeleted && rows.length === 0) {
        const fallbackParams: any = {
          search: useSearch,
          title: useAdvancedSearchValues.title || undefined,
          label: useAdvancedSearchValues.label || undefined,
          content: useAdvancedSearchValues.content || undefined,
          album: useAdvancedSearchValues.album || undefined,
          last_modified_by: useAdvancedSearchValues.lastModifiedBy || undefined,
          visibility: useAdvancedSearchValues.visibility || undefined,
          seo_title: useAdvancedSearchValues.seoTitle || undefined,
          seo_description: useAdvancedSearchValues.seoDescription || undefined,
          seo_keyword: useAdvancedSearchValues.seoKeyword || undefined,
          date_modified_from: useAdvancedSearchValues.dateFrom || undefined,
          date_modified_to: useAdvancedSearchValues.dateTo || undefined,
          page: usePage,
          per_page: usePerPage,
          sort_by: useSortBy,
          sort_order: useSortOrder,
          show_deleted: 1,
          with_trashed: 1,
        };

        res = await getPages(fallbackParams, { silent });
        apiRows = res.data.data;
        rows = apiRows.filter(isRowDeleted);
      }

      if (fetchSeq !== latestFetchSeqRef.current) {
        return;
      }

      // Merge in any locally-cached recently deleted rows so Trash view feels immediate
      if (useShowDeleted && recentlyDeletedPages.length > 0) {
        const byId = new Map<number, PageRow>();
        for (const r of rows) byId.set(r.id, r);
        for (const r of recentlyDeletedPages) {
          if (!byId.has(r.id) && isRowDeleted(r)) byId.set(r.id, r);
        }
        rows = Array.from(byId.values());
      }

      // Client-side sort fallback (some APIs ignore sort_by/sort_order).
      rows = sortRowsClientSide(rows, useSortBy, useSortOrder);

      setPages(rows);
      setSelectedIds([]);
      setSelectAll(false);
      setCurrentPage(res.data.meta.current_page);
      setTotalPages(res.data.meta.last_page);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        const now = Date.now();
        if (!silent && now - lastRateLimitToastAtRef.current > 3000) {
          toast.error("Too many page requests. Please wait a moment and try again.");
          lastRateLimitToastAtRef.current = now;
        }
        return;
      }

      const serverMsg = err?.response?.data?.message || err?.message;
      if (!silent) {
        toast.error(serverMsg || "Failed to load pages");
      }
      console.error("Failed to load pages", err);
    } finally {
      if (activeFetchKeyRef.current === requestKey) {
        activeFetchKeyRef.current = null;
      }
      if (!(overrides?.silent ?? false)) setLoading(false);
    }
  };

  useEffect(() => {
    if (!hasMountedSearchRef.current) {
      hasMountedSearchRef.current = true;
      return;
    }

    const timeout = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
        return;
      }
      void fetchPages({ page: 1, search });
    }, 400);

    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    fetchPages({ silent });
  }, [currentPage, perPage, showDeleted, sortBy, sortOrder, advancedSearchValues]);

  const handleApplyFilters = (filters: { sortBy: string; sortOrder: string; showDeleted: boolean; perPage: number; advancedValues?: PageAdvancedSearchValues }) => {
    const nextAdvancedSearchValues = filters.advancedValues ?? advancedSearchValues;
    const willTriggerEffect =
      sortBy !== filters.sortBy ||
      sortOrder !== filters.sortOrder ||
      perPage !== filters.perPage ||
      showDeleted !== filters.showDeleted ||
      currentPage !== 1 ||
      JSON.stringify(advancedSearchValues) !== JSON.stringify(nextAdvancedSearchValues);

    setSortBy(filters.sortBy);
    setSortOrder(filters.sortOrder);
    setPerPage(filters.perPage);
    setShowDeleted(filters.showDeleted);
    setAdvancedSearchValues(nextAdvancedSearchValues);
    setCurrentPage(1);

    if (!willTriggerEffect) {
      void fetchPages({
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        perPage: filters.perPage,
        showDeleted: filters.showDeleted,
        advancedSearchValues: nextAdvancedSearchValues,
        page: 1,
      });
    }
  };

  const openRestoreConfirm = (id: number, title?: string) => {
    setRestoreId(id);
    setRestoreTitle(title ?? null);
    setRestoreModalOpen(true);
  };

  const doRestore = async () => {
    if (!restoreId) return;
    try {
      await restorePage(restoreId);
      toast.success("Page restored");
      setRestoreModalOpen(false);
      setRecentlyDeletedPages((prev) => prev.filter((p) => p.id !== restoreId));
      // If we restored from Trash, bounce back to the main list automatically.
      if (showDeleted) {
        setShowDeleted(false);
        setCurrentPage(1);
      } else {
        fetchPages();
      }
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message || err?.message;
      toast.error(serverMsg || "Failed to restore page");
    }
  };

  const columns: Column<PageRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={selectablePageIds.length > 0 && selectablePageIds.every((id) => selectedIds.includes(id))}
          disabled={selectablePageIds.length === 0}
          onChange={() => {
            const nextChecked = !(selectablePageIds.length > 0 && selectablePageIds.every((id) => selectedIds.includes(id)));
            if (nextChecked) {
              setSelectedIds(selectablePageIds);
              setSelectAll(true);
            } else {
              setSelectedIds([]);
              setSelectAll(false);
            }
          }}
        />
      ),
      render: (row: any) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          disabled={isProtectedRow(row)}
          title={isProtectedRow(row) ? "Default pages cannot be selected" : undefined}
          onChange={() => {
            if (isProtectedRow(row)) return;
            setSelectedIds((prev) =>
              prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id]
            );
          }}
        />
      ),
    },
    {
      key: "title",
      header: <SortHeader label="Title" field="title" defaultOrder="asc" />,
      render: (row: any) => (
        <div>
          {showDeleted || isRowDeleted(row) ? (
            <div className="d-flex align-items-center gap-2">
              <span className="fw-bold text-muted" style={{ textDecoration: "line-through" }}>
                {row.title}
              </span>
            </div>
          ) : (
            <a
              href={getPageViewUrl(row)}
              target="_blank"
              rel="noreferrer"
              className="text-primary fw-bold"
            >
              {row.title}
            </a>
          )}

          <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>
            {getPageViewHint(row)}
          </div>
        </div>
      ),
    },
    { key: "label", header: "Label" },
    {
      key: "visibility",
      header: "Visibility",
      render: (row: any) => {
        const s = normalizePageStatus(row);
        return <span className={statusBadgeClass(s)}>{statusLabel(s)}</span>;
      },
    },
    { key: "lastModified", header: <SortHeader label="Last Modified" field="modified" defaultOrder="desc" /> },
    {
      key: "options",
      header: "Options",
      render: (row: any) => (
        <TableRowActions>
          {showDeleted ? (
            <button
              className="btn btn-link p-0 text-success"
              onClick={() => openRestoreConfirm(row.id, row.label || row.title)}
              title="Restore"
              type="button"
            >
              <i className="fas fa-trash-restore" />
            </button>
          ) : (
            <>
              <button
                className="btn btn-link p-0 text-secondary"
                onClick={() => window.open(getPageViewUrl(row), "_blank", "noopener,noreferrer")}
                title="View"
                type="button"
              >
                <i className="fas fa-eye" />
              </button>

              <button
                className="btn btn-link p-0 text-secondary"
                onClick={() => router.push(`/pages/edit/${row.id}`)}
                title="Edit"
                type="button"
              >
                <i className="fas fa-edit" />
              </button>

              {!isProtectedRow(row) && <SettingsMenu row={row} />}

              {isRowDeleted(row) && (
                <button
                  className="btn btn-link p-0 text-success"
                  onClick={() => openRestoreConfirm(row.id, row.label || row.title)}
                  title="Restore"
                  type="button"
                >
                  <i className="fas fa-trash-restore" />
                </button>
              )}
            </>
          )}
        </TableRowActions>
      ),
    },
  ];

  function SettingsMenu({ row }: { row: any }) {
    const handleDelete = () => {
      setDeleteId(row.id);
      setDeleteTitle(row.label || row.title);
      setDeleteModalOpen(true);
    };

    const handleToggleStatus = async () => {
      const current = (row.visibility || row.status || '').toString().toLowerCase();
      const newStatus = (current === 'published' ? 'private' : 'published') as "published" | "private" | "draft";
      try {
        await updatePage(row.id, { status: newStatus });
        toast.success(`Status updated to ${newStatus}`);
        fetchPages();
        return;
      } catch (putErr: any) {
        console.warn('updatePage (PUT) failed, trying PATCH', putErr?.response?.status);
        try {
          await updatePageStatus(row.id, newStatus);
          toast.success(`Status updated to ${newStatus}`);
          fetchPages();
          return;
        } catch (patchErr: any) {
          console.error('Both PUT and PATCH failed', { putErr, patchErr });
          const serverMsg = patchErr?.response?.data?.message || putErr?.response?.data?.message || patchErr?.message || putErr?.message;
          toast.error(serverMsg || 'Failed to update status');
        }
      }
    };

    const currentStatus = (row.visibility || row.status || "").toString().toLowerCase();
    const toggleLabel = currentStatus === "published" ? "Set Private" : "Publish";

    return (
      <TableOptionsMenu
        title="Page actions"
        header="Actions"
        items={[
          {
            label: toggleLabel,
            onClick: handleToggleStatus,
          },
          ...(!isRowDeleted(row)
            ? [{
                label: "Move to Trash",
                onClick: handleDelete,
                danger: true,
              }]
            : []),
        ]}
      />
    );
  }


  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">Manage Pages</h3>

      {showDeleted && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <div>
            <strong>Trash view:</strong> showing deleted pages only.
          </div>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowDeleted(false)}>
            Back to list
          </button>
        </div>
      )}

      <SearchBar
        placeholder="Search by Title"
        value={search}
        onChange={(value: string) => {
          setSearch(value);
          setCurrentPage(1);
        }}
          leftExtras={null}
          actionsMenu={(
            <>
              <button
                className="list-group-item list-group-item-action"
                onClick={() => bulkUpdateStatus("published")}
                type="button"
                disabled={showDeleted || actionableSelectedIds.length === 0}
              >
                <i className="fas fa-globe me-2 text-success" />
                Publish selected
              </button>
              <button
                className="list-group-item list-group-item-action"
                onClick={() => bulkUpdateStatus("private")}
                type="button"
                disabled={showDeleted || actionableSelectedIds.length === 0}
              >
                <i className="fas fa-lock me-2 text-secondary" />
                Set private
              </button>
              <button
                className="list-group-item list-group-item-action text-danger"
                onClick={openBulkDeleteConfirm}
                type="button"
                disabled={showDeleted || actionableSelectedIds.length === 0}
              >
                <i className="fas fa-trash me-2" />
                Move to trash
              </button>
            </>
          )}
          rightExtras={(
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                className="btn btn-success d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: '10px 18px', whiteSpace: 'nowrap' }}
                onClick={() => setShowAdvancedModal(true)}
              >
                <span style={{ lineHeight: 1, textAlign: 'center', display: 'inline-block' }}>
                  Advanced Search
                </span>
              </button>

              <Link
                href="/pages/create"
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: '10px 24px', whiteSpace: 'nowrap' }}
              >
                Create a Page
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
        onApplyFilters={handleApplyFilters}
        initialShowDeleted={showDeleted}
        initialPerPage={perPage}
        initialSortBy={sortBy}
        initialSortOrder={sortOrder}
      />

      <DataTable<PageRow>
        columns={columns}
        data={pages}
        loading={isLoading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => {
          setPerPage(n);
          setCurrentPage(1);
        }}
      />

      <ConfirmModal
        show={restoreModalOpen}
        title="Restore page"
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
        title="Move page to Trash"
        message={<>Move <strong>{deleteTitle}</strong> to Trash? You can restore it later from the deleted list.</>}
        confirmLabel="Trash"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={async () => {
          if (!deleteId) return;
          try {
            await deletePageSoftFirst(deleteId);
            await rememberDeletedById(deleteId);
            toast.success("Page deleted");
            setDeleteModalOpen(false);
            // Stay on the current view; user can switch to Trash manually.
            fetchPages();
            return;
          } catch (err: any) {
            const serverMsg = err?.response?.data?.message || err?.message;
            toast.error(serverMsg || 'Failed to delete page');
            return;
          }
        }}
        onCancel={() => setDeleteModalOpen(false)}
      />

      <ConfirmModal
        show={bulkDeleteModalOpen}
        title="Move pages to Trash"
        message={<>Move <strong>{bulkDeleteIds.length}</strong> selected page(s) to Trash?</>}
        confirmLabel="Trash"
        cancelLabel="Cancel"
        danger={true}
        onConfirm={doBulkDelete}
        onCancel={() => setBulkDeleteModalOpen(false)}
      />


    </div>
  );
}

ManagePages.Layout = AdminLayout;
