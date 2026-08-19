export const DEAL_STAGE_OPTIONS = [
  "Qualification",
  "Needs Analysis",
  "For Technical Approval",
  "Finance Approval",
  "Sales Manager's Approval",
  "Proposal Submitted",
  "Negotiation/Review",
  "Closed Won",
  "Closed Lost",
] as const;

export const AUTOMATIC_STAGE_OPTIONS = [
  "Pending Quotation - Web",
  "Pending Payment - Other service",
] as const;

export const CLIENT_STATUS_OPTIONS = ["Existing Client", "New Client", "In-House Account"] as const;
export const DEAL_TYPE_OPTIONS = CLIENT_STATUS_OPTIONS;

export const PRODUCT_STATUS_OPTIONS = [
  "Downgrade",
  "New Service",
  "Renewal",
  "Renewal - New Price",
  "Upgrade",
] as const;
export const DEAL_SUB_TYPE_OPTIONS = PRODUCT_STATUS_OPTIONS;

export const SUBJECT_OPTIONS = [
  "Add On",
  "Dedicated Bare Metal Server",
  "Dedicated Cloud Server",
  "Document Management System",
  "Domain Registration",
  "Managed I.T. Services",
  "Others",
  "Resellership",
  "Web Development",
  "Web Hosting - Shared",
] as const;

export const PRODUCT_NAMES_BY_SUBJECT: Record<string, readonly string[]> = {
  "Add On": [
    "Add On - Additional IP",
    "Add On - Auto Back-Up",
    "Add On - Bandwidth",
    "Add On - Codeguard",
    "Add On - Cpanel",
    "Add On - Disk Capacity",
    "Add On - Geotrust True Businessid",
    "Add On - Giga Bit Lan",
    "Add On - Immunify360",
    "Add On - Magic Spam Pro",
    "Add On - MS SQL (Shared)",
    "Add On - MS SQL (Dedicated)",
    "Add On - Raid",
    "Add On - Sitelock",
    "Add On - SSL",
    "Add On - Static IP",
    "Add On - Storage",
    "Add On - WhoIS",
    "Add On - Wildcard SSL",
    "Add On - Others",
  ],
  "Dedicated Bare Metal Server": [
    "Dedicated Bare Metal Custom",
    "Dedicated Bare Metal Enterprise",
    "Dedicated Bare Metal Professional",
    "Dedicated Bare Metal In-House",
  ],
  "Dedicated Cloud Server": [
    "Dedicated Cloud Business",
    "Dedicated Cloud Corporate",
    "Dedicated Cloud Custom",
    "Dedicated Cloud Enterprise",
    "Dedicated Cloud Essential",
    "Dedicated Cloud Premium",
    "Dedicated Cloud Professional",
    "Dedicated Cloud In-House",
  ],
  "Document Management System": ["Docukit", "FileHold", "FileCare"],
  "Domain Registration": [
    "Country Level Domain",
    "Educational Domain",
    "Government Domain",
    "Hybrid Top Level Domain",
    "Top Level Domain",
  ],
  "Managed I.T. Services": [
    "Eset Endpoint Protection",
    "Eset Protect Advanced Cloud",
    "Doc Pedro - Basic Plan",
    "Doc Pedro - Bronze Care",
    "Doc Pedro - Custom Care",
    "Doc Pedro - Gold Care",
    "Doc Pedro - On Demand",
    "Doc Pedro - Outsource Support",
    "Doc Pedro - Platinum Care",
    "Doc Pedro - Server Maintenance",
    "Doc Pedro - Silver Care",
    "Doc Pedro - Support Bundle",
    "Doc Pedro - System Admin",
    "Doc Pedro - Web",
    "Managed I.T. Services - Endpoint Protection",
    "Managed I.T. Services - On Demand",
    "Managed I.T. Services - Workstation Protection",
    "Managed I.T. Services - Manage Server",
    "Managed I.T. Services - Web Security",
    "Managed I.T. Services",
  ],
  Others: ["Doc Pedro - Others", "Other Services", "Consultancy Services"],
  Resellership: ["Resellership - Others"],
  "Web Development": [
    "Web Development - Piecemeal",
    "Web Development - Customized",
    "Web Development - Wordpress",
    "Web Development - Standard",
    "Web Development",
  ],
  "Web Hosting - Shared": [
    "Linux Cloud Business",
    "Linux Cloud Corporate",
    "Linux Cloud Deluxe",
    "Linux Cloud Standard",
    "Linux Cloud Starter",
    "Linux Cloud Custom",
    "Windows Cloud Business",
    "Windows Cloud Corporate",
    "Windows Cloud Deluxe",
    "Windows Cloud Standard",
    "Windows Cloud Starter",
    "Windows Cloud Custom",
    "Web Hosting - Default",
  ],
};

