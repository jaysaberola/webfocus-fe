import React from "react";
import ToastHost from "@/components/UI/ToastHost";


interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  imageUrl?: string;
}

export default function AuthLayout({ children, title, imageUrl }: AuthLayoutProps) {
  return (
    <div className="vh-100 d-flex">
      <div
        className="d-none d-md-block"
        style={{
          flex: 1,
          backgroundImage: `url(${imageUrl || ""})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div
        className="d-flex flex-column justify-content-center align-items-center p-4"
        style={{ flex: 1 }}
      >
        <div className="card shadow-sm p-4 w-100" style={{ maxWidth: 420 }}>
          <h3 className="fw-bold mb-3">{title}</h3>
          {children}
        </div>
      </div>
      <ToastHost />
    </div>
  );
}
