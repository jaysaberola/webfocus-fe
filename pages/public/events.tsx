import { useMemo, useState } from "react";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { events, Event } from "@/data/events";
import EventModal from "@/components/events/EventModal";
import { getPublicPageBySlug } from "@/services/publicPageService";

function getDateParts(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) {
    return { day: "--", mon: "--" };
  }

  const day = String(d.getDate()).padStart(2, "0");
  const mon = new Intl.DateTimeFormat(undefined, { month: "short" }).format(d);
  return { day, mon };
}

export default function EventsPage() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");
  const [search, setSearch] = useState<string>("");

  const today = new Date();

  const searchedEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter((event) => {
      const haystack = [
        event.title,
        event.location,
        event.date,
        event.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [search]);

  const counts = useMemo(() => {
    const upcoming = searchedEvents.filter((event) => new Date(event.date) >= today).length;
    const past = searchedEvents.length - upcoming;
    return {
      all: searchedEvents.length,
      upcoming,
      past,
    };
  }, [searchedEvents, today]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") return searchedEvents;
    return searchedEvents.filter((event) => {
      const eventDate = new Date(event.date);
      return filter === "upcoming" ? eventDate >= today : eventDate < today;
    });
  }, [filter, searchedEvents, today]);

  return (
    <div className="container">
      <div className="row">

        {/* SIDEBAR (LEFT) */}
        <div className="col-md-4 col-lg-3">
          <div className="sidebar2 p-t-80 p-b-80 p-r-20">

            {/* SEARCH */}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="search-sidebar2 size12 bo2 pos-relative"
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-search-sidebar2 txt10 p-l-20 p-r-55"
                placeholder="Search"
              />
              <button
                type="button"
                className="btn-search-sidebar2 flex-c-m ti-search trans-0-4"
                aria-label="Search"
                onClick={() => {
                  // keep same behavior as typing (no navigation)
                }}
              />
            </form>

            <h4 className="txt33 bo5-b p-b-35 p-t-58">Filter Events</h4>

            <ul>
              <li className="flex-sb-m bo5-b p-t-8 p-b-8">
                <a
                  className={`txt27 ${filter === "all" ? "color0" : "color1"} color0-hov`}
                  style={{ cursor: "pointer", textDecoration: "none" }}
                  onClick={() => setFilter("all")}
                >
                  All Events
                </a>
                <span className="txt29">({counts.all})</span>
              </li>
              <li className="flex-sb-m bo5-b p-t-8 p-b-8">
                <a
                  className={`txt27 ${filter === "upcoming" ? "color0" : "color1"} color0-hov`}
                  style={{ cursor: "pointer", textDecoration: "none" }}
                  onClick={() => setFilter("upcoming")}
                >
                  Upcoming Events
                </a>
                <span className="txt29">({counts.upcoming})</span>
              </li>
              <li className="flex-sb-m bo5-b p-t-8 p-b-8">
                <a
                  className={`txt27 ${filter === "past" ? "color0" : "color1"} color0-hov`}
                  style={{ cursor: "pointer", textDecoration: "none" }}
                  onClick={() => setFilter("past")}
                >
                  Past Events
                </a>
                <span className="txt29">({counts.past})</span>
              </li>
            </ul>

            {/* INFO BOX */}
            <div className="bo5-t p-t-30">
              <p className="txt14">
                Our events capture moments of collaboration, learning,
                and celebration—both online and in person.
              </p>
            </div>

          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="col-md-8 col-lg-9">
          <div className="p-t-80 p-b-80">

            {/* HEADER */}
            <div className="p-b-50">
              <h3 className="txt33">Events & Highlights</h3>
              <p className="txt14 m-t-10">
                From company gatherings to community workshops,
                explore the moments that shape our journey.
              </p>
            </div>

            {/* EVENT GRID */}
            <div className="row">
              {filteredEvents.map((event) => (
                <div key={event.id} className="col-sm-6 col-lg-4 p-b-40">
                  {(() => {
                    const eventDate = new Date(event.date);
                    const isUpcoming = !Number.isNaN(eventDate.getTime()) && eventDate >= today;
                    const dateParts = getDateParts(event.date);
                    const previewImages = (event.images || []).slice(1, 4);

                    return (
                      <div
                        className="blo4 bo-rad-10 of-hidden h-full event-card-3d"
                        style={{ cursor: "pointer", display: "flex", flexDirection: "column" }}
                        onClick={() => setSelectedEvent(event)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") setSelectedEvent(event);
                        }}
                      >

                        {/* IMAGE PREVIEW */}
                        <div
                          className="hov-img-zoom event-card-3d__layer"
                          style={{ aspectRatio: "16 / 10", width: "100%", overflow: "hidden", position: "relative" }}
                        >
                          <img
                            src={`/images/${event.images[0]}`}
                            alt={event.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                          />

                          {/* DATE BADGE */}
                          <div
                            className="event-card-3d__lift"
                            style={{
                              position: "absolute",
                              top: 14,
                              left: 14,
                              width: 62,
                              height: 62,
                              borderRadius: 14,
                              background: "#ec1d25",
                              color: "#fff",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              lineHeight: 1,
                              boxShadow: "0 10px 25px rgba(0,0,0,0.20)",
                            }}
                          >
                            <div style={{ fontSize: 22, fontWeight: 700 }}>{dateParts.day}</div>
                            <div style={{ fontSize: 12, opacity: 0.95 }}>{dateParts.mon}</div>
                          </div>

                          {/* STATUS PILL */}
                          <div
                            className="event-card-3d__lift"
                            style={{
                              position: "absolute",
                              top: 16,
                              right: 16,
                              padding: "6px 10px",
                              borderRadius: 999,
                              fontSize: 12,
                              fontWeight: 600,
                              letterSpacing: "0.02em",
                              background: isUpcoming ? "rgba(0, 160, 100, 0.90)" : "rgba(80, 80, 80, 0.90)",
                              color: "#fff",
                            }}
                          >
                            {isUpcoming ? "UPCOMING" : "PAST"}
                          </div>

                          {/* SUBTLE OVERLAY */}
                          <div
                            aria-hidden="true"
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "linear-gradient(to top, rgba(0,0,0,0.28), rgba(0,0,0,0) 55%)",
                            }}
                          />
                        </div>

                        {/* CONTENT */}
                        <div className="p-20 event-card-3d__lift" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                          <h4 className="p-b-10" style={{ marginTop: 4 }}>
                            {event.title}
                          </h4>

                          <div className="txt32 p-b-10" style={{ display: "grid", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <i className="fa-regular fa-calendar" aria-hidden="true" />
                              <span>{event.date}</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <i className="fa-solid fa-location-dot" aria-hidden="true" />
                              <span>{event.location}</span>
                            </div>
                          </div>

                          <p
                            className="txt14"
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              marginBottom: 14,
                            }}
                          >
                            {event.description.split("\n")[0]}
                          </p>

                          {previewImages.length ? (
                            <div
                              style={{
                                display: "flex",
                                gap: 8,
                                alignItems: "center",
                                marginTop: "auto",
                              }}
                            >
                              {previewImages.map((img, i) => (
                                <div
                                  key={`${img}-${i}`}
                                  style={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    border: "1px solid rgba(255,255,255,0.0)",
                                    boxShadow: "0 10px 18px rgba(0,0,0,0.12)",
                                    background: "#f2f2f2",
                                  }}
                                >
                                  <img
                                    src={`/images/${img}`}
                                    alt=""
                                    aria-hidden="true"
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                  />
                                </div>
                              ))}
                              <span className="txt4 color0-hov" style={{ marginLeft: "auto" }}>
                                View Details →
                              </span>
                            </div>
                          ) : (
                            <span className="txt4 color0-hov" style={{ marginTop: "auto" }}>
                              View Details →
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })()}
                </div>
              ))}
            </div>

            {/* EMPTY STATE */}
            {filteredEvents.length === 0 && (
              <p className="txt14">No events found.</p>
            )}

          </div>
        </div>

      </div>

      {/* MODAL */}
      {selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}

EventsPage.Layout = LandingPageLayout;

export async function getServerSideProps() {
  try {
    const res = await getPublicPageBySlug("events");
    return { props: { pageData: res.data } };
  } catch {
    return { notFound: true };
  }
}
