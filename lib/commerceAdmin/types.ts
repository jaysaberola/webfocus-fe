export type CommerceAdminTab =
  | "dashboard"
  | "clients"
  | "transactions"
  | "approvals"
  | "managed"
  | "contracts"
  | "users"
  | "notifications"
  | "helpdesk"
  | "reports";

export type CommerceKpi = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone?: "default" | "warning" | "success";
  tab: CommerceAdminTab;
};

export type CommerceOrderCard = {
  id: string;
  client: string;
  service: string;
  amount: number;
  status: string;
  placedAt: string;
};

export type CommerceClientRow = {
  id: string;
  company: string;
  contact: string;
  email: string;
  services: number;
  status: "Active" | "Suspended" | "Pending";
  joined: string;
};

export type CommerceTransactionRow = {
  id: string;
  reference: string;
  client: string;
  type: string;
  amount: number;
  paymentStatus: string;
  date: string;
};

export type CommerceApprovalRow = {
  id: string;
  client: string;
  request: string;
  submittedAt: string;
  priority: "High" | "Normal";
};

export type CommerceManagedNode = {
  id: string;
  name: string;
  location: string;
  status: "Online" | "Maintenance" | "Degraded";
  uptime: string;
};

export type CommerceContractRow = {
  id: string;
  client: string;
  service: string;
  renews: string;
  value: number;
};

export type CommerceTicketRow = {
  id: string;
  subject: string;
  client: string;
  priority: string;
  status: string;
  updatedAt: string;
};

export type CommerceNotificationRow = {
  id: string;
  title: string;
  audience: string;
  sentAt: string;
  status: string;
};

export type CommerceQueueOrderRow = {
  id: string;
  orderId: string;
  company: string;
  dateCreated: string;
  amount: number;
  status: "New" | "Overdue" | "Expiring";
};

export type CommerceQueueExpiringRow = {
  id: string;
  service: string;
  company: string;
  expiryDate: string;
  daysLeft: string;
  status: "Expiring";
};

export type CommerceQueueOverdueRow = {
  id: string;
  reference: string;
  company: string;
  dueDate: string;
  amount: number;
  status: "Overdue";
};

export type CommerceActivityRow = {
  id: string;
  dateTime: string;
  activity: string;
  reference: string;
  company: string;
  performedBy: string;
  status: "In Progress" | "Failed" | "Completed";
};

export type CommerceServiceStat = {
  id: string;
  label: string;
  value: number;
  hint: string;
  tone: "green" | "amber" | "red" | "purple";
  icon: string;
};

export type CommerceMonthlyRenewalPoint = {
  label: string;
  projected: number;
  actual: number;
};
