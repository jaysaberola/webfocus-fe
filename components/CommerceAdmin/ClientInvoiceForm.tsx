import { Children, isValidElement, useEffect, useMemo, useState } from "react";
import AddressSuggestField from "@/components/CommerceAdmin/AddressSuggestField";
import { SUBJECT_OPTIONS } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import {
  buildInvoiceNotes,
  emptyClientInvoiceForm,
  INVOICE_CURRENCY_OPTIONS,
  INVOICE_FORM_STATUS_OPTIONS,
  invoiceAddressFromClient,
  invoiceApiOrderStatus,
  invoiceApiPaymentStatus,
  validateClientInvoiceForm,
  type ClientInvoiceFormState,
} from "@/lib/commerceAdmin/clientInvoiceHelpers";
import { clientDisplayName } from "@/lib/commerceAdmin/clientHelpers";
import {
  citiesForProvince,
  findPlaceByCity,
  findPlaceByStreet,
  findPlaceByZip,
  PH_ADDRESS_PLACES,
  PH_COUNTRIES,
  PH_REGIONS,
  provincesForRegion,
  regionForProvince,
  streetsForPlace,
} from "@/lib/commerceAdmin/phAddressCatalog";
import { readStoredCurrentUser } from "@/lib/currentUser";
import { toast } from "@/lib/toast";
import {
  assignCommerceSalesTransaction,
  fetchCommerceAssignableUsers,
  type CommerceAssignableUser,
} from "@/services/commerceAdminService";
import { getCustomers, type CustomerRow } from "@/services/customerService";
import { createSalesTransaction } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  client: CustomerRow;
  onBack: () => void;
  onSaved: (options?: { andNew?: boolean }) => void;
};

function withExtraOption(options: readonly string[], value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text || options.some((option) => option === text)) return options;
  return [text, ...options];
}

