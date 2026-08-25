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

export type ClientCrmAccountPayload = {
  company: string;
  email: string;
  owner_id?: number | null;
  contact_person?: string;
  mobile?: string;
  phone?: string;
  industry?: string;
  tax_classification?: string;
  tin_number?: string;
  other_numbers?: string;
  currency?: string;
  workdrive_folder_url?: string;
  workdrive_folder_id?: string;
  client_classification?: string;
  client_type?: string;
  website?: string;
  ownership?: string;
  billing_in_charge?: string;
  exchange_rate?: string | number;
  address_street?: string;
  address_city?: string;
  address_province?: string;
  address_region?: string;
  address_zip?: string;
  address_country?: string;
  shipping_street?: string;
  shipping_city?: string;
  shipping_province?: string;
  shipping_region?: string;
  shipping_zip?: string;
  shipping_country?: string;
  bir_certificate?: File | null;
  business_permit?: File | null;
  sec_dti_registration?: File | null;
  valid_id_signatories?: File | null;
  gen_info_sheet?: File | null;
};

export type CustomerServiceLine = {
  id?: number | string;
  title?: string | null;
  category?: string | null;
  plan?: string | null;
  status?: string | null;
  renew_at?: string | null;
  service_name?: string | null;
  plan_name?: string | null;
  subject?: string | null;
  product_category?: string | null;
  domain?: string | null;
};

export type CustomerRow = UserRow & {
  active_services_count?: number;
  orders_count?: number;
  company?: string;
  representative?: string;
  owner_id?: number | null;
  owner_name?: string | null;
  owner?: {
    id: number;
    name?: string | null;
    email?: string | null;
  } | null;
  client_classification?: string | null;
  client_type?: string | null;
  billing_in_charge?: string | null;
  contact_person?: string | null;
  website?: string | null;
  service_name?: string | null;
  plan_name?: string | null;
  subject?: string | null;
  product_category?: string | null;
  domain?: string | null;
  subject_domain?: string | null;
  currency?: string | null;
  exchange_rate?: string | number | null;
  address_street?: string | null;
  address_city?: string | null;
  address_province?: string | null;
  address_region?: string | null;
  address_zip?: string | null;
  address_country?: string | null;
  services?: CustomerServiceLine[];
  rowKey?: string;
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

export const createCustomerCrmAccount = async (payload: ClientCrmAccountPayload) => {
  const formData = buildClientCrmFormData(payload);
  const response = await axiosInstance.post("/customers", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const updateCustomerCrmAccount = async (id: number, payload: ClientCrmAccountPayload) => {
  const formData = buildClientCrmFormData(payload, "PUT");
  const response = await axiosInstance.post(`/customers/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

function appendIfValue(formData: FormData, key: string, value: string | number | null | undefined) {
  if (value === null || value === undefined) return;
  const text = String(value).trim();
  if (text === "" && key !== "exchange_rate") return;
  formData.append(key, text);
}

function buildClientCrmFormData(payload: ClientCrmAccountPayload, method?: "PUT") {
  const formData = new FormData();
  if (method) formData.append("_method", method);

  formData.append("company", payload.company);
  formData.append("email", payload.email);
  if (payload.owner_id !== undefined && payload.owner_id !== null) {
    formData.append("owner_id", String(payload.owner_id));
  } else if (method === "PUT" && payload.owner_id === null) {
    formData.append("owner_id", "");
  }

  appendIfValue(formData, "contact_person", payload.contact_person);
  appendIfValue(formData, "mobile", payload.mobile);
  appendIfValue(formData, "phone", payload.phone);
  appendIfValue(formData, "industry", payload.industry);
  appendIfValue(formData, "tax_classification", payload.tax_classification);
  appendIfValue(formData, "tin_number", payload.tin_number);
  appendIfValue(formData, "other_numbers", payload.other_numbers);
  appendIfValue(formData, "currency", payload.currency);
  appendIfValue(formData, "workdrive_folder_url", payload.workdrive_folder_url);
  appendIfValue(formData, "workdrive_folder_id", payload.workdrive_folder_id);
  appendIfValue(formData, "client_classification", payload.client_classification);
  appendIfValue(formData, "client_type", payload.client_type);
  appendIfValue(formData, "website", payload.website);
  appendIfValue(formData, "ownership", payload.ownership);
  appendIfValue(formData, "billing_in_charge", payload.billing_in_charge);
  appendIfValue(formData, "exchange_rate", payload.exchange_rate);
  appendIfValue(formData, "address_street", payload.address_street);
  appendIfValue(formData, "address_city", payload.address_city);
  appendIfValue(formData, "address_province", payload.address_province);
  appendIfValue(formData, "address_region", payload.address_region);
  appendIfValue(formData, "address_zip", payload.address_zip);
  appendIfValue(formData, "address_country", payload.address_country);
  appendIfValue(formData, "shipping_street", payload.shipping_street);
  appendIfValue(formData, "shipping_city", payload.shipping_city);
  appendIfValue(formData, "shipping_province", payload.shipping_province);
  appendIfValue(formData, "shipping_region", payload.shipping_region);
  appendIfValue(formData, "shipping_zip", payload.shipping_zip);
  appendIfValue(formData, "shipping_country", payload.shipping_country);

  if (payload.bir_certificate) formData.append("bir_certificate", payload.bir_certificate);
  if (payload.business_permit) formData.append("business_permit", payload.business_permit);
  if (payload.sec_dti_registration) formData.append("sec_dti_registration", payload.sec_dti_registration);
  if (payload.valid_id_signatories) formData.append("valid_id_signatories", payload.valid_id_signatories);
  if (payload.gen_info_sheet) formData.append("gen_info_sheet", payload.gen_info_sheet);

  return formData;
}

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
