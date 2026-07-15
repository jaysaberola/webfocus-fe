"use client";

import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { useRouter } from "next/router";
import Link from "next/link";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { toast } from "@/lib/toast";
import {
  deleteArticleCategory,
  getArticleCategories,
  NewsCategoryRow,
  postDeleteArticleCategoryByPayload,
  postMethodDeleteArticleCategory,
  restoreArticleCategory,
} from "@/services/articleService";

type AdvancedSearchValues = Record<string, string>;

function ManageCategories() {
  const router = useRouter();

  const [categories, setCategories] = useState<NewsCategoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<NewsCategoryRow | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<NewsCategoryRow | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [recentlyDeletedCategories, setRecentlyDeletedCategories] = useState<NewsCategoryRow[]>(() => {
    try {
      if (typeof window === "undefined") return [];
      const raw = localStorage.getItem("recentlyDeletedCategories_news_categories");
      if (!raw) return [];
      const parsed = JSON.parse(raw) as NewsCategoryRow[];
      const cutoff = Date.now() - 1000 * 60 * 60 * 24 * 14;
      return parsed.filter((category: any) => {
        try {
          return category?.deleted_at ? new Date(category.deleted_at).getTime() >= cutoff : true;
        } catch {
          return true;
        }
      });
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;
      localStorage.setItem(
        "recentlyDeletedCategories_news_categories",
        JSON.stringify(recentlyDeletedCategories)
      );
    } catch {
      // ignore persistence failures
    }
  }, [recentlyDeletedCategories]);

  const isRowDeleted = (row: any) => {
    if (!row) return false;
    if (row.deleted_at) return true;
    if (row.is_deleted === true) return true;
    if (row.is_deleted === 1 || row.is_deleted === "1") return true;
    if (row.deleted === true) return true;
    const raw = (row.status ?? row.visibility ?? "").toString().trim().toLowerCase();
    return raw === "deleted";
  };

  const markRowDeletedLocal = (row: NewsCategoryRow): NewsCategoryRow => {
    const nowIso = new Date().toISOString();
    return {
      ...row,
      deleted_at: row.deleted_at ?? nowIso,
      is_deleted: true,
      visibility: row.visibility ?? "Deleted",
      status: row.status ?? "Deleted",
    };
  };

  const rememberDeletedRows = (rows: NewsCategoryRow[]) => {
    if (rows.length === 0) return;
    setRecentlyDeletedCategories((prev) => {
      const byId = new Map<number, NewsCategoryRow>();
      for (const row of prev) byId.set(row.id, row);
      for (const row of rows) byId.set(row.id, markRowDeletedLocal(row));
      return Array.from(byId.values());
    });
  };

  const sortRowsClientSide = (rows: NewsCategoryRow[], by: string, order: "asc" | "desc") => {
    const direction = order === "asc" ? 1 : -1;
    const copy = [...rows];
    copy.sort((a: any, b: any) => {
      const av = (a as any)?.[by];
      const bv = (b as any)?.[by];
      if (by === "created_at") {
        const ams = av ? new Date(av).getTime() : 0;
        const bms = bv ? new Date(bv).getTime() : 0;
        return ((Number.isFinite(ams) ? ams : 0) - (Number.isFinite(bms) ? bms : 0)) * direction;
      }
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;
      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();
      if (as < bs) return -1 * direction;
      if (as > bs) return 1 * direction;
      return 0;
    });
    return copy;
  };

  /* ======================
   * Fetch Categories
   * ====================== */
  const fetchCategories = async (opts?: { showDeleted?: boolean; page?: number; silent?: boolean }) => {
    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const effectiveShowDeleted = opts?.showDeleted ?? showDeleted;
      const effectivePage = opts?.page ?? currentPage;
      const baseParams: any = {
        search,
        name: advancedSearchValues.name || undefined,
        slug: advancedSearchValues.slug || undefined,
        articles_count: advancedSearchValues.articlesCount || undefined,
        page: effectivePage,
        per_page: perPage,
      };

      const requestOnce = async (extra: any) => {
        const res = await getArticleCategories({ ...baseParams, ...extra }, { silent });
        const apiRows: NewsCategoryRow[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
            ? res.data.data
            : [];
        const lastPage = res?.last_page ?? res?.meta?.last_page ?? res?.data?.last_page ?? res?.data?.meta?.last_page ?? 1;
        return { apiRows, lastPage };
      };

      const attempts = effectiveShowDeleted
        ? [
            { show_deleted: 1, with_trashed: 1, only_trashed: 1, only_deleted: 1 },
            { show_deleted: true, with_trashed: 1, only_trashed: 1 },
            { show_deleted: 1 },
            { only_trashed: 1, with_trashed: 1 },
            { trashed: 1, with_trashed: 1 },
            { deleted: 1 },
            { status: "deleted" },
          ]
        : [{ show_deleted: 0 }];

      let apiRows: NewsCategoryRow[] = [];
      let lastPage = 1;
      let lastError: any = null;

      for (const extra of attempts) {
        try {
          const result = await requestOnce(extra);
          apiRows = result.apiRows;
          lastPage = result.lastPage;

          if (!effectiveShowDeleted) break;
          if (apiRows.some((row) => isRowDeleted(row))) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (effectiveShowDeleted && apiRows.length === 0 && lastError && recentlyDeletedCategories.length === 0) {
        throw lastError;
      }

      let rows = effectiveShowDeleted
        ? apiRows.filter((row) => isRowDeleted(row))
        : apiRows.filter((row) => !isRowDeleted(row));

      if (effectiveShowDeleted && recentlyDeletedCategories.length > 0) {
        const byId = new Map<number, NewsCategoryRow>();
        for (const row of rows) byId.set(row.id, row);
        for (const row of recentlyDeletedCategories) {
          if (isRowDeleted(row) && !byId.has(row.id)) byId.set(row.id, row);
        }
        rows = Array.from(byId.values());
      }

      rows = sortRowsClientSide(rows, sortBy, sortOrder);

      setCategories(rows);
      setTotalPages(lastPage);
    } catch (err) {
      console.error("Failed to load categories", err);
    } finally {
      if (!(opts?.silent ?? false)) setLoading(false);
    }
  };

  const mapFilterSortToCategorySort = (value: string) => {
    if (value === "title") return "name";
    if (value === "modified") return "created_at";
    return value;
  };

  const mapCategorySortToFilterSort = (value: string) => {
    if (value === "name") return "title";
    if (value === "created_at") return "modified";
    return value;
  };

  const deleteCategorySoftFirst = async (id: number) => {
    const attempts: Array<() => Promise<any>> = [
      () => deleteArticleCategory(id),
      () => postMethodDeleteArticleCategory(id),
      () => postDeleteArticleCategoryByPayload(id),
    ];

    let lastErr: any;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
          // continue to alternate delete conventions, some backends vary
        }
      }
    }

    throw lastErr;
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayRows.map((row) => row.id));
      return;
    }
    setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)
    );
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      await deleteCategorySoftFirst(deleteTarget.id);
      rememberDeletedRows([deleteTarget]);
      toast.success("Moved to Trash");
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete category");
    } finally {
      setLoading(false);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) {
      setShowBulkDeleteConfirm(false);
      toast.error("Select at least one category");
      return;
    }

    try {
      setLoading(true);
      const currentSelectedIds = [...selectedIds];
      const results = await Promise.allSettled(currentSelectedIds.map((id) => deleteCategorySoftFirst(id)));
      const ok = results.filter((result) => result.status === "fulfilled").length;
      const fail = results.length - ok;
      const successfulIds = currentSelectedIds.filter((_, index) => results[index]?.status === "fulfilled");
      rememberDeletedRows(displayRows.filter((row) => successfulIds.includes(row.id)));

      if (fail === 0) {
        toast.success(`Moved ${ok} categor${ok === 1 ? "y" : "ies"} to Trash`);
      } else {
        toast.error(`Moved ${ok} to Trash, failed ${fail}`);
      }

      setShowBulkDeleteConfirm(false);
      setSelectedIds([]);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to delete selected categories");
    } finally {
      setLoading(false);
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;

    try {
      setLoading(true);
      await restoreArticleCategory(restoreTarget.id);
      setRecentlyDeletedCategories((prev) => prev.filter((row) => row.id !== restoreTarget.id));
      toast.success("Category restored");
      setShowRestoreConfirm(false);
      setRestoreTarget(null);
      setShowDeleted(false);
      setCurrentPage(1);
      fetchCategories({ showDeleted: false, page: 1 });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to restore category");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const timeout = setTimeout(fetchCategories, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, showDeleted, advancedSearchValues]);

  useEffect(() => {
    setSelectedIds([]);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted]);

  const sortedCategories = useMemo(
    () => sortRowsClientSide(categories, sortBy, sortOrder),
    [categories, sortBy, sortOrder]
  );

  const displayRows = useMemo(() => {
    return sortedCategories.map((r, idx) => ({
      ...r,
      seq: (currentPage - 1) * perPage + idx + 1,
    }));
  }, [sortedCategories, currentPage, perPage]);

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<NewsCategoryRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={displayRows.length > 0 && displayRows.every((row) => selectedIds.includes(row.id))}
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
      header: "Category Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className={showDeleted ? "fw-bold text-decoration-line-through text-muted" : "fw-bold text-primary"}>{row.name}</span>
      ),
    },
    {
      key: "slug",
      header: "URL",
      sortable: true,
      sortField: "slug",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className="text-muted small">
          /news/{row.slug}
        </span>
      ),
    },
    {
      key: "articles_count",
      header: "Total News",
      sortable: true,
      sortField: "articles_count",
      defaultSortOrder: "desc",
      render: (row) => row.articles_count ?? 0,
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
              <i className="fas fa-trash-restore" />
            </button>
          ) : (
            <>
              <button
                className="btn btn-link p-0 me-2 text-secondary"
                title="Edit"
                onClick={() =>
                  router.push(`/news/edit_category/${row.id}`)
                }
              >
                <i className="fas fa-edit" />
              </button>

              <button
                className="btn btn-link p-0 text-danger"
                title="Delete"
                onClick={() => {
                  setDeleteTarget(row);
                  setShowDeleteConfirm(true);
                }}
                type="button"
              >
                <i className="fas fa-trash" />
              </button>
            </>
          )}
        </>
      ),
    },
  ];

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">Manage News Categories</h3>

      <SearchBar
        placeholder="Search by Category"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        actionsMenu={(
          <>
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
              href="/news/category_create"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 24px", whiteSpace: "nowrap" }}
            >
              Create Category
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
          { name: "name", label: "Category Name" },
          { name: "slug", label: "URL" },
          { name: "articlesCount", label: "Total News" },
        ]}
        onApplyFilters={({ sortBy: nextSortBy, sortOrder: nextSortOrder, showDeleted: nextShowDeleted, perPage: nextPerPage, advancedValues }) => {
          setSortBy(mapFilterSortToCategorySort(nextSortBy));
          setSortOrder(nextSortOrder === "desc" ? "desc" : "asc");
          setShowDeleted(!!nextShowDeleted);
          setPerPage(nextPerPage);
          setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
          setCurrentPage(1);
        }}
        initialSortBy={mapCategorySortToFilterSort(sortBy)}
        initialSortOrder={sortOrder}
        initialShowDeleted={showDeleted}
        initialPerPage={perPage}

      />

      <DataTable<NewsCategoryRow>
        columns={columns}
        data={displayRows as any}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => { setPerPage(n); setCurrentPage(1); }}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(nextBy, nextOrder) => {
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />

      <ConfirmModal
        show={showDeleteConfirm && !!deleteTarget}
        title="Delete category"
        message={<p>Delete <strong>{deleteTarget?.name}</strong>?</p>}
        confirmLabel="Delete"
        danger
        onConfirm={confirmSingleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
      />

      <ConfirmModal
        show={showBulkDeleteConfirm}
        title="Delete categories"
        message={<p>Delete selected <strong>{selectedIds.length}</strong> categor{selectedIds.length === 1 ? "y" : "ies"}?</p>}
        confirmLabel="Delete"
        danger
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      <ConfirmModal
        show={showRestoreConfirm && !!restoreTarget}
        title="Restore category"
        message={<p>Restore <strong>{restoreTarget?.name}</strong>?</p>}
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

ManageCategories.Layout = AdminLayout;
export default ManageCategories;
