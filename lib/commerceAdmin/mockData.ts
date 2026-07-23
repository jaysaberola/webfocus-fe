import type {
  CommerceApprovalRow,
  CommerceClientRow,
  CommerceContractRow,
  CommerceKpi,
  CommerceManagedNode,
  CommerceNotificationRow,
  CommerceOrderCard,
  CommerceTicketRow,
  CommerceTransactionRow,
} from "./types";

export const COMMERCE_ADMIN_TABS = [
  { id: "dashboard", label: "Dashboard", icon: "fa-solid fa-gauge-high" },
  { id: "clients", label: "Clients", icon: "fa-solid fa-users" },
  { id: "transactions", label: "Transactions", icon: "fa-regular fa-credit-card" },
  { id: "approvals", label: "Approvals", icon: "fa-solid fa-circle-check", badge: true },
  { id: "managed", label: "Managed", icon: "fa-solid fa-server" },
  { id: "contracts", label: "Contracts", icon: "fa-regular fa-file-lines" },
  { id: "catalog", label: "Catalog", icon: "fa-solid fa-boxes-stacked" },
  { id: "users", label: "Users", icon: "fa-solid fa-user-gear" },
  { id: "notifications", label: "Notifications", icon: "fa-regular fa-bell" },
  { id: "helpdesk", label: "Helpdesk", icon: "fa-solid fa-headset" },
  { id: "reports", label: "Reports", icon: "fa-solid fa-chart-column" },
] as const;

export const COMMERCE_KPIS: CommerceKpi[] = [
  {
    id: "clients",
    label: "Total Clients (View All)",
    value: "14 Active",
    hint: "+2 joined this week",
    tone: "success",
    tab: "clients",
  },
  {
    id: "revenue",
    label: "Total Revenue (YTD)",
    value: "₱1,425,000",
    hint: "12% above quarterly forecast",
    tab: "transactions",
  },
  {
    id: "approvals",
    label: "Pending Approvals",
    value: "2 Queue",
    hint: "Requires NOC verification",
    tone: "warning",
    tab: "approvals",
  },
  {
    id: "nodes",
    label: "NOC Node Status",
    value: "100% ONLINE",
    hint: "McKinley Core & Pasig Fiber",
    tone: "success",
    tab: "managed",
  },
];

export const COMMERCE_NEW_ORDERS: CommerceOrderCard[] = [
  {
    id: "ord-1",
    client: "Philippine Enterprise Corp.",
    service: "Dedicated_Professional Node",
    amount: 29400,
    status: "Provisioning",
    placedAt: "Jul 17, 2026 10:42 AM",
  },
  {
    id: "ord-2",
    client: "Metro Retail Group",
    service: "samplesonline.com Domain",
    amount: 899,
    status: "Payment Pending",
    placedAt: "Jul 17, 2026 09:15 AM",
  },
  {
    id: "ord-3",
    client: "LGU Pasig Digital",
    service: "WebFocus DMS License",
    amount: 28000,
    status: "Awaiting Approval",
    placedAt: "Jul 16, 2026 04:30 PM",
  },
];

export const COMMERCE_EXPIRING: CommerceOrderCard[] = [
  {
    id: "exp-1",
    client: "Acme Holdings",
    service: "Wildcard SSL Certificate",
    amount: 23400,
    status: "Renews in 14 days",
    placedAt: "Aug 1, 2026",
  },
  {
    id: "exp-2",
    client: "Canvas Studio PH",
    service: "Cloud VPS Pro Server",
    amount: 4200,
    status: "Renews in 21 days",
    placedAt: "Aug 8, 2026",
  },
];

export const COMMERCE_OVERDUE: CommerceOrderCard[] = [
  {
    id: "due-1",
    client: "Northgate Logistics",
    service: "Managed Hosting SOA",
    amount: 32000,
    status: "18 days overdue",
    placedAt: "Due Jun 29, 2026",
  },
];

export const COMMERCE_CLIENTS: CommerceClientRow[] = [
  {
    id: "c1",
    company: "Philippine Enterprise Corp.",
    contact: "Juan Dela Cruz",
    email: "customer@webfocus.ph",
    services: 5,
    status: "Active",
    joined: "Jan 12, 2024",
  },
  {
    id: "c2",
    company: "Metro Retail Group",
    contact: "Maria Santos",
    email: "billing@metroretail.ph",
    services: 3,
    status: "Active",
    joined: "Mar 4, 2025",
  },
  {
    id: "c3",
    company: "LGU Pasig Digital",
    contact: "Engr. Reyes",
    email: "it@pasig.gov.ph",
    services: 8,
    status: "Pending",
    joined: "Jul 10, 2026",
  },
];

