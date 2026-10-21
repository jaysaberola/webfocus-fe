import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AuthLayout, {
  AdminAuthField,
  AdminCustomerLoginHint,
  AdminPasswordField,
} from "@/components/Layout/AuthLayout";
import { login } from "@/services/authService";
import { toast } from "@/lib/toast";
import { resolveStaffLoginRedirect } from "@/lib/userRoles";
import styles from "@/styles/adminAuth.module.css";

const getLoginErrorMessage = (error: any) => {
  const data = error?.response?.data;
  const firstValidationError = data?.errors
    ? Object.values(data.errors).flat().find(Boolean)
    : null;

  return (
    firstValidationError ||
    data?.message ||
    error?.message ||
    "Login failed, please try again."
  );
};

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedEmail = localStorage.getItem("cms4.adminRememberEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      if (typeof window !== "undefined") {
        if (rememberMe) {
          localStorage.setItem("cms4.adminRememberEmail", email);
        } else {
          localStorage.removeItem("cms4.adminRememberEmail");
        }
      }
      toast.success("Login successfully.");
      const redirect = typeof router.query.redirect === "string" ? router.query.redirect : "";
      window.location.assign(resolveStaffLoginRedirect(data?.user, redirect));
    } catch (error: any) {
      const message = String(getLoginErrorMessage(error));
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {errorMessage ? (
        <div className={styles.alert} role="alert">
          {errorMessage}
        </div>
      ) : null}

      <form className={styles.formStack} onSubmit={handleLogin}>
        <AdminAuthField
          id="admin-login-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          disabled={isSubmitting}
          autoComplete="email"
          placeholder="you@company.com"
        />

        <AdminPasswordField
          id="admin-login-password"
          label="Password"
          value={password}
          onChange={setPassword}
          required
          disabled={isSubmitting}
          autoComplete="current-password"
          placeholder="Enter your password"
          showValue={showPassword}
          onToggleShow={() => setShowPassword((value) => !value)}
        />

        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={rememberMe}
            disabled={isSubmitting}
            onChange={(event) => setRememberMe(event.target.checked)}
          />
          Keep me signed in on this device
        </label>

        <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
          <span>{isSubmitting ? "Signing in..." : "Sign In"}</span>
          {!isSubmitting ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m13 6 6 6-6 6" />
            </svg>
          ) : null}
        </button>
      </form>

      <AdminCustomerLoginHint />
    </>
  );
}

LoginPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout title="Sign In">{children}</AuthLayout>
);

export default LoginPage;
