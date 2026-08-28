import api from "@/lib/axios";

type FileManagerFile = {
  basename?: string;
  path?: string;
};

type FileManagerResponse = {
  files?: FileManagerFile[];
};

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|svg|avif)$/i;

function toStorageUrl(path: string) {
  const encodedPath = path.split("/").map(encodeURIComponent).join("/");
  const base = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  return `${base}/storage/${encodedPath}`;
}

export async function loadCmsMediaIntoAssetManager(editor: any) {
  if (!editor?.AssetManager) return;

  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    const res = await api.get<FileManagerResponse>("/file-manager/content", {
      params: { disk: "public", path: "" },
      headers: token
        ? { Authorization: `Bearer ${token}`, "X-Api-Token": token }
        : undefined,
    });

    const images = (res.data?.files || []).filter((file) => IMAGE_EXT.test(String(file.basename || "")));
    if (!images.length) return;

    editor.AssetManager.add(
      images.map((file) => ({
        src: toStorageUrl(String(file.path || file.basename || "")),
        name: file.basename,
        type: "image",
      })),
    );
  } catch {
    // File manager may be unavailable; upload still works.
  }
}
