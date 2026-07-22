import { useEffect, useState } from "react";
import { PORTAL_2FA_METHODS } from "@/lib/customerPortal/mockAccountData";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

const STORAGE_KEY = "cms4.customer2fa.enabled";
const METHOD_KEY = "cms4.customer2fa.method";

export default function AccountTwoFactorSection() {
  const [enabled, setEnabled] = useState(false);
  const [method, setMethod] = useState<(typeof PORTAL_2FA_METHODS)[number]["id"]>("sms");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setEnabled(window.localStorage.getItem(STORAGE_KEY) === "true");
    const storedMethod = window.localStorage.getItem(METHOD_KEY);
    if (storedMethod === "sms" || storedMethod === "email") setMethod(storedMethod);
  }, []);

  const toggle2fa = async () => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 500));

    const next = !enabled;
    setEnabled(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next ? "true" : "false");
      window.localStorage.setItem(METHOD_KEY, method);
    }

    toast.success(next ? "Two-factor authentication enabled." : "Two-factor authentication disabled.");
    setBusy(false);
  };

  return (
    <section className={`${styles.panel} ${styles.accountSection}`}>
      <div className={styles.accountSectionHead}>
        <div>
          <h2 className={styles.panelTitle}>Two-Factor Authentication (2FA)</h2>
          <p className={styles.panelSub}>
            Add an extra verification step when signing in to your client portal account.
          </p>
        </div>
        <span className={enabled ? styles.badgeGreen : styles.badgeAmber}>
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      <div className={styles.securityBlock}>
        <label className={styles.securityField}>
          <span>Verification Method</span>
          <select
            className={styles.cpControl}
            value={method}
            onChange={(e) => setMethod(e.target.value as typeof method)}
            disabled={enabled}
          >
            {PORTAL_2FA_METHODS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <p className={styles.securityNote}>
          {enabled
            ? "A one-time code will be required at sign-in using your selected delivery method."
            : "Enable 2FA to protect account changes, billing actions, and portal sign-in."}
        </p>

        <div className={styles.securityActions}>
          <button
            type="button"
            className={enabled ? styles.secondaryBtnSm : styles.primaryBtnSm}
            onClick={toggle2fa}
            disabled={busy}
          >
            {busy ? "Please wait..." : enabled ? "Disable 2FA" : "Enable 2FA"}
          </button>
        </div>
      </div>
    </section>
  );
}
