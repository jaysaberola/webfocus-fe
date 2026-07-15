import type { CustomerRow } from "@/services/customerService";

const CUSTOMER_LIST_CACHE_KEY = "cms4.customers.list.v1";
const CUSTOMER_DETAIL_CACHE_KEY = "cms4.customers.detail.v1";

type CustomerListCache = {
  rows: CustomerRow[];
  totalPages: number;
  currentPage: number;
  perPage: number;
};

const canUseSessionStorage = () => typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";

const readJson = <T,>(key: string): T | null => {
  if (!canUseSessionStorage()) return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeJson = (key: string, value: unknown) => {
  if (!canUseSessionStorage()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Cache is only a speed hint; ignore storage failures.
  }
};

export const readCustomerListCache = () => readJson<CustomerListCache>(CUSTOMER_LIST_CACHE_KEY);

export const writeCustomerListCache = (cache: CustomerListCache) => {
  writeJson(CUSTOMER_LIST_CACHE_KEY, cache);
};

export const readCustomerDetailCache = (id: number) => {
  const cache = readJson<Record<string, any>>(CUSTOMER_DETAIL_CACHE_KEY);
  return cache?.[String(id)] ?? null;
};

export const writeCustomerDetailCache = (customer: any) => {
  if (!customer?.id) return;
  const cache = readJson<Record<string, any>>(CUSTOMER_DETAIL_CACHE_KEY) ?? {};
  cache[String(customer.id)] = customer;
  writeJson(CUSTOMER_DETAIL_CACHE_KEY, cache);
};
