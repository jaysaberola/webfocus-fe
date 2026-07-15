import { axiosInstance } from "@/services/axios";
import type { UserRow } from "@/services/userService";

export interface CreateCustomerPayload {
  fname: string;
  lname: string;
  email: string;
}

export type CustomerRow = UserRow;

export const createCustomer = async (payload: CreateCustomerPayload) => {
  const response = await axiosInstance.post("/customers", payload);
  return response.data;
};

export const getCustomers = async (params: any, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/customers", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
};

export const getCustomer = async (id: number, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get(`/customers/${id}`, {
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data.data;
};

export const updateCustomer = async (id: number, payload: any) => {
  const res = await axiosInstance.put(`/customers/${id}`, payload);
  return res.data;
};

export const toggleCustomerActive = async (id: number, nextActive?: boolean) => {
  const customer = await getCustomer(id);

  const currentRaw = (customer?.status ?? customer?.is_active ?? customer?.active ?? "").toString().toLowerCase();
  const currentActive =
    currentRaw === "active" || currentRaw === "1" || currentRaw === "true" || customer?.is_active === 1 || customer?.is_active === true;

  const desiredActive = typeof nextActive === "boolean" ? nextActive : !currentActive;
  const status = desiredActive ? "Active" : "Inactive";

  const payload = {
    ...customer,
    status,
    is_active: desiredActive ? 1 : 0,
  };

  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.patch(`/customers/${id}`, { ...payload, is_active: payload.is_active }),
    () => updateCustomer(id, payload),
    () => axiosInstance.post(`/customers/${id}`, { _method: "PUT", ...payload }),
  ];

  let lastError: any;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err: any) {
      lastError = err;
      const code = err?.response?.status;
      if (code === 400 || code === 401 || code === 403 || code === 422) {
        throw err;
      }
    }
  }
  throw lastError;
};
