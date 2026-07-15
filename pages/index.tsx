import React, { useState } from "react";
import { useRouter } from "next/router";
import AuthLayout from "@/components/Layout/AuthLayout";
import { login } from "@/services/authService";
import { toast } from "@/lib/toast";

const getLoginErrorMessage = (error: any) => {
  const data = error?.response?.data;
  const firstValidationError = data?.errors
    ? Object.values(data.errors).flat().find(Boolean)
    : null;

  return (
    firstValidationError ||
    data?.message ||
    error?.message ||
    "Login failed, please try again."
  );
};

function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || isSubmitting) return;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      toast.success("Login successfully.");
      router.push("/dashboard");
    } catch (error: any) {
      const message = String(getLoginErrorMessage(error));
      toast.error(message);
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <p className="text-muted mb-4" style={{ fontSize: "0.9rem" }}>
        Welcome to Example Site Admin Portal.
        <br />
        Please sign in to continue.
      </p>

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleLogin}>
        {/* Email */}
        <div className="mb-3">
          <label className="form-label">
            <span className="text-danger">*</span> Email
          </label>
          <input
            type="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
            aria-invalid={Boolean(errorMessage)}
            required
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="form-label">
            <span className="text-danger">*</span> Password
          </label>
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary w-50" disabled={isSubmitting}>
            {isSubmitting && (
              <span
                className="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
              />
            )}
            {isSubmitting ? "Signing in..." : "Log In"}
          </button>

          <a
            href="/forgot-password"
            className={`btn btn-info text-white w-50 ${isSubmitting ? "disabled" : ""}`}
            aria-disabled={isSubmitting}
          >
            Forgot Password
          </a>
        </div>
      </form>

      {/* Footer */}
      <div
        className="text-center text-muted mt-4"
        style={{ fontSize: "0.75rem" }}
      >
        Admin Portal v1.0 · Developed by WebFocus Solutions, Inc. © 2025
      </div>
    </>
  );
}

LoginPage.Layout = ({ children }: { children: React.ReactNode }) => (
  <AuthLayout title="Login" imageUrl="https://img.freepik.com/premium-photo/light-indigo-black-abstract-3d-geometric-background-design_851755-368825.jpg">
    {children}
  </AuthLayout>
);

export default LoginPage;
