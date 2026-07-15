import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { toast } from "@/lib/toast";
import {
  changeCustomerPassword,
  customerLogout,
  fetchCurrentCustomer,
  getStoredCustomer,
  PublicCustomer,
  updateCustomerProfile,
} from "@/services/publicCustomerService";
import { CustomerShell, CustomerStyles } from "./cart";

function AccountPage() {
  const router = useRouter();
  const [form, setForm] = useState<Partial<PublicCustomer>>({});
  const [passwordForm, setPasswordForm] = useState({ current_password: "", password: "", password_confirmation: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const stored = getStoredCustomer();
    if (stored) setForm(stored);
    fetchCurrentCustomer({ silent: true })
      .then(setForm)
      .catch(() => router.push("/public/login?redirect=/public/account"));
  }, []);

  const saveProfile = async () => {
    try {
      setSaving(true);
      const user = await updateCustomerProfile(form);
      setForm(user);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    try {
      await changeCustomerPassword(passwordForm);
      setPasswordForm({ current_password: "", password: "", password_confirmation: "" });
      toast.success("Password changed");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to change password");
    }
  };

  const signOut = () => {
    customerLogout();
    router.push("/public/login");
  };

  return (
    <CustomerShell active="account">
      <div className="customer-panel account-panel">
        <div className="panel-title">Personal Information</div>
        <div className="account-form">
          <div className="full">
            <p className="hi">Hi, {form.fname || "Customer"} {form.lname || ""}</p>
            <button className="link-button" type="button" onClick={signOut}>Sign out</button>
          </div>
          <Field label="First Name *" value={form.fname} onChange={(v) => setForm({ ...form, fname: v })} />
          <Field label="Last Name *" value={form.lname} onChange={(v) => setForm({ ...form, lname: v })} />
          <Field label="Email address" value={form.email} disabled onChange={() => undefined} className="full" />
          <Field label="Birth Date" type="date" value={String(form.birth_date || "").slice(0, 10)} onChange={(v) => setForm({ ...form, birth_date: v })} />
          <Field label="Contact Number *" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
          <Field label="Street Address" value={form.address_street} onChange={(v) => setForm({ ...form, address_street: v })} className="full" />
          <Field label="City" value={form.address_city} onChange={(v) => setForm({ ...form, address_city: v })} />
          <Field label="Municipality" value={form.address_municipality} onChange={(v) => setForm({ ...form, address_municipality: v })} />
          <Field label="Province" value={form.address_province} onChange={(v) => setForm({ ...form, address_province: v })} />
          <Field label="ZIP" value={form.address_zip} onChange={(v) => setForm({ ...form, address_zip: v })} />
          <button className="customer-btn" type="button" onClick={saveProfile} disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        </div>
      </div>

      <div className="customer-panel account-panel" id="password">
        <div className="panel-title">Change Password</div>
        <div className="account-form">
          <Field label="Current Password" type="password" value={passwordForm.current_password} onChange={(v) => setPasswordForm({ ...passwordForm, current_password: v })} />
          <Field label="New Password" type="password" value={passwordForm.password} onChange={(v) => setPasswordForm({ ...passwordForm, password: v })} />
          <Field label="Confirm Password" type="password" value={passwordForm.password_confirmation} onChange={(v) => setPasswordForm({ ...passwordForm, password_confirmation: v })} />
          <button className="customer-btn" type="button" onClick={savePassword}>Update Password</button>
        </div>
      </div>

      <CustomerStyles />
      <style jsx>{`
        .account-panel {
          margin-bottom: 24px;
        }
        .account-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 22px;
          padding: 26px;
        }
        .full {
          grid-column: 1 / -1;
        }
        .hi {
          font-weight: 800;
          margin-bottom: 8px;
        }
        .link-button {
          background: transparent;
          border: 0;
          color: #f97316;
          font-weight: 800;
          padding: 0;
          text-decoration: underline;
        }
        @media (max-width: 720px) {
          .account-form {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </CustomerShell>
  );
}

function Field({ label, value, onChange, type = "text", disabled, className }: {
  label: string;
  value?: string | null;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label className={className}>
      <span>{label}</span>
      <input type={type} value={value ?? ""} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
      <style jsx>{`
        label {
          display: block;
          font-weight: 800;
          color: #0f172a;
        }
        span {
          display: block;
          margin-bottom: 8px;
        }
        input {
          width: 100%;
          min-height: 52px;
          border: 1px solid #94a3b8 !important;
          border-radius: 8px !important;
          background: #fff !important;
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
          padding: 10px 12px;
          font-weight: 700;
        }
        input:focus {
          border-color: #00843d !important;
          box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.16);
          outline: none;
        }
        input:disabled {
          background: #f8fafc !important;
          color: #64748b;
        }
      `}</style>
    </label>
  );
}

AccountPage.Layout = function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "My Account", meta: { title: "My Account" } }}>
      {children}
    </LandingPageLayout>
  );
};
export default AccountPage;
