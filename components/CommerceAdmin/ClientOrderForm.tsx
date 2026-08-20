import { Children, isValidElement, useEffect, useState } from "react";
import {
  AUTOMATIC_STAGE_OPTIONS,
  buildDealNotes,
  CLIENT_STATUS_OPTIONS,
  COLLECTION_NOTE_OPTIONS,
  DEAL_NAME_OPTIONS,
  DEAL_STAGE_OPTIONS,
  DEAL_STATUS_OPTIONS,
  emptyClientOrderForm,
  INVOICE_STATUS_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  probabilityForStage,
  subjectForProductName,
  SALES_STATUS_OPTIONS,
  SUBJECT_OPTIONS,
  toApiOrderStatus,
  toApiPaymentStatus,
  validateClientOrderForm,
  type ClientOrderFormState,
} from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { clientBillingInCharge, clientDisplayName } from "@/lib/commerceAdmin/clientHelpers";
import { readStoredCurrentUser } from "@/lib/currentUser";
import { toast } from "@/lib/toast";
import {
  fetchCommerceAssignableUsers,
  assignCommerceSalesTransaction,
  type CommerceAssignableUser,
} from "@/services/commerceAdminService";
import { getCustomers, type CustomerRow } from "@/services/customerService";
import { getServices } from "@/services/serviceService";
import { createSalesTransaction } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  defaultCustomerId?: number | null;
  onBack: () => void;
  onSaved: () => void;
};

