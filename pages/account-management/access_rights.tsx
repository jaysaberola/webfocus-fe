import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/Layout/AdminLayout"
import PermissionService, {
  Role,
  Permission
} from "@/services/permissionService"
import { toast } from "@/lib/toast";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsSettingsFooter,
  CmsSettingsLayout,
  CmsSettingsSection,
} from "@/components/Modules/CmsSettingsForm";
import {
  filterGroupedPermissions,
  filterPermissionsByArea,
  groupPermissionsByModule,
  type AccessRightsArea,
} from "@/lib/accessRightsCatalog";

type AccessRightsTab = AccessRightsArea;

const ACCESS_RIGHTS_TABS: Array<{
  id: AccessRightsTab;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: "cms",
    label: "CMS Modules",
    icon: "fa-solid fa-layer-group",
    description: "Dashboard, pages, banners, files, menu, news, users, and account management.",
  },
  {
    id: "commerce",
    label: "Commerce Control Center",
    icon: "fa-solid fa-store",
    description: "Clients, transactions, approvals, catalog, notifications, helpdesk, and reports.",
  },
];

function PermissionMatrixPanel({
  roles,
  assigned,
  groupedPermissions,
  onTogglePermission,
}: {
  roles: Role[];
  assigned: Record<number, number[]>;
  groupedPermissions: Record<string, Permission[]>;
  onTogglePermission: (roleId: number, permissionId: number) => void;
}) {
  if (Object.keys(groupedPermissions).length === 0) {
    return (
      <CmsSettingsSection
        title="No Results"
        description="Try a different search term to find permissions."
        icon="fa-solid fa-magnifying-glass"
      >
        <div className="text-muted py-3">No permissions matched your search.</div>
      </CmsSettingsSection>
    );
  }

  return (
    <>
      {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
        <CmsSettingsSection
          key={module}
          title={module}
          description={`${modulePermissions.length} permission${modulePermissions.length === 1 ? "" : "s"} in this module`}
          icon="fa-solid fa-folder-tree"
        >
          <div className="cms-access-module-stack">
            {modulePermissions.map((perm) => (
              <div className="cms-access-perm-row" key={perm.id}>
                <div className="cms-access-perm-row__label">{perm.label}</div>
                <div className="cms-access-perm-row__roles">
                  {roles.map((role) => {
                    const checked = assigned[role.id]?.includes(perm.id) || false
                    return (
                      <label
                        key={role.id}
                        className={`cms-access-role-toggle${checked ? " is-checked" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => onTogglePermission(role.id, perm.id)}
                        />
                        <span>{role.label || role.description || role.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CmsSettingsSection>
      ))}
    </>
  );
}

function ManageAccessRights() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [assigned, setAssigned] = useState<Record<number, number[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<AccessRightsTab>("cms")

  useEffect(() => {
    PermissionService.getMatrix()
      .then(data => {
        setRoles(data.roles)
        setPermissions(data.permissions)
        setAssigned(data.assigned)
      })
      .finally(() => setLoading(false))
  }, [])

  const togglePermission = (roleId: number, permissionId: number) => {
    setAssigned(prev => {
      const current = prev[roleId] || []
      return {
        ...prev,
        [roleId]: current.includes(permissionId)
          ? current.filter(id => id !== permissionId)
          : [...current, permissionId]
      }
    })
  }

  const saveChanges = async () => {
    try {
      setSaving(true)
      await PermissionService.syncMatrix(assigned)
      toast.success("Permissions updated successfully")
    } catch {
      toast.error("Failed to update permissions")
    } finally {
      setSaving(false)
    }
  }

  const cmsPermissions = useMemo(
    () => filterPermissionsByArea(permissions, "cms"),
    [permissions]
  );

  const commercePermissions = useMemo(
    () => filterPermissionsByArea(permissions, "commerce"),
    [permissions]
  );

  const activePermissions = activeTab === "cms" ? cmsPermissions : commercePermissions;

  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(activePermissions),
    [activePermissions]
  );

  const filteredGroupedPermissions = useMemo(
    () => filterGroupedPermissions(groupedPermissions, search),
    [groupedPermissions, search]
  );

  const activeTabMeta = ACCESS_RIGHTS_TABS.find((tab) => tab.id === activeTab)!;

  const assignedCountForTab = useMemo(() => {
    const ids = new Set(activePermissions.map((perm) => perm.id));
    return Object.values(assigned).reduce(
      (sum, roleIds) => sum + roleIds.filter((id) => ids.has(id)).length,
      0
    );
  }, [activePermissions, assigned]);

  if (loading) {
    return (
      <CmsModuleShell
        title="Manage Access Rights"
        description="Configure CMS and Commerce Control Center permissions for each role."
        icon="fa-solid fa-key"
      >
        <div className="text-center py-5 text-muted">Loading permissions...</div>
      </CmsModuleShell>
    )
  }

  return (
    <CmsModuleShell
      title="Manage Access Rights"
      description="Configure CMS module and Commerce Control Center permissions for each role."
      icon="fa-solid fa-key"
      stats={[
        { label: "Roles", value: roles.length, tone: "accent" },
        { label: "CMS Permissions", value: cmsPermissions.length },
        { label: "Commerce Permissions", value: commercePermissions.length },
        { label: "Assigned Here", value: assignedCountForTab },
      ]}
      toolbar={(
        <div className="input-group">
          <span className="input-group-text">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </span>
          <input
            className="form-control"
            placeholder={`Search ${activeTabMeta.label.toLowerCase()}...`}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
    >
      <CmsSettingsLayout>
        <CmsSettingsSection
          title="Permission Areas"
          description="Switch between CMS portal modules and Commerce Control Center modules."
          icon="fa-solid fa-table-columns"
        >
          <div className="cms-settings-tabs cms-access-area-tabs" role="tablist" aria-label="Access rights areas">
            {ACCESS_RIGHTS_TABS.map((tab) => {
              const count = tab.id === "cms" ? cmsPermissions.length : commercePermissions.length;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`cms-settings-tabs__btn${isActive ? " is-active" : ""}`}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSearch("");
                  }}
                >
                  <i className={tab.icon} aria-hidden="true" />
                  {tab.label}
                  <span className="cms-access-area-tabs__count">{count}</span>
                </button>
              );
            })}
          </div>
          <p className="cms-access-area-tabs__hint mb-0">{activeTabMeta.description}</p>
        </CmsSettingsSection>

        <PermissionMatrixPanel
          roles={roles}
          assigned={assigned}
          groupedPermissions={filteredGroupedPermissions}
          onTogglePermission={togglePermission}
        />

        <CmsSettingsFooter onSave={saveChanges} saveLabel="Save Access Rights" saving={saving} />
      </CmsSettingsLayout>
    </CmsModuleShell>
  )
}

ManageAccessRights.Layout = AdminLayout
export default ManageAccessRights
