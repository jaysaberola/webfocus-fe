import React, { useState } from "react";
import AuthLayout, { AdminAuthField } from "@/components/Layout/AuthLayout";
import { toast } from "@/lib/toast";
import styles from "@/styles/adminAuth.module.css";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    toast.success("If that email exists, password reset instructions will be sent shortly.");
  };

  return (
    <form onSubmit={handleSubmit}>
      <AdminAuthField
        id="admin-forgot-email"
        label="Email"
        type="email"
        value={email}
        onChange={setEmail}
        required
        autoComplete="email"
      />

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn}>
          Send Reset Link
        </button>

        <a href="/" className={styles.secondaryLink}>
          Back to Sign In
        </a>
      </div>
    </form>
  );
}

ForgotPasswordPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout
    title="Forgot Password"
    subtitle="Enter your email address and we will send you instructions to reset your password."
  >
    {children}
  </AuthLayout>
);

export default ForgotPasswordPage;
