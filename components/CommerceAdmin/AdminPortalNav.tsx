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
      <div className={styles.portalNavEnd}>
        {showCmsPortalLink ? (
          <a
            href="/dashboard"
            className={styles.portalNavCms}
            onClick={(event) => {
              event.preventDefault();
              window.location.assign("/dashboard");
            }}
          >
            <span className={styles.portalNavCmsIcon} aria-hidden="true">
              <i className="fa-solid fa-layer-group" />
            </span>
            CMS Admin
          </a>
        ) : null}
        <Link
          href={COMMERCE_ADMIN_PATH}
          className={styles.portalNavCommerce}
          aria-current={active === "commerce" ? "page" : undefined}
        >
          <span className={styles.portalNavCommerceIcon} aria-hidden="true">
            <i className="fa-solid fa-store" />
          </span>
          Commerce Control Center
        </Link>
      </div>
    </nav>
  );
}
