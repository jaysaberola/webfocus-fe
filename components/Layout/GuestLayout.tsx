import LandingTopbar from "./_Topbar";
import LandingFooter from "./_Footer";
import MinimalPublicFooter from "./MinimalPublicFooter";
import Banner from "./_Banner";
import { PublicAlbum } from "@/services/publicPageService";
import ToastHost from "@/components/UI/ToastHost";
import PublicCartDrawer from "@/components/Cart/PublicCartDrawer";
import PrivacyConsentBanner from "@/components/Layout/PrivacyConsentBanner";
import { PublicCartDrawerProvider } from "@/components/Cart/PublicCartDrawerContext";
import Head from "next/head";
import { useEffect, useState } from "react";
import { getHeroPreloadImage } from "@/lib/heroBanner";
import { getWebsiteSettingsCached, subscribeWebsiteSettingsUpdated } from "@/lib/websiteSettings";

interface LandingPageLayoutProps {
  children: React.ReactNode;
  pageData?: {
    title?: string;
    slug?: string;
    album?: PublicAlbum | null;
    meta?: {
      title?: string | null;
      description?: string | null;
      keywords?: string | null;
    };
  };
  layout?: {
    fullWidth?: boolean;
    hideBanner?: boolean;
    minimalFooter?: boolean;
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

  const isHomeHero = pageData?.album?.type === "main_banner";
  const hideBanner =
    layout?.hideBanner ||
    pageData?.slug === "about" ||
    pageData?.slug === "about-us" ||
    pageData?.slug === "news" ||
    pageData?.slug === "services";
  const heroPreloadImage = isHomeHero ? getHeroPreloadImage(pageData?.album) : null;

  return (
    <PublicCartDrawerProvider>
      <div className="d-flex flex-column min-vh-100 public-site-shell">
        <Head>
          <title>{tabTitle}</title>
          {metaDescription && <meta name="description" content={metaDescription} />}
          {metaKeywords && <meta name="keywords" content={metaKeywords} />}
          {heroPreloadImage ? (
            <link rel="preload" as="image" href={heroPreloadImage} fetchPriority="high" />
          ) : null}
        </Head>

        <LandingTopbar />

        {!hideBanner && (
          <Banner
            title={pageData?.title}
            album={pageData?.album}
          />
        )}

        <main className={`flex-grow-1 public-site-main ${isHomeHero || hideBanner ? "pt-0" : "pt-5"}`}>
          <div className={contentWrapperClassName}>{children}</div>
        </main>

        {layout?.minimalFooter ? <MinimalPublicFooter /> : <LandingFooter />}

        <ToastHost />
        <PublicCartDrawer />
        <PrivacyConsentBanner />
      </div>
    </PublicCartDrawerProvider>
  );
}