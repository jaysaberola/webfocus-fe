import { useEffect, useState } from "react";
import ClientMultiSelectDropdown from "@/components/CommerceAdmin/modals/ClientMultiSelectDropdown";
import { fetchAllCatalogAddons, fetchAllCatalogServices } from "@/lib/commerceAdmin/clientCatalogHelpers";
import {
  emptyClientAccountForm,
  validateClientAccountForm,
  type ClientAccountFormState,
} from "@/lib/commerceAdmin/clientFormHelpers";
import { createCustomerAccount } from "@/services/customerService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
};

export default function CreateClientModal({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState<ClientAccountFormState>(emptyClientAccountForm);
  const [serviceOptions, setServiceOptions] = useState<string[]>([]);
  const [addonOptions, setAddonOptions] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyClientAccountForm);
    setLoadingServices(true);
    setLoadingAddons(true);

    fetchAllCatalogServices()
      .then((names) => setServiceOptions(names))
      .catch(() => setServiceOptions([]))
      .finally(() => setLoadingServices(false));

    fetchAllCatalogAddons()
      .then((names) => setAddonOptions(names))
      .catch(() => setAddonOptions([]))
      .finally(() => setLoadingAddons(false));
  }, [open]);

  const handleClose = () => {
    setForm(emptyClientAccountForm);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const validationError = validateClientAccountForm(form, "create");
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSubmitting(true);
    try {
      await createCustomerAccount({
        fname: form.fname.trim(),
        lname: form.lname.trim(),
        company: form.company.trim(),
        email: form.email.trim(),
        address_street: form.address.trim(),
        mobile: form.mobile.trim(),
        phone: form.phone.trim() || undefined,
        avatar: form.avatar,
        services: form.services,
        addons: form.addons,
      });
      toast.success(`Client ${form.fname.trim()} ${form.lname.trim()} (${form.company.trim()}) added successfully!`);
      handleClose();
      onCreated();
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        Object.values(err?.response?.data?.errors ?? {})?.[0]?.[0] ||
        "Failed to create client.";
      toast.error(String(message));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCardWide}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Add New Client Account</h3>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={handleClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <div className={styles.modalGrid2}>
            <label className={styles.modalLabel}>
              Customer First Name *
              <input
                className={styles.modalInput}
                value={form.fname}
                onChange={(e) => setForm((current) => ({ ...current, fname: e.target.value }))}
                placeholder="e.g. Juan"
                required
              />
            </label>
            <label className={styles.modalLabel}>
              Last Name *
              <input
                className={styles.modalInput}
                value={form.lname}
                onChange={(e) => setForm((current) => ({ ...current, lname: e.target.value }))}
                placeholder="e.g. dela Cruz"
                required
              />
            </label>
          </div>

          <label className={styles.modalLabel}>
            Company Name / Organization *
            <input
              className={styles.modalInput}
              value={form.company}
              onChange={(e) => setForm((current) => ({ ...current, company: e.target.value }))}
              placeholder="e.g. Apex Global Corp"
              required
            />
          </label>

          <label className={styles.modalLabel}>
            Business Email *
            <input
              className={styles.modalInput}
              type="email"
              value={form.email}
              onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
              placeholder="contact@apexglobal.ph"
              required
            />
          </label>

          <label className={styles.modalLabel}>
            Business Address *
            <input
              className={styles.modalInput}
              value={form.address}
              onChange={(e) => setForm((current) => ({ ...current, address: e.target.value }))}
              placeholder="BGC Taguig, Metro Manila"
              required
            />
          </label>

          <div className={styles.modalGrid2}>
            <label className={styles.modalLabel}>
              Mobile Number (9 digits) *
              <div className={styles.phoneInputWrap}>
                <span className={styles.phonePrefix}>+63</span>
                <input
                  className={styles.phoneInput}
                  value={form.mobile}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      mobile: e.target.value.replace(/\D/g, "").slice(0, 9),
                    }))
                  }
                  placeholder="917123456"
                  inputMode="numeric"
                  maxLength={9}
                  required
                />
              </div>
            </label>
            <label className={styles.modalLabel}>
              Phone Number (Optional)
              <input
                className={styles.modalInput}
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                placeholder="e.g. 81234567"
              />
            </label>
          </div>

          <label className={styles.modalLabel}>
            Profile Picture (Optional)
            <input
              className={styles.modalFileInput}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  avatar: e.target.files?.[0] ?? null,
                }))
              }
            />
          </label>

          <ClientMultiSelectDropdown
            label="Active Services & Products (Multiple Selection)"
            required
            placeholder="Select Services & Products..."
            options={serviceOptions}
            selected={form.services}
            loading={loadingServices}
            onChange={(services) => setForm((current) => ({ ...current, services }))}
          />

          <ClientMultiSelectDropdown
            label="Add-on Services (Multiple Selection)"
            placeholder="Select Add-on Services (Optional)..."
            options={addonOptions}
            selected={form.addons}
            loading={loadingAddons}
            onChange={(addons) => setForm((current) => ({ ...current, addons }))}
          />

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtnSm} onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryBtnSm}
              disabled={submitting || loadingServices || loadingAddons}
            >
              {submitting ? "Creating..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
