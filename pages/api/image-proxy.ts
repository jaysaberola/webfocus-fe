import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    // Images can be larger than the default 4MB limit.
    responseLimit: false,
  },
};

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_API_URL;

function isAllowedUrl(rawUrl: string) {
  if (!ALLOWED_ORIGIN) return false;
  try {
    const url = new URL(rawUrl);
    const allowed = new URL(ALLOWED_ORIGIN);

    // Only proxy the configured API origin (prevents open proxy abuse)
    return url.origin === allowed.origin;
  } catch {
    return false;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl) {
    return res.status(400).json({ message: "Missing url" });
  }

  if (!isAllowedUrl(rawUrl)) {
    return res.status(400).json({ message: "URL not allowed" });
  }

  try {
    const upstream = await fetch(rawUrl, {
      headers: {
        // Forward auth if the upstream requires it
        ...(typeof req.headers.authorization === "string"
          ? { authorization: req.headers.authorization }
          : {}),
      },
    });

    if (!upstream.ok) {
      return res
        .status(upstream.status)
        .json({ message: `Upstream error: ${upstream.status}` });
    }

    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, max-age=300");

    const arrayBuffer = await upstream.arrayBuffer();
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).json({ message: "Proxy failed" });
  }
}
