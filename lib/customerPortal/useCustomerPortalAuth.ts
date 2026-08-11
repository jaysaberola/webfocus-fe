import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  fetchCurrentCustomer,
  storeCustomer,
  type PublicCustomer,
} from "@/services/publicCustomerService";
import { readStoredAuthToken } from "@/lib/authToken";
import { getCurrentUserCached } from "@/lib/currentUser";
import { isStaffUser, resolveStaffLoginRedirect } from "@/lib/userRoles";
import { useStoredPublicAuthState } from "@/lib/publicAuthState";

export function useCustomerPortalAuth() {
  const router = useRouter();
  const { customer: storedCustomer } = useStoredPublicAuthState();
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storedCustomer) {
      setCustomer(storedCustomer);
    }
  }, [storedCustomer]);

  useEffect(() => {
    if (!router.isReady) return;

    const redirectTarget =
      typeof router.asPath === "string" && router.asPath.startsWith("/")
        ? router.asPath
        : "/public/dashboard";

    if (!readStoredAuthToken()) {
      storeCustomer(null, { notify: false });
      setCustomer(null);
      void router.replace(`/public/login?redirect=${encodeURIComponent(redirectTarget)}`);
      setLoading(false);
      return;
    }

    let alive = true;

    const redirectToLogin = () => {
      void router.replace(`/public/login?redirect=${encodeURIComponent(redirectTarget)}`);
    };

    const redirectStaffAway = async () => {
      try {
        const staffUser = await getCurrentUserCached({ force: false });
        if (isStaffUser(staffUser)) {
          void router.replace(resolveStaffLoginRedirect(staffUser));
          return true;
        }
      } catch {
        // fall through to customer login
      }
      return false;
    };

    setLoading(true);

    fetchCurrentCustomer({ silent: true, force: true })
      .then((user) => {
        if (!alive) return;
        setCustomer(user);
      })
      .catch(async () => {
        if (!alive) return;
        storeCustomer(null, { notify: false });
        setCustomer(null);

        const redirected = await redirectStaffAway();
        if (!alive || redirected) return;
        redirectToLogin();
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
    // Verify once when the portal route is ready — do not re-run on tab query changes.
  }, [router.isReady]);

  const updateCustomer = useCallback((next: PublicCustomer | null) => {
    if (next) storeCustomer(next);
    else storeCustomer(null);
    setCustomer(next);
  }, []);

  return { customer, loading, setCustomer: updateCustomer };
}
