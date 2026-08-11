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
    pendingQuotations?: number;
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
  kind?: "payment_proof" | "profile_change";
  proofNo: string;
  invoiceId: string;
  client: string;
  email?: string;
  fileName: string;
  fileUrl?: string | null;
  status: string;
  notes?: string | null;
  summary?: string | null;
  changes?: Array<{
    field: string;
    label: string;
    from: string;
    to: string;
  }>;
  currentAvatarUrl?: string | null;
  submittedAt: string;
  amount: number;
  serviceName?: string;
  plan?: string;
  issuedDate?: string;
  expiredDate?: string;
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
  customerId?: number | null;
  title: string;
  category?: string | null;
  plan?: string | null;
  status: string;
  client: string;
  company?: string | null;
  email?: string;
  renewLabel?: string | null;
  renewAt?: string | null;
  transactionNo?: string | null;
};

export type CommerceNotificationAdminRow = {
  id: number;
  title: string;
  desc: string;
  date: string;
  audience: string;
  status: string;
  kind?: "broadcast" | "web_design_quotation" | "payment_proof" | "profile_change" | "support_ticket" | string;
  email?: string | null;
  transactionNo?: string | null;
  actionUrl?: string | null;
};

export type CommerceNotificationsPayload = {
  clientAlerts: CommerceNotificationAdminRow[];
  broadcasts: CommerceNotificationAdminRow[];
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

export async function fetchCommerceApprovals(status = "Pending Review") {
  const res = await axiosInstance.get("/commerce-admin/approvals", {
    params: { status },
    headers: { "X-No-Loading": true },
  });
  return extractList<CommercePaymentProofRow>(res.data.data);
}

export async function approveCommerceProfileChange(id: number) {
  const res = await axiosInstance.patch(`/commerce-admin/profile-change-requests/${id}/approve`);
  return res.data;
}

export async function rejectCommerceProfileChange(id: number, reason?: string) {
  const res = await axiosInstance.patch(`/commerce-admin/profile-change-requests/${id}/reject`, { reason });
  return res.data;
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

export async function fetchCommerceServices(
  status?: string,
  customerId?: number,
  options?: { perPage?: number; plan?: string; search?: string },
) {
  const res = await axiosInstance.get("/commerce-admin/services", {
    params: {
      status,
      per_page: options?.perPage ?? (customerId ? 200 : 50),
      ...(customerId ? { customer_id: customerId } : {}),
      ...(options?.plan ? { plan: options.plan } : {}),
      ...(options?.search ? { search: options.search } : {}),
    },
    headers: { "X-No-Loading": true },
  });
  return extractList<CommerceServiceAdminRow>(res.data.data);
}

export async function fetchCommerceNotifications(): Promise<CommerceNotificationsPayload> {
  const res = await axiosInstance.get("/commerce-admin/notifications", {
    params: { per_page: 50 },
    headers: { "X-No-Loading": true },
  });
  const payload = res.data?.data;
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    return {
      clientAlerts: extractList<CommerceNotificationAdminRow>(
        (payload as CommerceNotificationsPayload).clientAlerts
      ),
      broadcasts: extractList<CommerceNotificationAdminRow>(
        (payload as CommerceNotificationsPayload).broadcasts
      ),
    };
  }
  // Legacy flat list = broadcasts only
  return {
    clientAlerts: [],
    broadcasts: extractList<CommerceNotificationAdminRow>(payload),
  };
}

export async function broadcastCommerceNotification(payload: { title: string; body: string }) {
  const res = await axiosInstance.post("/commerce-admin/notifications/broadcast", payload);
  return res.data;
}

export type CommerceAssignableUser = {
  id: number;
  name: string;
  email?: string | null;
  role?: string | null;
};

export async function fetchCommerceAssignableUsers() {
  const res = await axiosInstance.get("/commerce-admin/assignable-users", {
    headers: { "X-No-Loading": true },
  });
  return extractList<CommerceAssignableUser>(res.data?.data ?? res.data);
}

export async function assignCommerceSalesTransaction(transactionId: number, userId: number) {
  const res = await axiosInstance.patch(
    `/commerce-admin/sales-transactions/${transactionId}/assign`,
    { user_id: userId }
  );
  return res.data;
}

export async function assignCommerceCustomerOwner(customerId: number, ownerId: number | null) {
  const res = await axiosInstance.patch(`/commerce-admin/customers/${customerId}/assign-owner`, {
    owner_id: ownerId,
  });
  return res.data;
}

export { getCustomers, getSalesTransactions };
