import React, { useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import ToastHost from "@/components/UI/ToastHost";
import styles from "@/styles/adminAuth.module.css";
import { AdminAuthBrandHero, AdminAuthRadar, AdminAuthWordmark } from "@/components/Layout/AdminAuthBrand";

const AUTH_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";

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
    body.style.background = "#ffffff";

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
        <link href={AUTH_FONT_HREF} rel="stylesheet" />
      </Head>

      <div className={`admin-auth-root ${styles.page}`}>
        <aside className={styles.brandPanel}>
          <AdminAuthRadar />
          <div className={styles.logoWrap}>
            <AdminAuthWordmark variant="dark" />
          </div>
          <div className={styles.brandInner}>
            <AdminAuthBrandHero />
          </div>
          <p className={styles.brandFooter}>
            Developed by WebFocus Solutions, Inc. © {new Date().getFullYear()}
          </p>
        </aside>

        <main className={styles.formPanel}>
          <div className={styles.formPanelInner}>
            <div className={styles.formCard}>
              <div className={styles.formLogoWrap}>
                <AdminAuthWordmark variant="light" />
              </div>
              <h2 className={styles.formTitle}>{title}</h2>
              {subtitle ? <p className={styles.formLead}>{subtitle}</p> : null}
              {children}
            </div>
          </div>
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
  placeholder,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.inputShell}>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={styles.fieldInput}
        />
      </div>
    </label>
  );
}

export function AdminPasswordField({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  autoComplete,
  placeholder,
  showValue,
  onToggleShow,
  forgotHref = "/forgot-password",
  showForgotLink = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
  showValue: boolean;
  onToggleShow: () => void;
  forgotHref?: string;
  showForgotLink?: boolean;
}) {
  return (
    <div className={styles.field}>
      {showForgotLink ? (
        <div className={styles.fieldLabelRow}>
          <span className={styles.fieldLabel}>{label}</span>
          <Link href={forgotHref} className={styles.forgotLink} tabIndex={disabled ? -1 : 0}>
            Forgot password?
          </Link>
        </div>
      ) : (
        <span className={styles.fieldLabel}>{label}</span>
      )}
      <div className={styles.inputShell}>
        <input
          id={id}
          type={showValue ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={`${styles.fieldInput} ${styles.fieldInputWithToggle}`}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={onToggleShow}
          disabled={disabled}
          aria-label={showValue ? "Hide password" : "Show password"}
        >
          {showValue ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <line x1="2" x2="22" y1="2" y2="22" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function AdminCustomerLoginHint() {
  return (
    <div className={styles.customerHintRow}>
      <span>Portal customer?</span>
      <Link href="/public/login">Go to customer login →</Link>
    </div>
  );
}
