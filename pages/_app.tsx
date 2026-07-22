import "bootstrap/dist/css/bootstrap.min.css"; //AdminLayout
import "@fortawesome/fontawesome-free/css/all.min.css"; //AdminLayout
import "grapesjs/dist/css/grapes.min.css";
import "@/styles/admin-theme.css";
import "@/styles/admin-sidebar-v2.css";
import "@/styles/dashboard.css";
import "@/styles/admin-table.css";
import "@/styles/admin-modal.css";
// Public-folder admin CSS (custom.css, admin.css) is loaded via <link> when on admin routes.

import type { AppProps } from "next/app";
import React from "react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import FreshchatWidget from "@/components/Layout/FreshchatWidget";
import { isPublicSiteRoute } from "@/lib/freshchatConfig";
import { ADMIN_FONT_HREF, ADMIN_STYLESHEETS, isAdminSiteRoute } from "@/lib/adminRoute";
import { isLightweightPublicPage } from "@/lib/publicLegacyScripts";
// LoadingProvider removed to disable global loading overlay

type AppPropsWithLayout = AppProps & {
  Component: AppProps["Component"] & {
    Layout?: React.ComponentType<{ children: React.ReactNode }>;
  };
};

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  const Layout = Component.Layout || React.Fragment;
  const enableCfAnalytics = process.env.NEXT_PUBLIC_ENABLE_CF_ANALYTICS === "true";
  const showFreshchat = isPublicSiteRoute(router.pathname);
  const lightweightPublic = isLightweightPublicPage(router.pathname);
  const isPublic = isPublicSiteRoute(router.pathname);
  const isAdmin = isAdminSiteRoute(router.pathname);

  React.useEffect(() => {
    if (isPublic) return;
    import("bootstrap");
  }, [isPublic]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {isAdmin ? (
          <>
            {ADMIN_STYLESHEETS.map((href) => (
              <link key={href} rel="stylesheet" href={href} />
            ))}
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href={ADMIN_FONT_HREF} rel="stylesheet" />
          </>
        ) : null}
      </Head>

      <Layout {...pageProps}>
        <Component {...pageProps} />

        {enableCfAnalytics ? (
          <Script
            id="cf-beacon"
            src="https://static.cloudflareinsights.com/beacon.min.js/vcd15cbe7772f49c399c6a5babf22c1241717689176015"
            strategy="afterInteractive"
            integrity="sha512-ZpsOmlRQV6y907TI0dKBHq9Md29nnaEIPlkf84rnaERnq6zvWvPUqr2ft8M1aS28oN72PdrCzSjY4U6VaAw1EQ=="
            data-cf-beacon='{"version":"2024.11.0","token":"cd0b4b3a733644fc843ef0b185f98241","server_timing":{"name":{"cfCacheStatus":true,"cfEdge":true,"cfExtPri":true,"cfL4":true,"cfOrigin":true,"cfSpeedBrain":true},"location_startswith":null}}'
            crossOrigin="anonymous"
          />
        ) : null}

        <Script src="/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        {!lightweightPublic ? (
          <>
            <Script src="/js/flatpickr.min.js" strategy="afterInteractive" />
            <Script src="/js/glightbox.min.js" strategy="afterInteractive" />
            <Script src="/js/swiper-bundle.min.js" strategy="afterInteractive" />
            <Script src="/js/swiper-custom.js" strategy="afterInteractive" />
            <Script src="/js/main.js" strategy="afterInteractive" />
          </>
        ) : (
          <Script id="public-light-init" strategy="lazyOnload">
            {`
              document.body.classList.add('page-loaded');
              var yearEl = document.getElementById('copyright-year');
              if (yearEl) yearEl.textContent = new Date().getFullYear();
            `}
          </Script>
        )}
      </Layout>

      {showFreshchat ? <FreshchatWidget /> : null}
    </>
  );
}
