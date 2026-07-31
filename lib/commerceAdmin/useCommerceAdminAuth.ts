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

const INITIAL_AUTH_STATE = {
  loading: true,
  user: null as User | null,
  userName: "Admin User",
  roleLabel: "Staff",
};

export function useCommerceAdminAuth() {
  const router = useRouter();
  const [state, setState] = useState(INITIAL_AUTH_STATE);

  useEffect(() => {
    if (!readStoredAuthToken()) {
      setState({ ...INITIAL_AUTH_STATE, loading: false });
      return;
    }

    const storedUser = readStoredCurrentUser();
    if (storedUser && isCommerceStaffUser(storedUser) && userPermissionsLoaded(storedUser)) {
      setState({
        loading: false,
        user: storedUser,
        userName: buildUserName(storedUser),
        roleLabel: getRoleDisplayLabel(storedUser),
      });
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    if (!readStoredAuthToken()) {
      router.replace("/public/home");
      setState((prev) => ({ ...prev, loading: false, user: null }));
      return;
    }

    let alive = true;

    const applyUser = (nextUser: User) => {
      setState({
        loading: false,
        user: nextUser,
        userName: buildUserName(nextUser),
        roleLabel: getRoleDisplayLabel(nextUser),
      });
    };

    const storedUser = readStoredCurrentUser();
    if (storedUser && isCommerceStaffUser(storedUser) && userPermissionsLoaded(storedUser)) {
      applyUser(storedUser);
    }

    getCurrentUserCached({ force: !userPermissionsLoaded(storedUser) })
      .then(async (nextUser) => {
        if (!alive) return;
        if (!isCommerceStaffUser(nextUser)) {
          router.replace("/public/dashboard");
          setState((prev) => ({ ...prev, loading: false }));
          return;
        }

        applyUser(nextUser);

        if (!userPermissionsLoaded(nextUser)) {
          const freshUser = await getCurrentUserCached({ force: true });
          if (!alive) return;
          if (!isCommerceStaffUser(freshUser)) {
            router.replace("/public/dashboard");
            setState((prev) => ({ ...prev, loading: false }));
            return;
          }
          applyUser(freshUser);
        }
      })
      .catch(() => {
        if (!alive) return;
        const cachedUser = readStoredCurrentUser();
        if (!cachedUser || !isCommerceStaffUser(cachedUser)) {
          router.replace("/public/home");
          setState((prev) => ({ ...prev, loading: false, user: null }));
          return;
        }
        if (userPermissionsLoaded(cachedUser)) {
          applyUser(cachedUser);
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      });

    const unsub = subscribeCurrentUserUpdated(() => {
      const cachedUser = readStoredCurrentUser();
      if (!cachedUser || !isCommerceStaffUser(cachedUser)) return;
      if (userPermissionsLoaded(cachedUser)) {
        applyUser(cachedUser);
      }
    });

    return () => {
      alive = false;
      unsub();
    };
  }, [router.isReady, router.asPath]);

  return {
    loading: state.loading,
    user: state.user,
    userName: state.userName,
    roleLabel: state.roleLabel,
  };
}
