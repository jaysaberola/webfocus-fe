import { useEffect, useMemo, useState } from "react";
import { axiosInstance } from "@/services/axios";
import { createService, getServices } from "@/services/serviceService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

const ADDONS = [
  { name: "WhoIs Privacy", price: 780 },
  { name: "Static IP", price: 3000 },
  { name: "Sitelock Security", price: 14160 },
  { name: "Codeguard Backup", price: 6720 },
  { name: "Magic Spam PRO", price: 23400 },
  { name: "Imunify360", price: 23400 },
  { name: "Wildcard SSL", price: 23400 },
  { name: "Standard SSL", price: 10800 },
];

const FALLBACK_TYPES = [
  "Cloud Hosting",
  "Shared Hosting",
  "Dedicated Hosting",
  "Bare-Metal Hosting",
  "Custom Web Design",
  "Secure Domain",
  "Document Management System",
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateManageServiceModal({ open, onClose, onCreated }: Props) {
  const [categories, setCategories] = useState<Array<{ id: string | number; name: string }>>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [serviceType, setServiceType] = useState("");
  const [planKey, setPlanKey] = useState("");
  const [customPlanName, setCustomPlanName] = useState("");
  const [addonName, setAddonName] = useState("");
  const [price, setPrice] = useState("");
  const [billing, setBilling] = useState("yr");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      loadCategories(),
      getServices({ per_page: 200 }, { silent: true }),
    ])
      .then(([, serviceRes]) => {
        setPlans(Array.isArray(serviceRes?.data) ? serviceRes.data : []);
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  }, [open]);

  const loadCategories = async () => {
    const endpoints = ["/fetch-service-categories", "/service-categories", "/categories?type=service", "/categories"];
    for (const ep of endpoints) {
      try {
        const res = await axiosInstance.get(ep, { headers: { "X-No-Loading": true } });
        const data = res.data?.data ?? res.data ?? [];
        if (Array.isArray(data) && data.length) {
          setCategories(data.map((c: any) => ({ id: c.id ?? c.slug ?? c.name, name: c.name ?? c.title ?? String(c) })));
          return;
        }
      } catch {
        /* try next */
      }
    }
    setCategories([]);
  };

  const serviceTypes = useMemo(() => {
    const types = new Set<string>(FALLBACK_TYPES);
    categories.forEach((category) => types.add(category.name));
    plans.forEach((plan) => {
      types.add(String(plan.category_name ?? plan.category ?? plan.type ?? "Service"));
    });
    return Array.from(types);
  }, [categories, plans]);

  useEffect(() => {
    if (!open || serviceType) return;
    if (serviceTypes.length) setServiceType(serviceTypes[0]);
  }, [open, serviceType, serviceTypes]);

  const filteredPlans = useMemo(() => {
    if (!serviceType) return plans;
    return plans.filter((plan) => {
      const type = String(plan.category_name ?? plan.category ?? plan.type ?? "Service");
      return type === serviceType;
    });
  }, [plans, serviceType]);

  useEffect(() => {
    if (!open) return;
    if (filteredPlans.length) {
      setPlanKey(String(filteredPlans[0].id));
      setCustomPlanName("");
    } else {
      setPlanKey("new_plan_service");
      setCustomPlanName("");
    }
  }, [open, serviceType, filteredPlans]);

  const isCustomPlan = planKey === "new_plan_service";
  const selectedPlan = filteredPlans.find((plan) => String(plan.id) === planKey);
  const selectedAddon = ADDONS.find((addon) => addon.name === addonName);

  useEffect(() => {
    if (!open || isCustomPlan) return;
    const base = Number(selectedPlan?.price ?? 0);
    const addon = Number(selectedAddon?.price ?? 0);
    setPrice(String(base + addon || ""));
  }, [open, isCustomPlan, selectedPlan, selectedAddon]);

  const handlePlanChange = (nextPlanKey: string) => {
    setPlanKey(nextPlanKey);
    if (nextPlanKey === "new_plan_service") {
      setPrice("");
      return;
    }
    const plan = filteredPlans.find((item) => String(item.id) === nextPlanKey);
    const addon = Number(selectedAddon?.price ?? 0);
    if (plan) setPrice(String(Number(plan.price ?? 0) + addon));
  };

  const handleAddonChange = (nextAddon: string) => {
    setAddonName(nextAddon);
    const addon = ADDONS.find((item) => item.name === nextAddon);
    const base = isCustomPlan ? Number(price || 0) : Number(selectedPlan?.price ?? 0);
    if (!isCustomPlan) setPrice(String(base + Number(addon?.price ?? 0)));
  };

  const reset = () => {
    setServiceType(serviceTypes[0] ?? "");
    setPlanKey("");
    setCustomPlanName("");
    setAddonName("");
    setPrice("");
    setBilling("yr");
    setNote("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const resolveCategoryId = async () => {
    const matched = categories.find(
      (category) => category.name.toLowerCase() === serviceType.toLowerCase()
    );
    if (matched) return matched.id;

    const endpoints = ["/service-categories", "/create-service-category", "/categories"];
    for (const ep of endpoints) {
      try {
        const res = await axiosInstance.post(
          ep,
          { name: serviceType, title: serviceType },
          { headers: { "X-No-Loading": true } }
        );
        const data = res.data?.data ?? res.data ?? {};
        const id = data?.id ?? data?.category_id ?? data?.data?.id;
        if (id) return id;
      } catch {
        /* try next */
      }
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    let planName = isCustomPlan ? customPlanName.trim() : String(selectedPlan?.name ?? selectedPlan?.title ?? "");
    if (isCustomPlan && !planName) {
      planName = serviceType;
    }
    if (!planName) {
      toast.error("Please enter a plan name.");
      return;
    }

    const finalName = selectedAddon ? `${planName} + ${selectedAddon.name}` : planName;
    const amount = Number(price || 0);
    if (!amount) {
      toast.error("Please enter a valid amount.");
      return;
    }

    const billingLabel =
      billing === "yr" ? "Yearly (/yr)" : billing === "mo" ? "Monthly (/mo)" : "One-Time";
    const description = [
      `Service Type: ${serviceType}`,
      `Billing Cycle: ${billingLabel}`,
      note.trim() ? `Note: ${note.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitting(true);
    try {
      const categoryId = await resolveCategoryId();
      const form = new FormData();
      form.append("name", finalName);
      form.append("price", String(amount));
      form.append("description", description);
      form.append("status", "active");
      form.append("is_active", "1");
      if (categoryId) {
        form.append("category_id", String(categoryId));
        form.append("category", String(categoryId));
      }

      const resp = await createService(form);
      if (resp && resp.success === false) {
        const msg =
          resp.error?.message ||
          resp.error?.error ||
          (resp.error?.errors ? JSON.stringify(resp.error.errors) : null) ||
          JSON.stringify(resp.error);
        toast.error(String(msg).slice(0, 200));
        return;
      }

      toast.success(`Successfully created manage service: ${planName}`);
      handleClose();
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create manage service.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Add Manage Service</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={handleClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <p className={styles.emptyState}>Loading service catalog...</p>
        ) : (
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <label className={styles.modalLabel}>
              Service Name
              <select
                className={styles.select}
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                required
              >
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.modalLabel}>
              Plan
              <select className={styles.select} value={planKey} onChange={(e) => handlePlanChange(e.target.value)} required>
                {filteredPlans.map((plan) => (
                  <option key={plan.id} value={String(plan.id)}>
                    {plan.name ?? plan.title} (₱{Number(plan.price ?? 0).toLocaleString("en-PH")})
                  </option>
                ))}
                <option value="new_plan_service">+ New Plan Service (Custom)</option>
              </select>
            </label>

            {isCustomPlan ? (
              <label className={styles.modalLabel}>
                Custom Plan Name
                <input
                  className={styles.modalInput}
                  value={customPlanName}
                  onChange={(e) => setCustomPlanName(e.target.value)}
                  placeholder="Enter custom plan name..."
                  required
                />
              </label>
            ) : null}

            <label className={styles.modalLabel}>
              Add-on (Optional)
              <select className={styles.select} value={addonName} onChange={(e) => handleAddonChange(e.target.value)}>
                <option value="">-- No Add-on Selected --</option>
                {ADDONS.map((addon) => (
                  <option key={addon.name} value={addon.name}>
                    {addon.name} (₱{addon.price.toLocaleString("en-PH")}/yr)
                  </option>
                ))}
              </select>
            </label>

            <div className={styles.modalGrid2}>
              <label className={styles.modalLabel}>
                Amount (₱)
                <input
                  className={styles.modalInput}
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </label>
              <label className={styles.modalLabel}>
                Billing Cycle
                <select className={styles.select} value={billing} onChange={(e) => setBilling(e.target.value)}>
                  <option value="yr">Yearly (/yr)</option>
                  <option value="mo">Monthly (/mo)</option>
                  <option value="one-time">One-Time</option>
                </select>
              </label>
            </div>

            <label className={styles.modalLabel}>
              Note (Optional)
              <textarea
                className={styles.modalTextarea}
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Enter optional notes or remarks..."
              />
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtnSm} onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
                {submitting ? "Saving..." : "Add Manage Service"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
