import type { ClientInfoSheetSnapshot } from "@/lib/commerceAdmin/clientInfoSheet";

export type CustomerContactRow = {
  name: string;
  designation: string;
  remarks: string;
  contactNumbers: string;
  email: string;
};

export type CustomerInformationSheetView = {
  corporateName: string;
  corporateAddress: string;
  natureOfBusiness: string;
  companyContactNumber: string;
  companyTin: string;
  authorizedSignatory1: string;
  authorizedSignatory1Designation: string;
  authorizedSignatory2: string;
  authorizedSignatory2Designation: string;
  implementingContacts: [CustomerContactRow, CustomerContactRow, CustomerContactRow];
  technicalContact: CustomerContactRow;
  billingAttention: string;
  billingDesignation: string;
  billingContactNumbers: string;
  billingEmail: string;
  billingAddress: string;
  taxExemption: string;
  billingRemarks: string;
  customerCode: string;
  customerStatus: string;
  subscribedService: string;
  salesInCharge: string;
  internalRemarks: string;
};

function text(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function numbersFromParts(...parts: Array<string | undefined>) {
  return parts.map((part) => text(part)).filter(Boolean).join(" / ");
}

function rowFromBlock(
  person: string,
  designation: string,
  remarks: string,
  contactNumbers: string,
  email: string,
): CustomerContactRow {
  return {
    name: text(person),
    designation: text(designation),
    remarks: text(remarks),
    contactNumbers: text(contactNumbers),
    email: text(email),
  };
}

function emptyRow(): CustomerContactRow {
  return rowFromBlock("", "", "", "", "");
}

export function buildCustomerInformationSheetView(snapshot: ClientInfoSheetSnapshot): CustomerInformationSheetView {
  const info = snapshot.contactInformation;
  const signatories = info.signatories;
  const sig1 = signatories[0];
  const sig2 = signatories[1];

  const collection = info.collection;
  const technical = info.technical;
  const billing = info.billing;

  const primaryNumbers = numbersFromParts(snapshot.mobile, snapshot.phone);

  const implementingOfficial = collection.enabled
    ? rowFromBlock(
        collection.person,
        collection.designation,
        collection.instructions || collection.other,
        numbersFromParts(collection.mobile, collection.phone),
        collection.email,
      )
    : rowFromBlock(
        snapshot.contactPerson,
        "",
        "",
        primaryNumbers,
        snapshot.email,
      );

  const leadOne = rowFromBlock(
    sig1?.person || snapshot.contactPerson,
    sig1?.designation || "",
    sig1?.other || "",
    numbersFromParts(sig1?.mobile, sig1?.phone, snapshot.mobile),
    sig1?.email || snapshot.email,
  );

  const leadTwo = rowFromBlock(
    sig2?.person || technical.person,
    sig2?.designation || technical.designation,
    sig2?.other || technical.instructions,
    numbersFromParts(sig2?.mobile, sig2?.phone, technical.mobile, technical.phone),
    sig2?.email || technical.email,
  );

  const technicalContact = technical.enabled
    ? rowFromBlock(
        technical.person,
        technical.designation,
        technical.instructions || technical.other,
        numbersFromParts(technical.mobile, technical.phone),
        technical.email,
      )
    : emptyRow();

  const billingContactNumbers = billing.enabled
    ? numbersFromParts(billing.mobile, billing.phone)
    : primaryNumbers;

  return {
    corporateName: text(snapshot.company),
    corporateAddress: text(snapshot.billingAddress),
    natureOfBusiness: text(snapshot.industry),
    companyContactNumber: primaryNumbers,
    companyTin: text(snapshot.tinNumber),
    authorizedSignatory1: text(sig1?.person),
    authorizedSignatory1Designation: text(sig1?.designation),
    authorizedSignatory2: text(sig2?.person),
    authorizedSignatory2Designation: text(sig2?.designation),
    implementingContacts: [implementingOfficial, leadOne, leadTwo],
    technicalContact,
    billingAttention: billing.enabled ? text(billing.attention || billing.person) : text(snapshot.billingInCharge),
    billingDesignation: billing.enabled ? text(billing.designation) : "",
    billingContactNumbers,
    billingEmail: billing.enabled ? text(billing.email) : text(snapshot.email),
    billingAddress: billing.enabled && text(billing.address) ? text(billing.address) : text(snapshot.billingAddress),
    taxExemption: text(snapshot.taxClassification),
    billingRemarks: billing.enabled ? text(billing.instructions || billing.other) : "",
    customerCode: text(snapshot.workdriveFolderId),
    customerStatus: [text(snapshot.clientClassification), text(snapshot.clientType)].filter(Boolean).join(" / "),
    subscribedService: text(snapshot.website),
    salesInCharge: text(snapshot.clientOwner),
    internalRemarks: text(snapshot.otherNumbers),
  };
}

export const CUSTOMER_INFO_SHEET_FOOTER = [
  "Unit 907-909 Antel Global Corporate Center, Julia Vargas Avenue, Ortigas Center, Pasig City 1605",
  "Telephone (02) 8706-5796 | Mobile (0917) 626-3779 / (0908) 869-4069 | E-mail sales@webfocus.ph | Website www.webfocus.ph",
];
