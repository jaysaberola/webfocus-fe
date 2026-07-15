import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { toast } from "@/lib/toast";
import { customerSignup } from "@/services/publicCustomerService";
import { CustomerAuthStyles } from "./login";

function CustomerSignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fname: "", lname: "", email: "", mobile: "", password: "", password_confirmation: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await customerSignup(form);
      toast.success("Account created");
      router.push("/public/account");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="customer-auth-wrap">
      <form className="customer-auth-card" onSubmit={submit}>
        <span className="auth-kicker">Customer Account</span>
        <h3>Create account</h3>
        <label>First name</label>
        <input value={form.fname} onChange={(e) => setForm({ ...form, fname: e.target.value })} required />
        <label>Last name</label>
        <input value={form.lname} onChange={(e) => setForm({ ...form, lname: e.target.value })} required />
        <label>Email address</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <label>Contact number</label>
        <input value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={8} />
        <label>Confirm password</label>
        <input type="password" value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} required minLength={8} />
        <button type="submit" disabled={loading}>{loading ? "Creating..." : "Sign up"}</button>
        <p>Already have an account? <Link href="/public/login">Sign in</Link></p>
      </form>
      <CustomerAuthStyles />
    </div>
  );
}

CustomerSignupPage.Layout = function CustomerSignupLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "Customer Signup", meta: { title: "Sign Up" } }}>
      {children}
    </LandingPageLayout>
  );
};
export default CustomerSignupPage;
