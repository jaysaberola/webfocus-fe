import type { ClientInfoSheetSnapshot } from "@/lib/commerceAdmin/clientInfoSheet";
import {
  CUSTOMER_INFO_SHEET_FOOTER,
  buildCustomerInformationSheetView,
  type CustomerContactRow,
} from "@/lib/commerceAdmin/customerInformationSheetModel";
import { WEBFOCUS_LOGO_PATH } from "@/lib/commerceAdmin/authorizedContactFormModel";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string) {
  return escapeHtml(value) || "&nbsp;";
}

function labelValueRow(label: string, value: string, colspan = 3) {
  return `<tr>
    <td class="cis-label">${escapeHtml(label)}</td>
    <td class="cis-value" colspan="${colspan}">${cell(value)}</td>
  </tr>`;
}

function splitRow(labelA: string, valueA: string, labelB: string, valueB: string) {
  return `<tr>
    <td class="cis-label">${escapeHtml(labelA)}</td>
    <td class="cis-value">${cell(valueA)}</td>
    <td class="cis-label">${escapeHtml(labelB)}</td>
    <td class="cis-value">${cell(valueB)}</td>
  </tr>`;
}

function sectionHead(title: string) {
  return `<tr><th class="cis-section" colspan="4">${escapeHtml(title)}</th></tr>`;
}

function contactRows(title: string, row: CustomerContactRow) {
  return `<tr><td class="cis-subhead" colspan="4">${escapeHtml(title)}</td></tr>
    ${splitRow("Name", row.name, "Designation", row.designation)}
    ${labelValueRow("Remarks", row.remarks)}
    ${splitRow("Contact Number/s", row.contactNumbers, "Email Address", row.email)}`;
}

