import { useState, type FormEvent } from "react";
import {
  checkDomainAvailability,
  normalizeDomainInput,
  PRIMARY_TLDS,
} from "@/services/domainSearchService";
import { DOMAIN_REFERENCE, formatPeso } from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import styles from "@/styles/services.module.css";

export default function ServicesDomainsTab() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<
    { domain: string; tld: string; available: boolean; price: number }[]
  >([]);
  const { addToCart } = useServiceCart();

  const handleSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    setError("");
    setResults([]);

    const parsed = normalizeDomainInput(query);
    const name = parsed.name.replace(/[^a-z0-9-]/g, "");

    if (!name || name.length < 2) {
      setError("Enter at least 2 characters for your domain name.");
      return;
    }

    const tldsToCheck = parsed.tld
      ? [parsed.tld]
      : PRIMARY_TLDS.slice(0, 6);

    setLoading(true);
    try {
      const response = await checkDomainAvailability(name, tldsToCheck);
      setResults(response.results);
    } catch {
      setError("Unable to check domain availability right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.domainCard}>
        <h3>Lookup Available Brands Instantly</h3>

        <form className={styles.domainSearchRow} onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="mybrandname"
            className={styles.domainInput}
            aria-label="Domain name"
          />
          <button type="submit" className={styles.primaryBtnInline} disabled={loading}>
            {loading ? "Searching..." : "Search Domain"}
          </button>
        </form>

        {error && <p className={styles.domainError}>{error}</p>}

        {results.length > 0 && (
          <div className={styles.domainResults}>
            {results.map((result) => (
              <div key={`${result.domain}${result.tld}`} className={styles.domainResultRow}>
                <div>
                  <strong>
                    {result.domain}
                    {result.tld}
                  </strong>
                  <span className={result.available ? styles.available : styles.unavailable}>
                    {result.available ? "Available" : "Taken"}
                  </span>
                </div>
                {result.available && (
                  <button
                    type="button"
                    className={styles.secondaryBtn}
                    onClick={() =>
                      addToCart(
                        `${result.domain}${result.tld}`,
                        result.price,
                        "Domain",
                        "1 year registration"
                      )
                    }
                  >
                    Add {formatPeso(result.price)}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <section className={styles.domainReference}>
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
    </div>
  );
}
