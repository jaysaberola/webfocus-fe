import React, { useCallback, useEffect, useRef, useState } from 'react';
import Sidebar from './_Sidebar';
import Topbar from './_Topbar2';
import ToastHost from "@/components/UI/ToastHost";
import Head from "next/head";
import { syncAuthTokenCookieFromStorage } from "@/lib/authToken";
import { getWebsiteSettingsCached, subscribeWebsiteSettingsUpdated } from "@/lib/websiteSettings";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const ADMIN_SIDEBAR_HIDDEN_KEY = "cms5.admin.sidebarHidden";

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const sidebarToggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    syncAuthTokenCookieFromStorage();

    const media = window.matchMedia("(max-width: 991px)");
    const update = () => setIsMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    try {
      const resetKey = "cms5.admin.sidebarVisibilityReset2026";
      if (!window.localStorage.getItem(resetKey)) {
        window.localStorage.setItem(resetKey, "1");
        window.localStorage.setItem(ADMIN_SIDEBAR_HIDDEN_KEY, "0");
        setSidebarHidden(false);
        return;
      }
      setSidebarHidden(window.localStorage.getItem(ADMIN_SIDEBAR_HIDDEN_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    // If focus is currently inside the sidebar, move it to the toggle button
    // to avoid aria-hidden warnings from browsers.
    requestAnimationFrame(() => sidebarToggleRef.current?.focus());
  }, []);
  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen((v) => !v);
      return;
    }

    setSidebarHidden((value) => {
      const next = !value;
      try {
        window.localStorage.setItem(ADMIN_SIDEBAR_HIDDEN_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, [isMobile]);

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

  const tabTitle = companyName;

  return (
    <div
      className={`cms-admin-layout d-flex vh-100 bg-light ${
        sidebarOpen ? "cms-admin-layout--sidebar-open" : ""
      } ${sidebarHidden && !isMobile ? "cms-admin-layout--sidebar-hidden" : ""}`}
    >
      <Head>
        <title>{tabTitle}</title>
      </Head>

      <div className="cms-sidebar-overlay" onClick={closeSidebar} />

      {(!sidebarHidden || isMobile) && (
        <Sidebar
          isOpen={sidebarOpen}
          isMobile={isMobile}
          onClose={closeSidebar}
          width={272}
        />
      )}

      <div className="flex-grow-1 d-flex flex-column">
        <Topbar
          onToggleSidebar={isMobile ? toggleSidebar : undefined}
          sidebarToggleRef={sidebarToggleRef}
          sidebarHidden={sidebarHidden && !isMobile}
          isMobile={isMobile}
        />
        <main className="cms-admin-main overflow-auto flex-grow-1">
          {children}
        </main>
      </div>

      {!isMobile && (
        <button
          type="button"
          className={`cms-sidebar-edge-toggle${sidebarHidden ? " cms-sidebar-edge-toggle--hidden" : ""}`}
          onClick={toggleSidebar}
          aria-label={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
          title={sidebarHidden ? "Show sidebar" : "Hide sidebar"}
        >
          <i className={`fa-solid ${sidebarHidden ? "fa-right-long" : "fa-left-long"}`} />
        </button>
      )}

      <ToastHost />
    </div>
  );
}
