import { axiosInstance } from "./axios";

export interface DashboardStats {
  pages_count: number;
  albums_count: number;
  news_count: number;
}

export const getDashboardStats = async () => {
  //await setCsrfCookie(); // MUST succeed
  return axiosInstance.get<{ data: DashboardStats }>("/dashboard/stats");
};
