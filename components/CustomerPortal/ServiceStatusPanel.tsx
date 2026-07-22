import Link from "next/link";
import { useMemo, useState } from "react";
import { PORTAL_SERVICE_FILTERS } from "@/lib/customerPortal/mockData";
import type { PortalServiceStatus } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

type ViewMode = "grid" | "list";
type FilterValue = (typeof PORTAL_SERVICE_FILTERS)[number];

const STATUS_CLASS: Record<PortalServiceStatus["status"], string> = {
  Active: styles.serviceBadgeActive,
  Provisioning: styles.serviceBadgeProvisioning,
  Expired: styles.serviceBadgeExpired,
};

type ServiceStatusPanelProps = {
  services: PortalServiceStatus[];
};

export default function ServiceStatusPanel({ services }: ServiceStatusPanelProps) {
  const [filter, setFilter] = useState<FilterValue>("All");
  const [view, setView] = useState<ViewMode>("grid");

  const filteredServices = useMemo(() => {
    if (filter === "All") return services;
    return services.filter((item) => item.category === filter);
  }, [filter, services]);

  return (
    <section className={styles.servicePanel}>
      <div className={styles.servicePanelHead}>
        <div className={styles.serviceTitleWrap}>
          <h2 className={styles.serviceTitle}>
            <i className="fa-solid fa-database" aria-hidden="true" />
            Service Status
          </h2>
          <Link href="/public/services" className={styles.addServiceBtn}>
            + Add Service
          </Link>
        </div>

        <div className={styles.serviceToolbar}>
          <label className={styles.serviceFilter}>
            <span className="visually-hidden">Filter services</span>
            <select value={filter} onChange={(e) => setFilter(e.target.value as FilterValue)}>
              {PORTAL_SERVICE_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.viewToggle} role="group" aria-label="View mode">
            <button
              type="button"
              className={[styles.viewBtn, view === "list" ? styles.viewBtnActive : ""].filter(Boolean).join(" ")}
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
              title="List view"
            >
              <i className="fa-solid fa-list" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={[styles.viewBtn, view === "grid" ? styles.viewBtnActive : ""].filter(Boolean).join(" ")}
              aria-pressed={view === "grid"}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              <i className="fa-solid fa-grip" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {filteredServices.length === 0 ? (
        <p className={styles.panelSub}>No services yet. Browse our catalog to add one.</p>
      ) : view === "grid" ? (
        <div className={styles.serviceGrid}>
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      ) : (
        <div className={styles.serviceList}>
          {filteredServices.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </div>
      )}
    </section>
  );
}

function ServiceCard({ service }: { service: PortalServiceStatus }) {
  return (
    <article className={styles.serviceCard}>
      <div className={styles.serviceCardTop}>
        <div>
          <h3 className={styles.serviceCardTitle}>{service.title}</h3>
          <p className={styles.serviceCardPlan}>
            {service.category} - Plan: {service.plan}
          </p>
        </div>
        <span className={STATUS_CLASS[service.status]}>{service.status}</span>
      </div>
      <div className={styles.serviceCardRenew}>
        <span className={styles.serviceRenewLabel}>{service.renewLabel}</span>
        {service.renewDate && <strong className={styles.serviceRenewDate}>{service.renewDate}</strong>}
        <p className={styles.serviceRenewNote}>{service.renewNote}</p>
      </div>
    </article>
  );
}

function ServiceRow({ service }: { service: PortalServiceStatus }) {
  return (
    <article className={styles.serviceRow}>
      <div className={styles.serviceRowMain}>
        <h3 className={styles.serviceCardTitle}>{service.title}</h3>
        <p className={styles.serviceCardPlan}>
          {service.category} - Plan: {service.plan}
        </p>
      </div>
      <div className={styles.serviceRowRenew}>
        <span className={styles.serviceRenewLabel}>{service.renewLabel}</span>
        {service.renewDate && <strong className={styles.serviceRenewDate}>{service.renewDate}</strong>}
        <p className={styles.serviceRenewNote}>{service.renewNote}</p>
      </div>
      <span className={STATUS_CLASS[service.status]}>{service.status}</span>
    </article>
  );
}
