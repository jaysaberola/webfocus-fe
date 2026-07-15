import { axiosInstance } from "@/services/axios";
import { storeAuthToken, clearStoredAuthToken } from "@/lib/authToken";

const CUSTOMER_KEY = "cms4.publicCustomer.v1";

export type PublicCustomer = {
  id: number;
  fname?: string;
  lname?: string;
  email?: string;
  mobile?: string | null;
  birth_date?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_municipality?: string | null;
  address_province?: string | null;
  address_zip?: string | null;
};

export const getStoredCustomer = (): PublicCustomer | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CUSTOMER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const storeCustomer = (customer: PublicCustomer | null) => {
  if (typeof window === "undefined") return;
  if (!customer) localStorage.removeItem(CUSTOMER_KEY);
  else localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  window.dispatchEvent(new Event("public-customer-updated"));
};

export const customerLogin = async (email: string, password: string) => {
  const res = await axiosInstance.post("/customer-login", { email, password });
  if (res.data?.token) storeAuthToken(res.data.token);
  if (res.data?.user) storeCustomer(res.data.user);
  return res.data;
};

export const customerSignup = async (payload: {
  fname: string;
  lname: string;
  email: string;
  mobile?: string;
  password: string;
  password_confirmation: string;
}) => {
  const res = await axiosInstance.post("/register-customer", payload);
  if (res.data?.token) storeAuthToken(res.data.token);
  if (res.data?.user) storeCustomer(res.data.user);
  return res.data;
};

export const fetchCurrentCustomer = async (options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/user", {
    headers: options?.silent ? { "X-No-Loading": true, "X-No-Auth-Redirect": true } : { "X-No-Auth-Redirect": true },
  });
  storeCustomer(res.data);
  return res.data;
};

export const updateCustomerProfile = async (payload: Partial<PublicCustomer>) => {
  const res = await axiosInstance.post("/user/profile", payload);
  const user = res.data?.user ?? res.data;
  storeCustomer(user);
  return user;
};

export const changeCustomerPassword = async (payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}) => {
  const res = await axiosInstance.put("/user/password", payload);
  return res.data;
};

export const customerLogout = () => {
  clearStoredAuthToken();
  storeCustomer(null);
};
