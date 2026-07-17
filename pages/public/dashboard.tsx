import LandingPageLayout from "@/components/Layout/GuestLayout";
import CustomerPortalPage from "@/components/CustomerPortal/CustomerPortalPage";

function CustomerDashboardPage() {
  return <CustomerPortalPage />;
}

CustomerDashboardPage.Layout = function CustomerDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout
      pageData={{ title: "My Account", meta: { title: "My Account" } }}
      layout={{ hideBanner: true }}
    >
      {children}
    </LandingPageLayout>
  );
};

export default CustomerDashboardPage;
