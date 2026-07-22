export type CustomerPortalTab =
  | "overview"
  | "billing"
  | "orders"
  | "contract"
  | "notification"
  | "help"
  | "account";

export type PortalInvoice = {
  id: string;
  transactionNo?: string;
  date: string;
  due: string;
  amount: number;
  status: "Paid" | "Pending Payment";
  subscription: string;
  items: string;
};

export type PortalOrder = {
  id: string;
  date: string;
  expiredDate: string;
  total: number;
  status: "Active Live" | "Pending Request";
  gateway: string;
  items: Array<{ name: string; detail: string; price: number }>;
};

export type PortalTicket = {
  id: string;
  subject: string;
  date: string;
  status: "Open" | "Resolved";
};

export type PortalNotification = {
  id: number;
  title: string;
  desc: string;
  date: string;
  unread: boolean;
  type?: string;
  actionUrl?: string | null;
};

export type PortalPaymentProof = {
  id: string;
  invoiceId: string;
  fileName: string;
  date: string;
  status: string;
  notes?: string;
};

export type PortalOverviewStats = {
  activeNodes: string;
  activeNodesDetail: string;
  unpaidInvoices: string;
  unpaidInvoicesDetail: string;
  supportTickets: string;
  supportTicketsDetail: string;
  slaUptime: string;
  slaUptimeDetail: string;
};

export type PortalAccountDefaults = {
  company: string;
  address: string;
  phone: string;
};

export type PortalServiceStatus = {
  id: string;
  title: string;
  category: "Domains" | "Dedicated Server" | "Shared Hosting" | "Hosting";
  plan: string;
  renewLabel: "Renews" | "Renewal Schedule";
  renewDate?: string;
  renewNote: string;
  status: "Active" | "Provisioning" | "Expired";
};

export type PortalOverviewAlert = {
  id: string;
  tone: "provisioning" | "payment";
  title: string;
  message: string;
  actionLabel: string;
  actionHref: string;
  icon: "bell" | "card";
};

export type PortalActiveSession = {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current?: boolean;
};

export type PortalProfileApproval = {
  reference: string;
  submittedAt: string;
  status: "Pending Admin Review" | "Approved" | "Rejected";
  summary: string;
};
