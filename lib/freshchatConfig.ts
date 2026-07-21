export type FreshchatConfig = {
  token: string;
  host: string;
  direction: "ltr" | "rtl";
  cssClass: string;
  cssRight: string;
  cssBottom: string;
  fwcScriptSrc: string | null;
};

const DEFAULT_FWC_SCRIPT_SRC = "//fw-cdn.com/11419951/4091723.js";

export function getFreshchatConfigFromEnv(): FreshchatConfig | null {
  const token = (process.env.NEXT_PUBLIC_FRESHCHAT_TOKEN || "").trim();
  const fwcScriptSrc = (process.env.NEXT_PUBLIC_FWC_SCRIPT_SRC || "").trim();
  const host = (process.env.NEXT_PUBLIC_FRESHCHAT_HOST || "https://wchat.freshchat.com").replace(
    /\/$/,
    ""
  );
  const directionRaw = (process.env.NEXT_PUBLIC_FRESHCHAT_DIRECTION || "ltr").trim().toLowerCase();
  const direction: FreshchatConfig["direction"] = directionRaw === "rtl" ? "rtl" : "ltr";
  const cssClass = process.env.NEXT_PUBLIC_FRESHCHAT_CSS_CLASS || "custom_fc_frame";
  const cssRight = process.env.NEXT_PUBLIC_FRESHCHAT_CSS_RIGHT || "20px";
  const cssBottom = process.env.NEXT_PUBLIC_FRESHCHAT_CSS_BOTTOM || "100px";

  if (!token && !fwcScriptSrc) return null;

  return {
    token,
    host,
    direction,
    cssClass,
    cssRight,
    cssBottom,
    fwcScriptSrc: fwcScriptSrc || (token ? null : DEFAULT_FWC_SCRIPT_SRC),
  };
}

export function isPublicSiteRoute(pathname: string) {
  return (
    pathname.startsWith("/public") ||
    pathname.startsWith("/news/preview") ||
    pathname.startsWith("/pages/preview")
  );
}

export function normalizeScriptSrc(src: string) {
  if (src.startsWith("//")) {
    return `https:${src}`;
  }
  return src;
}
