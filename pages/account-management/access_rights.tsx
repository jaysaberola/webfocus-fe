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

function ManageAccessRights() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [assigned, setAssigned] = useState<Record<number, number[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState("")

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

  const groupedPermissions = useMemo(() => {
    return permissions.reduce((acc: Record<string, Permission[]>, perm) => {
      acc[perm.module] = acc[perm.module] || []
      acc[perm.module].push(perm)
      return acc
    }, {})
  }, [permissions])

  const filteredGroupedPermissions = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return groupedPermissions

    return Object.entries(groupedPermissions).reduce((acc, [module, modulePermissions]) => {
      const filtered = modulePermissions.filter((perm) =>
        perm.label.toLowerCase().includes(query) ||
        module.toLowerCase().includes(query)
      )
      if (filtered.length > 0) acc[module] = filtered
      return acc
    }, {} as Record<string, Permission[]>)
  }, [groupedPermissions, search])

  const moduleCount = Object.keys(groupedPermissions).length
  const assignedCount = useMemo(
    () => Object.values(assigned).reduce((sum, ids) => sum + ids.length, 0),
    [assigned]
  )

  if (loading) {
    return (
      <CmsModuleShell
        title="Manage Access Rights"
        description="Configure which permissions each role can access across CMS modules."
        icon="fa-solid fa-key"
      >
        <div className="text-center py-5 text-muted">Loading permissions...</div>
      </CmsModuleShell>
    )
  }

  return (
    <CmsModuleShell
      title="Manage Access Rights"
      description="Configure which permissions each role can access across CMS modules."
      icon="fa-solid fa-key"
      stats={[
        { label: "Roles", value: roles.length, tone: "accent" },
        { label: "Modules", value: moduleCount },
        { label: "Permissions", value: permissions.length },
        { label: "Assigned", value: assignedCount },
      ]}
      toolbar={(
        <div className="input-group">
          <span className="input-group-text">
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          </span>
          <input
            className="form-control"
            placeholder="Search modules or permissions"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      )}
    >
      <CmsSettingsLayout>
        {Object.keys(filteredGroupedPermissions).length === 0 ? (
          <CmsSettingsSection
            title="No Results"
            description="Try a different search term to find permissions."
            icon="fa-solid fa-magnifying-glass"
          >
            <div className="text-muted py-3">No permissions matched your search.</div>
          </CmsSettingsSection>
        ) : (
          Object.entries(filteredGroupedPermissions).map(([module, modulePermissions]) => (
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
                              onChange={() => togglePermission(role.id, perm.id)}
                            />
                            <span>{role.name}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CmsSettingsSection>
          ))
        )}

        <CmsSettingsFooter onSave={saveChanges} saveLabel="Save Access Rights" saving={saving} />
      </CmsSettingsLayout>
    </CmsModuleShell>
  )
}

ManageAccessRights.Layout = AdminLayout
export default ManageAccessRights
