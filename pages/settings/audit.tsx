import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { getAuditTrails, AuditRow } from "@/services/auditService";
import {
  looksLikeHtmlValue,
  looksLikeImageValue,
  HtmlPreview,
  ImagePreview,
} from "@/components/UI/AuditChangesModal";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import { CmsSettingsLayout, CmsSettingsSection } from "@/components/Modules/CmsSettingsForm";
import { CmsModuleDate, cmsModuleTableProps } from "@/components/Modules/moduleTableUi";

function AuditTrailsPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(5);

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
          ? `${row.user.fname ?? ""} ${row.user.lname ?? ""}`.trim() || row.user.email
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
      render: (row) => <CmsModuleDate value={new Date(row.created_at).toLocaleString()} />,
    },
  ];

  /* ======================
   * UI
   * ====================== */
  return (
    <CmsModuleShell
      title="Manage Audit Trail"
      description="Review system activity and track changes made across the CMS."
      icon="fa-solid fa-clock-rotate-left"
      stats={[
        { label: "Showing", value: audits.length },
        { label: "Page", value: `${currentPage} / ${totalPages}` },
      ]}
      toolbar={(
        <SearchBar
          placeholder="Search audit logs"
          value={search}
          onChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          showDeletedToggle={false}
        />
      )}
    >
      <CmsSettingsLayout>
        <CmsSettingsSection
          title="Activity Log"
          description="Search and review recent create, update, and delete actions across the CMS."
          icon="fa-solid fa-list-check"
        >
          <DataTable<AuditRow>
            columns={columns}
            data={audits}
            loading={loading}
            {...cmsModuleTableProps}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={perPage}
            onItemsPerPageChange={(n: number) => { setPerPage(n); setCurrentPage(1); }}
            stickyHeader
            wrapperStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "hidden" }}
          />
        </CmsSettingsSection>
      </CmsSettingsLayout>
    </CmsModuleShell>
  );
}

AuditTrailsPage.Layout = AdminLayout;
export default AuditTrailsPage;
