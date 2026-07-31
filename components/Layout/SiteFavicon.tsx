"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import {
  getWebsiteSettingsCached,
  readStoredWebsiteSettings,
  resolveWebsiteAssetUrl,
  subscribeWebsiteSettingsUpdated,
} from "@/lib/websiteSettings";

export default function SiteFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const refresh = async (opts?: { force?: boolean }) => {
      try {
        const settings = await getWebsiteSettingsCached({ force: opts?.force === true });
        const url = resolveWebsiteAssetUrl(settings?.website_favicon ?? null);
        if (alive) setFaviconUrl(url ?? null);
      } catch {
        if (alive) setFaviconUrl(null);
      }
    };

    refresh({ force: false });
    const unsub = subscribeWebsiteSettingsUpdated(() => {
      const settings = readStoredWebsiteSettings();
      const url = resolveWebsiteAssetUrl(settings?.website_favicon ?? null);
      if (alive) setFaviconUrl(url ?? null);
    });

    return () => {
      alive = false;
      unsub();
    };
  }, []);

  if (!faviconUrl) return null;

  return (
    <Head>
      <link rel="icon" href={faviconUrl} />
      <link rel="shortcut icon" href={faviconUrl} />
      <link rel="apple-touch-icon" href={faviconUrl} />
    </Head>
  );
}
