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
import {
  readCachedHostingPlans,
  readCachedHostingTypeAddons,
  readCachedUniversalHostingAddons,
  readPublicHostingCache,
  storePublicHostingCache,
} from "@/lib/publicHostingCache";
import { useServiceCart } from "./useServiceCart";
import { serviceCardGridClass } from "./serviceCardGridClass";
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

function initialPlans(type: HostingPlanType) {
  return mapFallbackPlans(type);
}

function initialTypeAddons(type: HostingPlanType) {
  return mapFallbackAddons(type);
}

function initialUniversalAddons() {
  return mapFallbackUniversalAddons();
}

export default function ServicesHostingTab() {
  const [hostingType, setHostingType] = useState<HostingPlanType>("cloud");
  const [plans, setPlans] = useState<PublicHostingPlan[]>(() => initialPlans("cloud"));
  const [typeAddons, setTypeAddons] = useState<PublicHostingAddon[]>(() => initialTypeAddons("cloud"));
  const [universalAddons, setUniversalAddons] = useState<PublicHostingAddon[]>(() => initialUniversalAddons());
  const { addToCart } = useServiceCart();

  useEffect(() => {
    let cancelled = false;

    const cachedPlans = readCachedHostingPlans(hostingType);
    const cachedTypeAddons = readCachedHostingTypeAddons(hostingType);
    const cachedUniversalAddons = readCachedUniversalHostingAddons();

    setPlans(cachedPlans ?? initialPlans(hostingType));
    setTypeAddons(cachedTypeAddons ?? initialTypeAddons(hostingType));
    setUniversalAddons(cachedUniversalAddons ?? initialUniversalAddons());

    async function loadCatalog() {
      try {
        const [planRows, addonRows, universalRows] = await Promise.all([
          getPublicHostingPlans(hostingType),
          getPublicHostingAddons(hostingType, "type"),
          getPublicHostingAddons(hostingType, "universal"),
        ]);

        if (cancelled) return;

        const nextPlans = planRows.length ? planRows : initialPlans(hostingType);
        const nextTypeAddons = addonRows.length ? addonRows : initialTypeAddons(hostingType);
        const nextUniversalAddons = universalRows.length ? universalRows : initialUniversalAddons();

        setPlans(nextPlans);
        setTypeAddons(nextTypeAddons);
        setUniversalAddons(nextUniversalAddons);

        const existing = readPublicHostingCache() ?? {
          plans: {},
          typeAddons: {},
          universalAddons: [],
        };

        storePublicHostingCache({
          plans: { ...existing.plans, [hostingType]: nextPlans },
          typeAddons: { ...existing.typeAddons, [hostingType]: nextTypeAddons },
          universalAddons: nextUniversalAddons,
        });
      } catch {
        if (cancelled) return;
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
      <div className={styles.hostingWrap}>
        <section className={styles.hostingHero} aria-label="Hosting services overview">
          <div className={styles.hostingHeroInner}>
            <p className={styles.hostingEyebrow}>Hosting Services</p>
            <h2 className={styles.hostingHeroTitle}>Enterprise Hosting Plans</h2>

            <div className={styles.hostingTypeRow}>
              {HOSTING_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`${styles.hostingTypePill}${
                    hostingType === type ? ` ${styles.hostingTypePillActive}` : ""
                  }`}
                  onClick={() => setHostingType(type)}
                >
                  {HOSTING_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.hostingContent}>
          <div className={styles.hostingSectionHead}>
            <h3 className={styles.hostingSectionTitle}>{sectionTitle} Plans</h3>
            <p className={styles.hostingSectionHint}>
              Choose a node tier with defined RAM and storage allocations for your workload.
            </p>
          </div>

          <div className={`${serviceCardGridClass(plans.length)} ${styles.serviceCardGridStable}`}>
            {plans.map((plan) => (
              <article key={plan.slug} className={styles.serviceCard}>
                <div className={styles.serviceCardTop}>
                  <span className={styles.serviceCardBadge}>{plan.type.toUpperCase()} NODE</span>
                  <h4 className={styles.serviceCardTitle}>{plan.name}</h4>
                  <p className={styles.serviceCardPrice}>
                    {formatPeso(plan.price)}
                    <span> / {plan.billing}</span>
                  </p>
                </div>
                <div className={styles.serviceCardBody}>
                  <div className={styles.serviceCardMeta}>
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
                  className={`${styles.serviceCardBtn} ${styles.serviceCardBtnPrimary}`}
                  onClick={() =>
                    addToCart(plan.name, plan.price, `${plan.type.toUpperCase()} Hosting`, plan.billing)
                  }
                >
                  + ADD TO CART
                </button>
              </article>
            ))}
          </div>

          <div className={styles.hostingAddonsBlock}>
            <div className={styles.hostingSectionHead}>
              <h3 className={styles.hostingSectionTitle}>
                {hostingType.toUpperCase()} Add-ons &amp; Enhancements
              </h3>
              <p className={styles.hostingSectionHint}>
                Enhance your {sectionTitle.toLowerCase()} with certified Manila NOC add-on modules.
              </p>
            </div>

            <div className={`${serviceCardGridClass(typeAddons.length)} ${styles.serviceCardGridStable}`}>
              {typeAddons.map((addon) => (
                <article key={addon.slug} className={styles.serviceCard}>
                  <div className={styles.serviceCardTop}>
                    <div className={styles.hostingAddonTop}>
                      <h4 className={styles.serviceCardTitle}>{addon.name}</h4>
                      <span className={styles.hostingAddonPrice}>
                        {formatPeso(addon.price)}/{addon.billing}
                      </span>
                    </div>
                  </div>
                  {addon.desc ? (
                    <div className={styles.serviceCardBody}>
                      <p className={styles.serviceCardDesc}>{addon.desc}</p>
                    </div>
                  ) : (
                    <div className={styles.serviceCardBodySpacer} aria-hidden="true" />
                  )}
                  <button
                    type="button"
                    className={`${styles.serviceCardBtn} ${styles.serviceCardBtnNavy}`}
                    onClick={() =>
                      addToCart(addon.name, addon.price, "Hosting Add-on", addon.desc || "Annual add-on")
                    }
                  >
                    + ADD TO CART
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.hostingAddonsBlock}>
            <div className={styles.hostingSectionHead}>
              <h3 className={styles.hostingSectionTitle}>
                Universal Add-ons (All Hosting Services)
              </h3>
              <p className={styles.hostingSectionHint}>
                Specialized infrastructure add-ons and licensing enhancements available across plans.
              </p>
            </div>

            <div className={`${serviceCardGridClass(universalAddons.length)} ${styles.serviceCardGridStable}`}>
              {universalAddons.map((addon) => (
                <article key={addon.slug} className={styles.serviceCard}>
                  <div className={styles.serviceCardTop}>
                    {addon.label ? (
                      <span className={`${styles.serviceCardBadge} ${styles.serviceCardBadgeOrange}`}>
                        {addon.label}
                      </span>
                    ) : null}
                    <h4 className={styles.serviceCardTitle}>{addon.name}</h4>
                    <p className={styles.serviceCardPrice}>
                      {formatPeso(addon.price)}
                      <span> / {addon.billing}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.serviceCardBtn} ${styles.serviceCardBtnNavy}`}
                    onClick={() =>
                      addToCart(addon.name, addon.price, "Hosting Add-on", addon.desc || "Annual add-on")
                    }
                  >
                    + ADD TO CART
                  </button>
                </article>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
