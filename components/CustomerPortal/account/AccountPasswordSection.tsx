import { useState } from "react";
import { changeCustomerPassword } from "@/services/publicCustomerService";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

export default function AccountPasswordSection() {
  const [form, setForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });
  const [saving, setSaving] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.password !== form.password_confirmation) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    try {
      setSaving(true);
      await changeCustomerPassword(form);
      setForm({ current_password: "", password: "", password_confirmation: "" });
      toast.success("Password updated successfully.");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={`${styles.panel} ${styles.accountSection}`}>
      <div className={styles.accountSectionHead}>
        <div>
          <h2 className={styles.panelTitle}>Change Password</h2>
          <p className={styles.panelSub}>Use at least 8 characters with a mix of letters and numbers.</p>
        </div>
      </div>

      <form className={styles.accountForm} onSubmit={submit}>
        <label className={styles.fullWidth}>
          <span>Current Password</span>
          <input
            className={styles.cpControl}
            type={showPasswords ? "text" : "password"}
            value={form.current_password}
            onChange={(e) => setForm({ ...form, current_password: e.target.value })}
            required
            autoComplete="current-password"
          />
        </label>
        <label>
          <span>New Password</span>
          <input
            className={styles.cpControl}
            type={showPasswords ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <label>
          <span>Confirm New Password</span>
          <input
            className={styles.cpControl}
            type={showPasswords ? "text" : "password"}
            value={form.password_confirmation}
            onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>

        <div className={styles.accountActions}>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={showPasswords}
              onChange={(e) => setShowPasswords(e.target.checked)}
            />
            Show passwords
          </label>
          <button type="submit" className={styles.primaryBtnSm} disabled={saving}>
            {saving ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </section>
  );
}
