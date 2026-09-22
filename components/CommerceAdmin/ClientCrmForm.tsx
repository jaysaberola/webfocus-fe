import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import {
  CLIENT_CLASSIFICATION_OPTIONS,
  CLIENT_INDUSTRY_OPTIONS,
  CLIENT_OWNERSHIP_OPTIONS,
  CLIENT_TAX_CLASSIFICATION_OPTIONS,
  CLIENT_TYPE_OPTIONS,
  emptyClientCrmForm,
  parseMobileDigits,
  validateClientCrmForm,
  type ClientCrmFormState,
} from "@/lib/commerceAdmin/clientFormHelpers";
import { customerDisplayName } from "@/lib/customerPortal/mockData";
import {
  fetchCommerceAssignableUsers,
  type CommerceAssignableUser,
} from "@/services/commerceAdminService";
import {
  createCustomerCrmAccount,
  getCustomer,
  updateCustomerCrmAccount,
  type CustomerRow,
} from "@/services/customerService";
import AddressSuggestField from "@/components/CommerceAdmin/AddressSuggestField";
import ClientTimeline, { type ClientAuditEntry } from "@/components/CommerceAdmin/ClientTimeline";
import type { ClientRelatedSection } from "@/components/CommerceAdmin/ClientRelatedList";
import { scrollToClientSectionById } from "@/lib/commerceAdmin/clientScrollHelpers";
import {
  citiesForProvince,
  findPlaceByCity,
  findPlaceByStreet,
  findPlaceByZip,
  PH_COUNTRIES,
  PH_REGIONS,
  provincesForRegion,
  regionForProvince,
  resolveStreetZip,
  streetsForPlace,
  zipSuggestOptions,
} from "@/lib/commerceAdmin/phAddressCatalog";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import { toast } from "@/lib/toast";
import {
  assignablePersonLabel,
  resolveAssignableSelectValue,
  withCurrentAssignablePerson,
  type AssignablePerson,
} from "@/lib/commerceAdmin/clientHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  mode: "create" | "edit";
  client?: CustomerRow | null;
  preferredOwner?: AssignablePerson | null;
  pageTitle?: string;
  pageSubtitle?: string;
  onBack: () => void;
  onSaved: (options?: { andNew?: boolean }) => void;
  onSectionChange?: (section: ClientRelatedSection) => void;
};

type ClientTab = "overview" | "timeline";

export type ClientCrmFormHandle = {
  goToSection: (section: ClientRelatedSection) => void;
};

const OVERVIEW_SECTION_IDS: Partial<Record<ClientRelatedSection, string>> = {
  info: "client-section-info",
  files: "client-section-files",
  address: "client-section-address",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.clientCrmField}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function matchedBarangay(street?: string | null, city?: string | null, province?: string | null) {
  const needle = String(street || "").trim().toLowerCase();
  if (!needle) return "";
  const list = streetsForPlace(city || "", province || "");
  const exact = list.find((place) => place.street?.toLowerCase() === needle);
  if (exact?.street) return exact.street;
  const contained = list
    .filter((place) => place.street && needle.includes(place.street.toLowerCase()))
    .sort((a, b) => (b.street?.length || 0) - (a.street?.length || 0))[0];
  return contained?.street || "";
}

function composeStreetLine(street: string, barangay: string) {
  const line = street.trim();
  const place = barangay.trim();
  if (!place) return line;
  if (!line) return place;
  if (line.toLowerCase().includes(place.toLowerCase())) return line;
  return `${line}, ${place}`;
}

