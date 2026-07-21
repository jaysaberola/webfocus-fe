import {
  getCanvas7DemoUrl,
  getCanvas7ThumbnailUrl,
} from "@/lib/canvasTemplateCatalog";

export type HostingPlanType = "cloud" | "shared" | "dedicated" | "baremetal";

export type HostingPlan = {
  id: string;
  type: HostingPlanType;
  name: string;
  price: number;
  billing: string;
  ram: string;
  ssd: string;
};

export type ServiceAddon = {
  name: string;
  price: number;
  desc?: string;
  label?: string;
};

export type WebDesignPackage = {
  id: string;
  name: string;
  price: number;
  features: string[];
};

export type WebsiteTemplate = {
  id: string;
  image: string;
  alt: string;
  label: string;
  summary: string;
  packageId: string;
  previewUrl: string;
};

export type TemplateGroup = {
  title: string;
  packageId: string;
  templates: WebsiteTemplate[];
};

export const HOSTING_PLANS: HostingPlan[] = [
  { id: "host-cloud-1", type: "cloud", name: "CLOUD MICRO SERVER", price: 4500, billing: "yr", ram: "4 GB Cloud RAM", ssd: "50 GB NVMe SSD" },
  { id: "host-cloud-2", type: "cloud", name: "CLOUD BUSINESS ENTERPRISE", price: 9800, billing: "yr", ram: "8 GB Cloud RAM", ssd: "150 GB NVMe SSD" },
  { id: "host-shared-starter", type: "shared", name: "STARTER SHARED", price: 4080, billing: "yr", ram: "4 GB RAM", ssd: "10 GB SSD Storage" },
  { id: "host-shared-standard", type: "shared", name: "STANDARD SHARED", price: 8520, billing: "yr", ram: "6 GB RAM", ssd: "20 GB SSD Storage" },
  { id: "host-shared-deluxe", type: "shared", name: "DELUXE SHARED", price: 15000, billing: "yr", ram: "10 GB RAM", ssd: "50 GB SSD Storage" },
  { id: "host-shared-business", type: "shared", name: "BUSINESS SHARED", price: 24120, billing: "yr", ram: "16 GB RAM", ssd: "120 GB SSD Storage" },
  { id: "host-ded-essential", type: "dedicated", name: "DEDICATED ESSENTIAL", price: 33600, billing: "yr", ram: "32 GB ECC Dedicated", ssd: "250 GB NVMe" },
  { id: "host-ded-business", type: "dedicated", name: "DEDICATED BUSINESS", price: 64800, billing: "yr", ram: "64 GB ECC Dedicated", ssd: "500 GB NVMe" },
  { id: "host-ded-premium", type: "dedicated", name: "DEDICATED PREMIUM", price: 100680, billing: "yr", ram: "96 GB ECC Dedicated", ssd: "1 TB NVMe" },
  { id: "host-ded-prof", type: "dedicated", name: "DEDICATED PROFESSIONAL", price: 181800, billing: "yr", ram: "128 GB ECC Dedicated", ssd: "2 TB NVMe" },
  { id: "host-ded-corp", type: "dedicated", name: "DEDICATED CORPORATE", price: 280200, billing: "yr", ram: "256 GB ECC Dedicated", ssd: "4 TB Enterprise NVMe" },
  { id: "host-ded-enterprise", type: "dedicated", name: "DEDICATED ENTERPRISE", price: 529200, billing: "yr", ram: "512 GB ECC Dedicated", ssd: "8 TB Enterprise NVMe" },
  { id: "host-bm-linux", type: "baremetal", name: "BAREMETAL LINUX", price: 200520, billing: "yr", ram: "256 GB RAM Linux", ssd: "4 TB Enterprise NVMe" },
  { id: "host-bm-windows", type: "baremetal", name: "BAREMETAL WINDOWS", price: 224160, billing: "yr", ram: "256 GB RAM Windows", ssd: "4 TB Enterprise NVMe" },
];

