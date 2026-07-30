import Link from "next/link";
import { useEffect, useState } from "react";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import { isCmsPortalUser } from "@/lib/userRoles";
import { readStoredCurrentUser } from "@/lib/currentUser";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  active: "cms" | "commerce";
};

export default function AdminPortalNav({ active }: Props) {
  const [showCmsPortalLink, setShowCmsPortalLink] = useState(false);

  useEffect(() => {
    setShowCmsPortalLink(isCmsPortalUser(readStoredCurrentUser()));
  }, []);

  return (
    <nav className={styles.portalNav} aria-label="Admin portals">
      {showCmsPortalLink ? (
        <Link
          href="/dashboard"
          className={active === "cms" ? styles.portalNavItemActive : styles.portalNavItem}
        >
          <i className="fa-solid fa-layer-group" aria-hidden="true" />
          CMS Admin
        </Link>
      ) : null}
      <Link
        href={COMMERCE_ADMIN_PATH}
        className={active === "commerce" ? styles.portalNavItemActive : styles.portalNavItem}
      >
        <i className="fa-solid fa-store" aria-hidden="true" />
        Commerce Control Center
      </Link>
    </nav>
  );
}
