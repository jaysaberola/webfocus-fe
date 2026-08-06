import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  billingAddressFromCustomer,
  CHECKOUT_BILLING_FIELD_LABELS,
  CHECKOUT_BILLING_MAX,
  isCheckoutBillingAddressComplete,
  type CheckoutBillingAddress,
} from "@/lib/checkoutBillingAddress";
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

  const canSubmit = useMemo(
    () => isCheckoutBillingAddressComplete(form) && !saving && Boolean(customer),
    [form, saving, customer]
  );

  if (!open) return null;

  const updateField = (key: keyof CheckoutBillingAddress, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

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
        fname: customer.fname || "Customer",
        lname: customer.lname || "User",
        mobile: customer.mobile,
        birth_date: customer.birth_date,
        address_street: trimmed.address_street,
        address_city: trimmed.address_city,
        address_municipality: customer.address_municipality || trimmed.address_city,
        address_province: trimmed.address_province,
        address_zip: trimmed.address_zip,
      });
      toast.success("Billing address saved. Continuing to payment...");
      onSaved(updated);
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
              First-time payments require your street, city, province, and ZIP before opening
              the Paynamics portal.
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

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field}>
            <span>
              Street address <span className={styles.requiredMark} aria-hidden="true">*</span>
            </span>
            <input
              className={styles.input}
              value={form.address_street}
              maxLength={CHECKOUT_BILLING_MAX.address_street}
              onChange={(e) => updateField("address_street", e.target.value)}
              placeholder="e.g. 26th St, BGC"
              autoFocus
              required
              aria-required="true"
            />
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>
                City <span className={styles.requiredMark} aria-hidden="true">*</span>
              </span>
              <input
                className={styles.input}
                value={form.address_city}
                maxLength={CHECKOUT_BILLING_MAX.address_city}
                onChange={(e) => updateField("address_city", e.target.value)}
                placeholder="e.g. Taguig City"
                required
                aria-required="true"
              />
            </label>
            <label className={styles.field}>
              <span>
                Province / Region <span className={styles.requiredMark} aria-hidden="true">*</span>
              </span>
              <input
                className={styles.input}
                value={form.address_province}
                maxLength={CHECKOUT_BILLING_MAX.address_province}
                onChange={(e) => updateField("address_province", e.target.value)}
                placeholder="e.g. Metro Manila"
                required
                aria-required="true"
              />
            </label>
          </div>

          <label className={styles.field}>
            <span>
              ZIP / Postal code <span className={styles.requiredMark} aria-hidden="true">*</span>
            </span>
            <input
              className={styles.input}
              value={form.address_zip}
              maxLength={CHECKOUT_BILLING_MAX.address_zip}
              onChange={(e) => updateField("address_zip", e.target.value)}
              placeholder="e.g. 1634"
              required
              aria-required="true"
            />
          </label>

          <p className={styles.helperHint}>
            Fill in all required fields (*) to enable Save &amp; Continue.
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
