import { axiosInstance } from "./axios";

export interface CreatePagePayload {
  name: string;
  label?: string;
  parent_page_id?: number | null;
  album_id?: number | null;
  contents?: string;
  grapes_html?: string;
  grapes_css?: string;
  grapes_js?: string;
  content_type?: "tiny" | "grapes";
  status: "published" | "private" | "draft";
  meta_title?: string;
  meta_description?: string;
  meta_keyword?: string;
  template?: string;
}

export const createPage = async (payload: CreatePagePayload) => {

  return axiosInstance.post("/pages", payload);
};

export const getPages = (
  params?: Record<string, any>,
  options?: { silent?: boolean }
) => {
  return axiosInstance.get("/pages", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
};

export const restorePage = async (id: number) => {
  // Backends vary a lot on restore routes (Laravel soft-deletes, custom actions, etc.).
  // Try a small set of common conventions before giving up.
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/pages/${id}/restore`),
    () => axiosInstance.post(`/pages/restore/${id}`),
    () => axiosInstance.patch(`/pages/${id}/restore`),
    () => axiosInstance.put(`/pages/${id}/restore`),
    // method-override patterns
    () => axiosInstance.post(`/pages/${id}/restore`, { _method: "PATCH" }),
    () => axiosInstance.post(`/pages/restore`, { id }),
  ];

  let lastError: any;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err: any) {
      lastError = err;
      const status = err?.response?.status;
      // If the backend rejects restore because it's not deleted / not allowed, don't keep retrying.
      if (status === 400 || status === 401 || status === 403 || status === 422) {
        throw err;
      }
      // Otherwise continue trying alternates (404/405/500, etc.)
    }
  }

  throw lastError;
};

export const deletePage = (id: number) => {
  return axiosInstance.delete(`/pages/${id}`);
};

// Some backends implement delete as a POST action (soft-delete). Add fallback.
export const postDeletePage = (id: number) => {
  return axiosInstance.post(`/pages/${id}/delete`);
};

// Some backends expect a POST to the resource with _method=DELETE
export const postMethodDeletePage = (id: number) => {
  return axiosInstance.post(`/pages/${id}`, { _method: "DELETE" });
};

// Other backends accept a generic delete endpoint
export const postDeleteByPayload = (id: number) => {
  return axiosInstance.post(`/pages/delete`, { id });
};

export const getPageById = (id: number) => {
  return axiosInstance.get(`/pages/${id}`);
};

export const updatePage = (id: number, payload: any) => {
  return axiosInstance.put(`/pages/${id}`, payload);
};

export const updatePageStatus = (id: number, status: "published" | "private" | "draft") => {
  return axiosInstance.patch(`/pages/${id}`, { status });
};
