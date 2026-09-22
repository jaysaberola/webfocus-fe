import { FormEvent, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import AddressSuggestField from "@/components/CommerceAdmin/AddressSuggestField";
import {
  billingAddressFromCustomer,
  CHECKOUT_BILLING_FIELD_LABELS,
  CHECKOUT_BILLING_MAX,
  isCheckoutBillingAddressComplete,
  paynamicsPersonName,
  type CheckoutBillingAddress,
} from "@/lib/checkoutBillingAddress";
import {
    citiesForProvince,
    findPlaceByCity,
    findPlaceByStreet,
    findPlaceByZip,
    PH_PROVINCES,
    regionForProvince,
    streetsForPlace,
    zipSuggestOptions,
} from "@/lib/commerceAdmin/phAddressCatalog";
import {
  updateCustomerProfile,
  type PublicCustomer,
} from "@/services/publicCustomerService";
import { toast } from "@/lib/toast";
import styles from "@/styles/checkoutBillingAddressModal.module.css";

type Props = {
  open: boolean;
  customer: PublicCustomer | null;
  onClose: () => void;
  onSaved: (customer: PublicCustomer) => void;
};

function matchedBarangay(street: string, city: string, province: string) {
  const needle = street.trim().toLowerCase();
  if (!needle) return "";
  const list = streetsForPlace(city, province);
  const exact = list.find((place) => place.street?.toLowerCase() === needle);
  if (exact?.street) return exact.street;
  const contained = list
    .filter((place) => place.street && needle.includes(place.street.toLowerCase()))
    .sort((a, b) => (b.street?.length || 0) - (a.street?.length || 0))[0];
  return contained?.street || "";
}

function composeStreetLine(street: string, barangay: string, max = 100) {
  const line = street.trim();
  const place = barangay.trim();
  if (!place) return line.slice(0, max);
  if (!line) return place.slice(0, max);
  if (line.toLowerCase().includes(place.toLowerCase())) return line.slice(0, max);
  return `${line}, ${place}`.slice(0, max);
}

function streetWithoutBarangay(street: string, barangay: string) {
  const place = barangay.trim();
  if (!place) return street.trim();
  if (street.trim().toLowerCase() === place.toLowerCase()) return "";
  return street
    .replace(new RegExp(`,\\s*${place.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "i"), "")
    .trim();
}

export default function CheckoutBillingAddressModal({
  open,
  customer,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<CheckoutBillingAddress>(billingAddressFromCustomer(customer));
  const [barangay, setBarangay] = useState("");
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const next = billingAddressFromCustomer(customer);
    const barangayName = matchedBarangay(next.address_street, next.address_city, next.address_province);
    setBarangay(barangayName);
    setForm({
      ...next,
      address_street: streetWithoutBarangay(next.address_street, barangayName),
    });
  }, [open, customer]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, saving]);

  const applyPlace = (
    place: { street?: string; city: string; province: string; zip: string } | null,
    includeStreet = false,
  ) => {
    if (!place) return;
    setForm((current) => ({
      ...current,
      ...(includeStreet && place.street ? { address_street: place.street } : {}),
      address_city: place.city,
      address_province: place.province,
      address_zip: place.zip || current.address_zip,
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
        label: place.street || "",
        street: place.street,
        city: place.city,
        province: place.province,
        zip: place.zip,
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
        label: place.city,
        city: place.city,
        province: place.province,
        zip: place.zip,
      }));
  }, [form.address_province]);

  const zipOptions = useMemo(
    () => zipSuggestOptions(form.address_city, form.address_province, barangay),
    [form.address_city, form.address_province, barangay],
  );

  const provinceOptions = useMemo(() => {
    const current = form.address_province.trim();
    const values = current && !PH_PROVINCES.includes(current)
      ? [current, ...PH_PROVINCES]
      : PH_PROVINCES;
    return values.map((province) => ({ value: province, label: province }));
  }, [form.address_province]);

  const canSubmit = useMemo(
    () =>
      isCheckoutBillingAddressComplete(form) &&
      Boolean(barangay.trim()) &&
      !saving &&
      Boolean(customer),
    [form, barangay, saving, customer]
  );

  if (!open || !mounted) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!customer || !canSubmit) return;

    const trimmed: CheckoutBillingAddress = {
      address_street: composeStreetLine(form.address_street, barangay),
      address_city: form.address_city.trim(),
      address_province: form.address_province.trim(),
      address_zip: form.address_zip.trim(),
    };

    if (!barangay.trim()) {
      toast.error("Barangay is required for checkout.");
      return;
    }

    for (const key of Object.keys(trimmed) as Array<keyof CheckoutBillingAddress>) {
      if (!trimmed[key]) {
        toast.error(`${CHECKOUT_BILLING_FIELD_LABELS[key]} is required for checkout.`);
        return;
      }
      if (trimmed[key].length > CHECKOUT_BILLING_MAX[key]) {
        toast.error(
          `${CHECKOUT_BILLING_FIELD_LABELS[key]} must be ${CHECKOUT_BILLING_MAX[key]} characters or fewer.`
        );
        return;
      }
    }

    try {
      setSaving(true);
      const person = paynamicsPersonName(customer);
      const updated = await updateCustomerProfile({
        fname: person.fname,
        lname: person.lname,
        mobile: customer.mobile,
        birth_date: customer.birth_date,
        address_street: trimmed.address_street,
        address_city: trimmed.address_city,
        address_municipality: customer.address_municipality || trimmed.address_city,
        address_province: trimmed.address_province,
        address_zip: trimmed.address_zip,
      });
      toast.success("Billing address saved. Continuing to payment...");
      onSaved({
        ...updated,
        address_region: regionForProvince(trimmed.address_province) || updated.address_region,
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || "Failed to save billing address. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className={styles.overlay} role="presentation" onClick={() => !saving && onClose()}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-billing-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Paynamics Checkout</p>
            <h2 id="checkout-billing-title">Complete billing address</h2>
            <p className={styles.subtitle}>
              Choose a province, city, barangay, street, and ZIP from the Philippine list. Opening a
              filled field still shows the matching options.
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            aria-label="Close"
            disabled={saving}
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </header>

        <form className={styles.form} onSubmit={handleSubmit} autoComplete="off" noValidate>
          <div className={styles.row}>
            <AddressSuggestField
              label={
                <>
                  Province <span className={styles.requiredMark}>*</span>
                </>
              }
              value={form.address_province}
              options={provinceOptions}
              placeholder="Choose a province"
              name="checkout-province"
              preventBrowserFill
              required
              className={styles.field}
              inputClassName={styles.input}
              wrapClassName={styles.suggestWrap}
              onChange={(value) => {
                setBarangay("");
                setForm((current) => ({
                  ...current,
                  address_province: value,
                }));
              }}
            />
            <AddressSuggestField
              label={
                <>
                  City <span className={styles.requiredMark}>*</span>
                </>
              }
              value={form.address_city}
              options={cityOptions}
              placeholder="Choose a city"
              name="checkout-city"
              preventBrowserFill
              required
              maxVisible={400}
              className={styles.field}
              inputClassName={styles.input}
              wrapClassName={styles.suggestWrap}
              onChange={(value) => {
                setBarangay("");
                setForm((current) => ({ ...current, address_city: value }));
              }}
              onSelect={(value, option) => {
                setBarangay("");
                applyPlace(
                  option.city
                    ? {
                        city: option.city,
                        province: option.province || form.address_province,
                        zip: option.zip || form.address_zip,
                      }
                    : findPlaceByCity(value, form.address_province),
                );
              }}
            />
          </div>

          <div className={styles.row}>
            <AddressSuggestField
              label={
                <>
                  Barangay <span className={styles.requiredMark}>*</span>
                </>
              }
              value={barangay}
              options={streetOptions}
              placeholder="Choose a barangay"
              name="checkout-barangay"
              preventBrowserFill
              required
              maxVisible={400}
              className={styles.field}
              inputClassName={styles.input}
              wrapClassName={styles.suggestWrap}
              onChange={setBarangay}
              onSelect={(_value, option) => {
                setBarangay(option.street || option.value);
                applyPlace(
                  option.city
                    ? {
                        street: option.street || option.value,
                        city: option.city,
                        province: option.province || "",
                        zip: option.zip || "",
                      }
                    : findPlaceByStreet(option.value, form.address_city, form.address_province),
                  false,
                );
              }}
            />
            <label className={styles.field}>
              <span>
                Street address <span className={styles.requiredMark}>*</span>
              </span>
              <input
                className={styles.textbox}
                name="checkout-street"
                value={form.address_street}
                autoComplete="off"
                required
                placeholder="House no., building, street"
                onChange={(event) =>
                  setForm((current) => ({ ...current, address_street: event.target.value }))
                }
              />
            </label>
          </div>

          <div className={styles.row}>
            <AddressSuggestField
              label={
                <>
                  ZIP Code <span className={styles.requiredMark}>*</span>
                </>
              }
              value={form.address_zip}
              options={zipOptions}
              placeholder="Enter ZIP code"
              name="checkout-zip"
              preventBrowserFill
              required
              filterMode="code"
              className={styles.field}
              inputClassName={styles.input}
              wrapClassName={styles.suggestWrap}
              onChange={(value) => setForm((current) => ({ ...current, address_zip: value }))}
              onSelect={(value, option) =>
                applyPlace(
                  option.city
                    ? {
                        city: option.city,
                        province: option.province || form.address_province,
                        zip: option.zip || value,
                      }
                    : findPlaceByZip(value, form.address_city, form.address_province),
                )
              }
            />
          </div>

          <p className={styles.helperHint}>
            Choose province, then city, then barangay so ZIP can fill automatically. Type the house
            or street line last.
          </p>

          <div className={styles.actions}>
            <button type="button" className={styles.secondaryBtn} disabled={saving} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtn} disabled={!canSubmit}>
              {saving ? "Saving..." : "Save & Continue to Paynamics"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
