import { useEffect } from "react";
import { useRouter } from "next/router";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";

export default function CommerceAdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;
    const tab = typeof router.query.tab === "string" ? router.query.tab : "";
    router.replace(tab ? `${COMMERCE_ADMIN_PATH}?tab=${encodeURIComponent(tab)}` : COMMERCE_ADMIN_PATH);
  }, [router.isReady, router.query.tab, router]);

  return null;
}
