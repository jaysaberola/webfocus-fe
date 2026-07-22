import { useEffect } from "react";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";

function OrdersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/public/dashboard?tab=orders");
  }, [router]);

  return null;
}

OrdersPage.Layout = function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "Order History", meta: { title: "Order History" } }}>
      {children}
    </LandingPageLayout>
  );
};

export default OrdersPage;
