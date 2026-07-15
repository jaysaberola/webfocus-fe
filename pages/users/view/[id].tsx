import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import { getUser } from "@/services/userService";
import { toast } from "@/lib/toast";

const INITIAL_LIMIT = 10;

function ViewUser() {
  const router = useRouter();
  const { id } = router.query;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    getUser(Number(id))
      .then((u) => setUser(u))
      .catch(() => toast.error("Failed to load user"))
      .finally(() => setLoading(false));
  }, [id]);

  const statusLabel = (u: any) => {
    const raw = (u?.status ?? u?.is_active ?? u?.active ?? "").toString().toLowerCase();
    if (raw === "active" || raw === "1" || raw === "true") return "Active";
    if (raw === "inactive" || raw === "0" || raw === "false") return "Inactive";
    return u?.status ?? "—";
  };

  const formatAuditSentence = (audit: any) => {
    const model = audit.auditable_type ?? "record";
    const id = audit.auditable_id ? `#${audit.auditable_id}` : "";
    const date = audit.created_at
      ? new Date(audit.created_at).toLocaleString()
      : "unknown time";

    switch (audit.event) {
      case "created":
        return `Created a new ${model} ${id} on ${date}.`;
      case "updated":
        return `Updated ${model} ${id} on ${date}.`;
      case "deleted":
        return `Deleted ${model} ${id} on ${date}.`;
      case "restored":
        return `Restored ${model} ${id} on ${date}.`;
      default:
        return `Performed "${audit.event}" on ${model} ${id} on ${date}.`;
    }
  };

  const allAudits = user?.audits ?? [];
  const visibleAudits = showAll ? allAudits : allAudits.slice(0, INITIAL_LIMIT);
  const hasMore = allAudits.length > INITIAL_LIMIT;

  return (
    <div className="container-fluid px-4 pt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">View User</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => router.back()} type="button">
            Back
          </button>
          {typeof id === "string" && (
            <button className="btn btn-primary" onClick={() => router.push(`/users/edit/${id}`)} type="button">
              Edit
            </button>
          )}
        </div>
      </div>

      {loading && <div className="alert alert-light">Loading...</div>}

      {!loading && !user && <div className="alert alert-warning">User not found.</div>}

      {!loading && user && (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <div className="form-control bg-light">{user.fname ?? "—"}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <div className="form-control bg-light">{user.lname ?? "—"}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <div className="form-control bg-light" style={{ fontFamily: "monospace" }}>
                    {user.email ?? "—"}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Role</label>
                  <div className="form-control bg-light">{user.role ?? "—"}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <div>
                    <span className={`badge ${statusLabel(user) === "Active" ? "bg-success" : "bg-secondary"}`}>
                      {statusLabel(user)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <h6 className="mb-0">Audit Logs</h6>
              <small className="text-muted">{allAudits.length} total</small>
            </div>
            <div className="card-body p-0">
              {allAudits.length === 0 ? (
                <div className="p-3 text-muted">No audit logs found.</div>
              ) : (
                <>
                  <ul className="list-group list-group-flush">
                    {visibleAudits.map((audit: any) => (
                      <li key={audit.id} className="list-group-item d-flex align-items-start gap-3 py-3">
                        <div className="mt-1">
                          <span
                            className={`badge ${
                              audit.event === "created"
                                ? "bg-success"
                                : audit.event === "updated"
                                ? "bg-primary"
                                : audit.event === "deleted"
                                ? "bg-danger"
                                : "bg-secondary"
                            }`}
                          >
                            {audit.event}
                          </span>
                        </div>
                        <div>
                          <div className="text-dark">{formatAuditSentence(audit)}</div>
                          <small className="text-muted">IP: {audit.ip_address ?? "—"}</small>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {hasMore && (
                    <div className="p-3 text-center border-top">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowAll((prev) => !prev)}
                        type="button"
                      >
                        {showAll
                          ? "Show Less"
                          : `Show More (${allAudits.length - INITIAL_LIMIT} more)`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

ViewUser.Layout = AdminLayout;
export default ViewUser;