import type { ClientInfoSheetSnapshot } from "@/lib/commerceAdmin/clientInfoSheet";
import {
  AUTHORIZED_CONTACT_FOOTER_LINES,
  WEBFOCUS_LOGO_PATH,
  WEBFOCUS_TAGLINE,
  buildAuthorizedContactFormView,
  type AuthorizedContactLine,
} from "@/lib/commerceAdmin/authorizedContactFormModel";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fieldLine(label: string, value: string) {
  return `<div class="acf-field">
    <span class="acf-label">${escapeHtml(label)}</span>
    <span class="acf-value">${escapeHtml(value) || "&nbsp;"}</span>
  </div>`;
}

function contactBlock(title: string, contact: AuthorizedContactLine) {
  return `<div class="acf-subsection">
    <p class="acf-subtitle">${escapeHtml(title)}</p>
    ${fieldLine("Full Name:", contact.fullName)}
    ${fieldLine("Designation/Position:", contact.designation)}
    ${fieldLine("Department:", contact.department)}
    ${fieldLine("Contact Number:", contact.contactNumber)}
    ${fieldLine("Email Address:", contact.email)}
  </div>`;
}

export function renderAuthorizedContactFormHtml(
  snapshot: ClientInfoSheetSnapshot,
  options?: { logoUrl?: string; forPrint?: boolean; compact?: boolean },
) {
  const view = buildAuthorizedContactFormView(snapshot);
  const logoSrc = options?.logoUrl ?? WEBFOCUS_LOGO_PATH;
  const compact = Boolean(options?.compact);
  const pageClass = compact ? "acf-page acf-compact" : "acf-page";
  const footer = AUTHORIZED_CONTACT_FOOTER_LINES.map((line) => `<p>${escapeHtml(line)}</p>`).join("");

  const contactSection = compact
    ? `<div class="acf-contact-grid">
        ${contactBlock("A. Current Authorized Contact", view.current)}
        ${contactBlock("B. Additional Authorized Contact", view.additional)}
      </div>`
    : `${contactBlock("A. Current Authorized Contact", view.current)}
       ${contactBlock("B. Additional Authorized Contact", view.additional)}`;

  const compactExtra = compact
    ? `
    .acf-compact {
      width: 7.5in;
      max-width: 7.5in;
      padding: 0.08in 0 0.1in;
    }
    .acf-compact .acf-head { margin-bottom: 0.12in; }
    .acf-compact .acf-brand img { width: 1.95in; }
    .acf-compact .acf-tagline { margin-top: 0.05in; font-size: 7.5pt; line-height: 1.25; }
    .acf-compact .acf-title { margin-bottom: 0.1in; font-size: 11.5pt; }
    .acf-compact .acf-body { font-size: 9pt; line-height: 1.28; }
    .acf-compact .acf-body p { margin: 0.06in 0; }
    .acf-compact .acf-note { margin-bottom: 0.08in; }
    .acf-compact .acf-section { margin-bottom: 0.08in; }
    .acf-compact .acf-section-title { margin: 0.07in 0 0.04in; font-size: 9pt; }
    .acf-compact .acf-subtitle { margin: 0.05in 0 0.03in; font-size: 8.5pt; }
    .acf-compact .acf-hint { margin: 0 0 0.04in 0.1in; font-size: 8pt; }
    .acf-compact .acf-field { margin: 0.03in 0; gap: 0.08in; }
    .acf-compact .acf-value { min-height: 0.95em; padding-bottom: 0.03in; }
    .acf-compact .acf-contact-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.1in 0.14in;
      align-items: start;
    }
    .acf-compact .acf-sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.08in 0.14in;
    }
    .acf-compact .acf-footer {
      margin-top: 0.08in;
      padding-top: 0.06in;
      font-size: 6.5pt;
      line-height: 1.3;
    }
    .acf-compact .acf-footer p { margin: 0.02in 0; }
  `
    : "";

  const signBlock = compact
    ? `<div class="acf-sign-grid">
        <div>${fieldLine("Printed Name:", "")}${fieldLine("Signature:", "")}</div>
        <div>${fieldLine("Position/Title:", "")}${fieldLine("Date:", "")}</div>
      </div>`
    : `${fieldLine("Printed Name:", "")}
       ${fieldLine("Signature:", "")}
       ${fieldLine("Position/Title:", "")}
       ${fieldLine("Date:", "")}`;

  const officialBlock = compact
    ? `<div class="acf-sign-grid">
        <div>${fieldLine("Processed By:", "")}${fieldLine("Date Processed:", "")}</div>
        <div>${fieldLine("Remarks:", "")}</div>
      </div>`
    : `${fieldLine("Processed By:", "")}
       ${fieldLine("Date Processed:", "")}
       ${fieldLine("Remarks:", "")}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Authorized Contact Information Form</title>
  <style>
    @page { size: letter; margin: 0.45in 0.55in 0.5in; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #1f2937;
      font: 10pt/1.45 "Segoe UI", Calibri, Arial, Helvetica, sans-serif;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .acf-page {
      max-width: 7.5in;
      margin: 0 auto;
      padding: 0.15in 0 0.35in;
    }
    .acf-head {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 0.35in;
    }
    .acf-brand img {
      display: block;
      width: 2.35in;
      height: auto;
    }
    .acf-tagline {
      margin: 0.12in 0 0;
      max-width: 2.8in;
      color: #64748b;
      font: inherit;
      font-size: 8.5pt;
      line-height: 1.35;
    }
    .acf-pagenum {
      min-width: 0.55in;
      text-align: right;
    }
    .acf-pagenum-bar {
      display: inline-block;
      width: 0.55in;
      height: 4px;
      margin-bottom: 0.08in;
      background: linear-gradient(90deg, #ff3300, #ff8c00);
      border-radius: 1px;
    }
    .acf-pagenum-n {
      font: inherit;
      font-size: 12pt;
      font-weight: 700;
      color: #374151;
    }
    .acf-title {
      margin: 0 0 0.18in;
      text-align: center;
      font: inherit;
      font-size: 13pt;
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: 0.02em;
      color: #374151;
    }
    .acf-body { font-size: 10pt; }
    .acf-note {
      margin: 0 0 0.16in;
    }
    .acf-section {
      margin: 0 0 0.14in;
      break-inside: avoid;
    }
    .acf-section-title {
      margin: 0.12in 0 0.08in;
      font: inherit;
      font-size: 10pt;
      font-weight: 700;
      color: #111827;
    }
    .acf-subtitle {
      margin: 0.1in 0 0.06in;
      font: inherit;
      font-size: 9.5pt;
      font-weight: 700;
    }
    .acf-hint {
      margin: -0.02in 0 0.08in 0.12in;
      color: #64748b;
      font-size: 9.5pt;
      font-style: italic;
    }
    .acf-field {
      display: flex;
      align-items: flex-end;
      gap: 0.12in;
      margin: 0.06in 0;
    }
    .acf-label {
      flex: 0 0 auto;
      font-weight: 700;
      white-space: nowrap;
    }
    .acf-value {
      flex: 1 1 auto;
      min-height: 1.1em;
      border-bottom: 1px solid #94a3b8;
      padding: 0 0 0.06in 0.04in;
      color: #0f172a;
    }
    .acf-footer {
      margin-top: 0.22in;
      padding-top: 0.12in;
      border-top: 1px solid #e2e8f0;
      text-align: center;
      color: #64748b;
      font: inherit;
      font-size: 8pt;
      line-height: 1.45;
    }
    .acf-footer p { margin: 0.04in 0; }
    ${compactExtra}
    @media print {
      .acf-page { padding: 0; max-width: none; }
    }
  </style>
</head>
<body>
  <div class="${pageClass}">
    <header class="acf-head">
      <div class="acf-brand">
        <img src="${escapeHtml(logoSrc)}" alt="WebFocus Solutions, Inc." crossorigin="anonymous" />
        <p class="acf-tagline">${escapeHtml(WEBFOCUS_TAGLINE)}</p>
      </div>
      <div class="acf-pagenum">
        <div class="acf-pagenum-bar"></div>
        <div class="acf-pagenum-n">1</div>
      </div>
    </header>

    <h1 class="acf-title">AUTHORIZED CONTACT INFORMATION FORM</h1>

    <div class="acf-body">
      <p>To ensure the security and proper management of client information, please complete this form to authorize and/or update contact details associated with your active subscription with WebFocus Solutions, Inc.</p>
      <p class="acf-note"><strong>Note:</strong> This completed form must be submitted using the registered or authorized email address on file to be processed.</p>

      <section class="acf-section">
        <h2 class="acf-section-title">SECTION 1: ACCOUNT INFORMATION</h2>
        ${fieldLine("Registered Account Name:", view.registeredAccountName)}
        <p class="acf-hint">(Please indicate the domain name as currently registered)</p>
        <p class="acf-subtitle">Contact Information</p>
        ${fieldLine("Company Name:", view.companyName)}
        ${fieldLine("Primary Contact Name:", view.primaryContactName)}
        ${fieldLine("Contact Number:", view.contactNumber)}
        ${fieldLine("Domain Name:", view.domainName)}
        ${fieldLine("Email Address:", view.emailAddress)}
      </section>

      <section class="acf-section">
        <h2 class="acf-section-title">SECTION 2: CONTACT DETAILS UPDATE</h2>
        <p>Please provide the details of the current authorized contact and the additional contact to be authorized.</p>
        ${contactSection}
      </section>

      <section class="acf-section">
        <h2 class="acf-section-title">DECLARATION</h2>
        <p>I hereby certify that all information provided in this form is true, accurate, and complete. I understand that any misrepresentation may affect the authorization of contact access related to our subscription.</p>
      </section>

      <section class="acf-section">
        <h2 class="acf-section-title">AUTHORIZED REPRESENTATIVE</h2>
        ${signBlock}
      </section>

      <section class="acf-section">
        <h2 class="acf-section-title">FOR OFFICIAL USE ONLY</h2>
        ${officialBlock}
      </section>
    </div>

    <footer class="acf-footer">${footer}</footer>
  </div>
  ${options?.forPrint ? `<script>window.addEventListener("load", function () { window.print(); });</script>` : ""}
</body>
</html>`;
}
