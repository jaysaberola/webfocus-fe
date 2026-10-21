import React, { useState } from "react";
import AuthLayout, { AdminAuthField, AdminPasswordField } from "@/components/Layout/AuthLayout";
import { toast } from "@/lib/toast";
import styles from "@/styles/adminAuth.module.css";

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    console.log("Reset password:", { email, password });
  };

  return (
    <form className={styles.formStack} onSubmit={handleSubmit}>
      <AdminAuthField
        id="admin-reset-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        autoComplete="email"
        placeholder="you@company.com"
      />

      <AdminPasswordField
        id="admin-reset-password"
        label="New Password"
        value={password}
        onChange={setPassword}
        required
        autoComplete="new-password"
        placeholder="Enter your password"
        showValue={showPassword}
        onToggleShow={() => setShowPassword((value) => !value)}
        showForgotLink={false}
      />

      <AdminPasswordField
        id="admin-reset-confirm"
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        required
        autoComplete="new-password"
        placeholder="Enter your password"
        showValue={showConfirmPassword}
        onToggleShow={() => setShowConfirmPassword((value) => !value)}
        showForgotLink={false}
      />

      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn}>
          Reset Password
        </button>

        <a href="/" className={styles.secondaryLink}>
          Cancel
        </a>
      </div>
    </form>
  );
}

ResetPasswordPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout
    title="Reset Password"
    subtitle="Enter your email address and your new password below."
  >
    {children}
  </AuthLayout>
);

export default ResetPasswordPage;