export const COMMERCE_TRANSACTIONS: CommerceTransactionRow[] = [
  {
    id: "t1",
    reference: "TXN-20260717-0042",
    client: "Philippine Enterprise Corp.",
    type: "Hosting Subscription",
    amount: 29400,
    paymentStatus: "Pending Admin Approval",
    date: "Jul 17, 2026",
  },
  {
    id: "t2",
    reference: "TXN-20260716-0038",
    client: "Metro Retail Group",
    type: "Domain Registration",
    amount: 899,
    paymentStatus: "Paid",
    date: "Jul 16, 2026",
  },
  {
    id: "t3",
    reference: "TXN-20260715-0031",
    client: "Canvas Studio PH",
    type: "Template Deployment",
    amount: 18500,
    paymentStatus: "Paid",
    date: "Jul 15, 2026",
  },
];

export const COMMERCE_APPROVALS: CommerceApprovalRow[] = [
  {
    id: "apr-1",
    client: "Philippine Enterprise Corp.",
    request: "Profile update: billing address and authorized representative",
    submittedAt: "Jul 17, 2026 11:05 AM",
    priority: "Normal",
  },
  {
    id: "apr-2",
    client: "LGU Pasig Digital",
    request: "DMS deployment license and 25-user provisioning",
    submittedAt: "Jul 16, 2026 03:20 PM",
    priority: "High",
  },
];

export const COMMERCE_NODES: CommerceManagedNode[] = [
  {
    id: "node-1",
    name: "McKinley NVMe HA Cluster",
    location: "Taguig Tier-3",
    status: "Online",
    uptime: "99.99%",
  },
  {
    id: "node-2",
    name: "Pasig Fiber Edge Route",
    location: "Pasig NOC",
    status: "Online",
    uptime: "99.97%",
  },
  {
    id: "node-3",
    name: "Ortigas Shared Hosting Pool",
    location: "Ortigas Center",
    status: "Maintenance",
    uptime: "Scheduled window",
  },
];

export const COMMERCE_CONTRACTS: CommerceContractRow[] = [
  {
    id: "con-1",
    client: "Philippine Enterprise Corp.",
    service: "Country Level Domain",
    renews: "Apr 20, 2027",
    value: 899,
  },
  {
    id: "con-2",
    client: "Acme Holdings",
    service: "Dedicated Corporate Node",
    renews: "Dec 1, 2026",
    value: 156000,
  },
];

export const COMMERCE_TICKETS: CommerceTicketRow[] = [
  {
    id: "hd-1042",
    subject: "Provisioning delay for Dedicated_Professional",
    client: "Philippine Enterprise Corp.",
    priority: "High",
    status: "Open",
    updatedAt: "14 mins ago",
  },
  {
    id: "hd-1038",
    subject: "Invoice clarification for June SOA",
    client: "Northgate Logistics",
    priority: "Normal",
    status: "Awaiting Client",
    updatedAt: "2 hours ago",
  },
];

export const COMMERCE_NOTIFICATIONS: CommerceNotificationRow[] = [
  {
    id: "n1",
    title: "Payment pending admin approval",
    audience: "Philippine Enterprise Corp.",
    sentAt: "Jul 17, 2026",
    status: "Delivered",
  },
  {
    id: "n2",
    title: "Dedicated_Professional provisioning started",
    audience: "Philippine Enterprise Corp.",
    sentAt: "Jul 17, 2026",
    status: "Delivered",
  },
];

export const COMMERCE_REPORTS = [
  { id: "r1", title: "Sales Report", desc: "Monthly revenue and transaction breakdown", icon: "fa-solid fa-file-invoice-dollar" },
  { id: "r2", title: "Renewals Forecast", desc: "Upcoming contract and domain renewals", icon: "fa-solid fa-clock-rotate-left" },
  { id: "r3", title: "Collections Aging", desc: "Overdue invoices and SOA follow-ups", icon: "fa-solid fa-triangle-exclamation" },
  { id: "r4", title: "NOC Uptime SLA", desc: "Node availability and incident summary", icon: "fa-solid fa-server" },
];

