import { useEffect, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import {
  emptyLeadForm,
  LEAD_INTERESTED_IN_OPTIONS,
  LEAD_SALUTATION_OPTIONS,
  LEAD_SOURCE_OPTIONS,
  LEAD_STATUS_OPTIONS,
  leadFormFromRow,
  type LeadFormState,
} from "@/lib/commerceAdmin/leadFormHelpers";
import AddressSuggestField from "@/components/CommerceAdmin/AddressSuggestField";
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
import { getRoleDisplayLabel } from "@/lib/userRoles";
import { createLead, updateLead, type CrmLeadRow } from "@/services/leadService";
import { getCurrentUserCached } from "@/lib/currentUser";
import styles from "@/styles/commerceAdmin.module.css";

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={styles.clientCrmField}>
      <span className={styles.clientCrmFieldLabel}>
        {label}
        {hint ? (
          <span className={styles.clientCrmHelpText} title={hint} aria-label={hint}>
            i
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function inputClass(required?: boolean, extra?: string) {
  return [styles.clientCrmInput, required ? styles.clientCrmInputRequired : "", extra].filter(Boolean).join(" ");
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

type Props = {
  mode: "create" | "edit";
  lead?: CrmLeadRow | null;
  onBack: () => void;
  onSaved: (options?: { andNew?: boolean }) => void;
};

export default function LeadCrmForm({ mode, lead, onBack, onSaved }: Props) {
  const [form, setForm] = useState<LeadFormState>(() => (lead ? leadFormFromRow(lead) : emptyLeadForm));
  const [submitting, setSubmitting] = useState(false);
  const [ownerLabel, setOwnerLabel] = useState("Customer Care");
  const [addressRegion, setAddressRegion] = useState("");
  const [leadBarangay, setLeadBarangay] = useState("");

  useEffect(() => {
    if (lead) {
      const barangay = matchedBarangay(lead.address_street, lead.address_city, lead.address_province);
      setLeadBarangay(barangay);
      setAddressRegion(regionForProvince(lead.address_province ?? "") || "");
      setForm({
        ...leadFormFromRow(lead),
        address_street: streetWithoutBarangay(lead.address_street ?? "", barangay),
      });
      const owner = lead.lead_owner?.name || [lead.lead_owner?.fname, lead.lead_owner?.lname].filter(Boolean).join(" ");
      if (owner) setOwnerLabel(owner);
    }
  }, [lead]);

  useEffect(() => {
    if (mode !== "create") return;
    void getCurrentUserCached({ force: false }).then((user) => {
      if (!user) return;
      const name = getRoleDisplayLabel(user);
      const person = String(
        (user as { name?: string }).name ||
          `${(user as { fname?: string }).fname || ""} ${(user as { lname?: string }).lname || ""}`.trim() ||
          (user as { email?: string }).email ||
          "",
      ).trim();
      setOwnerLabel(person || name);
    });
  }, [mode]);

  const title = mode === "create" ? "Create Lead" : "Edit Lead";

  const setField = <K extends keyof LeadFormState>(key: K, value: LeadFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validate = () => {
    if (!form.lead_source.trim()) {
      toast.error("Lead Source is required.");
      return false;
    }
    if (!form.lead_status.trim()) {
      toast.error("Lead Status is required.");
      return false;
    }
    if (!form.company.trim()) {
      toast.error("Company is required.");
      return false;
    }
    if (!form.last_name.trim()) {
      toast.error("Last Name is required.");
      return false;
    }
    return true;
  };

  const toAddressPayload = (): LeadFormState => ({
    ...form,
    address_street: composeStreetLine(form.address_street, leadBarangay),
  });

  const applyPlace = (
    place: { street?: string; city: string; province: string; zip: string; country: string } | null,
    includeStreet = false,
  ) => {
    if (!place) return;
    const country = place.country || "Philippines";
    const region = regionForProvince(place.province);
    setForm((current) => ({
      ...current,
      ...(includeStreet && place.street ? { address_street: place.street } : {}),
      address_city: place.city,
      address_province: place.province,
      address_zip: place.zip || current.address_zip,
      address_country: country,
    }));
    if (region) setAddressRegion(region);
  };

  useEffect(() => {
    const nextZip = resolveStreetZip(leadBarangay || form.address_street, form.address_city, form.address_province, form.address_zip);
    if (nextZip === form.address_zip) return;
    setForm((current) => ({ ...current, address_zip: nextZip || current.address_zip }));
  }, [leadBarangay, form.address_street, form.address_city, form.address_province]);

  const streetOptions = useMemo(() => {
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

  const cityOptions = useMemo(() => {
    const seen = new Set<string>();
    return citiesForProvince(form.address_province)
      .filter((place) => {
        const key = `${place.city}|${place.province}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((place) => ({ value: place.city, label: place.city }));
  }, [form.address_province]);

  const provinceOptions = useMemo(
    () => provincesForRegion(addressRegion).map((province) => ({ value: province, label: province })),
    [addressRegion],
  );

  const regionOptions = useMemo(() => PH_REGIONS.map((region) => ({ value: region, label: region })), []);

  const countryOptions = useMemo(() => PH_COUNTRIES.map((country) => ({ value: country, label: country })), []);

  const zipOptions = useMemo(
    () => zipSuggestOptions(form.address_city, form.address_province, leadBarangay),
    [form.address_city, form.address_province, leadBarangay],
  );

  const save = async (andNew: boolean) => {
    if (!validate()) return;
    setSubmitting(true);
    const payload = toAddressPayload();
    try {
      if (mode === "edit" && lead?.id) {
        await updateLead(lead.id, payload);
        toast.success("Lead updated.");
        onSaved();
        return;
      }
      await createLead(payload);
      toast.success("Lead created.");
      if (andNew) {
        setForm({ ...emptyLeadForm });
        setLeadBarangay("");
        setAddressRegion("");
        onSaved({ andNew: true });
        return;
      }
      onSaved();
    } catch {
      toast.error("Failed to save lead.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.clientCrmPage}>
      <div className={styles.clientCrmTopBar}>
        <div className={styles.clientCrmTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h3 className={styles.panelTitle}>{title}</h3>
            <p className={styles.panelSubtitle}>Leads</p>
          </div>
        </div>
        <div className={styles.clientCrmActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          {mode === "create" ? (
            <button
              type="button"
              className={styles.secondaryBtnSm}
              disabled={submitting}
              onClick={() => void save(true)}
            >
              Save and New
            </button>
          ) : null}
          <button type="button" className={styles.primaryBtnSm} disabled={submitting} onClick={() => void save(false)}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Lead Source and Status</h4>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <Field label="Lead Source" required>
              <select
                className={inputClass(true)}
                value={form.lead_source}
                onChange={(e) => setField("lead_source", e.target.value)}
              >
                <option value="">-None-</option>
                {LEAD_SOURCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className={styles.clientCrmCol}>
            <Field label="Lead Status" required>
              <select
                className={inputClass(true)}
                value={form.lead_status}
                onChange={(e) => setField("lead_status", e.target.value)}
              >
                <option value="">-None-</option>
                {LEAD_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </section>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Lead Information</h4>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <Field label="Lead Owner">
              <div className={styles.clientCrmLockedField}>
                <i className="fa-solid fa-lock" aria-hidden="true" />
                <span>{ownerLabel}</span>
              </div>
            </Field>
            <Field label="First Name">
              <div className={styles.clientCrmNameSplit}>
                <select
                  className={`${styles.clientCrmInput} ${styles.clientCrmInputRequired}`}
                  value={form.salutation}
                  onChange={(e) => setField("salutation", e.target.value)}
                  aria-label="Salutation"
                >
                  <option value="">-None-</option>
                  {LEAD_SALUTATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <input
                  className={styles.clientCrmInput}
                  value={form.first_name}
                  onChange={(e) => setField("first_name", e.target.value)}
                  placeholder="First name"
                />
              </div>
            </Field>
            <Field label="Title">
              <input className={styles.clientCrmInput} value={form.title} onChange={(e) => setField("title", e.target.value)} />
            </Field>
          </div>
          <div className={styles.clientCrmCol}>
            <Field label="Company" required hint="Registered or trade name of the prospect">
              <input className={inputClass(true)} value={form.company} onChange={(e) => setField("company", e.target.value)} />
            </Field>
            <Field label="Last Name" required>
              <input className={inputClass(true)} value={form.last_name} onChange={(e) => setField("last_name", e.target.value)} />
            </Field>
            <Field label="Email">
              <input
                type="email"
                className={styles.clientCrmInput}
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </Field>
            <Field label="Mobile">
              <input className={styles.clientCrmInput} value={form.mobile} onChange={(e) => setField("mobile", e.target.value)} />
            </Field>
          </div>
        </div>
      </section>

      <section className={styles.clientCrmSection}>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <Field label="Interested In">
              <select
                className={styles.clientCrmInput}
                value={form.interested_in}
                onChange={(e) => setField("interested_in", e.target.value)}
              >
                <option value="">-None-</option>
                {LEAD_INTERESTED_IN_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Please Specify">
              <textarea
                className={`${styles.clientCrmInput} ${styles.clientCrmTextarea}`}
                value={form.interested_specify}
                onChange={(e) => setField("interested_specify", e.target.value)}
              />
            </Field>
          </div>
          <div className={styles.clientCrmCol}>
            <Field label="Website">
              <input className={styles.clientCrmInput} value={form.website} onChange={(e) => setField("website", e.target.value)} />
            </Field>
          </div>
        </div>
      </section>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Address Information</h4>
        <p className={styles.panelSubtitle}>
          Use region, province, city, barangay, and ZIP suggestions—the same as Create Client.
        </p>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <AddressSuggestField
              label="Country"
              value={form.address_country}
              options={countryOptions}
              autoComplete="country-name"
              onChange={(value) => setField("address_country", value)}
            />
            <AddressSuggestField
              label="Region"
              value={addressRegion}
              options={regionOptions}
              placeholder="Start typing a region"
              onChange={(value) => {
                const keep =
                  Boolean(form.address_province) && regionForProvince(form.address_province) === value;
                if (!keep) setLeadBarangay("");
                setAddressRegion(value);
                if (!keep) {
                  setForm((current) => ({
                    ...current,
                    address_province: "",
                    address_city: "",
                    address_street: "",
                  }));
                }
              }}
            />
            <AddressSuggestField
              label="Province"
              value={form.address_province}
              options={provinceOptions}
              autoComplete="address-level1"
              placeholder="Start typing a province"
              onChange={(value) => {
                const region = regionForProvince(value);
                if (region) setAddressRegion(region);
                setForm((current) => ({
                  ...current,
                  address_province: value,
                }));
              }}
            />
            <AddressSuggestField
              label="Barangay"
              value={leadBarangay}
              options={streetOptions}
              placeholder="Choose a barangay"
              maxVisible={400}
              onChange={setLeadBarangay}
              onSelect={(_value, option) => {
                setLeadBarangay(option.street || option.value);
                applyPlace(
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
                onChange={(e) => setField("address_street", e.target.value)}
              />
            </Field>
          </div>
          <div className={styles.clientCrmCol}>
            <AddressSuggestField
              label="City"
              value={form.address_city}
              options={cityOptions}
              autoComplete="address-level2"
              placeholder="Start typing a city"
              maxVisible={400}
              onChange={(value) => {
                setLeadBarangay("");
                setField("address_city", value);
              }}
              onSelect={(value) => {
                setLeadBarangay("");
                applyPlace(findPlaceByCity(value, form.address_province));
              }}
            />
            <AddressSuggestField
              label="Zip Code"
              value={form.address_zip}
              options={zipOptions}
              autoComplete="postal-code"
              placeholder="Enter ZIP code"
              filterMode="code"
              onChange={(value) => setField("address_zip", value)}
              onSelect={(value, option) =>
                applyPlace(
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
        </div>
      </section>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Description Information</h4>
        <div className={styles.clientCrmGrid}>
          <div className={styles.clientCrmCol}>
            <Field label="Description">
              <textarea
                className={`${styles.clientCrmInput} ${styles.clientCrmTextarea}`}
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
              />
            </Field>
          </div>
          <div className={styles.clientCrmCol}>
            <Field label="Remarks">
              <textarea
                className={`${styles.clientCrmInput} ${styles.clientCrmTextarea}`}
                value={form.remarks}
                onChange={(e) => setField("remarks", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </section>
    </div>
  );
}
