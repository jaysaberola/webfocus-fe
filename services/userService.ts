import { axiosInstance } from "@/services/axios";

export interface CreateUserPayload {
  fname: string;
  lname: string;
  email: string;
  role: string;
}

export const createUser = async (payload: CreateUserPayload) => {
  const response = await axiosInstance.post("/users", payload);
  return response.data;
};

export interface UserRow {
  id: number;
  name: string;
  email: string;
  type?: string;
  role: string;
  created_at?: string;
  date_registered?: string;
  status: string;
}

export const getUsers = async (params: any, options?: { silent?: boolean }) => {
  const res = await axiosInstance.get("/users", {
    params,
    headers: options?.silent ? { "X-No-Loading": true } : undefined,
  });
  return res.data;
};

export const getUser = async (id: number) => {
  const res = await axiosInstance.get(`/users/${id}`);
  return res.data.data;
};

export const updateUser = async (id: number, payload: any) => {
  const res = await axiosInstance.put(`/users/${id}`, payload);
  return res.data;
};

export const toggleUserActive = async (id: number, nextActive?: boolean) => {
  // Fetch the current user so we can send a safe full payload if backend expects it.
  const user = await getUser(id);

  const currentRaw = (user?.status ?? user?.is_active ?? user?.active ?? "").toString().toLowerCase();
  const currentActive =
    currentRaw === "active" || currentRaw === "1" || currentRaw === "true" || user?.is_active === 1 || user?.is_active === true;

  const desiredActive = typeof nextActive === "boolean" ? nextActive : !currentActive;
  const status = desiredActive ? "Active" : "Inactive";

  const payload = {
    ...user,
    status,
    // many backends use numeric flag
    is_active: desiredActive ? 1 : 0,
  };

  const attempts: Array<() => Promise<any>> = [
    // partial update first
    () => axiosInstance.patch(`/users/${id}`, { status, is_active: payload.is_active }),
    // full update
    () => updateUser(id, payload),
    // method-override PUT via POST
    () => axiosInstance.post(`/users/${id}`, { _method: "PUT", ...payload }),
  ];

  let lastError: any;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err: any) {
      lastError = err;
      const code = err?.response?.status;
      if (code === 400 || code === 401 || code === 403 || code === 422) {
        // validation/auth errors: don't keep retrying different methods
        throw err;
      }
    }
  }
  throw lastError;
};
