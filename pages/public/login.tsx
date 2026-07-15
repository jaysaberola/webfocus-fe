import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { toast } from "@/lib/toast";
import { customerLogin } from "@/services/publicCustomerService";

function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await customerLogin(email, password);
      toast.success("Welcome back");
      router.push(String(router.query.redirect || "/public/account"));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Invalid login details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-wrap">
      <form className="customer-auth-card" onSubmit={submit}>
        <span className="auth-kicker">Customer Account</span>
        <h3>Sign in</h3>
        <label>Email address</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit" disabled={loading}>{loading ? "Signing in..." : "Login"}</button>
        <p>New customer? <Link href="/public/signup">Create an account</Link></p>
      </form>
      <CustomerAuthStyles />
    </div>
  );
}

export function CustomerAuthStyles() {
  return (
    <style jsx global>{`
      .customer-auth-wrap {
        min-height: 520px;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 16px;
      }
      .customer-auth-card {
        width: min(100%, 440px);
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        box-shadow: 0 16px 50px rgba(15, 23, 42, 0.08);
        padding: 32px;
      }
      .auth-kicker {
        color: #00843d;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      .customer-auth-card h3 {
        color: #0f172a;
        font-size: 30px;
        font-weight: 800;
        margin: 8px 0 24px;
      }
      .customer-auth-card label {
        color: #0f172a;
        display: block;
        font-weight: 700;
        margin: 14px 0 7px;
      }
      .customer-auth-card input {
        width: 100%;
        border: 1px solid #94a3b8 !important;
        border-radius: 8px !important;
        background: #fff !important;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
        min-height: 48px;
        padding: 10px 13px;
      }
      .customer-auth-card input:focus {
        border-color: #00843d !important;
        box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.16);
        outline: none;
      }
      .customer-auth-card button {
        width: 100%;
        min-height: 48px;
        border: 0;
        border-radius: 8px;
        background: #00843d;
        color: #fff;
        font-weight: 800;
        margin-top: 22px;
      }
      .customer-auth-card p {
        margin: 18px 0 0;
        text-align: center;
      }
      .customer-auth-card a {
        color: #f97316;
        font-weight: 800;
      }
    `}</style>
  );
}

CustomerLoginPage.Layout = function CustomerLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "Customer Login", meta: { title: "Login" } }}>
      {children}
    </LandingPageLayout>
  );
};
export default CustomerLoginPage;
