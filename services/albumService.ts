import { axiosInstance } from "./axios";


export interface BannerPayload {
  id?: number;
  title?: string;
  title_font?: string;
  title_font_size?: number;
  title_bold?: boolean;
  description?: string;
  description_font?: string;
  description_font_size?: number;
  description_bold?: boolean;
  alt?: string;
  button_text?: string;
  button_font?: string;
  button_font_size?: number;
  button_bold?: boolean;
  url?: string;
  order?: number;
  image?: File;
  media_type?: "image" | "video";
}

export interface AlbumPayload {
  name: string;
  transition_in: string;
  transition_out: string;
  transition: number;
  banner_type: "image" | "video";
  type?: string;
  banners: BannerPayload[];
}

export interface AlbumRow {
  id: number;
  name: string;
  total_images: number;
  updated_at: string;
  deleted_at?: string | null;
  is_deleted?: boolean | number | string;
  deleted?: boolean;
  visibility?: string | null;
  status?: string | null;
}

export const getAlbums = (
  params?: Record<string, any>,
  options?: { silent?: boolean }
) => {
  return axiosInstance.get("/albums", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
};

export const getAlbum = (id: number) => {
  return axiosInstance.get(`/albums/${id}`);
};

export const createAlbum = (payload: AlbumPayload) => {
  const formData = buildAlbumFormData(payload);
  return axiosInstance.post("/albums", formData);
};

export const updateAlbum = (id: number, payload: AlbumPayload) => {
  const formData = buildAlbumFormData(payload);
  formData.append("_method", "PUT"); // Laravel PUT via POST
  return axiosInstance.post(`/albums/${id}`, formData);
};

export const updateAlbumMeta = (id: number, payload: Partial<AlbumPayload>) => {
  // Send PATCH for partial updates so server doesn't replace entire resource
  return axiosInstance.patch(`/albums/${id}`, payload);
};

export const deleteAlbum = (id: number) => {
  return axiosInstance.delete(`/albums/${id}`);
};

export const restoreAlbum = (id: number) => {
  return axiosInstance.post(`/albums/${id}/restore`);
};

const buildAlbumFormData = (payload: AlbumPayload) => {
  const formData = new FormData();

  formData.append("name", payload.name);
  formData.append("transition_in", payload.transition_in);
  formData.append("transition_out", payload.transition_out);
  formData.append("transition", String(payload.transition));
  formData.append("banner_type", payload.banner_type);

  payload.banners.forEach((banner, index) => {
    if (banner.id) {
      formData.append(`banners[${index}][id]`, String(banner.id));
    }

    formData.append(`banners[${index}][title]`, banner.title ?? "");
    // Font fields: send multiple key variants for backend compatibility.
    const titleFont = banner.title_font ?? "";
    const descriptionFont = banner.description_font ?? "";
    const buttonFont = banner.button_font ?? "";

    const titleFontSize =
      typeof banner.title_font_size === "number" && Number.isFinite(banner.title_font_size)
        ? String(banner.title_font_size)
        : "";
    const titleBold = typeof banner.title_bold === "boolean" ? (banner.title_bold ? "1" : "0") : "";

    const descriptionFontSize =
      typeof banner.description_font_size === "number" && Number.isFinite(banner.description_font_size)
        ? String(banner.description_font_size)
        : "";
    const descriptionBold = typeof banner.description_bold === "boolean" ? (banner.description_bold ? "1" : "0") : "";

    const buttonFontSize =
      typeof banner.button_font_size === "number" && Number.isFinite(banner.button_font_size)
        ? String(banner.button_font_size)
        : "";
    const buttonBold = typeof banner.button_bold === "boolean" ? (banner.button_bold ? "1" : "0") : "";

    formData.append(`banners[${index}][title_font]`, titleFont);
    formData.append(`banners[${index}][titleFont]`, titleFont);
    formData.append(`banners[${index}][title_font_family]`, titleFont);

    formData.append(`banners[${index}][title_font_size]`, titleFontSize);
    formData.append(`banners[${index}][titleFontSize]`, titleFontSize);
    formData.append(`banners[${index}][title_size]`, titleFontSize);

    formData.append(`banners[${index}][title_bold]`, titleBold);
    formData.append(`banners[${index}][titleBold]`, titleBold);
    formData.append(`banners[${index}][is_title_bold]`, titleBold);

    formData.append(`banners[${index}][description]`, banner.description ?? "");
    formData.append(`banners[${index}][description_font]`, descriptionFont);
    formData.append(`banners[${index}][descriptionFont]`, descriptionFont);
    formData.append(`banners[${index}][description_font_family]`, descriptionFont);

    formData.append(`banners[${index}][description_font_size]`, descriptionFontSize);
    formData.append(`banners[${index}][descriptionFontSize]`, descriptionFontSize);
    formData.append(`banners[${index}][description_size]`, descriptionFontSize);

    formData.append(`banners[${index}][description_bold]`, descriptionBold);
    formData.append(`banners[${index}][descriptionBold]`, descriptionBold);
    formData.append(`banners[${index}][is_description_bold]`, descriptionBold);

    formData.append(`banners[${index}][alt]`, banner.alt ?? "");
    formData.append(`banners[${index}][button_text]`, banner.button_text ?? "");
    formData.append(`banners[${index}][button_font]`, buttonFont);
    formData.append(`banners[${index}][buttonFont]`, buttonFont);
    formData.append(`banners[${index}][button_font_family]`, buttonFont);

    formData.append(`banners[${index}][button_font_size]`, buttonFontSize);
    formData.append(`banners[${index}][buttonFontSize]`, buttonFontSize);
    formData.append(`banners[${index}][button_size]`, buttonFontSize);

    formData.append(`banners[${index}][button_bold]`, buttonBold);
    formData.append(`banners[${index}][buttonBold]`, buttonBold);
    formData.append(`banners[${index}][is_button_bold]`, buttonBold);
    formData.append(`banners[${index}][url]`, banner.url ?? "");
    formData.append(`banners[${index}][order]`, String(banner.order ?? index));

    if (banner.image instanceof File) {
      formData.append(`banners[${index}][image]`, banner.image);
    }
  });

  return formData;
};
