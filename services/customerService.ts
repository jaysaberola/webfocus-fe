import { axiosInstance } from "@/services/axios";
import type { UserRow } from "@/services/userService";

export interface CreateCustomerPayload {
  fname: string;
  lname: string;
  email: string;
}

export interface CreateCustomerAccountPayload {
  fname: string;
  lname: string;
  company: string;
  email: string;
  address_street: string;
  mobile: string;
  phone?: string;
  avatar?: File | null;
  services: string[];
  addons?: string[];
}

export type UpdateCustomerAccountPayload = CreateCustomerAccountPayload;

export type CustomerRow = UserRow & {
  active_services_count?: number;
  company?: string;
  representative?: string;
  owner_id?: number | null;
  owner_name?: string | null;
  owner?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
};

export const createCustomer = async (payload: CreateCustomerPayload) => {
  const response = await axiosInstance.post("/customers", payload);
  return response.data;
};

export const createCustomerAccount = async (payload: CreateCustomerAccountPayload) => {
  const formData = buildCustomerAccountFormData(payload);
  const response = await axiosInstance.post("/customers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

function buildCustomerAccountFormData(payload: CreateCustomerAccountPayload, method?: "PUT") {
  const formData = new FormData();
  if (method) formData.append("_method", method);
  formData.append("fname", payload.fname);
  formData.append("lname", payload.lname);
  formData.append("company", payload.company);
  formData.append("email", payload.email);
  formData.append("address_street", payload.address_street);
  formData.append("mobile", payload.mobile);
  if (payload.phone?.trim()) formData.append("phone", payload.phone.trim());
  if (payload.avatar) formData.append("avatar", payload.avatar);
  payload.services.forEach((service) => formData.append("services[]", service));
  (payload.addons ?? []).forEach((addon) => formData.append("addons[]", addon));
  return formData;
}

export const updateCustomerAccount = async (id: number, payload: UpdateCustomerAccountPayload) => {
  const formData = buildCustomerAccountFormData(payload, "PUT");
  const response = await axiosInstance.post(`/customers/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export type CustomerListResponse = {
  data: CustomerRow[];
  meta?: {
    current_page?: number;
    last_page?: number;
    total?: number;
  };
};

function normalizeCustomerListResponse(payload: unknown): CustomerListResponse {
  if (!payload || typeof payload !== "object") {
    return { data: [] };
  }

  const body = payload as Record<string, unknown>;

  if (Array.isArray(body.data)) {
    return {
      data: body.data as CustomerRow[],
      meta: body.meta as CustomerListResponse["meta"],
    };
  }

  const nested = body.data;
  if (nested && typeof nested === "object" && Array.isArray((nested as { data?: unknown }).data)) {
    const paginator = nested as {
      data: CustomerRow[];
      current_page?: number;
      last_page?: number;
      total?: number;
    };

    return {
      data: paginator.data,
      meta: {
        current_page: paginator.current_page,
        last_page: paginator.last_page,
        total: paginator.total,
      },
    };
  }

  return { data: [], meta: body.meta as CustomerListResponse["meta"] };
}

export const getCustomers = async (params: any, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/customers", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return normalizeCustomerListResponse(res.data);
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

export const deleteCustomer = async (id: number) => {
  const res = await axiosInstance.delete(`/customers/${id}`);
  return res.data;
};

export const bulkDeleteCustomers = async (ids: number[]) => {
  const res = await axiosInstance.post("/customers/bulk-delete", { ids });
  return res.data;
};
