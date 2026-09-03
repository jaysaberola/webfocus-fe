import { axiosInstance } from "@/services/axios";
import type {
  PortalInvoice,
  PortalNotification,
  PortalOrder,
  PortalOverviewAlert,
  PortalOverviewStats,
  PortalPaymentProof,
  PortalServiceStatus,
  PortalTicket,
} from "@/lib/customerPortal/types";

export type PortalOverviewResponse = {
  stats: PortalOverviewStats;
  alerts: PortalOverviewAlert[];
  services: PortalServiceStatus[];
};

export type PortalBillingResponse = {
  invoices: PortalInvoice[];
  reminder: {
    invoiceId: string;
    transactionNo?: string;
    title: string;
    dueDate: string;
    amount: number;
    kind?: "payment" | "renewal";
    headline?: string;
    buttonLabel?: string;
    daysUntilDue?: number;
    canPay?: boolean;
  } | null;
  paymentProofs: PortalPaymentProof[];
};

const silentHeaders = { "X-No-Loading": true, "X-No-Auth-Redirect": true };

export async function fetchPortalOverview(): Promise<PortalOverviewResponse> {
  const res = await axiosInstance.get("/customer/portal/overview", { headers: silentHeaders });
  return res.data?.data ?? { stats: {}, alerts: [], services: [] };
}

export async function fetchPortalServices(): Promise<PortalServiceStatus[]> {
  const res = await axiosInstance.get("/customer/portal/services", { headers: silentHeaders });
  return res.data?.data ?? [];
}

export async function fetchPortalOrders(): Promise<PortalOrder[]> {
  const res = await axiosInstance.get("/customer/portal/orders", { headers: silentHeaders });
  return res.data?.data ?? [];
}

export async function cancelPortalOrder(recordId: number): Promise<PortalOrder> {
  const res = await axiosInstance.post(`/customer/portal/orders/${recordId}/cancel`);
  return res.data?.data;
}

export async function fetchPortalBilling(params?: {
  dateFrom?: string;
  dateTo?: string;
}): Promise<PortalBillingResponse> {
  const res = await axiosInstance.get("/customer/portal/billing", {
    headers: silentHeaders,
    params: {
      date_from: params?.dateFrom || undefined,
      date_to: params?.dateTo || undefined,
    },
  });
  return res.data?.data ?? { invoices: [], reminder: null, paymentProofs: [] };
}

export async function fetchPortalNotifications(): Promise<PortalNotification[]> {
  try {
    const res = await axiosInstance.get("/customer/portal/notifications", { headers: silentHeaders });
    return res.data?.data ?? [];
  } catch {
    return [];
  }
}

export async function fetchPortalUnreadNotificationCount(): Promise<number> {
  try {
    const res = await axiosInstance.get("/customer/portal/notifications/unread-count", {
      headers: silentHeaders,
    });
    return res.data?.data?.count ?? 0;
  } catch {
    return 0;
  }
}

export async function markPortalNotificationRead(id: number): Promise<void> {
  await axiosInstance.patch(`/customer/portal/notifications/${id}/read`, null, {
    headers: silentHeaders,
  });
}

export async function markAllPortalNotificationsRead(): Promise<void> {
  await axiosInstance.patch("/customer/portal/notifications/read-all", null, {
    headers: silentHeaders,
  });
}

export async function deletePortalNotification(id: number): Promise<void> {
  await axiosInstance.delete(`/customer/portal/notifications/${id}`, {
    headers: silentHeaders,
  });
}

export async function fetchPortalTickets(): Promise<PortalTicket[]> {
  const res = await axiosInstance.get("/customer/portal/tickets", { headers: silentHeaders });
  return res.data?.data ?? [];
}

export async function createPortalTicket(payload: {
  subject: string;
  message?: string;
}): Promise<PortalTicket> {
  const res = await axiosInstance.post("/customer/portal/tickets", payload);
  return res.data?.data;
}

export async function payPortalInvoice(payload: {
  invoiceId: string;
  paymentMethod: string;
}) {
  const res = await axiosInstance.post("/customer/portal/billing/pay", {
    invoice_id: payload.invoiceId,
    payment_method: payload.paymentMethod,
  });
  return res.data;
}

export async function addPortalFunds(payload: { amount: number; paymentMethod: string }) {
  const res = await axiosInstance.post("/customer/portal/billing/add-funds", {
    amount: payload.amount,
    payment_method: payload.paymentMethod,
  });
  return res.data;
}

export async function uploadPortalPaymentProof(payload: {
  invoiceId: string;
  notes?: string;
  receipt: File;
}) {
  const formData = new FormData();
  formData.append("invoice_id", payload.invoiceId);
  if (payload.notes) formData.append("notes", payload.notes);
  formData.append("receipt", payload.receipt);

  const res = await axiosInstance.post("/customer/portal/billing/payment-proofs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function deletePortalPaymentProof(recordId: number) {
  const res = await axiosInstance.delete(`/customer/portal/billing/payment-proofs/${recordId}`);
  return res.data;
}

export async function uploadPortalSignedProposal(payload: { invoiceId: string; file: File }) {
  const formData = new FormData();
  formData.append("invoice_id", payload.invoiceId);
  formData.append("file", payload.file);
  const res = await axiosInstance.post("/customer/portal/billing/proposals", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

export async function fetchPendingProfileChangeRequest() {
  const res = await axiosInstance.get("/customer/portal/profile-change-requests/pending", {
    headers: silentHeaders,
  });
  return res.data?.data ?? null;
}

export async function submitPortalProfileChange(payload: {
  fname: string;
  lname: string;
  mobile?: string;
  mname?: string;
  address_country?: string;
  address_region?: string;
  address_province?: string;
  address_city?: string;
  address_street?: string;
  address_zip?: string;
  summary?: string;
  avatar?: File;
}) {
  const formData = new FormData();
  formData.append("fname", payload.fname);
  formData.append("lname", payload.lname);
  if (payload.mobile != null) formData.append("mobile", payload.mobile);
  if (payload.mname != null) formData.append("mname", payload.mname);
  if (payload.address_country != null) formData.append("address_country", payload.address_country);
  if (payload.address_region != null) formData.append("address_region", payload.address_region);
  if (payload.address_province != null) formData.append("address_province", payload.address_province);
  if (payload.address_city != null) formData.append("address_city", payload.address_city);
  if (payload.address_street != null) formData.append("address_street", payload.address_street);
  if (payload.address_zip != null) formData.append("address_zip", payload.address_zip);
  if (payload.summary) formData.append("summary", payload.summary);
  if (payload.avatar) formData.append("avatar", payload.avatar);

  const res = await axiosInstance.post("/customer/portal/profile-change-requests", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data?.data;
}

export const PORTAL_NOTIFICATIONS_UPDATED_EVENT = "customer-portal-notifications-updated";

export function notifyPortalNotificationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PORTAL_NOTIFICATIONS_UPDATED_EVENT));
}
