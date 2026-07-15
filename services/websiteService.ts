import { axiosInstance } from "@/services/axios";

export const websiteService = {
  /* ======================
     GET SETTINGS
  ====================== */
  async getSettings() {
    try {
      const { data } = await axiosInstance.get("/website-settings");
      // Support backends that return { setting: {...} } or the object directly
      return data?.setting ?? data ?? {};
    } catch (err: any) {
      // Don't throw - return safe defaults so admin UI can render even if endpoint is missing
      console.warn("websiteService.getSettings failed:", err?.response?.status ?? err?.message);
      return {
        company_name: "",
        website_name: "",
        copyright: "",
        google_analytics: "",
        google_map: "",
        google_recaptcha_sitekey: "",
        company_logo: null,
        website_favicon: null,
        company_address: "",
        mobile_no: "",
        fax_no: "",
        tel_no: "",
        email: "",
        data_privacy_title: "",
        data_privacy_popup_content: "",
        data_privacy_content: "",
      };
    }
  },

  /* ======================
     WEBSITE TAB
  ====================== */
  async updateWebsite(payload: FormData) {
    return axiosInstance.post("/website-settings/website", payload);
  },

  /* ======================
     CONTACT TAB
  ====================== */
  async updateContact(payload: {
    company_address: string;
    mobile_no: string;
    fax_no?: string;
    tel_no: string;
    email: string;
  }) {
    return axiosInstance.post("/website-settings/contact", payload);
  },

  /* ======================
     PRIVACY TAB
  ====================== */
  async updatePrivacy(payload: {
    data_privacy_title: string;
    data_privacy_popup_content: string;
    data_privacy_content: string;
  }) {
    return axiosInstance.post("/website-settings/privacy", payload);
  },

  /* ======================
     SOCIAL MEDIA
  ====================== */
  async getSocials() {
    return axiosInstance.get("/website-settings/social");
  },

  async updateSocials(socials: any[]) {
    return axiosInstance.post("/website-settings/social", { socials });
  },
};
