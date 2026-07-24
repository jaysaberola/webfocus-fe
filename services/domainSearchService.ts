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
