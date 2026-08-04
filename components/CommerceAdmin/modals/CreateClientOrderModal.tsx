import { useEffect, useMemo, useState } from "react";
import { getCustomers } from "@/services/customerService";
import { getServices } from "@/services/serviceService";
import { createSalesTransaction } from "@/services/salesTransactionService";
import { toast } from "@/lib/toast";
import { resolveServiceTypeLabel } from "@/lib/commerceAdmin/serviceHelpers";
import styles from "@/styles/commerceAdmin.module.css";

const ADDONS = [
  { name: "Add Ons_WhoIs", price: 780 },
  { name: "Add Ons_Static IP", price: 3000 },
  { name: "Add Ons_Sitelock", price: 14160 },
  { name: "Add Ons_Codeguard", price: 6720 },
  { name: "Add Ons_Magic Spam PRO", price: 23400 },
  { name: "Add Ons_Imunify360", price: 23400 },
  { name: "Secure Socket Layer (Wildcard SSL)", price: 23400 },
  { name: "Secure Socket Layer (Standard SSL)", price: 10800 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateClientOrderModal({ open, onClose, onCreated }: Props) {
  const [clients, setClients] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [clientKey, setClientKey] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [planId, setPlanId] = useState("");
  const [addonName, setAddonName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Paynamics Bank Transfer");
  const [amount, setAmount] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([
      getCustomers({ per_page: 100 }, { silent: true }),
      getServices({ per_page: 200, status: "active" }, { silent: true }),
    ])
      .then(([clientRes, serviceRes]) => {
        setClients(Array.isArray(clientRes?.data) ? clientRes.data : []);
        setServices(Array.isArray(serviceRes?.data) ? serviceRes.data : []);
      })
      .catch(() => {
        setClients([]);
        setServices([]);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const serviceTypes = useMemo(() => {
    const types = new Set<string>();
    services.forEach((service) => {
      types.add(resolveServiceTypeLabel(service));
    });
    return Array.from(types);
  }, [services]);

  const filteredPlans = useMemo(() => {
    if (!serviceType) return services;
    return services.filter((service) => resolveServiceTypeLabel(service) === serviceType);
  }, [serviceType, services]);

  useEffect(() => {
    if (!open) return;
    if (serviceTypes.length && !serviceType) setServiceType(serviceTypes[0]);
  }, [open, serviceType, serviceTypes]);

  useEffect(() => {
    if (!filteredPlans.length) {
      setPlanId("");
      return;
    }
    const exists = filteredPlans.some((plan) => String(plan.id) === planId);
    if (!exists) setPlanId(String(filteredPlans[0].id));
  }, [filteredPlans, planId]);

  const selectedPlan = filteredPlans.find((plan) => String(plan.id) === planId);
  const selectedAddon = ADDONS.find((addon) => addon.name === addonName);

  useEffect(() => {
    if (!open || amount) return;
    const base = Number(selectedPlan?.price ?? 0);
    const addon = Number(selectedAddon?.price ?? 0);
    if (base || addon) setAmount(String(base + addon));
  }, [open, amount, selectedPlan, selectedAddon]);

  const handlePlanChange = (nextPlanId: string) => {
    setPlanId(nextPlanId);
    const plan = filteredPlans.find((item) => String(item.id) === nextPlanId);
    const addon = Number(selectedAddon?.price ?? 0);
    if (plan) setAmount(String(Number(plan.price ?? 0) + addon));
  };

  const handleAddonChange = (nextAddon: string) => {
    setAddonName(nextAddon);
    const addon = ADDONS.find((item) => item.name === nextAddon);
    const base = Number(selectedPlan?.price ?? 0);
    setAmount(String(base + Number(addon?.price ?? 0)));
  };

  const reset = () => {
    setClientKey("");
    setNewClientName("");
    setServiceType(serviceTypes[0] ?? "");
    setPlanId("");
    setAddonName("");
    setPaymentMethod("Paynamics Bank Transfer");
    setAmount("");
    setPaymentStatus("pending");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const plan = selectedPlan;
    if (!plan) {
      toast.error("Please select a service plan.");
      return;
    }

    let customerName = "";
    let customerEmail = "";
    let customerId: number | undefined;
    if (clientKey === "NEW_CLIENT") {
      customerName = newClientName.trim();
      if (!customerName) {
        toast.error("Please enter the new client / company name.");
        return;
      }
      customerEmail = `${customerName.toLowerCase().replace(/[^a-z0-9]/g, "")}@client.ph`;
    } else {
      const client = clients.find((row) => String(row.id) === clientKey);
      if (!client) {
        toast.error("Please select a client.");
        return;
      }
      customerId = Number(client.id);
      customerName = client.name ?? client.company ?? "";
      customerEmail = client.email ?? "";
    }

    const lineItems: Array<{
      name: string;
      item_type: string;
      price: number;
      quantity: number;
      total_price: number;
    }> = [
      {
        name: plan.name ?? plan.title ?? "Service",
        item_type: "service",
        price: Number(plan.price ?? 0),
        quantity: 1,
        total_price: Number(plan.price ?? 0),
      },
    ];

    if (selectedAddon) {
      lineItems.push({
        name: selectedAddon.name,
        item_type: "addon",
        price: selectedAddon.price,
        quantity: 1,
        total_price: selectedAddon.price,
      });
    }

    const subtotal = lineItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    const grandTotal = amount ? Number(amount) : subtotal;
    const statusMap: Record<string, string> = {
      paid: "paid",
      pending: "pending",
      overdue: "pending",
    };

    setSubmitting(true);
    try {
      await createSalesTransaction({
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        subtotal,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        grand_total: grandTotal,
        payment_status: statusMap[paymentStatus] ?? paymentStatus,
        order_status: "pending",
        transacted_at: new Date().toISOString().slice(0, 10),
        notes: `Client Order · Payment: ${paymentMethod}${selectedAddon ? ` · Add-on: ${selectedAddon.name}` : ""}`,
        items: lineItems,
      });
      toast.success("Client order created successfully.");
      handleClose();
      onCreated();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create client order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>
              <i className="fa-solid fa-bag-shopping" aria-hidden="true" /> Create Client Order &amp; Invoice
            </h3>
            <p className={styles.panelSubtitle}>Record a new subscription, hosting node, or domain invoice.</p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={handleClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {loading ? (
          <p className={styles.emptyState}>Loading clients and services...</p>
        ) : (
          <form className={styles.modalForm} onSubmit={handleSubmit}>
            <label className={styles.modalLabel}>
              Client / Company Name
              <select
                className={styles.select}
                value={clientKey}
                onChange={(e) => setClientKey(e.target.value)}
                required
              >
                <option value="" disabled>
                  Select client or company...
                </option>
                {clients.map((client) => (
                  <option key={client.id} value={String(client.id)}>
                    {client.name ?? client.company} (CL-{client.id})
                  </option>
                ))}
                <option value="NEW_CLIENT">+ Other / New Client</option>
              </select>
            </label>

            {clientKey === "NEW_CLIENT" ? (
              <label className={styles.modalLabel}>
                New Client / Company Name
                <input
                  className={styles.modalInput}
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Enter new client company name..."
                />
              </label>
            ) : null}

            <label className={styles.modalLabel}>
              Service Name
              <select className={styles.select} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
                <option value="">All Services</option>
                {serviceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.modalLabel}>
              Plan
              <select className={styles.select} value={planId} onChange={(e) => handlePlanChange(e.target.value)} required>
                {filteredPlans.map((plan) => (
                  <option key={plan.id} value={String(plan.id)}>
                    {plan.name ?? plan.title} (₱{Number(plan.price ?? 0).toLocaleString("en-PH")})
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.modalLabel}>
              Add-on Service (Optional)
              <select className={styles.select} value={addonName} onChange={(e) => handleAddonChange(e.target.value)}>
                <option value="">-- No Add-on Selected --</option>
                {ADDONS.map((addon) => (
                  <option key={addon.name} value={addon.name}>
                    {addon.name} (₱{addon.price.toLocaleString("en-PH")})
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.modalLabel}>
              Payment Method
              <select className={styles.select} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="Paynamics Bank Transfer">Paynamics Bank Transfer</option>
                <option value="Credit Card">Credit Card</option>
                <option value="E-Wallet">E-Wallet (GCash / Maya)</option>
              </select>
            </label>

            <div className={styles.modalGrid2}>
              <label className={styles.modalLabel}>
                Invoice Amount (₱)
                <input
                  className={styles.modalInput}
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </label>
              <label className={styles.modalLabel}>
                Payment Status
                <select
                  className={styles.select}
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                >
                  <option value="paid">Paid &amp; Verified</option>
                  <option value="pending">Pending Payment</option>
                  <option value="overdue">Overdue</option>
                </select>
              </label>
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtnSm} onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
                {submitting ? "Saving..." : "Record & Issue Order"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
