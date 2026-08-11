import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import CmsManagedContent from "@/components/Managed/CmsManagedContent";
import { getCurrentUserCached, readStoredCurrentUser } from "@/lib/currentUser";
import { hasAnyPermission } from "@/lib/userPermissions";

const MANAGED_PERMISSIONS = ["commerce_managed.view", "commerce_managed.manage"];

function ManagedPage() {
  const router = useRouter();
  const [access, setAccess] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let alive = true;

    const check = async () => {
      const stored = readStoredCurrentUser();
      if (stored && hasAnyPermission(stored, MANAGED_PERMISSIONS)) {
        if (alive) setAccess("allowed");
        return;
      }

      try {
        const user = await getCurrentUserCached({ force: false });
        if (!alive) return;
        if (hasAnyPermission(user, MANAGED_PERMISSIONS)) {
          setAccess("allowed");
          return;
        }
        setAccess("denied");
        void router.replace("/dashboard");
      } catch {
        if (!alive) return;
        setAccess("denied");
        void router.replace("/");
      }
    };

    void check();
    return () => {
      alive = false;
    };
  }, [router]);

  if (access !== "allowed") {
    return (
      <div className="container-fluid px-4 pt-3 cms-module">
        <p className="text-muted mb-0">Checking Manage Services access...</p>
      </div>
    );
  }

  return <CmsManagedContent />;
}

ManagedPage.Layout = AdminLayout;

export default ManagedPage;
