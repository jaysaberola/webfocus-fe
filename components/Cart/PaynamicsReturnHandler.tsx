import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  abandonPublicCartCheckout,
  checkoutSessionMatchesPaidInvoice,
  finalizePaidPublicCartCheckout,
  isAbandonedCheckoutStatus,
  isPaidCheckoutStatus,
  readPublicCartCheckoutSession,
  restorePublicCartFromCheckoutBackup,
} from "@/lib/publicCart";
import { markPaynamicsProofNeeded } from "@/lib/paynamicsProofPrompt";
import { fetchPortalBilling, notifyPortalNotificationsUpdated } from "@/services/customerPortalService";
import { confirmPaynamicsPayment } from "@/services/salesTransactionService";
import { toast } from "@/lib/toast";

function notifyPaidCartCleared() {
  toast.success(
    "Payment received. Screenshot or download the Paynamics Payment Success page, then upload it in Billing as proof of payment."
  );
}

async function confirmPaidCheckoutFromServer(options?: { confirmGateway?: boolean }) {
  const session = readPublicCartCheckoutSession();
  if (!session || session.settled === "paid" || session.settled === "abandoned") {
    return false;
  }
  if (Date.now() - Number(session.createdAt || 0) > 48 * 60 * 60 * 1000) {
    return false;
  }

  try {
    if (options?.confirmGateway && session.requestId) {
      try {
        const confirmed = await confirmPaynamicsPayment(session.requestId);
        if (isPaidCheckoutStatus(confirmed?.status)) {
          finalizePaidPublicCartCheckout();
          return true;
        }
      } catch {
        // Fall through to billing so a late IPN can still clear the cart.
      }
    }

    const billing = await fetchPortalBilling();
    const paidInvoice = (billing.invoices ?? []).find((invoice) =>
      checkoutSessionMatchesPaidInvoice({
        transactionNo: invoice.transactionNo,
        invoiceId: invoice.id,
        status: invoice.status,
      }),
    );
    if (!paidInvoice) return false;
    finalizePaidPublicCartCheckout();
    return true;
  } catch {
    return false;
  }
}

/**
 * Handles Paynamics browser return (?paynamics=...).
 * Priced items leave the live cart at checkout and stay gone after payment.
 * Browser Back / cancel restores them from the checkout snapshot.
 */
export default function PaynamicsReturnHandler() {
  const router = useRouter();
  const handledRef = useRef<string | null>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!router.isReady) return;

    const status = String(router.query.paynamics || "")
      .trim()
      .toLowerCase();
    if (!status) return;
    if (handledRef.current === status) return;
    handledRef.current = status;

    if (isPaidCheckoutStatus(status)) {
      finalizePaidPublicCartCheckout();
      markPaynamicsProofNeeded({
        requestId: String(router.query.request_id || "").trim() || null,
      });
      notifyPaidCartCleared();
      notifyPortalNotificationsUpdated();
    } else if (isAbandonedCheckoutStatus(status)) {
      abandonPublicCartCheckout();
      if (status === "cancelled" || status === "canceled") {
        toast.info("Payment cancelled. Your cart items are still saved.");
      } else if (status === "failed" || status === "verification_failed") {
        toast.error("Payment was not completed. Your cart items are still saved.");
      }
    } else {
    void confirmPaidCheckoutFromServer({ confirmGateway: true }).then((paid) => {
      if (paid) {
        markPaynamicsProofNeeded({
          requestId: String(router.query.request_id || "").trim() || null,
        });
        notifyPaidCartCleared();
        notifyPortalNotificationsUpdated();
      }
    });
    }

    const nextQuery = { ...router.query };
    delete nextQuery.paynamics;
    if (isPaidCheckoutStatus(status)) {
      nextQuery.submit_proof = "1";
    }
    void router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true }
    );
  }, [router, router.isReady, router.pathname, router.query]);

  useEffect(() => {
    if (!router.isReady || confirmedRef.current) return;
    if (String(router.query.paynamics || "").trim()) return;
    const session = readPublicCartCheckoutSession();
    if (!session || session.settled === "abandoned") return;
    confirmedRef.current = true;
    void confirmPaidCheckoutFromServer().then((paid) => {
      if (paid) {
        markPaynamicsProofNeeded();
        notifyPaidCartCleared();
        notifyPortalNotificationsUpdated();
      }
    });
  }, [router.isReady, router.query.paynamics]);

  // Browser Back from Paynamics usually has no ?paynamics= — restore only from bfcache, not on every public page load.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      if (readPublicCartCheckoutSession()?.settled === "paid") return;
      restorePublicCartFromCheckoutBackup();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}