function Field({
  label,
  hint,
  icon,
  iconCheck,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: string;
  iconCheck?: boolean;
  children: React.ReactNode;
}) {
  const childArray = Children.toArray(children);
  const isSelect = childArray.some(
    (child) => isValidElement(child) && child.type === "select",
  );
  const isDate = childArray.some(
    (child) =>
      isValidElement(child) &&
      child.type === "input" &&
      (child.props as { type?: string }).type === "date",
  );
  const controlClass = [
    styles.clientOrderControl,
    isSelect ? styles.clientOrderControlSelect : "",
    icon ? styles.clientOrderControlHasIcon : "",
    iconCheck ? styles.clientOrderControlLookup : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={styles.clientOrderField}>
      <span className={styles.clientOrderLabel}>
        <span className={styles.clientOrderLabelText}>{label}</span>
        {hint ? (
          <span className={styles.clientCrmHint} title={hint} aria-hidden="true">
            i
          </span>
        ) : null}
      </span>
      <div className={controlClass}>
        {children}
        {!isDate ? (
          <span className={styles.clientOrderAdornment} aria-hidden="true">
            {icon ? <i className={icon} /> : null}
            {iconCheck ? <i className="fa-solid fa-check" /> : null}
            {isSelect ? <i className="fa-solid fa-chevron-down" /> : null}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function inputClass(required?: boolean, extra?: string) {
  return [styles.clientCrmInput, required ? styles.clientCrmInputRequired : "", extra]
    .filter(Boolean)
    .join(" ");
}

function catalogPriceForProduct(services: any[], productName: string) {
  const needle = productName.trim().toLowerCase();
  if (!needle) return null;
  const match =
    services.find((service) => String(service.name ?? service.title ?? "").trim().toLowerCase() === needle) ??
    services.find((service) => String(service.name ?? service.title ?? "").toLowerCase().includes(needle));
  if (!match) return null;
  const price = Number(match.price ?? 0);
  return Number.isFinite(price) ? price : null;
}

export default function ClientOrderForm({ defaultCustomerId = null, onBack, onSaved }: Props) {
  const [form, setForm] = useState<ClientOrderFormState>(emptyClientOrderForm());
  const [owners, setOwners] = useState<CommerceAssignableUser[]>([]);
  const [clients, setClients] = useState<CustomerRow[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof ClientOrderFormState>(key: K, value: ClientOrderFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchCommerceAssignableUsers().catch(() => [] as CommerceAssignableUser[]),
      getCustomers({ per_page: 200 }, { silent: true }).catch(() => ({ data: [] })),
      getServices({ per_page: 200, status: "active" }, { silent: true }).catch(() => ({ data: [] })),
    ])
      .then(([assignable, clientRes, serviceRes]) => {
        if (cancelled) return;
        const nextOwners = Array.isArray(assignable) ? assignable : [];
        const nextClients = Array.isArray(clientRes?.data) ? clientRes.data : [];
        const nextServices = Array.isArray(serviceRes?.data) ? serviceRes.data : [];
        setOwners(nextOwners);
        setClients(nextClients);
        setServices(nextServices);

        const currentUser = readStoredCurrentUser();
        const defaultOwner =
          nextOwners.find((owner) => owner.id === currentUser?.id) ?? nextOwners[0];
        const defaultClient = defaultCustomerId
          ? nextClients.find((client) => Number(client.id) === Number(defaultCustomerId))
          : null;

        setForm(
          emptyClientOrderForm({
            dealOwnerId: defaultOwner ? String(defaultOwner.id) : "",
            clientId: defaultClient ? String(defaultClient.id) : "",
            contactName: String(defaultClient?.contact_person ?? ""),
            billingInCharge: defaultClient ? clientBillingInCharge(defaultClient) : "",
          }),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [defaultCustomerId]);

  const selectedClient = clients.find((client) => String(client.id) === form.clientId);

  useEffect(() => {
    const catalogName = form.dealName || form.productName;
    if (!catalogName) return;
    const price = catalogPriceForProduct(services, catalogName);
    setForm((current) => ({
      ...current,
      expectedRevenue: price != null ? String(price) : current.expectedRevenue || "0",
    }));
  }, [form.dealName, form.productName, services]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((row) => String(row.id) === clientId);
    setForm((current) => ({
      ...current,
      clientId,
      contactName: String(client?.contact_person ?? ""),
      billingInCharge: client ? clientBillingInCharge(client) : "",
    }));
  };

  const handleDealNameChange = (dealName: string) => {
    setForm((current) => ({
      ...current,
      dealName,
      productName: dealName,
      productCategory: current.productCategory || subjectForProductName(dealName),
    }));
  };

  const handleCategoryChange = (category: string) => {
    setForm((current) => ({
      ...current,
      productCategory: category,
    }));
  };

  const handleStageChange = (stage: string) => {
    setForm((current) => ({
      ...current,
      stage,
      probability: probabilityForStage(stage),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateClientOrderForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const client = selectedClient;
    if (!client || !form.dealName) {
      toast.error("Please select a client and deal name.");
      return;
    }

    const price = Number(form.expectedRevenue || 0);

    setSubmitting(true);
    try {
      const created = await createSalesTransaction({
        customer_id: Number(client.id),
        customer_name: clientDisplayName(client),
        customer_email: client.email ?? "",
        subtotal: price,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        grand_total: price,
        payment_status: toApiPaymentStatus(form.paymentStatus),
        order_status: toApiOrderStatus(form.salesStatus),
        notes: buildDealNotes(form),
        transacted_at: form.closingDate || undefined,
        items: [
          {
            name: form.dealName || form.productName,
            item_type: form.dealSubType || form.dealType || "service",
            price,
            quantity: 1,
            total_price: price,
          },
        ],
      });

      const transactionId = Number(created?.data?.id ?? created?.id);
      const ownerId = Number(form.dealOwnerId);
      if (transactionId && ownerId) {
        try {
          await assignCommerceSalesTransaction(transactionId, ownerId);
        } catch {
          // Order is saved even if assignment is skipped.
        }
      }

      toast.success("Client order created successfully.");
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create client order.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className={styles.emptyState}>Loading order form...</p>;
  }

  return (
    <form className={styles.clientCrmPage} onSubmit={handleSubmit}>
      <div className={styles.clientCrmTopBar}>
        <div className={styles.clientCrmTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h3 className={styles.panelTitle}>Create Deal</h3>
            <p className={styles.panelSubtitle}>Deals</p>
          </div>
        </div>
        <div className={styles.clientCrmActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Deal Information</h4>
        <div className={styles.clientOrderGrid}>
            <Field label="Client Owner" hint="Staff assigned to this deal" icon="fa-solid fa-user">
              <select
                className={inputClass()}
                value={form.dealOwnerId}
                onChange={(e) => setField("dealOwnerId", e.target.value)}
              >
                <option value="">-None-</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name || owner.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Billing-in-Charge" hint="Person responsible for billing">
              <select
                className={inputClass()}
                value={form.billingInCharge}
                onChange={(e) => setField("billingInCharge", e.target.value)}
              >
                <option value="">-None-</option>
                {owners.map((owner) => (
                  <option key={`bill-${owner.id}`} value={owner.name || owner.email || ""}>
                    {owner.name || owner.email}
                  </option>
                ))}
                {form.billingInCharge &&
                !owners.some((owner) => (owner.name || owner.email) === form.billingInCharge) ? (
                  <option value={form.billingInCharge}>{form.billingInCharge}</option>
                ) : null}
              </select>
            </Field>
            <Field label="Campaign Source" hint="Where this deal originated" icon="fa-solid fa-bullhorn">
              <input
                className={inputClass()}
                value={form.campaignSource}
                onChange={(e) => setField("campaignSource", e.target.value)}
              />
            </Field>
            <Field label="Deal Status" hint="Overall deal state">
              <select
                className={inputClass()}
                value={form.dealStatus}
                onChange={(e) => setField("dealStatus", e.target.value)}
              >
                <option value="">-None-</option>
                {DEAL_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Probability (%)" hint="Likelihood this deal will close">
              <input
                className={inputClass()}
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => setField("probability", e.target.value)}
              />
            </Field>
            <Field label="Payment Terms" hint="When payment is due">
              <select
                className={inputClass()}
                value={form.paymentTerms}
                onChange={(e) => setField("paymentTerms", e.target.value)}
              >
                <option value="">-None-</option>
                {PAYMENT_TERMS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Expected Revenue" hint="Auto from the selected product price" icon="fa-solid fa-lock">
              <span className={styles.clientCrmPesoPrefix}>₱</span>
              <input
                className={inputClass(false, styles.clientCrmPesoInput)}
                type="number"
                min="0"
                step="0.01"
                value={form.expectedRevenue}
                readOnly
              />
            </Field>
            <Field label="Payment Method" hint="How the client will pay">
              <select
                className={inputClass()}
                value={form.paymentMethod}
                onChange={(e) => setField("paymentMethod", e.target.value)}
              >
                <option value="">-None-</option>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stage" required hint="Pipeline stage for this deal">
              <select
                className={inputClass(true)}
                value={form.stage}
                onChange={(e) => handleStageChange(e.target.value)}
                required
              >
                <option value="">-None-</option>
                <optgroup label="Manual Create Status">
                  {DEAL_STAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Automatic Status: WebOrder">
                  {AUTOMATIC_STAGE_OPTIONS.map((option) => (
                    <option key={option} value={option} disabled>
                      {option}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>
            <Field label="Payment Status" hint="Current payment state">
              <select
                className={inputClass()}
                value={form.paymentStatus}
                onChange={(e) => setField("paymentStatus", e.target.value)}
              >
                <option value="">-None-</option>
                {PAYMENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Closing Date" hint="Expected close date">
              <input
                className={inputClass()}
                type="date"
                value={form.closingDate}
                onChange={(e) => setField("closingDate", e.target.value)}
              />
            </Field>
            <Field label="Invoice Status" hint="Invoice processing state">
              <select
                className={inputClass()}
                value={form.invoiceStatus}
                onChange={(e) => setField("invoiceStatus", e.target.value)}
              >
                <option value="">-None-</option>
                {INVOICE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Deal Name" required hint="Select the deal name">
              <select
                className={inputClass(true)}
                value={form.dealName}
                onChange={(e) => handleDealNameChange(e.target.value)}
                required
              >
                <option value="">-None-</option>
                {DEAL_NAME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Invoice Sent Date">
              <input
                className={inputClass()}
                type="date"
                value={form.invoiceSentDate}
                onChange={(e) => setField("invoiceSentDate", e.target.value)}
              />
            </Field>
            <Field
              label="Client Name"
              required
              hint="Client this order belongs to"
              icon="fa-solid fa-file"
              iconCheck
            >
              <select
                className={inputClass(true)}
                value={form.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
              >
                <option value="">-None-</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {clientDisplayName(client)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Invoice Received Date">
              <input
                className={inputClass()}
                type="date"
                value={form.invoiceReceivedDate}
                onChange={(e) => setField("invoiceReceivedDate", e.target.value)}
              />
            </Field>
            <Field label="Contact Name" hint="Billing or signing contact" icon="fa-solid fa-address-card">
              <input
                className={inputClass()}
                value={form.contactName}
                onChange={(e) => setField("contactName", e.target.value)}
              />
            </Field>
            <Field label="Payment Commitment Date">
              <input
                className={inputClass()}
                type="date"
                value={form.paymentCommitmentDate}
                onChange={(e) => setField("paymentCommitmentDate", e.target.value)}
              />
            </Field>
            <Field label="Client Status" required hint="Deal type for this client">
              <select
                className={inputClass(true)}
                value={form.dealType}
                onChange={(e) => setField("dealType", e.target.value)}
                required
              >
                <option value="">-None-</option>
                {CLIENT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Collection Note" hint="Collection follow-up note">
              <select
                className={inputClass()}
                value={form.collectionNote}
                onChange={(e) => setField("collectionNote", e.target.value)}
              >
                <option value="">-None-</option>
                {COLLECTION_NOTE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Product Status" required hint="Deal sub-type for this order">
              <select
                className={inputClass(true)}
                value={form.dealSubType}
                onChange={(e) => setField("dealSubType", e.target.value)}
                required
              >
                <option value="">-None-</option>
                {PRODUCT_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Product Category" required hint="Subject / product category for this deal">
              <select
                className={inputClass(true)}
                value={form.productCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required
              >
                <option value="">-None-</option>
                {SUBJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Sales Status" required hint="Current sales progress">
              <select
                className={inputClass(true)}
                value={form.salesStatus}
                onChange={(e) => setField("salesStatus", e.target.value)}
                required
              >
                <option value="">-None-</option>
                {SALES_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Status Trigger Date" hint="Date this status took effect">
              <input
                className={inputClass()}
                type="date"
                value={form.statusTriggerDate}
                onChange={(e) => setField("statusTriggerDate", e.target.value)}
              />
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="JO Number" hint="Job order number if already issued">
              <input
                className={inputClass()}
                value={form.joNumber}
                onChange={(e) => setField("joNumber", e.target.value)}
              />
            </Field>
        </div>
      </section>
    </form>
  );
}
