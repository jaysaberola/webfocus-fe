import type { NextApiRequest, NextApiResponse } from "next";

const getSafeFilename = (value: unknown) => {
  const fallback = "download";
  if (typeof value !== "string") return fallback;

  const name = value.split(/[\\/]/).pop()?.trim() || fallback;
  return name.replace(/[\r\n"]/g, "_");
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const filename = getSafeFilename(Array.isArray(req.query.filename) ? req.query.filename[0] : req.query.filename);

  if (!rawUrl || typeof rawUrl !== "string") {
    res.status(400).json({ message: "Missing file URL" });
    return;
  }

  let fileUrl: URL;
  try {
    fileUrl = new URL(rawUrl);
  } catch {
    res.status(400).json({ message: "Invalid file URL" });
    return;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (apiBase) {
    try {
      const allowed = new URL(apiBase);
      if (fileUrl.origin !== allowed.origin) {
        res.status(400).json({ message: "File URL is not allowed" });
        return;
      }
    } catch {
      // If the configured API URL is malformed, continue with normal fetch error handling.
    }
  }

  const upstream = await fetch(fileUrl.toString());

  if (!upstream.ok || !upstream.body) {
    res.status(upstream.status || 502).json({ message: "Failed to fetch file" });
    return;
  }

  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  const contentLength = upstream.headers.get("content-length");
  if (contentLength) {
    res.setHeader("Content-Length", contentLength);
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.status(200).send(buffer);
}
