import { useMemo, useState } from "react";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import JobModal from "@/components/careers/JobModal";
import { jobs as allJobs, Job } from "@/data/jobs";
import { useRouter } from "next/router";
import Link from "next/link";

type Filters = {
  search?: string;
  department?: string;
  type?: string;
  location?: string;
  view?: "grid" | "list";
};

type FacetItem = { label: string; count: number };
import { getPublicPageBySlug } from "@/services/publicPageService";

type Props = {
  jobs: Job[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  filters: Filters;
  facets: {
    departments: FacetItem[];
    types: FacetItem[];
    locations: FacetItem[];
  };
};

export default function CareersPage({ jobs, currentPage, totalPages, totalCount, filters, facets }: Props) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const router = useRouter();

  const viewMode: "grid" | "list" = filters.view === "list" ? "list" : "grid";

  const activeFiltersLabel = useMemo(() => {
    const parts = [filters.department, filters.type, filters.location].filter(Boolean);
    return parts.length ? parts.join(" • ") : "All roles";
  }, [filters.department, filters.type, filters.location]);

  const buildHref = (next: Partial<Filters> & { page?: number }) => {
    const q: Record<string, string> = {};
    const merged: Filters & { page?: number } = {
      ...filters,
      ...next,
    };

    if (merged.search) q.search = merged.search;
    if (merged.department) q.department = merged.department;
    if (merged.type) q.type = merged.type;
    if (merged.location) q.location = merged.location;
    if (merged.view) q.view = merged.view;
    if (merged.page && merged.page > 1) q.page = String(merged.page);

    return { pathname: "/public/careers", query: q };
  };

  const clearFiltersHref = buildHref({ search: undefined, department: undefined, type: undefined, location: undefined, page: 1 });

  return (
    <div className="container">
      <div className="row">

        {/* SIDEBAR */}
        <div className="col-md-4 col-lg-3">
          <div className="sidebar2 p-t-80 p-b-80 p-r-20">

            {/* SEARCH */}
            <form
              className="search-sidebar2 size12 bo2 pos-relative"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget as HTMLFormElement;
                const value = (form.elements.namedItem("search") as HTMLInputElement | null)?.value ?? "";
                router.push(buildHref({ search: value || undefined, page: 1 }));
              }}
            >
              <input
                name="search"
                defaultValue={filters.search || ""}
                className="input-search-sidebar2 txt10 p-l-20 p-r-55"
                placeholder="Search roles"
              />
              <button className="btn-search-sidebar2 flex-c-m ti-search trans-0-4" aria-label="Search" />
            </form>

            <h4 className="txt33 bo5-b p-b-35 p-t-58">Filters</h4>

            {/* DEPARTMENTS */}
            <div className="p-b-20">
              <h5 className="txt33 p-b-15" style={{ fontSize: 18 }}>
                Department
              </h5>
              <ul>
                <li className="flex-sb-m bo5-b p-t-8 p-b-8">
                  <Link
                    href={buildHref({ department: undefined, page: 1 })}
                    className={`txt27 ${!filters.department ? "color0" : "color1"} color0-hov`}
                    style={{ textDecoration: "none" }}
                  >
                    All
                  </Link>
                  <span className="txt29">({facets.departments.reduce((s, x) => s + x.count, 0)})</span>
                </li>
                {facets.departments.map((d) => (
                  <li key={d.label} className="flex-sb-m bo5-b p-t-8 p-b-8">
                    <Link
                      href={buildHref({ department: d.label, page: 1 })}
                      className={`txt27 ${filters.department === d.label ? "color0" : "color1"} color0-hov`}
                      style={{ textDecoration: "none" }}
                    >
                      {d.label}
                    </Link>
                    <span className="txt29">({d.count})</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* TYPE */}
            <div className="p-b-20">
              <h5 className="txt33 p-b-15" style={{ fontSize: 18 }}>
                Job Type
              </h5>
              <ul>
                <li className="flex-sb-m bo5-b p-t-8 p-b-8">
                  <Link
                    href={buildHref({ type: undefined, page: 1 })}
                    className={`txt27 ${!filters.type ? "color0" : "color1"} color0-hov`}
                    style={{ textDecoration: "none" }}
                  >
                    All
                  </Link>
                  <span className="txt29">({facets.types.reduce((s, x) => s + x.count, 0)})</span>
                </li>
                {facets.types.map((t) => (
                  <li key={t.label} className="flex-sb-m bo5-b p-t-8 p-b-8">
                    <Link
                      href={buildHref({ type: t.label, page: 1 })}
                      className={`txt27 ${filters.type === t.label ? "color0" : "color1"} color0-hov`}
                      style={{ textDecoration: "none" }}
                    >
                      {t.label}
                    </Link>
                    <span className="txt29">({t.count})</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* LOCATION */}
            <div className="p-b-10">
              <h5 className="txt33 p-b-15" style={{ fontSize: 18 }}>
                Location
              </h5>
              <ul>
                <li className="flex-sb-m bo5-b p-t-8 p-b-8">
                  <Link
                    href={buildHref({ location: undefined, page: 1 })}
                    className={`txt27 ${!filters.location ? "color0" : "color1"} color0-hov`}
                    style={{ textDecoration: "none" }}
                  >
                    All
                  </Link>
                  <span className="txt29">({facets.locations.reduce((s, x) => s + x.count, 0)})</span>
                </li>
                {facets.locations.map((l) => (
                  <li key={l.label} className="flex-sb-m bo5-b p-t-8 p-b-8">
                    <Link
                      href={buildHref({ location: l.label, page: 1 })}
                      className={`txt27 ${filters.location === l.label ? "color0" : "color1"} color0-hov`}
                      style={{ textDecoration: "none" }}
                    >
                      {l.label}
                    </Link>
                    <span className="txt29">({l.count})</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bo5-t p-t-20">
              <Link href={clearFiltersHref} className="txt4 color0-hov" style={{ textDecoration: "none" }}>
                Clear filters
              </Link>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <div className="col-md-8 col-lg-9">
          <div className="p-t-80 p-b-80">
            <div className="p-b-40 d-flex align-items-start justify-content-between flex-wrap" style={{ gap: 12 }}>
              <div>
                <h3 className="txt33">Careers</h3>
                <p className="txt14 m-t-10" style={{ marginBottom: 0 }}>
                  {activeFiltersLabel} • {totalCount} open position{totalCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <span className="txt27" style={{ margin: 0 }}>
                  View
                </span>
                <div className="btn-group" role="group" aria-label="Careers view mode">
                  <Link
                    href={buildHref({ view: "grid", page: currentPage })}
                    className={`btn btn-sm ${viewMode === "grid" ? "btn-secondary" : "btn-outline-secondary"}`}
                    aria-pressed={viewMode === "grid"}
                    title="Grid view"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <rect x="3" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="12" y="3" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="3" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                      <rect x="12" y="12" width="5" height="5" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </Link>
                  <Link
                    href={buildHref({ view: "list", page: currentPage })}
                    className={`btn btn-sm ${viewMode === "list" ? "btn-secondary" : "btn-outline-secondary"}`}
                    aria-pressed={viewMode === "list"}
                    title="List view"
                  >
                    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <line x1="3" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="3" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="3" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {jobs.length ? (
              <div className="row">
                {jobs.map((job) => {
                  const colClass = viewMode === "grid" ? "col-sm-6 col-lg-6" : "col-12";
                  return (
                    <div
                      key={job.id}
                      className={`${colClass} p-b-30`}
                      style={viewMode === "list" ? { maxWidth: 980, marginLeft: "auto", marginRight: "auto" } : undefined}
                    >
                      <div
                        className="career-card bo-rad-10 of-hidden"
                        style={{ display: "flex", flexDirection: "column", height: "100%" }}
                      >
                        <div className="p-20" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <div className="d-flex align-items-start justify-content-between" style={{ gap: 12 }}>
                            <h4 className="career-title" style={{ margin: 0 }}>
                              {job.title}
                            </h4>
                            <span className="career-pill">{job.type}</span>
                          </div>

                          <div className="career-meta m-t-15">
                            <span className="career-meta__item">
                              <i className="fa-solid fa-building" aria-hidden="true" />
                              <span>{job.department}</span>
                            </span>
                            <span className="career-meta__item">
                              <i className="fa-solid fa-location-dot" aria-hidden="true" />
                              <span>{job.location}</span>
                            </span>
                          </div>

                          <p
                            className="txt14 m-t-15"
                            style={{
                              marginBottom: 0,
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {job.shortDescription}
                          </p>
                        </div>

                        <div className="career-card__footer">
                          <button
                            className="btn3 flex-c-m txt11 trans-0-4 career-btn"
                            onClick={() => setSelectedJob(job)}
                            type="button"
                          >
                            View Job
                          </button>

                          <button
                            type="button"
                            className="career-apply"
                            onClick={() => setSelectedJob(job)}
                          >
                            Apply <span aria-hidden="true">→</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bo-rad-10" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", padding: 24 }}>
                <h4 className="p-b-10" style={{ margin: 0 }}>No roles found</h4>
                <p className="txt14" style={{ marginBottom: 0 }}>
                  Try adjusting your search or clearing filters.
                </p>
              </div>
            )}

            {/* PAGINATION */}
            <div className="pagination flex-c-m p-t-30">
              {Array.from({ length: totalPages }).map((_, i) => {
                const page = i + 1;
                return (
                  <Link
                    key={page}
                    href={buildHref({ page })}
                    className={`item-pagination flex-c-m trans-0-4 ${page === currentPage ? "active-pagination" : ""}`}
                    style={{ textDecoration: "none" }}
                  >
                    {page}
                  </Link>
                );
              })}
            </div>

            {/* MODAL */}
            {selectedJob && (
              <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

CareersPage.Layout = LandingPageLayout;

export async function getServerSideProps({ query }: any) {
  const PER_PAGE = 6;
  const page = Number(query.page) || 1;
  const rawFilters: Filters = {
    search: typeof query.search === "string" && query.search.trim() ? query.search.trim() : undefined,
    department: typeof query.department === "string" && query.department.trim() ? query.department.trim() : undefined,
    type: typeof query.type === "string" && query.type.trim() ? query.type.trim() : undefined,
    location: typeof query.location === "string" && query.location.trim() ? query.location.trim() : undefined,
    view: query.view === "list" ? "list" : "grid",
  };

  // Next.js props must be JSON-serializable (no `undefined` anywhere).
  const filters = Object.fromEntries(
    Object.entries(rawFilters).filter(([, value]) => value !== undefined)
  ) as Filters;

  const searchLower = (filters.search || "").toLowerCase();
  const searched = !searchLower
    ? allJobs
    : allJobs.filter((job) => {
        const haystack = [
          job.title,
          job.shortDescription,
          job.description,
          job.department,
          job.type,
          job.location,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(searchLower);
      });

  const facetCounts = {
    departments: new Map<string, number>(),
    types: new Map<string, number>(),
    locations: new Map<string, number>(),
  };
  for (const job of searched) {
    facetCounts.departments.set(job.department, (facetCounts.departments.get(job.department) || 0) + 1);
    facetCounts.types.set(job.type, (facetCounts.types.get(job.type) || 0) + 1);
    facetCounts.locations.set(job.location, (facetCounts.locations.get(job.location) || 0) + 1);
  }

  let filtered = searched;
  if (filters.department) filtered = filtered.filter((j) => j.department === filters.department);
  if (filters.type) filtered = filtered.filter((j) => j.type === filters.type);
  if (filters.location) filtered = filtered.filter((j) => j.location === filters.location);

  const start = (page - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  const paginatedJobs = filtered.slice(start, end);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const mapToFacetItems = (m: Map<string, number>) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([label, count]) => ({ label, count }));

  const res = await getPublicPageBySlug("careers");

  return {
    props: {
      jobs: paginatedJobs,
      currentPage: page,
      totalPages,
      totalCount: filtered.length,
      filters,
      facets: {
        departments: mapToFacetItems(facetCounts.departments),
        types: mapToFacetItems(facetCounts.types),
        locations: mapToFacetItems(facetCounts.locations),
      },
      pageData: res.data
    },
  };
}
