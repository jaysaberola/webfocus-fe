import React, { useState } from "react";
import AuthLayout from "@/components/Layout/AuthLayout";
import { toast } from "@/lib/toast";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    console.log("Send reset link to:", email);
  };

  return (
    <>
      <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
        Please enter your email address and we'll send you instructions
        on how to reset your password.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div className="mb-4">
          <label className="form-label">E-Mail Address</label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            Send Password Reset Link
          </button>

          <a href="/" className="btn btn-outline-secondary">
            Cancel
          </a>
        </div>
      </form>
    </>
  );
}

ForgotPasswordPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout title="Forgot Password" imageUrl="https://img.freepik.com/premium-photo/light-indigo-black-abstract-3d-geometric-background-design_851755-368825.jpg">
    {children}
  </AuthLayout>
);

export default ForgotPasswordPage;
