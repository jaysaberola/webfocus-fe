import { axiosInstance } from "@/services/axios";
import type { LeadFormState } from "@/lib/commerceAdmin/leadFormHelpers";

export type CrmLeadRow = LeadFormState & {
  id: number;
  lead_owner_id?: number | null;
  lead_owner?: {
    id: number;
    name?: string | null;
    fname?: string | null;
    lname?: string | null;
    email?: string | null;
  } | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function getLeads(
  params?: { search?: string; page?: number; per_page?: number },
  options?: { silent?: boolean },
) {
  const res = await axiosInstance.get("/commerce-admin/leads", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
}

export async function getLead(id: number, options?: { silent?: boolean }) {
  const res = await axiosInstance.get(`/commerce-admin/leads/${id}`, {
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data?.data as CrmLeadRow;
}

export async function createLead(payload: LeadFormState) {
  const res = await axiosInstance.post("/commerce-admin/leads", payload);
  return res.data?.data as CrmLeadRow;
}

export async function updateLead(id: number, payload: Partial<LeadFormState>) {
  const res = await axiosInstance.put(`/commerce-admin/leads/${id}`, payload);
  return res.data?.data as CrmLeadRow;
}
