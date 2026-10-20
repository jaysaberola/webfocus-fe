import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import type { ClientInfoSheetSnapshot } from "@/lib/commerceAdmin/clientInfoSheet";
import {
  CUSTOMER_INFO_SHEET_FOOTER,
  buildCustomerInformationSheetView,
  type CustomerContactRow,
} from "@/lib/commerceAdmin/customerInformationSheetModel";
import { svgUrlToPngArrayBuffer } from "@/lib/commerceAdmin/svgToPng";

const FONT = "Segoe UI";
const ORANGE = "EA580C";
const ORANGE_LIGHT = "FFEDD5";
const BORDER = "FB923C";
const INK = "1F2937";
const LABEL = "9A3412";

const BORDER_ALL = {
  top: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
  left: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
  right: { style: BorderStyle.SINGLE, size: 4, color: BORDER },
};

function run(text: string, options?: { bold?: boolean; size?: number; color?: string }) {
  return new TextRun({
    text: text || " ",
    font: FONT,
    size: options?.size ?? 16,
    bold: options?.bold,
    color: options?.color ?? INK,
  });
}

function sectionCell(title: string) {
  return new TableCell({
    columnSpan: 4,
    borders: BORDER_ALL,
    shading: { fill: ORANGE, type: ShadingType.CLEAR, color: "auto" },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [run(title, { bold: true, size: 16, color: "FFFFFF" })],
      }),
    ],
  });
}

function subHeadCell(title: string) {
  return new TableCell({
    columnSpan: 4,
    borders: BORDER_ALL,
    shading: { fill: ORANGE_LIGHT, type: ShadingType.CLEAR, color: "auto" },
    children: [new Paragraph({ children: [run(title, { bold: true, size: 15, color: LABEL })] })],
  });
}

function labelCell(label: string) {
  return new TableCell({
    borders: BORDER_ALL,
    shading: { fill: "FFF7ED", type: ShadingType.CLEAR, color: "auto" },
    children: [new Paragraph({ children: [run(label, { bold: true, size: 15, color: LABEL })] })],
  });
}

function valueCell(value: string, span = 1) {
  return new TableCell({
    columnSpan: span,
    borders: BORDER_ALL,
    children: [new Paragraph({ children: [run(value, { size: 16 })] })],
  });
}

function lvRow(label: string, value: string, valueSpan = 3) {
  return new TableRow({ children: [labelCell(label), valueCell(value, valueSpan)] });
}

function splitRow(labelA: string, valueA: string, labelB: string, valueB: string) {
  return new TableRow({
    children: [labelCell(labelA), valueCell(valueA), labelCell(labelB), valueCell(valueB)],
  });
}

function contactBlock(title: string, row: CustomerContactRow) {
  return [
    new TableRow({ children: [subHeadCell(title)] }),
    splitRow("Name", row.name, "Designation", row.designation),
    lvRow("Remarks", row.remarks),
    splitRow("Contact Number/s", row.contactNumbers, "Email Address", row.email),
  ];
}

function tableSection(title: string, rows: TableRow[]) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [sectionCell(title)] }), ...rows],
  });
}

export async function buildCustomerInformationSheetDocx(snapshot: ClientInfoSheetSnapshot): Promise<Blob> {
  const view = buildCustomerInformationSheetView(snapshot);
  let logoPng: ArrayBuffer | null = null;
  if (typeof window !== "undefined") {
    try {
      logoPng = await svgUrlToPngArrayBuffer(`${window.location.origin}/images/webfocus-logo.svg`, 420);
    } catch {
      logoPng = null;
    }
  }

  const header = new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                children: [new Paragraph({ children: [run("Customer Information Sheet", { bold: true, size: 34, color: ORANGE })] })],
              }),
              new TableCell({
                borders: { top: { style: BorderStyle.SINGLE, color: BORDER }, bottom: { style: BorderStyle.SINGLE, color: BORDER }, left: { style: BorderStyle.SINGLE, color: BORDER }, right: { style: BorderStyle.SINGLE, color: BORDER } },
                children: logoPng
                  ? [new Paragraph({ children: [new ImageRun({ type: "png", data: logoPng, transformation: { width: 130, height: 30 } })] })]
                  : [new Paragraph({ children: [run("WebFocus", { bold: true, color: ORANGE })] })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  const footer = new Footer({
    children: CUSTOMER_INFO_SHEET_FOOTER.map(
      (line) =>
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [run(line, { size: 10, color: "64748B" })],
        }),
    ),
  });

  const companyTable = tableSection("COMPANY DETAILS", [
    lvRow("Corporate Name", view.corporateName),
    lvRow("Corporate Address", view.corporateAddress),
    splitRow("Nature of Business (Industry)", view.natureOfBusiness, "Contact Number", view.companyContactNumber),
    lvRow("Company TIN", view.companyTin),
    splitRow("Authorized Signatory 1", view.authorizedSignatory1, "Designation", view.authorizedSignatory1Designation),
    splitRow("Authorized Signatory 2", view.authorizedSignatory2, "Designation", view.authorizedSignatory2Designation),
  ]);

  const implementingRows = [
    ...contactBlock("Official In-Charge", view.implementingContacts[0]),
    ...contactBlock("Lead Coordinator", view.implementingContacts[1]),
    ...contactBlock("Lead Coordinator", view.implementingContacts[2]),
  ];
  const implementingTable = tableSection("IMPLEMENTING DEPARTMENT CONTACT DETAILS", implementingRows);

  const technicalTable = tableSection("TECHNICAL DEPARTMENT CONTACT DETAILS", [
    splitRow("Name", view.technicalContact.name, "Designation", view.technicalContact.designation),
    splitRow("Contact Number/s", view.technicalContact.contactNumbers, "Email Address", view.technicalContact.email),
  ]);

  const billingTable = tableSection("BILLING DETAILS", [
    splitRow("Attention To (Name)", view.billingAttention, "Designation", view.billingDesignation),
    splitRow("Contact Number/s", view.billingContactNumbers, "Email Address", view.billingEmail),
    lvRow("Billing Address", view.billingAddress),
    splitRow("Tax Exemption (If Any)", view.taxExemption, "Remarks", view.billingRemarks),
  ]);

  const internalTable = tableSection("FOR WEBFOCUS SOLUTIONS, INC.'S USE ONLY", [
    splitRow("Customer Code", view.customerCode, "Status (New/Renewal)", view.customerStatus),
    splitRow("Subscribed Service", view.subscribedService, "Sales In-Charge", view.salesInCharge),
    lvRow("Remarks", view.internalRemarks),
  ]);

  const doc = new Document({
    styles: { default: { document: { run: { font: FONT, size: 16, color: INK } } } },
    sections: [
      {
        properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
        headers: { default: header },
        footers: { default: footer },
        children: [
          companyTable,
          new Paragraph({ spacing: { after: 80 } }),
          implementingTable,
          new Paragraph({ spacing: { after: 80 } }),
          technicalTable,
          new Paragraph({ spacing: { after: 80 } }),
          billingTable,
          new Paragraph({ spacing: { after: 80 } }),
          internalTable,
          new Paragraph({
            spacing: { before: 120, after: 80 },
            children: [
              run("Consent to Data Privacy — I hereby give my consent to the collection, use, monitoring, disclosure, or transfer of my Personal Information in accordance with WebFocus Solutions, Inc. Data Privacy Policy.", {
                size: 15,
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [splitRow("SIGNATURE OVER PRINTED NAME", "", "DATE", "")],
          }),
        ],
      },
    ],
  });

  return Packer.toBlob(doc);
}
