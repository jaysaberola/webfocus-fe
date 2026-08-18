import { useEffect, useMemo, useRef, useState } from "react";
import {
  customerDisplayName,
  PORTAL_ACCOUNT_DEFAULTS,
} from "@/lib/customerPortal/mockData";
import type { PortalProfileApproval } from "@/lib/customerPortal/types";
import { resolveAvatarUrl } from "@/lib/currentUser";
import {
  fetchPendingProfileChangeRequest,
  submitPortalProfileChange,
} from "@/services/customerPortalService";
import {
  fetchCurrentCustomer,
  type PublicCustomer,
} from "@/services/publicCustomerService";
import { toast } from "@/lib/toast";
import AddressSuggestField from "@/components/CommerceAdmin/AddressSuggestField";
import {
  PH_ADDRESS_PLACES,
  PH_COUNTRIES,
  PH_PROVINCES,
  citiesForProvince,
  findPlaceByCity,
  findPlaceByStreet,
  findPlaceByZip,
  streetsForPlace,
} from "@/lib/commerceAdmin/phAddressCatalog";
import styles from "@/styles/customerPortal.module.css";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address_country: string;
  address_province: string;
  address_city: string;
  address_street: string;
  address_zip: string;
};

function splitRepresentativeName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { fname: "Customer", lname: "User" };
  if (parts.length === 1) return { fname: parts[0], lname: "User" };
  return { fname: parts[0], lname: parts.slice(1).join(" ") };
}

function mapPendingApproval(data: any): PortalProfileApproval {
  return {
    reference: data.reference,
    submittedAt: data.submittedAt,
    status: data.status === "Pending Review" ? "Pending Admin Review" : data.status,
    summary: data.summary,
  };
}

type Props = {
  customer: PublicCustomer | null;
  onCustomerUpdate?: (customer: PublicCustomer) => void;
};

