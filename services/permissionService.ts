import { axiosInstance } from "@/services/axios"

/* =======================
 * Types
 * ======================= */

export type Role = {
  id: number
  name: string
}

export type Permission = {
  id: number
  name: string
  module: string
  label: string
}

export type PermissionMatrixResponse = {
  roles: Role[]
  permissions: Permission[]
  assigned: Record<number, number[]>
}

/* =======================
 * API Calls
 * ======================= */

const PermissionService = {
  /**
   * Get permissions matrix (roles + permissions + assignments)
   */
  getMatrix(): Promise<PermissionMatrixResponse> {
    return axiosInstance.get("/permissions/matrix")
      .then(res => res.data)
  },

  /**
   * Sync permissions per role
   */
  syncMatrix(assigned: Record<number, number[]>) {
    return axiosInstance.post("/permissions/sync", {
      assigned
    })
  }
}

export default PermissionService
