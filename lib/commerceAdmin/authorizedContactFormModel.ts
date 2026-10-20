import type { ClientContactBlock, ClientSignatory } from "@/lib/commerceAdmin/clientFormHelpers";
import type { ClientInfoSheetSnapshot } from "@/lib/commerceAdmin/clientInfoSheet";

export type AuthorizedContactLine = {
  fullName: string;
  designation: string;
  department: string;
  contactNumber: string;
  email: string;
};

export type AuthorizedContactFormView = {
  registeredAccountName: string;
  companyName: string;
  primaryContactName: string;
  contactNumber: string;
  domainName: string;
  emailAddress: string;
  current: AuthorizedContactLine;
  additional: AuthorizedContactLine;
};

export function displayField(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function signatoryHasContent(row: ClientSignatory) {
  return Boolean(row.person || row.designation || row.email || row.phone || row.mobile || row.other);
}

function blockHasContent(block: ClientContactBlock) {
  if (!block.enabled) return false;
  return Boolean(
    block.person ||
      block.designation ||
      block.email ||
      block.phone ||
      block.mobile ||
      block.attention ||
      block.instructions ||
      block.address ||
      block.other,
  );
}

export function domainFromWebsite(website: string) {
  const raw = website.trim();
  if (!raw) return "";
  try {
    const url = raw.includes("://") ? raw : `https://${raw}`;
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0] ?? raw;
  }
}

function blockAsContact(block: ClientContactBlock): AuthorizedContactLine {
  return {
    fullName: displayField(block.person),
    designation: displayField(block.designation),
    department: displayField(block.attention),
    contactNumber: displayField(block.mobile) || displayField(block.phone),
    email: displayField(block.email),
  };
}

function emptyContact(): AuthorizedContactLine {
  return { fullName: "", designation: "", department: "", contactNumber: "", email: "" };
}

function pickAuthorizedContacts(snapshot: ClientInfoSheetSnapshot): {
  current: AuthorizedContactLine;
  additional: AuthorizedContactLine;
} {
  const signatories = snapshot.contactInformation.signatories.filter(signatoryHasContent);
  const fromSignatory = (row: ClientSignatory): AuthorizedContactLine => ({
    fullName: displayField(row.person),
    designation: displayField(row.designation),
    department: "",
    contactNumber: displayField(row.mobile) || displayField(row.phone),
    email: displayField(row.email),
  });

  const current =
    signatories[0] != null
      ? fromSignatory(signatories[0])
      : {
          fullName: displayField(snapshot.contactPerson),
          designation: "",
          department: "",
          contactNumber: displayField(snapshot.mobile) || displayField(snapshot.phone),
          email: displayField(snapshot.email),
        };

  let additional = emptyContact();
  if (signatories[1]) {
    additional = fromSignatory(signatories[1]);
  } else if (snapshot.contactInformation.billing.enabled && blockHasContent(snapshot.contactInformation.billing)) {
    additional = blockAsContact(snapshot.contactInformation.billing);
  } else if (
    snapshot.contactInformation.technical.enabled &&
    blockHasContent(snapshot.contactInformation.technical)
  ) {
    additional = blockAsContact(snapshot.contactInformation.technical);
  } else if (
    snapshot.contactInformation.collection.enabled &&
    blockHasContent(snapshot.contactInformation.collection)
  ) {
    additional = blockAsContact(snapshot.contactInformation.collection);
  }

  return { current, additional };
}

export function buildAuthorizedContactFormView(snapshot: ClientInfoSheetSnapshot): AuthorizedContactFormView {
  const domain = domainFromWebsite(snapshot.website);
  const { current, additional } = pickAuthorizedContacts(snapshot);
  return {
    registeredAccountName: displayField(snapshot.company),
    companyName: displayField(snapshot.company),
    primaryContactName: displayField(snapshot.contactPerson),
    contactNumber: displayField(snapshot.mobile) || displayField(snapshot.phone),
    domainName: domain,
    emailAddress: displayField(snapshot.email),
    current,
    additional,
  };
}

export const AUTHORIZED_CONTACT_FOOTER_LINES = [
  "Unit 907, 909 Antel Global Corporate Center, Julia Vargas Avenue, Ortigas Center, Pasig City 1605 Philippines",
  "Telephone (02) 8706-5795 | Mobile (0917) 569-7380 / (0908) 869-4069",
  "E-mail sales@webfocus.ph | Website www.webfocus.ph",
];

export const WEBFOCUS_LOGO_PATH = "/images/webfocus-logo.svg";
export const WEBFOCUS_TAGLINE = "Your solution in innovative digital transformation";
