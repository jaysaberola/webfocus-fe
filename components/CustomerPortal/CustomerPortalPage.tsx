import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { CustomerPortalTab } from "@/lib/customerPortal/types";
import { useCustomerPortalAuth } from "@/lib/customerPortal/useCustomerPortalAuth";
import { usePortalUnreadCount } from "@/lib/customerPortal/usePortalUnreadCount";
import CustomerPortalTabs from "./CustomerPortalTabs";
import OverviewTab from "./tabs/OverviewTab";
import BillingTab from "./tabs/BillingTab";
import OrdersTab from "./tabs/OrdersTab";
import ContractTab from "./tabs/ContractTab";
import NotificationsTab from "./tabs/NotificationsTab";
import HelpTab from "./tabs/HelpTab";
import AccountTab from "./tabs/AccountTab";
import styles from "@/styles/customerPortal.module.css";

const VALID_TABS: CustomerPortalTab[] = [
  "overview",
  "billing",
  "orders",
  "contract",
  "notification",
  "help",
  "account",
];

function parseTab(value: unknown): CustomerPortalTab {
  if (typeof value === "string" && VALID_TABS.includes(value as CustomerPortalTab)) {
    return value as CustomerPortalTab;
  }
  return "overview";
}

export default function CustomerPortalPage() {
  const router = useRouter();
  const { customer, loading, setCustomer } = useCustomerPortalAuth();
  const [activeTab, setActiveTab] = useState<CustomerPortalTab>("overview");

  useEffect(() => {
    if (!router.isReady) return;
    setActiveTab(parseTab(router.query.tab));
  }, [router.isReady, router.query.tab]);

  const unreadCount = usePortalUnreadCount(Boolean(customer));

  const switchTab = (tab: CustomerPortalTab) => {
    setActiveTab(tab);
    router.replace({ pathname: "/public/dashboard", query: tab === "overview" ? {} : { tab } }, undefined, {
      shallow: true,
    });
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading your account...</div>;
  }

  return (
    <div className={styles.page}>
      <CustomerPortalTabs
        activeTab={activeTab}
        onTabChange={switchTab}
        unreadNotifications={unreadCount}
      />

      {activeTab === "overview" && <OverviewTab />}
      {activeTab === "billing" && <BillingTab />}
      {activeTab === "orders" && <OrdersTab />}
      {activeTab === "contract" && <ContractTab />}
      {activeTab === "notification" && <NotificationsTab />}
      {activeTab === "help" && <HelpTab />}
      {activeTab === "account" && (
        <AccountTab customer={customer} onCustomerUpdate={setCustomer} />
      )}
    </div>
  );
}
