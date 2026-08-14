import { useEffect, useRef } from "react";
import { useRouter } from "next/router";
import {
  clearPayablePublicCartItems,
  restorePublicCartFromCheckoutBackup,
} from "@/lib/publicCart";
import { toast } from "@/lib/toast";

/**
 * Handles Paynamics browser return (?paynamics=...).
 * Cart (including priced services + Pending Quotation) is kept until payment is paid.
 */
export default function PaynamicsReturnHandler() {
  const router = useRouter();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!router.isReady) return;

    const status = String(router.query.paynamics || "")
      .trim()
      .toLowerCase();
    if (!status) return;
    if (handledRef.current === status) return;
    handledRef.current = status;

    if (status === "paid") {
      clearPayablePublicCartItems();
      toast.success("Payment received. Paid items were removed from your cart.");
    } else {
      // Cancel / fail / pending — restore full cart (priced + Pending Quotation).
      restorePublicCartFromCheckoutBackup();
      if (status === "cancelled") {
        toast.info("Payment cancelled. Your cart items are still saved.");
      } else if (status === "failed" || status === "verification_failed") {
        toast.error("Payment was not completed. Your cart items are still saved.");
      } else {
        toast.info("Payment is still pending. Your cart items are still saved.");
      }
    }

    const nextQuery = { ...router.query };
    delete nextQuery.paynamics;
    void router.replace(
      { pathname: router.pathname, query: nextQuery },
      undefined,
      { shallow: true }
    );
  }, [router, router.isReady, router.pathname, router.query]);

  // Browser Back from Paynamics usually has no ?paynamics= — restore only from bfcache, not on every public page load.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) restorePublicCartFromCheckoutBackup();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return null;
}
