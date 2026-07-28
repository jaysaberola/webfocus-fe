// pages/dashboard/settings.tsx
import { useState, ChangeEvent, FormEvent } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect } from "react";
import { accountService } from "@/services/accountService";
import { toast } from "@/lib/toast";
import { notifyCurrentUserUpdated, storeCurrentUser } from "@/lib/currentUser";
import CmsModuleShell from "@/components/Modules/CmsModuleShell";
import {
  CmsSettingsField,
  CmsSettingsFileField,
  CmsSettingsFooter,
  CmsSettingsGrid,
  CmsSettingsLayout,
  CmsSettingsProfileCard,
  CmsSettingsSection,
} from "@/components/Modules/CmsSettingsForm";

type TabKey = "personal" | "account";

function AccountSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("personal");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState("Adminz");
  const [lastName, setLastName] = useState("Istratorz");
  const [avatarFileName, setAvatarFileName] = useState("300x300 w.jpg");
  const [email, setEmail] = useState("wsiprod.demo@gmail.com");

  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const fullName = `${firstName} ${lastName}`.trim();
  const initials =
    firstName && lastName
      ? `${firstName[0]}${lastName[0]}`
      : firstName?.[0] || "U";

  const avatarUrl = avatarFile
    ? URL.createObjectURL(avatarFile)
    : avatarFileName && avatarFileName !== "300x300 w.jpg"
    ? `${process.env.NEXT_PUBLIC_API_URL}/storage/${avatarFileName}`
    : undefined;



  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarFileName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await accountService.updateProfile({
        fname: firstName,
        lname: lastName,
        avatar: avatarFile,
      });

      // Refresh the cached current user so other UI (sidebar/topbar) updates immediately.
      try {
        const user = await accountService.getCurrentUser();
        storeCurrentUser(user);
        notifyCurrentUserUpdated();
      } catch {
        // ignore
      }

      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update profile");
    }
  };


  useEffect(() => {
    const loadUser = async () => {
      try {
        const user = await accountService.getCurrentUser();

        setFirstName(user.fname);
        setLastName(user.lname);
        setEmail(user.email);

        if (user.avatar) {
          setAvatarFileName(user.avatar);
        }
      } catch (err) {
        console.error("Failed to load user", err);
      }
    };

    loadUser();
  }, []);


  return (
    <CmsModuleShell
      title="Manage Account Settings"
      description="Update your profile, email address, and password for the admin portal."
      icon="fa-solid fa-user-gear"
      stats={[
        { label: "Name", value: fullName || "—" },
        { label: "Email", value: email || "—", tone: "accent" },
      ]}
      toolbar={(
        <div className="cms-settings-tabs" role="tablist" aria-label="Account settings sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "personal"}
            className={`cms-settings-tabs__btn${activeTab === "personal" ? " is-active" : ""}`}
            onClick={() => setActiveTab("personal")}
          >
            <i className="fa-solid fa-id-card" aria-hidden="true" />
            Personal
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "account"}
            className={`cms-settings-tabs__btn${activeTab === "account" ? " is-active" : ""}`}
            onClick={() => setActiveTab("account")}
          >
            <i className="fa-solid fa-shield-halved" aria-hidden="true" />
            Account
          </button>
        </div>
      )}
    >
      <div className="cms-settings-panel">
        <CmsSettingsLayout>
          {activeTab === "personal" && (
            <form onSubmit={handleSubmit}>
              <CmsSettingsSection
                title="Profile Overview"
                description="Your admin account identity shown in the portal."
                icon="fa-solid fa-user"
              >
                <CmsSettingsProfileCard
                  name={fullName || "User"}
                  role="Admin"
                  avatarUrl={avatarUrl}
                  initials={initials}
                />
              </CmsSettingsSection>

              <CmsSettingsSection
                title="Personal Details"
                description="Update your avatar and display name."
                icon="fa-solid fa-id-card"
              >
                <CmsSettingsGrid columns={2}>
                  <div className="cms-settings-field cms-settings-field--span-2">
                    <CmsSettingsFileField
                      label="Avatar"
                      previewUrl={avatarUrl}
                      fileName={avatarFileName}
                      hint="300×300 px • Max 1MB • JPEG or PNG"
                      accept=".jpeg,.jpg,.png"
                      onChange={handleAvatarChange}
                      previewVariant="avatar"
                    />
                  </div>
                  <CmsSettingsField label="First Name" required>
                    <input
                      type="text"
                      className="form-control"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </CmsSettingsField>
                  <CmsSettingsField label="Last Name" required>
                    <input
                      type="text"
                      className="form-control"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </CmsSettingsField>
                </CmsSettingsGrid>
              </CmsSettingsSection>

              <CmsSettingsFooter>
                <button type="submit" className="btn btn-primary cms-settings-footer__save">
                  <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
                  Save Personal Settings
                </button>
              </CmsSettingsFooter>
            </form>
          )}

          {activeTab === "account" && (
            <>
              <CmsSettingsSection
                title="Email Address"
                description="Change the email used to sign in to the admin portal."
                icon="fa-solid fa-envelope"
              >
                <CmsSettingsGrid columns={1}>
                  <CmsSettingsField label="Email" required>
                    <input
                      type="email"
                      className="form-control"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </CmsSettingsField>
                </CmsSettingsGrid>
              </CmsSettingsSection>

              <CmsSettingsSection
                title="Password"
                description="Update your account password for secure access."
                icon="fa-solid fa-lock"
                defaultOpen={showPasswordForm}
              >
                <button
                  type="button"
                  className="btn btn-outline-primary cms-module__toolbar-btn mb-3"
                  onClick={() => setShowPasswordForm((prev) => !prev)}
                >
                  <i className="fa-solid fa-key me-1" aria-hidden="true" />
                  {showPasswordForm ? "Hide Password Fields" : "Change Password"}
                </button>

                {showPasswordForm && (
                  <CmsSettingsGrid columns={1}>
                    <CmsSettingsField label="Old Password" required>
                      <input
                        type="password"
                        className="form-control"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </CmsSettingsField>
                    <CmsSettingsField
                      label="New Password"
                      required
                      hint="Min. 8 characters, at least 1 uppercase, 1 number, 1 special character"
                    >
                      <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </CmsSettingsField>
                    <CmsSettingsField label="Confirm Password" required>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </CmsSettingsField>
                  </CmsSettingsGrid>
                )}
              </CmsSettingsSection>

              <CmsSettingsFooter>
                <button
                  type="button"
                  className="btn btn-outline-primary cms-module__toolbar-btn"
                  onClick={async () => {
                    try {
                      await accountService.updateEmail(email);
                      toast.success("Email updated successfully");
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || "Failed to update email");
                    }
                  }}
                >
                  <i className="fa-solid fa-envelope me-1" aria-hidden="true" />
                  Change Email
                </button>
                {showPasswordForm ? (
                  <button
                    type="button"
                    className="btn btn-primary cms-settings-footer__save"
                    onClick={async () => {
                      if (newPassword !== confirmPassword) {
                        return toast.error("Passwords do not match");
                      }

                      try {
                        await accountService.updatePassword({
                          current_password: oldPassword,
                          password: newPassword,
                          password_confirmation: confirmPassword,
                        });

                        toast.success("Password updated successfully");

                        setShowPasswordForm(false);
                        setOldPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      } catch (err: any) {
                        toast.error(err.response?.data?.message || "Failed to update password");
                      }
                    }}
                  >
                    <i className="fa-solid fa-key" aria-hidden="true" />
                    Save Password
                  </button>
                ) : null}
              </CmsSettingsFooter>
            </>
          )}
        </CmsSettingsLayout>
      </div>
    </CmsModuleShell>
  );
}

AccountSettingsPage.Layout = AdminLayout;

export default AccountSettingsPage;
