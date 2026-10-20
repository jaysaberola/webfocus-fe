import { renderAuthorizedContactFormHtml } from "@/lib/commerceAdmin/authorizedContactFormHtml";
import { renderCustomerInformationSheetHtml } from "@/lib/commerceAdmin/customerInformationSheetHtml";
import type {
  ClientContactBlock,
  ClientContactInformation,
  ClientCrmFormState,
  ClientSignatory,
} from "@/lib/commerceAdmin/clientFormHelpers";

export type ClientInfoSheetSnapshot = {
  generatedAt: string;
  company: string;
  clientOwner: string;
  clientClassification: string;
  clientType: string;
  industry: string;
  taxClassification: string;
  tinNumber: string;
  otherNumbers: string;
  ownership: string;
  website: string;
  currency: string;
  exchangeRate: string;
  workdriveFolderUrl: string;
  workdriveFolderId: string;
  contactPerson: string;
  email: string;
  mobile: string;
  phone: string;
  billingInCharge: string;
  billingAddress: string;
  shippingAddress: string;
  contactInformation: ClientContactInformation;
  attachmentsNote: string;
};

function composeStreetLine(street: string, barangay: string) {
  const line = street.trim();
  const place = barangay.trim();
  if (!place) return line;
  if (!line) return place;
  if (line.toLowerCase().includes(place.toLowerCase())) return line;
  return `${line}, ${place}`;
}

function formatAddress(parts: {
  street: string;
  barangay: string;
  city: string;
  province: string;
  region: string;
  zip: string;
  country: string;
}) {
  const lines = [
    composeStreetLine(parts.street, parts.barangay),
    [parts.city, parts.province].filter(Boolean).join(", "),
    [parts.region, parts.zip].filter(Boolean).join(" "),
    parts.country,
  ].filter((line) => line.trim() !== "");
  return lines.join("\n");
}

function display(value: string | null | undefined) {
  const text = String(value ?? "").trim();
  return text || "—";
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function signatoryHasContent(row: ClientSignatory) {
  return Boolean(row.person || row.designation || row.email || row.phone || row.mobile || row.other);
}

export function buildClientInfoSheetSnapshot(
  form: ClientCrmFormState,
  extras?: {
    clientOwner?: string;
    billingBarangay?: string;
    shippingBarangay?: string;
    attachments?: Record<string, string | null>;
  },
): ClientInfoSheetSnapshot {
  const attachmentLabels: Record<string, string> = {
    bir_certificate: "BIR Certificate of Registration",
    business_permit: "Business Permit",
    sec_dti_registration: "SEC/DTI Registration",
    valid_id_signatories: "Valid ID of Signatories",
    gen_info_sheet: "Gen. Info and Customer Info Sheet",
  };
  const uploaded = Object.entries(extras?.attachments ?? {})
    .filter(([, path]) => String(path ?? "").trim() !== "")
    .map(([key]) => attachmentLabels[key] || key);

  return {
    generatedAt: new Date().toLocaleString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    company: form.company.trim(),
    clientOwner: String(extras?.clientOwner ?? "").trim(),
    clientClassification: form.client_classification.trim(),
    clientType: form.client_type.trim(),
    industry: form.industry.trim(),
    taxClassification: form.tax_classification.trim(),
    tinNumber: form.tin_number.trim(),
    otherNumbers: form.other_numbers.trim(),
    ownership: form.ownership.trim(),
    website: form.website.trim(),
    currency: form.currency.trim() || "PHP",
    exchangeRate: form.exchange_rate.trim() || "1",
    workdriveFolderUrl: form.workdrive_folder_url.trim(),
    workdriveFolderId: form.workdrive_folder_id.trim(),
    contactPerson: form.contact_person.trim(),
    email: form.email.trim(),
    mobile: form.mobile.trim() ? `+63 ${form.mobile.trim()}` : "",
    phone: form.phone.trim(),
    billingInCharge: form.billing_in_charge.trim(),
    billingAddress: formatAddress({
      street: form.address_street,
      barangay: extras?.billingBarangay ?? "",
      city: form.address_city,
      province: form.address_province,
      region: form.address_region,
      zip: form.address_zip,
      country: form.address_country,
    }),
    shippingAddress: formatAddress({
      street: form.shipping_street,
      barangay: extras?.shippingBarangay ?? "",
      city: form.shipping_city,
      province: form.shipping_province,
      region: form.shipping_region,
      zip: form.shipping_zip,
      country: form.shipping_country,
    }),
    contactInformation: form.contact_information,
    attachmentsNote: uploaded.length ? uploaded.join(", ") : "No uploaded documents on file yet.",
  };
}

function fieldRow(label: string, value: string) {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(display(value)).replace(/\n/g, "<br />")}</td></tr>`;
}

function blockSection(title: string, block: ClientContactBlock) {
  if (!blockHasContent(block)) return "";
  return `
    <section class="sheet-section">
      <h2>${escapeHtml(title)}</h2>
      <table class="sheet-table">
        ${fieldRow("Contact Person", block.person)}
        ${fieldRow("Designation", block.designation)}
        ${fieldRow("Email", block.email)}
        ${fieldRow("Phone", block.phone)}
        ${fieldRow("Mobile", block.mobile)}
        ${fieldRow("Attention To", block.attention)}
        ${fieldRow("Instructions", block.instructions)}
        ${fieldRow("Address", block.address)}
        ${fieldRow("Other Details", block.other)}
      </table>
    </section>
  `;
}

function signatorySection(info: ClientContactInformation) {
  if (!info.signatoriesEnabled) return "";
  const rows = info.signatories.filter(signatoryHasContent);
  if (!rows.length) return "";
  const body = rows
    .map(
      (row, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(display(row.person))}</td>
        <td>${escapeHtml(display(row.designation))}</td>
        <td>${escapeHtml(display(row.email))}</td>
        <td>${escapeHtml(display(row.phone))}</td>
        <td>${escapeHtml(display(row.mobile))}</td>
        <td>${escapeHtml(display(row.other))}</td>
      </tr>
    `,
    )
    .join("");
  return `
    <section class="sheet-section">
      <h2>Authorized Signatories</h2>
      <table class="sheet-grid">
        <thead>
          <tr>
            <th>#</th>
            <th>AS Contact Person</th>
            <th>AS Designation</th>
            <th>AS Email</th>
            <th>AS Phone</th>
            <th>AS Mobile</th>
            <th>Other Details</th>
          </tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    </section>
  `;
}

