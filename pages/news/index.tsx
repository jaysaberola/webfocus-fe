import { useEffect, useState, useMemo, useRef } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import ConfirmModal from "@/components/UI/ConfirmModal";
import { toast } from "@/lib/toast";
import {
  deleteArticle,
  getArticles,
  postDeleteArticleByPayload,
  postMethodDeleteArticle,
  restoreArticle,
  duplicateArticle,
  updateArticleStatus,
  ArticleRow,
} from "@/services/articleService";
import { useRouter } from "next/router";
import Link from "next/link";

type NewsRow = ArticleRow & { slug?: string };
type AdvancedSearchValues = Record<string, string>;

function ManageNews() {
  const router = useRouter();

  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [showDeleted, setShowDeleted] = useState<boolean>(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<NewsRow | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<NewsRow | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const silentSortFetchRef = useRef(false);

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

  const normalizeStatus = (row: any) => {
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

  const getNewsViewUrl = (row: NewsRow) => {
    const status = normalizeStatus(row);
    if (status === "published" && row.slug) {
      return `/public/news/${row.slug}`;
    }
    return `/news/preview/${row.id}`;
  };

  const sortRowsClientSide = (rows: any[], sortByKey: string, order: string) => {
    const direction = String(order).toLowerCase() === "asc" ? 1 : -1;
    const copy = [...rows];

    const getTitle = (r: any) => (r?.name ?? r?.title ?? "").toString().toLowerCase();
    const getModifiedMs = (r: any) => {
      const raw = r?.updated_at ?? r?.updated_at_formatted ?? r?.updated;
      if (!raw) return 0;
      const ms = new Date(raw).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    copy.sort((a: any, b: any) => {
      if (sortByKey === "name" || sortByKey === "title") {
        const av = getTitle(a);
        const bv = getTitle(b);
        if (av < bv) return -1 * direction;
        if (av > bv) return 1 * direction;
        return 0;
      }
      // default updated_at
      return (getModifiedMs(a) - getModifiedMs(b)) * direction;
    });
    return copy;
  };

  /* ======================
   * Fetch Articles
   * ====================== */
  const fetchArticles = async (opts?: { silent?: boolean }) => {
    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const deletedFlag = showDeleted ? 1 : 0;
      const params: any = {
        search,
        title: advancedSearchValues.title || undefined,
        category: advancedSearchValues.category || undefined,
        type: advancedSearchValues.type || undefined,
        visibility: advancedSearchValues.visibility || undefined,
        updated_from: advancedSearchValues.updatedFrom || undefined,
        updated_to: advancedSearchValues.updatedTo || undefined,
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
        show_deleted: deletedFlag,
        ...(deletedFlag
          ? {
              with_trashed: 1,
              only_trashed: 1,
              only_deleted: 1,
            }
          : {}),
      };

      const res = await getArticles(params, { silent });
      const apiRows: any[] = Array.isArray(res?.data) ? res.data : [];

      // Make UI consistent even if backend ignores trash/sort params
      const filteredRows = showDeleted
        ? apiRows.filter((r) => isRowDeleted(r))
        : apiRows.filter((r) => !isRowDeleted(r));

      const sortedRows = sortRowsClientSide(filteredRows, sortBy, sortOrder);

      setArticles(sortedRows);
      setTotalPages(res?.last_page ?? 1);
    } catch (err) {
      console.error("Failed to load articles", err);
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
    const timeout = setTimeout(() => fetchArticles({ silent }), 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted, advancedSearchValues]);

  useEffect(() => {
    // avoid keeping selection across data changes
    setSelectedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage, sortBy, sortOrder, showDeleted, search]);

  /* ======================
   * Map API → Table Rows
   * ====================== */
  const tableData: NewsRow[] = useMemo(
    () =>
      articles.map((item) => ({
        id: item.id,
        title: item.name,
        category: item.category?.name ?? "-",
        is_featured: !!item.is_featured,
        visibility: normalizeStatus(item),
        updated: item.updated_at_formatted,
        slug: item.slug,
      })),
    [articles]
  );

  const deleteArticleSoftFirst = async (id: number) => {
    const attempts: Array<() => Promise<any>> = [
      () => deleteArticle(id),
      () => postMethodDeleteArticle(id),
      () => postDeleteArticleByPayload(id),
    ];
    let lastErr: any;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (err: any) {
        lastErr = err;
      }
    }
    throw lastErr;
  };

  const bulkUpdateStatus = async (status: "published" | "private") => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => updateArticleStatus(id, status)));
      toast.success(`Updated ${selectedIds.length} item(s)`);
      setSelectedIds([]);
      fetchArticles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update selected news");
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => deleteArticleSoftFirst(id)));
      toast.success(`Trashed ${selectedIds.length} item(s)`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchArticles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to trash selected news");
    }
  };

  const confirmSingleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteArticleSoftFirst(deleteTarget.id);
      toast.success("Moved to Trash");
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchArticles();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to trash news");
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return;
    try {
      await restoreArticle(restoreTarget.id);
      toast.success("Restored successfully");
      setShowRestoreConfirm(false);
      setRestoreTarget(null);
      // match Manage Pages behavior: go back to main list after restore
      setShowDeleted(false);
      setCurrentPage(1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to restore news");
    }
  };

  function RowActions({ row }: { row: NewsRow }) {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

    const handleClick = (e: React.MouseEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPos({ top: rect.bottom + window.scrollY, left: rect.left });
      setOpen((s) => !s);
    };

    const handleToggleStatus = async () => {
      const current = normalizeStatus(row);
      const next = (current === "published" ? "private" : "published") as "published" | "private";
      try {
        await updateArticleStatus(row.id, next);
        toast.success(`Status updated to ${next}`);
        setOpen(false);
        fetchArticles();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to update status");
      }
    };

    const handleTrash = () => {
      setDeleteTarget(row);
      setShowDeleteConfirm(true);
      setOpen(false);
    };

    const handleDuplicate = async () => {
      try {
        const res = await duplicateArticle(row.id);

        // Try to locate the new record id from common response shapes
        let newId: number | string | undefined = undefined;
        if (res == null) newId = undefined;
        else if (typeof res === "number" || typeof res === "string") newId = res;
        else newId = res?.data?.id ?? res?.data?.article?.id ?? res?.id ?? res?.article?.id ?? res?.insertedId ?? res?.newId;

        setOpen(false);
        if (newId) {
          toast.success("Duplicated — opening editor");
          router.push(`/news/edit/${newId}`);
        } else {
          toast.success("Duplicated successfully");
          fetchArticles();
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to duplicate news");
      }
    };

    return (
      <div style={{ display: "inline-block", position: "relative" }}>
        <button
          className="btn btn-link p-0 text-secondary"
          onClick={handleClick}
          type="button"
          title="Settings: click to open actions (Publish/Private/Duplicate/Delete) for this news"
          aria-label="Settings: click to open actions"
        >
          <i className="fas fa-cogs"></i>
        </button>

        {open && pos && (
          <div>
            <div style={{ position: "fixed", inset: 0, zIndex: 1055 }} onClick={() => setOpen(false)} />
            <div style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 1060 }}>
              <div className="card shadow-sm compact-dropdown" style={{ width: 160 }}>
                <div className="list-group list-group-flush">
                  <button
                    className="list-group-item list-group-item-action"
                    onClick={handleToggleStatus}
                    type="button"
                    title="Click to switch news visibility between Published and Private"
                    aria-label="Switch news visibility"
                  >
                    {normalizeStatus(row) === "published" ? "Private" : "Published"}
                  </button>
                  <button
                    className="list-group-item list-group-item-action"
                    onClick={handleDuplicate}
                    type="button"
                    title="Click to duplicate this news item"
                    aria-label="Duplicate news item"
                  >
                    Duplicate
                  </button>
                  <button
                    className="list-group-item list-group-item-action text-danger"
                    onClick={handleTrash}
                    type="button"
                    title="Click to move this news item to Trash"
                    aria-label="Move news item to Trash"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  /* ======================
   * Columns
   * ====================== */
  const columns: Column<NewsRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={tableData.length > 0 && selectedIds.length === tableData.length}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds(tableData.map((a) => a.id));
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
      key: "title",
      header: "Title",
      sortable: true,
      sortField: "title",
      defaultSortOrder: "asc",
      render: (row) => (
        <span className={showDeleted ? "fw-bold text-decoration-line-through text-muted" : "fw-bold text-primary"}>{row.title}</span>
      ),
    },
    {
      key: "category",
      header: "Category",
    },
    {
      key: "is_featured",
      header: "Type",
      render: (row) =>
        row.is_featured ? (
          <span className="badge bg-success text-white">
            Featured
          </span>
        ) : null,
    },
    {
      key: "visibility",
      header: "Visibility",
      render: (row) => {
        const s = normalizeStatus(row);
        return <span className={statusBadgeClass(s)}>{statusLabel(s)}</span>;
      },
    },
    {
      key: "updated",
      header: "Updated",
      sortable: true,
      sortField: "updated_at",
      sortLabel: "Updated",
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
              <button
                className="btn btn-link p-0 me-2 text-secondary"
                title="View"
                type="button"
                onClick={() => {
                  window.open(getNewsViewUrl(row), "_blank", "noopener,noreferrer");
                }}
              >
                <i className="fas fa-eye" />
              </button>

              <button
                className="btn btn-link p-0 me-2 text-secondary"
                title="Edit"
                onClick={() => router.push(`/news/edit/${row.id}`)}
                type="button"
              >
                <i className="fas fa-edit" />
              </button>

              <RowActions row={row} />
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
      <h3 className="mb-3">Manage News</h3>

      <SearchBar
        placeholder="Search News"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}

        actionsMenu={(
          <>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkUpdateStatus("published")}
              type="button"
              disabled={showDeleted || selectedIds.length === 0}
            >
              Publish
            </button>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkUpdateStatus("private")}
              type="button"
              disabled={showDeleted || selectedIds.length === 0}
            >
              Private
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
              href="/news/create"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 24px", whiteSpace: "nowrap" }}
            >
              Create News
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
          { name: "title", label: "Title" },
          { name: "category", label: "Category" },
          {
            name: "type",
            label: "Type",
            type: "select",
            options: [
              { label: "- All Types -", value: "" },
              { label: "Featured", value: "featured" },
              { label: "Regular", value: "regular" },
            ],
          },
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
          { name: "updatedFrom", label: "Updated (From)", type: "date" },
          { name: "updatedTo", label: "Updated (To)", type: "date" },
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
        initialShowDeleted={showDeleted}
        initialPerPage={perPage}
      />

      <DataTable<NewsRow>
        columns={columns}
        data={tableData}
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

      <ConfirmModal
        show={showDeleteConfirm && !!deleteTarget}
        title="Confirm Delete"
        message={<p>Move <strong>{deleteTarget?.title}</strong> to Trash?</p>}
        confirmLabel="Trash"
        danger
        onConfirm={confirmSingleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
      />

      <ConfirmModal
        show={showBulkDeleteConfirm}
        title="Confirm Delete"
        message={<p>Move selected <strong>{selectedIds.length}</strong> item(s) to Trash?</p>}
        confirmLabel="Trash"
        danger
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />

      <ConfirmModal
        show={showRestoreConfirm && !!restoreTarget}
        title="Restore News"
        message={<p>Restore <strong>{restoreTarget?.title}</strong>?</p>}
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

ManageNews.Layout = AdminLayout;
export default ManageNews;
