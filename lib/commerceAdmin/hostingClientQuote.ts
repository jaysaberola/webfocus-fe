import { formatDealAmount } from "@/lib/commerceAdmin/clientDealHelpers";

/** Philippine VAT — gross = net × (1 + rate). */
export const HOSTING_QUOTE_VAT_RATE = 0.12;

export type HostingClientQuoteFields = {
  quoteDataCenter: string;
  quoteProcessor: string;
  quoteCores: string;
  quoteThreads: string;
  quoteRam: string;
  quoteStorage: string;
  quoteAnnualSrp: string;
};

export type HostingClientQuoteSnapshot = HostingClientQuoteFields & {
  clientName: string;
  dealName: string;
  grossAmount: string;
  netOfVat: string;
};

export function parseQuoteMoney(value: string) {
  const n = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Annual SRP is stored as net (exclusive of VAT); gross is net × 1.12. */
export function hostingQuoteVatBreakdown(annualSrpNet: string) {
  const net = parseQuoteMoney(annualSrpNet);
  if (net == null || net <= 0) {
    return { netOfVat: "", grossAmount: "" };
  }
  const gross = net * (1 + HOSTING_QUOTE_VAT_RATE);
  return {
    netOfVat: formatDealAmount(net),
    grossAmount: formatDealAmount(gross),
  };
}

export function buildHostingClientQuoteSnapshot(input: {
  clientName: string;
  dealName: string;
  quoteDataCenter: string;
  quoteProcessor: string;
  quoteCores: string;
  quoteThreads: string;
  quoteRam: string;
  quoteStorage: string;
  quoteAnnualSrp: string;
}): HostingClientQuoteSnapshot {
  const { grossAmount, netOfVat } = hostingQuoteVatBreakdown(input.quoteAnnualSrp);
  return {
    clientName: input.clientName.trim() || "—",
    dealName: input.dealName.trim() || "—",
    quoteDataCenter: input.quoteDataCenter.trim(),
    quoteProcessor: input.quoteProcessor.trim(),
    quoteCores: input.quoteCores.trim(),
    quoteThreads: input.quoteThreads.trim(),
    quoteRam: input.quoteRam.trim(),
    quoteStorage: input.quoteStorage.trim(),
    quoteAnnualSrp: input.quoteAnnualSrp.trim(),
    grossAmount,
    netOfVat,
  };
}

export type HostingClientQuoteLine = { label: string; value: string };

export function formatAnnualSrpForQuote(raw: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "";
  const n = parseQuoteMoney(trimmed);
  if (n == null) return "—";
  if (n <= 0) return "—";
  return formatDealAmount(n);
}

export function annualSrpInputState(raw: string): "empty" | "valid" | "invalid" {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return "empty";
  const n = parseQuoteMoney(trimmed);
  if (n == null || n <= 0) return "invalid";
  return "valid";
}

export function hostingClientQuoteLines(snapshot: HostingClientQuoteSnapshot): HostingClientQuoteLine[] {
  const annualDisplay = formatAnnualSrpForQuote(snapshot.quoteAnnualSrp);

  return [
    { label: "Client Name", value: snapshot.clientName },
    { label: "Deal Name", value: snapshot.dealName },
    { label: "Data Center", value: snapshot.quoteDataCenter || "—" },
    { label: "Processor", value: snapshot.quoteProcessor || "—" },
    { label: "Cores", value: snapshot.quoteCores || "—" },
    { label: "Threads", value: snapshot.quoteThreads || "—" },
    { label: "RAM", value: snapshot.quoteRam || "—" },
    { label: "Storage", value: snapshot.quoteStorage || "—" },
    { label: "Annual SRP", value: annualDisplay || "—" },
    { label: "Gross Amount", value: snapshot.grossAmount || "—" },
    { label: "Net of VAT", value: snapshot.netOfVat || "—" },
  ];
}

export function hostingQuoteCategory(category: string) {
  const c = category.trim();
  return (
    c === "Cloud Hosting" ||
    c === "Dedicated Bare Metal Server" ||
    c === "Dedicated Cloud Server" ||
    c === "Web Hosting - Shared" ||
    c === "Add On"
  );
}

/** Specs block appended to Finance price-request notifications (price may still be blank). */
export function buildPriceRequestSpecBlock(input: {
  clientName: string;
  dealName: string;
  missingPricedLines: string[];
  fields: HostingClientQuoteFields;
}) {
  const lines: string[] = [];
  if (input.missingPricedLines.length) {
    lines.push(`Deal lines needing catalog amount: ${input.missingPricedLines.join(", ")}`);
  }

  const specRows: Array<[string, string]> = [
    ["Client Name", input.clientName.trim()],
    ["Deal Name", input.dealName.trim()],
    ["Data Center", input.fields.quoteDataCenter.trim()],
    ["Processor", input.fields.quoteProcessor.trim()],
    ["Cores", input.fields.quoteCores.trim()],
    ["Threads", input.fields.quoteThreads.trim()],
    ["RAM", input.fields.quoteRam.trim()],
    ["Storage", input.fields.quoteStorage.trim()],
  ];

  const filledSpecs = specRows.filter(([, value]) => value !== "");
  if (filledSpecs.length) {
    lines.push("", "— Request for quotation (specs) —");
    for (const [label, value] of filledSpecs) {
      lines.push(`${label}: ${value}`);
    }
  }

  const annual = input.fields.quoteAnnualSrp.trim();
  if (annual) {
    const { netOfVat, grossAmount } = hostingQuoteVatBreakdown(annual);
    lines.push(
      `Annual SRP (net, excl. VAT): ${netOfVat || annual}`,
      `Gross Amount (incl. 12% VAT): ${grossAmount || "—"}`,
    );
  } else {
    lines.push("Annual SRP: pending (Finance to set)");
  }

  return lines.join("\n").trim();
}

export function hasHostingQuoteSpecs(fields: HostingClientQuoteFields) {
  return Boolean(
    fields.quoteDataCenter.trim() ||
      fields.quoteProcessor.trim() ||
      fields.quoteCores.trim() ||
      fields.quoteThreads.trim() ||
      fields.quoteRam.trim() ||
      fields.quoteStorage.trim() ||
      fields.quoteAnnualSrp.trim(),
  );
}
