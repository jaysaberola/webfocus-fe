import { useEffect, useState } from "react";
import { updateService } from "@/services/serviceService";
import { toast } from "@/lib/toast";

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
    <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,0.35)" }}>
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Edit Manage Service</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose} />
            </div>

            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Service / Plan Name</label>
                  <input
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Base Price (₱)</label>
                  <input
                    className="form-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Disabled</option>
                  </select>
                </div>

                <div className="col-12">
                  <label className="form-label fw-semibold">Notes / Description</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-outline-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
