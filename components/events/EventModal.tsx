import EventGallery from "./EventGallery";
import { Event } from "@/data/events";

type Props = {
  event: Event;
  onClose: () => void;
};

export default function EventModal({ event, onClose }: Props) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        zIndex: 999,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <div
        className="bo-rad-10"
        style={{
          background: "#fff",
          maxWidth: 800,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 30,
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 15,
            right: 15,
            fontSize: 20,
            border: "none",
            background: "transparent",
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        <h3 className="p-b-10">{event.title}</h3>

        <div className="txt32 flex-w p-b-20">
          <span>
            {event.date}
            <span className="m-r-6 m-l-4">|</span>
          </span>
          <span>{event.location}</span>
        </div>

        <EventGallery images={event.images} />

        <div className="p-t-20">
          {event.description
            .split("\n")
            .map((p, i) =>
              p.trim() ? <p key={i} className="m-b-15">{p}</p> : null
            )}
        </div>
      </div>
    </div>
  );
}
