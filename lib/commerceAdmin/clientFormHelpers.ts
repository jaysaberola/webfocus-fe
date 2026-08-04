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
