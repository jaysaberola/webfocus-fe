import { useState } from "react";
import {
  HOSTING_ADDONS,
  HOSTING_PLANS,
  HOSTING_TYPE_LABELS,
  UNIVERSAL_HOSTING_ADDONS,
  formatPeso,
  type HostingPlanType,
} from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import styles from "@/styles/services.module.css";

const HOSTING_TYPES: HostingPlanType[] = ["cloud", "shared", "dedicated", "baremetal"];

export default function ServicesHostingTab() {
  const [hostingType, setHostingType] = useState<HostingPlanType>("cloud");
  const { addToCart } = useServiceCart();

  const plans = HOSTING_PLANS.filter((plan) => plan.type === hostingType);
  const addons = HOSTING_ADDONS[hostingType] ?? [];

  return (
    <div className={styles.tabPanel}>
      <div className={styles.hostingFilters}>
        {HOSTING_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className={`${styles.hostingFilterBtn}${hostingType === type ? ` ${styles.hostingFilterBtnActive}` : ""}`}
            onClick={() => setHostingType(type)}
          >
            {HOSTING_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      <div className={styles.planGrid}>
        {plans.map((plan) => (
          <article key={plan.id} className={styles.planCard}>
            <div className={styles.planBody}>
              <span className={styles.planKicker}>{plan.type.toUpperCase()} NODE</span>
              <h4 className={styles.planName}>{plan.name}</h4>
              <p className={styles.planPrice}>
                {formatPeso(plan.price)} <span>/ {plan.billing}</span>
              </p>
              <div className={styles.planSpecs}>
                <p>
                  RAM / Spec: <strong>{plan.ram}</strong>
                </p>
                <p>
                  Storage: <strong>{plan.ssd}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => addToCart(plan.name, plan.price, `${plan.type.toUpperCase()} Hosting`, plan.billing)}
            >
              Add to Cart
            </button>
          </article>
        ))}
      </div>

      <section className={styles.addonsSection}>
        <div className={styles.sectionHeading}>
          <h3>{hostingType.toUpperCase()} Add-ons &amp; Enhancements</h3>
          <p>Enhance your infrastructure with certified Manila NOC add-on modules.</p>
        </div>
        <div className={styles.addonGrid}>
          {addons.map((addon) => (
            <article key={addon.name} className={styles.addonCard}>
              <div className={styles.addonBody}>
                <div className={styles.addonHeader}>
                  <h5>{addon.name}</h5>
                  <span>{formatPeso(addon.price)}/yr</span>
                </div>
                {addon.desc && <p>{addon.desc}</p>}
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => addToCart(addon.name, addon.price, "Hosting Add-on", addon.desc || "Annual add-on")}
              >
                Add to Cart
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.addonsSection}>
        <div className={styles.sectionHeading}>
          <h3>Other Service Add-on List (Available for All Hosting Services)</h3>
          <p>Comprehensive schedule of specialized infrastructure add-ons and licensing enhancements.</p>
        </div>
        <div className={styles.addonGrid}>
          {UNIVERSAL_HOSTING_ADDONS.map((addon) => (
            <article key={addon.name} className={styles.universalAddonCard}>
              <div className={styles.universalAddonBody}>
                {addon.label && <span className={styles.universalLabel}>{addon.label}</span>}
                <h5>{addon.name}</h5>
                <p className={styles.universalPrice}>
                  {formatPeso(addon.price)} <span>/yr</span>
                </p>
              </div>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => addToCart(addon.name, addon.price, "Hosting Add-on", addon.desc || "Annual add-on")}
              >
                Add to Cart
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
