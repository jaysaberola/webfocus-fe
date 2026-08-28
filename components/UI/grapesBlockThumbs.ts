type ThumbKind =
  | "hero"
  | "split"
  | "cards"
  | "quote"
  | "price"
  | "faq"
  | "cta"
  | "nav"
  | "footer"
  | "gallery"
  | "media"
  | "form"
  | "team"
  | "heading"
  | "text"
  | "paragraph"
  | "richtext"
  | "button"
  | "link"
  | "icon"
  | "shape"
  | "logo"
  | "breadcrumb"
  | "columns1"
  | "columns2"
  | "columns3"
  | "columns37"
  | "layout"
  | "spacer"
  | "divider"
  | "image"
  | "video"
  | "map";

type ThumbPreset = { kind: ThumbKind; image?: string; btn?: string };

const THUMB_BY_ID: Record<string, ThumbPreset> = {
  "cms-hero": { kind: "hero", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  "cms-hero-split": { kind: "split", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=640&q=80" },
  "cms-hero-center": { kind: "hero", image: "https://images.unsplash.com/photo-1497215728101-856f4ea83613?w=640&q=80" },
  "cms-about": { kind: "split", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=640&q=80" },
  "cms-features-3": { kind: "cards", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=640&q=80" },
  "cms-features-icon": { kind: "cards", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80" },
  "cms-testimonials": { kind: "quote", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=640&q=80" },
  "cms-pricing": { kind: "price", image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=640&q=80" },
  "cms-faq": { kind: "faq", image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=640&q=80" },
  "cms-gallery-4": { kind: "gallery", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=640&q=80" },
  "cms-image-grid": { kind: "gallery", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  "cms-cta": { kind: "cta", image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=640&q=80" },
  "cms-cta-banner": { kind: "cta", image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=640&q=80" },
  "cms-header": { kind: "nav", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  "cms-nav-menu": { kind: "nav", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80" },
  "cms-header-hero-combo": { kind: "hero", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  "cms-footer": { kind: "footer", image: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=640&q=80" },
  "cms-footer-contact-strip": { kind: "footer", image: "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=640&q=80" },
  "cms-map": { kind: "map", image: "https://images.unsplash.com/photo-1524661132064-b550aa808394?w=640&q=80" },
  "cms-carousel-selection": { kind: "gallery", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  "cms-slicer-slider": { kind: "split", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  "cms-youtube": { kind: "video", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&q=80" },
  "cms-vimeo": { kind: "video", image: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=640&q=80" },
  "cms-portfolio-grid": { kind: "gallery", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80" },
  "cms-tabs-simple": { kind: "faq", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&q=80" },
  "cms-page-starter-consulting": { kind: "split", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&q=80" },
  "cms-page-starter-restaurant": { kind: "hero", image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=640&q=80" },
  "cms-logo-cloud": { kind: "cards", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  "cms-stats-strip": { kind: "cta", image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=640&q=80" },
  "cms-services-grid": { kind: "cards", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80" },
  "cms-team-grid": { kind: "team", image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=640&q=80" },
  "cms-process-timeline": { kind: "cards", image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=640&q=80" },
  "cms-contact-split": { kind: "form", image: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=640&q=80" },
  "cms-newsletter-panel": { kind: "cta", image: "https://images.unsplash.com/photo-1596526131083-e8c633c838d4?w=640&q=80" },
  "cms-blog-cards": { kind: "cards", image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=640&q=80" },
  "cms-product-showcase": { kind: "split", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=640&q=80" },
  "cms-el-heading": { kind: "heading" },
  "cms-el-text": { kind: "text" },
  "cms-el-paragraph": { kind: "paragraph" },
  "cms-el-richtext": { kind: "richtext" },
  "cms-el-button": { kind: "button", btn: "solid" },
  "cms-btn-outline": { kind: "button", btn: "outline" },
  "cms-btn-ghost": { kind: "button", btn: "ghost" },
  "cms-btn-soft": { kind: "button", btn: "soft" },
  "cms-btn-gradient": { kind: "button", btn: "gradient" },
  "cms-btn-dark": { kind: "button", btn: "dark" },
  "cms-btn-light": { kind: "button", btn: "light" },
  "cms-btn-success": { kind: "button", btn: "success" },
  "cms-btn-danger": { kind: "button", btn: "danger" },
  "cms-btn-glass": { kind: "button", btn: "glass" },
  "cms-btn-pill": { kind: "button", btn: "pill" },
  "cms-btn-square": { kind: "button", btn: "square" },
  "cms-btn-small": { kind: "button", btn: "small" },
  "cms-btn-large": { kind: "button", btn: "large" },
  "cms-btn-arrow": { kind: "button", btn: "arrow" },
  "cms-btn-play": { kind: "button", btn: "play" },
  "cms-btn-download": { kind: "button", btn: "download" },
  "cms-btn-pair": { kind: "button", btn: "pair" },
  "cms-el-link": { kind: "link" },
  "cms-el-icon": { kind: "icon" },
  "cms-el-shape": { kind: "shape" },
  "cms-el-logo": { kind: "logo" },
  "cms-el-breadcrumb": { kind: "breadcrumb" },
  "cms-layout-section": { kind: "layout" },
  "cms-layout-container": { kind: "layout" },
  "cms-layout-flex": { kind: "columns2" },
  "cms-layout-grid": { kind: "columns3" },
  "cms-layout-card": { kind: "cards" },
  "cms-spacer": { kind: "spacer" },
  "cms-divider": { kind: "divider" },
  "cms-social-links": { kind: "nav" },
  "cms-quick-links": { kind: "nav" },
  image: { kind: "image", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80" },
  video: { kind: "video", image: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=640&q=80" },
  map: { kind: "map", image: "https://images.unsplash.com/photo-1524661132064-b550aa808394?w=640&q=80" },
  text: { kind: "heading" },
  "text-basic": { kind: "text" },
  "text-sect": { kind: "paragraph" },
  quote: { kind: "quote" },
  link: { kind: "link" },
  "link-block": { kind: "link" },
  button: { kind: "button" },
  form: { kind: "form" },
  input: { kind: "form" },
  textarea: { kind: "form" },
  select: { kind: "form" },
  checkbox: { kind: "form" },
  radio: { kind: "form" },
  label: { kind: "text" },
  column1: { kind: "columns1" },
  column2: { kind: "columns2" },
  column3: { kind: "columns3" },
  "column3-7": { kind: "columns37" },
};

function mockup(preset: ThumbPreset) {
  const kind = preset.kind;
  switch (kind) {
    case "hero":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--center"><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span><span class="cms-block-thumb__line"></span><span class="cms-block-thumb__btn"></span></div>`;
    case "split":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--split"><span class="cms-block-thumb__pane"></span><span class="cms-block-thumb__stack"><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span><span class="cms-block-thumb__line"></span><span class="cms-block-thumb__btn"></span></span></div>`;
    case "cards":
    case "team":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--cards"><span></span><span></span><span></span></div>`;
    case "quote":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--quote"><span class="cms-block-thumb__quote">“”</span><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span><span class="cms-block-thumb__line"></span></div>`;
    case "price":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--cards"><span></span><span class="is-featured"></span><span></span></div>`;
    case "faq":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--list"><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span><span class="cms-block-thumb__line"></span><span class="cms-block-thumb__line"></span></div>`;
    case "form":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--form"><span></span><span></span><span class="cms-block-thumb__btn"></span></div>`;
    case "cta":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--cta"><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span><span class="cms-block-thumb__btn"></span></div>`;
    case "nav":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--nav"><span class="cms-block-thumb__dot"></span><span></span><span></span><span></span></div>`;
    case "footer":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--footer"><span></span><span></span><span></span></div>`;
    case "gallery":
    case "image":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--gallery"><span></span><span></span><span></span><span></span></div>`;
    case "media":
    case "video":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--center"><span class="cms-block-thumb__play"></span></div>`;
    case "map":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--map"><span class="cms-block-thumb__pin"></span></div>`;
    case "heading":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--heading"><span class="cms-block-thumb__letter">Aa</span></div>`;
    case "text":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--text"><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span><span class="cms-block-thumb__line"></span></div>`;
    case "paragraph":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--paragraph"><span></span><span></span><span></span><span></span></div>`;
    case "richtext":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--richtext"><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span><span class="cms-block-thumb__line"></span><span class="cms-block-thumb__bullets"><i></i><i></i></span></div>`;
    case "button": {
      const variant = preset.btn || "solid";
      if (variant === "pair") {
        return `<div class="cms-block-thumb__ui cms-block-thumb__ui--center cms-block-thumb__ui--btn-pair"><span class="cms-block-thumb__btn cms-block-thumb__btn--solid">Btn</span><span class="cms-block-thumb__btn cms-block-thumb__btn--ghost">Btn</span></div>`;
      }
      const labels: Record<string, string> = {
        arrow: "Go →",
        play: "▶ Play",
        download: "↓ Get",
        small: "Sm",
        large: "Large",
      };
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--center"><span class="cms-block-thumb__btn cms-block-thumb__btn--${variant}">${labels[variant] || "Btn"}</span></div>`;
    }
    case "link":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--link"><span class="cms-block-thumb__link">Link</span></div>`;
    case "icon":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--center"><span class="cms-block-thumb__icon">★</span></div>`;
    case "shape":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--center"><span class="cms-block-thumb__shape"></span></div>`;
    case "logo":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--logo"><span class="cms-block-thumb__dot"></span><span class="cms-block-thumb__line cms-block-thumb__line--lg"></span></div>`;
    case "breadcrumb":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--crumb"><span></span><span>/</span><span></span><span>/</span><span class="is-current"></span></div>`;
    case "columns1":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--cols cms-block-thumb__ui--cols-1"><span></span></div>`;
    case "columns2":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--cols cms-block-thumb__ui--cols-2"><span></span><span></span></div>`;
    case "columns3":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--cols cms-block-thumb__ui--cols-3"><span></span><span></span><span></span></div>`;
    case "columns37":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--cols cms-block-thumb__ui--cols-37"><span></span><span></span></div>`;
    case "spacer":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--spacer"><span></span></div>`;
    case "divider":
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--divider"><span></span></div>`;
    default:
      return `<div class="cms-block-thumb__ui cms-block-thumb__ui--layout"><span></span><span></span></div>`;
  }
}

export function resolveBlockThumb(id: string, iconClass?: string) {
  const preset = THUMB_BY_ID[id];
  if (!preset) {
    const icon = String(iconClass || "").trim() || "fa-solid fa-square";
    return `<div class="cms-gjs-block-media"><i class="${icon}"></i></div>`;
  }

  const imageStyle = preset.image ? ` style="background-image:url('${preset.image}')"` : "";
  const overlay = mockup(preset);
  return `<div class="cms-block-thumb cms-block-thumb--${preset.kind}${preset.btn ? ` cms-block-thumb--btn-${preset.btn}` : ""}${preset.image ? " has-image" : ""}"${imageStyle}>${overlay}</div>`;
}
