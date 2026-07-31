import { useEffect, useState } from "react";
import { updateService } from "@/services/serviceService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  service: any | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function EditManageServiceModal({ open, service, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState("active");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !service) return;
    setName(String(service.name ?? service.title ?? ""));
    setPrice(String(service.price ?? ""));
    setStatus(String(service.status ?? "active").toLowerCase() === "inactive" ? "inactive" : "active");
    setNote(String(service.description ?? service.notes ?? ""));
  }, [open, service]);

  if (!open || !service) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const id = service.id ?? service.service_id;
    if (!name.trim()) {
      toast.error("Service name is required.");
      return;
    }

    setSubmitting(true);
    try {
      await updateService(id, {
        name: name.trim(),
        price: Number(price || 0),
        description: note.trim(),
        status,
        is_active: status === "active" ? 1 : 0,
      });
      toast.success("Service updated successfully.");
      onClose();
      onSaved();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update service.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Edit Manage Service</h3>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <label className={styles.modalLabel}>
            Service / Plan Name
            <input className={styles.modalInput} value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className={styles.modalLabel}>
            Base Price (₱)
            <input
              className={styles.modalInput}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>
          <label className={styles.modalLabel}>
            Status
            <select className={styles.select} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Disabled</option>
            </select>
          </label>
          <label className={styles.modalLabel}>
            Notes / Description
            <textarea
              className={styles.modalTextarea}
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtnSm} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
