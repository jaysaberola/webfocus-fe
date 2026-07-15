import { axiosInstance } from "@/services/axios";

export interface SalesTransaction {
  id: number;
  transaction_no: string;
  customer_id?: number | null;
  customer_name?: string | null;
  customer_email?: string | null;
  subtotal: string | number;
  discount_total: string | number;
  tax_total: string | number;
  shipping_total: string | number;
  grand_total: string | number;
  payment_status: string;
  order_status: string;
  notes?: string | null;
  transacted_at?: string | null;
  items?: SalesTransactionItem[];
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

export const getSalesTransactions = async (params?: any, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/sales-transactions", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
};

export const createSalesTransaction = async (payload: Partial<SalesTransaction> & { items?: SalesTransactionItem[] }) => {
  const res = await axiosInstance.post("/sales-transactions", payload);
  return res.data;
};

export const updateSalesTransaction = async (id: number, payload: Partial<SalesTransaction> & { items?: SalesTransactionItem[] }) => {
  const res = await axiosInstance.put(`/sales-transactions/${id}`, payload);
  return res.data;
};

export const deleteSalesTransaction = async (id: number) => {
  const res = await axiosInstance.delete(`/sales-transactions/${id}`);
  return res.data;
};
