import { useMemo, useState } from "react";
import DataTable, { Column } from "@/components/UI/DataTable";
import AuditChangesModal from "@/components/UI/AuditChangesModal";
import { CmsModuleDate } from "@/components/Modules/moduleTableUi";

export type AuditLogRow = {
  id: number;
  event: string;
  auditable_type: string;
  auditable_id: number;
  old_values?: Record<string, any> | string | null;
  new_values?: Record<string, any> | string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  user?: {
    fname?: string;
    lname?: string;
    email?: string;
  };
};

type AuditLogsTableProps = {
  audits: AuditLogRow[];
  loading?: boolean;
  emptyMessage?: string;
  showUserColumn?: boolean;
  currentPage?: number;
  totalPages?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
};

function normalizeAuditValues(values?: Record<string, any> | string | null): Record<string, any> {
  if (!values) return {};
  if (typeof values === "string") {
    try {
      const parsed = JSON.parse(values);
      return parsed && typeof parsed === "object" ? parsed : { value: values };
    } catch {
      return { value: values };
    }
  }
  return values;
}

function humanizeKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getChangedFields(oldValues?: Record<string, any> | string | null, newValues?: Record<string, any> | string | null) {
  const oldRecord = normalizeAuditValues(oldValues);
  const newRecord = normalizeAuditValues(newValues);
  const keys = new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]);
  const changed: string[] = [];

  for (const key of keys) {
    const oldValue = oldRecord[key];
    const newValue = newRecord[key];
    if (JSON.stringify(oldValue ?? null) !== JSON.stringify(newValue ?? null)) {
      changed.push(key);
    }
  }

  return changed;
}

const CMS_MODULE_LABELS: Record<string, string> = {
  ArticleCategory: "News Category",
  Article: "News Article",
  Page: "Page",
  Menu: "Menu",
  Album: "Album",
  Banner: "Banner",
  Product: "Product",
  ProductCategory: "Product Category",
  Coupon: "Coupon",
  JobOrder: "Job Order",
  Setting: "Website Setting",
  LayoutPreset: "Layout Preset",
  SocialMediaAccount: "Social Media",
  CmsActivityLog: "CMS Activity",
};

