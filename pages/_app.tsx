import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

import type { AppProps } from "next/app";
import React from "react";
import Head from "next/head";
import Script from "next/script";
import { useRouter } from "next/router";
import FreshchatWidget from "@/components/Layout/FreshchatWidget";
import { isPublicSiteRoute } from "@/lib/freshchatConfig";
import { ADMIN_FONT_HREF, ADMIN_STYLESHEETS, isAdminSiteRoute, isAuthRoute } from "@/lib/adminRoute";
import { isLightweightPublicPage } from "@/lib/publicLegacyScripts";

type AppPropsWithLayout = AppProps & {
  Component: AppProps["Component"] & {
    Layout?: React.ComponentType<{ children: React.ReactNode }>;
  };
};

function isEditorRoute(pathname: string) {
  return (
    pathname === "/settings/website" ||
    pathname === "/pages/create" ||
    /^\/pages\/edit\//.test(pathname)
  );
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  const router = useRouter();
  const Layout = Component.Layout || React.Fragment;
  const enableCfAnalytics = process.env.NEXT_PUBLIC_ENABLE_CF_ANALYTICS === "true";
  const showFreshchat = isPublicSiteRoute(router.pathname);
  const lightweightPublic = isLightweightPublicPage(router.pathname);
  const isAdmin = isAdminSiteRoute(router.pathname);
  const isAuth = isAuthRoute(router.pathname);
  const loadPublicLegacyScripts = !isAdmin && !isAuth && !lightweightPublic;

  React.useEffect(() => {
    if (!isAdmin) return;

    void Promise.all([
      import("@/styles/admin-theme.css"),
      import("@/styles/admin-sidebar-v2.css"),
      import("@/styles/dashboard.css"),
      import("@/styles/admin-table.css"),
      import("@/styles/admin-modal.css"),
      import("@/styles/admin-no-hover.css"),
      import("@/styles/admin-module.css"),
      import("@/styles/admin-help.css"),
    ]);
  }, [isAdmin]);

  React.useEffect(() => {
    if (!isEditorRoute(router.pathname)) return;

    void Promise.all([
      import("grapesjs/dist/css/grapes.min.css"),
      import("@/styles/admin-page-editor.css"),
    ]);
  }, [router.pathname]);

  React.useEffect(() => {
    if (!isAdmin) return;

    const hrefs = [...ADMIN_STYLESHEETS, ADMIN_FONT_HREF];
    const injected: HTMLLinkElement[] = [];

    hrefs.forEach((href) => {
      if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;

      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      injected.push(link);
    });

    return () => {
      injected.forEach((link) => link.remove());
    };
  }, [isAdmin]);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
        {loadPublicLegacyScripts ? (
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
