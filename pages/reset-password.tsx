import React, { useState } from "react";
import AuthLayout from "@/components/Layout/AuthLayout";
import { toast } from "@/lib/toast";

function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    console.log("Reset password:", { email, password });
  };

  return (
    <>
      <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
        Enter your email address and your new password below.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="mb-3">
          <label className="form-label">E-Mail Address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* New Password */}
        <div className="mb-3">
          <label className="form-label">New Password</label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label className="form-label">Confirm New Password</label>
          <input
            type="password"
            className="form-control"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Reset Password
          </button>

          <a href="/" className="btn btn-outline-secondary">
            Cancel
          </a>
        </div>
      </form>
    </>
  );
}

ResetPasswordPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout title="Reset Password" imageUrl="https://img.freepik.com/premium-photo/light-indigo-black-abstract-3d-geometric-background-design_851755-368825.jpg">
    {children}
  </AuthLayout>
);

export default ResetPasswordPage;
