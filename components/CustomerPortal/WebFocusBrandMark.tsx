import { useEffect, useState } from "react";
import {
  getWebsiteSettingsCached,
  readStoredWebsiteSettings,
  resolveWebsiteFaviconUrl,
  subscribeWebsiteSettingsUpdated,
} from "@/lib/websiteSettings";
import styles from "@/styles/customerPortal.module.css";

export default function WebFocusBrandMark({
  className,
  variant = "logo",
}: {
  className?: string;
  variant?: "logo" | "badge";
}) {
  const [src, setSrc] = useState(() => resolveWebsiteFaviconUrl(readStoredWebsiteSettings()) ?? null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const apply = () => {
      if (!alive) return;
      setSrc(resolveWebsiteFaviconUrl(readStoredWebsiteSettings()) ?? null);
      setFailed(false);
    };

    void getWebsiteSettingsCached().then((settings) => {
      if (!alive) return;
      setSrc(resolveWebsiteFaviconUrl(settings) ?? null);
      setFailed(false);
    });

    const unsub = subscribeWebsiteSettingsUpdated(apply);
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const markClass = [styles.chatBrandMark, className].filter(Boolean).join(" ");

  if (variant !== "badge" && src && !failed) {
    return (
      <span className={markClass} aria-hidden="true">
        <img src={src} alt="" onError={() => setFailed(true)} />
      </span>
    );
  }

  return (
    <span className={`${markClass} ${styles.chatBrandMarkFallback}`} aria-hidden="true">
      w
    </span>
  );
}
