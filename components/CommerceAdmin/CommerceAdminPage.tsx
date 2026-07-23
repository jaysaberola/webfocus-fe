import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import { useCommerceAdminAuth } from "@/lib/commerceAdmin/useCommerceAdminAuth";
import CommerceAdminShell from "./CommerceAdminShell";
import CommerceAdminContent from "./CommerceAdminContent";
import styles from "@/styles/commerceAdmin.module.css";

const VALID_TABS: CommerceAdminTab[] = [
  "dashboard",
  "clients",
  "transactions",
  "approvals",
  "managed",
  "contracts",
  "catalog",
  "users",
  "notifications",
  "helpdesk",
  "reports",
];

function parseTab(value: unknown): CommerceAdminTab {
  if (typeof value === "string" && VALID_TABS.includes(value as CommerceAdminTab)) {
    return value as CommerceAdminTab;
  }
  return "dashboard";
}

export default function CommerceAdminPage() {
  const router = useRouter();
  const { loading, userName } = useCommerceAdminAuth();
  const [activeTab, setActiveTab] = useState<CommerceAdminTab>("dashboard");

  useEffect(() => {
    if (!router.isReady) return;
    setActiveTab(parseTab(router.query.tab));
  }, [router.isReady, router.query.tab]);

  const switchTab = (tab: CommerceAdminTab) => {
    setActiveTab(tab);
    router.replace(
      { pathname: COMMERCE_ADMIN_PATH, query: tab === "dashboard" ? {} : { tab } },
      undefined,
      { shallow: true }
    );
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading commerce control center...</div>;
  }

  return (
    <div className={styles.page}>
      <CommerceAdminShell activeTab={activeTab} onTabChange={switchTab} userName={userName} />
      <CommerceAdminContent activeTab={activeTab} onTabChange={switchTab} />
    </div>
  );
}
