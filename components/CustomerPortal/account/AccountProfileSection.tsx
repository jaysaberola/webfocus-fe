import { useEffect, useMemo, useRef, useState } from "react";
import {
  customerDisplayName,
  PORTAL_ACCOUNT_DEFAULTS,
} from "@/lib/customerPortal/mockData";
import { buildProfileApprovalRequest } from "@/lib/customerPortal/mockAccountData";
import type { PortalProfileApproval } from "@/lib/customerPortal/types";
import { resolveAvatarUrl } from "@/lib/currentUser";
import {
  PublicCustomer,
  uploadCustomerAvatar,
} from "@/services/publicCustomerService";
import { toast } from "@/lib/toast";
import styles from "@/styles/customerPortal.module.css";

type ProfileForm = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
};

type Props = {
  customer: PublicCustomer | null;
  onCustomerUpdate?: (customer: PublicCustomer) => void;
};

export default function AccountProfileSection({ customer, onCustomerUpdate }: Props) {
  const defaults = PORTAL_ACCOUNT_DEFAULTS;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileForm>({
    name: "",
    email: "",
    phone: defaults.phone,
    company: defaults.company,
    address: defaults.address,
  });
  const [baseline, setBaseline] = useState<ProfileForm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<PortalProfileApproval | null>(null);

  useEffect(() => {
    if (!customer) return;
    const nextForm: ProfileForm = {
      name: customerDisplayName(customer.fname, customer.lname),
      email: customer.email || "",
      phone: customer.mobile || defaults.phone,
      company: defaults.company,
      address:
        [customer.address_street, customer.address_city, customer.address_province]
          .filter(Boolean)
          .join(", ") || defaults.address,
    };
    setForm(nextForm);
    setBaseline(nextForm);
  }, [customer]);

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const displayName = form.name || customerDisplayName(customer?.fname, customer?.lname);
  const initials = useMemo(() => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (parts[0]?.[0] || "C").toUpperCase();
  }, [displayName]);

  const avatarUrl = avatarPreview || resolveAvatarUrl(customer?.avatar);

  const hasChanges =
    baseline &&
    (form.name !== baseline.name ||
      form.phone !== baseline.phone ||
      form.company !== baseline.company ||
      form.address !== baseline.address);

  const submitForApproval = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!customer || !hasChanges) return;

    try {
      setSubmitting(true);
      await new Promise((resolve) => setTimeout(resolve, 700));
      const approval = buildProfileApprovalRequest(
        `Update representative, phone, company, and billing address for ${form.email}`
      );
      setPendingApproval(approval);
      toast.success("Profile changes sent for admin approval.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !customer) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Please upload a JPG or PNG image.");
      return;
    }

    if (file.size > 1024 * 1024) {
      toast.error("Profile image must be 1 MB or smaller.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return previewUrl;
    });

    try {
      setUploadingAvatar(true);
      const updated = await uploadCustomerAvatar(file, customer);
      onCustomerUpdate?.(updated);
      toast.success("Profile photo updated.");
    } catch (err: any) {
      setAvatarPreview((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      toast.error(err?.response?.data?.message || "Failed to upload profile photo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <section className={`${styles.panel} ${styles.accountSection}`}>
      <div className={styles.accountSectionHead}>
        <div>
          <h2 className={styles.panelTitle}>Profile Information</h2>
          <p className={styles.panelSub}>
            Updates are reviewed by WebFocus admin before they apply to billing and service records.
          </p>
        </div>
        {pendingApproval && (
          <span className={styles.approvalBadge}>{pendingApproval.status}</span>
        )}
      </div>

      {pendingApproval && (
        <div className={styles.approvalNotice}>
          <strong>Approval request {pendingApproval.reference}</strong>
          <p>
            Submitted {pendingApproval.submittedAt}. {pendingApproval.summary} You will be notified once
            an administrator approves the changes.
          </p>
        </div>
      )}

      <div className={styles.profilePhotoRow}>
        <div className={styles.profilePhotoPreview} aria-hidden="true">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className={styles.profilePhotoMeta}>
          <p className={styles.profilePhotoTitle}>Profile Photo</p>
          <p className={styles.profilePhotoHint}>JPG or PNG, up to 1 MB. Updates immediately.</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className={styles.profilePhotoInput}
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            className={styles.profilePhotoBtn}
            disabled={uploadingAvatar || !customer}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploadingAvatar ? "Uploading..." : avatarUrl ? "Change Photo" : "Upload Photo"}
          </button>
        </div>
      </div>

      <form className={styles.accountForm} onSubmit={submitForApproval}>
        <label>
          <span>Authorized Representative Name</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </label>
        <label>
          <span>Business Email Address</span>
          <input type="email" value={form.email} disabled />
        </label>
        <label>
          <span>Mobile Phone (+63)</span>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </label>
        <label>
          <span>Company Legal Name</span>
          <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
        </label>
        <label className={styles.fullWidth}>
          <span>Billing Headquarters Address</span>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        </label>

        <div className={styles.accountActions}>
          <p className={styles.accountHint}>
            Profile edits require admin approval. Password, security settings, and profile photo update immediately.
          </p>
          <button
            type="submit"
            className={styles.primaryBtnSm}
            disabled={submitting || !hasChanges || Boolean(pendingApproval)}
          >
            {submitting ? "Submitting..." : "Send for Approval"}
          </button>
        </div>
      </form>
    </section>
  );
}
