import { useEffect, useState, type FormEvent } from "react";
import {
  checkDomainAvailability,
  MORE_TLDS,
  normalizeDomainInput,
  PRIMARY_TLDS,
  type DomainCheckResult,
} from "@/services/domainSearchService";
import { getWebsiteSettingsCached } from "@/lib/websiteSettings";
import styles from "@/styles/homeDomainSearch.module.css";

function availabilityRank(available: boolean | null) {
  if (available === true) return 0;
  if (available === false) return 1;
  return 2;
}

function SearchIcon() {
  return (
    <svg
      className={styles.searchIcon}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M10.5 18C14.6421 18 18 14.6421 18 10.5C18 6.35786 14.6421 3 10.5 3C6.35786 3 3 6.35786 3 10.5C3 14.6421 6.35786 18 10.5 18Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M16.5 16.5L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function HomeDomainSearch() {
  const [query, setQuery] = useState("");
  const [selectedTld, setSelectedTld] = useState<string>(".com");
  const [showMoreTlds, setShowMoreTlds] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<DomainCheckResult[]>([]);
  const [companyLabel, setCompanyLabel] = useState("WebFocus Solutions, Inc.");

  useEffect(() => {
    getWebsiteSettingsCached()
      .then((settings) => {
        const label =
          (settings as any)?.company_name ||
          (settings as any)?.website_name ||
          "WebFocus Solutions, Inc.";
        setCompanyLabel(label);
      })
      .catch(() => {
        // keep default
      });
  }, []);

  const handleTldSelect = (tld: string) => {
    setSelectedTld(tld);
    setResults([]);
    setError("");
  };

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

    const tld = parsed.tld || selectedTld;
    const tldsToCheck = parsed.tld
      ? [parsed.tld]
      : [selectedTld, ...PRIMARY_TLDS.filter((item) => item !== selectedTld).slice(0, 5)];

    setLoading(true);
    try {
      const response = await checkDomainAvailability(name, tldsToCheck);
      const ordered = [...response.results].sort((a, b) => {
        if (a.tld === tld && b.tld !== tld) return -1;
        if (b.tld === tld && a.tld !== tld) return 1;
        const availabilityDifference =
  availabilityRank(a.available) - availabilityRank(b.available);

if (availabilityDifference !== 0) {
  return availabilityDifference;
}
        return a.price - b.price;
      });
      setResults(ordered);
    } catch {
      setError("Unable to check domain availability right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.sectionOuter}>
      <section className={styles.section} aria-label="Domain registration search">
      <div className={styles.inner}>
        <p className={styles.eyebrow}>Domain Registration</p>
        <h2 className={styles.title}>Find your perfect domain name</h2>
        <p className={styles.subtitle}>
          Search and register your domain with {companyLabel}. Secure your brand online with trusted
          local and global extensions.
        </p>

        <form
          id="wsi-domain-hero-form"
          className={styles.searchForm}
          onSubmit={handleSearch}
          autoComplete="off"
        >
          <SearchIcon />
          <input
            type="text"
            id="wsi-domain-query"
            className={styles.searchInput}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            name="domain"
            placeholder="Type the domain you want"
            aria-label="Domain name"
          />
          <button type="submit" className={styles.searchBtn} disabled={loading}>
            {loading ? "Checking..." : "Search Domains"}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.tldRow} id="wsi-domain-tld-pills">
          {PRIMARY_TLDS.map((tld) => (
            <button
              key={tld}
              type="button"
              className={`${styles.tldPill}${selectedTld === tld ? ` ${styles.tldPillActive}` : ""}`}
              data-tld={tld}
              onClick={() => handleTldSelect(tld)}
            >
              {tld}
            </button>
          ))}
          {!showMoreTlds && (
            <button
              type="button"
              id="wsi-domain-tld-view-more"
              className={styles.tldMore}
              aria-expanded={showMoreTlds}
              aria-controls="wsi-domain-tld-pills-extra"
              onClick={() => setShowMoreTlds(true)}
            >
              + View More
            </button>
          )}
        </div>

        {showMoreTlds && (
          <div
            className={`${styles.tldRow} ${styles.tldRowExtra}`}
            id="wsi-domain-tld-pills-extra"
          >
            {MORE_TLDS.map((tld) => (
              <button
                key={tld}
                type="button"
                className={`${styles.tldPill}${selectedTld === tld ? ` ${styles.tldPillActive}` : ""}`}
                data-tld={tld}
                onClick={() => handleTldSelect(tld)}
              >
                {tld}
              </button>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.results} aria-live="polite">
            {results.map((result) => {
              const isAvailable = result.available === true;
              const isTaken = result.available === false;
              const isUnknown = result.available === null;

              return (
                <div key={result.domain} className={styles.resultRow}>
                  <div>
                    <strong>{result.domain}</strong>

                    <span
                      className={`${styles.status} ${
                        isAvailable
                          ? styles.statusAvailable
                          : isTaken
                            ? styles.statusTaken
                            : styles.statusUnknown
                      }`}
                      title={result.message || undefined}
                    >
                      {isAvailable
                        ? "Available"
                        : isTaken
                          ? "Taken"
                          : "Unable to verify"}
                    </span>

                    {isUnknown && result.message && (
                      <small className={styles.providerMessage}>
                        {result.message}
                      </small>
                    )}
                  </div>

                  <div className={styles.resultActions}>
                    <span className={styles.price}>
                      {result.currency} {result.price.toLocaleString()}/yr
                    </span>

                    {isAvailable ? (
                      <a
                        href={`/public/contact-us?subject=Domain%20Registration&domain=${encodeURIComponent(
                          result.domain
                        )}`}
                        className={styles.registerBtn}
                      >
                        Register
                      </a>
                    ) : (
                      <button
                        type="button"
                        className={styles.registerBtnDisabled}
                        disabled
                      >
                        {isTaken ? "Unavailable" : "Check Failed"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className={styles.note}>
          Domain availability is checked in real time. Final pricing confirmed at checkout.
        </p>
      </div>
      </section>
    </div>
  );
}
