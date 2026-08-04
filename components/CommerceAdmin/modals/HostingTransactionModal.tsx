import { useEffect, useMemo, useState } from "react";
import {
  HOSTING_SERVICE_NAME,
  HOSTING_TYPE_NAMES,
  HOSTING_TYPE_SUBTYPES,
  inferHostingTypeName,
  parseHostingClassification,
  type HostingClassification,
  type HostingTypeName,
} from "@/lib/commerceAdmin/hostingTransactionTypes";
import type { SalesTransaction } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  transaction: SalesTransaction | null;
  onClose: () => void;
  onSave: (classification: HostingClassification) => void;
};

export default function HostingTransactionModal({ open, transaction, onClose, onSave }: Props) {
  const [typeName, setTypeName] = useState<HostingTypeName>("Shared Hosting");
  const [subType, setSubType] = useState("");

  useEffect(() => {
    if (!open || !transaction) return;
    const saved = parseHostingClassification(transaction.notes);
    const inferred = saved?.typeName ?? inferHostingTypeName(transaction);
    setTypeName(inferred);
    setSubType(saved?.subType ?? HOSTING_TYPE_SUBTYPES[inferred][0] ?? "");
  }, [open, transaction]);

  const subTypeOptions = useMemo(() => HOSTING_TYPE_SUBTYPES[typeName] ?? [], [typeName]);

  useEffect(() => {
    if (!subTypeOptions.length) {
      setSubType("");
      return;
    }
    if (!subTypeOptions.includes(subType)) {
      setSubType(subTypeOptions[0]);
    }
  }, [subTypeOptions, subType]);

  if (!open || !transaction) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!subType) return;
    onSave({
      serviceName: HOSTING_SERVICE_NAME,
      typeName,
      subType,
    });
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Hosting Order Classification</h3>
            <p className={styles.panelSubtitle}>{transaction.transaction_no}</p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <label className={styles.modalLabel}>
            Service Name
            <input className={styles.modalInput} value={HOSTING_SERVICE_NAME} disabled />
          </label>

          <label className={styles.modalLabel}>
            Type Name
            <select
              className={styles.select}
              value={typeName}
              onChange={(e) => setTypeName(e.target.value as HostingTypeName)}
            >
              {HOSTING_TYPE_NAMES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.modalLabel}>
            Sub-Type
            <select className={styles.select} value={subType} onChange={(e) => setSubType(e.target.value)} required>
              {subTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtnSm} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtnSm}>
              Apply Classification
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
