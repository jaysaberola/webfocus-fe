import type {
  PortalAccountDefaults,
  PortalInvoice,
  PortalNotification,
  PortalOrder,
  PortalOverviewStats,
  PortalOverviewAlert,
  PortalPaymentProof,
  PortalServiceStatus,
  PortalTicket,
} from "./types";

/** Hardcoded portal content — replace with API data later. */
export const DEMO_CUSTOMER_CREDENTIALS = {
  email: "customer@webfocus.ph",
  password: "password",
} as const;

export const PORTAL_OVERVIEW_STATS: PortalOverviewStats = {
  activeNodes: "2 Active",
  activeNodesDetail: "McKinley NVMe High Availability",
  unpaidInvoices: "1 Pending",
  unpaidInvoicesDetail: "₱32,000 due July 10",
  supportTickets: "1 Open",
  supportTicketsDetail: "Average response: 14 mins",
  slaUptime: "99.99%",
  slaUptimeDetail: "Tier-1 Fiber Route",
};

export const PORTAL_INVOICES: PortalInvoice[] = [
  {
    id: "INV-2026-001",
    date: "2026-01-15",
    due: "2026-02-15",
    amount: 4500,
    status: "Paid",
    subscription: "Cloud Micro Server (Annual)",
    items: "Hosting",
  },
  {
    id: "INV-2026-002",
    date: "2026-06-07",
    due: "2026-07-10",
    amount: 32000,
    status: "Pending Payment",
    subscription: "Canvas 7 Enterprise License",
    items: "Custom Web Design",
  },
  {
    id: "INV-2026-003",
    date: "2026-06-20",
    due: "2026-07-20",
    amount: 2800,
    status: "Paid",
    subscription: "Wildcard SSL & .ph Registration",
    items: "Secure Domain",
  },
  {
    id: "INV-2026-004",
    date: "2026-07-02",
    due: "2026-08-02",
    amount: 18500,
    status: "Pending Payment",
    subscription: "Enterprise Document Management Suite",
    items: "DMS",
  },
];

export const PORTAL_ORDERS: PortalOrder[] = [
  {
    id: "WF-JOB-9921",
    date: "2026-06-01",
    expiredDate: "2027-06-01",
    total: 32000,
    status: "Active Live",
    gateway: "BDO Wire",
    items: [{ name: "Custom Web Design", detail: "Canvas 7 Enterprise License", price: 32000 }],
  },
  {
    id: "WF-JOB-9922",
    date: "2026-06-15",
    expiredDate: "2027-06-15",
    total: 4500,
    status: "Active Live",
    gateway: "GCash",
    items: [{ name: "Hosting", detail: "Cloud Micro Server (Annual)", price: 4500 }],
  },
  {
    id: "WF-JOB-9923",
    date: "2026-06-20",
    expiredDate: "2027-06-20",
    total: 2800,
    status: "Active Live",
    gateway: "Paynamics IPG",
    items: [{ name: "Secure Domain", detail: "Wildcard SSL & .ph Registration", price: 2800 }],
  },
  {
    id: "WF-JOB-9924",
    date: "2026-07-02",
    expiredDate: "2027-08-02",
    total: 18500,
    status: "Pending Request",
    gateway: "Maya",
    items: [{ name: "DMS", detail: "Enterprise Document Management Suite", price: 18500 }],
  },
];

export const PORTAL_TICKETS: PortalTicket[] = [
  {
    id: "TKT-4912",
    subject: "DNSSEC Configuration Assistance",
    date: "2026-06-20",
    status: "Resolved",
  },
  {
    id: "TKT-4820",
    subject: "SSL Certificate Auto-Renewal Verification",
    date: "2026-07-05",
    status: "Open",
  },
];

