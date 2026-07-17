import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  fetchCurrentCustomer,
  getStoredCustomer,
  PublicCustomer,
} from "@/services/publicCustomerService";
import { readStoredAuthToken } from "@/lib/authToken";
import { getCurrentUserCached } from "@/lib/currentUser";
import { isAdminLikeUser } from "@/lib/userRoles";

export function useCustomerPortalAuth() {
  const router = useRouter();
  const [customer, setCustomer] = useState<PublicCustomer | null>(() =>
    typeof window === "undefined" ? null : getStoredCustomer()
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!router.isReady) return;

    const redirectTarget = router.asPath || "/public/dashboard";

    if (!readStoredAuthToken()) {
      router.replace(`/public/login?redirect=${encodeURIComponent(redirectTarget)}`);
      setLoading(false);
      return;
    }

    let alive = true;

    const redirectToLogin = () => {
      router.replace(`/public/login?redirect=${encodeURIComponent(redirectTarget)}`);
    };

    fetchCurrentCustomer({ silent: true, force: true })
      .then((user) => {
        if (alive) setCustomer(user);
      })
      .catch(async () => {
        if (!alive) return;

        try {
          const adminUser = await getCurrentUserCached({ force: true });
          if (isAdminLikeUser(adminUser)) {
            router.replace("/dashboard");
            return;
          }
        } catch {
          // fall through to customer login
        }

        redirectToLogin();
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [router.isReady, router.asPath]);

  return { customer, loading, setCustomer };
}
