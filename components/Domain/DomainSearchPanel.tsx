import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  buildDomainSearchChecks,
  checkDomainAvailabilityBatch,
  formatDomainFromPrice,
  GRID_TLDS,
  INTERNATIONAL_TLDS,
  MORE_TLDS,
  NEW_DOMAIN_TLDS,
  NEW_TLD_BADGES,
  normalizeDomainInput,
  pickDomainResult,
  PRIMARY_TLDS,
  type DomainCheckResult,
} from "@/services/domainSearchService";
import { useServiceCart } from "@/components/Services/useServiceCart";
import { getWebsiteSettingsCached } from "@/lib/websiteSettings";
import styles from "@/styles/homeDomainSearch.module.css";

type ResultsTab = "results" | "new" | "international";

type DomainSearchPanelProps = {
  variant?: "home" | "embedded";
};

const SUGGESTED_DOMAINS = (name: string) => [
  `${name}online.com`,
  `${name}group.com`,
  `${name}.com.ph`,
  `${name}.net.ph`,
];

const PREMIUM_DOMAINS = (name: string) => [
  `${name}.com`,
  `${name}s.com`,
  `${name}.net`,
  `${name}.org`,
];

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

function DomainActionButton({
  result,
  onAdd,
}: {
  result: DomainCheckResult;
  onAdd: (result: DomainCheckResult) => void;
}) {
  if (result.available === true) {
    return (
      <button type="button" className={styles.addBtn} onClick={() => onAdd(result)}>
        + ADD TO CART
      </button>
    );
  }

  return (
    <button type="button" className={styles.takenBtn} disabled>
      TAKEN
    </button>
  );
}

function DomainListRow({
  result,
  onAdd,
  showPremiumBadge = false,
}: {
  result: DomainCheckResult;
  onAdd: (result: DomainCheckResult) => void;
  showPremiumBadge?: boolean;
}) {
  return (
    <div className={styles.listRow}>
      <div className={styles.listRowDomain}>
        <strong>{result.domain}</strong>
        {showPremiumBadge && result.premium ? (
          <span className={styles.premiumBadge}>Premium</span>
        ) : null}
      </div>
      <span className={styles.listRowPrice}>{formatDomainFromPrice(result.price, result.currency)}</span>
      <DomainActionButton result={result} onAdd={onAdd} />
    </div>
  );
}

