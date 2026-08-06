import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  ensureCanvasOriginHints,
  preloadTemplateImages,
} from "@/lib/canvasPreviewWarmup";
import { TEMPLATE_GROUPS } from "@/lib/servicesCatalog";
import ServicesDomainsTab from "./ServicesDomainsTab";
import ServicesDmsTab from "./ServicesDmsTab";
import ServicesHostingTab from "./ServicesHostingTab";
import ServicesIntro, { type ServiceTab } from "./ServicesIntro";
import ServicesWebDesignTab from "./ServicesWebDesignTab";
import styles from "@/styles/services.module.css";

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

  useEffect(() => {
    if (initialTab !== "webdesign") return;
    ensureCanvasOriginHints();
    preloadTemplateImages(
      TEMPLATE_GROUPS[0]?.templates.slice(0, 3).map((template) => template.image) ?? []
    );
  }, [initialTab]);

  const handleTabChange = (tab: ServiceTab) => {
    setActiveTab(tab);
    const nextQuery = tabToQuery(tab);
    void router.replace(
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
