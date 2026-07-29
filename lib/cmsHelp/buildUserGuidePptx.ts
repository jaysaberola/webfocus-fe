import type { CmsHelpGuide } from "@/lib/cmsHelp/types";
import { CMS_HELP_GUIDES } from "@/lib/cmsHelp/guides";
import { resolveStepVisual } from "@/lib/cmsHelp/resolveStepVisual";
import { buildGuideSvgString } from "@/lib/cmsHelp/guideSvgBuilder";
import pptxgen from "pptxgenjs";

export type ExportScope = "all" | "current";

export type BuildUserGuidePptxOptions = {
  scope?: ExportScope;
  guideId?: string;
};

function svgToDataUrl(svg: string) {
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

async function loadImageDataUrl(stepImage?: string) {
  if (!stepImage) return null;
  if (stepImage.startsWith("data:")) return stepImage;

  try {
    const url = stepImage.startsWith("/")
      ? `${process.env.NEXT_PUBLIC_FRONTEND_URL || "http://127.0.0.1:3000"}${stepImage}`
      : stepImage;
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = Buffer.from(await response.arrayBuffer());
    const mime = response.headers.get("content-type") || "image/png";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function buildStepImage(step: CmsHelpGuide["steps"][number]) {
  const photo = await loadImageDataUrl(step.image);
  if (photo) return photo;

  const visual = resolveStepVisual(step);
  const svg = buildGuideSvgString(visual.layout, visual.highlight, step.title);
  return svgToDataUrl(svg);
}

function addTitleSlide(pptx: pptxgen, title: string, subtitle: string) {
  const slide = pptx.addSlide();
  slide.background = { color: "1E1B4B" };
  slide.addText(title, {
    x: 0.6,
    y: 1.4,
    w: 8.8,
    h: 1.2,
    fontSize: 34,
    bold: true,
    color: "FFFFFF",
    fontFace: "Arial",
  });
  slide.addText(subtitle, {
    x: 0.6,
    y: 2.55,
    w: 8.8,
    h: 0.8,
    fontSize: 16,
    color: "C7D2FE",
    fontFace: "Arial",
  });
}

function addGuideIntroSlide(pptx: pptxgen, guide: CmsHelpGuide) {
  const slide = pptx.addSlide();
  slide.addText(guide.group, {
    x: 0.6,
    y: 0.5,
    w: 8.8,
    h: 0.4,
    fontSize: 12,
    bold: true,
    color: "6366F1",
    fontFace: "Arial",
  });
  slide.addText(guide.title, {
    x: 0.6,
    y: 0.95,
    w: 8.8,
    h: 0.8,
    fontSize: 28,
    bold: true,
    color: "0F172A",
    fontFace: "Arial",
  });
  slide.addText(guide.summary, {
    x: 0.6,
    y: 1.85,
    w: 8.8,
    h: 1.2,
    fontSize: 15,
    color: "475569",
    fontFace: "Arial",
  });
  slide.addText(`${guide.steps.length} guided steps`, {
    x: 0.6,
    y: 3.2,
    w: 8.8,
    h: 0.4,
    fontSize: 12,
    color: "64748B",
    fontFace: "Arial",
  });
}

async function addStepSlide(pptx: pptxgen, guide: CmsHelpGuide, stepIndex: number) {
  const step = guide.steps[stepIndex];
  const slide = pptx.addSlide();

  slide.addText(`${guide.title} · Step ${stepIndex + 1}`, {
    x: 0.45,
    y: 0.25,
    w: 9.1,
    h: 0.35,
    fontSize: 11,
    bold: true,
    color: "6366F1",
    fontFace: "Arial",
  });

  slide.addText(step.title, {
    x: 0.45,
    y: 0.62,
    w: 4.5,
    h: 0.7,
    fontSize: 22,
    bold: true,
    color: "0F172A",
    fontFace: "Arial",
  });

  slide.addText(step.body, {
    x: 0.45,
    y: 1.35,
    w: 4.5,
    h: 1.1,
    fontSize: 13,
    color: "334155",
    fontFace: "Arial",
  });

  const bullets = [...(step.details ?? []), ...(step.tip ? [`Tip: ${step.tip}`] : [])];

  if (bullets.length > 0) {
    slide.addText(
      bullets.map((line) => ({ text: line, options: { bullet: true, breakLine: true } })),
      {
        x: 0.55,
        y: 2.55,
        w: 4.35,
        h: 2.2,
        fontSize: 11,
        color: "475569",
        fontFace: "Arial",
      }
    );
  }

  try {
    const imageData = await buildStepImage(step);
    if (imageData) {
      slide.addImage({
        data: imageData,
        x: 5.15,
        y: 0.95,
        w: 4.35,
        h: 3.75,
      });
    }
  } catch {
    slide.addText("Guide illustration unavailable", {
      x: 5.15,
      y: 2.4,
      w: 4.35,
      h: 0.4,
      fontSize: 11,
      color: "94A3B8",
      align: "center",
      fontFace: "Arial",
    });
  }
}

export function getUserGuidePptxFilename(options: BuildUserGuidePptxOptions = {}) {
  const scope = options.scope ?? "all";
  const guides =
    scope === "current" && options.guideId
      ? CMS_HELP_GUIDES.filter((guide) => guide.id === options.guideId)
      : CMS_HELP_GUIDES;

  return scope === "current"
    ? `WebFocus-User-Guide-${guides[0]?.id ?? "topic"}.pptx`
    : "WebFocus-User-Guide-Complete.pptx";
}

export async function buildUserGuidePptxBuffer(options: BuildUserGuidePptxOptions = {}) {
  const scope = options.scope ?? "all";
  const guides =
    scope === "current" && options.guideId
      ? CMS_HELP_GUIDES.filter((guide) => guide.id === options.guideId)
      : CMS_HELP_GUIDES;

  if (guides.length === 0) {
    throw new Error("No guide topics found to export.");
  }

  const pptx = new pptxgen();
  pptx.layout = "LAYOUT_16x9";
  pptx.author = "WebFocus CMS";
  pptx.subject = "CMS User Guide";
  pptx.title = "WebFocus CMS User Guide";

  addTitleSlide(
    pptx,
    "WebFocus CMS User Guide",
    scope === "current"
      ? `Presentation for ${guides[0]?.title ?? "selected topic"}`
      : "Complete admin portal walkthrough with screenshots and step-by-step instructions"
  );

  for (const guide of guides) {
    addGuideIntroSlide(pptx, guide);
    for (let index = 0; index < guide.steps.length; index += 1) {
      await addStepSlide(pptx, guide, index);
    }
  }

  const output = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(output as ArrayBuffer);
}
