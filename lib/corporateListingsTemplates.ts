import {
  getCanvas7DemoUrl,
  getCanvas7ThumbnailUrl,
} from "@/lib/canvasTemplateCatalog";
import type { WebsiteTemplate } from "@/lib/servicesCatalog";

const PACKAGE_ID = "design-corporate";

function listingTemplate(
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

/** Listings website templates from the Canvas 7 index (Listings filter). */
export const CORPORATE_LISTINGS_TEMPLATES: WebsiteTemplate[] = [
  listingTemplate(
    "listings-real-estate",
    "Real Estate",
    "demo-real-estate.html",
    "real-estate1.jpg",
    "Canvas 7 property listings layout with featured listings, search filters, and agent contact sections."
  ),
  listingTemplate(
    "listings-real-estate-2",
    "Real Estate 2",
    "demo-real-estate-2.html",
    "real-estate2.jpg",
    "Canvas 7 alternate real estate directory with map-ready listing cards and neighborhood highlights."
  ),
  listingTemplate(
    "listings-real-estate-3",
    "Real Estate 3",
    "demo-real-estate-3.html",
    "real-estate3.jpg",
    "Canvas 7 real estate showcase with premium property grids, detail pages, and inquiry forms."
  ),
  listingTemplate(
    "listings-construction",
    "Construction",
    "demo-construction.html",
    "construction.jpg",
    "Canvas 7 construction company layout with project listings, stats, and capability sections."
  ),
  listingTemplate(
    "listings-travel",
    "Travel",
    "demo-travel.html",
    "travel.jpg",
    "Canvas 7 travel listings site with destination catalogs, trip highlights, and booking prompts."
  ),
  listingTemplate(
    "listings-forum",
    "Forums/Community",
    "demo-forum.html",
    "forum.jpg",
    "Canvas 7 community and forum directory layout with categories, member listings, and discussion hubs."
  ),
  listingTemplate(
    "listings-crowdfunding",
    "Crowd-Funding",
    "demo-crowdfunding.html",
    "crowdfunding.jpg",
    "Canvas 7 crowdfunding listings platform with campaign grids, progress indicators, and donation CTAs."
  ),
];
