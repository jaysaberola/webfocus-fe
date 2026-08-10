export type ClientCrmFormState = {
  owner_id: number | null;
  company: string;
  industry: string;
  tax_classification: string;
  tin_number: string;
  other_numbers: string;
  currency: string;
  workdrive_folder_url: string;
  client_classification: string;
  client_type: string;
  contact_person: string;
  mobile: string;
  phone: string;
  email: string;
  website: string;
  ownership: string;
  billing_in_charge: string;
  exchange_rate: string;
  workdrive_folder_id: string;
  address_street: string;
  address_city: string;
  address_province: string;
  address_zip: string;
  address_country: string;
  shipping_street: string;
  shipping_city: string;
  shipping_province: string;
  shipping_zip: string;
  shipping_country: string;
  bir_certificate: File | null;
  business_permit: File | null;
  sec_dti_registration: File | null;
  valid_id_signatories: File | null;
  gen_info_sheet: File | null;
};

export const emptyClientCrmForm: ClientCrmFormState = {
  owner_id: null,
  company: "",
  industry: "",
  tax_classification: "",
  tin_number: "",
  other_numbers: "",
  currency: "PHP",
  workdrive_folder_url: "",
  client_classification: "",
  client_type: "",
  contact_person: "",
  mobile: "",
  phone: "",
  email: "",
  website: "",
  ownership: "",
  billing_in_charge: "",
  exchange_rate: "1",
  workdrive_folder_id: "",
  address_street: "",
  address_city: "",
  address_province: "",
  address_zip: "",
  address_country: "",
  shipping_street: "",
  shipping_city: "",
  shipping_province: "",
  shipping_zip: "",
  shipping_country: "",
  bir_certificate: null,
  business_permit: null,
  sec_dti_registration: null,
  valid_id_signatories: null,
  gen_info_sheet: null,
};

export const CLIENT_INDUSTRY_OPTIONS = [
  "Technology",
  "Finance",
  "Healthcare",
  "Education",
  "Retail",
  "Manufacturing",
  "Government",
  "Other",
];

export const CLIENT_TAX_CLASSIFICATION_OPTIONS = [
  "VAT Registered",
  "Non-VAT",
  "Tax Exempt",
];

export const CLIENT_CLASSIFICATION_OPTIONS = ["New", "Existing"];

export const CLIENT_TYPE_OPTIONS = ["Corporate", "SME", "Individual", "Government"];

export const CLIENT_OWNERSHIP_OPTIONS = ["Private", "Public", "Government", "NGO"];

export const CLIENT_CURRENCY_OPTIONS = ["PHP", "USD", "EUR", "SGD", "JPY"];

export function parseMobileDigits(mobile?: string | null) {
  if (!mobile) return "";
  const digits = mobile.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length >= 11) {
    return digits.slice(2, 11);
  }
  if (digits.length >= 9) {
    return digits.slice(-9);
  }
  return digits.slice(0, 9);
}

export function validateClientCrmForm(form: ClientCrmFormState) {
  if (!form.company.trim()) {
    return "Client Name is required.";
  }
  if (!form.email.trim()) {
    return "Email is required.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email.trim())) {
    return "Please enter a valid email address.";
  }

  if (form.mobile.trim() && !/^\d{9}$/.test(form.mobile.trim())) {
    return "Contact Number must be exactly 9 digits (e.g. 917123456).";
  }

  return null;
}

export type ClientAccountFormState = {
  fname: string;
  lname: string;
  company: string;
  email: string;
  address: string;
  mobile: string;
  phone: string;
  avatar: File | null;
  services: string[];
  addons: string[];
};

export const emptyClientAccountForm: ClientAccountFormState = {
  fname: "",
  lname: "",
  company: "",
  email: "",
  address: "",
  mobile: "",
  phone: "",
  avatar: null,
  services: [],
  addons: [],
};

export function validateClientAccountForm(form: ClientAccountFormState, mode: "create" | "edit") {
  if (
    !form.fname.trim() ||
    !form.lname.trim() ||
    !form.company.trim() ||
    !form.email.trim() ||
    !form.address.trim() ||
    !form.mobile.trim()
  ) {
    return "Please fill in all required fields (First Name, Last Name, Company Name, Email, Address, Mobile Number).";
  }

  if (mode === "create" && form.services.length === 0) {
    return "Please select at least one Active Service / Product.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(form.email.trim())) {
    return "Please enter a valid email address format (e.g. contact@domain.ph).";
  }

  const mobileRegex = /^\d{9}$/;
  if (!mobileRegex.test(form.mobile.trim())) {
    return "Mobile number must be exactly 9 digits (e.g. 917123456).";
  }

  return null;
}
