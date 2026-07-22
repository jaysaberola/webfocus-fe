import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getActiveMenu, PublicMenu } from "@/services/publicPageService";
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
  const [menu, setMenu] = useState<PublicMenu | null>(null);

  useEffect(() => {
    getActiveMenu()
      .then((res) => setMenu(res.data.data))
      .catch(() => setMenu(null));
  }, []);

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
