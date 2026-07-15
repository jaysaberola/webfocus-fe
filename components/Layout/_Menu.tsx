import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getActiveMenu, PublicMenu } from "@/services/publicPageService";
import MenuItem from "./_MenuItem";

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

  if (!menu) return null;

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
