import { WEBFOCUS_TAGLINE } from "@/lib/commerceAdmin/authorizedContactFormModel";
import {
  buildHostingClientQuoteSnapshot,
  hostingClientQuoteLines,
  type HostingClientQuoteFields,
} from "@/lib/commerceAdmin/hostingClientQuote";
import { svgUrlToPngDataUrl } from "@/lib/commerceAdmin/svgToPng";

function safeFilenamePart(value: string) {
  return value.replace(/[^\w\-]+/g, "_").replace(/_+/g, "_").slice(0, 48) || "client-quote";
}

function logoUrlForExport() {
  if (typeof window === "undefined") return "/images/webfocus-logo.svg";
  return `${window.location.origin}/images/webfocus-logo.svg`;
}

async function loadWebfocusLogoDataUrl(): Promise<string | null> {
  try {
    return await svgUrlToPngDataUrl(logoUrlForExport(), 420);
  } catch {
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const QUOTE_DOC_STYLES = `
  .hq-doc { font-family: system-ui, -apple-system, "Segoe UI", Calibri, Arial, sans-serif; color: #1e293b; font-size: 14px; line-height: 1.45; }
  .hq-brand { margin-bottom: 14px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0; }
  .hq-brand img { display: block; max-height: 42px; width: auto; }
  .hq-tagline { margin: 8px 0 0; font-size: 12px; color: #64748b; font-style: italic; }
  .hq-title { margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #0f172a; }
  .hq-table { border-collapse: collapse; width: 100%; }
  .hq-table td { padding: 8px 10px; vertical-align: top; font-size: 14px; border-bottom: 1px solid #f1f5f9; }
  .hq-label { width: 38%; font-weight: 600; color: #334155; }
  .hq-value { color: #0f172a; }
  .hq-label-strong, .hq-value-strong { font-weight: 700; font-size: 14.5px; }
  .hq-money { font-weight: 600; color: #0f172a; font-variant-numeric: tabular-nums; white-space: nowrap; }
  .hq-peso { font-weight: 700; margin-right: 0.12em; font-family: system-ui, -apple-system, "Segoe UI", Arial, sans-serif; }
  .hq-foot { margin-top: 16px; font-size: 12px; color: #64748b; line-height: 1.45; }
`;

function formatValueHtml(value: string): string {
  const trimmed = String(value ?? "").trim();
  const match = /^₱\s*(.+)$/.exec(trimmed);
  if (match) {
    return `<span class="hq-money"><span class="hq-peso">₱</span> ${escapeHtml(match[1])}</span>`;
  }
  return escapeHtml(trimmed || "—");
}

function buildHostingQuoteTableRows(lines: Array<{ label: string; value: string }>) {
  return lines
    .map((row) => {
      const emphasis = row.label === "Gross Amount" || row.label === "Net of VAT" || row.label === "Annual SRP";
      return `<tr>
        <td class="hq-label${emphasis ? " hq-label-strong" : ""}">${escapeHtml(row.label)}</td>
        <td class="hq-value${emphasis ? " hq-value-strong" : ""}">${formatValueHtml(row.value)}</td>
      </tr>`;
    })
    .join("");
}

function buildHostingQuoteBrandHtml(logoDataUrl: string | null) {
  const logoCell = logoDataUrl
    ? `<img src="${logoDataUrl}" alt="WebFocus Solutions, Inc." width="200" height="auto" />`
    : `<strong style="font-size:14pt;color:#0f172a;">WEBFOCUS SOLUTIONS, INC.</strong>`;
  return `<div class="hq-brand">
      ${logoCell}
      <p class="hq-tagline">${escapeHtml(WEBFOCUS_TAGLINE)}</p>
    </div>`;
}

function buildHostingQuoteScreenHtml(lines: Array<{ label: string; value: string }>, logoDataUrl: string | null) {
  return `<style>${QUOTE_DOC_STYLES}</style>
  <div class="hq-doc">
    ${buildHostingQuoteBrandHtml(logoDataUrl)}
    <h1 class="hq-title">Hosting / Server Quotation Summary</h1>
    <table class="hq-table">
      ${buildHostingQuoteTableRows(lines)}
    </table>
    <p class="hq-foot">Gross Amount includes 12% VAT. Net of VAT is the annual amount exclusive of VAT.</p>
  </div>`;
}

function buildHostingQuoteExcelHtml(lines: Array<{ label: string; value: string }>, logoDataUrl: string | null) {
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head>
  <meta charset="utf-8" />
  <title>Hosting Quotation</title>
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Quote</x:Name>
    <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
  </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
  <style>${QUOTE_DOC_STYLES}</style>
</head>
<body>
  <div class="hq-doc">
    ${buildHostingQuoteBrandHtml(logoDataUrl)}
    <h1 class="hq-title">Hosting / Server Quotation Summary</h1>
    <table class="hq-table">
      ${buildHostingQuoteTableRows(lines)}
    </table>
    <p class="hq-foot">Gross Amount includes 12% VAT. Net of VAT is the annual amount exclusive of VAT.</p>
  </div>
</body>
</html>`;
}

async function waitForImages(root: HTMLElement) {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        }),
    ),
  );
}

export async function downloadHostingClientQuotePdf(
  clientName: string,
  dealName: string,
  fields: HostingClientQuoteFields,
) {
  const snapshot = buildHostingClientQuoteSnapshot({ clientName, dealName, ...fields });
  const lines = hostingClientQuoteLines(snapshot);
  const logoDataUrl = await loadWebfocusLogoDataUrl();
  const screenHtml = buildHostingQuoteScreenHtml(lines, logoDataUrl);

  const host = document.createElement("div");
  host.style.cssText =
    "position:fixed;left:-12000px;top:0;width:520px;padding:28px 36px;background:#fff;box-sizing:border-box;";
  host.innerHTML = screenHtml;
  document.body.appendChild(host);
  const page = host.querySelector(".hq-doc") as HTMLElement | null;
  if (!page) {
    host.remove();
    throw new Error("Quote layout failed.");
  }

  await waitForImages(host);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: host.offsetWidth,
      windowWidth: host.offsetWidth,
    });

    const pdf = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
    const margin = 40;
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;

    let drawWidth = maxWidth;
    let drawHeight = (canvas.height * drawWidth) / canvas.width;
    if (drawHeight > maxHeight) {
      drawHeight = maxHeight;
      drawWidth = (canvas.width * drawHeight) / canvas.height;
    }
    const offsetX = (pageWidth - drawWidth) / 2;

    pdf.addImage(canvas.toDataURL("image/png"), "PNG", offsetX, margin, drawWidth, drawHeight, undefined, "FAST");
    pdf.save(`${safeFilenamePart(clientName)}-hosting-quote.pdf`);
  } finally {
    host.remove();
  }
}

export async function downloadHostingClientQuoteExcel(
  clientName: string,
  dealName: string,
  fields: HostingClientQuoteFields,
) {
  const snapshot = buildHostingClientQuoteSnapshot({ clientName, dealName, ...fields });
  const lines = hostingClientQuoteLines(snapshot);
  const logoDataUrl = await loadWebfocusLogoDataUrl();
  const html = buildHostingQuoteExcelHtml(lines, logoDataUrl);
  const blob = new Blob(["\uFEFF" + html], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `${safeFilenamePart(clientName)}-hosting-quote-${stamp}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Parse `formatDealAmount` output for UI preview (separate ₱ from amount). */
export function splitPesoDisplay(value: string): { isMoney: boolean; amount: string } {
  const trimmed = String(value ?? "").trim();
  const match = /^₱\s*(.+)$/.exec(trimmed);
  if (!match) return { isMoney: false, amount: trimmed };
  return { isMoney: true, amount: match[1] };
}
