import DomainSearchPanel from "@/components/Domain/DomainSearchPanel";
import { DOMAIN_REFERENCE } from "@/lib/servicesCatalog";
import styles from "@/styles/services.module.css";

export default function ServicesDomainsTab() {
  return (
    <div className={styles.tabPanel}>
      <DomainSearchPanel variant="embedded" />

      <section className={styles.domainReference} aria-label="Domain types reference guide">
        <h4>Domain Types &amp; Extension Reference Guide</h4>
        <div className={styles.domainReferenceGrid}>
          {DOMAIN_REFERENCE.map((item) => (
            <article key={item.title} className={styles.domainReferenceCard}>
              <div className={styles.domainReferenceHeader}>
                <span>{item.title}</span>
                <span className={`${styles.domainBadge} ${styles[`badge${item.badgeClass}`]}`}>
                  {item.badge}
                </span>
              </div>
              <p>{item.description}</p>
              <div className={styles.domainTldRow}>
                {item.tlds.map((tld) => (
                  <span key={tld} className={styles.domainTld}>
                    {tld}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
