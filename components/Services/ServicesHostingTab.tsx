import { useEffect, useMemo, useState } from "react";
import {
  HOSTING_ADDONS,
  HOSTING_PLANS,
  HOSTING_TYPE_LABELS,
  UNIVERSAL_HOSTING_ADDONS,
  formatPeso,
  type HostingPlanType,
} from "@/lib/servicesCatalog";
import {
  getPublicHostingAddons,
  getPublicHostingPlans,
  type PublicHostingAddon,
  type PublicHostingPlan,
} from "@/services/publicHostingService";
import { useServiceCart } from "./useServiceCart";
import styles from "@/styles/services.module.css";

const HOSTING_TYPES: HostingPlanType[] = ["cloud", "shared", "dedicated", "baremetal"];

function mapFallbackPlans(type: HostingPlanType): PublicHostingPlan[] {
  return HOSTING_PLANS.filter((plan) => plan.type === type).map((plan) => ({
    id: plan.id,
    slug: plan.id,
    name: plan.name,
    price: plan.price,
    type: plan.type,
    billing: plan.billing,
    ram: plan.ram,
    ssd: plan.ssd,
  }));
}

function mapFallbackAddons(type: HostingPlanType): PublicHostingAddon[] {
  return (HOSTING_ADDONS[type] ?? []).map((addon, index) => ({
    id: `${type}-${addon.name}-${index}`,
    slug: `${type}-${addon.name}-${index}`,
    name: addon.name,
    price: addon.price,
    desc: addon.desc,
    plan_type: type,
    billing: "yr",
  }));
}

function mapFallbackUniversalAddons(): PublicHostingAddon[] {
  return UNIVERSAL_HOSTING_ADDONS.map((addon, index) => ({
    id: `universal-${index}`,
    slug: `universal-${index}`,
    name: addon.name,
    price: addon.price,
    label: addon.label,
    plan_type: "universal",
    billing: "yr",
  }));
}

export default function ServicesHostingTab() {
  const [hostingType, setHostingType] = useState<HostingPlanType>("cloud");
  const [plans, setPlans] = useState<PublicHostingPlan[]>(() => mapFallbackPlans("cloud"));
  const [typeAddons, setTypeAddons] = useState<PublicHostingAddon[]>(() => mapFallbackAddons("cloud"));
  const [universalAddons, setUniversalAddons] = useState<PublicHostingAddon[]>(() =>
    mapFallbackUniversalAddons()
  );
  const [refreshing, setRefreshing] = useState(false);
  const [usingFallback, setUsingFallback] = useState(true);
  const { addToCart } = useServiceCart();

  useEffect(() => {
    let cancelled = false;

    setPlans(mapFallbackPlans(hostingType));
    setTypeAddons(mapFallbackAddons(hostingType));
    setUniversalAddons(mapFallbackUniversalAddons());
    setUsingFallback(true);

    async function loadCatalog() {
      setRefreshing(true);

      try {
        const [planRows, addonRows, universalRows] = await Promise.all([
          getPublicHostingPlans(hostingType),
          getPublicHostingAddons(hostingType, "type"),
          getPublicHostingAddons(hostingType, "universal"),
        ]);

        if (cancelled) return;

        if (planRows.length) setPlans(planRows);
        if (addonRows.length) setTypeAddons(addonRows);
        if (universalRows.length) setUniversalAddons(universalRows);
        setUsingFallback(false);
      } catch {
        if (cancelled) return;
        setUsingFallback(true);
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    }

    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [hostingType]);

  const sectionTitle = useMemo(() => HOSTING_TYPE_LABELS[hostingType], [hostingType]);

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

      {refreshing ? <p className={styles.hostingLoading}>Updating live catalog...</p> : null}

      <div className={styles.planGrid}>
        {plans.map((plan) => (
          <article key={plan.slug} className={styles.planCard}>
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
          <p>Enhance your {sectionTitle.toLowerCase()} with certified Manila NOC add-on modules.</p>
        </div>
        <div className={styles.addonGrid}>
          {typeAddons.map((addon) => (
            <article key={addon.slug} className={styles.addonCard}>
              <div className={styles.addonBody}>
                <div className={styles.addonHeader}>
                  <h5>{addon.name}</h5>
                  <span>
                    {formatPeso(addon.price)}/{addon.billing}
                  </span>
                </div>
                {addon.desc ? <p>{addon.desc}</p> : null}
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
          {universalAddons.map((addon) => (
            <article key={addon.slug} className={styles.universalAddonCard}>
              <div className={styles.universalAddonBody}>
                {addon.label ? <span className={styles.universalLabel}>{addon.label}</span> : null}
                <h5>{addon.name}</h5>
                <p className={styles.universalPrice}>
                  {formatPeso(addon.price)} <span>/{addon.billing}</span>
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

      {usingFallback ? (
        <p className={styles.hostingFallbackNote}>Showing cached hosting catalog while the live catalog reloads.</p>
      ) : null}
    </div>
  );
}
