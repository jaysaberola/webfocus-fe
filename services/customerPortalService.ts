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

export async function fetchPortalBilling(): Promise<PortalBillingResponse> {
  const res = await axiosInstance.get("/customer/portal/billing", { headers: silentHeaders });
  return res.data?.data ?? { invoices: [], reminder: null, paymentProofs: [] };
}

export async function fetchPortalNotifications(): Promise<PortalNotification[]> {
  const res = await axiosInstance.get("/customer/portal/notifications", { headers: silentHeaders });
  return res.data?.data ?? [];
}

export async function fetchPortalUnreadNotificationCount(): Promise<number> {
  const res = await axiosInstance.get("/customer/portal/notifications/unread-count", {
    headers: silentHeaders,
  });
  return res.data?.data?.count ?? 0;
}

export async function markPortalNotificationRead(id: number): Promise<void> {
  await axiosInstance.patch(`/customer/portal/notifications/${id}/read`, null, {
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

export const PORTAL_NOTIFICATIONS_UPDATED_EVENT = "customer-portal-notifications-updated";

export function notifyPortalNotificationsUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(PORTAL_NOTIFICATIONS_UPDATED_EVENT));
}
