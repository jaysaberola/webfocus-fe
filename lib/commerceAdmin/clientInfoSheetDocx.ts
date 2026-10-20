import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import {
  AUTHORIZED_CONTACT_FOOTER_LINES,
  WEBFOCUS_TAGLINE,
  buildAuthorizedContactFormView,
  type AuthorizedContactLine,
} from "@/lib/commerceAdmin/authorizedContactFormModel";
import type { ClientInfoSheetSnapshot } from "@/lib/commerceAdmin/clientInfoSheet";
import { svgUrlToPngArrayBuffer } from "@/lib/commerceAdmin/svgToPng";

const INK = "1F2937";
const MUTED = "64748B";
const LINE = "94A3B8";
const ACCENT = "FF8C00";
const FONT = "Segoe UI";

const NO_BORDER = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

const UNDERLINE = {
  ...NO_BORDER,
  bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE },
};

function run(
  text: string,
  options?: { bold?: boolean; italics?: boolean; size?: number; color?: string },
) {
  return new TextRun({ text, font: FONT, size: options?.size ?? 22, color: options?.color ?? INK, bold: options?.bold, italics: options?.italics });
}

function uiRun(
  text: string,
  options?: { bold?: boolean; size?: number; color?: string },
) {
  return new TextRun({
    text,
    font: FONT,
    size: options?.size ?? 17,
    color: options?.color ?? MUTED,
    bold: options?.bold,
  });
}

function bodyParagraph(text: string, spacingAfter = 140) {
  return new Paragraph({ spacing: { after: spacingAfter }, children: [run(text)] });
}

function sectionTitle(text: string) {
  return new Paragraph({
    spacing: { before: 180, after: 90 },
    children: [run(text, { bold: true })],
  });
}

function subTitle(text: string) {
  return new Paragraph({
    spacing: { before: 100, after: 70 },
    children: [run(text, { bold: true })],
  });
}

function underlineField(label: string, value: string, labelWidth = 30) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_BORDER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: labelWidth, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            children: [new Paragraph({ children: [run(`${label}`, { bold: true })] })],
          }),
          new TableCell({
            width: { size: 100 - labelWidth, type: WidthType.PERCENTAGE },
            borders: UNDERLINE,
            children: [new Paragraph({ children: [run(value || " ")] })],
          }),
        ],
      }),
    ],
  });
}

function contactBlock(title: string, contact: AuthorizedContactLine) {
  return [
    subTitle(title),
    underlineField("Full Name:", contact.fullName, 26),
    underlineField("Designation/Position:", contact.designation, 26),
    underlineField("Department:", contact.department, 26),
    underlineField("Contact Number:", contact.contactNumber, 26),
    underlineField("Email Address:", contact.email, 26),
  ];
}

