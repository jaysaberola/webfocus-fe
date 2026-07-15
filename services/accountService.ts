import { axiosInstance } from "@/services/axios";

/* =======================
   Types
======================= */
export interface User {
  id: number;
  fname: string;
  lname: string;
  email: string;
  avatar?: string;
  role?: string;
  user_type?: string;
  is_admin?: boolean | number;
  isAdmin?: boolean | number;
  roles?: Array<string | { name?: string; role?: string }>;
}

/* =======================
   Service
======================= */
export const accountService = {
  /* 🔹 Get current user */
  async getCurrentUser(): Promise<User> {
    const { data } = await axiosInstance.get("/user");
    return data;
  },

  /* 🔹 Update personal profile */
  async updateProfile(payload: {
    fname: string;
    lname: string;
    avatar?: File | null;
  }) {
    const formData = new FormData();
    formData.append("fname", payload.fname);
    formData.append("lname", payload.lname);

    if (payload.avatar) {
      formData.append("avatar", payload.avatar);
    }

    const { data } = await axiosInstance.post("/user/profile", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
  },

  /* 🔹 Update email */
  async updateEmail(email: string) {
    const { data } = await axiosInstance.put("/user/email", { email });
    return data;
  },

  /* 🔹 Update password */
  async updatePassword(payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) {
    const { data } = await axiosInstance.put("/user/password", payload);
    return data;
  },
};