export default function DomainSearchPanel({ variant = "home" }: DomainSearchPanelProps) {
  const [query, setQuery] = useState("");
  const [resultsQuery, setResultsQuery] = useState("");
  const [selectedTld, setSelectedTld] = useState<string>(".com");
  const [showMoreTlds, setShowMoreTlds] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedName, setSearchedName] = useState("");
  const [primaryTld, setPrimaryTld] = useState(".com");
  const [allResults, setAllResults] = useState<DomainCheckResult[]>([]);
  const [activeTab, setActiveTab] = useState<ResultsTab>("results");
  const [companyLabel, setCompanyLabel] = useState("WebFocus Solutions, Inc.");
  const { addToCart } = useServiceCart();

  const isEmbedded = variant === "embedded";
  const formId = isEmbedded ? "services-domain-hero-form" : "wsi-domain-hero-form";
  const inputId = isEmbedded ? "services-domain-query" : "wsi-domain-query";

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

  const primaryDomain = `${searchedName}${primaryTld}`;
  const primaryResult = useMemo(
    () => pickDomainResult(allResults, primaryDomain, primaryTld),
    [allResults, primaryDomain, primaryTld]
  );

  const gridResults = useMemo(
    () =>
      GRID_TLDS.map((tld) => pickDomainResult(allResults, `${searchedName}${tld}`, tld)),
    [allResults, searchedName]
  );

  const suggestedResults = useMemo(() => {
    const order = SUGGESTED_DOMAINS(searchedName);
    return order
      .map((domain) => allResults.find((result) => result.domain === domain))
      .filter((result): result is DomainCheckResult => Boolean(result));
  }, [allResults, searchedName]);

  const premiumResults = useMemo(() => {
    const order = PREMIUM_DOMAINS(searchedName);
    return order
      .map((domain) => allResults.find((result) => result.domain === domain))
      .filter((result): result is DomainCheckResult => Boolean(result));
  }, [allResults, searchedName]);

  const tabResults = useMemo(() => {
    if (activeTab === "new") {
      return allResults.filter((result) => NEW_DOMAIN_TLDS.has(result.tld));
    }
    if (activeTab === "international") {
      return allResults.filter((result) => INTERNATIONAL_TLDS.has(result.tld));
    }
    return [];
  }, [activeTab, allResults]);

  const handleTldSelect = (tld: string) => {
    setSelectedTld(tld);
    setError("");
  };

  const runSearch = async (rawQuery: string, tldOverride?: string) => {
    setError("");
    setAllResults([]);
    setActiveTab("results");

    const parsed = normalizeDomainInput(rawQuery);
    const name = parsed.name.replace(/[^a-z0-9-]/g, "");
    const tld = parsed.tld || tldOverride || selectedTld;

    if (!name || name.length < 2) {
      setError("Enter at least 2 characters for your domain name.");
      return;
    }

    setHasSearched(true);
    setSearchedName(name);
    setPrimaryTld(tld);
    setResultsQuery(parsed.tld ? `${name}${parsed.tld}` : `${name}${tld}`);
    setLoading(true);

    try {
      const checks = buildDomainSearchChecks(name, tld);
      const merged = await checkDomainAvailabilityBatch(checks);
      setAllResults(merged);
    } catch {
      setError("Unable to check domain availability right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    await runSearch(query);
  };

  const handleSearchAgain = async (event?: FormEvent) => {
    event?.preventDefault();
    setQuery(resultsQuery);
    await runSearch(resultsQuery);
  };

  const handleAddToCart = (result: DomainCheckResult) => {
    addToCart(result.domain, result.price, "Domain", "1 year registration");
  };

  const availabilityMessage =
    primaryResult.available === true
      ? `${primaryDomain} is available`
      : primaryResult.available === false
        ? `${primaryDomain} is not available`
        : `We could not verify availability for ${primaryDomain}`;

  return (
    <div className={`${styles.wrap}${isEmbedded ? ` ${styles.wrapEmbedded}` : ""}`}>
      <section className={styles.hero} aria-label="Domain registration search">
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Domain Registration</p>
          <h2 className={styles.title}>Find your perfect domain name</h2>
          <p className={styles.subtitle}>
            Search and register your domain with {companyLabel}. Secure your brand online with trusted
            local and global extensions.
          </p>

          <form
            id={formId}
            className={styles.searchForm}
            onSubmit={handleSearch}
            autoComplete="off"
          >
            <SearchIcon />
            <input
              type="text"
              id={inputId}
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

          {error && !hasSearched && <p className={styles.heroError}>{error}</p>}

          <div className={styles.tldRow} id={isEmbedded ? "services-domain-tld-pills" : "wsi-domain-tld-pills"}>
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
                className={styles.tldMore}
                aria-expanded={showMoreTlds}
                aria-controls={isEmbedded ? "services-domain-tld-pills-extra" : "wsi-domain-tld-pills-extra"}
                onClick={() => setShowMoreTlds(true)}
              >
                + View More
              </button>
            )}
          </div>

          {showMoreTlds && (
            <div
              className={`${styles.tldRow} ${styles.tldRowExtra}`}
              id={isEmbedded ? "services-domain-tld-pills-extra" : "wsi-domain-tld-pills-extra"}
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
        </div>
      </section>

      {hasSearched && (
        <section className={styles.resultsPanel} aria-live="polite">
          <div className={styles.resultsInner}>
            <form className={styles.secondarySearch} onSubmit={handleSearchAgain}>
              <input
                type="text"
                className={styles.secondaryInput}
                value={resultsQuery}
                onChange={(event) => setResultsQuery(event.target.value)}
                aria-label="Search domain again"
              />
              <button type="submit" className={styles.secondaryBtn} disabled={loading}>
                {loading ? "Searching..." : "Search Again"}
              </button>
            </form>

            {error && <p className={styles.resultsError}>{error}</p>}

            {!loading && (
              <div
                className={`${styles.availabilityBanner} ${
                  primaryResult.available === true
                    ? styles.availabilityBannerAvailable
                    : primaryResult.available === false
                      ? styles.availabilityBannerTaken
                      : styles.availabilityBannerUnknown
                }`}
              >
                {availabilityMessage}
              </div>
            )}

            {loading ? (
              <div className={styles.loadingState}>Checking domain availability...</div>
            ) : (
              <>
                <div className={styles.tldGrid}>
                  {gridResults.map((result) => (
                    <article key={result.domain} className={styles.tldCard}>
                      {NEW_TLD_BADGES.has(result.tld) ? (
                        <span className={styles.newBadge}>NEW</span>
                      ) : null}
                      <div className={styles.tldCardExtension}>{result.tld}</div>
                      <div className={styles.tldCardPrice}>
                        {formatDomainFromPrice(result.price, result.currency)}
                      </div>
                      <DomainActionButton result={result} onAdd={handleAddToCart} />
                    </article>
                  ))}
                </div>

                <div className={styles.resultsTable}>
                  <div className={styles.tabRow}>
                    {(
                      [
                        ["results", "Results"],
                        ["new", "New Domains"],
                        ["international", "International"],
                      ] as const
                    ).map(([tab, label]) => (
                      <button
                        key={tab}
                        type="button"
                        className={`${styles.tabBtn}${activeTab === tab ? ` ${styles.tabBtnActive}` : ""}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {activeTab === "results" ? (
                    <div className={styles.columns}>
                      <div className={styles.column}>
                        <h3 className={styles.columnTitle}>Suggested</h3>
                        <div className={styles.listGroup}>
                          {suggestedResults.map((result) => (
                            <DomainListRow
                              key={result.domain}
                              result={result}
                              onAdd={handleAddToCart}
                            />
                          ))}
                        </div>
                      </div>

                      <div className={styles.column}>
                        <h3 className={styles.columnTitle}>Premium</h3>
                        <div className={styles.listGroup}>
                          {premiumResults.map((result) => (
                            <DomainListRow
                              key={result.domain}
                              result={result}
                              onAdd={handleAddToCart}
                              showPremiumBadge
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.singleColumn}>
                      <div className={styles.listGroup}>
                        {tabResults.length > 0 ? (
                          tabResults.map((result) => (
                            <DomainListRow
                              key={result.domain}
                              result={result}
                              onAdd={handleAddToCart}
                              showPremiumBadge
                            />
                          ))
                        ) : (
                          <p className={styles.emptyTab}>No domains found for this category.</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <p className={styles.note}>
              Domain availability is checked in real time. Final pricing confirmed at checkout.
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
