export type LeadFormState = {
  lead_source: string;
  lead_status: string;
  salutation: string;
  first_name: string;
  last_name: string;
  title: string;
  company: string;
  email: string;
  mobile: string;
  interested_in: string;
  interested_specify: string;
  website: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_zip: string;
  address_country: string;
  description: string;
  remarks: string;
};

export const emptyLeadForm: LeadFormState = {
  lead_source: "",
  lead_status: "",
  salutation: "",
  first_name: "",
  last_name: "",
  title: "",
  company: "",
  email: "",
  mobile: "",
  interested_in: "",
  interested_specify: "",
  website: "",
  address_street: "",
  address_city: "",
  address_province: "",
  address_zip: "",
  address_country: "Philippines",
  description: "",
  remarks: "",
};

export const LEAD_SOURCE_OPTIONS = [
  "Advertisement",
  "Cold Call",
  "Employee Referral",
  "External Referral",
  "Online Store",
  "Partner",
  "Public Relations",
  "Sales Email Alias",
  "Seminar Partner",
  "Trade Show",
  "Web Download",
  "Web Research",
  "Chat",
  "Other",
];

export const LEAD_STATUS_OPTIONS = [
  "Attempted to Contact",
  "Contact in Future",
  "Contacted",
  "Junk Lead",
  "Lost Lead",
  "Not Contacted",
  "Pre-Qualified",
  "Not Qualified",
];

export const LEAD_SALUTATION_OPTIONS = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];

export const LEAD_INTERESTED_IN_OPTIONS = [
  "Web Development",
  "Domain Registration",
  "Web Hosting",
  "Email Hosting",
  "SSL Certificate",
  "Document Management",
  "Other",
];

export function leadDisplayName(lead: {
  company?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  salutation?: string | null;
}) {
  const person = [lead.salutation, lead.first_name, lead.last_name].filter(Boolean).join(" ").trim();
  const company = String(lead.company ?? "").trim();
  if (company && person) return `${company} (${person})`;
  return company || person || "—";
}

export function leadFormFromRow(row: Partial<LeadFormState>): LeadFormState {
  return {
    ...emptyLeadForm,
    lead_source: row.lead_source ?? "",
    lead_status: row.lead_status ?? "",
    salutation: row.salutation ?? "",
    first_name: row.first_name ?? "",
    last_name: row.last_name ?? "",
    title: row.title ?? "",
    company: row.company ?? "",
    email: row.email ?? "",
    mobile: row.mobile ?? "",
    interested_in: row.interested_in ?? "",
    interested_specify: row.interested_specify ?? "",
    website: row.website ?? "",
    address_street: row.address_street ?? "",
    address_city: row.address_city ?? "",
    address_province: row.address_province ?? "",
    address_zip: row.address_zip ?? "",
    address_country: row.address_country ?? "Philippines",
    description: row.description ?? "",
    remarks: row.remarks ?? "",
  };
}
