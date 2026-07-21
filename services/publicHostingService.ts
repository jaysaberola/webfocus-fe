import axios from "axios";
import type { HostingPlanType } from "@/lib/servicesCatalog";

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api`;

export type PublicHostingPlan = {
  id: string;
  slug: string;
  name: string;
  price: number;
  type: HostingPlanType;
  billing: string;
  ram: string;
  ssd: string;
};

export type PublicHostingAddon = {
  id: string;
  slug: string;
  name: string;
  price: number;
  desc?: string | null;
  label?: string | null;
  plan_type: HostingPlanType | "universal";
  billing: string;
};

type ApiListResponse<T> = {
  success?: boolean;
  data?: T[];
};

export async function getPublicHostingPlans(type?: HostingPlanType): Promise<PublicHostingPlan[]> {
  const res = await axios.get<ApiListResponse<PublicHostingPlan>>(`${API_URL}/public/hosting/plans`, {
    params: type ? { type } : undefined,
  });
  return Array.isArray(res.data?.data) ? res.data.data : [];
}

export async function getPublicHostingAddons(
  type: HostingPlanType,
  scope: "type" | "universal" | "all" = "all",
): Promise<PublicHostingAddon[]> {
  const params: Record<string, string | boolean> = { type };

  if (scope === "type") params.type_only = true;
  if (scope === "universal") params.universal_only = true;

  const res = await axios.get<ApiListResponse<PublicHostingAddon>>(`${API_URL}/public/hosting/addons`, {
    params,
  });

  return Array.isArray(res.data?.data) ? res.data.data : [];
}
