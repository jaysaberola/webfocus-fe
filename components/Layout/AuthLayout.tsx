import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import ToastHost from "@/components/UI/ToastHost";
import { ADMIN_FONT_HREF } from "@/lib/adminRoute";
import styles from "@/styles/adminAuth.module.css";

const LOGO_SRC = "/images/webfocus-logo.png";

interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AuthLayout({
  children,
  title = "Sign In",
  subtitle = "Welcome to the WebFocus Admin Portal. Please sign in to continue.",
}: AuthLayoutProps) {
  useEffect(() => {
    const body = document.body;
    const previous = {
      margin: body.style.margin,
      overflow: body.style.overflow,
      background: body.style.background,
    };

    body.classList.add("admin-auth-page");
    body.style.margin = "0";
    body.style.background = "#eef2f7";

    const media = window.matchMedia("(max-width: 991px)");
    const syncOverflow = () => {
      body.style.overflow = media.matches ? "auto" : "hidden";
    };
    syncOverflow();
    media.addEventListener("change", syncOverflow);

    return () => {
      body.classList.remove("admin-auth-page");
      body.style.margin = previous.margin;
      body.style.overflow = previous.overflow;
      body.style.background = previous.background;
      media.removeEventListener("change", syncOverflow);
    };
  }, []);

  return (
    <>
      <Head>
        <title>{title} | WebFocus Admin Portal</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={ADMIN_FONT_HREF} rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        <aside className={styles.brandPanel}>
          <div className={styles.brandInner}>
            <div className={styles.logoWrap}>
              <img src={LOGO_SRC} alt="WebFocus Solutions, Inc." className={styles.logo} />
            </div>
            <h1 className={styles.brandTitle}>Admin Portal</h1>
            <p className={styles.brandLead}>
              Manage your website content, commerce operations, and team access from one secure workspace.
            </p>
            <ul className={styles.brandPoints}>
              <li>
                <i className="fa-solid fa-layer-group" aria-hidden="true" />
                CMS modules for pages, banners, and news
              </li>
              <li>
                <i className="fa-solid fa-store" aria-hidden="true" />
                Commerce Control Center for clients and billing
              </li>
              <li>
                <i className="fa-solid fa-shield-halved" aria-hidden="true" />
                Role-based access for your staff
              </li>
            </ul>
          </div>
        </aside>

        <main className={styles.formPanel}>
          <div className={styles.formCard}>
            <div className={styles.formLogoWrap}>
              <img src={LOGO_SRC} alt="WebFocus Solutions, Inc." className={styles.formLogo} />
            </div>
            <h2 className={styles.formTitle}>{title}</h2>
            {subtitle ? <p className={styles.formLead}>{subtitle}</p> : null}
            {children}
          </div>

          <p className={styles.footer}>
            Admin Portal · Developed by WebFocus Solutions, Inc. © {new Date().getFullYear()}
          </p>
        </main>
      </div>

      <ToastHost />
    </>
  );
}

export function AdminAuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
}) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.fieldLabel}>
        {required ? <span className={styles.fieldLabelRequired}>* </span> : null}
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        className={styles.fieldInput}
      />
    </label>
  );
}

export function AdminCustomerLoginHint() {
  return (
    <p className={styles.customerHint}>
      Portal customer?{" "}
      <Link href="/public/login">Sign in at the customer login</Link>
    </p>
  );
}
