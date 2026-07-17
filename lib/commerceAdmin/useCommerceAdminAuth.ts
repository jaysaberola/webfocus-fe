import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { getCurrentUserCached } from "@/lib/currentUser";
import { readStoredAuthToken } from "@/lib/authToken";
import { isAdminLikeUser } from "@/lib/userRoles";

export function useCommerceAdminAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Admin User");

  useEffect(() => {
    if (!router.isReady) return;

    if (!readStoredAuthToken()) {
      router.replace("/public/home");
      setLoading(false);
      return;
    }

    let alive = true;
    getCurrentUserCached({ force: true })
      .then((user) => {
        if (!alive) return;
        if (!isAdminLikeUser(user)) {
          router.replace("/public/dashboard");
          return;
        }
        setUserName(`${user.fname || ""} ${user.lname || ""}`.trim() || "Admin User");
      })
      .catch(() => {
        if (alive) router.replace("/public/home");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [router.isReady, router.asPath]);

  return { loading, userName };
}
