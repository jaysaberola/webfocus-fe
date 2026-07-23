import { axiosInstance } from "@/services/axios";
import { getCustomers } from "@/services/customerService";
import { getSalesTransactions } from "@/services/salesTransactionService";

function extractList<T>(payload: unknown): T[] {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === "object" && Array.isArray((payload as { data?: unknown }).data)) {
    return (payload as { data: T[] }).data;
  }
  return [];
}

export type CommerceDashboardData = {
  counts: {
    pendingApprovals: number;
    openTickets: number;
    activeClients: number;
    activeServices: number;
  };
  newOrders: Array<{
    id: string;
    orderId: string;
    company: string;
    dateCreated: string;
    amount: number;
    status: string;
  }>;
  expiringServices: Array<{
    id: string;
    service: string;
    company: string;
    expiryDate: string;
    daysLeft: string;
    status: string;
  }>;
  overdueInvoices: Array<{
    id: string;
    reference: string;
    company: string;
    dueDate: string;
    amount: number;
    status: string;
  }>;
};

export type CommercePaymentProofRow = {
  id: number;
  proofNo: string;
  invoiceId: string;
  client: string;
  email?: string;
  fileName: string;
  fileUrl?: string | null;
  status: string;
  notes?: string | null;
  submittedAt: string;
  amount: number;
  serviceName?: string;
};

export type CommerceTicketAdminRow = {
  id: number;
  ticketNo: string;
  subject: string;
  message?: string | null;
  client: string;
  email?: string;
  status: string;
  updatedAt: string;
};

export type CommerceServiceAdminRow = {
  id: number;
  title: string;
  category?: string | null;
  plan?: string | null;
  status: string;
  client: string;
  email?: string;
  renewLabel?: string | null;
  renewAt?: string | null;
  transactionNo?: string | null;
};

export async function fetchCommerceDashboard() {
  const res = await axiosInstance.get("/commerce-admin/dashboard", {
    headers: { "X-No-Loading": true },
  });
  return res.data.data as CommerceDashboardData;
}

export async function fetchCommercePaymentProofs(status = "Pending Review") {
  const res = await axiosInstance.get("/commerce-admin/payment-proofs", {
    params: { status, per_page: 50 },
    headers: { "X-No-Loading": true },
  });
  return extractList<CommercePaymentProofRow>(res.data.data);
}

export async function verifyCommercePaymentProof(id: number) {
  const res = await axiosInstance.patch(`/commerce-admin/payment-proofs/${id}/verify`);
  return res.data;
}

export async function rejectCommercePaymentProof(id: number, reason?: string) {
  const res = await axiosInstance.patch(`/commerce-admin/payment-proofs/${id}/reject`, { reason });
  return res.data;
}

export async function fetchCommerceTickets(status?: string) {
  const res = await axiosInstance.get("/commerce-admin/tickets", {
    params: { status, per_page: 50 },
    headers: { "X-No-Loading": true },
  });
  return extractList<CommerceTicketAdminRow>(res.data.data);
}

export async function updateCommerceTicket(id: number, status: string) {
  const res = await axiosInstance.patch(`/commerce-admin/tickets/${id}`, { status });
  return res.data;
}

export async function fetchCommerceServices(status?: string) {
  const res = await axiosInstance.get("/commerce-admin/services", {
    params: { status, per_page: 50 },
    headers: { "X-No-Loading": true },
  });
  return extractList<CommerceServiceAdminRow>(res.data.data);
}

export { getCustomers, getSalesTransactions };
