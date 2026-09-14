import { FormEvent, useEffect, useMemo, useState } from "react";
import AddressSuggestField from "@/components/CommerceAdmin/AddressSuggestField";
import {
  billingAddressFromCustomer,
  CHECKOUT_BILLING_FIELD_LABELS,
  CHECKOUT_BILLING_MAX,
  isCheckoutBillingAddressComplete,
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
    zipsForPlace,
} from "@/lib/commerceAdmin/phAddressCatalog";
import {
  isPlaceholderLastName,
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

export default function CheckoutBillingAddressModal({
  open,
  customer,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState<CheckoutBillingAddress>(billingAddressFromCustomer(customer));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(billingAddressFromCustomer(customer));
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
      address_zip: place.zip,
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
        label: `${place.street} — ${place.city}, ${place.province}`,
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
        label: `${place.city} — ${place.province}`,
        city: place.city,
        province: place.province,
        zip: place.zip,
      }));
  }, [form.address_province]);

  const zipOptions = useMemo(() => {
    const seen = new Set<string>();
    return zipsForPlace(form.address_city, form.address_province)
      .filter((place) => {
        if (!place.zip || seen.has(place.zip)) return false;
        seen.add(place.zip);
        return true;
      })
      .map((place) => ({
        value: place.zip,
        label: `${place.zip} — ${place.city}, ${place.province}`,
        city: place.city,
        province: place.province,
        zip: place.zip,
      }));
  }, [form.address_city, form.address_province]);

  const provinceOptions = useMemo(() => {
    const current = form.address_province.trim();
    const values = current && !PH_PROVINCES.includes(current)
      ? [current, ...PH_PROVINCES]
      : PH_PROVINCES;
    return values.map((province) => ({ value: province, label: province }));
  }, [form.address_province]);

  const canSubmit = useMemo(
    () => isCheckoutBillingAddressComplete(form) && !saving && Boolean(customer),
    [form, saving, customer]
  );

  if (!open) return null;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!customer || !canSubmit) return;

    const trimmed: CheckoutBillingAddress = {
      address_street: form.address_street.trim(),
      address_city: form.address_city.trim(),
      address_province: form.address_province.trim(),
      address_zip: form.address_zip.trim(),
    };

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
      const updated = await updateCustomerProfile({
        fname: customer.fname || "",
        lname: isPlaceholderLastName(customer.lname) ? "" : customer.lname || "",
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

  return (
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
              Choose a street, city, province, and ZIP from the Philippine list. Opening a filled
              field still shows the matching options.
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
          <AddressSuggestField
            label="Street address *"
            value={form.address_street}
            options={streetOptions}
            placeholder="Choose a street or barangay"
            name="checkout-street"
            preventBrowserFill
            required
            maxVisible={400}
            className={styles.field}
            inputClassName={styles.input}
            onChange={(value) => setForm((current) => ({ ...current, address_street: value }))}
            onSelect={(_value, option) =>
              applyPlace(
                option.city
                  ? {
                      street: option.street || option.value,
                      city: option.city,
                      province: option.province || "",
                      zip: option.zip || "",
                    }
                  : findPlaceByStreet(option.value, form.address_city, form.address_province),
                true,
              )
            }
          />

          <div className={styles.row}>
            <AddressSuggestField
              label="City *"
              value={form.address_city}
              options={cityOptions}
              placeholder="Choose a city"
              name="checkout-city"
              preventBrowserFill
              required
              maxVisible={400}
              className={styles.field}
              inputClassName={styles.input}
              onChange={(value) => setForm((current) => ({ ...current, address_city: value }))}
              onSelect={(value, option) =>
                applyPlace(
                  option.city
                    ? {
                        city: option.city,
                        province: option.province || form.address_province,
                        zip: option.zip || form.address_zip,
                      }
                    : findPlaceByCity(value, form.address_province),
                )
              }
            />
            <AddressSuggestField
              label="Province *"
              value={form.address_province}
              options={provinceOptions}
              placeholder="Choose a province"
              name="checkout-province"
              preventBrowserFill
              required
              className={styles.field}
              inputClassName={styles.input}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  address_province: value,
                }))
              }
            />
          </div>

          <AddressSuggestField
            label="ZIP / Postal code *"
            value={form.address_zip}
            options={zipOptions}
            placeholder={form.address_city ? `ZIP codes for ${form.address_city}` : "Choose a ZIP"}
            name="checkout-zip"
            preventBrowserFill
            required
            className={styles.field}
            inputClassName={styles.input}
            onChange={(value) => setForm((current) => ({ ...current, address_zip: value }))}
            onSelect={(value, option) =>
              applyPlace(
                option.city
                  ? {
                      city: option.city,
                      province: option.province || form.address_province,
                      zip: option.zip || value,
                    }
                  : findPlaceByZip(value),
              )
            }
          />

          <p className={styles.helperHint}>
            Click a filled field to see its list. Choosing a city fills province and ZIP
            automatically.
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
    </div>
  );
}