export const HOSTING_ADDONS: Record<HostingPlanType, ServiceAddon[]> = {
  cloud: [
    { name: "Auto Back Up", price: 900, desc: "Cloud server incremental snapshots" },
    { name: "SSL Certificate", price: 950, desc: "Standard SSL installation" },
    { name: "Sitelock", price: 1200, desc: "Cloud malware scanner" },
    { name: "Dedicated IP", price: 1200, desc: "Static IP allocation" },
  ],
  shared: [
    { name: "Sitelock", price: 1200, desc: "Website security monitoring and malware firewall" },
    { name: "Auto Back Up", price: 800, desc: "Automated nightly web directory backups" },
    { name: "Bandwidth", price: 1000, desc: "Unmetered high-speed burstable bandwidth tier" },
    { name: "MS SQL", price: 3500, desc: "Dedicated MS SQL database instance on shared tier" },
    { name: "Others", price: 1000, desc: "Specialized auxiliary plugin configuration" },
    { name: "SSL", price: 950, desc: "Standard Let's Encrypt / DV SSL Certificate" },
    { name: "Static IP", price: 1200, desc: "Dedicated static IP for your shared container" },
  ],
  dedicated: [
    { name: "Automatic Back Up", price: 1500, desc: "Daily automated cloud snapshots with 30-day retention" },
    { name: "Cpanel", price: 3500, desc: "Enterprise cPanel & WHM full management license" },
    { name: "Firewall", price: 4500, desc: "Advanced DDoS protection & hardware firewall" },
    { name: "IP Address", price: 1200, desc: "Dedicated static IP address allocation" },
    { name: "MS SQL", price: 8000, desc: "Microsoft SQL Server Enterprise license integration" },
    { name: "Others", price: 2000, desc: "Custom enterprise auxiliary module configuration" },
    { name: "Sitelock", price: 2500, desc: "Daily malware scanning & automated patch remediation" },
    { name: "Storage", price: 3000, desc: "Additional 1TB enterprise NVMe storage expansion" },
    { name: "SSL Certificate", price: 1800, desc: "Wildcard OV/EV SSL Certificate with automated renewal" },
  ],
  baremetal: [
    { name: "Automatic Back Up", price: 1500, desc: "Daily automated cloud snapshots with 30-day retention" },
    { name: "Cpanel", price: 3500, desc: "Enterprise cPanel & WHM full management license" },
    { name: "Firewall", price: 4500, desc: "Advanced DDoS protection & hardware firewall" },
    { name: "IP Address", price: 1200, desc: "Dedicated static IP address allocation" },
    { name: "MS SQL", price: 8000, desc: "Microsoft SQL Server Enterprise license integration" },
    { name: "Others", price: 2000, desc: "Custom enterprise auxiliary module configuration" },
    { name: "Sitelock", price: 2500, desc: "Daily malware scanning & automated patch remediation" },
    { name: "SSL Certificate", price: 1800, desc: "Wildcard OV/EV SSL Certificate with automated renewal" },
    { name: "Storage", price: 3000, desc: "Additional 1TB enterprise NVMe storage expansion" },
  ],
};

export const UNIVERSAL_HOSTING_ADDONS: ServiceAddon[] = [
  { name: "Add Ons_WhoIs", price: 780, label: "Add-on" },
  { name: "Add Ons_Static IP", price: 3000, label: "Add-on" },
  { name: "Add Ons_Sitelock", price: 14160, label: "Add-on" },
  { name: "Add Ons_Codeguard", price: 6720, label: "Add-on" },
  { name: "Add Ons_Magic Spam PRO", price: 23400, label: "Add-on" },
  { name: "Add Ons_Imunify360", price: 23400, label: "Add-on" },
  { name: "Secure Socket Layer (Wildcard SSL)", price: 23400, label: "SSL" },
  { name: "Secure Socket Layer (Standard SSL)", price: 10800, label: "SSL" },
  { name: "Shared_Additional 1 GB Storage", price: 3120, label: "Shared Hosting" },
  { name: "Shared_Additional 10 GB Data Cap", price: 3120, label: "Shared Hosting" },
  { name: "Shared_MS SQL Database for Windows", price: 3720, label: "Shared Hosting" },
  { name: "Dedicated_Daily Back-Up (150GB)", price: 27360, label: "Dedicated Hosting" },
  { name: "Bare Metal_Control Panel for Linux (cPanel)", price: 78000, label: "Bare Metal" },
  { name: "Bare Metal_Control Panel for Windows (Parallel Plesk)", price: 78000, label: "Bare Metal" },
  { name: "Bare Metal_Daily Back-Up (1.5TB)", price: 42960, label: "Bare Metal" },
  { name: "Bare Metal_MS SQL 2012/2016 Web Edition", price: 81120, label: "Bare Metal" },
  { name: "Bare Metal_Gigabit LAN", price: 43680, label: "Bare Metal" },
];