function streetWithoutBarangay(street: string, barangay: string) {
  const place = barangay.trim();
  if (!place) return street.trim();
  if (street.trim().toLowerCase() === place.toLowerCase()) return "";
  return street
    .replace(new RegExp(`,\\s*${place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "")
    .trim();
}

function fileLabelFromPath(path?: string | null) {
  if (!path) return null;
  const parts = String(path).replace(/\\/g, "/").split("/");
  return parts[parts.length - 1] || path;
}

function firstValidationError(errors: unknown): string | undefined {
  if (!errors || typeof errors !== "object") return undefined;
  const first = Object.values(errors as Record<string, string | string[]>)[0];
  if (Array.isArray(first)) return first.find((item) => typeof item === "string");
  return typeof first === "string" ? first : undefined;
}

function FileField({
  label,
  value,
  existingPath,
  existingUrl,
  onChange,
}: {
  label: string;
  value: File | null;
  existingPath?: string | null;
  existingUrl?: string | null;
  onChange: (file: File | null) => void;
}) {
  const viewUrl = resolveStorageAssetUrl(existingUrl || existingPath);
  const existingName = fileLabelFromPath(existingPath);

  return (
    <Field label={label}>
      <div className={styles.clientCrmFileBlock}>
        <input
          className={styles.clientCrmInput}
          type="file"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        {value ? (
          <span className={styles.clientCrmFileHint}>Selected: {value.name}</span>
        ) : existingName || viewUrl ? (
          <div className={styles.clientCrmFileView}>
            <span className={styles.clientCrmFileHint}>
              Uploaded: {existingName || "file on record"}
            </span>
            {viewUrl ? (
              <a className={styles.clientCrmFileLink} href={viewUrl} target="_blank" rel="noreferrer">
                View / Download
              </a>
            ) : null}
          </div>
        ) : (
          <span className={styles.clientCrmFileHint}>No file uploaded</span>
        )}
      </div>
    </Field>
  );
}

const ClientCrmForm = forwardRef<ClientCrmFormHandle, Props>(function ClientCrmForm(
  { mode, client, preferredOwner = null, pageTitle, pageSubtitle, onBack, onSaved, onSectionChange },
  ref,
) {
  const [form, setForm] = useState<ClientCrmFormState>(emptyClientCrmForm);
  const [billingBarangay, setBillingBarangay] = useState("");
  const [shippingBarangay, setShippingBarangay] = useState("");
  const [owners, setOwners] = useState<CommerceAssignableUser[]>([]);
  const [billingUsers, setBillingUsers] = useState<CommerceAssignableUser[]>([]);
  const [loading, setLoading] = useState(mode === "edit");
  const [submitting, setSubmitting] = useState(false);
  const [existingFiles, setExistingFiles] = useState<Record<string, string | null>>({});
  const [existingFileUrls, setExistingFileUrls] = useState<Record<string, string | null>>({});
  const [audits, setAudits] = useState<ClientAuditEntry[]>([]);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ClientTab>("overview");
  const [formMode, setFormMode] = useState(mode);
  const skipNextClientLoadRef = useRef(false);
  const [currentOwner, setCurrentOwner] = useState<{
    id: number;
    name?: string | null;
    email?: string | null;
  } | null>(null);

  useEffect(() => {
    setFormMode(mode);
  }, [mode]);

  const billingOfficers = useMemo(() => {
    const officers = billingUsers.filter((owner) => owner.name || owner.email);
    const selected = resolveAssignableSelectValue(form.billing_in_charge, officers);
    return withCurrentAssignablePerson(officers, selected ? { name: selected } : null);
  }, [billingUsers, form.billing_in_charge]);

  const ownerOptions = useMemo(
    () => withCurrentAssignablePerson(owners, currentOwner),
    [owners, currentOwner],
  );

  const billingSelectValue = resolveAssignableSelectValue(form.billing_in_charge, billingOfficers);

  const goToSection = useCallback(
    (section: ClientRelatedSection) => {
      if (section === "orders" || section === "invoices") return;

      onSectionChange?.(section);

      if (section === "timeline") {
        setActiveTab("timeline");
        requestAnimationFrame(() => {
          scrollToClientSectionById("client-section-timeline");
        });
        return;
      }

      setActiveTab("overview");
      const sectionId = OVERVIEW_SECTION_IDS[section];
      if (sectionId) {
        requestAnimationFrame(() => {
          scrollToClientSectionById(sectionId);
        });
      }
    },
    [onSectionChange],
  );

  useImperativeHandle(ref, () => ({ goToSection }), [goToSection]);

  useEffect(() => {
    fetchCommerceAssignableUsers({ for: "client_owner" })
      .then((rows) => setOwners(rows))
      .catch(() => setOwners([]));
    fetchCommerceAssignableUsers({ for: "billing_in_charge" })
      .then((rows) => setBillingUsers(Array.isArray(rows) ? rows : []))
      .catch(() => setBillingUsers([]));
  }, []);

  useEffect(() => {
    if (skipNextClientLoadRef.current) {
      skipNextClientLoadRef.current = false;
      return;
    }
    if (mode !== "edit" || !client?.id) {
      setForm(emptyClientCrmForm);
      setBillingBarangay("");
      setShippingBarangay("");
      setExistingFiles({});
      setExistingFileUrls({});
      setAudits([]);
      setCreatedAt(null);
      setActiveTab("overview");
      setCurrentOwner(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    getCustomer(client.id, { silent: true })
      .then((detail) => {
        const ownerId = Number(preferredOwner?.id ?? detail?.owner_id ?? client.owner_id ?? 0) || null;
        const ownerName =
          String(
            preferredOwner?.name ||
              detail?.owner?.name ||
              detail?.owner_name ||
              client.owner?.name ||
              client.owner_name ||
              "",
          ).trim() ||
          String(preferredOwner?.email || detail?.owner?.email || client.owner?.email || "").trim();
        setCurrentOwner(
          ownerId
            ? {
                id: ownerId,
                name: ownerName,
                email: preferredOwner?.email ?? detail?.owner?.email ?? client.owner?.email ?? null,
              }
            : null,
        );
        setForm({
          ...emptyClientCrmForm,
          owner_id: ownerId,
          company: String(detail?.company ?? client.company ?? client.name ?? "")
            .replace(/\s+(Customer|User)$/i, "")
            .trim(),
          industry: detail?.industry ?? "",
          tax_classification: detail?.tax_classification ?? "",
          tin_number: detail?.tin_number ?? "",
          other_numbers: detail?.other_numbers ?? "",
          currency: detail?.currency || "PHP",
          workdrive_folder_url: detail?.workdrive_folder_url ?? "",
          client_classification: detail?.client_classification ?? "",
          client_type: detail?.client_type ?? "",
          contact_person:
            String(detail?.contact_person || "")
              .replace(/\s+(Customer|User)$/i, "")
              .trim() ||
            customerDisplayName(detail?.fname, detail?.lname) ||
            "",
          mobile: parseMobileDigits(detail?.mobile),
          phone: detail?.phone ?? "",
          email: detail?.email ?? client.email ?? "",
          website: detail?.website ?? "",
          ownership: detail?.ownership ?? "",
          billing_in_charge: String(detail?.billing_in_charge || client.billing_in_charge || "").trim(),
          exchange_rate: String(detail?.exchange_rate ?? "1"),
          workdrive_folder_id: detail?.workdrive_folder_id ?? "",
          address_street: streetWithoutBarangay(
            detail?.address_street ?? "",
            matchedBarangay(detail?.address_street, detail?.address_city, detail?.address_province),
          ),
          address_city: detail?.address_city ?? "",
          address_province: detail?.address_province ?? "",
          address_region: detail?.address_region || regionForProvince(detail?.address_province ?? ""),
          address_zip: resolveStreetZip(
            matchedBarangay(detail?.address_street, detail?.address_city, detail?.address_province) ||
              detail?.address_street,
            detail?.address_city,
            detail?.address_province,
            detail?.address_zip,
          ),
          address_country: detail?.address_country || "Philippines",
          shipping_street: streetWithoutBarangay(
            detail?.shipping_street ?? "",
            matchedBarangay(detail?.shipping_street, detail?.shipping_city, detail?.shipping_province),
          ),
          shipping_city: detail?.shipping_city ?? "",
          shipping_province: detail?.shipping_province ?? "",
          shipping_region: detail?.shipping_region || regionForProvince(detail?.shipping_province ?? ""),
          shipping_zip: resolveStreetZip(
            matchedBarangay(detail?.shipping_street, detail?.shipping_city, detail?.shipping_province) ||
              detail?.shipping_street,
            detail?.shipping_city,
            detail?.shipping_province,
            detail?.shipping_zip,
          ),
          shipping_country: detail?.shipping_country || "Philippines",
        });
        setBillingBarangay(
          matchedBarangay(detail?.address_street, detail?.address_city, detail?.address_province),
        );
        setShippingBarangay(
          matchedBarangay(detail?.shipping_street, detail?.shipping_city, detail?.shipping_province),
        );
        setExistingFiles({
          bir_certificate: detail?.bir_certificate ?? null,
          business_permit: detail?.business_permit ?? null,
          sec_dti_registration: detail?.sec_dti_registration ?? null,
          valid_id_signatories: detail?.valid_id_signatories ?? null,
          gen_info_sheet: detail?.gen_info_sheet ?? null,
        });
        setExistingFileUrls({
          bir_certificate: detail?.bir_certificate_url ?? null,
          business_permit: detail?.business_permit_url ?? null,
          sec_dti_registration: detail?.sec_dti_registration_url ?? null,
          valid_id_signatories: detail?.valid_id_signatories_url ?? null,
          gen_info_sheet: detail?.gen_info_sheet_url ?? null,
        });
        setAudits(Array.isArray(detail?.audits) ? detail.audits : []);
        setCreatedAt(detail?.created_at ?? client.created_at ?? null);
      })
      .catch(() => {
        toast.error("Failed to load client details.");
        const ownerId = Number(preferredOwner?.id ?? client.owner_id ?? 0) || null;
        setForm({
          ...emptyClientCrmForm,
          company: client.company ?? client.name ?? "",
          email: client.email ?? "",
          owner_id: ownerId,
          billing_in_charge: String(client.billing_in_charge || "").trim(),
        });
        setCurrentOwner(
          ownerId
            ? {
                id: ownerId,
                name: preferredOwner?.name || client.owner?.name || client.owner_name,
                email: preferredOwner?.email ?? client.owner?.email ?? null,
              }
            : null,
        );
        setAudits([]);
      })
      .finally(() => setLoading(false));
  }, [mode, client, preferredOwner]);

  const setField = <K extends keyof ClientCrmFormState>(key: K, value: ClientCrmFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const copyBillingToShipping = () => {
    setShippingBarangay(billingBarangay);
    setForm((current) => ({
      ...current,
      shipping_street: current.address_street,
      shipping_city: current.address_city,
      shipping_province: current.address_province,
      shipping_region: current.address_region,
      shipping_zip: current.address_zip,
      shipping_country: current.address_country,
    }));
  };

  const applyPlace = (
    prefix: "billing" | "shipping",
    place: { street?: string; city: string; province: string; zip: string; country: string } | null,
    includeStreet = false,
  ) => {
    if (!place) return;
    const country = place.country || "Philippines";
    const region = regionForProvince(place.province);
    if (prefix === "billing") {
      setForm((current) => ({
        ...current,
        ...(includeStreet && place.street ? { address_street: place.street } : {}),
        address_city: place.city,
        address_province: place.province,
        address_region: region || current.address_region,
        address_zip: place.zip || current.address_zip,
        address_country: country,
      }));
      return;
    }
    setForm((current) => ({
      ...current,
      ...(includeStreet && place.street ? { shipping_street: place.street } : {}),
      shipping_city: place.city,
      shipping_province: place.province,
      shipping_region: region || current.shipping_region,
      shipping_zip: place.zip || current.shipping_zip,
      shipping_country: country,
    }));
  };

  useEffect(() => {
    const billingZip = resolveStreetZip(
      billingBarangay || form.address_street,
      form.address_city,
      form.address_province,
      form.address_zip,
    );
    const shippingZip = resolveStreetZip(
      shippingBarangay || form.shipping_street,
      form.shipping_city,
      form.shipping_province,
      form.shipping_zip,
    );
    if (billingZip === form.address_zip && shippingZip === form.shipping_zip) return;
    setForm((current) => ({
      ...current,
      address_zip: billingZip || current.address_zip,
      shipping_zip: shippingZip || current.shipping_zip,
    }));
  }, [
    billingBarangay,
    form.address_street,
    form.address_city,
    form.address_province,
    shippingBarangay,
    form.shipping_street,
    form.shipping_city,
    form.shipping_province,
  ]);

  const billingStreetOptions = useMemo(() => {
    const seen = new Set<string>();
    return streetsForPlace(form.address_city, form.address_province)
      .filter((place) => {
        const key = `${place.street}|${place.city}|${place.zip}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((place) => ({
        value: place.street || "",
        label: place.street || "",
        street: place.street,
        city: place.city,
        province: place.province,
        zip: place.zip,
        country: place.country,
      }));
  }, [form.address_city, form.address_province]);

  const shippingStreetOptions = useMemo(() => {
    const seen = new Set<string>();
    return streetsForPlace(form.shipping_city, form.shipping_province)
      .filter((place) => {
        const key = `${place.street}|${place.city}|${place.zip}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((place) => ({
        value: place.street || "",
        label: place.street || "",
        street: place.street,
        city: place.city,
        province: place.province,
        zip: place.zip,
        country: place.country,
      }));
  }, [form.shipping_city, form.shipping_province]);

  const billingCityOptions = useMemo(() => {
    const seen = new Set<string>();
    return citiesForProvince(form.address_province)
      .filter((place) => {
        const key = `${place.city}|${place.province}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((place) => ({
        value: place.city,
        label: place.city,
      }));
  }, [form.address_province]);

  const shippingCityOptions = useMemo(() => {
    const seen = new Set<string>();
    return citiesForProvince(form.shipping_province)
      .filter((place) => {
        const key = `${place.city}|${place.province}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((place) => ({
        value: place.city,
        label: place.city,
      }));
  }, [form.shipping_province]);

  const regionOptions = useMemo(
    () => PH_REGIONS.map((region) => ({ value: region, label: region })),
    []
  );

  const billingProvinceOptions = useMemo(
    () => provincesForRegion(form.address_region).map((province) => ({ value: province, label: province })),
    [form.address_region]
  );

  const shippingProvinceOptions = useMemo(
    () => provincesForRegion(form.shipping_region).map((province) => ({ value: province, label: province })),
    [form.shipping_region]
  );

  const billingZipOptions = useMemo(
    () => zipSuggestOptions(form.address_city, form.address_province, billingBarangay),
    [form.address_city, form.address_province, billingBarangay],
  );

  const shippingZipOptions = useMemo(
    () => zipSuggestOptions(form.shipping_city, form.shipping_province, shippingBarangay),
    [form.shipping_city, form.shipping_province, shippingBarangay],
  );

  const countryOptions = useMemo(
    () => PH_COUNTRIES.map((country) => ({ value: country, label: country })),
    []
  );

  const toPayload = () => ({
    company: form.company.trim(),
    email: form.email.trim(),
    owner_id: form.owner_id,
    contact_person: form.contact_person.trim(),
    mobile: form.mobile.trim(),
    phone: form.phone.trim(),
    industry: form.industry,
    tax_classification: form.tax_classification,
    tin_number: form.tin_number.trim(),
    other_numbers: form.other_numbers.trim(),
    currency: form.currency || "PHP",
    workdrive_folder_url: form.workdrive_folder_url.trim(),
    workdrive_folder_id: form.workdrive_folder_id.trim(),
    client_classification: form.client_classification,
    client_type: form.client_type,
    website: form.website.trim(),
    ownership: form.ownership,
    billing_in_charge: form.billing_in_charge,
    exchange_rate: form.exchange_rate || "1",
    address_street: composeStreetLine(form.address_street, billingBarangay),
    address_city: form.address_city.trim(),
    address_province: form.address_province.trim(),
    address_region: form.address_region.trim(),
    address_zip: form.address_zip.trim(),
    address_country: form.address_country.trim(),
    shipping_street: composeStreetLine(form.shipping_street, shippingBarangay),
    shipping_city: form.shipping_city.trim(),
    shipping_province: form.shipping_province.trim(),
    shipping_region: form.shipping_region.trim(),
    shipping_zip: form.shipping_zip.trim(),
    shipping_country: form.shipping_country.trim(),
    bir_certificate: form.bir_certificate,
    business_permit: form.business_permit,
    sec_dti_registration: form.sec_dti_registration,
    valid_id_signatories: form.valid_id_signatories,
    gen_info_sheet: form.gen_info_sheet,
  });

  const save = async (andNew: boolean) => {
    if (!billingBarangay.trim()) {
      toast.error("Billing Barangay is required for the LBC copy of the Service Invoice.");
      return;
    }
    const validationError = validateClientCrmForm({
      ...form,
      address_street: composeStreetLine(form.address_street, billingBarangay),
      shipping_street: composeStreetLine(form.shipping_street, shippingBarangay),
    });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const payload = toPayload();
      if (formMode === "edit" && client?.id) {
        await updateCustomerCrmAccount(client.id, payload);
        toast.success("Client updated successfully.");
        if (andNew) {
          skipNextClientLoadRef.current = true;
          setFormMode("create");
          setForm(emptyClientCrmForm);
          setBillingBarangay("");
          setShippingBarangay("");
          setExistingFiles({});
          setExistingFileUrls({});
          setAudits([]);
          setCreatedAt(null);
          setActiveTab("overview");
          onSaved({ andNew: true });
          return;
        }
        onSaved();
        onBack();
        return;
      }

      await createCustomerCrmAccount(payload);
      toast.success(`Client ${form.company.trim()} added successfully!`);
      onSaved({ andNew });
      if (andNew) {
        setForm(emptyClientCrmForm);
        setBillingBarangay("");
        setShippingBarangay("");
        setExistingFiles({});
        setExistingFileUrls({});
      } else {
        onBack();
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        firstValidationError(err?.response?.data?.errors) ||
        (mode === "edit" ? "Failed to update client." : "Failed to create client.");
      toast.error(String(message));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p className={styles.emptyState}>Loading client form...</p>;
  }

  return (
    <div className={styles.clientCrmPage}>
      <div className={styles.clientCrmTopBar}>
        <div className={styles.clientCrmTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h3 className={styles.panelTitle}>
              {formMode === "create"
                ? "Create Client"
                : pageTitle || (mode === "edit" ? "Edit Client" : "Create Client")}
            </h3>
            <p className={styles.panelSubtitle}>{pageSubtitle || "Clients"}</p>
          </div>
        </div>
        <div className={styles.clientCrmActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            onClick={() => void save(true)}
            disabled={submitting}
          >
            Save and New
          </button>
          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={() => void save(false)}
            disabled={submitting}
          >
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {formMode === "edit" ? (
        <div className={styles.clientCrmTabs} role="tablist" aria-label="Client sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "overview"}
            className={`${styles.clientCrmTab}${activeTab === "overview" ? ` ${styles.clientCrmTabActive}` : ""}`}
            onClick={() => {
              setActiveTab("overview");
              onSectionChange?.("info");
            }}
          >
            Overview
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "timeline"}
            className={`${styles.clientCrmTab}${activeTab === "timeline" ? ` ${styles.clientCrmTabActive}` : ""}`}
            onClick={() => {
              setActiveTab("timeline");
              onSectionChange?.("timeline");
            }}
          >
            Timeline
          </button>
        </div>
      ) : null}

      {activeTab === "timeline" && formMode === "edit" ? (
        <div id="client-section-timeline" className={styles.clientEditScrollTarget}>
          <ClientTimeline
            audits={audits}
            createdAt={createdAt}
            clientName={form.company || client?.company || client?.name || null}
          />
        </div>
      ) : (
        <>
      <section id="client-section-info" className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Client Information</h4>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <Field label="Client Owner">
              <select
                className={styles.clientCrmInput}
                value={form.owner_id ? String(form.owner_id) : ""}
                onChange={(e) =>
                  setField("owner_id", e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">-None-</option>
                {ownerOptions.map((owner) => (
                  <option key={owner.id} value={String(owner.id)}>
                    {assignablePersonLabel(owner) || "Current owner"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Client Name">
              <input
                className={styles.clientCrmInput}
                value={form.company}
                onChange={(e) => setField("company", e.target.value)}
              />
            </Field>
            <Field label="Industry">
              <select
                className={styles.clientCrmInput}
                value={form.industry}
                onChange={(e) => setField("industry", e.target.value)}
              >
                <option value="">-None-</option>
                {CLIENT_INDUSTRY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tax Classification">
              <select
                className={styles.clientCrmInput}
                value={form.tax_classification}
                onChange={(e) => setField("tax_classification", e.target.value)}
              >
                <option value="">-None-</option>
                {CLIENT_TAX_CLASSIFICATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="TIN Number">
              <input
                className={styles.clientCrmInput}
                value={form.tin_number}
                onChange={(e) => setField("tin_number", e.target.value)}
              />
            </Field>
            <Field label="Other Numbers">
              <input
                className={styles.clientCrmInput}
                value={form.other_numbers}
                onChange={(e) => setField("other_numbers", e.target.value)}
              />
            </Field>
          </div>

          <div className={styles.clientCrmCol}>
            <Field label="Client Classification">
              <select
                className={styles.clientCrmInput}
                value={form.client_classification}
                onChange={(e) => setField("client_classification", e.target.value)}
              >
                <option value="">-None-</option>
                {CLIENT_CLASSIFICATION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Client Type">
              <select
                className={styles.clientCrmInput}
                value={form.client_type}
                onChange={(e) => setField("client_type", e.target.value)}
              >
                <option value="">-None-</option>
                {CLIENT_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Contact Person">
              <input
                className={styles.clientCrmInput}
                value={form.contact_person}
                onChange={(e) => setField("contact_person", e.target.value)}
              />
            </Field>
            <Field label="Contact Number">
              <div className={styles.phoneInputWrap}>
                <span className={styles.phonePrefix}>+63</span>
                <input
                  className={styles.phoneInput}
                  value={form.mobile}
                  onChange={(e) =>
                    setField("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  placeholder="9171234567"
                  inputMode="numeric"
                  maxLength={10}
                />
              </div>
            </Field>
            <Field label="Phone">
              <input
                className={styles.clientCrmInput}
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                className={styles.clientCrmInput}
                type="email"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </Field>
            <Field label="Ownership">
              <select
                className={styles.clientCrmInput}
                value={form.ownership}
                onChange={(e) => setField("ownership", e.target.value)}
              >
                <option value="">-None-</option>
                {CLIENT_OWNERSHIP_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Billing in Charge">
              <select
                className={styles.clientCrmInput}
                value={billingSelectValue}
                onChange={(e) => setField("billing_in_charge", e.target.value)}
              >
                <option value="">-None-</option>
                {billingOfficers.map((owner) => (
                  <option key={`${owner.id}-${assignablePersonLabel(owner)}`} value={assignablePersonLabel(owner)}>
                    {assignablePersonLabel(owner)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </section>

      <section id="client-section-files" className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>File Attachments</h4>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <FileField
              label="BIR Certificate of Registration"
              value={form.bir_certificate}
              existingPath={existingFiles.bir_certificate}
              existingUrl={existingFileUrls.bir_certificate}
              onChange={(file) => setField("bir_certificate", file)}
            />
            <FileField
              label="Business Permit"
              value={form.business_permit}
              existingPath={existingFiles.business_permit}
              existingUrl={existingFileUrls.business_permit}
              onChange={(file) => setField("business_permit", file)}
            />
            <FileField
              label="SEC/DTI Registration"
              value={form.sec_dti_registration}
              existingPath={existingFiles.sec_dti_registration}
              existingUrl={existingFileUrls.sec_dti_registration}
              onChange={(file) => setField("sec_dti_registration", file)}
            />
          </div>
          <div className={styles.clientCrmCol}>
            <FileField
              label="Valid ID of Signatories"
              value={form.valid_id_signatories}
              existingPath={existingFiles.valid_id_signatories}
              existingUrl={existingFileUrls.valid_id_signatories}
              onChange={(file) => setField("valid_id_signatories", file)}
            />
            <FileField
              label="Gen. Info and Customer Info Sheet"
              value={form.gen_info_sheet}
              existingPath={existingFiles.gen_info_sheet}
              existingUrl={existingFileUrls.gen_info_sheet}
              onChange={(file) => setField("gen_info_sheet", file)}
            />
          </div>
        </div>
      </section>

      <section id="client-section-address" className={styles.clientCrmSection}>
        <div className={styles.clientCrmSectionHead}>
          <h4 className={styles.clientCrmSectionTitle}>Address Information</h4>
          <button type="button" className={styles.clientCrmCopyBtn} onClick={copyBillingToShipping}>
            Copy Address
          </button>
        </div>
        <p className={styles.panelSubtitle}>
          Use Philippine region, province, city, street, barangay, and ZIP suggestions. Billing address is
          required for the LBC copy of the Service Invoice.
        </p>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <h5 className={styles.clientCrmCategoryTitle}>Billing Address</h5>
            <AddressSuggestField
              label="Country"
              value={form.address_country}
              options={countryOptions}
              autoComplete="country-name"
              onChange={(value) => setField("address_country", value)}
            />
            <AddressSuggestField
              label="Region"
              value={form.address_region}
              options={regionOptions}
              placeholder="Start typing a region"
              onChange={(value) => {
                setForm((current) => {
                  const keep = Boolean(current.address_province) && regionForProvince(current.address_province) === value;
                  if (!keep) setBillingBarangay("");
                  return {
                    ...current,
                    address_region: value,
                    ...(keep ? {} : { address_province: "", address_city: "", address_street: "" }),
                  };
                });
              }}
            />
            <AddressSuggestField
              label="Province"
              value={form.address_province}
              options={billingProvinceOptions}
              autoComplete="address-level1"
              placeholder="Start typing a province"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  address_province: value,
                  address_region: regionForProvince(value) || current.address_region,
                }))
              }
            />
            <AddressSuggestField
              label="City"
              value={form.address_city}
              options={billingCityOptions}
              autoComplete="address-level2"
              placeholder="Start typing a city"
              maxVisible={400}
              onChange={(value) => {
                setBillingBarangay("");
                setField("address_city", value);
              }}
              onSelect={(value) => {
                setBillingBarangay("");
                applyPlace("billing", findPlaceByCity(value, form.address_province));
              }}
            />
            <AddressSuggestField
              label="Barangay *"
              value={billingBarangay}
              options={billingStreetOptions}
              placeholder="Choose a barangay"
              maxVisible={400}
              onChange={setBillingBarangay}
              onSelect={(_value, option) => {
                setBillingBarangay(option.street || option.value);
                applyPlace(
                  "billing",
                  option.city
                    ? {
                        street: option.street || option.value,
                        city: option.city,
                        province: option.province || "",
                        zip: option.zip || "",
                        country: option.country || "Philippines",
                      }
                    : findPlaceByStreet(option.value, form.address_city, form.address_province),
                  false,
                );
              }}
            />
            <Field label="Street">
              <input
                className={styles.clientCrmInput}
                value={form.address_street}
                autoComplete="street-address"
                placeholder="House no., building, street"
                onChange={(event) => setField("address_street", event.target.value)}
              />
            </Field>
            <AddressSuggestField
              label="ZIP Code"
              value={form.address_zip}
              options={billingZipOptions}
              autoComplete="postal-code"
              placeholder="Enter ZIP code"
              filterMode="code"
              onChange={(value) => setField("address_zip", value)}
              onSelect={(value, option) =>
                applyPlace(
                  "billing",
                  option.city
                    ? {
                        city: option.city,
                        province: option.province || form.address_province,
                        zip: option.zip || value,
                        country: option.country || "Philippines",
                      }
                    : findPlaceByZip(value, form.address_city, form.address_province),
                )
              }
            />
          </div>
          <div className={styles.clientCrmCol}>
            <h5 className={styles.clientCrmCategoryTitle}>Shipping Address</h5>
            <AddressSuggestField
              label="Country"
              value={form.shipping_country}
              options={countryOptions}
              autoComplete="shipping country-name"
              onChange={(value) => setField("shipping_country", value)}
            />
            <AddressSuggestField
              label="Region"
              value={form.shipping_region}
              options={regionOptions}
              placeholder="Start typing a region"
              onChange={(value) => {
                setForm((current) => {
                  const keep = Boolean(current.shipping_province) && regionForProvince(current.shipping_province) === value;
                  if (!keep) setShippingBarangay("");
                  return {
                    ...current,
                    shipping_region: value,
                    ...(keep ? {} : { shipping_province: "", shipping_city: "", shipping_street: "" }),
                  };
                });
              }}
            />
            <AddressSuggestField
              label="Province"
              value={form.shipping_province}
              options={shippingProvinceOptions}
              autoComplete="shipping address-level1"
              placeholder="Start typing a province"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  shipping_province: value,
                  shipping_region: regionForProvince(value) || current.shipping_region,
                }))
              }
            />
            <AddressSuggestField
              label="City"
              value={form.shipping_city}
              options={shippingCityOptions}
              autoComplete="shipping address-level2"
              placeholder="Start typing a city"
              maxVisible={400}
              onChange={(value) => {
                setShippingBarangay("");
                setField("shipping_city", value);
              }}
              onSelect={(value) => {
                setShippingBarangay("");
                applyPlace("shipping", findPlaceByCity(value, form.shipping_province));
              }}
            />
            <AddressSuggestField
              label="Barangay"
              value={shippingBarangay}
              options={shippingStreetOptions}
              placeholder="Choose a barangay"
              maxVisible={400}
              onChange={setShippingBarangay}
              onSelect={(_value, option) => {
                setShippingBarangay(option.street || option.value);
                applyPlace(
                  "shipping",
                  option.city
                    ? {
                        street: option.street || option.value,
                        city: option.city,
                        province: option.province || "",
                        zip: option.zip || "",
                        country: option.country || "Philippines",
                      }
                    : findPlaceByStreet(option.value, form.shipping_city, form.shipping_province),
                  false,
                );
              }}
            />
            <Field label="Street">
              <input
                className={styles.clientCrmInput}
                value={form.shipping_street}
                autoComplete="shipping street-address"
                placeholder="House no., building, street"
                onChange={(event) => setField("shipping_street", event.target.value)}
              />
            </Field>
            <AddressSuggestField
              label="ZIP Code"
              value={form.shipping_zip}
              options={shippingZipOptions}
              autoComplete="shipping postal-code"
              placeholder="Enter ZIP code"
              filterMode="code"
              onChange={(value) => setField("shipping_zip", value)}
              onSelect={(value, option) =>
                applyPlace(
                  "shipping",
                  option.city
                    ? {
                        city: option.city,
                        province: option.province || form.shipping_province,
                        zip: option.zip || value,
                        country: option.country || "Philippines",
                      }
                    : findPlaceByZip(value, form.shipping_city, form.shipping_province),
                )
              }
            />
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
});

export default ClientCrmForm;
