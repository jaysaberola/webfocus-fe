import { useState } from "react";
import Link from "next/link";
import CustomerAuthLayout from "@/components/Layout/CustomerAuthLayout";
import CustomerAuthShell, { FloatingField } from "@/components/Auth/CustomerAuthShell";
import styles from "@/styles/customerAuth.module.css";
import { toast } from "@/lib/toast";

function CustomerForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setLoading(false);
    toast.success("If an account exists for that email, password reset instructions have been sent.");
  };

  return (
    <CustomerAuthShell>
      <h1 className={styles.title}>Forgot password</h1>
      <p className={styles.lead}>
        Enter the email address associated with your account and we&apos;ll send reset instructions.
      </p>

      <form onSubmit={submit}>
        <FloatingField
          id="forgot-email"
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          required
          autoComplete="email"
        />
        <button type="submit" className={styles.primaryBtn} disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className={styles.footerLink}>
        Remember your password? <Link href="/public/login">Sign In</Link>
      </p>
    </CustomerAuthShell>
  );
}

CustomerForgotPasswordPage.Layout = function CustomerForgotPasswordLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CustomerAuthLayout title="Forgot Password">{children}</CustomerAuthLayout>;
};

export default CustomerForgotPasswordPage;