export function productNamesForSubject(subject: string) {
  return PRODUCT_NAMES_BY_SUBJECT[subject] ?? [];
}

export const SALES_STATUS_OPTIONS = [
  "Cancelled",
  "Cancelled - Upgrade",
  "Client Pending",
  "Cloned",
  "Create JO",
  "Need to Contact",
  "No Action Needed Yet",
  "Send Billing Statement",
] as const;

export const PAYMENT_STATUS_OPTIONS = [
  "Billed",
  "Cancelled",
  "Cancelled - Downgraded",
  "Cancelled - Replaced",
  "Cancelled - Upgraded",
  "For Collection",
  "Free",
  "In-House",
  "In-House - Cancelled",
  "Overdue",
  "Paid",
  "Partially Paid",
] as const;

export const PAYMENT_METHOD_OPTIONS = [
  "Bank Deposit",
  "Bank Transfer",
  "Credit Card",
  "PayPal",
  "Gcash/PayMaya",
  "Cash",
  "Check Pick-up",
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  "Monthly",
  "Quarterly",
  "Semi-annual",
  "Annual",
  "Biennial",
  "Triennial",
  "Quadrennial",
  "Quinquennial",
  "One Time Payment",
  "Others (Please specify)",
] as const;

export const DEAL_STATUS_OPTIONS = [
  "Active",
  "Cancelled",
  "Cancelled - Downgraded",
  "Cancelled - Upgraded",
  "Completed",
  "Inactive",
  "Pending JO",
] as const;

export const INVOICE_STATUS_OPTIONS = ["Sent to Client", "Received by Client"] as const;

export const COLLECTION_NOTE_OPTIONS = [
  "For Follow-Up",
  "No renewal advice from sales",
  "No response from customer",
  "Not Applicable",
] as const;

export type ClientOrderFormState = {
  dealOwnerId: string;
  campaignSource: string;
  probability: string;
  expectedRevenue: string;
  stage: string;
  closingDate: string;
  dealName: string;
  clientId: string;
  contactName: string;
  dealType: string;
  dealSubType: string;
  productCategory: string;
  productName: string;
  salesStatus: string;
  statusTriggerDate: string;
  joNumber: string;
  billingInCharge: string;
  dealStatus: string;
  paymentTerms: string;
  paymentMethod: string;
  paymentStatus: string;
  invoiceStatus: string;
  invoiceSentDate: string;
  invoiceReceivedDate: string;
  paymentCommitmentDate: string;
  collectionNote: string;
};

export const emptyClientOrderForm = (defaults?: Partial<ClientOrderFormState>): ClientOrderFormState => ({
  dealOwnerId: "",
  campaignSource: "",
  probability: "10",
  expectedRevenue: "",
  stage: "Qualification",
  closingDate: "",
  dealName: "",
  clientId: "",
  contactName: "",
  dealType: "",
  dealSubType: "",
  productCategory: "",
  productName: "",
  salesStatus: "",
  statusTriggerDate: "",
  joNumber: "",
  billingInCharge: "",
  dealStatus: "",
  paymentTerms: "",
  paymentMethod: "",
  paymentStatus: "",
  invoiceStatus: "",
  invoiceSentDate: "",
  invoiceReceivedDate: "",
  paymentCommitmentDate: "",
  collectionNote: "",
  ...defaults,
});

