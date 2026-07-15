import LandingTopbar from "./_Topbar";
import LandingFooter from "./_Footer";
import Banner from "./_Banner";
import { PublicAlbum } from "@/services/publicPageService";
import ToastHost from "@/components/UI/ToastHost";
import Head from "next/head";
import { useEffect, useState } from "react";
import { getWebsiteSettingsCached, subscribeWebsiteSettingsUpdated } from "@/lib/websiteSettings"; // adjust import path

interface LandingPageLayoutProps {
  children: React.ReactNode;
  pageData?: {
    title?: string;
    album?: PublicAlbum | null;
    meta?: {
      title?: string | null;
      description?: string | null;
      keywords?: string | null;
    };
  };
  layout?: {
    fullWidth?: boolean;
  };
}

export default function LandingPageLayout({
  children,
  pageData,
  layout,
}: LandingPageLayoutProps) {
  const contentWrapperClassName = layout?.fullWidth
    ? "container-fluid px-0"
    : "container";

  const [companyName, setCompanyName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    const refresh = async (opts?: { force?: boolean }) => {
      try {
        const s = await getWebsiteSettingsCached({ force: opts?.force === true });
        if (!alive) return;
        setCompanyName((s as any)?.company_name || null);
      } catch {
        // ignore
      }
    };

    refresh({ force: false });
    const unsub = subscribeWebsiteSettingsUpdated(() => refresh({ force: true }));
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const baseTitle = pageData?.meta?.title || pageData?.title || "Page";
  const tabTitle = companyName ? `${baseTitle} | ${companyName}` : baseTitle;
  const metaDescription = pageData?.meta?.description || null;
  const metaKeywords = pageData?.meta?.keywords || null;

  return (
    <div className="d-flex flex-column min-vh-100">
      <Head>
        <title>{tabTitle}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        {metaKeywords && <meta name="keywords" content={metaKeywords} />}
        <link rel="stylesheet" href="/css/public-css.css" />
        <link rel="stylesheet" href="/css/custom.css" />
        <link rel="stylesheet" href="/css/product.css" />
        <link rel="stylesheet" href="/css/banner.css" />
        <link rel="stylesheet" href="/css/navigation.css" />
        <link rel="stylesheet" href="/css/public-overrides.css" />
      </Head>

      <LandingTopbar />

      <Banner
        title={pageData?.title}
        album={pageData?.album}
      />

      <main className="flex-grow-1 py-5">
        <div className={contentWrapperClassName}>{children}</div>
      </main>

      <LandingFooter />

      <ToastHost />
    </div>
  );
}