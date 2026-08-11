import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ConfirmModal from "@/components/UI/ConfirmModal";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import CreateManageServiceModal from "@/components/CommerceAdmin/modals/CreateManageServiceModal";
import EditManageServiceModal from "@/components/CommerceAdmin/modals/EditManageServiceModal";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsModuleDate,
  CmsModuleLabelPill,
  CmsModuleRowActions,
  CmsModuleStatusBadge,
  CmsModuleTitleCell,
  cmsModuleTableProps,
} from "@/components/Modules/moduleTableUi";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import { groupServicesByType, resolveServiceTypeLabel } from "@/lib/commerceAdmin/serviceHelpers";
import { toast } from "@/lib/toast";
import {
  Coupon,
  createCoupon,
  deleteCoupon,
  getCoupons,
  updateCoupon,
} from "@/services/couponService";
import {
  fetchCommerceServices,
  type CommerceServiceAdminRow,
} from "@/services/commerceAdminService";
import { getServices, updateService } from "@/services/serviceService";

type ManagedSubTab = "services" | "discounts";

type ClientsModalState =
  | { open: false }
  | {
      open: true;
      serviceName: string;
      loading: boolean;
      clients: CommerceServiceAdminRow[];
    };

function serviceActive(service: any) {
  const status = String(service.status ?? service.visibility ?? "active").toLowerCase();
  return status === "active" && !service.deleted_at;
}

