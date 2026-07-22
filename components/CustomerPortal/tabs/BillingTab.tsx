import { useEffect, useMemo, useState } from "react";
import PortalTabLoader from "@/components/CustomerPortal/PortalTabLoader";
import BillingPaymentModal from "@/components/CustomerPortal/BillingPaymentModal";
import BillingPaymentProofListModal from "@/components/CustomerPortal/BillingPaymentProofListModal";
import BillingPaymentProofModal from "@/components/CustomerPortal/BillingPaymentProofModal";
import { formatPeso } from "@/lib/customerPortal/mockData";
import {
  addPortalFunds,
  deletePortalPaymentProof,
  fetchPortalBilling,
  notifyPortalNotificationsUpdated,
  payPortalInvoice,
  uploadPortalPaymentProof,
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
      submitLabel?: string;
    };

type ProofModalState =
  | { open: false }
  | {
      open: true;
      invoiceId: string;
      invoiceLabel?: string;
    };

type ProofListModalState =
  | { open: false }
  | {
      open: true;
      invoiceId: string;
      invoiceLabel?: string;
    };

function invoiceStatusClass(status: PortalInvoice["status"]) {
  if (status === "Paid") return styles.badgeGreen;
  if (status === "Overdue") return styles.badgeAmber;
  if (status === "Payment Due") return styles.badgeBlue;
  return styles.badgeAmber;
}

