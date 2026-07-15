// services/fileManagerService.ts
import { axiosInstance } from "@/services/axios";

export async function fetchFiles(path = "/") {
  const res = await axiosInstance.get("/filemanager", {
    params: { path },
  });

  return res.data;
}