function moduleLabel(auditableType: string) {
  const short = auditableType.split("\\").pop() || auditableType;
  return CMS_MODULE_LABELS[short] ?? short.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function performerLabel(row: AuditLogRow) {
  if (!row.user) return "System";
  const name = `${row.user.fname ?? ""} ${row.user.lname ?? ""}`.trim();
  if (name) return name;
  return row.user.email || "CMS User";
}

function eventBadgeClass(event: string) {
  const value = event.toLowerCase();
  if (value === "created") return "bg-success";
  if (value === "deleted") return "bg-danger";
  if (value === "updated") return "bg-primary";
  if (value === "restored") return "bg-warning text-dark";
  return "bg-secondary";
}

export default function AuditLogsTable({
  audits,
  loading = false,
  emptyMessage = "No audit logs found.",
  showUserColumn = false,
  currentPage,
  totalPages,
  perPage,
  onPageChange,
  onPerPageChange,
}: AuditLogsTableProps) {
  const [selectedAudit, setSelectedAudit] = useState<AuditLogRow | null>(null);

  const columns = useMemo<Column<AuditLogRow>[]>(() => {
    const base: Column<AuditLogRow>[] = [
      {
        key: "event",
        header: "Action",
        width: 110,
        thClassName: "text-nowrap text-center",
        tdClassName: "align-top text-center",
        render: (row) => (
          <span className={`badge text-uppercase ${eventBadgeClass(row.event)}`}>{row.event}</span>
        ),
      },
    ];

    if (showUserColumn) {
      base.push({
        key: "user",
        header: "Performed By",
        width: 160,
        thClassName: "text-nowrap text-center",
        tdClassName: "align-top text-center",
        render: (row) => {
          const label = performerLabel(row);
          const email = row.user?.email?.trim();
          return (
            <div className="small">
              <div className="fw-semibold">{label}</div>
              {email && label !== email ? <div className="text-muted">{email}</div> : null}
            </div>
          );
        },
      });
    }

    base.push(
      {
        key: "auditable_type",
        header: "Module",
        minWidth: 140,
        thClassName: "text-nowrap",
        tdClassName: "align-top text-nowrap",
        render: (row) => moduleLabel(row.auditable_type),
      },
      {
        key: "auditable_id",
        header: "Record",
        width: 96,
        thClassName: "text-nowrap text-center",
        tdClassName: "align-top text-center",
        render: (row) => `#${row.auditable_id}`,
      },
      {
        key: "changes",
        header: "Changed Fields",
        minWidth: 260,
        tdClassName: "align-top",
        render: (row) => {
          const changedFields = getChangedFields(row.old_values, row.new_values);
          if (changedFields.length === 0) {
            return <span className="text-muted small">No field changes recorded</span>;
          }

          return (
            <div className="small">
              <div className="fw-semibold mb-1">{changedFields.length} field{changedFields.length === 1 ? "" : "s"} changed</div>
              <div className="d-flex flex-wrap gap-1">
                {changedFields.slice(0, 6).map((field) => (
                  <span key={field} className="badge bg-light text-dark border">
                    {humanizeKey(field)}
                  </span>
                ))}
                {changedFields.length > 6 ? (
                  <span className="badge bg-secondary-subtle text-secondary">+{changedFields.length - 6} more</span>
                ) : null}
              </div>
            </div>
          );
        },
      },
      {
        key: "created_at",
        header: "Date",
        width: 170,
        thClassName: "text-nowrap text-center",
        tdClassName: "align-top text-center text-nowrap",
        render: (row) => <CmsModuleDate value={new Date(row.created_at).toLocaleString()} />,
      },
      {
        key: "ip_address",
        header: "IP",
        width: 130,
        thClassName: "text-nowrap text-center",
        tdClassName: "align-top text-center text-nowrap small text-muted",
        render: (row) => row.ip_address || "—",
      },
      {
        key: "details",
        header: "Details",
        width: 110,
        thClassName: "text-nowrap text-center",
        tdClassName: "align-top text-center",
        render: (row) => (
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={() => setSelectedAudit(row)}
          >
            View
          </button>
        ),
      }
    );

    return base;
  }, [showUserColumn]);

  if (!loading && audits.length === 0) {
    return <div className="p-3 text-muted">{emptyMessage}</div>;
  }

  const modelLabel = selectedAudit ? moduleLabel(selectedAudit.auditable_type) : "Record";

  return (
    <>
      <DataTable<AuditLogRow>
        columns={columns}
        data={audits}
        loading={loading}
        wrapperClassName="cms-table-wrap cms-table-wrap--scroll cms-table-wrap--audit"
        tableClassName="dt-enhanced-table dt-enhanced-table--audit"
        getRowId={(row) => row.id}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        itemsPerPage={perPage}
        onItemsPerPageChange={onPerPageChange}
        stickyHeader
        wrapperStyle={{ maxHeight: "70vh", overflowY: "auto", overflowX: "auto" }}
      />

      <AuditChangesModal
        show={Boolean(selectedAudit)}
        title={selectedAudit ? `${humanizeKey(selectedAudit.event)} ${modelLabel}` : "Audit Details"}
        subtitle={
          selectedAudit ? (
            <>
              Record #{selectedAudit.auditable_id} · {new Date(selectedAudit.created_at).toLocaleString()}
              {selectedAudit.ip_address ? ` · IP ${selectedAudit.ip_address}` : ""}
            </>
          ) : null
        }
        oldValues={normalizeAuditValues(selectedAudit?.old_values)}
        newValues={normalizeAuditValues(selectedAudit?.new_values)}
        onClose={() => setSelectedAudit(null)}
      />
    </>
  );
}
