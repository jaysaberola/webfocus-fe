import Link from "next/link";
import { ReactNode } from "react";
import styles from "@/styles/customerAuth.module.css";

const LOGO_SRC = "/images/webfocus-logo.png";

type CustomerAuthShellProps = {
  children: ReactNode;
  backHref?: string;
  backLabel?: string;
};

export default function CustomerAuthShell({
  children,
  backHref = "/public/home",
  backLabel = "Go back to website",
}: CustomerAuthShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.stack}>
        <Link href={backHref} className={styles.backLink}>
          <span aria-hidden="true">‹</span>
          {backLabel}
        </Link>

        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <img src={LOGO_SRC} alt="WebFocus Solutions, Inc." className={styles.logo} />
          </div>
          {children}
        </div>

        <p className={styles.footer}>
          Copyright © {new Date().getFullYear()} WebFocus Solutions, Inc. All Rights Reserved.{" "}
          <Link href="/public/privacy-policy">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

export function CustomerTermsNotice({ variant = "signup" }: { variant?: "login" | "signup" }) {
  const actionText =
    variant === "login"
      ? "'Sign In'"
      : "'Create Account' or 'Sign In'";

  return (
    <div className={styles.termsBox}>
      By clicking {actionText} below, you agree to WebFocus Solutions, Inc.&apos;s Universal{" "}
      <Link href="/public/terms-of-service">Terms of Service</Link> and{" "}
      <Link href="/public/privacy-policy">Privacy Policy</Link>.
    </div>
  );
}

export function FloatingField({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  autoComplete,
  showToggle,
  showValue,
  onToggleShow,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  showToggle?: boolean;
  showValue?: boolean;
  onToggleShow?: () => void;
}) {
  return (
    <label className={styles.field} htmlFor={id}>
      <span className={styles.fieldLabel}>
        {label}
        {required ? " *" : ""}
      </span>
      <input
        id={id}
        type={showToggle && !showValue ? "password" : type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        autoComplete={autoComplete}
        className={`${styles.fieldInput} ${showToggle ? styles.fieldInputWithToggle : ""}`}
      />
      {showToggle && (
        <button type="button" className={styles.showBtn} onClick={onToggleShow}>
          {showValue ? "Hide" : "Show"}
        </button>
      )}
    </label>
  );
}

export function SocialAuthButtons({ onSocialClick }: { onSocialClick: (provider: string) => void }) {
  return (
    <div className={styles.socialBlock}>
      <div className={styles.divider}>
        <span>or sign in with</span>
      </div>
      <div className={styles.socialRow}>
        <button type="button" className={styles.socialBtn} aria-label="Continue with Facebook" onClick={() => onSocialClick("facebook")}>
          <i className="fab fa-facebook-f" aria-hidden="true" />
        </button>
        <button type="button" className={styles.socialBtn} aria-label="Continue with Google" onClick={() => onSocialClick("google")}>
          <i className="fab fa-google" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function SignupProviderButtons({
  onEmail,
  onSocial,
}: {
  onEmail: () => void;
  onSocial: (provider: string) => void;
}) {
  return (
    <div className={styles.providerList}>
      <button type="button" className={styles.providerBtn} onClick={() => onSocial("facebook")}>
        <i className="fab fa-facebook-f" aria-hidden="true" />
        Continue with Facebook
      </button>
      <button type="button" className={styles.providerBtn} onClick={() => onSocial("google")}>
        <i className="fab fa-google" aria-hidden="true" />
        Continue with Google
      </button>
      <button type="button" className={styles.providerBtn} onClick={onEmail}>
        <i className="fa-regular fa-envelope" aria-hidden="true" />
        Continue with Email
      </button>
    </div>
  );
}