export default function AccountProfileSection({ customer, onCustomerUpdate }: Props) {
  const defaults = PORTAL_ACCOUNT_DEFAULTS;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: defaults.phone,
    company: defaults.company,
    address_country: "Philippines",
    address_province: "",
    address_city: "",
    address_street: "",
    address_zip: "",
  });
  const [baseline, setBaseline] = useState<ProfileForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PortalProfileApproval | null>(null);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  useEffect(() => {
    if (!customer) return;
    const nextForm: ProfileForm = {
      name: customerDisplayName(customer.fname, customer.lname),
      email: customer.email || "",
      phone: customer.mobile || defaults.phone,
      company: customer.mname || defaults.company,
      address_country: customer.address_country || "Philippines",
      address_province: customer.address_province || "",
      address_city: customer.address_city || "",
      address_street: customer.address_street || "",
      address_zip: customer.address_zip || "",
    };
    setForm(nextForm);
    setBaseline(nextForm);
    setPendingAvatarFile(null);
    setAvatarPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
  }, [customer]);

  useEffect(() => {
    if (!customer) return;
    fetchCurrentCustomer({ silent: true, force: true })
      .then((fresh) => onCustomerUpdate?.(fresh))
      .catch(() => {});
  }, [customer?.id, onCustomerUpdate]);

  useEffect(() => {
    if (!customer) return;
    fetchPendingProfileChangeRequest()
      .then((data) => {
        setPendingApproval(data ? mapPendingApproval(data) : null);
        setPendingAvatarUrl(data?.pendingAvatarUrl ?? null);
      })
      .catch(() => {
        setPendingApproval(null);
        setPendingAvatarUrl(null);
      });
  }, [customer]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [customer?.avatar, pendingAvatarUrl, avatarPreview]);

  const displayName = form.name || customerDisplayName(customer?.fname, customer?.lname);
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "C").toUpperCase();
  }, [displayName]);

  const applyPlace = (
    place: { street?: string; city: string; province: string; zip: string; country: string } | null,
    includeStreet = false,
  ) => {
    if (!place) return;
    setForm((current) => ({
      ...current,
      ...(includeStreet && place.street ? { address_street: place.street } : {}),
      address_city: place.city,
      address_province: place.province,
      address_zip: place.zip,
      address_country: place.country || "Philippines",
    }));
  };

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
        label: `${place.street} — ${place.city}, ${place.province} (${place.zip})`,
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
      .map((place) => ({
        value: place.city,
        label: `${place.city} — ${place.province} (${place.zip})`,
      }));
  }, [form.address_province]);

  const provinceOptions = useMemo(
    () => PH_PROVINCES.map((province) => ({ value: province, label: province })),
    [],
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

  const avatarUrl = avatarPreview || pendingAvatarUrl || resolveAvatarUrl(customer?.avatar);
  const showAvatarImage = Boolean(avatarUrl && !avatarLoadFailed);

  const hasFormChanges =
    baseline &&
    (form.name !== baseline.name ||
      form.phone !== baseline.phone ||
      form.company !== baseline.company ||
      form.address_country !== baseline.address_country ||
      form.address_province !== baseline.address_province ||
      form.address_city !== baseline.address_city ||
      form.address_street !== baseline.address_street ||
      form.address_zip !== baseline.address_zip);

  const hasChanges = Boolean(hasFormChanges || pendingAvatarFile);

  const buildSubmissionSummary = () => {
    const parts: string[] = [];
    if (pendingAvatarFile) parts.push("profile photo");
    if (hasFormChanges) parts.push("profile details");
    if (!parts.length) return `Update profile for ${form.email}`;
    return `Update ${parts.join(" and ")} for ${form.email}`;
  };

  const submitForApproval = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer || !hasChanges) return;

    const { fname, lname } = splitRepresentativeName(form.name);

    try {
      setSubmitting(true);
      const data = await submitPortalProfileChange({
        fname,
        lname,
        mobile: form.phone,
        mname: form.company,
        address_country: form.address_country,
        address_province: form.address_province,
        address_city: form.address_city,
        address_street: form.address_street,
        address_zip: form.address_zip,
        summary: buildSubmissionSummary(),
        avatar: pendingAvatarFile ?? undefined,
      });
      setPendingApproval(mapPendingApproval(data));
      setPendingAvatarUrl(data?.pendingAvatarUrl ?? avatarPreview);
      setPendingAvatarFile(null);
      setAvatarPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      const freshCustomer = await fetchCurrentCustomer({ silent: true, force: true }).catch(() => null);
      if (freshCustomer) onCustomerUpdate?.(freshCustomer);
      toast.success("Profile changes sent for admin approval.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit profile changes for approval.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !customer) return;

    if (pendingApproval) {
      toast.error("You already have a profile change request awaiting admin review.");
      return;
    }

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image.");
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error("Profile image must be 1 MB or smaller.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return previewUrl;
    });
    setPendingAvatarFile(file);
  };

  return (
    <section className={`${styles.panel} ${styles.accountSection}`}>
      <div className={styles.accountSectionHead}>
        <div>
          <h2 className={styles.panelTitle}>Profile Information</h2>
          <p className={styles.panelSub}>
            Updates are reviewed by WebFocus admin before they apply to billing and service records.
          </p>
        </div>
        {pendingApproval && (
          <span className={styles.approvalBadge}>{pendingApproval.status}</span>
        )}
      </div>

      {pendingApproval && (
        <div className={styles.approvalNotice}>
          <strong>Approval request {pendingApproval.reference}</strong>
          <p>
            Submitted {pendingApproval.submittedAt}. {pendingApproval.summary} You will be notified once
            an administrator approves the changes.
          </p>
        </div>
      )}

      <div className={styles.profilePhotoRow}>
        <div className={styles.profilePhotoPreview} aria-hidden="true">
          {showAvatarImage ? (
            <img
              src={avatarUrl}
              alt=""
              onError={() => setAvatarLoadFailed(true)}
            />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className={styles.profilePhotoMeta}>
          <p className={styles.profilePhotoTitle}>Profile Photo</p>
          <p className={styles.profilePhotoHint}>
            JPG or PNG, up to 1 MB. Select a photo, then click Send for Approval.
          </p>
          {pendingAvatarFile ? (
            <p className={styles.profilePhotoHint}>New photo selected and ready to submit.</p>
          ) : null}
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className={styles.profilePhotoInput}
            onChange={handleAvatarChange}
            disabled={Boolean(pendingApproval)}
          />
          <button
            type="button"
            className={styles.profilePhotoBtn}
            disabled={!customer || Boolean(pendingApproval)}
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarUrl ? "Change Photo" : "Upload Photo"}
          </button>
        </div>
      </div>

      <form className={styles.accountForm} onSubmit={submitForApproval}>
        <label>
          <span>Authorized Representative Name</span>
          <input
            className={styles.cpControl}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          <span>Business Email Address</span>
          <input className={styles.cpControl} type="email" value={form.email} disabled />
        </label>
        <label>
          <span>Mobile Phone (+63)</span>
          <input
            className={styles.cpControl}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </label>
        <label>
          <span>Company Legal Name</span>
          <input
            className={styles.cpControl}
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
          />
        </label>
        <div className={`${styles.fullWidth} ${styles.accountAddressBlock}`}>
          <div className={styles.accountAddressHead}>
            <span>Billing Address</span>
            <p>
              Use Philippine street/barangay, city, province, and ZIP suggestions. Same fields as
              the admin client Address Information.
            </p>
          </div>
          <div className={styles.accountAddressGrid}>
            <AddressSuggestField
              label="Country"
              value={form.address_country}
              options={countryOptions}
              autoComplete="country-name"
              className={styles.accountAddressField}
              inputClassName={styles.cpControl}
              onChange={(value) => setForm((current) => ({ ...current, address_country: value }))}
            />
            <AddressSuggestField
              label="Province"
              value={form.address_province}
              options={provinceOptions}
              autoComplete="address-level1"
              placeholder="Start typing a province"
              className={styles.accountAddressField}
              inputClassName={styles.cpControl}
              onChange={(value) => setForm((current) => ({ ...current, address_province: value }))}
            />
            <AddressSuggestField
              label="City"
              value={form.address_city}
              options={cityOptions}
              autoComplete="address-level2"
              placeholder="Start typing a city"
              maxVisible={400}
              className={styles.accountAddressField}
              inputClassName={styles.cpControl}
              onChange={(value) => setForm((current) => ({ ...current, address_city: value }))}
              onSelect={(value) => applyPlace(findPlaceByCity(value, form.address_province))}
            />
            <AddressSuggestField
              label="Street"
              value={form.address_street}
              options={streetOptions}
              autoComplete="street-address"
              placeholder="Start typing a street or barangay"
              maxVisible={400}
              className={styles.accountAddressField}
              inputClassName={styles.cpControl}
              onChange={(value) => setForm((current) => ({ ...current, address_street: value }))}
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
                    : findPlaceByStreet(option.value, form.address_city, form.address_province),
                  true,
                )
              }
            />
            <AddressSuggestField
              label="Code"
              value={form.address_zip}
              options={zipOptions}
              autoComplete="postal-code"
              placeholder="ZIP / postal code"
              className={styles.accountAddressField}
              inputClassName={styles.cpControl}
              onChange={(value) => setForm((current) => ({ ...current, address_zip: value }))}
              onSelect={(value) => applyPlace(findPlaceByZip(value))}
            />
          </div>
        </div>

        <div className={styles.accountActions}>
          <p className={styles.accountHint}>
            Profile edits and photo changes require admin approval. Click Send for Approval after making changes.
            Password and security settings update immediately.
          </p>
          <button
            type="submit"
            className={styles.primaryBtnSm}
            disabled={submitting || !hasChanges || Boolean(pendingApproval)}
          >
            {submitting ? "Submitting..." : "Send for Approval"}
          </button>
        </div>
      </form>
    </section>
  );
}
