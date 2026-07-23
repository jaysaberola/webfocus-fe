import Link from "next/link";
import styles from "@/styles/commerceAdmin.module.css";

const CATALOG_LINKS = [
  {
    title: "Products",
    desc: "Product catalog, pricing, and categories for the public store.",
    href: "/products",
    icon: "fa-solid fa-box",
  },
  {
    title: "Services",
    desc: "Hosting, domains, and service packages offered to customers.",
    href: "/services",
    icon: "fa-solid fa-cloud",
  },
  {
    title: "Coupons",
    desc: "Promotional codes applied during checkout.",
    href: "/coupons",
    icon: "fa-solid fa-tags",
  },
  {
    title: "Job Orders",
    desc: "Internal job order workflow and fulfillment tracking.",
    href: "/job-orders",
    icon: "fa-solid fa-clipboard-list",
  },
  {
    title: "Sales Transactions",
    desc: "Full transaction editor with line items and payment status.",
    href: "/sales-transactions",
    icon: "fa-regular fa-credit-card",
  },
  {
    title: "Customer Accounts",
    desc: "Create and manage portal customer logins.",
    href: "/customers",
    icon: "fa-solid fa-users",
  },
];

export default function CommerceCatalogTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Catalog & Operations</h3>
          <p className={styles.panelSubtitle}>
            Admin tools for catalog, billing, and fulfillment — all reachable from Commerce Control Center.
          </p>
        </div>
      </div>

      <div className={styles.catalogGrid}>
        {CATALOG_LINKS.map((item) => (
          <Link key={item.href} href={item.href} className={styles.catalogCard}>
            <span className={styles.catalogIcon} aria-hidden="true">
              <i className={item.icon} />
            </span>
            <div>
              <strong>{item.title}</strong>
              <p>{item.desc}</p>
            </div>
            <i className={`fa-solid fa-arrow-up-right-from-square ${styles.catalogArrow}`} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