function buildHeader(logoPng: ArrayBuffer | null) {
  const brandCellChildren: Paragraph[] = [];
  if (logoPng) {
    brandCellChildren.push(
      new Paragraph({
        children: [
          new ImageRun({
            type: "png",
            data: logoPng,
            transformation: { width: 220, height: 51 },
          }),
        ],
      }),
    );
  } else {
    brandCellChildren.push(
      new Paragraph({ children: [uiRun("WebFocus", { size: 32, bold: true, color: "6B7280" })] }),
      new Paragraph({ children: [uiRun("Solutions, Inc.", { size: 24, bold: true, color: "6B7280" })] }),
    );
  }
  brandCellChildren.push(
    new Paragraph({
      spacing: { after: 60 },
      children: [uiRun(WEBFOCUS_TAGLINE, { size: 16 })],
    }),
  );

  return new Header({
    children: [
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER,
        rows: [
          new TableRow({
            children: [
              new TableCell({ borders: NO_BORDER, children: brandCellChildren }),
              new TableCell({
                width: { size: 10, type: WidthType.PERCENTAGE },
                borders: NO_BORDER,
                children: [
                  new Table({
                    width: { size: 720, type: WidthType.DXA },
                    borders: NO_BORDER,
                    rows: [
                      new TableRow({
                        children: [
                          new TableCell({
                            borders: {
                              ...NO_BORDER,
                              bottom: { style: BorderStyle.SINGLE, size: 20, color: ACCENT },
                            },
                            children: [new Paragraph("")],
                          }),
                        ],
                      }),
                    ],
                  }),
                  new Paragraph({
                    alignment: AlignmentType.RIGHT,
                    spacing: { before: 30 },
                    children: [uiRun("1", { size: 24, bold: true, color: INK })],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function buildFooter() {
  return new Footer({
    children: AUTHORIZED_CONTACT_FOOTER_LINES.map((line, index) =>
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: index === 0 ? 100 : 0, after: index === AUTHORIZED_CONTACT_FOOTER_LINES.length - 1 ? 0 : 30 },
        children: [uiRun(line, { size: 15 })],
      }),
    ),
  });
}

export async function buildClientInfoSheetDocx(snapshot: ClientInfoSheetSnapshot): Promise<Blob> {
  const view = buildAuthorizedContactFormView(snapshot);
  let logoPng: ArrayBuffer | null = null;
  if (typeof window !== "undefined") {
    try {
      logoPng = await svgUrlToPngArrayBuffer(`${window.location.origin}/images/webfocus-logo.svg`, 480);
    } catch {
      logoPng = null;
    }
  }

  const children: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 140 },
      children: [run("AUTHORIZED CONTACT INFORMATION FORM", { bold: true, size: 26 })],
    }),
    bodyParagraph(
      "To ensure the security and proper management of client information, please complete this form to authorize and/or update contact details associated with your active subscription with WebFocus Solutions, Inc.",
    ),
    new Paragraph({
      spacing: { after: 140 },
      children: [
        run("Note: ", { bold: true }),
        run("This completed form must be submitted using the registered or authorized email address on file to be processed."),
      ],
    }),
    sectionTitle("SECTION 1: ACCOUNT INFORMATION"),
    underlineField("Registered Account Name:", view.registeredAccountName, 34),
    new Paragraph({
      spacing: { after: 100 },
      indent: { left: 540 },
      children: [run("(Please indicate the domain name as currently registered)", { italics: true, size: 19, color: MUTED })],
    }),
    subTitle("Contact Information"),
    underlineField("Company Name:", view.companyName, 28),
    underlineField("Primary Contact Name:", view.primaryContactName, 28),
    underlineField("Contact Number:", view.contactNumber, 28),
    underlineField("Domain Name:", view.domainName, 28),
    underlineField("Email Address:", view.emailAddress, 28),
    sectionTitle("SECTION 2: CONTACT DETAILS UPDATE"),
    bodyParagraph(
      "Please provide the details of the current authorized contact and the additional contact to be authorized.",
      90,
    ),
    ...contactBlock("A. Current Authorized Contact", view.current),
    ...contactBlock("B. Additional Authorized Contact", view.additional),
    sectionTitle("DECLARATION"),
    bodyParagraph(
      "I hereby certify that all information provided in this form is true, accurate, and complete. I understand that any misrepresentation may affect the authorization of contact access related to our subscription.",
      140,
    ),
    sectionTitle("AUTHORIZED REPRESENTATIVE"),
    underlineField("Printed Name:", "", 22),
    underlineField("Signature:", "", 22),
    underlineField("Position/Title:", "", 22),
    underlineField("Date:", "", 22),
    sectionTitle("FOR OFFICIAL USE ONLY"),
    underlineField("Processed By:", "", 22),
    underlineField("Date Processed:", "", 22),
    underlineField("Remarks:", "", 22),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: 22, color: INK },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 900, bottom: 900, left: 900 },
          },
        },
        headers: { default: buildHeader(logoPng) },
        footers: { default: buildFooter() },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}
