import LandingPageLayout from "@/components/Layout/GuestLayout";
import CommerceAdminPage from "@/components/CommerceAdmin/CommerceAdminPage";

function PublicCommerceAdminPage() {
  return <CommerceAdminPage />;
}

PublicCommerceAdminPage.Layout = function PublicCommerceAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout
      pageData={{ title: "Commerce Control Center", meta: { title: "Commerce Control Center" } }}
      layout={{ hideBanner: true }}
    >
      {children}
    </LandingPageLayout>
  );
};

export default PublicCommerceAdminPage;
