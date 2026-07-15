import axios from "axios";
import { axiosInstance } from "@/services/axios";

// ── CRUD ─────────────────────────────────────────────────────────────────────

export const createService = async (form: FormData) => {
  try {
    const res = await axiosInstance.post("/services", form);
    return res.data;
  } catch (err: any) {
    const status = err?.response?.status;
    if (status === 422) {
      const tryEndpoints = ["/services", "/service", "/services/create"];
      const altKeys = ["category_id", "category", "categoryId", "service_category_id"];

      const copyForm = (src: FormData) => {
        const fd = new FormData();
        try {
          (src as any).forEach((v: any, k: string) => fd.append(k, v));
        } catch {
          if ((src as any).entries) {
            for (const pair of (src as any).entries()) fd.append(pair[0], pair[1]);
          }
        }
        return fd;
      };

      for (const ep of tryEndpoints) {
        for (const key of altKeys) {
          try {
            const fd = copyForm(form);
            if (!fd.has || typeof fd.has !== "function" || !fd.has(key)) {
              const candidates = ["category_id", "category", "categoryId", "service_category_id"];
              let val: any = null;
              try {
                (form as any).forEach((v: any, k: string) => { if (candidates.includes(k) && !val) val = v; });
              } catch {
                if ((form as any).entries) {
                  for (const pair of (form as any).entries()) {
                    if (candidates.includes(pair[0]) && !val) val = pair[1];
                  }
                }
              }
              if (val) fd.append(key, val);
            }
            const r = await axiosInstance.post(ep, fd);
            return r.data;
          } catch (e: any) {
            continue;
          }
        }
      }
    }
    return { success: false, status: err?.response?.status ?? 500, error: err?.response?.data ?? err?.message };
  }
};

export const getServices = async (params?: any, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/services", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
};

export const getService = async (id: string | number) => {
  const endpoints = [`/services/${id}`, `/service/${id}`, `/services/show/${id}`];
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const res = await axiosInstance.get(ep);
      return res.data;
    } catch (e: any) {
      lastErr = e;
      if (!e?.response || e.response.status !== 404) break;
    }
  }

  try {
    const listRes = await getServices({ per_page: 1000 });
    const list = listRes?.data ?? listRes ?? [];
    const items: any[] = Array.isArray(list) ? list : (list?.items ?? list?.rows ?? list?.data ?? []);
    const idStr = String(id);
    const found = items.find(
      (s) => String(s.id ?? s.service_id) === idStr || String(s.slug) === idStr || String(s.name) === idStr,
    );
    if (found) return found;
  } catch { /* ignore */ }

  const rawBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  for (const url of [`${rawBase}/services/${id}`, `${rawBase}/api/services/${id}`]) {
    try {
      if (!url) continue;
      const res = await axios.get(url);
      return res.data;
    } catch (e: any) {
      if (!e?.response || e.response.status !== 404) break;
    }
  }

  throw lastErr || new Error("Service not found");
};

export const updateService = async (id: string | number, data: any) => {
  const isForm = typeof FormData !== "undefined" && data instanceof FormData;

  if (isForm) {
    const fd = new FormData();
    try {
      (data as any).forEach((v: any, k: string) => fd.append(k, v));
    } catch {
      if ((data as any).entries) {
        for (const pair of (data as any).entries()) fd.append(pair[0], pair[1]);
      }
    }
    fd.append("_method", "PUT");
    const res = await axiosInstance.post(`/services/${id}`, fd);
    return res.data;
  }

  try {
    const res = await axiosInstance.put(`/services/${id}`, data);
    return res.data;
  } catch {
    const res = await axiosInstance.post(`/services/${id}`, { ...data, _method: "PUT" });
    return res.data;
  }
};

export const deleteService = async (id: string | number) => {
  const endpoints = [`/services/${id}`, `/service/${id}`];
  let lastErr: any = null;
  for (const ep of endpoints) {
    try {
      const res = await axiosInstance.delete(ep);
      return res.data;
    } catch (e: any) {
      lastErr = e;
      try {
        const res2 = await axiosInstance.post(ep, { _method: "DELETE" });
        return res2.data;
      } catch (e2: any) {
        lastErr = e2;
      }
    }
  }
  throw lastErr || new Error("Failed to delete service");
};

export const restoreService = async (id: string | number) => {
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/services/${id}/restore`),
    () => axiosInstance.post(`/services/restore/${id}`),
    () => axiosInstance.patch(`/services/${id}/restore`),
    () => axiosInstance.put(`/services/${id}/restore`),
    () => axiosInstance.post(`/services/restore`, { id }),
  ];
  let lastError: any;
  for (const attempt of attempts) {
    try { return await attempt(); } catch (err: any) {
      lastError = err;
      const s = err?.response?.status;
      if (s === 400 || s === 401 || s === 403 || s === 422) throw err;
    }
  }
  throw lastError;
};

export const bulkDeleteServices = async (ids: Array<string | number>) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/services/bulk-delete`, { ids }),
    () => axiosInstance.post(`/services/delete-multiple`, { ids }),
    () => axiosInstance.post(`/services/bulk`, { ids, action: "delete" }),
  ];
  let lastErr: any;
  for (const attempt of attempts) {
    try { const res = await attempt(); return res.data ?? res; } catch (err: any) {
      lastErr = err;
      const s = err?.response?.status;
      if (s === 400 || s === 401 || s === 403 || s === 422) break;
    }
  }
  try {
    for (const id of ids) { try { await deleteService(id); } catch { /* continue */ } }
    return { success: true };
  } catch (e) { throw lastErr || e; }
};

export const bulkUpdateServiceStatus = async (ids: Array<string | number>, status: string) => {
  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/services/bulk-status`, { ids, status }),
    () => axiosInstance.post(`/services/bulk`, { ids, status }),
  ];
  let lastErr: any;
  for (const attempt of attempts) {
    try { const res = await attempt(); return res.data ?? res; } catch (err: any) {
      lastErr = err;
      const sc = err?.response?.status;
      if (sc === 400 || sc === 401 || sc === 403 || sc === 422) break;
    }
  }
  try {
    for (const id of ids) {
      try { await updateService(id, { status, is_active: status === "active" ? 1 : 0 }); } catch { /* continue */ }
    }
    return { success: true };
  } catch (e) { throw lastErr || e; }
};

export default { createService, getServices, getService, updateService, deleteService, restoreService, bulkDeleteServices, bulkUpdateServiceStatus };
