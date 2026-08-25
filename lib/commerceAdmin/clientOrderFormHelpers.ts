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

export function allProductCategoryOptions() {
  const seen = new Set<string>();
  const options: string[] = [];
  for (const names of Object.values(PRODUCT_NAMES_BY_SUBJECT)) {
    for (const name of names) {
      if (seen.has(name)) continue;
      seen.add(name);
      options.push(name);
    }
  }
  return options;
}

function normalizeProductKey(value: string) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function subjectForProductName(productName: string) {
  const needle = normalizeProductKey(productName);
  if (!needle) return "";
  const needleWords = needle.split(" ").filter(Boolean);

  let bestSubject = "";
  let bestScore = 0;

  const consider = (subject: string, catalogRaw: string) => {
    const catalog = normalizeProductKey(catalogRaw);
    if (!catalog) return;
    const core = catalog.replace(/^add on /, "");
    if (!core) return;
    if (catalog === needle || core === needle) {
      bestSubject = subject;
      bestScore = 1000;
      return;
    }
    const coreWords = core.split(" ").filter(Boolean);
    const wordHit = core.length >= 3 && (needleWords.includes(core) || coreWords.includes(needle));
    const containsHit = core.length >= 6 && (needle.includes(core) || core.includes(needle));
    if (!wordHit && !containsHit) return;
    if (core.length > bestScore) {
      bestScore = core.length;
      bestSubject = subject;
    }
  };

  for (const [subject, names] of Object.entries(PRODUCT_NAMES_BY_SUBJECT)) {
    consider(subject, subject);
    for (const name of names) consider(subject, name);
    if (bestScore >= 1000) return bestSubject;
  }

  return bestSubject;
}

export const DEAL_NAME_OPTIONS = [
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
  "Web Development - Piecemeal",
  "Web Development - Customized",
  "Web Development - Wordpress",
  "Web Development - Standard",
  "Web Development",
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
  "Country Level Domain",
  "Educational Domain",
  "Government Domain",
  "Hybrid Top Level Domain",
  "Top Level Domain",
  "Docukit",
  "FileHold",
  "Dedicated Cloud Business",
  "Dedicated Cloud Corporate",
  "Dedicated Cloud Custom",
  "Dedicated Cloud Enterprise",
  "Dedicated Cloud Essential",
  "Dedicated Cloud Premium",
  "Dedicated Cloud Professional",
  "Dedicated Cloud In-House",
  "Dedicated Bare Metal Custom",
  "Dedicated Bare Metal Enterprise",
  "Dedicated Bare Metal Professional",
  "Dedicated Bare Metal In-House",
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
  "Doc Pedro - Others",
  "Web Hosting - Default",
  "Resellership - Others",
  "FileCare",
  "Managed I.T. Services",
  "Other Services",
  "Consultancy Services",
] as const;

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

export const CONTRACT_STATUS_OPTIONS = [
  "Completed",
  "Contract Not Updated",
  "Draft",
  "No Contract",
  "No Longer Required",
  "Sent to client",
  "Uploaded",
] as const;

export const DOMAIN_TYPE_OPTIONS = PRODUCT_NAMES_BY_SUBJECT["Domain Registration"];

export const DOMAIN_REGISTRAR_OPTIONS = ["Enom", "Webnic"] as const;

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
  contractStatus: string;
  contractSentDate: string;
  contractServiceStartDate: string;
  contractServiceEndDate: string;
  requirementStatus: string;
  totalContractValue: string;
  proposalConformeName: string;
  proofToProceedJoName: string;
  contractFileName: string;
  cancellationDocumentName: string;
  totalEstimatedCost: string;
  expectedDiscount: string;
  domainName: string;
  domainType: string;
  domainRegistrar: string;
  domainSubscriptionStartDate: string;
  domainSubscriptionEndDate: string;
  domainRegistrationStartDate: string;
  domainRegistrationExpirationDate: string;
  domainRegistrationCost: string;
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
  contractStatus: "",
  contractSentDate: "",
  contractServiceStartDate: "",
  contractServiceEndDate: "",
  requirementStatus: "",
  totalContractValue: "",
  proposalConformeName: "",
  proofToProceedJoName: "",
  contractFileName: "",
  cancellationDocumentName: "",
  totalEstimatedCost: "",
  expectedDiscount: "",
  domainName: "",
  domainType: "",
  domainRegistrar: "",
  domainSubscriptionStartDate: "",
  domainSubscriptionEndDate: "",
  domainRegistrationStartDate: "",
  domainRegistrationExpirationDate: "",
  domainRegistrationCost: "",
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

