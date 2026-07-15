import { axiosInstance } from "./axios";

export type PageDTO = {
  id: number;
  name: string;
  label: string;
  slug: string;
};

export interface MenuPayload {
  name: string;
  items: any[];
  is_active: boolean;
}

export interface MenuRow {
  id: number;
  name: string;
  is_active: boolean;
  updated_at_formatted: string;
}

interface GetMenusParams {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
  show_deleted?: boolean | number;
  with_trashed?: boolean | number;
  only_trashed?: boolean | number;
  only_deleted?: boolean | number;
  // allow backend-specific flags (e.g., trashed=1)
  [key: string]: any;
}

/* ================= PAGES ================= */

export const getAllPages = async (): Promise<PageDTO[]> => {
  const res = await axiosInstance.get("/pages-menu");
  return res.data.data;
};

/* ================= MENUS ================= */

export const createMenu = async (payload: MenuPayload) => {
  return axiosInstance.post("/menus", payload);
};

export const getMenus = (params: GetMenusParams, options?: { silent?: boolean }) => {
  return axiosInstance.get("/menus", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
};

export const getMenuById = (id: number) => {
  return axiosInstance.get(`/menus/${id}`);
};

export const updateMenu = (id: number, payload: any) => {
  return axiosInstance.put(`/menus/${id}`, payload);
};

export const updateMenuName = async (id: number, name: string) => {
  // Quick-edit helper: preserve existing items/is_active when backend expects full payload.
  const res: any = await getMenuById(id);
  const menu = res?.data?.data ?? res?.data;
  const items = Array.isArray(menu?.items) ? menu.items : [];
  const is_active = !!menu?.is_active;

  try {
    return await updateMenu(id, { name, items, is_active });
  } catch (err: any) {
    // Fallback: method-override PUT via POST (common in Laravel setups)
    return axiosInstance.post(`/menus/${id}`, { _method: "PUT", name, items, is_active });
  }
};

export const setMenuInactive = async (id: number) => {
  const res: any = await getMenuById(id);
  const menu = res?.data?.data ?? res?.data;
  const name = (menu?.name ?? "").toString();
  const items = Array.isArray(menu?.items) ? menu.items : [];

  // send as 0/false to satisfy backends that expect int/bool
  const is_active: any = 0;

  try {
    return await updateMenu(id, { name, items, is_active });
  } catch (err: any) {
    return axiosInstance.post(`/menus/${id}`, { _method: "PUT", name, items, is_active });
  }
};

export const deleteMenu = (id: number) => {
  return axiosInstance.delete(`/menus/${id}`);
};

export const postMethodDeleteMenu = (id: number) => {
  return axiosInstance.post(`/menus/${id}`, { _method: "DELETE" });
};

export const activateMenu = (id: number) => {
  return axiosInstance.patch(`/menus/${id}/activate`);
};

export const restoreMenu = async (id: number) => {
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/menus/${id}/restore`),
    () => axiosInstance.post(`/menus/restore/${id}`),
    () => axiosInstance.patch(`/menus/${id}/restore`),
    () => axiosInstance.put(`/menus/${id}/restore`),
    // method-override patterns
    () => axiosInstance.post(`/menus/${id}/restore`, { _method: "PATCH" }),
    () => axiosInstance.post(`/menus/${id}`, { _method: "PATCH", action: "restore" }),
    () => axiosInstance.post(`/menus/restore`, { id }),
  ];

  let lastError: any;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 403 || status === 422) {
        throw err;
      }
    }
  }
  throw lastError;
};
