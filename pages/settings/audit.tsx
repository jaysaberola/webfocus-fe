import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import SearchBar from "@/components/UI/SearchBar";
import { getAuditTrails, AuditRow } from "@/services/auditService";
import AuditLogsTable from "@/components/UI/AuditLogsTable";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import { CmsSettingsLayout, CmsSettingsSection } from "@/components/Modules/CmsSettingsForm";

function AuditTrailsPage() {
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

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

  useEffect(() => {
    const timeout = setTimeout(fetchAudits, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  return (
    <CmsModuleShell
      title="Manage Audit Trail"
      description="Review system activity and track old and new values for every CMS change."
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
          description="Each row shows what changed. Click View to open the full old vs new comparison."
          icon="fa-solid fa-list-check"
        >
          <AuditLogsTable
            audits={audits}
            loading={loading}
            showUserColumn
            currentPage={currentPage}
            totalPages={totalPages}
            perPage={perPage}
            onPageChange={setCurrentPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setCurrentPage(1);
            }}
          />
        </CmsSettingsSection>
      </CmsSettingsLayout>
    </CmsModuleShell>
  );
}

AuditTrailsPage.Layout = AdminLayout;
export default AuditTrailsPage;
