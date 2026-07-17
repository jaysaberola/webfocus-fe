import { useEffect } from "react";
import { useRouter } from "next/router";

function AccountRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/public/dashboard");
  }, [router]);

  return null;
}

AccountRedirectPage.Layout = function AccountRedirectLayout({ children }: { children: React.ReactNode }) {
  return children;
};

export default AccountRedirectPage;
