import type { NextRouter } from "next/router";
import { prefetchPublicRoute } from "@/lib/prefetchPublicRoute";
import { getCommerceDashboardCached } from "@/lib/commerceAdmin/dashboardCache";

export function prefetchCommerceAdmin(router?: NextRouter) {
  if (router) {
    prefetchPublicRoute(router, "/public/commerce-admin");
  }

  if (typeof window !== "undefined") {
    void getCommerceDashboardCached();
  }
}
