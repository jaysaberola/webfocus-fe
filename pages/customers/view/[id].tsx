import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useRouter } from "next/router";
import { getCustomer } from "@/services/customerService";
import { toast } from "@/lib/toast";
import { readCustomerDetailCache, writeCustomerDetailCache } from "@/lib/customerCache";

const INITIAL_LIMIT = 10;

function ViewCustomer() {
  const router = useRouter();
  const { id } = router.query;

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!id) return;

    const customerId = Number(id);
    const cachedCustomer = readCustomerDetailCache(customerId);
    if (cachedCustomer) setCustomer(cachedCustomer);

    setHasRequested(false);
    setLoading(!cachedCustomer);
    getCustomer(customerId, { silent: Boolean(cachedCustomer) })
      .then((u) => {
        setCustomer(u);
        writeCustomerDetailCache(u);
      })
      .catch(() => toast.error("Failed to load customer"))
      .finally(() => {
        setHasRequested(true);
        setLoading(false);
      });
  }, [id]);

  const statusLabel = (u: any) => {
    const raw = (u?.status ?? u?.is_active ?? u?.active ?? "").toString().toLowerCase();
    if (raw === "active" || raw === "1" || raw === "true") return "Active";
    if (raw === "inactive" || raw === "0" || raw === "false") return "Inactive";
    return u?.status ?? "-";
  };

  const formatAuditSentence = (audit: any) => {
    const model = audit.auditable_type ?? "record";
    const auditId = audit.auditable_id ? `#${audit.auditable_id}` : "";
    const date = audit.created_at
      ? new Date(audit.created_at).toLocaleString()
      : "unknown time";

    switch (audit.event) {
      case "created":
        return `Created a new ${model} ${auditId} on ${date}.`;
      case "updated":
        return `Updated ${model} ${auditId} on ${date}.`;
      case "deleted":
        return `Deleted ${model} ${auditId} on ${date}.`;
      case "restored":
        return `Restored ${model} ${auditId} on ${date}.`;
      default:
        return `Performed "${audit.event}" on ${model} ${auditId} on ${date}.`;
    }
  };

  const allAudits = customer?.audits ?? [];
  const visibleAudits = showAll ? allAudits : allAudits.slice(0, INITIAL_LIMIT);
  const hasMore = allAudits.length > INITIAL_LIMIT;
  const firstName = customer?.fname ?? customer?.name ?? "-";

  return (
    <div className="container-fluid px-4 pt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h3 className="mb-0">View Customer</h3>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-secondary" onClick={() => router.push("/customers")} type="button">
            Back
          </button>
          {typeof id === "string" && (
            <button className="btn btn-primary" onClick={() => router.push(`/customers/edit/${id}`)} type="button">
              Edit
            </button>
          )}
        </div>
      </div>

      {loading && <div className="alert alert-light">Loading...</div>}

      {hasRequested && !loading && !customer && <div className="alert alert-warning">Customer not found.</div>}

      {!loading && customer && (
        <>
          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">First Name</label>
                  <div className="form-control bg-light">{firstName}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Last Name</label>
                  <div className="form-control bg-light">{customer.lname ?? "-"}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <div className="form-control bg-light" style={{ fontFamily: "monospace" }}>
                    {customer.email ?? "-"}
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Type</label>
                  <div className="form-control bg-light">{customer.type ?? "Customer"}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date Registered</label>
                  <div className="form-control bg-light">{customer.date_registered ?? "-"}</div>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <div>
                    <span className={`badge ${statusLabel(customer) === "Active" ? "bg-success" : "bg-secondary"}`}>
                      {statusLabel(customer)}
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
                          <small className="text-muted">IP: {audit.ip_address ?? "-"}</small>
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

ViewCustomer.Layout = AdminLayout;
export default ViewCustomer;
