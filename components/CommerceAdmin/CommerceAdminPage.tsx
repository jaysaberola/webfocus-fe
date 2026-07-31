import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import { resolveCommerceTab } from "@/lib/navPermissions";
import { prefetchCommerceAdmin } from "@/lib/commerceAdmin/prefetchCommerceAdmin";
import { useCommerceAdminAuth } from "@/lib/commerceAdmin/useCommerceAdminAuth";
import CommerceAdminShell from "./CommerceAdminShell";
import CommerceAdminContent from "./CommerceAdminContent";
import styles from "@/styles/commerceAdmin.module.css";

export default function CommerceAdminPage() {
  const router = useRouter();
  const { loading, user } = useCommerceAdminAuth();
  const [activeTab, setActiveTab] = useState<CommerceAdminTab>("dashboard");

  useEffect(() => {
    prefetchCommerceAdmin(router);
  }, [router]);

  useEffect(() => {
    if (!router.isReady || loading) return;

    const requested = typeof router.query.tab === "string"
      ? (router.query.tab as CommerceAdminTab)
      : undefined;
    const resolved = resolveCommerceTab(user, requested);

    setActiveTab(resolved);

    if (requested && requested !== resolved) {
      router.replace(
        { pathname: COMMERCE_ADMIN_PATH, query: resolved === "dashboard" ? {} : { tab: resolved } },
        undefined,
        { shallow: true }
      );
    }
  }, [router.isReady, router.query.tab, loading, user]);

  const switchTab = (tab: CommerceAdminTab) => {
    setActiveTab(tab);
    router.replace(
      { pathname: COMMERCE_ADMIN_PATH, query: tab === "dashboard" ? {} : { tab } },
      undefined,
      { shallow: true }
    );
  };

  if (loading && !user) {
    return <div className={styles.loadingState}>Loading commerce control center...</div>;
  }

  return (
    <div className={styles.page}>
      <CommerceAdminShell
        activeTab={activeTab}
        onTabChange={switchTab}
        user={user}
      />
      <CommerceAdminContent activeTab={activeTab} onTabChange={switchTab} />
    </div>
  );
}
