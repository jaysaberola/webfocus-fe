import {
  getCanvas7DemoUrl,
  getCanvas7IntroImageUrl,
  getCanvas7ThumbnailUrl,
} from "@/lib/canvasTemplateCatalog";
import type { WebsiteTemplate } from "@/lib/servicesCatalog";

const PACKAGE_ID = "design-starter";

function nicheTemplate(
  id: string,
  label: string,
  demoPage: string,
  thumbnailFile: string,
  summary: string
): WebsiteTemplate {
  return {
    id,
    label,
    alt: label,
    image: getCanvas7ThumbnailUrl(thumbnailFile),
    summary,
    packageId: PACKAGE_ID,
    previewUrl: getCanvas7DemoUrl(demoPage),
  };
}

function introTemplate(
  id: string,
  label: string,
  demoPage: string,
  imagePath: string,
  summary: string
): WebsiteTemplate {
  return {
    id,
    label,
    alt: label,
    image: getCanvas7IntroImageUrl(imagePath),
    summary,
    packageId: PACKAGE_ID,
    previewUrl: getCanvas7DemoUrl(demoPage),
  };
}

/** Portfolio website templates from the Canvas 7 index (Portfolio filter + homepage layouts). */
export const BUSINESS_STARTER_PORTFOLIO_TEMPLATES: WebsiteTemplate[] = [
  nicheTemplate(
    "portfolio-creative",
    "Portfolio",
    "demo-portfolio.html",
    "portfolio.jpg",
    "Canvas 7 creative portfolio demo with project grids, case studies, and client showcase sections."
  ),
  nicheTemplate(
    "portfolio-freelancer",
    "Freelancer",
    "demo-freelancer.html",
    "freelancer.jpg",
    "Canvas 7 freelancer portfolio with skills, project highlights, and a strong personal brand hero."
  ),
  nicheTemplate(
    "portfolio-beauty",
    "Beauty",
    "demo-beauty.html",
    "beauty.jpg",
    "Canvas 7 one-page beauty portfolio with service highlights, testimonials, and booking prompts."
  ),
  nicheTemplate(
    "portfolio-photographer",
    "Photographer",
    "demo-photographer.html",
    "photographer.jpg",
    "Canvas 7 photographer portfolio with full-width imagery, albums, and contact sections."
  ),
  nicheTemplate(
    "portfolio-resume",
    "Resume",
    "demo-resume.html",
    "resume.jpg",
    "Canvas 7 CV and resume portfolio layout with experience timelines and downloadable profile sections."
  ),
  nicheTemplate(
    "portfolio-photography",
    "Photography",
    "demo-photography.html",
    "photography.jpg",
    "Canvas 7 photography studio layout with portfolio masonry, packages, and inquiry forms."
  ),
  nicheTemplate(
    "portfolio-writer",
    "Writer",
    "demo-writer.html",
    "writer.jpg",
    "Canvas 7 writer portfolio with featured articles, publication lists, and author biography blocks."
  ),
  nicheTemplate(
    "portfolio-media-agency",
    "Media Agency",
    "demo-media-agency.html",
    "media-agency.jpg",
    "Canvas 7 media agency portfolio with campaign showcases, team profiles, and service overviews."
  ),
  introTemplate(
    "portfolio-onepage-agency",
    "Portfolio Agency",
    "op-portfolio.html",
    "images/intro/onepage/homepage20.jpg",
    "Canvas 7 one-page portfolio agency layout with scroll sections for work, team, and inquiries."
  ),
  introTemplate(
    "portfolio-onepage-side-header",
    "Portfolio Side Header",
    "op-portfolio-side-header.html",
    "images/intro/onepage/homepage19.jpg",
    "Canvas 7 one-page portfolio with a side header navigation and compact project presentation."
  ),
];
