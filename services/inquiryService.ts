import { axiosInstance } from "@/services/axios";

export type ContactInquiryRow = {
  id: number;
  inquiry_type: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  message: string;
  preferred_services?: string[];
  status: string;
  read_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InquiryStatus = "new" | "in_review" | "responded" | "closed";

export const INQUIRY_STATUS_LABELS: Record<InquiryStatus, string> = {
  new: "New",
  in_review: "In review",
  responded: "Responded",
  closed: "Closed",
};

export async function getInquiries(
  params?: { search?: string; status?: string; page?: number; per_page?: number },
  options?: { silent?: boolean },
) {
  const res = await axiosInstance.get("/commerce-admin/inquiries", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
}

export async function getInquiry(id: number, options?: { silent?: boolean }) {
  const res = await axiosInstance.get(`/commerce-admin/inquiries/${id}`, {
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data?.data as ContactInquiryRow;
}

export async function updateInquiryStatus(id: number, status: InquiryStatus) {
  const res = await axiosInstance.patch(`/commerce-admin/inquiries/${id}`, { status });
  return res.data?.data as ContactInquiryRow;
}
