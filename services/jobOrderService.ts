import { axiosInstance } from "@/services/axios";

export interface JobOrderItem {
  id?: number;
  product_id?: number | null;
  item_type: string;
  name: string;
  price: number | string;
  quantity: number;
  total_price?: number | string;
  is_miscellaneous?: boolean;
}

export interface JobOrderPayment {
  id?: number;
  payment_method: string;
  amount?: number | string;
  remarks?: string | null;
  attachment_path?: string | null;
  attachment?: File | null;
}

export interface JobOrder {
  id: number;
  jo_no: string;
  customer_id?: number | null;
  customer_type?: string | null;
  customer_name?: string | null;
  customer_email?: string | null;
  customer_contact?: string | null;
  source?: string | null;
  category?: string | null;
  status?: string | null;
  order_date?: string | null;
  date_needed?: string | null;
  delivery_type?: string | null;
  delivery_location?: string | null;
  delivery_address?: string | null;
  delivery_charge?: number | string;
  subtotal?: number | string;
  discount_total?: number | string;
  total?: number | string;
  total_quantity?: number;
  remarks?: string | null;
  items?: JobOrderItem[];
  payments?: JobOrderPayment[];
}

export type JobOrderPayload = Partial<JobOrder> & {
  items: JobOrderItem[];
  payments?: JobOrderPayment[];
};

export const getJobOrders = async (params?: any, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/job-orders", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
};

export const getJobOrder = async (id: number | string, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get(`/job-orders/${id}`, {
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data.data;
};

export const createJobOrder = async (payload: JobOrderPayload) => {
  const body = toRequestBody(payload);
  const res = await axiosInstance.post("/job-orders", body);
  return res.data;
};

export const updateJobOrder = async (id: number | string, payload: JobOrderPayload) => {
  const body = toRequestBody(payload);

  if (body instanceof FormData) {
    body.append("_method", "PUT");
    const res = await axiosInstance.post(`/job-orders/${id}`, body);
    return res.data;
  }

  const res = await axiosInstance.put(`/job-orders/${id}`, body);
  return res.data;
};

export const deleteJobOrder = async (id: number | string) => {
  const res = await axiosInstance.delete(`/job-orders/${id}`);
  return res.data;
};

const toRequestBody = (payload: JobOrderPayload) => {
  const hasFiles = payload.payments?.some((payment) => payment.attachment instanceof File);
  if (!hasFiles) return payload;

  const form = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "items" || key === "payments" || value === undefined || value === null) return;
    form.append(key, String(value));
  });

  payload.items.forEach((item, index) => {
    appendNested(form, `items[${index}]`, item);
  });

  (payload.payments ?? []).forEach((payment, index) => {
    Object.entries(payment).forEach(([key, value]) => {
      if (value === undefined || value === null || key === "attachment") return;
      form.append(`payments[${index}][${key}]`, String(value));
    });
    if (payment.attachment instanceof File) {
      form.append(`payments[${index}][attachment]`, payment.attachment);
    }
  });

  return form;
};

const appendNested = (form: FormData, prefix: string, value: Record<string, any>) => {
  Object.entries(value).forEach(([key, nestedValue]) => {
    if (nestedValue === undefined || nestedValue === null) return;
    form.append(`${prefix}[${key}]`, typeof nestedValue === "boolean" ? (nestedValue ? "1" : "0") : String(nestedValue));
  });
};
