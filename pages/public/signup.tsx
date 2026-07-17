import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import CustomerAuthLayout from "@/components/Layout/CustomerAuthLayout";
import CustomerAuthShell, {
  CustomerTermsNotice,
  FloatingField,
  SignupProviderButtons,
} from "@/components/Auth/CustomerAuthShell";
import styles from "@/styles/customerAuth.module.css";
import { toast } from "@/lib/toast";
import { customerSignup } from "@/services/publicCustomerService";

type SignupStep = "choose" | "email";

function CustomerSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<SignupStep>("choose");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [smsChoice, setSmsChoice] = useState<"agree" | "decline">("decline");
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
    password_confirmation: "",
    mobile: "",
  });

  const onSocialClick = (provider: string) => {
    toast.info(`${provider === "facebook" ? "Facebook" : "Google"} sign up is coming soon.`);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      await customerSignup({
        fname: form.username.trim(),
        lname: "Customer",
        email: form.email.trim(),
        mobile: form.mobile.trim() || undefined,
        password: form.password,
        password_confirmation: form.password_confirmation || form.password,
      });
      toast.success("Account created");
      router.push("/public/dashboard");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.errors?.email?.[0] ||
        "Failed to create account";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerAuthShell>
      <h1 className={styles.title}>Create account</h1>

      {step === "choose" ? (
        <>
          <CustomerTermsNotice variant="signup" />
          <p className={styles.lead}>
            Already have an account? <Link href="/public/login">Sign In</Link>
          </p>
          <SignupProviderButtons onEmail={() => setStep("email")} onSocial={onSocialClick} />
        </>
      ) : (
        <>
          <button type="button" className={styles.backStep} onClick={() => setStep("choose")}>
            ← Back to previous step
          </button>

          <form onSubmit={submit}>
            <FloatingField
              id="signup-email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => setForm({ ...form, email: value })}
              required
              autoComplete="email"
            />
            <FloatingField
              id="signup-username"
              label="Username"
              value={form.username}
              onChange={(value) => setForm({ ...form, username: value })}
              required
              autoComplete="username"
            />
            <FloatingField
              id="signup-password"
              label="Password"
              value={form.password}
              onChange={(value) => setForm({ ...form, password: value, password_confirmation: value })}
              required
              autoComplete="new-password"
              showToggle
              showValue={showPassword}
              onToggleShow={() => setShowPassword((value) => !value)}
            />
            <FloatingField
              id="signup-mobile"
              label="Mobile number"
              type="tel"
              value={form.mobile}
              onChange={(value) => setForm({ ...form, mobile: value })}
              required
              autoComplete="tel"
            />

            <div className={styles.smsBlock}>
              <h2 className={styles.smsTitle}>Sign Up for WebFocus Solutions, Inc. Text Updates</h2>
              <p className={styles.smsText}>
                By providing your mobile number and selecting Agree, you consent to receive recurring
                automated promotional and personalized marketing text messages from WebFocus Solutions,
                Inc. Message and data rates may apply.
              </p>
              <div className={styles.choiceRow}>
                <button
                  type="button"
                  className={`${styles.choiceBtn} ${smsChoice === "agree" ? styles.choiceBtnActive : ""}`}
                  onClick={() => setSmsChoice("agree")}
                >
                  Agree
                  <span className={`${styles.choiceDot} ${smsChoice === "agree" ? styles.choiceDotActive : ""}`} />
                </button>
                <button
                  type="button"
                  className={`${styles.choiceBtn} ${smsChoice === "decline" ? styles.choiceBtnActive : ""}`}
                  onClick={() => setSmsChoice("decline")}
                >
                  Decline
                  <span className={`${styles.choiceDot} ${smsChoice === "decline" ? styles.choiceDotActive : ""}`} />
                </button>
              </div>
              <p className={styles.consentNote}>
                You may withdraw your consent at any time. For information on managing your preferences,
                see our <Link href="/public/privacy-policy">Privacy Policy</Link>.
              </p>
            </div>

            <button type="submit" className={styles.primaryBtn} disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </>
      )}
    </CustomerAuthShell>
  );
}

CustomerSignupPage.Layout = function CustomerSignupLayout({ children }: { children: React.ReactNode }) {
  return <CustomerAuthLayout title="Create Account">{children}</CustomerAuthLayout>;
};

export default CustomerSignupPage;
