import { useRouter } from "next/router";
import CustomerAuthLayout from "@/components/Layout/CustomerAuthLayout";
import CustomerAuthShell from "@/components/Auth/CustomerAuthShell";
import CustomerLoginForm from "@/components/Auth/CustomerSignInModal";

function CustomerLoginPage() {
  const router = useRouter();
  const redirect = String(router.query.redirect || "/public/dashboard");
  const intent = String(router.query.intent || "");
  const signupHref = `/public/signup?redirect=${encodeURIComponent(redirect)}${
    intent ? `&intent=${encodeURIComponent(intent)}` : ""
  }`;

  return (
    <CustomerAuthShell>
      {intent === "webdesign" ? (
        <p style={{ marginTop: 0, marginBottom: "1rem", color: "#475569", fontSize: "0.875rem" }}>
          Sign in with your Client account to continue your web design quotation.
          Need an account? Create one first — your cart is already saved.
        </p>
      ) : null}
      <CustomerLoginForm
        signupHref={signupHref}
        onSuccess={() => router.push(redirect)}
      />
    </CustomerAuthShell>
  );
}

CustomerLoginPage.Layout = function CustomerLoginLayout({ children }: { children: React.ReactNode }) {
  return <CustomerAuthLayout title="Sign In">{children}</CustomerAuthLayout>;
};

export default CustomerLoginPage;
