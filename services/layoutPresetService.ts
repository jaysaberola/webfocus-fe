import { axiosInstance } from "@/services/axios";

export type LayoutPreset = {
  id: number;
  name: string;
  category?: string;
  thumbnail?: string;
  content: string;
  is_active: boolean;
};

export const layoutPresetService = {
  getAll(params?: {
    search?: string;
    page?: number;
    per_page?: number;
    sort_by?: string;
    sort_order?: string;
    show_deleted?: number;
    with_trashed?: number;
    only_trashed?: number;
    only_deleted?: number;
    [key: string]: any;
  }) {
    return axiosInstance.get("/layout-presets", {
      params,
    });
  },

  create(data: FormData) {
    return axiosInstance.post("/layout-presets", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  update(id: number, data: FormData) {
    return axiosInstance.post(`/layout-presets/${id}?_method=PUT`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  delete(id: number) {
    return axiosInstance.delete(`/layout-presets/${id}`);
  },

  // Alternatives for soft-delete endpoints (some backends implement delete as POST/action)
  postDelete(id: number) {
    return axiosInstance.post(`/layout-presets/${id}/delete`);
  },

  postMethodDelete(id: number) {
    return axiosInstance.post(`/layout-presets/${id}`, { _method: "DELETE" });
  },

  postDeleteByPayload(id: number) {
    return axiosInstance.post(`/layout-presets/delete`, { id });
  },

  getById(id: number) {
    return axiosInstance.get(`/layout-presets/${id}`);
  },

  restore: async (id: number) => {
    const attempts: Array<() => Promise<any>> = [
      () => axiosInstance.post(`/layout-presets/${id}/restore`),
      () => axiosInstance.post(`/layout-presets/restore/${id}`),
      () => axiosInstance.patch(`/layout-presets/${id}/restore`),
      () => axiosInstance.put(`/layout-presets/${id}/restore`),
      () => axiosInstance.post(`/layout-presets/${id}/restore`, { _method: "PATCH" }),
      () => axiosInstance.post(`/layout-presets/restore`, { id }),
    ];

    let lastErr: any;
    for (const attempt of attempts) {
      try {
        return await attempt();
      } catch (err: any) {
        lastErr = err;
        const status = err?.response?.status;
        if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
          throw err;
        }
      }
    }

    throw lastErr;
  },
};
