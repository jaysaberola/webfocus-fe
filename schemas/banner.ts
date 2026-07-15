export interface BannerForm {
  id?: number;
  preview?: string;
  image?: File;
  media_type?: "image" | "video";
  is_active?: boolean;
  is_hidden?: boolean;
  title?: string;
  title_font?: string;
  title_font_size?: number;
  title_bold?: boolean;
  description?: string;
  description_font?: string;
  description_font_size?: number;
  description_bold?: boolean;
  button_text?: string;
  button_font?: string;
  button_font_size?: number;
  button_bold?: boolean;
  url?: string;
  alt?: string;
}
