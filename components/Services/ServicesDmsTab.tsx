import { DMS_ENTERPRISE_PLANS, DMS_MAIL_PLANS, formatPeso } from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import { serviceCardGridClass } from "./serviceCardGridClass";
import styles from "@/styles/services.module.css";

const MAIL_TIER_BADGES = [
  styles.serviceCardBadge,
  `${styles.serviceCardBadge} ${styles.serviceCardBadgePurple}`,
  `${styles.serviceCardBadge} ${styles.serviceCardBadgeGreen}`,
] as const;

export default function ServicesDmsTab() {
  const { addToCart } = useServiceCart();

  return (
    <div className={styles.tabPanel}>
      <div className={styles.dmsWrap}>
        <section className={styles.dmsHero} aria-label="Document management overview">
          <div className={styles.dmsHeroInner}>
            <p className={styles.dmsEyebrow}>Document Management</p>
            <h2 className={styles.dmsHeroTitle}>WebFocus DMS &amp; Mail Suites</h2>
          </div>
        </section>

        <section className={styles.dmsContent}>
          <div className={styles.dmsSectionHead}>
            <h3 className={styles.dmsSectionTitle}>Mail &amp; Collaboration Plans</h3>
            <p className={styles.dmsSectionHint}>Per-account monthly pricing with bundled productivity tools.</p>
          </div>

          <div className={serviceCardGridClass(DMS_MAIL_PLANS.length)}>
            {DMS_MAIL_PLANS.map((plan, index) => (
              <article key={plan.name} className={styles.serviceCard}>
                <div className={styles.serviceCardTop}>
                  <span className={MAIL_TIER_BADGES[index]}>{plan.tier}</span>
                  <h4 className={styles.serviceCardTitle}>{plan.name}</h4>
                  <p className={styles.serviceCardPrice}>
                    {formatPeso(plan.price)}
                    <span>{plan.unit}</span>
                  </p>
                </div>
                <div className={styles.serviceCardBody}>
                  <p className={styles.serviceCardDesc}>{plan.description}</p>
                  <ul className={styles.serviceCardFeatures}>
                    {plan.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>
                <button
                  type="button"
                  className={`${styles.serviceCardBtn} ${styles.serviceCardBtnPrimary}`}
                  onClick={() => addToCart(plan.name, plan.price, "Document Management System", plan.unit)}
                >
                  + ADD TO CART
                </button>
              </article>
            ))}
          </div>

          <div className={styles.dmsEnterpriseSection}>
            <div className={styles.dmsSectionHead}>
              <h3 className={styles.dmsSectionTitle}>Enterprise Archival Suites</h3>
              <p className={styles.dmsSectionHint}>
                Annual DMS licenses with encrypted storage, compliance logging, and dedicated support.
              </p>
            </div>

            <div className={serviceCardGridClass(DMS_ENTERPRISE_PLANS.length)}>
              {DMS_ENTERPRISE_PLANS.map((plan) => (
                <article key={plan.name} className={styles.serviceCard}>
                  <div className={styles.serviceCardTop}>
                    <span className={`${styles.serviceCardBadge} ${styles.serviceCardBadgeOrange}`}>
                      Enterprise
                    </span>
                    <h4 className={styles.serviceCardTitle}>{plan.name}</h4>
                    <p className={styles.serviceCardPrice}>
                      {formatPeso(plan.price)}
                      <span>{plan.unit}</span>
                    </p>
                  </div>
                  <div className={styles.serviceCardBody}>
                    <p className={styles.serviceCardDesc}>{plan.description}</p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.serviceCardBtn} ${styles.serviceCardBtnNavy}`}
                    onClick={() =>
                      addToCart(
                        plan.cartName,
                        plan.price,
                        "Document Management System",
                        plan.cartDetail || plan.unit
                      )
                    }
                  >
                    {plan.cta.toUpperCase()}
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
