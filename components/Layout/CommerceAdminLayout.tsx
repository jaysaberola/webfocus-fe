import type { ReactNode } from "react";
import LandingPageLayout from "@/components/Layout/GuestLayout";

type CommerceAdminLayoutProps = {
  children: ReactNode;
};

export default function CommerceAdminLayout({ children }: CommerceAdminLayoutProps) {
  return (
    <LandingPageLayout
      pageData={{ title: "Commerce Control Center", meta: { title: "Commerce Control Center" } }}
      layout={{ hideBanner: true, minimalFooter: true, fullWidth: true }}
    >
      <div className="commerce-admin-shell">{children}</div>
    </LandingPageLayout>
  );
}
