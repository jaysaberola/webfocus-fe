import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import type { PublicMenu } from "@/services/publicPageService";
import {
  collectPublicMenuHrefs,
  getActiveMenuCached,
  useStoredPublicMenu,
} from "@/lib/publicMenuCache";
import { prefetchPublicRoutes } from "@/lib/prefetchPublicRoute";
import MenuItem from "./_MenuItem";

const NAV_SKELETON_LABELS = ["Home", "About Us", "Services", "News"];

export default function Menu({
  isMobile = false,
  onNavigate,
}: {
  isMobile?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const cachedMenu = useStoredPublicMenu();
  const [fetchedMenu, setFetchedMenu] = useState<PublicMenu | null>(null);
  const menu = fetchedMenu ?? cachedMenu;

  useEffect(() => {
    let alive = true;

    getActiveMenuCached()
      .then((data) => {
        if (!alive || !data) return;
        setFetchedMenu(data);
        prefetchPublicRoutes(router, collectPublicMenuHrefs(data.items));
      })
      .catch(() => {
        if (!alive) return;
      });

    return () => {
      alive = false;
    };
  }, [router]);

  if (!menu) {
    return (
      <>
        {NAV_SKELETON_LABELS.map((label) => (
          <li key={label} className="menu-item menu-item--skeleton" aria-hidden="true">
            <div className="menu-row">
              <span className="menu-link menu-link--skeleton">{label}</span>
            </div>
          </li>
        ))}
      </>
    );
  }

  return (
    <>
      {menu.items.map((item) => (
        <MenuItem
          key={item.id}
          item={item}
          currentPath={router.asPath}
          isMobile={isMobile}
          onNavigate={onNavigate}
        />
      ))}
    </>
  );
}
