import {
  getCanvas7DemoUrl,
  getCanvas7IntroImageUrl,
  getCanvas7ThumbnailUrl,
} from "@/lib/canvasTemplateCatalog";
import type { WebsiteTemplate } from "@/lib/servicesCatalog";

const PACKAGE_ID = "design-ecommerce";

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

/** eCommerce website templates from the Canvas 7 index (eCommerce filter + shop homepages). */
export const ECOMMERCE_PACKAGE_TEMPLATES: WebsiteTemplate[] = [
  nicheTemplate(
    "ecommerce-drone",
    "Drone",
    "demo-drone.html",
    "drone.jpg",
    "Canvas 7 product storefront for drones and tech gear with catalog grids, product pages, and checkout-ready layout."
  ),
  nicheTemplate(
    "ecommerce-skincare",
    "Skincare",
    "demo-skincare.html",
    "skincare.jpg",
    "Canvas 7 beauty and skincare shop with product highlights, collections, and mobile-friendly purchase flows."
  ),
  nicheTemplate(
    "ecommerce-shop-2",
    "Shop 2",
    "demo-shop-2.html",
    "shop-2.jpg",
    "Canvas 7 creative online shop layout with featured products, category browsing, and cart integration."
  ),
  nicheTemplate(
    "ecommerce-speaker",
    "Speaker",
    "demo-speaker.html",
    "speaker.jpg",
    "Canvas 7 clean eCommerce layout for audio products with pricing tables, reviews, and shopping cart support."
  ),
  nicheTemplate(
    "ecommerce-furniture",
    "Furniture",
    "demo-furniture.html",
    "furniture.jpg",
    "Canvas 7 furniture store demo with product listings, room collections, and add-to-cart functionality."
  ),
  nicheTemplate(
    "ecommerce-shop",
    "Shop",
    "demo-shop.html",
    "shop.jpg",
    "Canvas 7 general-purpose online shop with product grids, filters, and a full shopping cart experience."
  ),
  nicheTemplate(
    "ecommerce-store",
    "Store",
    "demo-store.html",
    "store.jpg",
    "Canvas 7 multi-category store layout with listings, promotional blocks, and checkout-ready product pages."
  ),
  nicheTemplate(
    "ecommerce-headphones",
    "Headphones",
    "demo-headphones.html",
    "headphones.jpg",
    "Canvas 7 electronics storefront focused on headphones with product detail pages and cart workflows."
  ),
  nicheTemplate(
    "ecommerce-storefront",
    "eCommerce",
    "demo-ecommerce.html",
    "ecommerce.jpg",
    "Canvas 7 flagship eCommerce demo with shop listings, product singles, and complete cart checkout patterns."
  ),
  introTemplate(
    "ecommerce-home-1",
    "eCommerce 1",
    "index-shop.html",
    "images/intro/multipage/homepage9.jpg",
    "Canvas 7 multi-page shop homepage with category navigation, featured products, and store landing sections."
  ),
  introTemplate(
    "ecommerce-home-2",
    "eCommerce 2",
    "index-shop-2.html",
    "images/intro/multipage/homepage10.jpg",
    "Canvas 7 alternate shop homepage with bold merchandising blocks and product-first layout structure."
  ),
];
