import { axiosInstance } from "@/services/axios";

export interface Role {
  id: number;
  name: string;
}

export const fetchRoles = async (): Promise<Role[]> => {
  const res = await axiosInstance.get("/fetch_roles");
  return res.data.data;
};

/* =======================
   Types
======================= */
export interface RoleRow {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export const getRoles = (params: {
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: any;
}) => {
  return axiosInstance.get("/roles", { params });
};

export const createRole = (payload: {
  name: string;
  description?: string;
}) => {
  return axiosInstance.post("/roles", payload);
};

export const updateRole = (
  id: number,
  payload: { name: string; description?: string }
) => {
  return axiosInstance.put(`/roles/${id}`, payload);
};

export const deleteRole = (id: number) => {
  return axiosInstance.delete(`/roles/${id}`);
};
