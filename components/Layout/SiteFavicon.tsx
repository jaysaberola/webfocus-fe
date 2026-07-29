"use client";

import Head from "next/head";
import { useEffect, useState } from "react";
import {
  getWebsiteSettingsCached,
  getPublicBrandingCached,
  resolveWebsiteAssetUrl,
  subscribeWebsiteSettingsUpdated,
} from "@/lib/websiteSettings";

export default function SiteFavicon() {
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const refresh = async (opts?: { force?: boolean }) => {
      try {
        const settings = await getWebsiteSettingsCached({ force: opts?.force === true }).catch(() => null);
        const branding = settings?.website_favicon
          ? settings
          : await getPublicBrandingCached({ force: opts?.force === true });

        const url = resolveWebsiteAssetUrl(branding?.website_favicon ?? null);
        if (alive) setFaviconUrl(url ?? null);
      } catch {
        if (alive) setFaviconUrl(null);
      }
    };

    refresh({ force: false });
    const unsub = subscribeWebsiteSettingsUpdated(() => refresh({ force: true }));

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
