import { axiosInstance } from "./axios";

export type DomainCheckResult = {
  domain: string;
  tld: string;
  available: boolean | null;
  price: number;
  currency: string;
  provider?: string | null;
  premium?: boolean;
  provider_currency?: string | null;
  provider_register_price?: number | null;
  code?: string | null;
  message?: string | null;
};

export type DomainCheckResponse = {
  query: string;
  results: DomainCheckResult[];
  checked_at: string;
};

export const PRIMARY_TLDS = [".ph", ".com", ".co", ".net", ".org", ".shop", ".ai"] as const;
export const MORE_TLDS = [".com.ph", ".net.ph", ".org.ph", ".biz", ".info", ".online", ".io"] as const;

/** TLD cards shown in the 4×2 results grid (matches marketing layout). */
export const GRID_TLDS = [".net", ".org", ".info", ".biz", ".shop", ".co", ".ph", ".ai"] as const;

export const NEW_TLD_BADGES = new Set<string>([".shop", ".ai"]);

export const NEW_DOMAIN_TLDS = new Set<string>([".shop", ".ai", ".online", ".io"]);

export const INTERNATIONAL_TLDS = new Set<string>([
  ".com",
  ".net",
  ".org",
  ".co",
  ".biz",
  ".info",
  ".online",
  ".io",
]);

export function formatDomainFromPrice(
  price: number | string | null | undefined,
  currency = "PHP"
) {
  const numericPrice =
    typeof price === "number" ? price : Number(price);

  if (!Number.isFinite(numericPrice)) {
    return "Price unavailable";
  }

  const normalizedCurrency = currency.trim().toUpperCase();
  const symbol = normalizedCurrency === "PHP" ? "₱" : `${normalizedCurrency} `;

  return `from: ${symbol}${numericPrice.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function buildDomainSearchChecks(baseName: string, primaryTld: string) {
  const checks: { name: string; tlds: string[] }[] = [];
  const push = (name: string, tlds: string[]) => {
    checks.push({ name, tlds });
  };

  push(baseName, [
    primaryTld,
    ...GRID_TLDS.filter((tld) => tld !== primaryTld),
    ".com.ph",
    ".net.ph",
  ].filter((tld, index, list) => list.indexOf(tld) === index).slice(0, 10));

  push(`${baseName}online`, [".com"]);
  push(`${baseName}group`, [".com"]);
  push(`${baseName}s`, [".com"]);

  return checks;
}

export async function checkDomainAvailabilityBatch(checks: { name: string; tlds: string[] }[]) {
  const responses = await Promise.all(
    checks.map((check) => checkDomainAvailability(check.name, check.tlds))
  );

  const seen = new Set<string>();
  const merged: DomainCheckResult[] = [];

  for (const response of responses) {
    for (const result of response.results) {
      if (seen.has(result.domain)) continue;
      seen.add(result.domain);
      merged.push(result);
    }
  }

  return merged;
}

export function pickDomainResult(results: DomainCheckResult[], domain: string, fallbackTld: string) {
  return (
    results.find((result) => result.domain === domain) ?? {
      domain,
      tld: fallbackTld,
      available: null,
      price: 0,
      currency: "PHP",
    }
  );
}

export function normalizeDomainInput(raw: string) {
  let value = raw.trim().toLowerCase();
  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^www\./, "");
  value = value.split("/")[0] ?? value;
  value = value.split("?")[0] ?? value;

  const dotIndex = value.indexOf(".");
  if (dotIndex > 0) {
    return {
      name: value.slice(0, dotIndex),
      tld: value.slice(dotIndex),
    };
  }

  return { name: value, tld: null as string | null };
}

export async function checkDomainAvailability(name: string, tlds?: string[]) {
  const response = await axiosInstance.get<DomainCheckResponse>("/public/domains/check", {
    params: {
      name,
      ...(tlds?.length ? { tlds } : {}),
    },
  });

  return response.data;
}