export const PORTAL_NOTIFICATIONS: PortalNotification[] = [
  {
    id: 1,
    title: "Scheduled Datacenter Upgrade",
    desc: "McKinley node maintenance scheduled for July 15, 2026 at 02:00 AM PHT.",
    date: "2026-07-06",
    unread: true,
  },
  {
    id: 2,
    title: "Invoice Generated",
    desc: "Invoice INV-2026-002 for ₱32,000 has been issued.",
    date: "2026-06-01",
    unread: false,
  },
  {
    id: 3,
    title: "Domain Lock Active",
    desc: "Your domain registration for myphilippinebrand.com.ph is secured with DNSSEC.",
    date: "2026-05-12",
    unread: false,
  },
];

export function getUnreadPortalNotificationCount(): number {
  return PORTAL_NOTIFICATIONS.filter((item) => item.unread).length;
}

export const PORTAL_PAYMENT_PROOFS: PortalPaymentProof[] = [
  {
    id: "PRF-8821",
    invoiceId: "INV-2026-001",
    fileName: "bdo_transfer_receipt_jan.pdf",
    date: "2026-01-16",
    status: "Verified & Credited",
    notes: "BDO Online Corporate Wire",
  },
];

export const PORTAL_ACCOUNT_DEFAULTS: PortalAccountDefaults = {
  company: "Philippine Enterprise Corp.",
  address: "Antel Global Corporate Center, Ortigas Center, Pasig City",
  phone: "+63 917 555 1234",
};

export const PORTAL_BILLING_REMINDER = {
  invoiceId: "INV-2026-002",
  title: "Canvas 7 Enterprise License",
  dueDate: "July 10, 2026",
  amount: 32000,
};

export const PORTAL_SERVICE_STATUS: PortalServiceStatus[] = [
  {
    id: "svc-1",
    title: "Country Level Domain",
    category: "Domains",
    plan: "Country Level Domain",
    renewLabel: "Renews",
    renewDate: "Apr 20, 2027, 8:14 AM",
    renewNote: "276 days left",
    status: "Active",
  },
  {
    id: "svc-2",
    title: "Dedicated_Professional",
    category: "Dedicated Server",
    plan: "Dedicated_Professional",
    renewLabel: "Renewal Schedule",
    renewNote: "Your renewal date will appear once this service is live.",
    status: "Provisioning",
  },
  {
    id: "svc-3",
    title: "Business",
    category: "Shared Hosting",
    plan: "Business",
    renewLabel: "Renews",
    renewDate: "Apr 25, 2026, 4:07 PM",
    renewNote: "expired",
    status: "Expired",
  },
  {
    id: "svc-4",
    title: "Dedicated_Corporate",
    category: "Dedicated Server",
    plan: "Dedicated_Corporate",
    renewLabel: "Renews",
    renewDate: "Apr 26, 2026, 6:41 PM",
    renewNote: "expired",
    status: "Expired",
  },
  {
    id: "svc-5",
    title: "Dedicated BareMetal_Linux",
    category: "Dedicated Server",
    plan: "Dedicated BareMetal_Linux",
    renewLabel: "Renews",
    renewDate: "Apr 26, 2026, 9:31 PM",
    renewNote: "expired",
    status: "Expired",
  },
];

export const PORTAL_SERVICE_FILTERS = ["All", "Domains", "Dedicated Server", "Shared Hosting"] as const;

export const PORTAL_OVERVIEW_ALERTS: PortalOverviewAlert[] = [
  {
    id: "alert-provisioning",
    tone: "provisioning",
    title: "Dedicated_Professional provisioning",
    message: "Dedicated_Professional is currently provisioning. We'll notify you when it's active.",
    actionLabel: "View Alerts",
    actionHref: "/public/dashboard?tab=notification",
    icon: "bell",
  },
  {
    id: "alert-payment",
    tone: "payment",
    title: "Payment pending admin approval",
    message:
      "We received your order for Deluxe, Deluxe, Hybrid Top Level Domain. Billing verification and admin approval are still pending; provisioning begins only after both are complete.",
    actionLabel: "View Orders",
    actionHref: "/public/dashboard?tab=orders",
    icon: "card",
  },
];

export function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}

export function customerDisplayName(fname?: string | null, lname?: string | null) {
  return [fname, lname].filter(Boolean).join(" ") || "Client";
}
