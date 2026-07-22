import { useEffect, useState } from "react";
import BillingPaymentModal from "@/components/CustomerPortal/BillingPaymentModal";
import { formatPeso } from "@/lib/customerPortal/mockData";
import {
  addPortalFunds,
  fetchPortalBilling,
  notifyPortalNotificationsUpdated,
  payPortalInvoice,
} from "@/services/customerPortalService";
import type { PortalInvoice, PortalPaymentProof } from "@/lib/customerPortal/types";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

type PaymentModalState =
  | { open: false }
  | {
      open: true;
      mode: "invoice" | "add-funds";
      invoiceId?: string;
      title?: string;
      amount?: number;
    };

export default function BillingTab() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PortalPaymentProof[]>([]);
  const [reminder, setReminder] = useState<{
    invoiceId: string;
    transactionNo?: string;
    title: string;
    dueDate: string;
    amount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({ open: false });

  const loadBilling = () =>
    fetchPortalBilling().then((data) => {
      setInvoices(data.invoices ?? []);
      setPaymentProofs(data.paymentProofs ?? []);
      setReminder(data.reminder ?? null);
    });

  useEffect(() => {
    loadBilling().finally(() => setLoading(false));
  }, []);

  const openInvoicePayment = (payload?: {
    invoiceId?: string;
    title?: string;
    amount?: number;
  }) => {
    const invoiceId = payload?.invoiceId ?? reminder?.invoiceId;
    if (!invoiceId) {
      toast.warning("No pending invoice to pay.");
      return;
    }

    setPaymentModal({
      open: true,
      mode: "invoice",
      invoiceId,
      title: payload?.title ?? reminder?.title,
      amount: payload?.amount ?? reminder?.amount,
    });
  };

  const handlePaymentSubmit = async (paymentMethod: string, amount?: number) => {
    try {
      setSubmitting(true);

      if (paymentModal.open && paymentModal.mode === "add-funds") {
        const fundAmount = amount ?? 0;
        if (fundAmount < 100) {
          toast.warning("Minimum add funds amount is ₱100.");
          return;
        }

        const result = await addPortalFunds({ amount: fundAmount, paymentMethod });
        toast.success(result?.message || "Add funds request submitted.");
      } else if (paymentModal.open && paymentModal.mode === "invoice") {
        const result = await payPortalInvoice({
          invoiceId: paymentModal.invoiceId || reminder?.invoiceId || "",
          paymentMethod,
        });
        toast.success(result?.message || "Payment initiated.");
      } else {
        return;
      }

      setPaymentModal({ open: false });
      notifyPortalNotificationsUpdated();
      window.location.assign("/public/dashboard?tab=orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment could not be started.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading billing...</div>;
  }

  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <h2 className={styles.panelTitle}>Billing Invoices &amp; Receipts</h2>
            <p className={styles.panelSub}>
              Secure payment processing via GCash, Maya, and Corporate Bank Wire.
            </p>
          </div>
          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={() => setPaymentModal({ open: true, mode: "add-funds" })}
          >
            Add Funds
          </button>
        </div>

        {reminder ? (
          <div className={styles.reminderBanner}>
            <div className={styles.reminderIcon}>!</div>
            <div>
              <h3 className={styles.reminderTitle}>Renewal Reminder: Invoice Due Soon</h3>
              <p className={styles.reminderText}>
                Invoice <span className={styles.monoBlue}>{reminder.invoiceId}</span> ({reminder.title}) is due on{" "}
                {reminder.dueDate}. Please complete payment to avoid interruption.
              </p>
            </div>
            <button
              type="button"
              className={styles.amberBtn}
              onClick={() =>
                openInvoicePayment({
                  invoiceId: reminder.invoiceId,
                  title: reminder.title,
                  amount: reminder.amount,
                })
              }
            >
              Pay &amp; Renew
            </button>
          </div>
        ) : null}

        <div className={styles.tableWrap}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Invoice ID</th>
                <th>Service Name</th>
                <th>Plan</th>
                <th>Issued</th>
                <th>Due Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7}>No invoices yet.</td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td className={styles.monoBlue}>{inv.id}</td>
                    <td>{inv.items}</td>
                    <td>{inv.subscription}</td>
                    <td>{inv.date}</td>
                    <td>{inv.due}</td>
                    <td className={styles.monoBold}>{formatPeso(inv.amount)}</td>
                    <td>
                      <span className={inv.status === "Paid" ? styles.badgeGreen : styles.badgeAmber}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {paymentProofs.length > 0 ? (
          <div className={styles.sectionDivider}>
            <h3 className={styles.sectionTitle}>Payment Proofs &amp; Attached Receipts</h3>
            <div className={styles.proofList}>
              {paymentProofs.map((proof) => (
                <div key={proof.id} className={styles.proofCard}>
                  <div>
                    <div className={styles.proofMeta}>
                      <span className={styles.monoBlue}>{proof.id}</span>
                      <span className={styles.chip}>Invoice: {proof.invoiceId}</span>
                      <span className={styles.badgeGreen}>{proof.status}</span>
                    </div>
                    <p className={styles.proofFile}>
                      <i className="fa-solid fa-paperclip" aria-hidden="true" /> {proof.fileName}
                      {proof.notes ? <span className={styles.muted}> ({proof.notes})</span> : null}
                    </p>
                    <p className={styles.proofDate}>Uploaded on {proof.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>

      <BillingPaymentModal
        open={paymentModal.open}
        mode={paymentModal.open ? paymentModal.mode : "invoice"}
        invoiceId={paymentModal.open ? paymentModal.invoiceId : undefined}
        title={paymentModal.open ? paymentModal.title : undefined}
        amount={paymentModal.open ? paymentModal.amount : undefined}
        submitting={submitting}
        onClose={() => setPaymentModal({ open: false })}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  );
}