export function formatCommerceMoney(amount: number) {
  return `₱${amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const COMMERCE_DASHBOARD_WIDGET_COUNT = 10;

export const COMMERCE_QUEUE_NEW_ORDERS = [
  { id: "q1", orderId: "NO-WSI-632133", company: "WSI Demo Client", dateCreated: "10-Jul-2026", amount: 15000, status: "New" as const },
  { id: "q2", orderId: "NO-WSI-612144", company: "sample", dateCreated: "16-Oct-2025", amount: 14200, status: "New" as const },
  { id: "q3", orderId: "NO-WSI-612143", company: "sample", dateCreated: "16-Oct-2025", amount: 14200, status: "New" as const },
];

export const COMMERCE_QUEUE_EXPIRING = [
  { id: "e1", service: "Dedicated BareMetal_Linux", company: "sample", expiryDate: "03-Jul-2026", daysLeft: "Due", status: "Expiring" as const },
  { id: "e2", service: "Dedicated BareMetal_Linux", company: "sample", expiryDate: "03-Jul-2026", daysLeft: "Due", status: "Expiring" as const },
  { id: "e3", service: "Business", company: "sample", expiryDate: "03-Jul-2026", daysLeft: "Due", status: "Expiring" as const },
];

export const COMMERCE_QUEUE_OVERDUE = [
  { id: "o1", reference: "SOA-INV-722694", company: "WSI Demo Client", dueDate: "01-Feb-2026", amount: 287160, status: "Overdue" as const },
  { id: "o2", reference: "SOA-INV-722693", company: "WSI Demo Client", dueDate: "01-Feb-2026", amount: 287160, status: "Overdue" as const },
  { id: "o3", reference: "SOA-INV-722692", company: "WSI Demo Client", dueDate: "01-Feb-2026", amount: 287160, status: "Overdue" as const },
];

export const COMMERCE_RECENT_ACTIVITY = [
  { id: "a1", dateTime: "10-Jul-2026 10:42 AM", activity: "New Order Received", reference: "NO-WSI-632133", company: "WSI Demo Client", performedBy: "Administrator", status: "In Progress" as const },
  { id: "a2", dateTime: "10-Jul-2026 10:42 AM", activity: "New Order Received", reference: "NO-WSI-632133", company: "WSI Demo Client", performedBy: "Administrator", status: "In Progress" as const },
  { id: "a3", dateTime: "10-Jul-2026 10:42 AM", activity: "New Order Received", reference: "NO-WSI-632133", company: "WSI Demo Client", performedBy: "Administrator", status: "In Progress" as const },
  { id: "a4", dateTime: "10-Jul-2026 10:42 AM", activity: "New Order Received", reference: "NO-WSI-632133", company: "WSI Demo Client", performedBy: "Administrator", status: "In Progress" as const },
  { id: "a5", dateTime: "10-Jul-2026 10:42 AM", activity: "New Order Received", reference: "NO-WSI-632133", company: "WSI Demo Client", performedBy: "Administrator", status: "In Progress" as const },
  { id: "a6", dateTime: "10-Jul-2026 10:42 AM", activity: "Order Update", reference: "NO-WSI-632133", company: "sample", performedBy: "Administrator", status: "Failed" as const },
  { id: "a7", dateTime: "10-Jul-2026 10:42 AM", activity: "Order Update", reference: "NO-WSI-632133", company: "TEST", performedBy: "Administrator", status: "Failed" as const },
];

export const COMMERCE_SERVICE_STATS = [
  { id: "active", label: "Active", value: 3, hint: "Total Active Services", tone: "green" as const, icon: "fa-solid fa-circle-check" },
  { id: "expiring", label: "Expiring", value: 0, hint: "Services Expiring Soon", tone: "amber" as const, icon: "fa-regular fa-clock" },
  { id: "expired", label: "Expired", value: 4, hint: "Services Already Expired", tone: "red" as const, icon: "fa-solid fa-circle-xmark" },
  { id: "pending", label: "Pending Orders", value: 6, hint: "Awaiting Approval", tone: "purple" as const, icon: "fa-solid fa-cart-shopping" },
];

export const COMMERCE_MONTHLY_RENEWALS = [
  { label: "Jan", projected: 120000, actual: 95000 },
  { label: "Feb", projected: 180000, actual: 165000 },
  { label: "Mar", projected: 210000, actual: 198000 },
  { label: "Apr", projected: 520000, actual: 480000 },
  { label: "May", projected: 240000, actual: 255000 },
  { label: "Jun", projected: 680000, actual: 620000 },
  { label: "Jul", projected: 24120, actual: 36720 },
  { label: "Aug", projected: 310000, actual: 290000 },
  { label: "Sep", projected: 275000, actual: 268000 },
  { label: "Oct", projected: 420000, actual: 395000 },
  { label: "Nov", projected: 350000, actual: 340000 },
];

export const COMMERCE_QUICK_ACTIONS = [
  { id: "service", label: "Add New Service", hint: "Catalog setup", icon: "fa-solid fa-plus", tone: "green" as const, tab: "catalog" as const },
  { id: "soa", label: "Generate SOA", hint: "Receivables", icon: "fa-solid fa-file-invoice", tone: "green" as const, tab: "transactions" as const },
  { id: "reminder", label: "Send Reminder", hint: "Follow-ups", icon: "fa-solid fa-envelope", tone: "purple" as const, tab: "notifications" as const },
  { id: "search", label: "Search", hint: "Clients & services", icon: "fa-solid fa-magnifying-glass", tone: "blue" as const, tab: "clients" as const },
  { id: "reports", label: "Reports", hint: "Analytics center", icon: "fa-solid fa-chart-column", tone: "blue" as const, tab: "reports" as const },
  { id: "upload", label: "Upload Document", hint: "Contracts", icon: "fa-solid fa-cloud-arrow-up", tone: "blue" as const, tab: "contracts" as const },
];
