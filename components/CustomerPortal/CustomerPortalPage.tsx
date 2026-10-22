import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { CustomerPortalTab } from "@/lib/customerPortal/types";
import { useCustomerPortalAuth } from "@/lib/customerPortal/useCustomerPortalAuth";
import { usePortalUnreadCount } from "@/lib/customerPortal/usePortalUnreadCount";
import { PORTAL_NOTIFICATIONS_UPDATED_EVENT } from "@/services/customerPortalService";
import { fetchCurrentCustomer } from "@/services/publicCustomerService";
import LiveInboxHost, { type InboxToastOpenContext } from "@/components/LiveInboxHost";
import type { InboxToastPriority } from "@/lib/inboxToastPriority";
import CustomerPortalTabs from "./CustomerPortalTabs";
import OverviewTab from "./tabs/OverviewTab";
import BillingTab from "./tabs/BillingTab";
import OrdersTab from "./tabs/OrdersTab";
import ContractTab from "./tabs/ContractTab";
import NotificationsTab from "./tabs/NotificationsTab";
import HelpTab from "./tabs/HelpTab";
import AccountTab from "./tabs/AccountTab";
import PaynamicsProofReminderHost from "./PaynamicsProofReminderHost";
import PortalTabLoader from "./PortalTabLoader";
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

  useEffect(() => {
    if (!customer) return;

    const refreshCustomer = () => {
      fetchCurrentCustomer({ silent: true, force: true })
        .then((fresh) => setCustomer(fresh))
        .catch(() => {});
    };

    window.addEventListener(PORTAL_NOTIFICATIONS_UPDATED_EVENT, refreshCustomer);
    window.addEventListener("focus", refreshCustomer);
    return () => {
      window.removeEventListener(PORTAL_NOTIFICATIONS_UPDATED_EVENT, refreshCustomer);
      window.removeEventListener("focus", refreshCustomer);
    };
  }, [customer?.id, setCustomer]);

  const switchTab = useCallback(
    (tab: CustomerPortalTab, extraQuery?: Record<string, string>) => {
      if (tab === activeTab && !extraQuery) return;
      setActiveTab(tab);
      const query =
        tab === "overview" && !extraQuery
          ? {}
          : { ...(tab === "overview" ? {} : { tab }), ...extraQuery };
      router.replace({ pathname: "/public/dashboard", query }, undefined, {
        shallow: true,
      });
    },
    [activeTab, router],
  );

  const openInbox = useCallback(() => {
    setActiveTab("notification");
    void router.replace(
      { pathname: "/public/dashboard", query: { tab: "notification" } },
      undefined,
      { shallow: true },
    );
  }, [router]);

  const handleInboxToastOpen = useCallback(
    (context?: InboxToastOpenContext) => {
      const priority: InboxToastPriority = context?.priority ?? "default";
      if (priority === "critical" || priority === "warning") {
        switchTab("orders", { renew: "1" });
        return;
      }
      openInbox();
    },
    [openInbox, switchTab],
  );

  if (loading) {
    return (
      <div className={`${styles.page} public-content-gutter`}>
        <PortalTabLoader label="Loading your account..." />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className={`${styles.page} public-content-gutter`}>
        <PortalTabLoader label="Redirecting..." />
      </div>
    );
  }

  return (
    <div className={`${styles.page} public-content-gutter`}>
      <CustomerPortalTabs
        activeTab={activeTab}
        onTabChange={switchTab}
        unreadNotifications={unreadCount}
        customer={customer}
      />

      <div key={activeTab} className={styles.tabPanel}>
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

      <LiveInboxHost audience="customer" enabled={Boolean(customer)} onOpenInbox={handleInboxToastOpen} />

      {activeTab !== "billing" ? (
        <PaynamicsProofReminderHost
          onUpload={(invoice) => {
            switchTab("billing", { upload_now: "1", invoice: invoice.id });
          }}
        />
      ) : null}
    </div>
  );
}
