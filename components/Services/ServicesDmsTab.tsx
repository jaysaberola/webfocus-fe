import { DMS_ENTERPRISE_PLANS, DMS_MAIL_PLANS, formatPeso } from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import styles from "@/styles/services.module.css";

export default function ServicesDmsTab() {
  const { addToCart } = useServiceCart();

  return (
    <div className={styles.tabPanel}>
      <div className={styles.dmsCard}>
        <div className={styles.dmsHeader}>
          <div className={styles.dmsIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
            </svg>
          </div>
          <div>
            <h3>WebFocus Document Management System (DMS) &amp; Mail Suites</h3>
            <p>
              Secure enterprise document archival, role-based access control, compliance logging, and
              business email suites.
            </p>
          </div>
        </div>

        <div className={styles.dmsMailGrid}>
          {DMS_MAIL_PLANS.map((plan) => (
            <article key={plan.name} className={styles.dmsMailCard}>
              <div className={styles.dmsMailBody}>
                <span className={styles.planKicker}>{plan.tier}</span>
                <h4>{plan.name}</h4>
                <p className={styles.planPrice}>
                  {formatPeso(plan.price)} <span>{plan.unit}</span>
                </p>
                <p className={styles.dmsDescription}>{plan.description}</p>
                <ul className={styles.dmsFeatures}>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => addToCart(plan.name, plan.price, "Document Management System", plan.unit)}
              >
                Add to Cart
              </button>
            </article>
          ))}
        </div>

        <div className={styles.dmsEnterpriseGrid}>
          {DMS_ENTERPRISE_PLANS.map((plan) => (
            <article key={plan.name} className={styles.dmsEnterpriseCard}>
              <h4>{plan.name}</h4>
              <p className={styles.planPrice}>
                {formatPeso(plan.price)} <span>{plan.unit}</span>
              </p>
              <p className={styles.dmsDescription}>{plan.description}</p>
              <button
                type="button"
                className={styles.darkBtn}
                onClick={() =>
                  addToCart(
                    plan.cartName,
                    plan.price,
                    "Document Management System",
                    plan.cartDetail || plan.unit
                  )
                }
              >
                {plan.cta}
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
