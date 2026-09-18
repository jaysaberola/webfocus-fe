import { useCallback, useEffect, useState } from "react";
import PaynamicsReceiptPromptModal from "@/components/CustomerPortal/PaynamicsReceiptPromptModal";
import { dismissPaynamicsProofPrompt, isPaynamicsProofPromptDismissed, markOpenProofUpload } from "@/lib/paynamicsProofPrompt";
import type { PortalInvoice } from "@/lib/customerPortal/types";
import { fetchPortalBilling } from "@/services/customerPortalService";

type PaynamicsProofReminderHostProps = {
  onUpload: (invoice: PortalInvoice) => void;
};

function firstInvoiceNeedingProof(invoices: PortalInvoice[], proofs: Array<{ invoiceId: string }>) {
  return (
    invoices.find((row) => {
      if (row.status !== "Paid") return false;
      return !proofs.some((proof) => proof.invoiceId === row.id);
    }) ?? null
  );
}

export default function PaynamicsProofReminderHost({ onUpload }: PaynamicsProofReminderHostProps) {
  const [invoice, setInvoice] = useState<PortalInvoice | null>(null);
  const [open, setOpen] = useState(false);

  const refresh = useCallback(() => {
    if (typeof window !== "undefined" && window.sessionStorage.getItem("webfocus.paynamicsProofPrompt.openUpload") === "1") {
      setOpen(false);
      return Promise.resolve(null);
    }
    if (isPaynamicsProofPromptDismissed()) {
      setOpen(false);
      return Promise.resolve(null);
    }

    return fetchPortalBilling()
      .then((data) => {
        const next = firstInvoiceNeedingProof(data.invoices ?? [], data.paymentProofs ?? []);
        setInvoice(next);
        setOpen(Boolean(next));
        return next;
      })
      .catch(() => {
        setOpen(false);
        return null;
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      if (cancelled) return;
      void refresh();
    };

    load();
    const interval = window.setInterval(load, 15000);
    window.addEventListener("focus", load);
    window.addEventListener("visibilitychange", load);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", load);
      window.removeEventListener("visibilitychange", load);
    };
  }, [refresh]);

  return (
    <PaynamicsReceiptPromptModal
      open={open}
      invoiceId={invoice?.id}
      onUpload={() => {
        if (!invoice) return;
        markOpenProofUpload();
        setOpen(false);
        onUpload(invoice);
      }}
      onLater={() => {
        setOpen(false);
        dismissPaynamicsProofPrompt();
      }}
    />
  );
}
