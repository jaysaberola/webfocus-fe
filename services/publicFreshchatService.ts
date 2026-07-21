import axios from "axios";

const API_URL = `${(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")}/api`;

export type PublicFreshchatConfig = {
  token: string | null;
  host: string;
  direction: "ltr" | "rtl";
  fwc_script_src: string | null;
  css_class: string;
  css_right: string;
  css_bottom: string;
};

const DEFAULT_FWC_SCRIPT_SRC = "//fw-cdn.com/11419951/4091723.js";

export async function getPublicFreshchatConfig(): Promise<PublicFreshchatConfig> {
  const res = await axios.get(`${API_URL}/public/freshchat`);
  const data = res.data?.data ?? res.data ?? {};

  return {
    token: typeof data.token === "string" && data.token.trim() ? data.token.trim() : null,
    host: (data.host || "https://wchat.freshchat.com").replace(/\/$/, ""),
    direction: data.direction === "rtl" ? "rtl" : "ltr",
    fwc_script_src:
      typeof data.fwc_script_src === "string" && data.fwc_script_src.trim()
        ? data.fwc_script_src.trim()
        : DEFAULT_FWC_SCRIPT_SRC,
    css_class: data.css_class || "custom_fc_frame",
    css_right: data.css_right || "20px",
    css_bottom: data.css_bottom || "100px",
  };
}
