import Link from "next/link";
import { COMMERCE_ADMIN_PATH } from "@/lib/commerceAdmin/constants";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  active: "cms" | "commerce";
};

export default function AdminPortalNav({ active }: Props) {
  return (
    <nav className={styles.portalNav} aria-label="Admin portals">
      <Link
        href="/dashboard"
        className={active === "cms" ? styles.portalNavItemActive : styles.portalNavItem}
      >
        <i className="fa-solid fa-layer-group" aria-hidden="true" />
        CMS Admin
      </Link>
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
