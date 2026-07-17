import { axiosInstance } from "@/services/axios";
import { readStoredAuthToken, storeAuthToken, clearStoredAuthToken } from "@/lib/authToken";
import { storeCurrentUser } from "@/lib/currentUser";
import { isCustomerUser } from "@/lib/userRoles";

const CUSTOMER_KEY = "cms4.publicCustomer.v1";
const CUSTOMER_FETCH_TTL_MS = 30_000;

let inflightCustomerFetch: Promise<PublicCustomer> | null = null;
let lastCustomerFetchAt = 0;

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
  avatar?: string | null;
  role?: string | null;
  roles?: string[];
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

export const storeCustomer = (customer: PublicCustomer | null, options?: { notify?: boolean }) => {
  if (typeof window === "undefined") return;
  if (!customer) localStorage.removeItem(CUSTOMER_KEY);
  else localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
  if (options?.notify !== false) {
    window.dispatchEvent(new Event("public-customer-updated"));
  }
};

export const customerLogin = async (email: string, password: string) => {
  const res = await axiosInstance.post("/customer-login", { email, password });
  if (res.data?.token) storeAuthToken(res.data.token);
  storeCurrentUser(null);
  if (res.data?.user) storeCustomer(res.data.user);
  lastCustomerFetchAt = Date.now();
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
  storeCurrentUser(null);
  if (res.data?.user) storeCustomer(res.data.user);
  lastCustomerFetchAt = Date.now();
  return res.data;
};

export const fetchCurrentCustomer = async (options?: {
  silent?: boolean;
  force?: boolean;
}): Promise<PublicCustomer> => {
  const token = readStoredAuthToken();
  if (!token) {
    storeCustomer(null, { notify: false });
    throw new Error("Not authenticated");
  }

  const cached = getStoredCustomer();
  const now = Date.now();
  if (!options?.force && cached && isCustomerUser(cached) && now - lastCustomerFetchAt < CUSTOMER_FETCH_TTL_MS) {
    return cached;
  }

  if (inflightCustomerFetch && !options?.force) {
    return inflightCustomerFetch;
  }

  inflightCustomerFetch = axiosInstance
    .get("/user", {
      headers: options?.silent
        ? { "X-No-Loading": true, "X-No-Auth-Redirect": true }
        : { "X-No-Auth-Redirect": true },
    })
    .then((res) => {
      const user = res.data as PublicCustomer;
      if (!isCustomerUser(user)) {
        storeCustomer(null, { notify: false });
        throw new Error("Not a customer account");
      }

      lastCustomerFetchAt = Date.now();
      storeCustomer(user, { notify: false });
      return user;
    })
    .finally(() => {
      inflightCustomerFetch = null;
    });

  return inflightCustomerFetch;
};

export const updateCustomerProfile = async (payload: {
  fname?: string;
  lname?: string;
  mobile?: string | null;
  birth_date?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_municipality?: string | null;
  address_province?: string | null;
  address_zip?: string | null;
  avatar?: File | null;
}) => {
  const formData = new FormData();

  if (payload.fname != null) formData.append("fname", payload.fname);
  if (payload.lname != null) formData.append("lname", payload.lname);
  if (payload.mobile != null) formData.append("mobile", payload.mobile ?? "");
  if (payload.birth_date != null) formData.append("birth_date", payload.birth_date ?? "");
  if (payload.address_street != null) formData.append("address_street", payload.address_street ?? "");
  if (payload.address_city != null) formData.append("address_city", payload.address_city ?? "");
  if (payload.address_municipality != null) {
    formData.append("address_municipality", payload.address_municipality ?? "");
  }
  if (payload.address_province != null) formData.append("address_province", payload.address_province ?? "");
  if (payload.address_zip != null) formData.append("address_zip", payload.address_zip ?? "");
  if (payload.avatar) formData.append("avatar", payload.avatar);

  const res = await axiosInstance.post("/user/profile", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  const user = res.data?.user ?? res.data;
  storeCustomer(user);
  lastCustomerFetchAt = Date.now();
  return user as PublicCustomer;
};

export const uploadCustomerAvatar = async (file: File, customer: PublicCustomer) => {
  return updateCustomerProfile({
    fname: customer.fname || "Customer",
    lname: customer.lname || "User",
    mobile: customer.mobile,
    birth_date: customer.birth_date,
    address_street: customer.address_street,
    address_city: customer.address_city,
    address_municipality: customer.address_municipality,
    address_province: customer.address_province,
    address_zip: customer.address_zip,
    avatar: file,
  });
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
  storeCurrentUser(null);
  lastCustomerFetchAt = 0;
  inflightCustomerFetch = null;
};
