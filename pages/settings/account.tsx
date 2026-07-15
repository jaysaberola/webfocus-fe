// pages/dashboard/settings.tsx
import { useState, ChangeEvent, FormEvent } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import { useEffect } from "react";
import { accountService } from "@/services/accountService";
import { toast } from "@/lib/toast";
import { notifyCurrentUserUpdated, storeCurrentUser } from "@/lib/currentUser";

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
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Account Settings</h3>

      <div
        className="card"
        style={{ borderRadius: "4px", borderColor: "#e1e5ee" }}
      >
        {/* Tabs */}
        <div className="card-header bg-white border-0 pb-0">
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "personal" ? "active" : ""
                }`}
                onClick={() => setActiveTab("personal")}
              >
                Personal
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link ${
                  activeTab === "account" ? "active" : ""
                }`}
                onClick={() => setActiveTab("account")}
              >
                Account
              </button>
            </li>
          </ul>
        </div>

        <div className="card-body">
          {activeTab === "personal" && (
            <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
              {/* Avatar + name */}
              <div className="d-flex align-items-center mb-4">
                {/* Avatar */}
                <div
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: "50%",
                    backgroundColor: "#0e0d0cff",
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 16,
                  }}
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        color: "#fff",
                        fontSize: "2rem",
                        fontWeight: 700,
                      }}
                    >
                      {initials.toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Name */}
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "1.1rem",
                    }}
                  >
                    {fullName || "User"}
                  </div>
                  <div style={{ color: "#6c757d" }}>Admin</div>
                </div>
              </div>

              {/* Avatar input */}
              <div className="mb-3">
                <label className="form-label">Avatar</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={avatarFileName}
                    readOnly
                  />
                  <label className="input-group-text" style={{ cursor: "pointer" }}>
                    Browse
                    <input
                      type="file"
                      accept=".jpeg,.jpg,.png"
                      onChange={handleAvatarChange}
                      style={{ display: "none" }}
                    />
                  </label>
                </div>
                <div
                  className="mt-2"
                  style={{ fontSize: "0.8rem", color: "#6c757d" }}
                >
                  <div>Required image dimension: 300px by 300px</div>
                  <div>Maximum file size: 1MB</div>
                  <div>Required file type: .jpeg, .png</div>
                </div>
              </div>

              {/* First name */}
              <div className="mb-3">
                <label className="form-label">
                  First Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              {/* Last name */}
              <div className="mb-4">
                <label className="form-label">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ paddingInline: 24 }}
              >
                SAVE CHANGES
              </button>
            </form>
          )}

          {activeTab === "account" && (
            <form style={{ maxWidth: 600 }}>
              {/* Email */}
              <div className="mb-3">
                <label className="form-label">
                  Email <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Change Email Button */}
              <div className="mb-4">
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ paddingInline: 24 }}
                  onClick={async () => {
                    try {
                      await accountService.updateEmail(email);
                      toast.success("Email updated successfully");
                    } catch (err: any) {
                      toast.error(err.response?.data?.message || "Failed to update email");
                    }
                  }}
                >
                  CHANGE EMAIL
                </button>
              </div>

              {/* Divider */}
              <hr />

              {/* Change Password */}
              <div>
                <button
                  type="button"
                  className="btn btn-outline-primary d-flex align-items-center gap-2 mb-3"
                  onClick={() => setShowPasswordForm((prev) => !prev)}
                >
                  <i className="bi bi-lock"></i>
                  {showPasswordForm ? "Hide Password Fields" : "Change Password"}
                </button>

                {showPasswordForm && (
                  <div className="mt-3">
                    {/* Old Password */}
                    <div className="mb-3">
                      <label className="form-label">
                        Old Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* New Password */}
                    <div className="mb-3">
                      <label className="form-label">
                        New Password{" "}
                        <span className="text-danger">*</span>
                      </label>
                      <div className="form-text mb-1">
                        Min. 8 characters, at least 1 uppercase, 1 number, 1 special character
                      </div>
                      <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-4">
                      <label className="form-label">
                        Confirm Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>

                    {/* Save Password */}
                    <button
                      type="button"
                      className="btn btn-primary"
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

                          // reset + hide
                          setShowPasswordForm(false);
                          setOldPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                        } catch (err: any) {
                          toast.error(err.response?.data?.message || "Failed to update password");
                        }
                      }}

                    >
                      SAVE PASSWORD
                    </button>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

AccountSettingsPage.Layout = AdminLayout;

export default AccountSettingsPage;