export function validateClientOrderForm(
  form: ClientOrderFormState,
  options?: { requireCrmFields?: boolean },
) {
  if (!form.stage) return "Stage is required.";
  if (!form.dealName.trim()) return "Deal Name is required.";
  if (!form.clientId) return "Client Name is required.";
  if (options?.requireCrmFields === false) return null;
  if (!form.dealType) return "Client Status is required.";
  if (!form.dealSubType) return "Product Status is required.";
  if (!form.productCategory) return "Product Category is required.";
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
  contractStatus?: string;
  contractSentDate?: string;
  contractServiceStartDate?: string;
  contractServiceEndDate?: string;
  requirementStatus?: string;
  totalContractValue?: string;
  proposalConformeName?: string;
  proofToProceedJoName?: string;
  contractFileName?: string;
  cancellationDocumentName?: string;
  totalEstimatedCost?: string;
  expectedDiscount?: string;
  domainName?: string;
  domainType?: string;
  domainRegistrar?: string;
  domainSubscriptionStartDate?: string;
  domainSubscriptionEndDate?: string;
  domainRegistrationStartDate?: string;
  domainRegistrationExpirationDate?: string;
  domainRegistrationCost?: string;
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

function toDateInput(value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function matchOption(options: readonly string[], value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return options.find((option) => option.toLowerCase() === text.toLowerCase()) ?? text;
}

export function clientOrderFormFromTransaction(transaction: {
  customer_id?: number | null;
  user_id?: number | null;
  notes?: string | null;
  payment_status?: string | null;
  order_status?: string | null;
  grand_total?: string | number | null;
  issued_date?: string | null;
  transacted_at?: string | null;
  items?: Array<{ name?: string | null }>;
}): ClientOrderFormState {
  const meta = parseDealMeta(transaction.notes);
  const itemName = String(transaction.items?.[0]?.name ?? "").trim();
  const dealName = String(meta?.dealName ?? "").trim() || itemName;
  const revenue = String(meta?.expectedRevenue ?? transaction.grand_total ?? "").trim();

  return emptyClientOrderForm({
    dealOwnerId: transaction.user_id ? String(transaction.user_id) : "",
    campaignSource: String(meta?.campaignSource ?? "").trim(),
    probability: String(meta?.probability ?? "").replace(/%/g, "").trim() || "10",
    expectedRevenue: revenue,
    stage: String(meta?.stage ?? "").trim() || "Qualification",
    closingDate: toDateInput(meta?.closingDate || transaction.issued_date || transaction.transacted_at),
    dealName,
    clientId: transaction.customer_id ? String(transaction.customer_id) : "",
    contactName: String(meta?.contactName ?? "").trim(),
    dealType: matchOption(CLIENT_STATUS_OPTIONS, meta?.dealType),
    dealSubType: matchOption(PRODUCT_STATUS_OPTIONS, meta?.dealSubType),
    productCategory:
      matchOption(SUBJECT_OPTIONS, meta?.productCategory) || subjectForProductName(dealName),
    productName: String(meta?.productName ?? "").trim() || dealName,
    salesStatus: matchOption(SALES_STATUS_OPTIONS, meta?.salesStatus),
    statusTriggerDate: toDateInput(meta?.statusTriggerDate),
    joNumber: String(meta?.joNumber ?? "").trim(),
    billingInCharge: String(meta?.billingInCharge ?? "").trim(),
    dealStatus: matchOption(DEAL_STATUS_OPTIONS, meta?.dealStatus),
    paymentTerms: matchOption(PAYMENT_TERMS_OPTIONS, meta?.paymentTerms),
    paymentMethod: matchOption(PAYMENT_METHOD_OPTIONS, meta?.paymentMethod),
    paymentStatus: matchOption(PAYMENT_STATUS_OPTIONS, meta?.paymentStatus || transaction.payment_status),
    invoiceStatus: matchOption(INVOICE_STATUS_OPTIONS, meta?.invoiceStatus),
    invoiceSentDate: toDateInput(meta?.invoiceSentDate),
    invoiceReceivedDate: toDateInput(meta?.invoiceReceivedDate),
    paymentCommitmentDate: toDateInput(meta?.paymentCommitmentDate),
    collectionNote: matchOption(COLLECTION_NOTE_OPTIONS, meta?.collectionNote),
    contractStatus: matchOption(CONTRACT_STATUS_OPTIONS, meta?.contractStatus),
    contractSentDate: toDateInput(meta?.contractSentDate),
    contractServiceStartDate: toDateInput(meta?.contractServiceStartDate),
    contractServiceEndDate: toDateInput(meta?.contractServiceEndDate),
    requirementStatus: String(meta?.requirementStatus ?? "").trim(),
    totalContractValue: String(meta?.totalContractValue ?? "").trim(),
    proposalConformeName: String(meta?.proposalConformeName ?? "").trim(),
    proofToProceedJoName: String(meta?.proofToProceedJoName ?? "").trim(),
    contractFileName: String(meta?.contractFileName ?? "").trim(),
    cancellationDocumentName: String(meta?.cancellationDocumentName ?? "").trim(),
    totalEstimatedCost: String(meta?.totalEstimatedCost ?? "").trim(),
    expectedDiscount: String(meta?.expectedDiscount ?? "").trim(),
    domainName: String(meta?.domainName ?? "").trim(),
    domainType: matchOption(DOMAIN_TYPE_OPTIONS, meta?.domainType) || matchOption(DOMAIN_TYPE_OPTIONS, dealName),
    domainRegistrar: matchOption(DOMAIN_REGISTRAR_OPTIONS, meta?.domainRegistrar),
    domainSubscriptionStartDate: toDateInput(meta?.domainSubscriptionStartDate),
    domainSubscriptionEndDate: toDateInput(meta?.domainSubscriptionEndDate),
    domainRegistrationStartDate: toDateInput(meta?.domainRegistrationStartDate),
    domainRegistrationExpirationDate: toDateInput(meta?.domainRegistrationExpirationDate),
    domainRegistrationCost: String(meta?.domainRegistrationCost ?? "").trim(),
  });
}

function dealMetaFromForm(form: ClientOrderFormState): DealMeta {
  return {
    dealName: form.dealName.trim(),
    campaignSource: form.campaignSource.trim(),
    stage: form.stage,
    dealType: form.dealType,
    dealSubType: form.dealSubType,
    productCategory: form.productCategory,
    productName: form.productName.trim() || form.dealName.trim(),
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
    contractStatus: form.contractStatus,
    contractSentDate: form.contractSentDate,
    contractServiceStartDate: form.contractServiceStartDate,
    contractServiceEndDate: form.contractServiceEndDate,
    requirementStatus: form.requirementStatus,
    totalContractValue: form.totalContractValue,
    proposalConformeName: form.proposalConformeName,
    proofToProceedJoName: form.proofToProceedJoName,
    contractFileName: form.contractFileName,
    cancellationDocumentName: form.cancellationDocumentName,
    totalEstimatedCost: form.totalEstimatedCost,
    expectedDiscount: form.expectedDiscount,
    domainName: form.domainName.trim(),
    domainType: form.domainType,
    domainRegistrar: form.domainRegistrar,
    domainSubscriptionStartDate: form.domainSubscriptionStartDate,
    domainSubscriptionEndDate: form.domainSubscriptionEndDate,
    domainRegistrationStartDate: form.domainRegistrationStartDate,
    domainRegistrationExpirationDate: form.domainRegistrationExpirationDate,
    domainRegistrationCost: form.domainRegistrationCost,
  };
}

export function mergeDealMetaIntoNotes(existingNotes: string | null | undefined, form: ClientOrderFormState) {
  const metaLine = `${DEAL_META_PREFIX}${JSON.stringify(dealMetaFromForm(form))}`;
  const text = String(existingNotes ?? "");
  if (text.includes(DEAL_META_PREFIX)) {
    return text.replace(/\[DEAL_META\]\{[\s\S]*?\}(?:\n|$)/, `${metaLine}\n`).trim();
  }
  return [metaLine, text].filter(Boolean).join("\n");
}

export function buildDealNotes(form: ClientOrderFormState) {
  const lines = [
    `${DEAL_META_PREFIX}${JSON.stringify(dealMetaFromForm(form))}`,
    `Client Order · Payment: ${form.paymentMethod || "Unspecified"}`,
  ];
  if (form.joNumber.trim()) lines.push(`JO ${form.joNumber.trim()}`);
  if (form.collectionNote) lines.push(form.collectionNote);

  return lines.join("\n");
}
