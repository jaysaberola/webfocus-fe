import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CustomerTermsNotice,
  FloatingField,
  SocialAuthButtons,
} from "@/components/Auth/CustomerAuthShell";
import styles from "@/styles/customerAuth.module.css";
import modalStyles from "@/styles/customerSignInModal.module.css";
import { toast } from "@/lib/toast";
import { customerLogin } from "@/services/publicCustomerService";

type CustomerLoginFormProps = {
  onSuccess?: () => void;
  signupHref?: string;
  forgotPasswordHref?: string;
};

export default function CustomerLoginForm({
  onSuccess,
  signupHref = "/public/signup",
  forgotPasswordHref = "/public/forgot-password",
}: CustomerLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      await customerLogin(email, password);
      if (rememberMe && typeof window !== "undefined") {
        localStorage.setItem("cms4.customerRememberEmail", email);
      } else if (typeof window !== "undefined") {
        localStorage.removeItem("cms4.customerRememberEmail");
      }
      toast.success("Welcome back");
      onSuccess?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid login details");
    } finally {
      setLoading(false);
    }
  };

  const onSocialClick = (provider: string) => {
    toast.info(`${provider === "facebook" ? "Facebook" : "Google"} sign in is coming soon.`);
  };

  return (
    <>
      <h1 className={styles.title}>Sign in</h1>
      <p className={styles.lead}>
        New to WebFocus Solutions, Inc.? <Link href={signupHref}>Create an Account</Link>
      </p>

      <CustomerTermsNotice variant="login" />

      <form onSubmit={submit}>
        <FloatingField
          id="modal-login-email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <FloatingField
          id="modal-login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
          showToggle
          showValue={showPassword}
          onToggleShow={() => setShowPassword((value) => !value)}
        />

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Keep me signed in on this device
        </label>

        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <SocialAuthButtons onSocialClick={onSocialClick} />

      <p className={styles.footerLink}>
        Need to find <Link href={forgotPasswordHref}>your password?</Link>
      </p>
    </>
  );
}

type CustomerSignInModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CustomerSignInModal({ open, onClose, onSuccess }: CustomerSignInModalProps) {
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div className={modalStyles.overlay} role="presentation">
      <button type="button" className={modalStyles.backdrop} aria-label="Close sign in" onClick={onClose} />
      <div className={modalStyles.dialog} role="dialog" aria-modal="true" aria-label="Sign in">
        <button type="button" className={modalStyles.closeBtn} aria-label="Close" onClick={onClose}>
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>

        <div className={modalStyles.logoWrap}>
          <img src="/images/webfocus-logo.png" alt="WebFocus Solutions, Inc." className={modalStyles.logo} />
        </div>

        <CustomerLoginForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
}
