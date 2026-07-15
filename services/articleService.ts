import { axiosInstance } from "@/services/axios";

export interface CreateArticleCategoryPayload {
  name: string;
}

export interface ArticleCategory {
  id: number;
  name: string;
  slug: string;
  user_id: number;
  created_at?: string;
}

export const createArticleCategory = async (
  payload: CreateArticleCategoryPayload
): Promise<ArticleCategory> => {
  const res = await axiosInstance.post("/article-categories", payload);
  return res.data.data;
};

export const fetchArticleCategories = async (): Promise<ArticleCategory[]> => {
  const res = await axiosInstance.get("/fetch-article-categories");
  return res.data.data;
};

// fetch categories

export interface NewsCategoryRow {
  id: number;
  name: string;
  slug: string;
  articles_count?: number;
  created_at?: string;
  deleted_at?: string | null;
  is_deleted?: boolean | number | string;
  deleted?: boolean;
  status?: string;
  visibility?: string;
}

interface FetchCategoriesParams {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
  show_deleted?: boolean | number;
  with_trashed?: boolean | number;
  only_trashed?: boolean | number;
  only_deleted?: boolean | number;
  [key: string]: any;
}

export const getArticleCategories = async (
  params: FetchCategoriesParams,
  options?: { silent?: boolean }
) => {
  const res = await axiosInstance.get("/article-categories", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });

  return res.data;
};

//update category

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
}

export const getArticleCategory = async (id: number) => {
  const res = await axiosInstance.get(`/article-categories/${id}`);
  return res.data.data;
};

export const updateArticleCategory = async (
  id: number,
  payload: { name: string }
) => {
  const res = await axiosInstance.put(`/article-categories/${id}`, payload);
  return res.data.data;
};

export const deleteArticleCategory = (id: number) => {
  return axiosInstance.delete(`/article-categories/${id}`);
};

export const postMethodDeleteArticleCategory = (id: number) => {
  return axiosInstance.post(`/article-categories/${id}`, { _method: "DELETE" });
};

export const postDeleteArticleCategoryByPayload = (id: number) => {
  return axiosInstance.post(`/article-categories/delete`, { id });
};

