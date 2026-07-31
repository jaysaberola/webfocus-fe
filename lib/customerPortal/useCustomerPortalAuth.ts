import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  fetchCurrentCustomer,
  storeCustomer,
  type PublicCustomer,
} from "@/services/publicCustomerService";
import { readStoredAuthToken } from "@/lib/authToken";
import { getCurrentUserCached } from "@/lib/currentUser";
import { isAdminLikeUser } from "@/lib/userRoles";
import { scheduleIdleTask, useStoredPublicAuthState } from "@/lib/publicAuthState";

export function useCustomerPortalAuth() {
  const router = useRouter();
  const { customer: storedCustomer } = useStoredPublicAuthState();
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storedCustomer) {
      setCustomer(storedCustomer);
      setLoading(false);
    }
  }, [storedCustomer]);

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

    if (storedCustomer) {
      const cancelIdle = scheduleIdleTask(verifySession, 1500);
      return () => {
        alive = false;
        cancelIdle();
      };
    }

    verifySession();

    return () => {
      alive = false;
    };
  }, [router.isReady, router.asPath, storedCustomer]);

  const updateCustomer = useCallback((next: PublicCustomer | null) => {
    if (next) storeCustomer(next);
    else storeCustomer(null);
    setCustomer(next);
  }, []);

  return { customer, loading, setCustomer: updateCustomer };
}
