import { useRouter } from "next/router";
import PaynamicsProofReminderHost from "@/components/CustomerPortal/PaynamicsProofReminderHost";
import { useStoredPublicAuthState } from "@/lib/publicAuthState";

export default function CustomerPaynamicsProofGate() {
  const router = useRouter();
  const { customer, adminUser } = useStoredPublicAuthState();

  if (!customer || adminUser) return null;

  const path = router.pathname;
  if (path.startsWith("/public/commerce-admin") || path.startsWith("/public/dashboard")) {
    return null;
  }

  return (
    <PaynamicsProofReminderHost
      onUpload={(invoice) => {
        void router.push({
          pathname: "/public/dashboard",
          query: { tab: "billing", upload_now: "1", invoice: invoice.id },
        });
      }}
    />
  );
}
