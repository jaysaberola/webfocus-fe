/**
 * Finance price-request / RFQ content must not appear in client–sales deal chat
 * (notifications & priceRequestLog are the internal channel).
 */
export function isFinanceRfqChatText(text: string, from: "client" | "sales" = "sales"): boolean {
  if (from !== "sales") return false;
  const t = String(text ?? "").trim();
  if (!t) return false;

  if (/^Price request:/im.test(t)) return true;
  if (/^Deal lines needing catalog amount:/i.test(t)) return true;
  if (/Request for quotation \(specs\)/i.test(t)) return true;

  const markers = [
    "Client Name:",
    "Deal Name:",
    "Data Center:",
    "Processor:",
    "Cores:",
    "Threads:",
    "RAM:",
    "Storage:",
    "Annual SRP (net, excl. VAT):",
    "Gross Amount (incl. 12% VAT):",
    "Annual SRP: pending (Finance to set)",
  ];

  let hits = 0;
  for (const marker of markers) {
    if (t.includes(marker)) hits += 1;
  }

  if (hits >= 4) return true;
  if (hits >= 2 && (/Annual SRP/i.test(t) || /Gross Amount/i.test(t))) return true;

  return false;
}
