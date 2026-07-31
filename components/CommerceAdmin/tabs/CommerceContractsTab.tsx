import { useEffect, useState } from "react";
import {
  addCommerceContract,
  readCommerceContracts,
  type CommerceContractRecord,
} from "@/lib/commerceAdmin/contractsStorage";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

export default function CommerceContractsTab() {
  const [rows, setRows] = useState<CommerceContractRecord[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    validity: "",
    status: "Signed & Active",
  });

  useEffect(() => {
    setRows(readCommerceContracts());
  }, []);

  const handleDownload = (row: CommerceContractRecord) => {
    toast.success(`Downloading official signed contract PDF for ${row.id}...`);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim() || !form.validity.trim()) {
      toast.error("Contract title and validity are required.");
      return;
    }
    const next = addCommerceContract({
      title: form.title.trim(),
      validity: form.validity.trim(),
      status: form.status,
    });
    setRows(next);
    setCreateOpen(false);
    setForm({ title: "", validity: "", status: "Signed & Active" });
    toast.success("Contract record added.");
  };

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Enterprise SLA Contracts &amp; Agreements</h3>
          <p className={styles.panelSubtitle}>
            Manage digital service level agreements and annual renewal timelines.
          </p>
        </div>
        <button type="button" className={styles.primaryBtnSm} onClick={() => setCreateOpen(true)}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> Add Contract
        </button>
      </div>

      <div className={styles.contractList}>
        {rows.length === 0 ? (
          <p className={styles.emptyState}>No contracts found.</p>
        ) : (
          rows.map((row) => (
            <article key={row.id} className={styles.contractCard}>
              <div>
                <span className={styles.monoCell}>{row.id}</span>
                <h4>{row.title}</h4>
                <p className={styles.panelSubtitle}>{row.validity}</p>
              </div>
              <div className={styles.contractCardActions}>
                <span className={styles.badgePaid}>{row.status}</span>
                <button type="button" className={styles.secondaryBtnSm} onClick={() => handleDownload(row)}>
                  Download PDF
                </button>
              </div>
            </article>
          ))
        )}
      </div>

      {createOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add SLA Contract</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setCreateOpen(false)}
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <form className={styles.modalForm} onSubmit={handleSubmit}>
              <label className={styles.modalLabel}>
                Contract Title
                <input
                  className={styles.modalInput}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Enterprise Cloud SLA - Client Name"
                  required
                />
              </label>
              <label className={styles.modalLabel}>
                Validity Period
                <input
                  className={styles.modalInput}
                  value={form.validity}
                  onChange={(e) => setForm({ ...form, validity: e.target.value })}
                  placeholder="Valid: Jan 2026 - Jan 2027 (12 Months)"
                  required
                />
              </label>
              <label className={styles.modalLabel}>
                Status
                <select
                  className={styles.select}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="Signed & Active">Signed &amp; Active</option>
                  <option value="Pending Signature">Pending Signature</option>
                  <option value="Expired">Expired</option>
                </select>
              </label>
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryBtnSm} onClick={() => setCreateOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtnSm}>
                  Save Contract
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