export const WEBDESIGN_PACKAGES: WebDesignPackage[] = [
  {
    id: "design-starter",
    name: "Business Starter Launch",
    price: 12500,
    features: [
      "100% Mobile Responsive Layout",
      "Up to 5 custom design sections",
      "Contact feedback system",
      "Basic SEO optimization",
      "7 Days Figma mockup delivery",
    ],
  },
  {
    id: "design-corporate",
    name: "Custom Professional Corporate",
    price: 32000,
    features: [
      "Figma Prototype Custom revisions",
      "Up to 15 modular page elements",
      "Interactive service selectors",
      "CMS database panel integration",
      "SEO setup + 1 Year SLA helpdesk",
    ],
  },
  {
    id: "design-ecommerce",
    name: "High-Concurrency E-Commerce Plus",
    price: 58000,
    features: [
      "GCash / Maya Payment Gateway sync",
      "Shopping cart + stock list management",
      "Client user profile dashboard",
      "Dynamic sales analytics dashboard",
      "Premium 30 Days dedicated support",
    ],
  },
];

export const TEMPLATE_GROUPS: TemplateGroup[] = [
  {
    title: "Business Starter Launch",
    packageId: "design-starter",
    templates: [
      {
        id: "recipe-website",
        image: getCanvas7ThumbnailUrl("recipes.jpg"),
        alt: "Recipe Website",
        label: "Recipe Website",
        summary: "Canvas 7 recipe magazine layout with featured dishes, categories, and editorial sections.",
        packageId: "design-starter",
        previewUrl: getCanvas7DemoUrl("demo-recipes.html"),
      },
      {
        id: "news-blog",
        image: getCanvas7ThumbnailUrl("blog.jpg"),
        alt: "News Blog",
        label: "News Blog",
        summary: "Canvas 7 blog and magazine layout with article grids, featured posts, and sidebar widgets.",
        packageId: "design-starter",
        previewUrl: getCanvas7DemoUrl("demo-blog.html"),
      },
      {
        id: "restaurant",
        image: getCanvas7ThumbnailUrl("burger.jpg"),
        alt: "Restaurant",
        label: "Restaurant",
        summary: "Canvas 7 restaurant layout with menu highlights, food photography, and reservation CTAs.",
        packageId: "design-starter",
        previewUrl: getCanvas7DemoUrl("demo-burger.html"),
      },
    ],
  },
  {
    title: "Custom Professional Corporate",
    packageId: "design-corporate",
    templates: [
      {
        id: "cleaning",
        image: getCanvas7ThumbnailUrl("cleaner.jpg"),
        alt: "Cleaning",
        label: "Cleaning",
        summary: "Canvas 7 cleaning services layout with pricing blocks, service areas, and quote forms.",
        packageId: "design-corporate",
        previewUrl: getCanvas7DemoUrl("demo-cleaner.html"),
      },
      {
        id: "construction",
        image: getCanvas7ThumbnailUrl("construction.jpg"),
        alt: "Construction",
        label: "Construction",
        summary: "Canvas 7 construction company layout with project listings, stats, and capability sections.",
        packageId: "design-corporate",
        previewUrl: getCanvas7DemoUrl("demo-construction.html"),
      },
      {
        id: "coworking",
        image: getCanvas7ThumbnailUrl("coworking.jpg"),
        alt: "Coworking",
        label: "Coworking",
        summary: "Canvas 7 coworking space layout with membership plans, amenities, and booking sections.",
        packageId: "design-corporate",
        previewUrl: getCanvas7DemoUrl("demo-coworking.html"),
      },
    ],
  },
  {
    title: "High-Concurrency E-Commerce Plus",
    packageId: "design-ecommerce",
    templates: [
      {
        id: "hotel",
        image: getCanvas7ThumbnailUrl("hostel.jpg"),
        alt: "Hotel",
        label: "Hotel",
        summary: "Canvas 7 hostel and hotel layout with room showcases, gallery sections, and booking prompts.",
        packageId: "design-ecommerce",
        previewUrl: getCanvas7DemoUrl("demo-hostel.html"),
      },
      {
        id: "hosting",
        image: getCanvas7ThumbnailUrl("hosting.jpg"),
        alt: "Hosting",
        label: "Hosting",
        summary: "Canvas 7 hosting provider layout with pricing tables, feature lists, and domain search.",
        packageId: "design-ecommerce",
        previewUrl: getCanvas7DemoUrl("demo-hosting.html"),
      },
      {
        id: "yoga",
        image: getCanvas7ThumbnailUrl("yoga.jpg"),
        alt: "Yoga",
        label: "Yoga",
        summary: "Canvas 7 yoga and wellness layout with class schedules, instructors, and membership CTAs.",
        packageId: "design-ecommerce",
        previewUrl: getCanvas7DemoUrl("demo-yoga.html"),
      },
    ],
  },
];

