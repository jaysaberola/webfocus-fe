import { axiosInstance } from "@/services/axios";

export interface SalesTransaction {
  id: number;
  transaction_no: string;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_email?: string | null;
  user_id?: number | null;
  user?: {
    id: number;
    fname?: string | null;
    lname?: string | null;
    email?: string | null;
  } | null;
  customer?: {
    id: number;
    fname?: string | null;
    lname?: string | null;
    mname?: string | null;
    email?: string | null;
    company?: string | null;
    owner_id?: number | null;
    billing_in_charge?: string | null;
    contact_person?: string | null;
    owner?: {
      id: number;
      fname?: string | null;
      lname?: string | null;
      name?: string | null;
      email?: string | null;
    } | null;
  } | null;
  client_owner_id?: number | null;
  client_owner?: {
    id: number;
    fname?: string | null;
    lname?: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  subtotal: string | number;
  discount_total: string | number;
  tax_total: string | number;
  shipping_total: string | number;
  grand_total: string | number;
  payment_status: string;
  order_status: string;
  notes?: string | null;
  transacted_at?: string | null;
  created_at?: string | null;
  issued_date?: string | null;
  due_date?: string | null;
  payment_date?: string | null;
  payment_mode?: string | null;
  items?: SalesTransactionItem[];
  proposals?: SalesTransactionProposal[];
  provisioning_run?: ProvisioningRunSummary | null;
  provisioningRun?: ProvisioningRunSummary | null;
}

export type ProvisioningRunActionSummary = {
  id: number;
  service_name: string;
  status: string;
  done_at?: string | null;
  completed_at?: string | null;
};

export type ProvisioningRunSummary = {
  id: number;
  status?: string | null;
  approved_at?: string | null;
  actions?: ProvisioningRunActionSummary[];
};

export interface SalesTransactionProposal {
  id: number;
  version: number;
  kind: string;
  fileName: string;
  fileUrl?: string | null;
  uploadedAt?: string | null;
}

export interface SalesTransactionItem {
  id?: number;
  product_id?: number | string | null;
  name: string;
  item_type?: string | null;
  price: string | number;
  quantity: string | number;
  total_price?: string | number | null;
}

export type SalesTransactionPayload = Partial<SalesTransaction> & {
  items?: SalesTransactionItem[];
  save_mode?: "draft" | "finalize";
};

export interface PaynamicsCheckoutResponse {
  message: string;
  reused?: boolean;
  data: SalesTransaction;
  paynamics: {
    request_id: string;
    redirect_url: string;
    response_code?: string;
  };
}

export const getSalesTransactions = async (
  params?: Record<string, unknown>,
  options?: { silent?: boolean }
) => {
  const res = await axiosInstance.get("/sales-transactions", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });

  return res.data;
};

export const createSalesTransaction = async (
  payload: SalesTransactionPayload
) => {
  const res = await axiosInstance.post("/sales-transactions", payload);

  return res.data;
};

export const checkoutWithPaynamics = async (
  payload: SalesTransactionPayload
): Promise<PaynamicsCheckoutResponse> => {
  const res = await axiosInstance.post(
    "/public/paynamics/checkout",
    payload
  );

  return res.data;
};

export const continuePaynamicsCheckout = async (
  invoiceId: string
): Promise<PaynamicsCheckoutResponse> => {
  const res = await axiosInstance.post("/public/paynamics/continue", {
    invoice_id: invoiceId,
  });

  return res.data;
};

export const confirmPaynamicsPayment = async (requestId: string) => {
  const res = await axiosInstance.post("/public/paynamics/confirm", {
    request_id: requestId,
  });

  return res.data as {
    message: string;
    request_id: string;
    status: string;
  };
};

export const updateSalesTransaction = async (
  id: number,
  payload: SalesTransactionPayload
) => {
  const res = await axiosInstance.put(
    `/sales-transactions/${id}`,
    payload
  );

  return res.data;
};

export async function requestDealPrice(
  id: number,
  payload: { message: string; assignee_id: number },
) {
  const res = await axiosInstance.post(`/sales-transactions/${id}/price-request`, payload);
  return res.data;
}

export const deleteSalesTransaction = async (id: number) => {
  const res = await axiosInstance.delete(`/sales-transactions/${id}`);

  return res.data;
};

export const uploadWebDesignProposal = async (id: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axiosInstance.post(`/sales-transactions/${id}/proposals`, formData);
  return res.data;
};

export const proceedWebDesignPayment = async (id: number) => {
  const res = await axiosInstance.post(`/sales-transactions/${id}/proceed-payment`);
  return res.data;
};

export type SalesDealConversation = {
  recordId?: number;
  notes?: string;
  clientNotes?: string;
  salesNotes?: string;
  conversation?: Array<{
    from: "client" | "sales";
    text: string;
    at?: string;
    file?: { name: string; url: string; path?: string; kind?: "file" | "proposal" | "signed" };
  }>;
  quotedPrice?: number;
};

export const fetchSalesDealConversation = async (id: number): Promise<SalesDealConversation> => {
  const res = await axiosInstance.get(`/sales-transactions/${id}/conversation`, {
    headers: { "X-No-Loading": true },
  });
  return res.data?.data ?? {};
};

export const replySalesDealNote = async (
  id: number,
  message: string,
  file?: File | null,
): Promise<SalesDealConversation> => {
  if (file) {
    const formData = new FormData();
    if (message.trim()) formData.append("message", message);
    formData.append("file", file);
    const res = await axiosInstance.post(`/sales-transactions/${id}/notes`, formData);
    return res.data?.data ?? {};
  }
  const res = await axiosInstance.post(`/sales-transactions/${id}/notes`, { message });
  return res.data?.data ?? {};
};

export const fetchSalesDealFile = async (
  id: number,
  file: { name?: string; path?: string; url?: string },
  download = false,
): Promise<Blob> => {
  const res = await axiosInstance.get(`/sales-transactions/${id}/files`, {
    params: {
      path: file.path || file.url || file.name || "",
      name: file.name || undefined,
      download: download ? 1 : undefined,
    },
    responseType: "blob",
  });
  return res.data;
};
