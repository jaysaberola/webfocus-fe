import { useEffect, useState } from "react";
import PaynamicsReceiptPromptModal from "@/components/CustomerPortal/PaynamicsReceiptPromptModal";
import {
  dismissPaynamicsProofPrompt,
  isFreshPaynamicsProofPrompt,
  isPaynamicsProofPromptDismissed,
  markOpenProofUpload,
} from "@/lib/paynamicsProofPrompt";
import type { PortalInvoice } from "@/lib/customerPortal/types";
import { fetchPortalBilling } from "@/services/customerPortalService";

type PaynamicsProofReminderHostProps = {
  onUpload: (invoice: PortalInvoice) => void;
};

export default function PaynamicsProofReminderHost({ onUpload }: PaynamicsProofReminderHostProps) {
  const [invoice, setInvoice] = useState<PortalInvoice | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetchPortalBilling()
      .then((data) => {
        if (cancelled) return;

        const proofs = data.paymentProofs ?? [];
        const needed = (data.invoices ?? []).filter((row) => {
          if (row.status !== "Paid") return false;
          return !proofs.some((proof) => proof.invoiceId === row.id);
        });
        const next = needed[0] ?? null;
        setInvoice(next);

        if (!next) {
          setOpen(false);
          return;
        }

        if (isPaynamicsProofPromptDismissed() && !isFreshPaynamicsProofPrompt()) {
          setOpen(false);
          return;
        }

        setOpen(true);
      })
      .catch(() => {
        if (!cancelled) setOpen(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