export function renderClientInfoSheetHtml(snapshot: ClientInfoSheetSnapshot, options?: { autoPrint?: boolean }) {
  const autoPrint = Boolean(options?.autoPrint);
  const title = snapshot.company
    ? `${snapshot.company} — Customer Information Sheet`
    : "Customer Information Sheet";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <style>
    @page { margin: 16mm; }
    body {
      margin: 0;
      color: #0f172a;
      font: 12px/1.45 "Segoe UI", Arial, sans-serif;
      background: #fff;
    }
    .sheet {
      max-width: 920px;
      margin: 0 auto;
      padding: 24px;
    }
    .sheet-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 12px;
      margin-bottom: 18px;
    }
    .sheet-header h1 {
      margin: 0 0 4px;
      font-size: 20px;
      line-height: 1.25;
    }
    .sheet-header p {
      margin: 0;
      color: #475569;
      font-size: 11px;
    }
    .sheet-meta {
      text-align: right;
      color: #64748b;
      font-size: 11px;
      white-space: nowrap;
    }
    .sheet-section {
      margin-bottom: 18px;
      break-inside: avoid;
    }
    .sheet-section h2 {
      margin: 0 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e2e8f0;
      color: #1e3a8a;
      font-size: 13px;
      letter-spacing: 0.02em;
      text-transform: uppercase;
    }
    .sheet-table {
      width: 100%;
      border-collapse: collapse;
    }
    .sheet-table th,
    .sheet-table td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      text-align: left;
    }
    .sheet-table th {
      width: 34%;
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
    }
    .sheet-grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
    }
    .sheet-grid th,
    .sheet-grid td {
      padding: 6px 8px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
    }
    .sheet-grid th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
    }
    .sheet-footer {
      margin-top: 24px;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
      color: #64748b;
      font-size: 10px;
    }
    @media print {
      .sheet { padding: 0; max-width: none; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <header class="sheet-header">
      <div>
        <h1>General Information &amp; Customer Information Sheet</h1>
        <p>WebFocus Solutions, Inc.</p>
        <p>${escapeHtml(display(snapshot.company))}</p>
      </div>
      <div class="sheet-meta">
        <div>Generated: ${escapeHtml(snapshot.generatedAt)}</div>
        <div>Client Owner: ${escapeHtml(display(snapshot.clientOwner))}</div>
      </div>
    </header>

    <section class="sheet-section">
      <h2>General Information</h2>
      <table class="sheet-table">
        ${fieldRow("Client Name", snapshot.company)}
        ${fieldRow("Client Classification", snapshot.clientClassification)}
        ${fieldRow("Client Type", snapshot.clientType)}
        ${fieldRow("Industry", snapshot.industry)}
        ${fieldRow("Tax Classification", snapshot.taxClassification)}
        ${fieldRow("TIN Number", snapshot.tinNumber)}
        ${fieldRow("Other Numbers", snapshot.otherNumbers)}
        ${fieldRow("Ownership", snapshot.ownership)}
        ${fieldRow("Website", snapshot.website)}
        ${fieldRow("Currency", snapshot.currency)}
        ${fieldRow("Exchange Rate", snapshot.exchangeRate)}
        ${fieldRow("WorkDrive Folder URL", snapshot.workdriveFolderUrl)}
        ${fieldRow("WorkDrive Folder ID", snapshot.workdriveFolderId)}
      </table>
    </section>

    <section class="sheet-section">
      <h2>Primary Contact</h2>
      <table class="sheet-table">
        ${fieldRow("Contact Person", snapshot.contactPerson)}
        ${fieldRow("Email", snapshot.email)}
        ${fieldRow("Mobile", snapshot.mobile)}
        ${fieldRow("Phone", snapshot.phone)}
        ${fieldRow("Billing in Charge", snapshot.billingInCharge)}
      </table>
    </section>

    <section class="sheet-section">
      <h2>Address Information</h2>
      <table class="sheet-table">
        ${fieldRow("Billing Address", snapshot.billingAddress)}
        ${fieldRow("Shipping Address", snapshot.shippingAddress)}
      </table>
    </section>

    ${blockSection("Billing Contact Information", snapshot.contactInformation.billing)}
    ${blockSection("Collection Contact Information", snapshot.contactInformation.collection)}
    ${blockSection("Technical Department Contact Information", snapshot.contactInformation.technical)}
    ${signatorySection(snapshot.contactInformation)}

    <section class="sheet-section">
      <h2>File Attachments</h2>
      <table class="sheet-table">
        ${fieldRow("Documents on Record", snapshot.attachmentsNote)}
      </table>
    </section>

    <footer class="sheet-footer">
      This sheet was generated from the commerce admin client record. Use Print or Save as PDF for a hard copy.
    </footer>
  </div>
  ${autoPrint ? `<script>window.addEventListener("load", function () { window.print(); });</script>` : ""}
</body>
</html>`;
}

function safeFilename(value: string) {
  const slug = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "client";
}

export async function downloadClientInfoSheet(snapshot: ClientInfoSheetSnapshot) {
  const { buildClientInfoSheetDocx } = await import("@/lib/commerceAdmin/clientInfoSheetDocx");
  const blob = await buildClientInfoSheetDocx(snapshot);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename(snapshot.company)}-authorized-contact-information-form.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

function logoUrlForExport() {
  if (typeof window === "undefined") return "/images/webfocus-logo.svg";
  return `${window.location.origin}/images/webfocus-logo.svg`;
}

function printHtmlInIframe(html: string): Promise<boolean> {
  return new Promise((resolve) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("title", "Print preview");
    iframe.setAttribute(
      "style",
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none;",
    );
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!doc || !win) {
      iframe.remove();
      resolve(false);
      return;
    }

    const cleanup = () => {
      window.setTimeout(() => iframe.remove(), 1000);
    };

    let printed = false;
    const triggerPrint = () => {
      if (printed) return;
      printed = true;
      try {
        win.focus();
        win.print();
        cleanup();
        resolve(true);
      } catch {
        iframe.remove();
        resolve(false);
      }
    };

    doc.open();
    doc.write(html);
    doc.close();

    const img = doc.querySelector("img");
    if (!img) {
      window.setTimeout(triggerPrint, 50);
      return;
    }

    if (img.complete) {
      window.setTimeout(triggerPrint, 50);
      return;
    }

    img.addEventListener("load", () => triggerPrint(), { once: true });
    img.addEventListener("error", () => triggerPrint(), { once: true });
    window.setTimeout(triggerPrint, 2000);
  });
}

export function printClientInfoSheet(snapshot: ClientInfoSheetSnapshot) {
  const html = renderAuthorizedContactFormHtml(snapshot, { logoUrl: logoUrlForExport() });
  return printHtmlInIframe(html);
}

async function downloadSnapshotPdf(options: {
  snapshot: ClientInfoSheetSnapshot;
  html: string;
  pageSelector: string;
  hostWidth: number;
  filename: string;
  fitSinglePage?: boolean;
}) {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-12000px;top:0;width:${options.hostWidth}px;background:#fff;`;
  host.innerHTML = options.html;
  document.body.appendChild(host);
  const page = host.querySelector(options.pageSelector) as HTMLElement | null;
  if (!page) {
    document.body.removeChild(host);
    throw new Error("Form layout failed.");
  }

  await new Promise<void>((resolve) => {
    const img = host.querySelector("img");
    if (!img || img.complete) resolve();
    else {
      img.onload = () => resolve();
      img.onerror = () => resolve();
    }
  });

  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(page, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: options.hostWidth,
      windowWidth: options.hostWidth,
    });

    const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 18;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const imgData = canvas.toDataURL("image/png");

    if (options.fitSinglePage !== false) {
      let drawWidth = maxWidth;
      let drawHeight = (canvas.height * drawWidth) / canvas.width;
      if (drawHeight > maxHeight) {
        drawHeight = maxHeight;
        drawWidth = (canvas.width * drawHeight) / canvas.height;
      }
      const offsetX = (pageWidth - drawWidth) / 2;
      pdf.addImage(imgData, "PNG", offsetX, margin, drawWidth, drawHeight, undefined, "FAST");
    } else {
      let renderedHeight = 0;
      const sliceHeight = Math.floor((canvas.width * maxHeight) / maxWidth);
      while (renderedHeight < canvas.height) {
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.min(sliceHeight, canvas.height - renderedHeight);
        const ctx = sliceCanvas.getContext("2d");
        if (!ctx) break;
        ctx.drawImage(
          canvas,
          0,
          renderedHeight,
          canvas.width,
          sliceCanvas.height,
          0,
          0,
          canvas.width,
          sliceCanvas.height,
        );
        if (renderedHeight > 0) pdf.addPage();
        const sliceData = sliceCanvas.toDataURL("image/png");
        const drawHeight = (sliceCanvas.height * maxWidth) / sliceCanvas.width;
        pdf.addImage(sliceData, "PNG", margin, margin, maxWidth, drawHeight, undefined, "FAST");
        renderedHeight += sliceCanvas.height;
      }
    }

    pdf.save(options.filename);
  } finally {
    document.body.removeChild(host);
  }
}

