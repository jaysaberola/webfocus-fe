type DownloadOptions = {
  scope?: "all" | "current";
  guideId?: string;
};

export async function downloadUserGuidePptx(options: DownloadOptions = {}) {
  const response = await fetch("/api/cms-help/export-pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      scope: options.scope ?? "all",
      guideId: options.guideId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to export user guide presentation");
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="([^"]+)"/);
  const fileName = match?.[1] || "WebFocus-User-Guide.pptx";

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
