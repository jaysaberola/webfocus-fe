import { useRouter } from "next/router";
import CustomerAuthLayout from "@/components/Layout/CustomerAuthLayout";
import CustomerAuthShell from "@/components/Auth/CustomerAuthShell";
import CustomerLoginForm from "@/components/Auth/CustomerSignInModal";

function CustomerLoginPage() {
  const router = useRouter();

  return (
    <CustomerAuthShell>
      <CustomerLoginForm
        onSuccess={() => router.push(String(router.query.redirect || "/public/dashboard"))}
      />
    </CustomerAuthShell>
  );
}

CustomerLoginPage.Layout = function CustomerLoginLayout({ children }: { children: React.ReactNode }) {
  return <CustomerAuthLayout title="Sign In">{children}</CustomerAuthLayout>;
};

export default CustomerLoginPage;
