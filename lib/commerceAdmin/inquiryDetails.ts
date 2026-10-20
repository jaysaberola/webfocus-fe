import type { ContactInquiryRow } from "@/services/inquiryService";

export type InquiryDetailField = {
  label: string;
  value: string;
  href?: string;
  wide?: boolean;
};

function formatReceived(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function inquiryName(row: ContactInquiryRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || "—";
}

export function inquiryDetailFields(inquiry: ContactInquiryRow): InquiryDetailField[] {
  const preferred = inquiry.preferred_services?.length ? inquiry.preferred_services.join(", ") : "—";
  const email = inquiry.email?.trim() || "—";
  const phone = inquiry.contact_number?.trim() || "—";

  return [
    { label: "Customer name", value: inquiryName(inquiry) },
    { label: "Inquiry type", value: inquiry.inquiry_type || "—" },
    {
      label: "Email",
      value: email,
      href: email !== "—" ? `mailto:${email}` : undefined,
    },
    {
      label: "Mobile number",
      value: phone,
      href: phone !== "—" ? `tel:${phone.replace(/\s/g, "")}` : undefined,
    },
    { label: "Preferred services", value: preferred, wide: true },
    { label: "Received", value: formatReceived(inquiry.created_at) },
  ];
}

/** @deprecated Use inquiryDetailFields */
export function inquiryDetailRows(inquiry: ContactInquiryRow) {
  return inquiryDetailFields(inquiry).map(({ label, value }) => ({ label, value }));
}
