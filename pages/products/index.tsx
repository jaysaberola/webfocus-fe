import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "@/services/axios";
import { toast } from "@/lib/toast";
import ConfirmModal from "@/components/UI/ConfirmModal";
import SearchBar from "@/components/UI/SearchBar";
import DataTable, { Column } from "@/components/UI/DataTable";

type AdvancedSearchValues = Record<string, string>;

export default function ManageProducts() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<any>("asc");
  const [showDeleted, setShowDeleted] = useState<boolean>(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const [showPublicPreview, setShowPublicPreview] = useState<boolean>(false);
  const silentSortFetchRef = useRef(false);

  const sortRowsClientSide = (rows: any[], by?: string, order: "asc" | "desc" = "asc") => {
    if (!by) return rows;
    const direction = order === "asc" ? 1 : -1;
    const copy = [...rows];

    const categoryLabel = (row: any) => {
      const direct = row?.category && (row.category.name ?? row.category.title);
      const fallback = row?.category_name ?? (row?.category_id && categoriesMap[String(row.category_id)]) ?? row?.category_id ?? "";
      return String(direct ?? fallback ?? "").toLowerCase();
    };

    copy.sort((a: any, b: any) => {
      const av = by === "price"
        ? Number(a?.price ?? a?.amount ?? 0)
        : by === "category"
          ? categoryLabel(a)
          : a?.[by];
      const bv = by === "price"
        ? Number(b?.price ?? b?.amount ?? 0)
        : by === "category"
          ? categoryLabel(b)
          : b?.[by];

      if (typeof av === "number" && typeof bv === "number") {
        return (av - bv) * direction;
      }

      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();
      if (as < bs) return -1 * direction;
      if (as > bs) return 1 * direction;
      return 0;
    });
    return copy;
  };

  const fetchProducts = async (opts?: { showDeleted?: boolean; silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const effectiveShowDeleted = opts?.showDeleted ?? showDeleted;
      const svc = await import("@/services/productService");

      const baseParams: any = {
        per_page: perPage,
        page: currentPage,
        search,
        name: advancedSearchValues.name || undefined,
        category: advancedSearchValues.category || undefined,
        price: advancedSearchValues.price || undefined,
        status: advancedSearchValues.status || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      };

      const requestOnce = async (extra: any) => {
        const res = await svc.getProducts({ ...baseParams, ...extra }, { silent });
        const data = res?.data ?? res ?? [];
        const items = Array.isArray(data) ? data : (data?.items ?? data?.rows ?? data?.data ?? []);
        const lastPage = res?.meta?.last_page ?? res?.meta?.total_pages ?? 1;
        return { items, lastPage };
      };

      const attempts: any[] = effectiveShowDeleted
        ? [
            { show_deleted: 1 },
            { only_trashed: 1 },
            { trashed: 1 },
            { deleted: 1 },
            { with_trashed: 1 },
            { status: "deleted" },
          ]
        : [{ show_deleted: 0 }];

      let apiItems: any[] = [];
      let lastPage = 1;
      let lastError: any = null;

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

      for (const extra of attempts) {
        try {
          const r = await requestOnce(extra);
          apiItems = r.items;
          lastPage = r.lastPage;

          if (!effectiveShowDeleted) break;
          if (apiItems.some((it: any) => isRowDeleted(it))) break;
        } catch (err) {
          lastError = err;
        }
      }

      if (effectiveShowDeleted && apiItems.length === 0 && lastError) throw lastError;

      const filtered = effectiveShowDeleted ? apiItems.filter((r: any) => isRowDeleted(r)) : apiItems.filter((r: any) => !isRowDeleted(r));
      const sorted = sortRowsClientSide(filtered, sortBy, String(sortOrder).toLowerCase() === "desc" ? "desc" : "asc");

      setProducts(sorted);
      setTotalPages(lastPage);

      // try to load product categories to display names
      try {
        const catEndpoints = ["/fetch-product-categories", "/product-categories", "/categories?type=product", "/categories"];
        let catList: any[] = [];
        for (const ep of catEndpoints) {
          try {
            const creq = await axiosInstance.get(ep, { headers: { "X-No-Loading": true } });
            const cdata = creq.data?.data ?? creq.data ?? [];
            if (Array.isArray(cdata) && cdata.length) { catList = cdata; break; }
          } catch (e) { /* try next */ }
        }
        if (catList.length) {
          const map: Record<string, string> = {};
          for (const c of catList) {
            const id = String(c.id ?? c.category_id ?? c.slug ?? c.name ?? "");
            const name = c.name ?? c.title ?? String(c);
            if (id) map[id] = name;
          }
          setCategoriesMap(map);
        }
      } catch (e) { /* ignore */ }
    } catch (e: any) {
      console.error("Failed to load products", e);
      setError(e?.message || "Failed to load products");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const t = setTimeout(() => fetchProducts({ showDeleted, silent }), 200);
    return () => clearTimeout(t);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted, advancedSearchValues]);

  const handleDelete = async (id: string | number) => {
    setPendingDeleteId(id);
    setShowConfirm(true);
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [bulkMenuPos, setBulkMenuPos] = useState<{ top: number; left: number } | null>(null);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return setShowConfirm(false);
    try {
      const svc = await import("@/services/productService");
      await svc.deleteProduct(pendingDeleteId);
      setProducts((prev) => prev.filter((p) => String(p.id ?? p.product_id ?? p.slug) !== String(pendingDeleteId)));
      toast.success("Product deleted");
    } catch (e: any) {
      console.error("Delete error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete product");
    } finally {
      setShowConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return setShowRestoreConfirm(false);
    try {
      const svc = await import("@/services/productService");
      await svc.restoreProduct(restoreTarget.id ?? restoreTarget.product_id ?? restoreTarget);
      toast.success("Restored successfully");
      setShowRestoreConfirm(false);
      setRestoreTarget(null);
      // switch back to normal list
      setShowDeleted(false);
      setCurrentPage(1);
    } catch (e: any) {
      console.error("Restore error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to restore product");
    }
  };

  const handleBulkActivate = async (status: "active" | "inactive") => {
    if (!selectedIds.length) return toast.error("No products selected");
    try {
      const svc = await import("@/services/productService");
      await svc.bulkUpdateStatus(selectedIds, status);
      toast.success(`Updated ${selectedIds.length} product(s)`);
      setSelectedIds([]);
      fetchProducts({ showDeleted });
    } catch (e: any) {
      console.error("Bulk status error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to update status");
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return toast.error("No products selected");
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const svc = await import("@/services/productService");
      await svc.bulkDeleteProducts(selectedIds);
      toast.success(`Deleted ${selectedIds.length} product(s)`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchProducts({ showDeleted });
    } catch (e: any) {
      console.error("Bulk delete error", e);
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete products");
    }
  };

  return (
    <>
      <div className="container-fluid px-4 pt-3">
        <h3 className="mb-3">Manage Products</h3>
        {/* bulk Actions: show when rows selected - moved below SearchBar to align with Filters/PageSize */}
        <SearchBar
          placeholder="Search products"
          value={search}
          onChange={(v) => { setSearch(v); setCurrentPage(1); }}
          rightExtras={(
            <div className="d-flex align-items-center gap-2 flex-nowrap">
              <button
                type="button"
                className="btn btn-success d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: "10px 16px", whiteSpace: "nowrap" }}
                onClick={() => setShowAdvancedSearch(true)}
              >
                <span style={{ lineHeight: 1, textAlign: "center", display: "inline-block" }}>
                  Advanced Search
                </span>
              </button>

              <Link
                href="/products/create"
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: "10px 20px", whiteSpace: "nowrap" }}
              >
                Create Product
              </Link>

              <Link
                href="/products/category_create"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: "10px 18px", whiteSpace: "nowrap" }}
              >
                Create Category
              </Link>

              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: "10px 20px", whiteSpace: "nowrap" }}
                onClick={() => setShowPublicPreview((s) => !s)}
                title="Toggle public products preview"
              >
                {showPublicPreview ? "Hide public view" : "Show public view"}
              </button>
            </div>
          )}
          filtersOpen={showAdvancedSearch}
          onFiltersOpenChange={(open) => {
            if (!open) setShowAdvancedSearch(false);
          }}
          externalOpenAsModal={true}
          advancedSearchUpdatesInput={false}
          onAdvancedSearch={(values) => setAdvancedSearchValues(values)}
          advancedFields={[
            { name: "name", label: "Product Name" },
            { name: "category", label: "Category" },
            { name: "price", label: "Price" },
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
          actionsMenu={(
            <>
              <button
                className="list-group-item list-group-item-action"
                onClick={() => handleBulkActivate("active")}
                type="button"
                disabled={selectedIds.length === 0}
              >
                Activate ({selectedIds.length})
              </button>
              <button
                className="list-group-item list-group-item-action"
                onClick={() => handleBulkActivate("inactive")}
                type="button"
                disabled={selectedIds.length === 0}
              >
                Deactivate ({selectedIds.length})
              </button>
              <button
                className="list-group-item list-group-item-action text-danger"
                onClick={() => setShowBulkDeleteConfirm(true)}
                type="button"
                disabled={selectedIds.length === 0}
              >
                Delete ({selectedIds.length})
              </button>
            </>
          )}
          onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, perPage: sPerPage, showDeleted: sDeleted, advancedValues }) => {
            setSortBy(sBy === "modified" ? "updated_at" : sBy === "title" ? "name" : sBy);
            setSortOrder(sOrder);
            setPerPage(sPerPage);
            setCurrentPage(1);
            setShowDeleted(sDeleted);
            setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
            fetchProducts({ showDeleted: sDeleted });
          }}
          initialSortBy={sortBy as any}
          initialSortOrder={sortOrder}
          initialPerPage={perPage}
          initialShowDeleted={showDeleted}
        />

        {showPublicPreview && (
          <div className="card mb-3">
            <div className="card-body" style={{ padding: 0 }}>
              <iframe src="/public/products" style={{ width: '100%', height: 600, border: 0 }} title="Public products preview" />
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-body">
            {error && <div className="text-danger">{error}</div>}
            <DataTable
              columns={getColumns(categoriesMap, router, handleDelete, showDeleted, (row: any) => { setRestoreTarget(row); setShowRestoreConfirm(true); }, selectedIds, setSelectedIds, products)}
              data={products}
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
          </div>
        </div>
      </div>
      <ConfirmModal
        show={showConfirm}
        title="Delete product"
        message={<span>Are you sure you want to delete this product? This action cannot be undone.</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => { setShowConfirm(false); setPendingDeleteId(null); }}
      />
      <ConfirmModal
        show={showRestoreConfirm && !!restoreTarget}
        title="Restore product"
        message={<span>Restore <strong>{restoreTarget?.name ?? restoreTarget?.title ?? restoreTarget?.slug ?? restoreTarget?.id}</strong>?</span>}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        onConfirm={confirmRestore}
        onCancel={() => { setShowRestoreConfirm(false); setRestoreTarget(null); }}
      />
      <ConfirmModal
        show={showBulkDeleteConfirm}
        title="Delete products"
        message={<span>Are you sure you want to delete <strong>{selectedIds.length}</strong> selected product(s)? This action cannot be undone.</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </>
  );
}

function getColumns(categoriesMap: Record<string, string>, router: any, handleDelete: (id: string|number)=>void, showDeleted?: boolean, handleRestore?: (row:any)=>void, selectedIds?: Array<string|number>, setSelectedIds?: (ids:Array<string|number>)=>void, rows?: any[]): Column<any>[] {
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

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  const toProductImageSrc = (rawUrl: any) => {
    if (!rawUrl) return "";
    const s = String(rawUrl).trim();
    if (!s) return "";

    // Already absolute / special URLs
    if (s.startsWith("blob:") || s.startsWith("data:")) return s;
    if (s.startsWith("//")) return s;
    if (/^https?:\/\//i.test(s)) return s;

    // Backend absolute path
    if (s.startsWith("/")) {
      return apiBase ? `${apiBase}${s}` : s;
    }

    // Backend relative paths
    if (apiBase) {
      // If the backend returns something like: storage/foo.jpg, uploads/foo.jpg, images/foo.jpg
      if (/^(storage|uploads|images)\//i.test(s)) return `${apiBase}/${s}`;

      // If the backend returns just: foo.jpg or products/foo.jpg, assume Laravel-style /storage
      return `${apiBase}/storage/${s.replace(/^\/+/, "")}`;
    }

    // Fallback: treat as local public path
    return `/${s.replace(/^\/+/, "")}`;
  };

  const imageFallbackSvg =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='60' viewBox='0 0 90 60'>` +
        `<rect width='90' height='60' fill='%23f3f3f3'/>` +
        `<text x='45' y='34' font-family='Arial' font-size='10' text-anchor='middle' fill='%23999'>No image</text>` +
      `</svg>`
    );

  return [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={Boolean(rows && rows.length > 0 && selectedIds && selectedIds.length === rows.length)}
          onChange={(e) => {
            if (!setSelectedIds || !rows) return;
            if (e.target.checked) setSelectedIds(rows.map((r: any) => String(r.id ?? r.product_id ?? r.slug)));
            else setSelectedIds([]);
          }}
        />
      ),
      render: (p: any) => {
        const id = String(p.id ?? p.product_id ?? p.slug);
        const checked = !!(selectedIds && selectedIds.includes(id));
        return (
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => {
              if (!setSelectedIds) return;
              if (e.target.checked) setSelectedIds(Array.from(new Set([...(selectedIds || []), id])));
              else setSelectedIds((selectedIds || []).filter((x: string | number) => String(x) !== id));
            }}
          />
        );
      },
    },
    {
      key: "image",
      header: "",
      thClassName: "text-center",
      tdClassName: "text-center align-middle",
      render: (p: any) => (
        <div style={{ width: "100%", height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {p.image_url || p.image ? (
            <img
              src={toProductImageSrc(p.image_url ?? p.image)}
              alt={p.name}
              style={{ maxWidth: 90, maxHeight: 60, objectFit: "cover", display: "block" }}
              loading="lazy"
              onError={(e) => {
                // prevent infinite loop
                e.currentTarget.onerror = null;
                e.currentTarget.src = imageFallbackSvg;
              }}
            />
          ) : (
            <div style={{ width: 90, height: 60, background: "#f3f3f3" }} />
          )}
        </div>
      ),
    },
    { key: "name", header: "Name", sortable: true, sortField: "name", render: (p) => {
        const deleted = isRowDeleted(p);
        return <span className={deleted ? "fw-bold text-decoration-line-through text-muted" : "fw-bold"}>{p.name ?? p.title ?? p.slug}</span>;
      }
    },
    { key: "price", header: "Price", sortable: true, sortField: "price", defaultSortOrder: "asc", render: (p) => p.price ?? p.amount },
    { key: "category", header: "Category", sortable: true, sortField: "category", defaultSortOrder: "asc", render: (p) => ( (p.category && (p.category.name ?? p.category.title)) ?? p.category_name ?? (p.category_id && categoriesMap[String(p.category_id)]) ?? p.category_id ?? "-" ) },
    { key: "status", header: "Status", render: (p) => p.status ?? "-" },
    {
      key: "options",
      header: "Options",
      render: (p) => (
        <>
          {showDeleted ? (
            <button
              className="btn btn-link p-0 text-success"
              title="Restore"
              onClick={() => handleRestore && handleRestore(p)}
              type="button"
            >
              <i className="fas fa-trash-restore"></i>
            </button>
          ) : (
            <>
              <button className="btn btn-link p-0 me-2 text-secondary" title="View" onClick={() => window.open(`/public/${p.slug ?? p.id ?? ""}`, "_blank") } type="button"><i className="fas fa-eye"/></button>
              <button className="btn btn-link p-0 me-2 text-secondary" title="Edit" onClick={() => router.push(`/products/edit/${p.id ?? p.product_id ?? ""}`)} type="button"><i className="fas fa-edit"/></button>
              <button className="btn btn-link p-0 text-danger" title="Delete" onClick={() => handleDelete(p.id ?? p.product_id ?? p.slug)} type="button"><i className="fas fa-trash"/></button>
            </>
          )}
        </>
      ),
    },
  ];
}

ManageProducts.Layout = AdminLayout;