function formatServiceDate(value?: string | null) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export default function CmsManagedContent() {
  const [subTab, setSubTab] = useState<ManagedSubTab>("services");
  const [activeServiceType, setActiveServiceType] = useState("all");
  const [services, setServices] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [editService, setEditService] = useState<any | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [deleteCouponTarget, setDeleteCouponTarget] = useState<Coupon | null>(null);
  const [clientsModal, setClientsModal] = useState<ClientsModalState>({ open: false });
  const [discountForm, setDiscountForm] = useState({
    code: "",
    name: "",
    discount_value: 10,
    target: "All Services",
  });

  const loadServices = useCallback(async () => {
    setLoadingServices(true);
    try {
      const res = await getServices({ per_page: 200 }, { silent: true });
      setServices(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setServices([]);
    } finally {
      setLoadingServices(false);
    }
  }, []);

  const loadCoupons = useCallback(async () => {
    setLoadingCoupons(true);
    try {
      const res = await getCoupons({ per_page: 100 }, { silent: true });
      setCoupons(Array.isArray(res?.data) ? res.data : []);
    } catch {
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  }, []);

  useEffect(() => {
    void loadServices();
    void loadCoupons();
  }, [loadServices, loadCoupons]);

  const serviceTypes = useMemo(() => {
    const types = new Set<string>();
    services.forEach((service) => types.add(resolveServiceTypeLabel(service)));
    return Array.from(types);
  }, [services]);

  const groupedServices = useMemo(() => groupServicesByType(services), [services]);

  const filteredServices = useMemo(() => {
    const query = search.trim().toLowerCase();
    return services.filter((service) => {
      const type = resolveServiceTypeLabel(service);
      if (activeServiceType !== "all" && type !== activeServiceType) return false;
      if (!query) return true;
      const haystack = [
        service.name ?? service.title,
        type,
        serviceActive(service) ? "active" : "inactive",
        String(service.price ?? ""),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [services, activeServiceType, search]);

  const filteredCoupons = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return coupons;
    return coupons.filter((coupon) =>
      [coupon.code, coupon.name, coupon.description, coupon.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [coupons, search]);

  const totalPages = Math.max(
    1,
    Math.ceil((subTab === "services" ? filteredServices.length : filteredCoupons.length) / perPage),
  );

  const pagedServices = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredServices.slice(start, start + perPage);
  }, [filteredServices, currentPage, perPage]);

  const pagedCoupons = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filteredCoupons.slice(start, start + perPage);
  }, [filteredCoupons, currentPage, perPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [subTab, activeServiceType, search, perPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const handleServiceAction = async (service: any, action: string) => {
    const id = service.id ?? service.service_id;
    const serviceName = String(service.name ?? service.title ?? "Service");

    if (action === "clients") {
      setClientsModal({ open: true, serviceName, loading: true, clients: [] });
      try {
        const rows = await fetchCommerceServices("Active", undefined, {
          plan: serviceName,
          perPage: 200,
        });
        // Fall back to all statuses if no active subscriptions match this plan name.
        const fallback =
          rows.length > 0
            ? rows
            : await fetchCommerceServices(undefined, undefined, {
                plan: serviceName,
                perPage: 200,
              });
        setClientsModal({
          open: true,
          serviceName,
          loading: false,
          clients: fallback,
        });
      } catch (err: any) {
        setClientsModal({ open: true, serviceName, loading: false, clients: [] });
        toast.error(err?.response?.data?.message || "Failed to load clients for this service.");
      }
      return;
    }

    if (action === "discount") {
      const nextPrice = Math.round(Number(service.price ?? 0) * 0.9);
      try {
        await updateService(id, { price: nextPrice });
        toast.success(`Applied 10% promotional discount to ${serviceName}.`);
        void loadServices();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to apply discount.");
      }
      return;
    }

    if (action === "toggle") {
      const nextStatus = serviceActive(service) ? "inactive" : "active";
      try {
        await updateService(id, { status: nextStatus, is_active: nextStatus === "active" ? 1 : 0 });
        toast.success(
          `Service ${serviceName} marked as ${nextStatus === "active" ? "Active" : "Inactive"}.`,
        );
        void loadServices();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to update service status.");
      }
      return;
    }

    if (action === "edit") {
      setEditService(service);
    }
  };

  const submitDiscount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!discountForm.code.trim() || !discountForm.name.trim()) {
      toast.error("Coupon code and title are required.");
      return;
    }
    try {
      await createCoupon({
        code: discountForm.code.trim().toUpperCase(),
        name: discountForm.name.trim(),
        description: `Target Category: ${discountForm.target}`,
        discount_type: "percent",
        discount_value: Number(discountForm.discount_value || 0),
        status: "active",
      });
      toast.success(`Discount code ${discountForm.code.toUpperCase()} created.`);
      setDiscountOpen(false);
      setDiscountForm({ code: "", name: "", discount_value: 10, target: "All Services" });
      void loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create discount code.");
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    const nextStatus = String(coupon.status).toLowerCase() === "active" ? "inactive" : "active";
    try {
      await updateCoupon(coupon.id, { status: nextStatus });
      toast.success("Discount status updated.");
      void loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update coupon.");
    }
  };

  const confirmDeleteCoupon = async () => {
    if (!deleteCouponTarget) return;
    try {
      await deleteCoupon(deleteCouponTarget.id);
      toast.success("Discount rule deleted.");
      setDeleteCouponTarget(null);
      void loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete coupon.");
    }
  };

  const serviceColumns: Column<any>[] = [
    {
      key: "name",
      header: "Service",
      sortable: true,
      render: (row) => (
        <CmsModuleTitleCell
          title={String(row.name ?? row.title ?? "—")}
          subtitle={resolveServiceTypeLabel(row)}
        />
      ),
    },
    {
      key: "type",
      header: "Category",
      render: (row) => <CmsModuleLabelPill>{resolveServiceTypeLabel(row)}</CmsModuleLabelPill>,
    },
    {
      key: "price",
      header: "Base Price",
      render: (row) => formatCommerceMoney(Number(row.price ?? 0)),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <CmsModuleStatusBadge
          status={serviceActive(row) ? "active" : "inactive"}
          label={serviceActive(row) ? "Active" : "Inactive"}
        />
      ),
    },
    {
      key: "created_at",
      header: "Created",
      render: (row) => <CmsModuleDate value={formatServiceDate(row.created_at)} />,
    },
    {
      key: "updated_at",
      header: "Modified",
      render: (row) => <CmsModuleDate value={formatServiceDate(row.updated_at)} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <CmsModuleRowActions>
          <select
            className="form-select form-select-sm cms-managed__action-select"
            defaultValue=""
            aria-label={`Actions for ${row.name ?? row.title ?? "service"}`}
            onChange={(e) => {
              const value = e.target.value;
              e.target.value = "";
              if (value) void handleServiceAction(row, value);
            }}
          >
            <option value="" disabled>
              Actions...
            </option>
            <option value="clients">View Clients</option>
            <option value="edit">Edit Service</option>
            <option value="discount">Apply 10% Discount</option>
            <option value="toggle">
              {serviceActive(row) ? "Disable Service" : "Enable Service"}
            </option>
          </select>
        </CmsModuleRowActions>
      ),
    },
  ];

  const couponColumns: Column<Coupon>[] = [
    {
      key: "code",
      header: "Code",
      sortable: true,
      render: (row) => <span className="fw-bold">{row.code}</span>,
    },
    { key: "name", header: "Name", sortable: true },
    {
      key: "discount",
      header: "Discount",
      render: (row) =>
        row.discount_type === "percent"
          ? `${row.discount_value}%`
          : formatCommerceMoney(Number(row.discount_value)),
    },
    {
      key: "target",
      header: "Target",
      render: (row) => (
        <CmsModuleLabelPill>
          {row.description?.replace("Target Category: ", "") || "All Services"}
        </CmsModuleLabelPill>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => (
        <CmsModuleStatusBadge
          status={String(row.status ?? "inactive").toLowerCase()}
          label={String(row.status ?? "inactive").toLowerCase() === "active" ? "Active" : "Paused"}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        const active = String(row.status).toLowerCase() === "active";
        return (
          <CmsModuleRowActions>
            <button
              type="button"
              className="btn btn-link p-0 text-secondary"
              title={active ? "Pause" : "Activate"}
              onClick={() => void toggleCoupon(row)}
            >
              <i className={`fas ${active ? "fa-pause" : "fa-play"}`} />
            </button>
            <button
              type="button"
              className="btn btn-link p-0 text-danger"
              title="Delete"
              onClick={() => setDeleteCouponTarget(row)}
            >
              <i className="fas fa-trash" />
            </button>
          </CmsModuleRowActions>
        );
      },
    },
  ];

  const stats = [
    { label: "Services", value: services.length, tone: "accent" as const },
    {
      label: "Active plans",
      value: services.filter(serviceActive).length,
      tone: "published" as const,
    },
    { label: "Categories", value: groupedServices.length },
    {
      label: "Discounts",
      value: coupons.length,
      tone: coupons.length ? ("draft" as const) : ("default" as const),
    },
  ];

  return (
    <CmsModuleShell
      title="Manage Services"
      description="Hosting plans, Canvas templates, and discount rules for commerce offerings."
      icon="fa-solid fa-server"
      stats={stats}
      actions={
        subTab === "services" ? (
          <button
            type="button"
            className="btn btn-primary cms-module__create-btn"
            onClick={() => setCreateServiceOpen(true)}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Add Service
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary cms-module__create-btn"
            onClick={() => setDiscountOpen(true)}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Create Discount
          </button>
        )
      }
      toolbar={
        <div className="cms-managed__toolbar">
          <div className="cms-settings-pills" role="tablist" aria-label="Manage Services sections">
            <button
              type="button"
              role="tab"
              aria-selected={subTab === "services"}
              className={`cms-settings-pills__btn${subTab === "services" ? " is-active" : ""}`}
              onClick={() => setSubTab("services")}
            >
              <i className="fa-solid fa-server" aria-hidden="true" />
              Services
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={subTab === "discounts"}
              className={`cms-settings-pills__btn${subTab === "discounts" ? " is-active" : ""}`}
              onClick={() => setSubTab("discounts")}
            >
              <i className="fa-solid fa-tag" aria-hidden="true" />
              Discounts
            </button>
          </div>

          <SearchBar
            placeholder={subTab === "services" ? "Search services" : "Search discounts"}
            value={search}
            onChange={setSearch}
            showFiltersButton={false}
            showActionsButton={false}
            rightExtras={
              subTab === "services" ? (
                <select
                  className="form-select cms-managed__category-select"
                  value={activeServiceType}
                  onChange={(e) => setActiveServiceType(e.target.value)}
                  aria-label="Filter by category"
                >
                  <option value="all">All categories</option>
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : null
            }
          />
        </div>
      }
    >
      {subTab === "services" ? (
        <DataTable
          columns={serviceColumns}
          data={pagedServices}
          loading={loadingServices}
          {...cmsModuleTableProps}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={perPage}
          onItemsPerPageChange={(n) => {
            setPerPage(n);
            setCurrentPage(1);
          }}
          selectable={false}
        />
      ) : (
        <DataTable
          columns={couponColumns}
          data={pagedCoupons}
          loading={loadingCoupons}
          {...cmsModuleTableProps}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          itemsPerPage={perPage}
          onItemsPerPageChange={(n) => {
            setPerPage(n);
            setCurrentPage(1);
          }}
          selectable={false}
        />
      )}

      {discountOpen ? (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,0.35)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <form onSubmit={submitDiscount}>
                <div className="modal-header">
                  <h5 className="modal-title">Create Discount Code</h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setDiscountOpen(false)}
                  />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Coupon Code *</label>
                      <input
                        className="form-control"
                        value={discountForm.code}
                        onChange={(e) =>
                          setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })
                        }
                        placeholder="e.g. SUMMER25"
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Title *</label>
                      <input
                        className="form-control"
                        value={discountForm.name}
                        onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                        placeholder="e.g. 25% Off Summer Special"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Discount %</label>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="form-control"
                        value={discountForm.discount_value}
                        onChange={(e) =>
                          setDiscountForm({
                            ...discountForm,
                            discount_value: Number(e.target.value),
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Service Category</label>
                      <select
                        className="form-select"
                        value={discountForm.target}
                        onChange={(e) => setDiscountForm({ ...discountForm, target: e.target.value })}
                      >
                        {serviceTypes.length ? (
                          serviceTypes.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))
                        ) : (
                          <>
                            <option value="Hosting">Hosting</option>
                            <option value="Custom Web Design">Custom Web Design</option>
                            <option value="Domain">Domain</option>
                            <option value="DMS">DMS</option>
                          </>
                        )}
                        <option value="All Services">All Services</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setDiscountOpen(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Coupon
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      {clientsModal.open ? (
        <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,0.35)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-1">View Clients</h5>
                  <p className="text-muted small mb-0">
                    Active client accounts subscribed to <strong>{clientsModal.serviceName}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setClientsModal({ open: false })}
                />
              </div>
              <div className="modal-body">
                {clientsModal.loading ? (
                  <p className="text-muted mb-0">Loading clients...</p>
                ) : clientsModal.clients.length === 0 ? (
                  <p className="text-muted mb-0">No clients are subscribed to this service yet.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>Email</th>
                          <th>Plan</th>
                          <th>Status</th>
                          <th>Renew</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientsModal.clients.map((row) => (
                          <tr key={row.id}>
                            <td>
                              <strong>{row.company || row.client}</strong>
                              {row.company ? (
                                <div className="text-muted small">{row.client}</div>
                              ) : null}
                            </td>
                            <td>{row.email || "—"}</td>
                            <td>{row.plan || row.title || "—"}</td>
                            <td>
                              <CmsModuleStatusBadge
                                status={String(row.status ?? "").toLowerCase() === "active" ? "active" : "inactive"}
                                label={row.status || "—"}
                              />
                            </td>
                            <td>{row.renewAt || row.renewLabel || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <Link
                  href={`${COMMERCE_ADMIN_PATH}?tab=clients`}
                  className="btn btn-outline-secondary"
                  onClick={() => setClientsModal({ open: false })}
                >
                  Open Clients
                </Link>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setClientsModal({ open: false })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <CreateManageServiceModal
        open={createServiceOpen}
        onClose={() => setCreateServiceOpen(false)}
        onCreated={loadServices}
      />

      <EditManageServiceModal
        open={!!editService}
        service={editService}
        onClose={() => setEditService(null)}
        onSaved={loadServices}
      />

      <ConfirmModal
        show={!!deleteCouponTarget}
        title="Delete Discount Code"
        message={
          <>
            Delete coupon <strong>{deleteCouponTarget?.code}</strong>?
          </>
        }
        confirmLabel="Delete"
        onConfirm={confirmDeleteCoupon}
        onCancel={() => setDeleteCouponTarget(null)}
      />
    </CmsModuleShell>
  );
}
