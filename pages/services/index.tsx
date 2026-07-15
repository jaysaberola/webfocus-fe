import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { axiosInstance } from "@/services/axios";
import { toast } from "@/lib/toast";
import ConfirmModal from "@/components/UI/ConfirmModal";
import SearchBar from "@/components/UI/SearchBar";
import DataTable, { Column } from "@/components/UI/DataTable";
import { getServices, deleteService, restoreService, bulkDeleteServices, bulkUpdateServiceStatus, updateService } from "@/services/serviceService";

const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

const toImageSrc = (rawUrl: any) => {
  if (!rawUrl) return "";
  const s = String(rawUrl).trim();
  if (!s) return "";
  if (s.startsWith("blob:") || s.startsWith("data:") || s.startsWith("//")) return s;
  if (/^https?:\/\//i.test(s)) return s;
  if (s.startsWith("/")) return apiBase ? `${apiBase}${s}` : s;
  if (apiBase) {
    if (/^(storage|uploads|images)\//i.test(s)) return `${apiBase}/${s}`;
    return `${apiBase}/storage/${s.replace(/^\/+/, "")}`;
  }
  return `/${s.replace(/^\/+/, "")}`;
};

const imageFallbackSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='90' height='60' viewBox='0 0 90 60'>` +
      `<rect width='90' height='60' fill='%23f3f3f3'/>` +
      `<text x='45' y='34' font-family='Arial' font-size='10' text-anchor='middle' fill='%23999'>No image</text>` +
    `</svg>`,
  );

type AdvancedSearchValues = Record<string, string>;

export default function ManageServices() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriesMap, setCategoriesMap] = useState<Record<string, string>>({});

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<any>("asc");
  const [showDeleted, setShowDeleted] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const silentSortFetchRef = useRef(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<any | null>(null);
  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const isRowDeleted = (row: any) => {
    if (!row) return false;
    if (row.deleted_at) return true;
    if (row.is_deleted === true || row.is_deleted === 1 || row.is_deleted === "1") return true;
    if (row.deleted === true) return true;
    const raw = (row.status ?? row.visibility ?? "").toString().trim().toLowerCase();
    return raw === "deleted";
  };

  const sortRowsClientSide = (rows: any[], by?: string, order: "asc" | "desc" = "asc") => {
    if (!by) return rows;
    const direction = order === "asc" ? 1 : -1;
    const copy = [...rows];
    copy.sort((a: any, b: any) => {
      const av = by === "price" ? Number(a?.price ?? 0) : a?.[by];
      const bv = by === "price" ? Number(b?.price ?? 0) : b?.[by];
      if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;
      const as = av == null ? "" : String(av).toLowerCase();
      const bs = bv == null ? "" : String(bv).toLowerCase();
      if (as < bs) return -1 * direction;
      if (as > bs) return 1 * direction;
      return 0;
    });
    return copy;
  };

  const fetchServices = async (opts?: { showDeleted?: boolean; silent?: boolean }) => {
    const silent = opts?.silent ?? false;
    if (!silent) setLoading(true);
    try {
      const effectiveShowDeleted = opts?.showDeleted ?? showDeleted;
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

      const attempts: any[] = effectiveShowDeleted
        ? [{ show_deleted: 1 }, { only_trashed: 1 }, { trashed: 1 }, { deleted: 1 }, { with_trashed: 1 }, { status: "deleted" }]
        : [{ show_deleted: 0 }];

      let apiItems: any[] = [];
      let lastPage = 1;
      let lastError: any = null;

      for (const extra of attempts) {
        try {
          const res = await getServices({ ...baseParams, ...extra }, { silent });
          const data = res?.data ?? res ?? [];
          const items = Array.isArray(data) ? data : (data?.items ?? data?.rows ?? data?.data ?? []);
          apiItems = items;
          lastPage = res?.meta?.last_page ?? res?.meta?.total_pages ?? res?.last_page ?? 1;
          if (!effectiveShowDeleted) break;
          if (apiItems.some((it: any) => isRowDeleted(it))) break;
        } catch (err) { lastError = err; }
      }

      if (effectiveShowDeleted && apiItems.length === 0 && lastError) throw lastError;

      const filtered = effectiveShowDeleted
        ? apiItems.filter((r: any) => isRowDeleted(r))
        : apiItems.filter((r: any) => !isRowDeleted(r));

      setServices(sortRowsClientSide(filtered, sortBy, String(sortOrder).toLowerCase() === "desc" ? "desc" : "asc"));
      setTotalPages(lastPage);

      // load categories map
      try {
        const catEndpoints = ["/fetch-service-categories", "/service-categories", "/categories?type=service", "/categories"];
        for (const ep of catEndpoints) {
          try {
            const creq = await axiosInstance.get(ep, { headers: { "X-No-Loading": true } });
            const cdata = creq.data?.data ?? creq.data ?? [];
            if (Array.isArray(cdata) && cdata.length) {
              const map: Record<string, string> = {};
              for (const c of cdata) {
                const id = String(c.id ?? c.category_id ?? c.slug ?? c.name ?? "");
                const name = c.name ?? c.title ?? String(c);
                if (id) map[id] = name;
              }
              setCategoriesMap(map);
              break;
            }
          } catch { /* try next */ }
        }
      } catch { /* ignore */ }
    } catch (e: any) {
      setError(e?.message || "Failed to load services");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const t = setTimeout(() => fetchServices({ showDeleted, silent }), 200);
    return () => clearTimeout(t);
  }, [search, currentPage, perPage, sortBy, sortOrder, showDeleted, advancedSearchValues]);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return setShowConfirm(false);
    try {
      await deleteService(pendingDeleteId);
      setServices((prev) => prev.filter((s) => String(s.id ?? s.service_id) !== String(pendingDeleteId)));
      toast.success("Service deleted");
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete service");
    } finally {
      setShowConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const confirmRestore = async () => {
    if (!restoreTarget) return setShowRestoreConfirm(false);
    try {
      await restoreService(restoreTarget.id ?? restoreTarget.service_id ?? restoreTarget);
      toast.success("Restored successfully");
      setShowRestoreConfirm(false);
      setRestoreTarget(null);
      setShowDeleted(false);
      setCurrentPage(1);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to restore service");
    }
  };

  const handleBulkActivate = async (status: "active" | "inactive") => {
    if (!selectedIds.length) return toast.error("No services selected");
    try {
      await bulkUpdateServiceStatus(selectedIds, status);
      toast.success(`Updated ${selectedIds.length} service(s)`);
      setSelectedIds([]);
      fetchServices({ showDeleted });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to update status");
    }
  };

  const confirmBulkDelete = async () => {
    try {
      await bulkDeleteServices(selectedIds);
      toast.success(`Deleted ${selectedIds.length} service(s)`);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
      fetchServices({ showDeleted });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || e?.message || "Failed to delete services");
    }
  };

  const columns: Column<any>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={Boolean(services.length > 0 && selectedIds.length === services.length)}
          onChange={(e) => {
            if (e.target.checked) setSelectedIds(services.map((s) => String(s.id ?? s.service_id)));
            else setSelectedIds([]);
          }}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(String(row.id ?? row.service_id))}
          onChange={(e) => {
            const id = String(row.id ?? row.service_id);
            if (e.target.checked) setSelectedIds((prev) => [...prev, id]);
            else setSelectedIds((prev) => prev.filter((x) => x !== id));
          }}
        />
      ),
    },
    {
      key: "image",
      header: "Image",
      render: (row) => {
        const src = toImageSrc(row.image ?? row.image_url ?? row.thumbnail ?? row.photo ?? row.picture ?? row.img ?? "");
        if (!src) return <span style={{ color: "#999", fontSize: 12 }}>—</span>;
        return (
          <img
            src={src}
            alt={row.name ?? "service"}
            style={{ width: 72, height: 48, objectFit: "cover", borderRadius: 4 }}
            onError={(e) => { (e.target as HTMLImageElement).src = imageFallbackSvg; }}
          />
        );
      },
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      render: (row) => <strong>{row.name ?? row.title ?? "—"}</strong>,
    },
    {
      key: "category",
      header: "Category",
      sortable: true,
      render: (row) => {
        const direct = row?.category && (row.category.name ?? row.category.title);
        const fallback = row?.category_name ?? (row?.category_id && categoriesMap[String(row.category_id)]) ?? row?.category_id ?? "";
        return String(direct ?? fallback ?? "") || "—";
      },
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (row) => row.price != null ? `₱ ${Number(row.price).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => {
        if (isRowDeleted(row)) return <span className="badge bg-danger">Deleted</span>;
        const s = (row.status ?? "").toLowerCase();
        const cls = s === "active" ? "bg-success" : s === "inactive" ? "bg-secondary" : "bg-light text-dark";
        return <span className={`badge ${cls}`}>{row.status || "—"}</span>;
      },
    },
    {
      key: "action",
      header: "Action",
      minWidth: 140,
      render: (row) => {
        const id = row.id ?? row.service_id;
        if (isRowDeleted(row)) {
          return (
            <button className="btn btn-sm btn-outline-success" type="button" onClick={() => { setRestoreTarget(row); setShowRestoreConfirm(true); }}>
              Restore
            </button>
          );
        }
        return (
          <div className="btn-group btn-group-sm">
            <button className="btn btn-secondary" type="button" onClick={() => router.push(`/services/edit/${id}`)}>Edit</button>
            <button className="btn btn-danger" type="button" onClick={() => { setPendingDeleteId(id); setShowConfirm(true); }}>Delete</button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      <div className="container-fluid px-4 pt-3">
        <h3 className="mb-3">Manage Services</h3>
        <SearchBar
          placeholder="Search services"
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
                Advanced Search
              </button>
              <Link
                href="/services/create"
                className="btn btn-primary d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: "10px 20px", whiteSpace: "nowrap" }}
              >
                Create Service
              </Link>
              <Link
                href="/services/category_create"
                className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                style={{ height: 40, padding: "10px 18px", whiteSpace: "nowrap" }}
              >
                Create Category
              </Link>
            </div>
          )}
          filtersOpen={showAdvancedSearch}
          onFiltersOpenChange={(open) => { if (!open) setShowAdvancedSearch(false); }}
          externalOpenAsModal={true}
          advancedSearchUpdatesInput={false}
          onAdvancedSearch={(values) => setAdvancedSearchValues(values)}
          advancedFields={[
            { name: "name", label: "Service Name" },
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
              <button className="list-group-item list-group-item-action" onClick={() => handleBulkActivate("active")} type="button" disabled={selectedIds.length === 0}>
                Activate ({selectedIds.length})
              </button>
              <button className="list-group-item list-group-item-action" onClick={() => handleBulkActivate("inactive")} type="button" disabled={selectedIds.length === 0}>
                Deactivate ({selectedIds.length})
              </button>
              <button className="list-group-item list-group-item-action text-danger" onClick={() => setShowBulkDeleteConfirm(true)} type="button" disabled={selectedIds.length === 0}>
                Delete ({selectedIds.length})
              </button>
            </>
          )}
          onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, perPage: sPerPage, showDeleted: sDel, advancedValues }) => {
            setSortBy(sBy === "modified" ? "updated_at" : sBy === "title" ? "name" : sBy);
            setSortOrder(sOrder);
            setPerPage(sPerPage);
            setCurrentPage(1);
            setShowDeleted(sDel);
            setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
            fetchServices({ showDeleted: sDel });
          }}
          initialSortBy={sortBy as any}
          initialSortOrder={sortOrder}
          initialPerPage={perPage}
          initialShowDeleted={showDeleted}
        />

        <div className="card">
          <div className="card-body">
            {error && <div className="text-danger mb-2">{error}</div>}
            <DataTable
              columns={columns}
              data={services}
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
        title="Delete service"
        message={<span>Are you sure you want to delete this service? This action cannot be undone.</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmDelete}
        onCancel={() => { setShowConfirm(false); setPendingDeleteId(null); }}
      />
      <ConfirmModal
        show={showRestoreConfirm && !!restoreTarget}
        title="Restore service"
        message={<span>Restore <strong>{restoreTarget?.name ?? restoreTarget?.title ?? restoreTarget?.id}</strong>?</span>}
        confirmLabel="Restore"
        cancelLabel="Cancel"
        onConfirm={confirmRestore}
        onCancel={() => { setShowRestoreConfirm(false); setRestoreTarget(null); }}
      />
      <ConfirmModal
        show={showBulkDeleteConfirm}
        title="Delete services"
        message={<span>Are you sure you want to delete <strong>{selectedIds.length}</strong> selected service(s)?</span>}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        onConfirm={confirmBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </>
  );
}

ManageServices.Layout = AdminLayout;