async function logoDataUrlForExport() {
  let logoUrl = logoUrlForExport();
  try {
    const { svgUrlToPngDataUrl } = await import("@/lib/commerceAdmin/svgToPng");
    logoUrl = await svgUrlToPngDataUrl(logoUrl, 640);
  } catch {
    // Keep SVG URL if rasterization fails.
  }
  return logoUrl;
}

export async function downloadClientInfoSheetPdf(snapshot: ClientInfoSheetSnapshot) {
  const { renderAuthorizedContactFormHtml } = await import("@/lib/commerceAdmin/authorizedContactFormHtml");
  const logoUrl = await logoDataUrlForExport();
  const html = renderAuthorizedContactFormHtml(snapshot, { logoUrl, compact: true });
  await downloadSnapshotPdf({
    snapshot,
    html,
    pageSelector: ".acf-page",
    hostWidth: 720,
    filename: `${safeFilename(snapshot.company)}-authorized-contact-information-form.pdf`,
    fitSinglePage: true,
  });
}

export async function downloadCustomerInformationSheet(snapshot: ClientInfoSheetSnapshot) {
  const { buildCustomerInformationSheetDocx } = await import("@/lib/commerceAdmin/customerInformationSheetDocx");
  const blob = await buildCustomerInformationSheetDocx(snapshot);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${safeFilename(snapshot.company)}-customer-information-sheet.docx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function printCustomerInformationSheet(snapshot: ClientInfoSheetSnapshot) {
  const html = renderCustomerInformationSheetHtml(snapshot, { logoUrl: logoUrlForExport(), compact: true });
  return printHtmlInIframe(html);
}

export async function downloadCustomerInformationSheetPdf(snapshot: ClientInfoSheetSnapshot) {
  const { renderCustomerInformationSheetHtml } = await import("@/lib/commerceAdmin/customerInformationSheetHtml");
  const logoUrl = await logoDataUrlForExport();
  const html = renderCustomerInformationSheetHtml(snapshot, { logoUrl, compact: true });
  await downloadSnapshotPdf({
    snapshot,
    html,
    pageSelector: ".cis-wrap",
    hostWidth: 760,
    filename: `${safeFilename(snapshot.company)}-customer-information-sheet.pdf`,
    fitSinglePage: true,
  });
}
