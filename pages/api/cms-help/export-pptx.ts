import type { NextApiRequest, NextApiResponse } from "next";
import {
  buildUserGuidePptxBuffer,
  getUserGuidePptxFilename,
  type BuildUserGuidePptxOptions,
} from "@/lib/cmsHelp/buildUserGuidePptx";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const body = (req.body ?? {}) as BuildUserGuidePptxOptions;
    const scope = body.scope === "current" ? "current" : "all";
    const guideId = typeof body.guideId === "string" ? body.guideId : undefined;
    const buffer = await buildUserGuidePptxBuffer({ scope, guideId });
    const fileName = getUserGuidePptxFilename({ scope, guideId });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.status(200).send(buffer);
  } catch (error) {
    console.error("Failed to export user guide presentation", error);
    return res.status(500).json({ message: "Failed to export user guide presentation" });
  }
}