export function getWebsiteTemplateById(templateId: string) {
  for (const group of TEMPLATE_GROUPS) {
    const match = group.templates.find((template) => template.id === templateId);
    if (match) return { group, template: match };
  }
  return null;
}

export function getWebDesignPackageById(packageId: string) {
  return WEBDESIGN_PACKAGES.find((pkg) => pkg.id === packageId);
}

export const DOMAIN_REFERENCE = [
  {
    title: "Top Level Domain (TLD)",
    badge: "Global",
    badgeClass: "global",
    description:
      "Traditional generic top-level domains widely recognized globally for commercial, network, and organizational presence.",
    tlds: [".com", ".net", ".org"],
  },
  {
    title: "Hybrid Top Level Domain",
    badge: "Specialized",
    badgeClass: "specialized",
    description:
      "Modern specialized extensions tailored for business niches, information portals, mobile web, professionals, Asian regional entities, and online digital brands.",
    tlds: [".biz", ".info", ".mobi", ".pro", ".asia", ".online"],
  },
  {
    title: "Country Level Domain",
    badge: "Local PH",
    badgeClass: "local",
    description:
      "Philippine country-code top-level domains establishing strong local presence, credibility, and trust within the Philippine market.",
    tlds: [".ph", ".com.ph", ".net.ph", ".org.ph"],
  },
  {
    title: "Education Domain",
    badge: "Academic",
    badgeClass: "academic",
    description:
      "Dedicated domain classification specifically for accredited educational institutions and academic organizations in the Philippines.",
    tlds: [".edu.ph"],
  },
];

export const DMS_MAIL_PLANS = [
  {
    tier: "Standard Tier",
    name: "Standard Document Management System Feature",
    price: 380,
    unit: "/ account / mo",
    description:
      "Equip your team with custom @yourcompany.com.ph business emails combined with 30GB secure Google Drive storage.",
    features: [
      "Gmail Advertising-Free custom app",
      "30 GB Secure Drive Cloud",
      "Google Meet with up to 100 participants",
    ],
  },
  {
    tier: "Optional Tier",
    name: "Optional Document Management System Feature",
    price: 310,
    unit: "/ account / mo",
    description:
      "Secure Outlook business mailboxes, robust Microsoft Teams collaboration, and 1TB cloud storage integration.",
    features: [
      "Professional Exchange Mailboxes",
      "1 TB Web OneDrive Storage",
      "Online Excel, Word, and PowerPoint apps",
    ],
  },
  {
    tier: "Custom Tier",
    name: "Custome Document Management System Feature",
    price: 90,
    unit: "/ account / mo",
    description:
      "Cost-effective professional email boxes for retail startups requiring simple, clean, advertisement-free tools.",
    features: [
      "5 GB Storage per Email mailbox",
      "Rich Webmail & Mobile App usage",
      "Custom quarantine malware guard",
    ],
  },
];

export const DMS_ENTERPRISE_PLANS = [
  {
    name: "Standard Enterprise DMS (Archival Suite)",
    price: 28000,
    unit: "/ yr",
    description: "Up to 25 user accounts, encrypted AES-256 cloud storage, and automated compliance logging.",
    cta: "Deploy DMS License",
    cartName: "WebFocus Document Management System",
    cartDetail: "25 Users",
  },
  {
    name: "Unlimited LGU / Corporate DMS (Archival Suite)",
    price: 65000,
    unit: "/ yr",
    description: "Unlimited user licenses, dedicated database instances, and 24/7 priority Manila NOC support.",
    cta: "Deploy Unlimited DMS",
    cartName: "Unlimited Enterprise DMS",
    cartDetail: "Unlimited Users",
  },
];

export const HOSTING_TYPE_LABELS: Record<HostingPlanType, string> = {
  cloud: "Cloud Hosting",
  shared: "Shared Hosting",
  dedicated: "Dedicated Hosting",
  baremetal: "Bare-Metal Hosting",
};

export function formatPeso(amount: number) {
  return `₱${amount.toLocaleString("en-PH")}`;
}