export default function BillingTab() {
  const [invoices, setInvoices] = useState<PortalInvoice[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<PortalPaymentProof[]>([]);
  const [reminder, setReminder] = useState<{
    invoiceId: string;
    title: string;
    dueDate: string;
    amount: number;
    headline?: string;
    buttonLabel?: string;
    canPay?: boolean;
  } | null>(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [paymentModal, setPaymentModal] = useState<PaymentModalState>({ open: false });
  const [proofModal, setProofModal] = useState<ProofModalState>({ open: false });
  const [proofListModal, setProofListModal] = useState<ProofListModalState>({ open: false });

  const payableInvoices = useMemo(
    () => invoices.filter((inv) => inv.status !== "Paid"),
    [invoices]
  );

  const proofsByInvoice = useMemo(() => {
    const map = new Map<string, PortalPaymentProof[]>();
    paymentProofs.forEach((proof) => {
      const list = map.get(proof.invoiceId) ?? [];
      list.push(proof);
      map.set(proof.invoiceId, list);
    });
    return map;
  }, [paymentProofs]);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === "all") return invoices;
    return invoices.filter((inv) => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const loadBilling = (filters?: { dateFrom?: string; dateTo?: string }) =>
    fetchPortalBilling(filters).then((data) => {
      setInvoices(data.invoices ?? []);
      setPaymentProofs(data.paymentProofs ?? []);
      setReminder(data.reminder ?? null);
      return data;
    });

  useEffect(() => {
    loadBilling().finally(() => setLoading(false));
  }, []);

  const applyDateFilter = () => {
    setLoading(true);
    loadBilling({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }).finally(() =>
      setLoading(false)
    );
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
    setLoading(true);
    loadBilling().finally(() => setLoading(false));
  };

  const openInvoicePayment = (payload: {
    invoiceId: string;
    title?: string;
    amount?: number;
    canPay?: boolean;
    submitLabel?: string;
  }) => {
    if (payload.canPay === false) {
      toast.info("Payment is not available yet for this invoice.");
      return;
    }

    setPaymentModal({
      open: true,
      mode: "invoice",
      invoiceId: payload.invoiceId,
      title: payload.title,
      amount: payload.amount,
      submitLabel: payload.submitLabel ?? "Pay Now",
    });
  };

  const openProofModal = (inv: PortalInvoice) => {
    setProofModal({
      open: true,
      invoiceId: inv.id,
      invoiceLabel: `${inv.id} (${inv.plan ?? inv.subscription})`,
    });
  };

  const openProofListModal = (inv: PortalInvoice) => {
    setProofListModal({
      open: true,
      invoiceId: inv.id,
      invoiceLabel: `${inv.id} (${inv.plan ?? inv.subscription})`,
    });
  };

  const handleInvoiceAction = (inv: PortalInvoice, action: string) => {
    if (action === "pay") {
      openInvoicePayment({
        invoiceId: inv.id,
        title: inv.plan ?? inv.subscription,
        amount: inv.amount,
        canPay: inv.canPay,
        submitLabel: reminder?.invoiceId === inv.id ? reminder.buttonLabel : "Pay Now",
      });
      return;
    }

    if (action === "proof") {
      openProofModal(inv);
      return;
    }

    if (action === "view-proofs") {
      openProofListModal(inv);
      return;
    }

    if (action === "orders") {
      window.location.assign("/public/dashboard?tab=orders");
    }
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
          invoiceId: paymentModal.invoiceId || "",
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

  const handleUploadProof = async (payload: { invoiceId: string; notes: string; file: File }) => {
    try {
      setUploadingProof(true);
      await uploadPortalPaymentProof({
        invoiceId: payload.invoiceId,
        notes: payload.notes || undefined,
        receipt: payload.file,
      });
      toast.success("Payment proof uploaded.");
      setProofModal({ open: false });
      notifyPortalNotificationsUpdated();
      await loadBilling({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not upload payment proof.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleDeleteProof = async (proof: PortalPaymentProof) => {
    if (!proof.recordId) return;
    if (!window.confirm("Delete this payment proof?")) return;

    try {
      await deletePortalPaymentProof(proof.recordId);
      toast.success("Payment proof deleted.");
      const data = await loadBilling({ dateFrom: dateFrom || undefined, dateTo: dateTo || undefined });
      if (proofListModal.open && proofListModal.invoiceId === proof.invoiceId) {
        const remaining = (data.paymentProofs ?? []).filter((item) => item.invoiceId === proof.invoiceId);
        if (remaining.length === 0) {
          setProofListModal({ open: false });
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Could not delete payment proof.");
    }
  };

  if (loading && invoices.length === 0) {
    return <PortalTabLoader label="Loading billing..." />;
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
              <h3 className={styles.reminderTitle}>{reminder.headline ?? "Payment Due Soon"}</h3>
              <p className={styles.reminderText}>
                Invoice <span className={styles.monoBlue}>{reminder.invoiceId}</span> ({reminder.title}) is due on{" "}
                {reminder.dueDate}. Please complete payment or renew subscription to avoid interruption.
              </p>
            </div>
            <button
              type="button"
              className={styles.amberBtn}
              disabled={!reminder.canPay}
              onClick={() =>
                openInvoicePayment({
                  invoiceId: reminder.invoiceId,
                  title: reminder.title,
                  amount: reminder.amount,
                  canPay: reminder.canPay,
                  submitLabel: reminder.buttonLabel,
                })
              }
            >
              {reminder.buttonLabel ?? "Pay & Renew"}
            </button>
          </div>
        ) : null}

        <div className={styles.portalTableToolbar}>
          <div className={styles.portalToolbarInner}>
            <div className={styles.portalToolbarGroup}>
              <span className={styles.portalToolbarLabel}>Filter By</span>
              <select
                className={styles.portalToolbarControl}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter invoices by status"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending Payment">Pending Payment</option>
                <option value="Awaiting Approval">Awaiting Approval</option>
                <option value="Payment Due">Payment Due</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            <div className={styles.portalToolbarGroup}>
              <span className={styles.portalToolbarLabel}>Date Range</span>
              <input
                type="date"
                className={`${styles.portalToolbarControl} ${styles.portalToolbarDate}`}
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Filter from date"
              />
              <span className={styles.portalToolbarDivider}>to</span>
              <input
                type="date"
                className={`${styles.portalToolbarControl} ${styles.portalToolbarDate}`}
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Filter to date"
              />
              <button type="button" className={styles.secondaryBtnSm} onClick={applyDateFilter}>
                Apply
              </button>
              <button type="button" className={styles.portalToolbarClear} onClick={clearDateFilter}>
                Clear Date Filter
              </button>
            </div>
          </div>
        </div>

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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8}>No invoices found for the selected filters.</td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const invoiceProofs = proofsByInvoice.get(inv.id) ?? [];

                  return (
                    <tr key={inv.id}>
                      <td className={styles.monoBlue}>{inv.id}</td>
                      <td className={styles.serviceNameBold}>{inv.serviceName ?? inv.items}</td>
                      <td>{inv.plan ?? inv.subscription}</td>
                      <td>{inv.date}</td>
                      <td>{inv.due}</td>
                      <td className={styles.monoBold}>{formatPeso(inv.amount)}</td>
                      <td>
                        <span className={invoiceStatusClass(inv.status)}>{inv.status}</span>
                      </td>
                      <td className={styles.billingActionsCell}>
                        <select
                          className={styles.billingActionsSelect}
                          defaultValue=""
                          onChange={(e) => {
                            const value = e.target.value;
                            if (!value) return;
                            handleInvoiceAction(inv, value);
                            e.target.value = "";
                          }}
                          aria-label={`Actions for ${inv.id}`}
                        >
                          <option value="" disabled hidden>
                            Actions...
                          </option>
                          {invoiceProofs.length > 0 ? (
                            <option value="view-proofs">
                              View Uploaded Receipts ({invoiceProofs.length})
                            </option>
                          ) : null}
                          {inv.status !== "Paid" ? (
                            <>
                              <option value="pay" disabled={!inv.canPay}>
                                {inv.canPay ? "Pay Now" : "Pay Now (not due yet)"}
                              </option>
                              <option value="proof">Submit Payment Proof</option>
                            </>
                          ) : (
                            <option value="proof">Submit Payment Proof</option>
                          )}
                          <option value="orders">View Orders</option>
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <BillingPaymentModal
        open={paymentModal.open}
        mode={paymentModal.open ? paymentModal.mode : "invoice"}
        invoiceId={paymentModal.open ? paymentModal.invoiceId : undefined}
        title={paymentModal.open ? paymentModal.title : undefined}
        amount={paymentModal.open ? paymentModal.amount : undefined}
        submitLabel={paymentModal.open ? paymentModal.submitLabel : "Pay Now"}
        submitting={submitting}
        onClose={() => setPaymentModal({ open: false })}
        onSubmit={handlePaymentSubmit}
      />

      <BillingPaymentProofModal
        open={proofModal.open}
        invoiceId={proofModal.open ? proofModal.invoiceId : ""}
        invoiceLabel={proofModal.open ? proofModal.invoiceLabel : undefined}
        payableInvoices={payableInvoices}
        uploading={uploadingProof}
        onClose={() => setProofModal({ open: false })}
        onSubmit={handleUploadProof}
      />

      <BillingPaymentProofListModal
        open={proofListModal.open}
        invoiceId={proofListModal.open ? proofListModal.invoiceId : ""}
        invoiceLabel={proofListModal.open ? proofListModal.invoiceLabel : undefined}
        proofs={
          proofListModal.open ? proofsByInvoice.get(proofListModal.invoiceId) ?? [] : []
        }
        onClose={() => setProofListModal({ open: false })}
        onDelete={handleDeleteProof}
      />
    </div>
  );
}
