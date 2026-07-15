import { axiosInstance } from "./axios";

export interface PublicBanner {
  id: number;
  title?: string;
  title_font?: string;
  title_font_size?: number;
  title_bold?: boolean;
  description?: string;
  description_font?: string;
  description_font_size?: number;
  description_bold?: boolean;
  alt?: string;
  image_url: string;
  media_type?: "image" | "video";
  button_text?: string;
  button_font?: string;
  button_font_size?: number;
  button_bold?: boolean;
  url?: string;
  order: number;
}

export interface PublicAlbum {
  id: number;
  name: string;
  type?: string;
  banner_type?: string;
  transition?: string;
  transition_in?: string;
  transition_out?: string;
  transition_in_value?: string;
  transition_out_value?: string;
  banners: PublicBanner[];
}

export interface PublicPage {
  id: number;
  title: string;
  slug: string;
  content: string;
  content_type?: "tiny" | "grapes";
  grapes_html?: string;
  grapes_css?: string;
  grapes_js?: string;
  album?: PublicAlbum | null;
  meta?: {
    title?: string;
    description?: string;
    keywords?: string;
  };
}

export const getPublicPageBySlug = (slug: string) => {
  return axiosInstance.get<PublicPage>(`/public/pages/${slug}`);
};

export type PublicMenuItem = {
  id: number;
  label: string;
  type: "page" | "url";
  target: string;
  openInNewTab?: boolean | number | string;
  open_in_new_tab?: boolean | number | string;
  newTab?: boolean | number | string;
  targetBlank?: boolean | number | string;
  target_blank?: boolean | number | string;
  targetAttr?: string;
  target_attr?: string;
  children?: PublicMenuItem[];
};

export interface PublicMenu {
  id: number;
  name: string;
  items: PublicMenuItem[];
}

export const getActiveMenu = () => {
  return axiosInstance.get<{ data: PublicMenu }>(`/public/menus/active`);
};

export interface PublicFooter {
  id: number;
  slug: string;
  contents: string;
}

export const getFooter = () => {
  return axiosInstance.get<{ data: PublicFooter }>(`/public/footer`);
};

export const sendContactMessage = (payload: {
  inquiry_type: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_number: string;
  message: string;
}) => {
  return axiosInstance.post("/contact", payload);
};
