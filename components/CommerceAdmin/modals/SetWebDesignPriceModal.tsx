import { useEffect, useState } from "react";
import type { SalesTransaction } from "@/services/salesTransactionService";
import { isPendingQuotationTransaction } from "@/lib/commerceAdmin/webDesignPricing";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  transaction: SalesTransaction | null;
  onClose: () => void;
  onSave: (amount: number) => void;
};

export default function SetWebDesignPriceModal({ open, transaction, onClose, onSave }: Props) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !transaction) return;
    const current = Number(transaction.grand_total || 0);
    setAmount(current > 0 ? String(current) : "");
    setError("");
  }, [open, transaction]);

  if (!open || !transaction) return null;

  const pending = isPendingQuotationTransaction(transaction);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid price greater than zero.");
      return;
    }
    onSave(value);
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true">
      <div className={styles.modalCard}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Set Web Design Price</h3>
            <p className={styles.panelSubtitle}>
              {transaction.transaction_no}
              {pending ? " · Pending Quotation" : ""}
            </p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <p className={styles.panelSubtitle}>
            Sales can set the final one-off package price for this web design order. The customer cart
            showed Pending Quotation until this amount is saved.
          </p>

          <label className={styles.modalLabel}>
            Package price (PHP)
            <input
              className={styles.modalInput}
              type="number"
              min="1"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              placeholder="e.g. 32000"
              required
              autoFocus
            />
          </label>

          {error ? <p className={styles.modalError}>{error}</p> : null}

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtnSm}>
              Save Price
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
