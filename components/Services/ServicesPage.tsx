import dynamic from "next/dynamic";
import { useState } from "react";
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

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<ServiceTab>("hosting");

  return (
    <div className={styles.page}>
      <div className={styles.shell}>
        <ServicesIntro activeTab={activeTab} onTabChange={setActiveTab} />

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
