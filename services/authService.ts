import { axiosInstance } from "./axios";
import { storeAuthToken, clearStoredAuthToken } from "@/lib/authToken";
import { notifyCurrentUserUpdated, storeCurrentUser } from "@/lib/currentUser";
import { storeCustomer } from "@/services/publicCustomerService";

export const login = async (email: string, password: string) => {
  const response = await axiosInstance.post("/login", {
    email,
    password,
  });

  // 🔥 SAVE TOKEN
  if (response.data?.token) {

    localStorage.removeItem("cms4.currentUser.v1");
    localStorage.removeItem("cms4.websiteSettings.v1");
    localStorage.removeItem("cms4.homeBanner.fonts.v1");
    storeCustomer(null, { notify: false });

    storeAuthToken(response.data.token);

    if (response.data?.user) {
      storeCurrentUser(response.data.user);
      notifyCurrentUserUpdated();
    }
  }

  return response.data;
};

export const logout = () => {
  clearStoredAuthToken();
  storeCurrentUser(null);
  storeCustomer(null, { notify: false });
  notifyCurrentUserUpdated();
  if (typeof window !== "undefined") {
    localStorage.removeItem("cms4.websiteSettings.v1");
    localStorage.removeItem("cms4.homeBanner.fonts.v1");
  }
};
