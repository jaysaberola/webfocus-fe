import { axiosInstance } from "@/services/axios";

/* =======================
   Types
======================= */
export interface AuditRow {
  id: number;
  event: string;
  auditable_type: string;
  auditable_id: number;
  user?: {
    id: number;
    fname?: string;
    lname?: string;
    email?: string;
  };
  old_values: Record<string, any>;
  new_values: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

/* =======================
   Service
======================= */
export const getAuditTrails = async (params: {
  search?: string;
  page?: number;
  per_page?: number;
}) => {
  return axiosInstance.get("/audit-trails", { params });
};