export function renderCustomerInformationSheetHtml(
  snapshot: ClientInfoSheetSnapshot,
  options?: { logoUrl?: string; forPrint?: boolean; compact?: boolean },
) {
  const view = buildCustomerInformationSheetView(snapshot);
  const logoSrc = options?.logoUrl ?? WEBFOCUS_LOGO_PATH;
  const compact = Boolean(options?.compact);
  const pageClass = compact ? "cis-page cis-compact" : "cis-page";
  const footer = CUSTOMER_INFO_SHEET_FOOTER.map((line) => `<p>${escapeHtml(line)}</p>`).join("");
  const railLabel = "WebFocus Solutions, Inc. | Customer Information Sheet";
  const railFontSize = compact ? 9 : 11;
  const railSvg = `<svg class="cis-rail-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 720" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
    <text
      x="9"
      y="360"
      fill="#94a3b8"
      font-family="Segoe UI, Calibri, Arial, sans-serif"
      font-size="${railFontSize}"
      font-weight="600"
      letter-spacing="0.06em"
      transform="rotate(-90 9 360)"
      text-anchor="middle"
    >${escapeHtml(railLabel)}</text>
  </svg>`;

  const implementing = [
    ["Official In-Charge", view.implementingContacts[0]],
    ["Lead Coordinator", view.implementingContacts[1]],
    ["Lead Coordinator", view.implementingContacts[2]],
  ] as const;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Customer Information Sheet</title>
  <style>
    @page { size: letter; margin: 0.35in 0.4in 0.4in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1f2937;
      font: 9pt/1.3 "Segoe UI", Calibri, Arial, Helvetica, sans-serif;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cis-wrap {
      display: flex;
      align-items: stretch;
      gap: 0.08in;
      max-width: 7.85in;
      margin: 0 auto;
      padding: 0.08in;
    }
    .cis-main { flex: 1 1 auto; min-width: 0; }
    .cis-page { width: 100%; }
    .cis-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.2in;
      margin-bottom: 0.08in;
    }
    .cis-title {
      margin: 0;
      font-size: 17pt;
      font-weight: 800;
      color: #ea580c;
      letter-spacing: 0.01em;
    }
    .cis-logo-box {
      width: 1.35in;
      min-height: 0.55in;
      padding: 0.06in;
      border: 1px solid #fb923c;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fff;
    }
    .cis-logo-box img { display: block; width: 100%; height: auto; }
    .cis-rail {
      flex: 0 0 0.16in;
      width: 0.16in;
      align-self: stretch;
      pointer-events: none;
    }
    .cis-rail-svg {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 100%;
    }
    .cis-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 0.06in;
    }
    .cis-table td, .cis-table th {
      border: 1px solid #fb923c;
      padding: 0.045in 0.06in;
      vertical-align: top;
    }
    .cis-section {
      background: linear-gradient(90deg, #ff3300, #ff8c00);
      color: #fff;
      font-weight: 800;
      font-size: 8pt;
      text-align: center;
      letter-spacing: 0.06em;
      padding: 0.05in 0.06in !important;
    }
    .cis-subhead {
      background: #ffedd5;
      color: #9a3412;
      font-weight: 700;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .cis-label {
      width: 22%;
      background: #fff7ed;
      font-weight: 700;
      font-size: 7.5pt;
      color: #9a3412;
    }
    .cis-value {
      background: #fff;
      font-size: 8pt;
      color: #111827;
      min-height: 1.1em;
    }
    .cis-consent {
      margin: 0.06in 0;
      font-size: 7.5pt;
      line-height: 1.35;
      color: #334155;
    }
    .cis-signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.12in;
      margin: 0.08in 0 0.06in;
    }
    .cis-sign-line {
      border-bottom: 1px solid #fb923c;
      min-height: 0.28in;
      margin-bottom: 0.03in;
    }
    .cis-sign-label {
      font-size: 7pt;
      font-weight: 700;
      color: #9a3412;
      text-align: center;
      letter-spacing: 0.03em;
    }
    .cis-footer {
      margin-top: 0.04in;
      padding-top: 0.04in;
      border-top: 1px solid #fed7aa;
      text-align: center;
      color: #64748b;
      font-size: 5pt;
      line-height: 1.25;
    }
    .cis-footer p {
      margin: 0.01in 0;
      font-size: 5pt;
      line-height: 1.25;
    }
    .cis-compact { font-size: 7.5pt; }
    .cis-compact .cis-title { font-size: 14pt; }
    .cis-compact .cis-table td, .cis-compact .cis-table th { padding: 0.032in 0.045in; }
    .cis-compact .cis-consent { font-size: 7pt; }
    .cis-compact .cis-footer,
    .cis-compact .cis-footer p {
      font-size: 4.75pt;
      line-height: 1.2;
    }
    @media print { .cis-wrap { max-width: none; } }
  </style>
</head>
<body>
  <div class="cis-wrap">
    <div class="cis-main">
    <div class="${pageClass}">
      <div class="cis-top">
        <h1 class="cis-title">Customer Information Sheet</h1>
        <div class="cis-logo-box">
          <img src="${escapeHtml(logoSrc)}" alt="WebFocus Solutions, Inc." crossorigin="anonymous" />
        </div>
      </div>

      <table class="cis-table">
        ${sectionHead("COMPANY DETAILS")}
        ${labelValueRow("Corporate Name", view.corporateName)}
        ${labelValueRow("Corporate Address", view.corporateAddress)}
        ${splitRow("Nature of Business (Industry)", view.natureOfBusiness, "Contact Number", view.companyContactNumber)}
        ${labelValueRow("Company TIN", view.companyTin, 3)}
        ${splitRow("Authorized Signatory 1", view.authorizedSignatory1, "Designation", view.authorizedSignatory1Designation)}
        ${splitRow("Authorized Signatory 2", view.authorizedSignatory2, "Designation", view.authorizedSignatory2Designation)}
      </table>

      <table class="cis-table">
        ${sectionHead("IMPLEMENTING DEPARTMENT CONTACT DETAILS")}
        ${implementing.map(([title, row]) => contactRows(title, row)).join("")}
      </table>

      <table class="cis-table">
        ${sectionHead("TECHNICAL DEPARTMENT CONTACT DETAILS")}
        ${splitRow("Name", view.technicalContact.name, "Designation", view.technicalContact.designation)}
        ${splitRow("Contact Number/s", view.technicalContact.contactNumbers, "Email Address", view.technicalContact.email)}
      </table>

      <table class="cis-table">
        ${sectionHead("BILLING DETAILS")}
        ${splitRow("Attention To (Name)", view.billingAttention, "Designation", view.billingDesignation)}
        ${splitRow("Contact Number/s", view.billingContactNumbers, "Email Address", view.billingEmail)}
        ${labelValueRow("Billing Address", view.billingAddress)}
        ${splitRow("Tax Exemption (If Any)", view.taxExemption, "Remarks", view.billingRemarks)}
      </table>

      <table class="cis-table">
        ${sectionHead("FOR WEBFOCUS SOLUTIONS, INC.'S USE ONLY")}
        ${splitRow("Customer Code", view.customerCode, "Status (New/Renewal)", view.customerStatus)}
        ${splitRow("Subscribed Service", view.subscribedService, "Sales In-Charge", view.salesInCharge)}
        ${labelValueRow("Remarks", view.internalRemarks)}
      </table>

      <p class="cis-consent">
        <strong>Consent to Data Privacy</strong> — I hereby give my consent to the collection, use, monitoring, disclosure,
        or transfer of my Personal Information in accordance with WebFocus Solutions, Inc. Data Privacy Policy.
      </p>
      <div class="cis-signatures">
        <div>
          <div class="cis-sign-line"></div>
          <div class="cis-sign-label">SIGNATURE OVER PRINTED NAME</div>
        </div>
        <div>
          <div class="cis-sign-line"></div>
          <div class="cis-sign-label">DATE</div>
        </div>
      </div>

      <footer class="cis-footer">${footer}</footer>
    </div>
    </div>
    <aside class="cis-rail">${railSvg}</aside>
  </div>
  ${options?.forPrint ? `<script>window.addEventListener("load", function () { window.print(); });</script>` : ""}
</body>
</html>`;
}
