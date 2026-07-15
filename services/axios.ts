import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { clearStoredAuthToken } from "@/lib/authToken";
import { notifyCurrentUserUpdated, storeCurrentUser } from "@/lib/currentUser";

const API_URL = process.env.NEXT_PUBLIC_API_URL + "/api";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: "application/json",
    "Cache-Control": "no-cache",
  },
});

/**
 * 🔐 Attach Bearer token to every request
 */
axiosInstance.interceptors.request.use((config) => {
  // Global loading overlay disabled: do not call loading.start()

  if (typeof window !== "undefined") {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // Global loading overlay disabled: do not call loading.finish()
    return response;
  },
  (error: AxiosError) => {
      // Global loading overlay disabled: do not call loading.finish()

    if (error.response?.status === 401) {
      // SSR-safe: window/localStorage do not exist on the server
      if (typeof window !== "undefined") {
        const headerVal: any = (error.config as any)?.headers?.["X-No-Auth-Redirect"] ?? (error.config as any)?.headers?.["x-no-auth-redirect"];
        const noRedirect = headerVal === true || headerVal === "true" || headerVal === 1 || headerVal === "1";
        const path = window.location?.pathname || "";
        const isPublicPage = path.startsWith("/public");

        // On public pages, a 401 can happen if an endpoint is protected.
        // Do not force-navigate to login (/) unless we're in the admin area.
        if (!noRedirect && !isPublicPage) {
            clearStoredAuthToken();
            storeCurrentUser(null);
            notifyCurrentUserUpdated();
          window.location.href = "/";
        }
      }
    }

    // Log helpful debug information for 5xx/4xx responses
    try {
      console.error("Axios error:", {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        responseData: error.response?.data,
        headers: error.response?.headers,
        message: error.message,
      });
    } catch (e) {
      console.error("Error logging axios error", e);
    }

    return Promise.reject(error);
  }
);

export { axiosInstance };
