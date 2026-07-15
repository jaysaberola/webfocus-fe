import type { NextApiRequest, NextApiResponse } from "next";
import { IncomingForm, type File as FormidableFile, type Fields, type Files } from "formidable";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

function toArray(files: Files[string] | undefined): FormidableFile[] {
  if (!files) return [];
  return Array.isArray(files) ? files : [files];
}

function parseForm(req: NextApiRequest) {
  const form = new IncomingForm({
    multiples: true,
    keepExtensions: true,
    maxFileSize: MAX_FILE_SIZE,
  });

  return new Promise<{ files: Files }>((resolve, reject) => {
    form.parse(req, (err: Error | null, _fields: Fields, parsedFiles: Files) => {
      if (err) return reject(err);
      resolve({ files: parsedFiles });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const { files } = await parseForm(req);
    const uploadFiles = [...toArray(files.files), ...toArray(files.file), ...toArray(files.assets)];

    if (!uploadFiles.length) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uniqueFiles = uploadFiles.filter(
      (file, index, arr) => arr.findIndex((f) => f.filepath === file.filepath) === index
    );

    const uploadDir = path.join(process.cwd(), "public", "uploads", "grapes");
    await fs.mkdir(uploadDir, { recursive: true });

    const urls: string[] = [];

    for (const file of uniqueFiles) {
      const mimeType = file.mimetype || "";
      if (!ALLOWED_MIME.has(mimeType)) continue;

      if (typeof file.size === "number" && file.size > MAX_FILE_SIZE) continue;

      const originalName = file.originalFilename || "asset";
      const ext = path.extname(originalName) || ".bin";
      const filename = `${Date.now()}-${randomUUID()}${ext}`;
      const destination = path.join(uploadDir, filename);

      await fs.copyFile(file.filepath, destination);
      urls.push(`/uploads/grapes/${filename}`);
    }

    if (!urls.length) {
      return res.status(400).json({ message: "No valid image files were uploaded" });
    }

    return res.status(200).json({ urls });
  } catch (error) {
    console.error("Asset upload error:", error);
    return res.status(500).json({ message: "Upload failed" });
  }
}
