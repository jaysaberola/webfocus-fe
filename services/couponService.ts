import { axiosInstance } from "@/services/axios";

export interface Coupon {
  id: number;
  code: string;
  name: string;
  description?: string | null;
  discount_type: "fixed" | "percent";
  discount_value: string | number;
  usage_limit?: number | null;
  used_count?: number;
  starts_at?: string | null;
  ends_at?: string | null;
  status: string;
}

export const getCoupons = async (params?: any, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/coupons", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
};

export const createCoupon = async (payload: Partial<Coupon>) => {
  const res = await axiosInstance.post("/coupons", payload);
  return res.data;
};

export const updateCoupon = async (id: number, payload: Partial<Coupon>) => {
  const res = await axiosInstance.put(`/coupons/${id}`, payload);
  return res.data;
};

export const deleteCoupon = async (id: number) => {
  const res = await axiosInstance.delete(`/coupons/${id}`);
  return res.data;
};
