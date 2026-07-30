import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getCurrentUserCached,
  readStoredCurrentUser,
  subscribeCurrentUserUpdated,
  userPermissionsLoaded,
} from "@/lib/currentUser";
import { readStoredAuthToken } from "@/lib/authToken";
import { getRoleDisplayLabel, isCommerceStaffUser } from "@/lib/userRoles";
import type { User } from "@/services/accountService";

function buildUserName(user: { fname?: string | null; lname?: string | null } | null) {
  if (!user) return "Admin User";
  return `${user.fname || ""} ${user.lname || ""}`.trim() || "Admin User";
}

export function useCommerceAdminAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(() => readStoredCurrentUser());
  const [userName, setUserName] = useState("Admin User");
  const [roleLabel, setRoleLabel] = useState("Staff");

  useEffect(() => {
    if (!router.isReady) return;

    if (!readStoredAuthToken()) {
      router.replace("/public/home");
      setLoading(false);
      return;
    }

    let alive = true;

    const applyUser = (nextUser: User) => {
      setUser(nextUser);
      setUserName(buildUserName(nextUser));
      setRoleLabel(getRoleDisplayLabel(nextUser));
    };

    const finishIfReady = (nextUser: User) => {
      applyUser(nextUser);
      if (userPermissionsLoaded(nextUser)) {
        setLoading(false);
      }
    };

    const storedUser = readStoredCurrentUser();
    if (storedUser && isCommerceStaffUser(storedUser) && userPermissionsLoaded(storedUser)) {
      applyUser(storedUser);
      setLoading(false);
    }

    getCurrentUserCached({ force: !userPermissionsLoaded(storedUser) })
      .then(async (nextUser) => {
        if (!alive) return;
        if (!isCommerceStaffUser(nextUser)) {
          router.replace("/public/dashboard");
          return;
        }

        finishIfReady(nextUser);

        if (!userPermissionsLoaded(nextUser)) {
          const freshUser = await getCurrentUserCached({ force: true });
          if (!alive) return;
          if (!isCommerceStaffUser(freshUser)) {
            router.replace("/public/dashboard");
            return;
          }
          finishIfReady(freshUser);
        }
      })
      .catch(() => {
        if (!alive) return;
        const cachedUser = readStoredCurrentUser();
        if (!cachedUser || !isCommerceStaffUser(cachedUser)) {
          router.replace("/public/home");
          return;
        }
        if (userPermissionsLoaded(cachedUser)) {
          applyUser(cachedUser);
          setLoading(false);
        }
      });

    const unsub = subscribeCurrentUserUpdated(() => {
      const cachedUser = readStoredCurrentUser();
      if (!cachedUser || !isCommerceStaffUser(cachedUser)) return;
      finishIfReady(cachedUser);
    });

    return () => {
      alive = false;
      unsub();
    };
  }, [router.isReady, router.asPath]);

  return { loading, user, userName, roleLabel };
}
