import { useCallback, useEffect, useMemo, useState } from "react";
import ConfirmModal from "@/components/UI/ConfirmModal";
import CreateManageServiceModal from "@/components/CommerceAdmin/modals/CreateManageServiceModal";
import EditManageServiceModal from "@/components/CommerceAdmin/modals/EditManageServiceModal";
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
import { getServices, updateService } from "@/services/serviceService";
import styles from "@/styles/commerceAdmin.module.css";

type ManagedSubTab = "services" | "discounts";

const GRID_PAGE_SIZE = 6;
const LIST_PAGE_SIZE = 8;

function serviceTypeIcon(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("cloud")) return "fa-cloud";
  if (normalized.includes("shared")) return "fa-layer-group";
  if (normalized.includes("dedicated") || normalized.includes("bare")) return "fa-server";
  if (normalized.includes("domain")) return "fa-globe";
  if (normalized.includes("design")) return "fa-palette";
  if (normalized.includes("document") || normalized.includes("dms")) return "fa-folder-open";
  return "fa-box";
}

function serviceActive(service: any) {
  const status = String(service.status ?? service.visibility ?? "active").toLowerCase();
  return status === "active" && !service.deleted_at;
}

function formatServiceDate(value?: string | null) {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export default function CommerceManagedTab() {
  const [subTab, setSubTab] = useState<ManagedSubTab>("services");
  const [viewMode, setViewMode] = useState<"list" | "grid">("grid");
  const [activeServiceType, setActiveServiceType] = useState("");
  const [servicePage, setServicePage] = useState(1);
  const [services, setServices] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [createServiceOpen, setCreateServiceOpen] = useState(false);
  const [editService, setEditService] = useState<any | null>(null);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [deleteCouponTarget, setDeleteCouponTarget] = useState<Coupon | null>(null);
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
    loadServices();
    loadCoupons();
  }, [loadServices, loadCoupons]);

  const serviceTypes = useMemo(() => {
    const types = new Set<string>();
    services.forEach((service) => types.add(resolveServiceTypeLabel(service)));
    return Array.from(types);
  }, [services]);

  const groupedServices = useMemo(() => groupServicesByType(services), [services]);

  const pageSize = viewMode === "grid" ? GRID_PAGE_SIZE : LIST_PAGE_SIZE;

  const activeGroupServices = useMemo(() => {
    if (!activeServiceType) return services;
    const group = groupedServices.find(({ type }) => type === activeServiceType);
    return group?.services ?? [];
  }, [activeServiceType, groupedServices, services]);

  const totalServicePages = Math.max(1, Math.ceil(activeGroupServices.length / pageSize));

  const paginatedServices = useMemo(() => {
    const start = (servicePage - 1) * pageSize;
    return activeGroupServices.slice(start, start + pageSize);
  }, [activeGroupServices, pageSize, servicePage]);

  const serviceRangeStart = activeGroupServices.length ? (servicePage - 1) * pageSize + 1 : 0;
  const serviceRangeEnd = Math.min(servicePage * pageSize, activeGroupServices.length);

  useEffect(() => {
    if (!groupedServices.length) {
      setActiveServiceType("");
      return;
    }
    const exists = groupedServices.some(({ type }) => type === activeServiceType);
    if (!exists) setActiveServiceType(groupedServices[0].type);
  }, [groupedServices, activeServiceType]);

  useEffect(() => {
    setServicePage(1);
  }, [activeServiceType, viewMode]);

  useEffect(() => {
    if (servicePage > totalServicePages) setServicePage(totalServicePages);
  }, [servicePage, totalServicePages]);

  const handleServiceAction = async (service: any, action: string) => {
    const id = service.id ?? service.service_id;
    const serviceName = service.name ?? service.title ?? "Service";
    if (action === "clients") {
      toast.success(`Viewing active client accounts subscribed to ${serviceName}.`);
      return;
    }
    if (action === "discount") {
      const nextPrice = Math.round(Number(service.price ?? 0) * 0.9);
      try {
        await updateService(id, { price: nextPrice });
        toast.success(`Applied 10% promotional discount to ${serviceName}!`);
        loadServices();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to apply discount.");
      }
      return;
    }
    if (action === "toggle") {
      const nextStatus = serviceActive(service) ? "inactive" : "active";
      try {
        await updateService(id, { status: nextStatus, is_active: nextStatus === "active" ? 1 : 0 });
        toast.success(`Service ${serviceName} status updated to ${nextStatus === "active" ? "Active" : "Disabled"}.`);
        loadServices();
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to update service status.");
      }
      return;
    }
    if (action === "edit") {
      setEditService(service);
    }
  };

  const renderServiceActionSelect = (service: any) => (
    <select
      className={styles.actionSelect}
      defaultValue=""
      onChange={(e) => {
        const value = e.target.value;
        e.target.value = "";
        if (value) void handleServiceAction(service, value);
      }}
    >
      <option value="" disabled>
        Select Action...
      </option>
      <option value="clients">View Clients</option>
      <option value="discount">Apply 10% Discount</option>
      <option value="toggle">{serviceActive(service) ? "Disable Service" : "Enable Service"}</option>
      <option value="edit">Edit Service</option>
    </select>
  );

  const renderServiceGroupHeader = (type: string, count: number) => (
    <div className={styles.managedServiceSummary}>
      <div>
        <p className={styles.managedServiceSummaryLabel}>Active service group</p>
        <h4 className={styles.managedServiceSummaryTitle}>{type}</h4>
      </div>
      <div className={styles.managedServiceSummaryMeta}>
        <span className={styles.managedServiceGroupCount}>
          {count} {count === 1 ? "plan" : "plans"}
        </span>
        <span className={styles.managedServiceSummaryPage}>
          Page {servicePage} of {totalServicePages}
        </span>
      </div>
    </div>
  );

  const renderServiceCategoryNav = () => (
    <div className={styles.managedServiceCategoryNav} role="tablist" aria-label="Service categories">
      {groupedServices.map(({ type, services: groupServices }) => {
        const isActive = activeServiceType === type;
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={isActive ? styles.managedServiceCategoryBtnActive : styles.managedServiceCategoryBtn}
            onClick={() => setActiveServiceType(type)}
          >
            <span className={styles.managedServiceCategoryIcon} aria-hidden="true">
              <i className={`fa-solid ${serviceTypeIcon(type)}`} />
            </span>
            <span className={styles.managedServiceCategoryCopy}>
              <span className={styles.managedServiceCategoryLabel}>{type}</span>
              <span className={styles.managedServiceCategoryCount}>{groupServices.length} plans</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  const renderServicePagination = () => (
    <div className={styles.paginationBar}>
      <div className={styles.paginationInfo}>
        {activeGroupServices.length === 0
          ? "Showing 0 plans"
          : `Showing ${serviceRangeStart}-${serviceRangeEnd} of ${activeGroupServices.length} plans in ${activeServiceType}`}
      </div>
      <div className={styles.paginationActions}>
        <button
          type="button"
          className={styles.secondaryBtnSm}
          disabled={servicePage <= 1}
          onClick={() => setServicePage((current) => Math.max(1, current - 1))}
        >
          Previous
        </button>
        <span className={styles.managedServicePageIndicator}>
          {servicePage} / {totalServicePages}
        </span>
        <button
          type="button"
          className={styles.primaryBtnSm}
          disabled={servicePage >= totalServicePages}
          onClick={() => setServicePage((current) => Math.min(totalServicePages, current + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );

  const renderServiceGridCard = (service: any) => (
    <article key={service.id ?? service.service_id} className={styles.managedServiceCard}>
      <div className={styles.managedServiceCardTop}>
        <span className={styles.typeBadge}>{resolveServiceTypeLabel(service)}</span>
        <span className={serviceActive(service) ? styles.badgePaid : styles.badgeMuted}>
          {serviceActive(service) ? "Active" : "Disabled"}
        </span>
      </div>
      <h4>{service.name ?? service.title}</h4>
      <div className={styles.amountCell}>{formatCommerceMoney(Number(service.price ?? 0))} / yr</div>
      <div className={styles.managedMeta}>
        <p>Created: {formatServiceDate(service.created_at)}</p>
        <p>Modified: {formatServiceDate(service.updated_at)}</p>
      </div>
      {renderServiceActionSelect(service)}
    </article>
  );

  const renderServiceTableRow = (service: any) => (
    <tr key={service.id ?? service.service_id}>
      <td><strong>{service.name ?? service.title}</strong></td>
      <td><span className={styles.typeBadge}>{resolveServiceTypeLabel(service)}</span></td>
      <td className={styles.amountCell}>{formatCommerceMoney(Number(service.price ?? 0))}</td>
      <td>
        <span className={serviceActive(service) ? styles.badgePaid : styles.badgeMuted}>
          {serviceActive(service) ? "Active" : "Disabled"}
        </span>
      </td>
      <td>{formatServiceDate(service.created_at)}</td>
      <td>{formatServiceDate(service.updated_at)}</td>
      <td className={styles.tableActionCell}>{renderServiceActionSelect(service)}</td>
    </tr>
  );

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
      toast.success(`Discount code ${discountForm.code.toUpperCase()} created successfully.`);
      setDiscountOpen(false);
      setDiscountForm({ code: "", name: "", discount_value: 10, target: "All Services" });
      loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create discount code.");
    }
  };

  const toggleCoupon = async (coupon: Coupon) => {
    const nextStatus = String(coupon.status).toLowerCase() === "active" ? "inactive" : "active";
    try {
      await updateCoupon(coupon.id, { status: nextStatus });
      toast.success("Discount rule status updated.");
      loadCoupons();
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
      loadCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete coupon.");
    }
  };

  return (
    <div className={styles.tabStack}>
      <div className={styles.subTabNav}>
        <button
          type="button"
          className={subTab === "services" ? styles.subTabBtnActive : styles.subTabBtn}
          onClick={() => setSubTab("services")}
        >
          <i className="fa-solid fa-server" aria-hidden="true" /> Manage Service
        </button>
        <button
          type="button"
          className={subTab === "discounts" ? styles.subTabBtnActive : styles.subTabBtn}
          onClick={() => setSubTab("discounts")}
        >
          <i className="fa-solid fa-tag" aria-hidden="true" /> Manage Discount
        </button>
      </div>

      {subTab === "services" ? (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Hosting Plans &amp; Canvas 7 Templates</h3>
              <p className={styles.panelSubtitle}>
                Configure pricing, RAM specifications, SSD storage limits, and template packages.
              </p>
            </div>
            <div className={styles.toolbar}>
              <div className={styles.analyticsToggle}>
                <button
                  type="button"
                  className={viewMode === "list" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn}
                  onClick={() => setViewMode("list")}
                >
                  <i className="fa-solid fa-list" aria-hidden="true" /> List
                </button>
                <button
                  type="button"
                  className={viewMode === "grid" ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn}
                  onClick={() => setViewMode("grid")}
                >
                  <i className="fa-solid fa-table-cells" aria-hidden="true" /> Grid
                </button>
              </div>
              <button type="button" className={styles.primaryBtnSm} onClick={() => setCreateServiceOpen(true)}>
                Add Manage Service
              </button>
            </div>
          </div>

          {loadingServices ? (
            <p className={styles.emptyState}>Loading services...</p>
          ) : services.length === 0 ? (
            <p className={styles.emptyState}>No services found.</p>
          ) : (
            <div className={styles.managedServiceLayout}>
              {renderServiceCategoryNav()}
              {renderServiceGroupHeader(activeServiceType, activeGroupServices.length)}

              {viewMode === "list" ? (
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Service Name</th>
                        <th>Type</th>
                        <th>Base Price</th>
                        <th>Status</th>
                        <th>Date create</th>
                        <th>Date Modified</th>
                        <th className={styles.tableActionHead}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedServices.length === 0 ? (
                        <tr>
                          <td colSpan={7}>No plans in this category.</td>
                        </tr>
                      ) : (
                        paginatedServices.map(renderServiceTableRow)
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.managedServiceGrid}>
                  {paginatedServices.length === 0 ? (
                    <p className={styles.emptyState}>No plans in this category.</p>
                  ) : (
                    paginatedServices.map(renderServiceGridCard)
                  )}
                </div>
              )}

              {renderServicePagination()}
            </div>
          )}
        </section>
      ) : (
        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h3 className={styles.panelTitle}>Promotional Discounts &amp; Coupon Management</h3>
              <p className={styles.panelSubtitle}>
                Create discount coupons, set promotional pricing rules, and apply rebates across services.
              </p>
            </div>
            <button type="button" className={styles.primaryBtnSm} onClick={() => setDiscountOpen(true)}>
              <i className="fa-solid fa-plus" aria-hidden="true" /> Create Discount Code
            </button>
          </div>

          {loadingCoupons ? (
            <p className={styles.emptyState}>Loading discounts...</p>
          ) : coupons.length === 0 ? (
            <p className={styles.emptyState}>No discount codes yet.</p>
          ) : (
            <div className={styles.discountList}>
              {coupons.map((coupon) => {
                const active = String(coupon.status).toLowerCase() === "active";
                const target = coupon.description?.replace("Target Category: ", "") ?? "All Services";
                const discountLabel =
                  coupon.discount_type === "percent"
                    ? `${Number(coupon.discount_value)}% OFF`
                    : formatCommerceMoney(Number(coupon.discount_value));
                return (
                  <article key={coupon.id} className={styles.discountCard}>
                    <div>
                      <div className={styles.discountCardTop}>
                        <span className={styles.monoCell}>{coupon.code}</span>
                        <span className={active ? styles.badgePaid : styles.badgeMuted}>
                          {active ? "Active" : "Paused"}
                        </span>
                      </div>
                      <h4>{coupon.name}</h4>
                      <p className={styles.panelSubtitle}>
                        Target Category: <strong>{target}</strong> · Discount:{" "}
                        <strong className={styles.amountCell}>{discountLabel}</strong>
                      </p>
                    </div>
                    <div className={styles.discountCardActions}>
                      <button
                        type="button"
                        className={active ? styles.warningBtnSm : styles.successBtnSm}
                        onClick={() => void toggleCoupon(coupon)}
                      >
                        {active ? "Pause" : "Activate"}
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtnSm}
                        onClick={() => setDeleteCouponTarget(coupon)}
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {discountOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create New Discount Code</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setDiscountOpen(false)}
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={submitDiscount}>
              <label className={styles.modalLabel}>
                Coupon Code
                <input
                  className={styles.modalInput}
                  value={discountForm.code}
                  onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. SUMMER25"
                  required
                />
              </label>
              <label className={styles.modalLabel}>
                Discount Description / Title
                <input
                  className={styles.modalInput}
                  value={discountForm.name}
                  onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                  placeholder="e.g. 25% Off Summer Special"
                  required
                />
              </label>
              <div className={styles.modalGrid2}>
                <label className={styles.modalLabel}>
                  Discount %
                  <input
                    className={styles.modalInput}
                    type="number"
                    min="1"
                    max="100"
                    value={discountForm.discount_value}
                    onChange={(e) =>
                      setDiscountForm({ ...discountForm, discount_value: Number(e.target.value) })
                    }
                    required
                  />
                </label>
                <label className={styles.modalLabel}>
                  Service Category
                  <select
                    className={styles.select}
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
                </label>
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtnSm} onClick={() => setDiscountOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtnSm}>
                  Create Coupon
                </button>
              </div>
            </form>
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
    </div>
  );
}
