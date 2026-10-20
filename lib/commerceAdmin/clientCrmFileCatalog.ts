export type ClientFolderFile = {
  id: string;
  label: string;
  fileName: string;
  url?: string | null;
  meta?: string;
  source: "crm" | "receipt" | "contract";
};

export const CRM_ATTACHMENT_FIELDS: Array<{ key: string; label: string }> = [
  { key: "bir_certificate", label: "BIR Certificate of Registration" },
  { key: "business_permit", label: "Business Permit" },
  { key: "sec_dti_registration", label: "SEC/DTI Registration" },
  { key: "valid_id_signatories", label: "Valid ID of Signatories" },
  { key: "gen_info_sheet", label: "Gen. Info and Customer Info Sheet" },
];

export function fileNameFromPath(path?: string | null) {
  const raw = String(path ?? "").trim();
  if (!raw) return "";
  const parts = raw.split(/[/\\]/);
  return parts[parts.length - 1] || raw;
}