function Field({
  label,
  hint,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: string;
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
            {isSelect ? <i className="fa-solid fa-chevron-down" /> : null}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function inputClass(required?: boolean) {
  return [styles.clientCrmInput, required ? styles.clientCrmInputRequired : ""]
    .filter(Boolean)
    .join(" ");
}

export default function ClientInvoiceForm({ client, onBack, onSaved }: Props) {
  const [form, setForm] = useState<ClientInvoiceFormState>(emptyClientInvoiceForm(client));
  const [owners, setOwners] = useState<CommerceAssignableUser[]>([]);
  const [clients, setClients] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const setField = <K extends keyof ClientInvoiceFormState>(key: K, value: ClientInvoiceFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const blankInvoiceForm = (
    nextOwners = owners,
    nextClients = clients,
  ): ClientInvoiceFormState => {
    const currentUser = readStoredCurrentUser();
    const defaultOwner =
      nextOwners.find((owner) => String(owner.id) === String(client.owner_id)) ??
      nextOwners.find((owner) => owner.id === currentUser?.id) ??
      nextOwners[0];
    const defaultClient =
      nextClients.find((row) => Number(row.id) === Number(client.id)) ?? client;
    return emptyClientInvoiceForm(defaultClient, {
      invoiceOwnerId: defaultOwner ? String(defaultOwner.id) : "",
    });
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchCommerceAssignableUsers({ for: "client_owner" }).catch(() => [] as CommerceAssignableUser[]),
      getCustomers({ per_page: 200 }, { silent: true }).catch(() => ({ data: [] })),
    ])
      .then(([nextOwners, clientRes]) => {
        if (cancelled) return;
        const ownerList = Array.isArray(nextOwners) ? nextOwners : [];
        const clientList = Array.isArray(clientRes?.data) ? clientRes.data : [];
        setOwners(ownerList);
        setClients(clientList);
        setForm(blankInvoiceForm(ownerList, clientList));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when opening for this client
  }, [client.id]);

  const handleClientChange = (clientId: string) => {
    const selected = clients.find((row) => String(row.id) === clientId);
    setForm((current) => ({
      ...current,
      clientId,
      contactName: String(selected?.contact_person ?? ""),
      currency: String(selected?.currency || current.currency || "PHP").trim() || "PHP",
      exchangeRate: String(selected?.exchange_rate ?? current.exchangeRate ?? "1").trim() || "1",
      ...invoiceAddressFromClient(selected ?? null),
      invoiceOwnerId: selected?.owner_id ? String(selected.owner_id) : current.invoiceOwnerId,
    }));
  };

  const applyPlace = (
    place: { street?: string; city: string; province: string; zip: string; country: string } | null,
    includeStreet = false,
  ) => {
    if (!place) return;
    const country = place.country || "Philippines";
    const region = regionForProvince(place.province);
    setForm((current) => ({
      ...current,
      ...(includeStreet && place.street ? { billingStreet: place.street } : {}),
      billingCity: place.city,
      billingState: place.province,
      billingRegion: region || current.billingRegion,
      billingCode: place.zip,
      billingCountry: country,
    }));
  };

  const billingStreetOptions = useMemo(() => {
    const seen = new Set<string>();
    return streetsForPlace(form.billingCity, form.billingState)
      .filter((place) => {
        const key = `${place.street}|${place.city}|${place.zip}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((place) => ({
        value: place.street || "",
        label: `${place.street} — ${place.city}, ${place.province} (${place.zip})`,
        street: place.street,
        city: place.city,
        province: place.province,
        zip: place.zip,
        country: place.country,
      }));
  }, [form.billingCity, form.billingState]);

  const billingCityOptions = useMemo(() => {
    const seen = new Set<string>();
    return citiesForProvince(form.billingState)
      .filter((place) => {
        const key = `${place.city}|${place.province}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((place) => ({
        value: place.city,
        label: `${place.city} — ${place.province} (${place.zip})`,
      }));
  }, [form.billingState]);

  const regionOptions = useMemo(
    () => PH_REGIONS.map((region) => ({ value: region, label: region })),
    [],
  );

  const billingProvinceOptions = useMemo(
    () => provincesForRegion(form.billingRegion).map((province) => ({ value: province, label: province })),
    [form.billingRegion],
  );

  const zipOptions = useMemo(() => {
    const seen = new Set<string>();
    return PH_ADDRESS_PLACES.filter((place) => {
      if (seen.has(place.zip)) return false;
      seen.add(place.zip);
      return true;
    }).map((place) => ({
      value: place.zip,
      label: `${place.zip} — ${place.city}, ${place.province}`,
    }));
  }, []);

  const countryOptions = useMemo(
    () => PH_COUNTRIES.map((country) => ({ value: country, label: country })),
    [],
  );

  const saveInvoice = async (andNew: boolean) => {
    const validationError = validateClientInvoiceForm(form);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const clientId = Number(form.clientId);
    const selectedClient = clients.find((row) => Number(row.id) === clientId);
    const clientName = selectedClient
      ? clientDisplayName(selectedClient)
      : clientDisplayName(client);
    const clientEmail = selectedClient?.email ?? client.email ?? "";
    const subject = form.subject.trim();

    setSubmitting(true);
    try {
      const created = await createSalesTransaction({
        customer_id: clientId,
        customer_name: clientName,
        customer_email: clientEmail,
        subtotal: 0,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        grand_total: 0,
        payment_status: invoiceApiPaymentStatus(form.status),
        order_status: invoiceApiOrderStatus(form.status),
        notes: buildInvoiceNotes(form),
        transacted_at: form.invoiceDate || undefined,
        items: [
          {
            name: subject,
            item_type: "invoice",
            price: 0,
            quantity: 1,
            total_price: 0,
          },
        ],
      });

      const transactionId = Number(created?.data?.id ?? created?.id);
      const ownerId = Number(form.invoiceOwnerId);
      if (transactionId && ownerId) {
        try {
          await assignCommerceSalesTransaction(transactionId, ownerId);
        } catch {
          // Invoice is saved even if assignment is skipped.
        }
      }

      toast.success("Invoice created successfully.");
      onSaved({ andNew });
      if (andNew) {
        setForm(blankInvoiceForm());
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create invoice.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className={styles.emptyState}>Loading invoice form...</p>;
  }

  return (
    <form
      className={`${styles.clientCrmPage} ${styles.invoiceForm}`}
      onSubmit={(event) => {
        event.preventDefault();
        void saveInvoice(false);
      }}
    >
      <div className={styles.clientCrmTopBar}>
        <div className={styles.clientCrmTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h3 className={styles.panelTitle}>Create Invoice</h3>
            <p className={styles.panelSubtitle}>Invoices</p>
          </div>
        </div>
        <div className={styles.clientCrmActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            onClick={() => void saveInvoice(true)}
            disabled={submitting}
          >
            Save and New
          </button>
          <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <section className={styles.clientCrmSection}>
        <h4 className={`${styles.clientCrmSectionTitle} ${styles.invoiceSectionTitle}`}>Invoice Information</h4>
        <div className={styles.clientOrderGrid}>
          <Field label="Invoice Owner" icon="fa-solid fa-user">
            <select
              className={inputClass()}
              value={form.invoiceOwnerId}
              onChange={(e) => setField("invoiceOwnerId", e.target.value)}
            >
              <option value="">-None-</option>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name || owner.email}
                </option>
              ))}
              {form.invoiceOwnerId &&
              !owners.some((owner) => String(owner.id) === String(form.invoiceOwnerId)) ? (
                <option value={form.invoiceOwnerId}>Current owner</option>
              ) : null}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputClass()}
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            >
              {withExtraOption(INVOICE_FORM_STATUS_OPTIONS, form.status).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Product Category" required>
            <input
              className={inputClass(true)}
              list="invoice-subject-options"
              value={form.subject}
              onChange={(e) => setField("subject", e.target.value)}
              required
            />
          </Field>
          <Field label="Collection Date">
            <input
              className={inputClass()}
              type="date"
              value={form.collectionDate}
              onChange={(e) => setField("collectionDate", e.target.value)}
            />
          </Field>
          <Field label="Invoice Date">
            <input
              className={inputClass()}
              type="date"
              value={form.invoiceDate}
              onChange={(e) => setField("invoiceDate", e.target.value)}
            />
          </Field>
          <Field label="Official Receipt">
            <input
              className={inputClass()}
              value={form.officialReceipt}
              onChange={(e) => setField("officialReceipt", e.target.value)}
            />
          </Field>
          <Field label="Due Date">
            <input
              className={inputClass()}
              type="date"
              value={form.dueDate}
              onChange={(e) => setField("dueDate", e.target.value)}
            />
          </Field>
          <Field label="Exchange Rate" icon="fa-solid fa-lock">
            <input className={inputClass()} value={form.exchangeRate} readOnly />
          </Field>
          <Field label="Client Name" required icon="fa-solid fa-file">
            <select
              className={inputClass(true)}
              value={form.clientId}
              onChange={(e) => handleClientChange(e.target.value)}
              required
            >
              <option value="">-None-</option>
              {clients.map((row) => (
                <option key={row.id} value={row.id}>
                  {clientDisplayName(row)}
                </option>
              ))}
              {form.clientId &&
              !clients.some((row) => String(row.id) === String(form.clientId)) ? (
                <option value={form.clientId}>{clientDisplayName(client)}</option>
              ) : null}
            </select>
          </Field>
          <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
          <Field label="Contact Name" icon="fa-solid fa-at">
            <input
              className={inputClass()}
              value={form.contactName}
              onChange={(e) => setField("contactName", e.target.value)}
            />
          </Field>
          <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
          <Field label="Currency">
            <select
              className={inputClass()}
              value={form.currency}
              onChange={(e) => setField("currency", e.target.value)}
            >
              {withExtraOption(INVOICE_CURRENCY_OPTIONS, form.currency).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <datalist id="invoice-subject-options">
          {SUBJECT_OPTIONS.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </section>

      <section className={`${styles.clientCrmSection} ${styles.invoiceAddressSection}`}>
        <h4 className={`${styles.clientCrmSectionTitle} ${styles.invoiceSectionTitle}`}>Address Information</h4>
        <p className={styles.panelSubtitle}>
          Use Philippine region, province, city, street/barangay, and ZIP suggestions. Billing address is
          required for the LBC copy of the Service Invoice.
        </p>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <h5 className={styles.clientCrmCategoryTitle}>Billing Address</h5>
            <AddressSuggestField
              label="Country"
              value={form.billingCountry}
              options={countryOptions}
              autoComplete="country-name"
              onChange={(value) => setField("billingCountry", value)}
            />
            <AddressSuggestField
              label="Region"
              value={form.billingRegion}
              options={regionOptions}
              placeholder="Start typing a region"
              onChange={(value) => {
                setForm((current) => {
                  const keep =
                    Boolean(current.billingState) && regionForProvince(current.billingState) === value;
                  return {
                    ...current,
                    billingRegion: value,
                    ...(keep ? {} : { billingState: "", billingCity: "", billingStreet: "" }),
                  };
                });
              }}
            />
            <AddressSuggestField
              label="Province"
              value={form.billingState}
              options={billingProvinceOptions}
              autoComplete="address-level1"
              placeholder="Start typing a province"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  billingState: value,
                  billingRegion: regionForProvince(value) || current.billingRegion,
                }))
              }
            />
            <AddressSuggestField
              label="City"
              value={form.billingCity}
              options={billingCityOptions}
              autoComplete="address-level2"
              placeholder="Start typing a city"
              maxVisible={400}
              onChange={(value) => setField("billingCity", value)}
              onSelect={(value) => applyPlace(findPlaceByCity(value, form.billingState))}
            />
            <AddressSuggestField
              label="Street"
              value={form.billingStreet}
              options={billingStreetOptions}
              autoComplete="street-address"
              placeholder="Start typing a street or barangay"
              maxVisible={400}
              onChange={(value) => setField("billingStreet", value)}
              onSelect={(_value, option) =>
                applyPlace(
                  option.city
                    ? {
                        street: option.street || option.value,
                        city: option.city,
                        province: option.province || "",
                        zip: option.zip || "",
                        country: option.country || "Philippines",
                      }
                    : findPlaceByStreet(option.value, form.billingCity, form.billingState),
                  true,
                )
              }
            />
            <AddressSuggestField
              label="Code"
              value={form.billingCode}
              options={zipOptions}
              autoComplete="postal-code"
              placeholder="ZIP / postal code"
              onChange={(value) => setField("billingCode", value)}
              onSelect={(value) => applyPlace(findPlaceByZip(value))}
            />
          </div>
        </div>
      </section>
    </form>
  );
}
