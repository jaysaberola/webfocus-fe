import { useEffect, useState } from "react"
import AdminLayout from "@/components/Layout/AdminLayout"
import PermissionService, {
  Role,
  Permission
} from "@/services/permissionService"
import { toast } from "@/lib/toast";

function ManageAccessRights() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [assigned, setAssigned] = useState<Record<number, number[]>>({})
  const [loading, setLoading] = useState(true)

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
    await PermissionService.syncMatrix(assigned)
    toast.success("Permissions updated successfully")
  }

  const groupedPermissions = permissions.reduce((acc: any, perm) => {
    acc[perm.module] = acc[perm.module] || []
    acc[perm.module].push(perm)
    return acc
  }, {})

  if (loading) {
    return <div className="text-center py-5">Loading permissions...</div>
  }

  return (
    <div className="container-fluid px-4 pt-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Manage Access Rights</h3>
        <button className="btn btn-primary" onClick={saveChanges}>
          Save Changes
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-bordered align-middle">
          <thead className="table-primary">
            <tr>
              <th style={{ width: 350 }}>Module</th>
              {roles.map(role => (
                <th key={role.id} className="text-center">
                  {role.name.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {Object.keys(groupedPermissions).map(module => (
              <>
                <tr key={module} className="table-light fw-bold">
                  <td colSpan={roles.length + 1}>{module}</td>
                </tr>

                {groupedPermissions[module].map((perm: Permission) => (
                  <tr key={perm.id}>
                    <td>{perm.label}</td>
                    {roles.map(role => (
                      <td key={role.id} className="text-center">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={assigned[role.id]?.includes(perm.id) || false}
                          onChange={() =>
                            togglePermission(role.id, perm.id)
                          }
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

ManageAccessRights.Layout = AdminLayout
export default ManageAccessRights