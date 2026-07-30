import React, { useState } from "react";
import { useRouter } from "next/router";
import AuthLayout, { AdminAuthField, AdminCustomerLoginHint } from "@/components/Layout/AuthLayout";
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
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

      <form onSubmit={handleLogin}>
        <AdminAuthField
          id="admin-login-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          required
          disabled={isSubmitting}
          autoComplete="email"
        />

        <AdminAuthField
          id="admin-login-password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          required
          disabled={isSubmitting}
          autoComplete="current-password"
        />

        <div className={styles.actions}>
          <button type="submit" className={styles.primaryBtn} disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>

          <a
            href="/forgot-password"
            className={`${styles.secondaryLink} ${isSubmitting ? styles.secondaryLinkDisabled : ""}`}
            aria-disabled={isSubmitting}
          >
            Forgot Password
          </a>
        </div>
      </form>

      <AdminCustomerLoginHint />
    </>
  );
}

LoginPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout title="Sign In">{children}</AuthLayout>
);

export default LoginPage;
