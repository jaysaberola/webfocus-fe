type Props = {
  job: any;
  onClose: () => void;
};

export default function JobModal({ job, onClose }: Props) {
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
          maxWidth: 700,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: 30,
          position: "relative",
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 15,
            right: 15,
            border: "none",
            background: "transparent",
            fontSize: 20,
            cursor: "pointer",
          }}
        >
          ✕
        </button>

        {/* JOB DETAILS */}
        <h3 className="p-b-10">{job.title}</h3>

        <div className="txt32 flex-w p-b-20">
          <span>
            {job.department}
            <span className="m-r-6 m-l-4">|</span>
          </span>
          <span>
            {job.type}
            <span className="m-r-6 m-l-4">|</span>
          </span>
          <span>{job.location}</span>
        </div>

        {job.description
          .split("\n")
          .map((p: string, i: number) =>
            p.trim() ? <p key={i} className="m-b-15">{p}</p> : null
          )}

        {/* APPLICATION FORM */}
        <div className="p-t-30">
          <h4 className="txt33 p-b-14">Apply for this position</h4>

          <div className="size30 bo2 bo-rad-10 m-b-15">
            <input
              className="bo-rad-10 sizefull txt10 p-l-20"
              placeholder="Full Name"
            />
          </div>

          <div className="size30 bo2 bo-rad-10 m-b-15">
            <input
              className="bo-rad-10 sizefull txt10 p-l-20"
              placeholder="Email Address"
            />
          </div>

          <div className="size30 bo2 bo-rad-10 m-b-15">
            <input
              className="bo-rad-10 sizefull txt10 p-l-20"
              placeholder="LinkedIn / Portfolio URL"
            />
          </div>

          <textarea
            className="bo-rad-10 size29 bo2 txt10 p-l-20 p-t-15 m-b-20"
            placeholder="Cover Letter"
          />

          <button className="btn3 flex-c-m size31 txt11 trans-0-4">
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}