export const restoreArticleCategory = async (id: number) => {
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/article-categories/${id}/restore`),
    () => axiosInstance.post(`/article-categories/restore/${id}`),
    () => axiosInstance.patch(`/article-categories/${id}/restore`),
    () => axiosInstance.put(`/article-categories/${id}/restore`),
    () => axiosInstance.post(`/article-categories/${id}/restore`, { _method: "PATCH" }),
    () => axiosInstance.post(`/article-categories/${id}`, { _method: "PATCH", action: "restore" }),
    () => axiosInstance.post(`/article-categories/restore`, { id }),
  ];

  let lastErr: any;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 403 || status === 422) {
        throw err;
      }
    }
  }

  throw lastErr;
};

export interface CreateArticlePayload {
  title: string;
  date: string;
  category_id: number;
  content: string;
  teaser: string;
  status: "private" | "published";
  is_featured: boolean;

  banner?: File | null;
  thumbnail?: File | null;

  meta_title?: string;
  meta_keyword?: string;
  meta_description?: string;
}

export const createArticle = async (payload: CreateArticlePayload) => {
  const formData = new FormData();

  formData.append("name", payload.title);
  formData.append("date", payload.date);
  formData.append("category_id", payload.category_id.toString());
  formData.append("contents", payload.content);
  formData.append("teaser", payload.teaser);
  formData.append("status", payload.status);
  formData.append("is_featured", payload.is_featured ? "1" : "0");

  if (payload.banner) formData.append("banner", payload.banner);
  if (payload.thumbnail) formData.append("thumbnail", payload.thumbnail);

  if (payload.meta_title) formData.append("meta_title", payload.meta_title);
  if (payload.meta_keyword) formData.append("meta_keyword", payload.meta_keyword);
  if (payload.meta_description)
    formData.append("meta_description", payload.meta_description);

  const res = await axiosInstance.post("/articles", formData);

  return res.data;
};

export interface ArticleRow {
  id: number;
  title: string;
  category: string;
  is_featured: boolean;
  visibility: string;
  updated: string;
}

interface GetArticlesParams {
  search?: string;
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: string;
  show_deleted?: boolean | number;
  with_trashed?: boolean | number;
  only_trashed?: boolean | number;
  only_deleted?: boolean | number;
  [key: string]: any;
}

export const getArticles = async (params: GetArticlesParams, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/articles", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data; // 🔥 RAW Laravel pagination
};

export const deleteArticle = (id: number) => {
  return axiosInstance.delete(`/articles/${id}`);
};

export const postMethodDeleteArticle = (id: number) => {
  return axiosInstance.post(`/articles/${id}`, { _method: "DELETE" });
};

export const postDeleteArticleByPayload = (id: number) => {
  return axiosInstance.post(`/articles/delete`, { id });
};

export const updateArticleStatus = async (id: number, status: "published" | "private" | "draft") => {
  // Backend reports: PATCH not supported for /api/articles/:id
  // Prefer POST-based conventions and only fall back to a full update when required.
  const postJson = () => axiosInstance.post(`/articles/${id}`, { status });
  const postJsonMethodPut = () => axiosInstance.post(`/articles/${id}`, { _method: "PUT", status });
  const postForm = () => {
    const fd = new FormData();
    fd.append("status", status);
    return axiosInstance.post(`/articles/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  };
  const postFormMethodPut = () => {
    const fd = new FormData();
    fd.append("_method", "PUT");
    fd.append("status", status);
    return axiosInstance.post(`/articles/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
  };

  const attempts: Array<() => Promise<any>> = [postJson, postJsonMethodPut, postForm, postFormMethodPut];

  let lastErr: any;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err: any) {
      lastErr = err;
      const http = err?.response?.status;
      // If it is a validation error (common when backend requires full article payload),
      // fall through to the full-update fallback below.
      if (http && http !== 422) {
        // try next attempt
      }
    }
  }

  // Fallback: some backends only allow updating articles via the full update form.
  // We'll fetch the article, then resubmit with the same fields + new status.
  try {
    const existing: any = await getArticle(id);

    const title = existing?.name ?? existing?.title;
    const date = existing?.date;
    const categoryId = existing?.category_id ?? existing?.category?.id;
    const content = existing?.contents ?? existing?.content;
    const teaser = existing?.teaser;
    const isFeatured = !!(existing?.is_featured ?? existing?.featured);

    if (!title || !date || !categoryId || !content || typeof teaser === "undefined") {
      throw lastErr;
    }

    return await updateArticle(id, {
      title,
      date,
      category_id: Number(categoryId),
      content,
      teaser,
      status,
      is_featured: isFeatured,
      meta_title: existing?.meta_title,
      meta_keyword: existing?.meta_keyword,
      meta_description: existing?.meta_description,
    });
  } catch (err) {
    throw lastErr;
  }
};

export const restoreArticle = async (id: number) => {
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/articles/${id}/restore`),
    () => axiosInstance.post(`/articles/restore/${id}`),
    () => axiosInstance.patch(`/articles/${id}/restore`),
    () => axiosInstance.put(`/articles/${id}/restore`),
    () => axiosInstance.post(`/articles/${id}/restore`, { _method: "PATCH" }),
    () => axiosInstance.post(`/articles/restore`, { id }),
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
};

export const duplicateArticle = async (id: number) => {
  const attempts: Array<() => Promise<any>> = [
    () => axiosInstance.post(`/articles/${id}/duplicate`),
    () => axiosInstance.post(`/articles/duplicate`, { id }),
    () => axiosInstance.post(`/duplicate-article`, { id }),
  ];

  let lastErr: any;
  for (const attempt of attempts) {
    try {
      const res = await attempt();
      return res.data;
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status;
      if (status === 400 || status === 401 || status === 403 || status === 404) {
        // treat as final for client errors
        throw err;
      }
      // otherwise try next
    }
  }

  throw lastErr;
};


export const getArticle = async (id: number) => {
  const res = await axiosInstance.get(`/articles/${id}`);
  return res.data.data;
};

export const updateArticle = async (
  id: number,
  payload: any
) => {
  const formData = new FormData();

  formData.append("name", payload.title);
  formData.append("date", payload.date);
  formData.append("category_id", payload.category_id.toString());
  formData.append("contents", payload.content);
  formData.append("teaser", payload.teaser);
  formData.append("status", payload.status);
  formData.append("is_featured", payload.is_featured ? "1" : "0");

  if (payload.banner) formData.append("banner", payload.banner);
  if (payload.thumbnail) formData.append("thumbnail", payload.thumbnail);

  if (payload.meta_title)
    formData.append("meta_title", payload.meta_title);
  if (payload.meta_keyword)
    formData.append("meta_keyword", payload.meta_keyword);
  if (payload.meta_description)
    formData.append("meta_description", payload.meta_description);

  const res = await axiosInstance.post(
    `/articles/${id}`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return res.data;
};



// news page endpoints
export const getPublicArticles = (params?: any) =>
  axiosInstance.get("/public-articles", { params });

export const getCategories = () =>
  axiosInstance.get("/public-article-categories");

export const getArchive = () =>
  axiosInstance.get("/public-articles-archive");

export const getArticleBySlug = (slug: string) =>
  axiosInstance.get(`/public-articles/${slug}`);