export function probabilityForStage(stage: string) {
  if (stage === "Closed Won") return "100";
  if (stage === "Closed Lost") return "0";
  if (stage === "Negotiation/Review") return "70";
  if (stage === "Proposal Submitted") return "60";
  if (stage === "Sales Manager's Approval") return "50";
  if (stage === "Finance Approval") return "40";
  if (stage === "For Technical Approval") return "30";
  if (stage === "Needs Analysis") return "20";
  return "10";
}

export function validateClientOrderForm(form: ClientOrderFormState) {
  if (!form.stage) return "Stage is required.";
  if (!form.dealName.trim()) return "Deal Name is required.";
  if (!form.clientId) return "Client Name is required.";
  if (!form.dealType) return "Client Status is required.";
  if (!form.dealSubType) return "Product Status is required.";
  if (!form.productCategory) return "Subject is required.";
  if (!form.productName) return "Product Category is required.";
  if (!form.salesStatus) return "Sales Status is required.";
  return null;
}

export function toApiPaymentStatus(label: string) {
  const value = label.trim().toLowerCase();
  if (value === "paid") return "paid";
  if (value === "overdue") return "overdue";
  if (value.includes("cancelled") || value.includes("canceled")) return "cancelled";
  return "pending";
}

export function toApiOrderStatus(label: string) {
  const value = label.trim().toLowerCase();
  if (value.includes("cancelled") || value.includes("canceled")) return "cancelled";
  return "pending";
}

export type DealMeta = {
  dealName?: string;
  campaignSource?: string;
  stage?: string;
  dealType?: string;
  dealSubType?: string;
  productCategory?: string;
  productName?: string;
  salesStatus?: string;
  probability?: string;
  expectedRevenue?: string;
  closingDate?: string;
  contactName?: string;
  joNumber?: string;
  billingInCharge?: string;
  dealStatus?: string;
  paymentTerms?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  invoiceStatus?: string;
  invoiceSentDate?: string;
  invoiceReceivedDate?: string;
  paymentCommitmentDate?: string;
  collectionNote?: string;
  statusTriggerDate?: string;
};

const DEAL_META_PREFIX = "[DEAL_META]";

export function parseDealMeta(notes?: string | null): DealMeta | null {
  const text = String(notes ?? "");
  const marker = text.indexOf(DEAL_META_PREFIX);
  if (marker < 0) return null;
  const jsonLine = text
    .slice(marker + DEAL_META_PREFIX.length)
    .split("\n")[0]
    ?.trim();
  if (!jsonLine?.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(jsonLine) as DealMeta;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function buildDealNotes(form: ClientOrderFormState) {
  const meta: DealMeta = {
    dealName: form.dealName.trim(),
    campaignSource: form.campaignSource.trim(),
    stage: form.stage,
    dealType: form.dealType,
    dealSubType: form.dealSubType,
    productCategory: form.productCategory,
    productName: form.productName,
    salesStatus: form.salesStatus,
    probability: form.probability,
    expectedRevenue: form.expectedRevenue,
    closingDate: form.closingDate,
    contactName: form.contactName.trim(),
    joNumber: form.joNumber.trim(),
    billingInCharge: form.billingInCharge,
    dealStatus: form.dealStatus,
    paymentTerms: form.paymentTerms,
    paymentMethod: form.paymentMethod,
    paymentStatus: form.paymentStatus,
    invoiceStatus: form.invoiceStatus,
    invoiceSentDate: form.invoiceSentDate,
    invoiceReceivedDate: form.invoiceReceivedDate,
    paymentCommitmentDate: form.paymentCommitmentDate,
    collectionNote: form.collectionNote,
    statusTriggerDate: form.statusTriggerDate,
  };

  const lines = [
    `${DEAL_META_PREFIX}${JSON.stringify(meta)}`,
    `Client Order · Payment: ${form.paymentMethod || "Unspecified"}`,
  ];
  if (form.joNumber.trim()) lines.push(`JO ${form.joNumber.trim()}`);
  if (form.collectionNote) lines.push(form.collectionNote);

  return lines.join("\n");
}
