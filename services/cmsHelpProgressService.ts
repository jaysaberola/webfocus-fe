import { axiosInstance } from "@/services/axios";

export type CmsGuideProgressStatus = "not_started" | "in_progress" | "completed";

export type CmsGuideProgress = {
  guideId: string;
  status: CmsGuideProgressStatus;
  stepIndex: number;
  completedAt?: string | null;
};

export async function fetchCmsGuideProgress(): Promise<CmsGuideProgress[]> {
  const res = await axiosInstance.get("/cms-help/progress", {
    headers: { "X-No-Loading": true },
  });
  const rows = Array.isArray(res.data?.data) ? res.data.data : [];
  return rows as CmsGuideProgress[];
}

export async function saveCmsGuideProgress(
  guideId: string,
  payload: { status: CmsGuideProgressStatus; stepIndex: number },
): Promise<CmsGuideProgress | null> {
  const res = await axiosInstance.put(`/cms-help/progress/${encodeURIComponent(guideId)}`, payload, {
    headers: { "X-No-Loading": true },
  });
  return (res.data?.data as CmsGuideProgress) ?? null;
}
