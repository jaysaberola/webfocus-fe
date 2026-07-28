import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  fetchCurrentCustomer,
  getStoredCustomer,
  type PublicCustomer,
} from "@/services/publicCustomerService";
import { readStoredAuthToken } from "@/lib/authToken";
import { getCurrentUserCached } from "@/lib/currentUser";
import { isAdminLikeUser } from "@/lib/userRoles";
import { scheduleIdleTask } from "@/lib/publicAuthState";

export function useCustomerPortalAuth() {
  const router = useRouter();
  const [customer, setCustomer] = useState<PublicCustomer | null>(() =>
    typeof window === "undefined" ? null : getStoredCustomer()
  );
  const [loading, setLoading] = useState(() => {
    if (typeof window === "undefined") return true;
    if (!readStoredAuthToken()) return false;
    return !getStoredCustomer();
  });

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

    const verifySession = () =>
      fetchCurrentCustomer({ silent: true })
        .then((user) => {
          if (alive) setCustomer(user);
        })
        .catch(async () => {
          if (!alive) return;

          try {
            const adminUser = await getCurrentUserCached();
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

    const cachedCustomer = getStoredCustomer();
    if (cachedCustomer) {
      setCustomer(cachedCustomer);
      setLoading(false);
      const cancelIdle = scheduleIdleTask(() => {
        verifySession();
      }, 1500);

      return () => {
        alive = false;
        cancelIdle();
      };
    }

    verifySession();

    return () => {
      alive = false;
    };
  }, [router.isReady, router.asPath]);

  return { customer, loading, setCustomer };
}
