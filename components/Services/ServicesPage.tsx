import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import ServicesIntro, { type ServiceTab } from "./ServicesIntro";
import ServicesHostingTab from "./ServicesHostingTab";
import styles from "@/styles/services.module.css";

const ServicesWebDesignTab = dynamic(() => import("./ServicesWebDesignTab"), {
  loading: () => null,
});
const ServicesDomainsTab = dynamic(() => import("./ServicesDomainsTab"), {
  loading: () => null,
});
const ServicesDmsTab = dynamic(() => import("./ServicesDmsTab"), {
  loading: () => null,
});

const TAB_QUERY_MAP: Record<string, ServiceTab> = {
  hosting: "hosting",
  webdesign: "webdesign",
  "web-design": "webdesign",
  web_design: "webdesign",
  domains: "domains",
  dms: "dms",
};

export function resolveServiceTabFromQuery(tab: unknown): ServiceTab {
  const tabParam = String(tab || "").toLowerCase();
  return TAB_QUERY_MAP[tabParam] || "hosting";
}

function tabToQuery(tab: ServiceTab) {
  return tab === "hosting" ? undefined : tab;
}

export default function ServicesPage({ initialTab = "hosting" }: { initialTab?: ServiceTab }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ServiceTab>(initialTab);

  useEffect(() => {
    if (!router.isReady) return;
    setActiveTab(resolveServiceTabFromQuery(router.query.tab));
  }, [router.isReady, router.query.tab]);

  const handleTabChange = (tab: ServiceTab) => {
    setActiveTab(tab);
    const nextQuery = tabToQuery(tab);
    router.replace(
      nextQuery ? { pathname: "/public/services", query: { tab: nextQuery } } : "/public/services",
      undefined,
      { shallow: true }
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <ServicesIntro activeTab={activeTab} onTabChange={handleTabChange} />

        <div className={styles.tabContent} role="tabpanel">
          {activeTab === "hosting" && <ServicesHostingTab />}
          {activeTab === "webdesign" && <ServicesWebDesignTab />}
          {activeTab === "domains" && <ServicesDomainsTab />}
          {activeTab === "dms" && <ServicesDmsTab />}
        </div>
      </div>
    </div>
  );
}
