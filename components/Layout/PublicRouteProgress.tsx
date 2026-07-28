import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "@/styles/publicRouteProgress.module.css";

export default function PublicRouteProgress() {
  const router = useRouter();
  const [active, setActive] = useState(false);

  useEffect(() => {
    const start = () => setActive(true);
    const stop = () => setActive(false);

    router.events.on("routeChangeStart", start);
    router.events.on("routeChangeComplete", stop);
    router.events.on("routeChangeError", stop);

    return () => {
      router.events.off("routeChangeStart", start);
      router.events.off("routeChangeComplete", stop);
      router.events.off("routeChangeError", stop);
    };
  }, [router]);

  return (
    <div
      className={`${styles.bar}${active ? ` ${styles.barActive}` : ""}`}
      aria-hidden="true"
    />
  );
}
