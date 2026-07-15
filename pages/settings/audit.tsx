import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import { getAuditTrails, AuditRow } from "@/services/auditService";
import {
  looksLikeHtmlValue,
  looksLikeImageValue,
  HtmlPreview,
  ImagePreview,
} from "@/components/UI/AuditChangesModal";

function AuditTrailsPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  /* ======================
   * Fetch Audit Trails
   * ====================== */
  const fetchAudits = async () => {
    try {
      setLoading(true);

      const res = await getAuditTrails({
        search,
        page: currentPage,
        per_page: perPage,
      });

      const payload: any = res?.data;

      const items: AuditRow[] = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];

      const nextTotalPages =
        Number(payload?.last_page ?? payload?.meta?.last_page ?? payload?.data?.last_page ?? payload?.data?.meta?.last_page) || 1;
      const nextCurrentPage =
        Number(payload?.current_page ?? payload?.meta?.current_page ?? payload?.data?.current_page ?? payload?.data?.meta?.current_page) ||
        currentPage;

      setAudits(items);
      setTotalPages(nextTotalPages);
      setCurrentPage(Math.min(Math.max(1, nextCurrentPage), nextTotalPages));
    } catch (err) {
      console.error("Failed to load audit trails", err);
    } finally {
      setLoading(false);
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const timeout = setTimeout(fetchAudits, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  /* ======================
   * Render Cell Values
   * ====================== */
  const renderCellValues = (values?: Record<string, any>) => {
    if (!values || Object.keys(values).length === 0)
      return <span className="text-muted">—</span>;

    const entries = Object.entries(values);

    for (const [key, val] of entries) {
      if (typeof val === "string") {
        if (looksLikeHtmlValue(key, val)) {
          return (
            <div style={{ width: 400 }}>
              <HtmlPreview html={val} height={250} zoomable={true} />
            </div>
          );
        }
        if (looksLikeImageValue(key, val)) {
          return <ImagePreview fieldKey={key} value={val} />;
        }
      }
    }

    return (
      <div className="small text-muted text-break text-center">
        {entries
          .slice(0, 2)
          .map(([k, v]) => `${k}: ${String(v ?? "").slice(0, 40)}`)
          .join(" • ")}
      </div>
    );
  };

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<AuditRow>[] = [
    {
      key: "event",
      header: "Action",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-nowrap text-center",
      width: 110,
      render: (row) => (
        <span
          className={`badge text-uppercase ${
            row.event?.toLowerCase() === "created"
              ? "bg-success"
              : row.event?.toLowerCase() === "deleted"
                ? "bg-danger"
                : row.event?.toLowerCase() === "updated"
                  ? "bg-primary"
                  : "bg-secondary"
          }`}
        >
          {row.event}
        </span>
      ),
    },
    {
      key: "user",
      header: "Performed By",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
      width: 160,
      render: (row) =>
        row.user
          ? `${row.user.fname ?? ""} ${row.user.lname ?? ""}` || row.user.email
          : "System",
    },
    {
      key: "auditable_type",
      header: "Model",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-nowrap text-center",
      width: 120,
      render: (row) => row.auditable_type.split("\\").pop(),
    },
    {
      key: "old_values",
      header: "From",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
      render: (row) => renderCellValues(row.old_values),
    },
    {
      key: "new_values",
      header: "To",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
      render: (row) => renderCellValues(row.new_values),
    },
    {
      key: "created_at",
      header: "Date",
      thClassName: "text-nowrap text-center",
      tdClassName: "align-top text-center",
      render: (row) => new Date(row.created_at).toLocaleString(),
    },
  ];

  /* ======================
   * UI
   * ====================== */
  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3 text-dark">Audit Trail</h3>

      <div className="row g-2 align-items-center mb-3">
        <div className="col-12 col-md d-flex justify-content-md-end">
          <div className="input-group input-group-sm w-100" style={{ maxWidth: 340 }}>
            <span className="input-group-text">
              <i className="fas fa-magnifying-glass" />
            </span>
            <input
              className="form-control"
              placeholder="Search audit logs"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <DataTable<AuditRow>
        columns={columns}
        data={audits}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => { setPerPage(n); setCurrentPage(1); }}
        wrapperClassName="rounded border bg-white"
        tableClassName="table-sm table-striped table-hover align-middle"
        stickyHeader
        wrapperStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
      />
    </div>
  );
}

AuditTrailsPage.Layout = AdminLayout;
export default AuditTrailsPage;