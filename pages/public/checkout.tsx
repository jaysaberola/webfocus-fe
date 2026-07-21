import { useEffect } from "react";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { readPublicCart } from "@/lib/publicCart";

function CheckoutPage() {
  const router = useRouter();

  useEffect(() => {
    readPublicCart();
    router.replace("/public/cart");
  }, [router]);

  return null;
}

CheckoutPage.Layout = function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "Checkout", meta: { title: "Checkout" } }}>
      {children}
    </LandingPageLayout>
  );
};

export default CheckoutPage;
