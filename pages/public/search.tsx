import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { searchSite, SearchSiteResponse } from "@/services/searchService";

export default function PublicSearchPage() {
  const router = useRouter();
  const qRaw = router.query.q;
  const q = Array.isArray(qRaw) ? qRaw.join(" ") : (qRaw || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchSiteResponse | null>(null);
  const [origin, setOrigin] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") setOrigin(window.location.origin);

    if (!q || typeof q !== "string" || q.trim() === "") {
      setResults(null);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    searchSite(q)
      .then((res) => {
        if (!mounted) return;
        setResults(res);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error(err);
        setError("Failed to fetch search results.");
      })
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [q]);

  return (
    <div className="container my-4">
      <h3>Search results</h3>

      {!q || q.toString().trim() === "" ? (
        <div className="alert alert-info">Enter a search query in the topbar.</div>
      ) : (
        <>
          <p className="text-muted">Results for <strong>{q}</strong></p>

          {loading && <div className="mb-3">Loading results...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {!loading && results && (
            <div>
              <section className="mb-4">
                <h5>Pages</h5>
                {results.pages.length === 0 ? (
                  <div className="text-muted">No pages found.</div>
                ) : (
                  <ul className="list-group">
                    {results.pages.map((p) => {
                      const href = p.url || (p.slug ? `/public/${p.slug}` : "#");
                      const fullHref = href.startsWith("http") || !origin ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
                      return (
                        <li key={p.id ?? p.slug} className="list-group-item">
                          <Link href={href}>{p.title || p.slug}</Link>
                          <div className="small text-muted">
                            <a href={fullHref} target="_blank" rel="noopener noreferrer">{fullHref}</a>
                          </div>
                          {p.excerptHtml ? (
                            <div className="text-muted small" dangerouslySetInnerHTML={{ __html: p.excerptHtml }} />
                          ) : (
                            p.excerpt && <div className="text-muted small">{p.excerpt}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <section className="mb-4">
                <h5>Articles</h5>
                {results.articles.length === 0 ? (
                  <div className="text-muted">No articles found.</div>
                ) : (
                  <ul className="list-group">
                    {results.articles.map((a) => {
                      const href = a.url || (a.slug ? `/news/${a.slug}` : "#");
                      const fullHref = href.startsWith("http") || !origin ? href : `${origin}${href.startsWith("/") ? "" : "/"}${href}`;
                      return (
                        <li key={a.id ?? a.slug} className="list-group-item">
                          <Link href={href}>{a.title}</Link>
                          <div className="small text-muted">
                            <a href={fullHref} target="_blank" rel="noopener noreferrer">{fullHref}</a>
                          </div>
                          {a.excerptHtml ? (
                            <div className="text-muted small" dangerouslySetInnerHTML={{ __html: a.excerptHtml }} />
                          ) : (
                            a.excerpt && <div className="text-muted small">{a.excerpt}</div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* "Other results" removed per request */}
            </div>
          )}
        </>
      )}
    </div>
  );
}

PublicSearchPage.Layout = LandingPageLayout;
