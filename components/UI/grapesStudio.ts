import { resolveBlockThumb } from "./grapesBlockThumbs";
import { CMS_TEMPLATES_CATEGORY } from "./grapesWebsiteTemplates";

export const CMS_STUDIO_BLOCK_COUNT = 30;

export const cmsStudioCanvasCss = `
  @import url("/css/cms-studio-buttons.css");

  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  html {
    height: 100% !important;
    min-height: 100% !important;
    overflow: visible !important;
  }

  html, body {
    margin: 0;
    width: 100% !important;
    min-width: 100%;
    background: #ffffff;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  :where(html, body) {
    color: #0f172a;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
  }

  body {
    line-height: 1.5;
    position: relative;
    height: auto !important;
    min-height: 100% !important;
    overflow: visible !important;
    padding-bottom: 0 !important;
  }

  [data-gjs-type="wrapper"] {
    display: flex !important;
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 0 !important;
    width: 100% !important;
    min-width: 100%;
    min-height: 100% !important;
    height: auto !important;
    overflow: visible !important;
    padding-bottom: 0 !important;
    box-sizing: border-box;
  }

  [data-gjs-type="wrapper"] > * {
    position: relative !important;
    flex: 0 0 auto;
    max-width: 100%;
  }

  body.cms-studio-sorting [data-gjs-type="wrapper"] > *:not(.cms-studio-sort-source):not(.cms-ww-drag-clone) {
    transition: transform 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }

  body.cms-studio-sorting [data-gjs-type="wrapper"] > .cms-studio-sort-source {
    visibility: hidden !important;
    pointer-events: none !important;
  }

  .cms-ww-drag-clone {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99999;
    pointer-events: none;
    margin: 0 !important;
    opacity: 0.97;
    background: #ffffff;
    box-shadow:
      0 28px 70px rgba(15, 23, 42, 0.24),
      0 0 0 1px rgba(148, 163, 184, 0.35);
    outline: 2px solid rgba(99, 102, 241, 0.55);
    outline-offset: 0;
    will-change: transform;
    transition: box-shadow 0.16s ease;
  }

  .gjs-placeholder,
  .gjs-placeholder.horizontal,
  .gjs-placeholder.vertical {
    min-height: 4px !important;
    height: 4px !important;
    margin: 0 !important;
    padding: 0 !important;
    border: none !important;
    border-radius: 999px !important;
    background: linear-gradient(90deg, #6366f1, #818cf8) !important;
    box-shadow:
      0 0 0 3px rgba(99, 102, 241, 0.18),
      0 4px 14px rgba(99, 102, 241, 0.35) !important;
    opacity: 1 !important;
    animation: cms-ww-insert-pulse 0.7s ease-in-out infinite alternate;
  }

  .gjs-placeholder-int {
    min-height: 2px !important;
    height: 2px !important;
    width: 100% !important;
    background: transparent !important;
    border: 0 !important;
  }

  @keyframes cms-ww-insert-pulse {
    from {
      opacity: 0.75;
      transform: scaleY(1);
    }
    to {
      opacity: 1;
      transform: scaleY(1.35);
    }
  }

  img, video, iframe {
    max-width: 100%;
  }

  /* Page blocks stack in document flow; nested widgets set their own layout. */

  :where(h1, h2, h3, h4, h5, h6) {
    margin: 0 0 0.5em;
    line-height: 1.2;
    color: inherit;
  }

  :where(h1) { font-size: 2.5rem; }
  :where(h2) { font-size: 2rem; }
  :where(h3) { font-size: 1.5rem; }
  :where(h4) { font-size: 1.25rem; }

  /* Canvas 7 canvas styles set heading colors globally; photo heroes must stay readable. */
  .cms-hero :where(h1, h2, h3, h4, h5, h6),
  .cms-hero-on-dark :where(h1, h2, h3, h4, h5, h6) {
    color: #ffffff !important;
  }

  .cms-hero :where(p, li, span, strong, em),
  .cms-hero-on-dark :where(p, li, span, strong, em) {
    color: inherit;
  }

  :where(p) {
    margin: 0 0 1em;
    color: inherit;
    line-height: 1.7;
  }

  :where(a) {
    color: #2563eb;
    text-decoration: none;
  }

  :where(a):hover {
    text-decoration: underline;
    filter: brightness(1.05);
  }

  [data-anim="fade"] { animation: cms-fade-in .7s ease both; }
  [data-anim="slide"] { animation: cms-slide-up .7s ease both; }
  [data-anim="slide-left"] { animation: cms-slide-left .7s ease both; }
  [data-anim="zoom"] { animation: cms-zoom-in .55s ease both; }
  [data-anim="scale"] { animation: cms-scale-in .55s ease both; }
  [data-anim="bounce"] { animation: cms-bounce-in .7s cubic-bezier(0.22, 1, 0.36, 1) both; }

  @keyframes cms-fade-in { from { opacity: 0; } to { opacity: 1; } }
  @keyframes cms-slide-up { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
  @keyframes cms-slide-left { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
  @keyframes cms-zoom-in { from { opacity: 0; transform: scale(.96); } to { opacity: 1; transform: none; } }
  @keyframes cms-scale-in { from { transform: scale(.9); } to { transform: none; } }
  @keyframes cms-bounce-in {
    from { opacity: 0; transform: translateY(18px) scale(.96); }
    60% { opacity: 1; transform: translateY(-6px) scale(1.02); }
    to { opacity: 1; transform: none; }
  }

  @media (prefers-reduced-motion: reduce) {
    [data-anim] { animation: none !important; }
  }

  blockquote {
    margin: 0;
    padding: 20px;
    border-radius: 12px;
    background: #f8fafc;
    border-left: 4px solid #2563eb;
    color: #334155;
  }

  input, textarea, select, button {
    font: inherit;
  }

  input[type="text"],
  input[type="email"],
  input[type="tel"],
  input[type="url"],
  input[type="password"],
  input[type="number"],
  textarea,
  select {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid #cbd5e1;
    border-radius: 10px;
    background: #fff;
    color: #0f172a;
  }

  button:not(.wsi-portfolio-zoom):not(.wsi-slider-btn):not(.wsi-portfolio-modal-prev):not(.wsi-portfolio-modal-next):not(.wsi-portfolio-modal-close),
  input[type="submit"],
  input[type="button"] {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: auto;
    min-height: 44px;
    padding: 12px 22px;
    border: 0;
    border-radius: 12px;
    background: #4f46e5;
    color: #fff;
    font-weight: 700;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
  }

  .wsi-portfolio-zoom {
    position: relative !important;
    display: block !important;
    width: 100% !important;
    min-height: 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    background: #f1f5f9 !important;
    color: transparent !important;
    font-size: 0 !important;
    font-weight: 400 !important;
    line-height: 0 !important;
    white-space: normal !important;
    box-shadow: none !important;
    overflow: hidden !important;
    cursor: zoom-in !important;
    aspect-ratio: 16 / 10;
  }

  .wsi-portfolio-zoom img {
    display: block !important;
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
    object-fit: cover !important;
    object-position: top center !important;
  }

  form {
    display: grid;
    gap: 14px;
  }

  label {
    display: block;
    font-weight: 600;
    color: #334155;
    margin-bottom: 6px;
  }

  hr {
    margin: 24px 0;
    border: none;
    border-top: 1px solid #e2e8f0;
  }
`;

const CMS_BLOCK_ICON_MAP: Record<string, string> = {
  "fa fa-flag": "fa-solid fa-flag",
  "fa fa-info-circle": "fa-solid fa-circle-info",
  "fa fa-th-large": "fa-solid fa-table-cells-large",
  "fa fa-commenting": "fa-solid fa-comments",
  "fa fa-tags": "fa-solid fa-tags",
  "fa fa-question-circle": "fa-solid fa-circle-question",
  "fa fa-image": "fa-regular fa-image",
  "fa fa-bullhorn": "fa-solid fa-bullhorn",
  "fa fa-header": "fa-solid fa-heading",
  "fa fa-window-minimize": "fa-regular fa-window-minimize",
  "fa fa-object-group": "fa-regular fa-object-group",
  "fa fa-address-card": "fa-regular fa-address-card",
  "fa fa-map-marker": "fa-solid fa-location-dot",
  "fa fa-sliders": "fa-solid fa-sliders",
  "fa fa-columns": "fa-solid fa-table-columns",
  "fa fa-arrows-v": "fa-solid fa-up-down",
  "fa fa-minus": "fa-solid fa-minus",
  "fa fa-share-alt": "fa-solid fa-share-nodes",
  "fa fa-link": "fa-solid fa-link",
  "fa fa-briefcase": "fa-solid fa-briefcase",
  "fa fa-cutlery": "fa-solid fa-utensils",
  "fa fa-building-o": "fa-regular fa-building",
  "fa fa-bar-chart": "fa-solid fa-chart-column",
  "fa fa-th-list": "fa-solid fa-table-list",
  "fa fa-users": "fa-solid fa-users",
  "fa fa-road": "fa-solid fa-road",
  "fa fa-envelope-o": "fa-regular fa-envelope",
  "fa fa-paper-plane-o": "fa-regular fa-paper-plane",
  "fa fa-newspaper-o": "fa-regular fa-newspaper",
  "fa fa-shopping-bag": "fa-solid fa-bag-shopping",
};

export const resolveCmsBlockMedia = (iconClass?: string) => {
  const resolved = CMS_BLOCK_ICON_MAP[String(iconClass || "").trim()] || String(iconClass || "").trim() || "fa-solid fa-square";
  return `<div class="cms-gjs-block-media"><i class="${resolved}"></i></div>`;
};

export const CMS_PRESETS_CATEGORY = "Presets";
export const CMS_SECTIONS_CATEGORY = "Sections";
export const CMS_ELEMENTS_CATEGORY = "Elements";
export const CMS_BUTTONS_CATEGORY = "Buttons";
export const CMS_LAYOUT_CATEGORY = "Layout";

/** Must match grapesjs-plugin-forms category id (`forms`), not `"Forms"`. */
export const FORMS_BLOCKS_CATEGORY = { id: "forms", label: "Forms" };

const LEGACY_PRESET_CATEGORIES = new Set([
  "CMS Page Starters",
  "CMS Business",
  "CMS Social Proof",
  "CMS Forms",
  "CMS Commerce",
]);

export const normalizeStudioCategory = (category?: string) => {
  const label = String(category || "").trim();
  if (label === "CMS Sections") return CMS_SECTIONS_CATEGORY;
  return LEGACY_PRESET_CATEGORIES.has(label) ? CMS_PRESETS_CATEGORY : label;
};

const addBlock = (editor: any, id: string, config: any) => {
  const bm = editor.BlockManager;
  if (bm.get(id)) return;
  const nextAttributes = { ...(config?.attributes || {}) };
  const iconClass = nextAttributes.class;
  const rawCategory = config?.category;
  const normalizedCategory =
    typeof rawCategory === "string" ? normalizeStudioCategory(rawCategory) : rawCategory;
  delete nextAttributes.class;

  bm.add(id, {
    ...config,
    category: normalizedCategory ?? rawCategory,
    attributes: Object.keys(nextAttributes).length ? nextAttributes : undefined,
    media: config?.media || resolveBlockThumb(id, iconClass),
  });
};

export const configureStudioCategories = (editor: any) => {
  const categories = editor.BlockManager?.getCategories?.();
  if (!categories) return;

  const order = [
    CMS_TEMPLATES_CATEGORY,
    CMS_ELEMENTS_CATEGORY,
    CMS_BUTTONS_CATEGORY,
    CMS_LAYOUT_CATEGORY,
    CMS_SECTIONS_CATEGORY,
    CMS_PRESETS_CATEGORY,
    "CMS Media",
    "CMS Utility",
    "Basic",
    "Forms",
  ];

  const rank = (label: string) => {
    const index = order.indexOf(label);
    return index === -1 ? order.length + 20 : index;
  };

  const apply = (category: any) => {
    const rawId = String(category?.get?.("id") || "");
    const rawLabel = String(category?.get?.("label") || "");
    const isForms =
      rawId.toLowerCase() === FORMS_BLOCKS_CATEGORY.id || rawLabel.toLowerCase() === FORMS_BLOCKS_CATEGORY.id;
    if (isForms) {
      category?.set?.("id", FORMS_BLOCKS_CATEGORY.id);
      category?.set?.("label", FORMS_BLOCKS_CATEGORY.label);
    }
    const label = isForms
      ? FORMS_BLOCKS_CATEGORY.label
      : normalizeStudioCategory(rawId || rawLabel);
    category?.set?.("open", false);
    if (label === CMS_TEMPLATES_CATEGORY || label === CMS_PRESETS_CATEGORY || label === CMS_SECTIONS_CATEGORY || label === CMS_ELEMENTS_CATEGORY || label === CMS_BUTTONS_CATEGORY || label === CMS_LAYOUT_CATEGORY) {
      category?.set?.("id", label);
      category?.set?.("label", label);
    }
    category?.set?.("order", rank(label));
  };

  if (typeof categories.each === "function") {
    categories.each(apply);
    return;
  }

  if (typeof categories.forEach === "function") {
    categories.forEach(apply);
  }
};

export const registerAdvancedCmsBlocks = (editor: any) => {
  addBlock(editor, "cms-page-starter-consulting", {
    label: "Consulting Page",
    category: "CMS Page Starters",
    attributes: { class: "fa fa-briefcase" },
    content: `
      <main style="background:linear-gradient(180deg,#f8fbff 0%,#ffffff 100%);color:#0f172a;">
        <section style="padding:80px 24px 56px;">
          <div style="max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.1fr .9fr;gap:28px;align-items:center;">
            <div>
              <span style="display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Business advisory</span>
              <h1 style="font-size:54px;line-height:1.05;margin:18px 0 14px;max-width:10ch;">Turn strategy into measurable growth.</h1>
              <p style="font-size:18px;line-height:1.7;color:#475569;max-width:60ch;margin:0 0 26px;">Use this starter to present your services, show social proof, and guide visitors into discovery calls or proposal requests.</p>
              <div style="display:flex;flex-wrap:wrap;gap:12px;">
                <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;background:#0f172a;color:#fff;text-decoration:none;font-weight:700;">Book a Strategy Call</a>
                <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;border:1px solid #cbd5e1;color:#0f172a;text-decoration:none;font-weight:600;">View Services</a>
              </div>
              <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:34px;">
                <div style="padding:16px 18px;border-radius:18px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 18px 36px rgba(15,23,42,.06);"><div style="font-size:28px;font-weight:800;">120+</div><div style="font-size:13px;color:#64748b;">Projects delivered</div></div>
                <div style="padding:16px 18px;border-radius:18px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 18px 36px rgba(15,23,42,.06);"><div style="font-size:28px;font-weight:800;">42%</div><div style="font-size:13px;color:#64748b;">Average growth lift</div></div>
                <div style="padding:16px 18px;border-radius:18px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 18px 36px rgba(15,23,42,.06);"><div style="font-size:28px;font-weight:800;">4.9/5</div><div style="font-size:13px;color:#64748b;">Client satisfaction</div></div>
              </div>
            </div>
            <div style="padding:24px;border-radius:28px;background:linear-gradient(145deg,#0f172a,#1e293b);color:#fff;box-shadow:0 30px 70px rgba(15,23,42,.22);">
              <div style="padding:18px;border-radius:22px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:18px;">
                  <div>
                    <div style="font-size:13px;color:#93c5fd;letter-spacing:.08em;text-transform:uppercase;">Quarterly performance</div>
                    <div style="font-size:26px;font-weight:800;margin-top:4px;">Revenue dashboard</div>
                  </div>
                  <div style="padding:10px 12px;border-radius:14px;background:#22c55e;color:#052e16;font-weight:800;">+18.4%</div>
                </div>
                <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
                  <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.06);"><div style="font-size:12px;color:#cbd5e1;">Leads</div><div style="font-size:28px;font-weight:800;margin-top:4px;">1,284</div></div>
                  <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.06);"><div style="font-size:12px;color:#cbd5e1;">Meetings</div><div style="font-size:28px;font-weight:800;margin-top:4px;">216</div></div>
                  <div style="padding:16px;border-radius:18px;background:rgba(255,255,255,.06);"><div style="font-size:12px;color:#cbd5e1;">Wins</div><div style="font-size:28px;font-weight:800;margin-top:4px;">59</div></div>
                </div>
                <div style="margin-top:16px;padding:18px;border-radius:18px;background:#fff;color:#0f172a;">
                  <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;">Executive note</div>
                  <p style="margin:8px 0 0;line-height:1.7;color:#334155;">Pair this starter with service cards, team bios, testimonials, and a contact form to create a polished consulting or agency home page.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    `,
  });

  addBlock(editor, "cms-page-starter-restaurant", {
    label: "Restaurant Page",
    category: "CMS Page Starters",
    attributes: { class: "fa fa-cutlery" },
    content: `
      <main style="background:#fffdf8;color:#1f2937;">
        <section style="padding:82px 24px 56px;background:radial-gradient(circle at top left,#fde68a 0%,#fff7ed 42%,#fffdf8 100%);">
          <div style="max-width:1180px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:28px;align-items:center;">
            <div>
              <span style="display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:#fff;color:#b45309;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border:1px solid #fed7aa;">Chef-crafted dining</span>
              <h1 style="font-size:56px;line-height:1.02;margin:18px 0 14px;max-width:11ch;">A dining experience worth returning for.</h1>
              <p style="font-size:18px;line-height:1.7;color:#57534e;max-width:58ch;margin:0 0 26px;">Show your signature dishes, feature your atmosphere, and direct guests to reservations, location details, and special event offerings.</p>
              <div style="display:flex;flex-wrap:wrap;gap:12px;">
                <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;background:#111827;color:#fff;text-decoration:none;font-weight:700;">Reserve a Table</a>
                <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;border:1px solid #d6d3d1;color:#1f2937;text-decoration:none;font-weight:600;">View the Menu</a>
              </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
              <div style="padding:20px;border-radius:24px;background:#111827;color:#fff;min-height:200px;display:flex;flex-direction:column;justify-content:flex-end;box-shadow:0 24px 50px rgba(17,24,39,.2);">
                <div style="font-size:13px;color:#fcd34d;letter-spacing:.08em;text-transform:uppercase;">Signature</div>
                <div style="font-size:28px;font-weight:800;margin-top:8px;">Wood-fired tasting menu</div>
              </div>
              <div style="padding:20px;border-radius:24px;background:#fff;border:1px solid #fed7aa;min-height:200px;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 18px 36px rgba(245,158,11,.12);">
                <div style="font-size:13px;color:#b45309;letter-spacing:.08em;text-transform:uppercase;">Hours</div>
                <div style="font-size:18px;line-height:1.7;font-weight:700;color:#1f2937;">Mon-Sat<br/>11:00 AM - 10:00 PM</div>
              </div>
              <div style="grid-column:1 / -1;padding:20px;border-radius:24px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 18px 36px rgba(15,23,42,.06);">
                <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;">
                  <div><div style="font-size:26px;font-weight:800;color:#111827;">4.9</div><div style="font-size:13px;color:#6b7280;">Guest rating</div></div>
                  <div><div style="font-size:26px;font-weight:800;color:#111827;">12</div><div style="font-size:13px;color:#6b7280;">Seasonal plates</div></div>
                  <div><div style="font-size:26px;font-weight:800;color:#111827;">3</div><div style="font-size:13px;color:#6b7280;">Private rooms</div></div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    `,
  });

  addBlock(editor, "cms-logo-cloud", {
    label: "Logo Cloud",
    category: "CMS Social Proof",
    attributes: { class: "fa fa-building-o" },
    content: `
      <section style="padding:42px 24px;background:#ffffff;">
        <div style="max-width:1100px;margin:0 auto;">
          <p style="margin:0 0 18px;text-align:center;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;font-weight:700;">Trusted by modern teams</p>
          <div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;align-items:center;">
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;font-weight:800;color:#334155;background:#f8fafc;">Northwind</div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;font-weight:800;color:#334155;background:#f8fafc;">Halo Labs</div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;font-weight:800;color:#334155;background:#f8fafc;">Brightline</div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;font-weight:800;color:#334155;background:#f8fafc;">Vertex</div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:16px;text-align:center;font-weight:800;color:#334155;background:#f8fafc;">Altair</div>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-stats-strip", {
    label: "Stats Strip",
    category: "CMS Social Proof",
    attributes: { class: "fa fa-bar-chart" },
    content: `
      <section style="padding:22px 24px;background:#0f172a;color:#fff;">
        <div style="max-width:1140px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
          <div style="padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);"><div style="font-size:34px;font-weight:800;">15K</div><div style="font-size:13px;color:#cbd5e1;">Monthly visitors</div></div>
          <div style="padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);"><div style="font-size:34px;font-weight:800;">94%</div><div style="font-size:13px;color:#cbd5e1;">Client retention</div></div>
          <div style="padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);"><div style="font-size:34px;font-weight:800;">28</div><div style="font-size:13px;color:#cbd5e1;">Specialist staff</div></div>
          <div style="padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);"><div style="font-size:34px;font-weight:800;">7 days</div><div style="font-size:13px;color:#cbd5e1;">Average delivery time</div></div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-services-grid", {
    label: "Services Grid",
    category: "CMS Business",
    attributes: { class: "fa fa-th-list" },
    content: `
      <section style="padding:64px 24px;background:#f8fafc;">
        <div style="max-width:1120px;margin:0 auto;">
          <div style="max-width:720px;margin-bottom:22px;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;font-weight:800;">Core services</p>
            <h2 style="margin:0 0 10px;font-size:40px;line-height:1.12;">A clean service grid for agencies, clinics, and business sites.</h2>
            <p style="margin:0;color:#64748b;line-height:1.7;">Replace these cards with your own offers, outcomes, and call-to-action links.</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 16px 36px rgba(15,23,42,.06);"><h3 style="margin:0 0 10px;font-size:20px;">Strategy</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.7;">Clarify goals, positioning, and a plan of action.</p><a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">Learn more</a></div>
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 16px 36px rgba(15,23,42,.06);"><h3 style="margin:0 0 10px;font-size:20px;">Design</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.7;">Create a sharper experience across every touchpoint.</p><a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">Learn more</a></div>
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 16px 36px rgba(15,23,42,.06);"><h3 style="margin:0 0 10px;font-size:20px;">Delivery</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.7;">Ship campaigns, pages, and systems with precision.</p><a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">Learn more</a></div>
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 16px 36px rgba(15,23,42,.06);"><h3 style="margin:0 0 10px;font-size:20px;">Support</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.7;">Maintain momentum with ongoing optimization and review.</p><a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">Learn more</a></div>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-team-grid", {
    label: "Team Grid",
    category: "CMS Business",
    attributes: { class: "fa fa-users" },
    content: `
      <section style="padding:64px 24px;background:#fff;">
        <div style="max-width:1120px;margin:0 auto;">
          <div style="display:flex;align-items:end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:24px;">
            <div>
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#0f766e;font-weight:800;">Meet the team</p>
              <h2 style="margin:0;font-size:40px;line-height:1.1;">A polished team section with cards ready for bios.</h2>
            </div>
            <p style="margin:0;max-width:360px;color:#64748b;line-height:1.7;">Great for agencies, restaurants, schools, healthcare, and company profile pages.</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
            <div style="padding:20px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="width:64px;height:64px;border-radius:18px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">AL</div><h3 style="margin:16px 0 4px;font-size:20px;">Alicia Lane</h3><p style="margin:0 0 10px;color:#0f766e;font-weight:700;">Creative Director</p><p style="margin:0;color:#64748b;line-height:1.7;">Shapes the visual system and messaging across campaigns.</p></div>
            <div style="padding:20px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="width:64px;height:64px;border-radius:18px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">RM</div><h3 style="margin:16px 0 4px;font-size:20px;">Rafael Mora</h3><p style="margin:0 0 10px;color:#0f766e;font-weight:700;">Operations Lead</p><p style="margin:0;color:#64748b;line-height:1.7;">Keeps delivery moving and client workflows efficient.</p></div>
            <div style="padding:20px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="width:64px;height:64px;border-radius:18px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">KC</div><h3 style="margin:16px 0 4px;font-size:20px;">Kim Cruz</h3><p style="margin:0 0 10px;color:#0f766e;font-weight:700;">Client Success</p><p style="margin:0;color:#64748b;line-height:1.7;">Guides onboarding, support, and long-term account care.</p></div>
            <div style="padding:20px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="width:64px;height:64px;border-radius:18px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">DT</div><h3 style="margin:16px 0 4px;font-size:20px;">Darren Tan</h3><p style="margin:0 0 10px;color:#0f766e;font-weight:700;">Technical Lead</p><p style="margin:0;color:#64748b;line-height:1.7;">Builds scalable systems and clean implementation details.</p></div>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-process-timeline", {
    label: "Process Timeline",
    category: "CMS Business",
    attributes: { class: "fa fa-road" },
    content: `
      <section style="padding:64px 24px;background:#f8fafc;">
        <div style="max-width:1120px;margin:0 auto;">
          <div style="max-width:760px;margin-bottom:24px;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#7c3aed;font-weight:800;">How it works</p>
            <h2 style="margin:0 0 10px;font-size:40px;line-height:1.12;">Explain your workflow in four professional steps.</h2>
            <p style="margin:0;color:#64748b;line-height:1.7;">Ideal for proposals, agency sites, onboarding pages, and service explanations.</p>
          </div>
          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 14px 28px rgba(15,23,42,.06);"><div style="width:42px;height:42px;border-radius:14px;background:#ede9fe;color:#6d28d9;display:flex;align-items:center;justify-content:center;font-weight:800;">1</div><h3 style="margin:16px 0 8px;font-size:20px;">Discovery</h3><p style="margin:0;color:#64748b;line-height:1.7;">Define goals, constraints, audiences, and the right project scope.</p></div>
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 14px 28px rgba(15,23,42,.06);"><div style="width:42px;height:42px;border-radius:14px;background:#ede9fe;color:#6d28d9;display:flex;align-items:center;justify-content:center;font-weight:800;">2</div><h3 style="margin:16px 0 8px;font-size:20px;">Planning</h3><p style="margin:0;color:#64748b;line-height:1.7;">Map the architecture, priorities, milestones, and resourcing.</p></div>
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 14px 28px rgba(15,23,42,.06);"><div style="width:42px;height:42px;border-radius:14px;background:#ede9fe;color:#6d28d9;display:flex;align-items:center;justify-content:center;font-weight:800;">3</div><h3 style="margin:16px 0 8px;font-size:20px;">Execution</h3><p style="margin:0;color:#64748b;line-height:1.7;">Design, build, review, and refine using measurable checkpoints.</p></div>
            <div style="padding:22px;border-radius:22px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 14px 28px rgba(15,23,42,.06);"><div style="width:42px;height:42px;border-radius:14px;background:#ede9fe;color:#6d28d9;display:flex;align-items:center;justify-content:center;font-weight:800;">4</div><h3 style="margin:16px 0 8px;font-size:20px;">Optimization</h3><p style="margin:0;color:#64748b;line-height:1.7;">Measure performance and improve the next iteration with confidence.</p></div>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-contact-split", {
    label: "Contact Split",
    category: "CMS Forms",
    attributes: { class: "fa fa-envelope-o" },
    content: `
      <section style="padding:64px 24px;background:#ffffff;">
        <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:.9fr 1.1fr;gap:18px;align-items:stretch;">
          <div style="padding:28px;border-radius:28px;background:linear-gradient(180deg,#0f172a,#1e293b);color:#fff;box-shadow:0 28px 60px rgba(15,23,42,.22);">
            <p style="margin:0 0 10px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#93c5fd;font-weight:800;">Contact</p>
            <h2 style="margin:0 0 14px;font-size:38px;line-height:1.08;">Make it easy for visitors to reach out.</h2>
            <p style="margin:0 0 22px;color:#cbd5e1;line-height:1.8;">Use this split layout for inquiries, bookings, service requests, or general contact pages.</p>
            <div style="display:grid;gap:14px;">
              <div style="padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);"><strong style="display:block;margin-bottom:6px;">Email</strong><span style="color:#cbd5e1;">hello@yourbrand.com</span></div>
              <div style="padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);"><strong style="display:block;margin-bottom:6px;">Phone</strong><span style="color:#cbd5e1;">+63 900 123 4567</span></div>
              <div style="padding:16px 18px;border-radius:18px;background:rgba(255,255,255,.06);"><strong style="display:block;margin-bottom:6px;">Office</strong><span style="color:#cbd5e1;">Makati City, Metro Manila</span></div>
            </div>
          </div>
          <form style="padding:28px;border-radius:28px;background:#f8fafc;border:1px solid #e2e8f0;display:grid;gap:14px;box-shadow:0 20px 44px rgba(15,23,42,.08);">
            <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;">
              <input type="text" placeholder="First name" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
              <input type="text" placeholder="Last name" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
            </div>
            <input type="email" placeholder="Email address" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
            <input type="text" placeholder="Subject" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
            <textarea placeholder="Tell us about your project" rows="6" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;resize:vertical;"></textarea>
            <button type="submit" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Send inquiry</button>
          </form>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-newsletter-panel", {
    label: "Newsletter Panel",
    category: "CMS Forms",
    attributes: { class: "fa fa-paper-plane-o" },
    content: `
      <section style="padding:48px 24px;background:#f8fafc;">
        <div style="max-width:1040px;margin:0 auto;padding:28px;border-radius:28px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:#fff;display:grid;grid-template-columns:1fr auto;gap:16px;align-items:center;box-shadow:0 28px 60px rgba(29,78,216,.28);">
          <div>
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe;font-weight:800;">Stay informed</p>
            <h2 style="margin:0 0 8px;font-size:34px;line-height:1.1;">Invite visitors into your mailing list with a cleaner callout.</h2>
            <p style="margin:0;color:#dbeafe;line-height:1.7;">Use this for updates, product launches, weekly menus, or promotions.</p>
          </div>
          <form style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:flex-end;">
            <input type="email" placeholder="Your email" style="min-width:260px;padding:14px 16px;border-radius:999px;border:0;background:#fff;color:#0f172a;" />
            <button type="submit" style="padding:14px 20px;border-radius:999px;border:0;background:#f8fafc;color:#1d4ed8;font-weight:800;cursor:pointer;">Subscribe</button>
          </form>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-blog-cards", {
    label: "Blog Cards",
    category: "CMS Business",
    attributes: { class: "fa fa-newspaper-o" },
    content: `
      <section style="padding:64px 24px;background:#fff;">
        <div style="max-width:1120px;margin:0 auto;">
          <div style="display:flex;align-items:end;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-bottom:22px;">
            <div>
              <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;font-weight:800;">Latest articles</p>
              <h2 style="margin:0;font-size:40px;line-height:1.12;">Showcase insights, updates, or featured stories.</h2>
            </div>
            <a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">View all posts</a>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
            <article style="padding:22px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Apr 2026</div><h3 style="margin:12px 0 10px;font-size:24px;line-height:1.25;">Designing a homepage that converts better.</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.7;">Short teaser text for a blog, news item, or feature story.</p><a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">Read article</a></article>
            <article style="padding:22px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Apr 2026</div><h3 style="margin:12px 0 10px;font-size:24px;line-height:1.25;">What clients expect from modern service brands.</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.7;">Perfect for publishing trust-building content and updates.</p><a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">Read article</a></article>
            <article style="padding:22px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Apr 2026</div><h3 style="margin:12px 0 10px;font-size:24px;line-height:1.25;">Three ways to improve your inquiry funnel.</h3><p style="margin:0 0 14px;color:#64748b;line-height:1.7;">Pair this with testimonials or a CTA section below for stronger flow.</p><a href="#" style="color:#2563eb;text-decoration:none;font-weight:700;">Read article</a></article>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-product-showcase", {
    label: "Product Showcase",
    category: "CMS Commerce",
    attributes: { class: "fa fa-shopping-bag" },
    content: `
      <section style="padding:88px 24px 64px;background:#f8fafc;">
        <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:22px;align-items:center;">
          <div style="padding:28px;border-radius:30px;background:linear-gradient(135deg,#ffffff,#eff6ff);border:1px solid #dbeafe;box-shadow:0 24px 54px rgba(37,99,235,.12);min-height:360px;display:flex;align-items:center;justify-content:center;">
            <div style="width:78%;aspect-ratio:1/1;border-radius:28px;background:linear-gradient(145deg,#0f172a,#2563eb);box-shadow:0 30px 60px rgba(37,99,235,.26);"></div>
          </div>
          <div>
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#2563eb;font-weight:800;">Featured product</p>
            <h2 style="margin:0 0 10px;font-size:42px;line-height:1.1;">Create a cleaner, premium product spotlight section.</h2>
            <p style="margin:0 0 18px;color:#64748b;line-height:1.8;">This layout works for products, services, menu specials, equipment, or featured packages.</p>
            <ul style="padding-left:18px;margin:0 0 20px;color:#334155;line-height:1.8;">
              <li>Short feature list with clear product benefits</li>
              <li>Strong pricing or package highlight</li>
              <li>Two-button CTA for compare and purchase actions</li>
            </ul>
            <div style="display:flex;flex-wrap:wrap;gap:12px;align-items:center;">
              <div style="font-size:38px;font-weight:800;color:#0f172a;">₱149</div>
              <span style="padding:8px 12px;border-radius:999px;background:#dcfce7;color:#166534;font-weight:800;font-size:13px;">Best seller</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:12px;margin-top:20px;">
              <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;">Buy now</a>
              <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;border:1px solid #cbd5e1;color:#0f172a;text-decoration:none;font-weight:600;">Compare features</a>
            </div>
          </div>
        </div>
      </section>
    `,
  });
};

const FOUNDATION_BLOCK_STYLES: Record<string, string> = {
  text: `
    <section style="padding:48px 24px;background:#fff;">
      <div style="max-width:900px;margin:0 auto;">
        <p style="margin:0;font-size:18px;line-height:1.8;color:#475569;">Insert your text here. Click to edit this paragraph and replace it with your own content.</p>
      </div>
    </section>
  `,
  "text-basic": `
    <section style="padding:48px 24px;background:#fff;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="margin:0 0 12px;font-size:32px;line-height:1.2;">Section heading</h2>
        <p style="margin:0;font-size:18px;line-height:1.8;color:#475569;">Add a short description or supporting copy for this section.</p>
      </div>
    </section>
  `,
  link: `
    <section style="padding:32px 24px;text-align:center;">
      <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 22px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;">Click here</a>
    </section>
  `,
  "link-block": `
    <section style="padding:32px 24px;text-align:center;">
      <a href="#" style="display:inline-flex;align-items:center;justify-content:center;padding:12px 22px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;">Learn more</a>
    </section>
  `,
  quote: `
    <section style="padding:48px 24px;background:#f8fafc;">
      <div style="max-width:820px;margin:0 auto;">
        <blockquote style="margin:0;padding:28px;border-radius:18px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 16px 36px rgba(15,23,42,.06);">
          <p style="margin:0 0 14px;font-size:22px;line-height:1.6;color:#334155;">“A polished quote block for testimonials, reviews, or featured statements.”</p>
          <strong style="color:#0f172a;">Author name</strong>
        </blockquote>
      </div>
    </section>
  `,
  image: `
    <section style="padding:40px 24px;">
      <div style="max-width:980px;margin:0 auto;">
        <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200" alt="Featured image" style="width:100%;border-radius:16px;object-fit:cover;min-height:280px;display:block;box-shadow:0 20px 44px rgba(15,23,42,.12);" />
      </div>
    </section>
  `,
  video: `
    <section style="padding:40px 24px;">
      <div style="max-width:980px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 20px 44px rgba(15,23,42,.12);">
        <div style="position:relative;padding-top:56.25%;background:#0f172a;">
          <video controls playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"></video>
        </div>
      </div>
    </section>
  `,
  map: `
    <section style="padding:24px;">
      <div style="max-width:1000px;margin:0 auto;">
        <iframe src="https://www.google.com/maps?q=Manila&output=embed" style="width:100%;height:320px;border:0;border-radius:12px;" loading="lazy" allowfullscreen></iframe>
      </div>
    </section>
  `,
  column1: `
    <section style="padding:40px 24px;">
      <div style="max-width:1100px;margin:0 auto;padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Single column content</div>
    </section>
  `,
  column2: `
    <section style="padding:40px 24px;">
      <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;">
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 1</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 2</div>
      </div>
    </section>
  `,
  column3: `
    <section style="padding:40px 24px;">
      <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 1</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 2</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 3</div>
      </div>
    </section>
  `,
  "column3-7": `
    <section style="padding:40px 24px;">
      <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 1</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 2</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 3</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 4</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 5</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 6</div>
        <div style="padding:24px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:120px;">Column 7</div>
      </div>
    </section>
  `,
  form: `
    <section style="padding:48px 24px;background:#f8fafc;">
      <form style="max-width:640px;margin:0 auto;padding:28px;border-radius:24px;background:#fff;border:1px solid #e2e8f0;display:grid;gap:14px;box-shadow:0 20px 44px rgba(15,23,42,.08);">
        <h3 style="margin:0 0 4px;font-size:28px;">Contact us</h3>
        <p style="margin:0 0 8px;color:#64748b;">Send a message and we will get back to you shortly.</p>
        <input type="text" placeholder="Full name" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
        <input type="email" placeholder="Email address" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
        <textarea placeholder="Your message" rows="5" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;resize:vertical;"></textarea>
        <button type="submit" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Send message</button>
      </form>
    </section>
  `,
  input: `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:8px;">
        <label style="font-weight:600;color:#334155;">Field label</label>
        <input type="text" placeholder="Enter text" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
      </div>
    </section>
  `,
  textarea: `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:8px;">
        <label style="font-weight:600;color:#334155;">Message</label>
        <textarea placeholder="Enter your message" rows="5" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;resize:vertical;"></textarea>
      </div>
    </section>
  `,
  select: `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:8px;">
        <label style="font-weight:600;color:#334155;">Choose an option</label>
        <select style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;">
          <option>Option one</option>
          <option>Option two</option>
          <option>Option three</option>
        </select>
      </div>
    </section>
  `,
  button: `
    <section style="padding:32px 24px;text-align:center;">
      <button type="submit" style="display:inline-flex;align-items:center;justify-content:center;padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Submit</button>
    </section>
  `,
  label: `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;">
        <label style="display:block;font-weight:700;color:#0f172a;font-size:16px;">Field label</label>
      </div>
    </section>
  `,
  checkbox: `
    <section style="padding:32px 24px;">
      <label style="max-width:640px;margin:0 auto;display:flex;align-items:center;gap:10px;color:#334155;font-weight:600;">
        <input type="checkbox" style="width:18px;height:18px;" />
        <span>I agree to the terms and conditions</span>
      </label>
    </section>
  `,
  radio: `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:10px;">
        <label style="display:flex;align-items:center;gap:10px;color:#334155;font-weight:600;"><input type="radio" name="choice" style="width:18px;height:18px;" /> Option one</label>
        <label style="display:flex;align-items:center;gap:10px;color:#334155;font-weight:600;"><input type="radio" name="choice" style="width:18px;height:18px;" /> Option two</label>
      </div>
    </section>
  `,
  "cms-basic-heading": `
    <section style="padding:40px 24px;background:#fff;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="margin:0;font-size:36px;line-height:1.15;color:#0f172a;font-weight:800;">Section heading</h2>
      </div>
    </section>
  `,
  "cms-basic-button": `
    <section style="padding:32px 24px;text-align:center;">
      <a href="#" class="cms-btn" data-btn="primary" data-btn-shape="rounded" data-btn-size="md" data-btn-icon="none">Get started</a>
    </section>
  `,
  "cms-basic-divider": `
    <section style="padding:24px;">
      <div style="max-width:900px;margin:0 auto;">
        <hr style="margin:0;border:0;border-top:1px solid #e2e8f0;" />
      </div>
    </section>
  `,
  "cms-basic-spacer": `
    <section style="padding:0 24px;" aria-hidden="true">
      <div style="max-width:900px;margin:0 auto;height:48px;"></div>
    </section>
  `,
  "cms-basic-list": `
    <section style="padding:40px 24px;background:#fff;">
      <div style="max-width:720px;margin:0 auto;">
        <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.9;font-size:17px;">
          <li>First list item — edit or add more</li>
          <li>Second list item</li>
          <li>Third list item</li>
        </ul>
      </div>
    </section>
  `,
  "cms-basic-alert": `
    <section style="padding:32px 24px;">
      <div style="max-width:900px;margin:0 auto;padding:16px 18px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;color:#1e3a8a;font-size:15px;line-height:1.6;">
        <strong style="display:block;margin-bottom:4px;">Tip</strong>
        Use this callout for notes, alerts, or short highlights.
      </div>
    </section>
  `,
  "cms-basic-icon-text": `
    <section style="padding:40px 24px;background:#fff;">
      <div style="max-width:900px;margin:0 auto;display:flex;gap:16px;align-items:flex-start;">
        <div style="width:48px;height:48px;border-radius:14px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-weight:800;flex-shrink:0;">★</div>
        <div>
          <h3 style="margin:0 0 6px;font-size:20px;color:#0f172a;">Feature title</h3>
          <p style="margin:0;color:#64748b;line-height:1.7;">Short description for a feature, benefit, or service.</p>
        </div>
      </div>
    </section>
  `,
  "cms-basic-columns-4": `
    <section style="padding:40px 24px;">
      <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
        <div style="padding:20px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:96px;">Column 1</div>
        <div style="padding:20px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:96px;">Column 2</div>
        <div style="padding:20px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:96px;">Column 3</div>
        <div style="padding:20px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;min-height:96px;">Column 4</div>
      </div>
    </section>
  `,
  "cms-basic-image-caption": `
    <section style="padding:40px 24px;">
      <div style="max-width:980px;margin:0 auto;">
        <figure style="margin:0;">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200" alt="Featured image" style="width:100%;border-radius:16px;object-fit:cover;min-height:240px;display:block;" />
          <figcaption style="margin-top:10px;text-align:center;color:#64748b;font-size:14px;">Image caption — click to edit</figcaption>
        </figure>
      </div>
    </section>
  `,
  "cms-basic-youtube": `
    <section style="padding:40px 24px;">
      <div style="max-width:960px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(15,23,42,.12);">
        <div style="position:relative;padding-top:56.25%;background:#0f172a;">
          <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
      </div>
    </section>
  `,
  "cms-basic-video-file": `
    <section style="padding:40px 24px;">
      <div style="max-width:960px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(15,23,42,.12);">
        <div style="position:relative;padding-top:56.25%;background:#0f172a;">
          <video controls playsinline preload="metadata" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;" src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"></video>
        </div>
      </div>
    </section>
  `,
  "cms-form-newsletter": `
    <section style="padding:48px 24px;background:#f8fafc;">
      <form style="max-width:720px;margin:0 auto;padding:28px;border-radius:24px;background:#fff;border:1px solid #e2e8f0;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;box-shadow:0 20px 44px rgba(15,23,42,.08);">
        <div style="flex:1 1 220px;">
          <h3 style="margin:0 0 6px;font-size:24px;color:#0f172a;">Join our newsletter</h3>
          <p style="margin:0;color:#64748b;font-size:15px;">Get updates — one email field is enough.</p>
        </div>
        <div style="display:flex;flex:1 1 280px;gap:10px;flex-wrap:wrap;">
          <input type="email" name="email" placeholder="you@company.com" required style="flex:1;min-width:180px;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
          <button type="submit" style="padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;white-space:nowrap;">Subscribe</button>
        </div>
      </form>
    </section>
  `,
  "cms-form-quote": `
    <section style="padding:48px 24px;background:#fff;">
      <form style="max-width:720px;margin:0 auto;padding:28px;border-radius:24px;border:1px solid #e2e8f0;display:grid;gap:14px;box-shadow:0 20px 44px rgba(15,23,42,.06);">
        <h3 style="margin:0;font-size:28px;color:#0f172a;">Request a quote</h3>
        <p style="margin:0;color:#64748b;">Tell us about your project and we will follow up.</p>
        <input type="text" name="name" placeholder="Full name" required style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        <input type="email" name="email" placeholder="Email" required style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        <select name="service" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;">
          <option value="">Select a service</option>
          <option>Website design</option>
          <option>Branding</option>
          <option>Support &amp; maintenance</option>
        </select>
        <textarea name="details" rows="4" placeholder="Project details" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;resize:vertical;"></textarea>
        <button type="submit" style="justify-self:start;padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Send request</button>
      </form>
    </section>
  `,
  "cms-form-appointment": `
    <section style="padding:48px 24px;background:#f8fafc;">
      <form style="max-width:640px;margin:0 auto;padding:28px;border-radius:24px;background:#fff;border:1px solid #e2e8f0;display:grid;gap:14px;">
        <h3 style="margin:0;font-size:26px;">Book an appointment</h3>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <input type="date" name="date" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
          <input type="time" name="time" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        </div>
        <input type="text" name="name" placeholder="Your name" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        <input type="tel" name="phone" placeholder="Phone number" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        <button type="submit" style="padding:14px 22px;border-radius:999px;border:0;background:#0f172a;color:#fff;font-weight:700;cursor:pointer;">Book now</button>
      </form>
    </section>
  `,
  "cms-form-two-column": `
    <section style="padding:32px 24px;">
      <form style="max-width:720px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:14px;">
        <div style="display:grid;gap:8px;">
          <label style="font-weight:600;color:#334155;">First name</label>
          <input type="text" name="first_name" placeholder="First name" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        </div>
        <div style="display:grid;gap:8px;">
          <label style="font-weight:600;color:#334155;">Last name</label>
          <input type="text" name="last_name" placeholder="Last name" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        </div>
      </form>
    </section>
  `,
  "cms-form-email-field": `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:8px;">
        <label style="font-weight:600;color:#334155;">Email</label>
        <input type="email" name="email" placeholder="name@example.com" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
      </div>
    </section>
  `,
  "cms-form-phone-field": `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:8px;">
        <label style="font-weight:600;color:#334155;">Phone</label>
        <input type="tel" name="phone" placeholder="+63 9XX XXX XXXX" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
      </div>
    </section>
  `,
  "cms-form-date-field": `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:8px;">
        <label style="font-weight:600;color:#334155;">Preferred date</label>
        <input type="date" name="date" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
      </div>
    </section>
  `,
  "cms-form-file-field": `
    <section style="padding:32px 24px;">
      <div style="max-width:640px;margin:0 auto;display:grid;gap:8px;">
        <label style="font-weight:600;color:#334155;">Upload file</label>
        <input type="file" name="attachment" style="width:100%;padding:12px 14px;border-radius:14px;border:1px solid #cbd5e1;background:#fff;" />
      </div>
    </section>
  `,
  "cms-form-checkbox-group": `
    <section style="padding:32px 24px;">
      <fieldset style="max-width:640px;margin:0 auto;border:0;padding:0;">
        <legend style="font-weight:700;color:#0f172a;margin-bottom:12px;">Select all that apply</legend>
        <div style="display:grid;gap:10px;">
          <label style="display:flex;align-items:center;gap:10px;font-weight:600;color:#334155;"><input type="checkbox" name="interest[]" value="design" style="width:18px;height:18px;" /> Design</label>
          <label style="display:flex;align-items:center;gap:10px;font-weight:600;color:#334155;"><input type="checkbox" name="interest[]" value="dev" style="width:18px;height:18px;" /> Development</label>
          <label style="display:flex;align-items:center;gap:10px;font-weight:600;color:#334155;"><input type="checkbox" name="interest[]" value="seo" style="width:18px;height:18px;" /> SEO</label>
        </div>
      </fieldset>
    </section>
  `,
  "cms-form-submit-row": `
    <section style="padding:32px 24px;">
      <form style="max-width:640px;margin:0 auto;display:flex;flex-wrap:wrap;gap:12px;">
        <button type="submit" style="padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Submit</button>
        <button type="reset" style="padding:14px 22px;border-radius:999px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-weight:700;cursor:pointer;">Reset</button>
      </form>
    </section>
  `,
  "cms-form-contact-minimal": `
    <section style="padding:48px 24px;">
      <form style="max-width:520px;margin:0 auto;display:grid;gap:12px;">
        <input type="text" name="name" placeholder="Name" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        <input type="email" name="email" placeholder="Email" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;" />
        <textarea name="message" rows="4" placeholder="Message" style="width:100%;padding:14px 16px;border-radius:14px;border:1px solid #cbd5e1;resize:vertical;"></textarea>
        <button type="submit" style="padding:14px 22px;border-radius:999px;border:0;background:#2563eb;color:#fff;font-weight:700;cursor:pointer;">Send</button>
      </form>
    </section>
  `,
};

export const registerBasicStudioBlocks = (editor: any) => {
  const basic = "Basic";

  addBlock(editor, "cms-basic-heading", {
    label: "Heading",
    category: basic,
    attributes: { class: "fa fa-header" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-heading"],
  });

  addBlock(editor, "cms-basic-button", {
    label: "Button",
    category: basic,
    attributes: { class: "fa fa-square" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-button"],
  });

  addBlock(editor, "cms-basic-divider", {
    label: "Divider",
    category: basic,
    attributes: { class: "fa fa-minus" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-divider"],
  });

  addBlock(editor, "cms-basic-spacer", {
    label: "Spacer",
    category: basic,
    attributes: { class: "fa fa-arrows-v" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-spacer"],
  });

  addBlock(editor, "cms-basic-list", {
    label: "Bullet list",
    category: basic,
    attributes: { class: "fa fa-list-ul" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-list"],
  });

  addBlock(editor, "cms-basic-alert", {
    label: "Callout",
    category: basic,
    attributes: { class: "fa fa-info-circle" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-alert"],
  });

  addBlock(editor, "cms-basic-icon-text", {
    label: "Icon + text",
    category: basic,
    attributes: { class: "fa fa-star" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-icon-text"],
  });

  addBlock(editor, "cms-basic-columns-4", {
    label: "4 Columns",
    category: basic,
    attributes: { class: "fa fa-columns" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-columns-4"],
  });

  addBlock(editor, "cms-basic-image-caption", {
    label: "Image + caption",
    category: basic,
    attributes: { class: "fa fa-image" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-image-caption"],
  });

  addBlock(editor, "cms-basic-youtube", {
    label: "YouTube video",
    category: basic,
    attributes: { class: "fa fa-play" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-youtube"],
  });

  addBlock(editor, "cms-basic-video-file", {
    label: "Video (MP4)",
    category: basic,
    attributes: { class: "fa fa-film" },
    content: FOUNDATION_BLOCK_STYLES["cms-basic-video-file"],
  });
};

/** Merge duplicate Grapes categories when custom blocks used category id `Forms` instead of `forms`. */
export const consolidateFormsBlockCategory = (editor: any) => {
  const bm = editor.BlockManager;
  const categories = bm?.getCategories?.();
  if (!bm?.getAll || !categories) return;

  let formsCategory: any = null;
  const registerCategory = (cat: any) => {
    if (!cat?.get) return;
    const id = String(cat.get("id") || "").toLowerCase();
    if (id === FORMS_BLOCKS_CATEGORY.id) {
      if (!formsCategory || cat.get("id") === FORMS_BLOCKS_CATEGORY.id) {
        formsCategory = cat;
      }
    }
  };

  if (typeof categories.each === "function") categories.each(registerCategory);
  else if (typeof categories.forEach === "function") categories.forEach(registerCategory);

  if (!formsCategory && typeof categories.add === "function") {
    formsCategory = categories.add({ ...FORMS_BLOCKS_CATEGORY });
  }
  if (!formsCategory) return;

  formsCategory.set("id", FORMS_BLOCKS_CATEGORY.id);
  formsCategory.set("label", FORMS_BLOCKS_CATEGORY.label);

  bm.getAll().forEach((block: any) => {
    const category = block.get("category");
    if (!category) return;
    const catId =
      typeof category === "string"
        ? category
        : String(category.get?.("id") || category.get?.("label") || "");
    if (catId === "Forms" || catId.toLowerCase() === FORMS_BLOCKS_CATEGORY.id) {
      block.set("category", formsCategory, { silent: true });
    }
  });

  if (typeof categories.filter === "function") {
    categories
      .filter((cat: any) => {
        const id = String(cat?.get?.("id") || "");
        return (id === "Forms" || id.toLowerCase() === FORMS_BLOCKS_CATEGORY.id) && cat !== formsCategory;
      })
      .forEach((dup: any) => {
        categories.remove?.(dup);
      });
  }
};

export const registerFormStudioBlocks = (editor: any) => {
  const forms = FORMS_BLOCKS_CATEGORY;

  addBlock(editor, "cms-form-newsletter", {
    label: "Newsletter signup",
    category: forms,
    attributes: { class: "fa fa-envelope" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-newsletter"],
  });

  addBlock(editor, "cms-form-contact-minimal", {
    label: "Minimal contact",
    category: forms,
    attributes: { class: "fa fa-paper-plane" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-contact-minimal"],
  });

  addBlock(editor, "cms-form-quote", {
    label: "Quote request",
    category: forms,
    attributes: { class: "fa fa-file-lines" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-quote"],
  });

  addBlock(editor, "cms-form-appointment", {
    label: "Appointment booking",
    category: forms,
    attributes: { class: "fa fa-calendar" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-appointment"],
  });

  addBlock(editor, "cms-form-two-column", {
    label: "Two-column fields",
    category: forms,
    attributes: { class: "fa fa-columns" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-two-column"],
  });

  addBlock(editor, "cms-form-email-field", {
    label: "Email field",
    category: forms,
    attributes: { class: "fa fa-at" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-email-field"],
  });

  addBlock(editor, "cms-form-phone-field", {
    label: "Phone field",
    category: forms,
    attributes: { class: "fa fa-phone" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-phone-field"],
  });

  addBlock(editor, "cms-form-date-field", {
    label: "Date field",
    category: forms,
    attributes: { class: "fa fa-calendar-day" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-date-field"],
  });

  addBlock(editor, "cms-form-file-field", {
    label: "File upload",
    category: forms,
    attributes: { class: "fa fa-cloud-arrow-up" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-file-field"],
  });

  addBlock(editor, "cms-form-checkbox-group", {
    label: "Checkbox group",
    category: forms,
    attributes: { class: "fa fa-square-check" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-checkbox-group"],
  });

  addBlock(editor, "cms-form-submit-row", {
    label: "Submit + reset",
    category: forms,
    attributes: { class: "fa fa-paper-plane" },
    content: FOUNDATION_BLOCK_STYLES["cms-form-submit-row"],
  });
};

const getBlockCategoryId = (block: any) => {
  const category = block?.get?.("category");
  if (!category) return "";
  if (typeof category === "string") return category;
  return String(category.get?.("id") || category.get?.("label") || "");
};

export const enhanceFoundationBlocks = (editor: any) => {
  const bm = editor.BlockManager;
  if (!bm?.getAll) return;

  bm.getAll().forEach((block: any) => {
    const id = String(block.get("id") || "");
    const styledContent = FOUNDATION_BLOCK_STYLES[id];
    if (styledContent) {
      block.set("content", styledContent);
    } else {
      const categoryId = getBlockCategoryId(block);
      if (categoryId === "Basic" || categoryId.toLowerCase() === FORMS_BLOCKS_CATEGORY.id) {
        const currentContent = String(block.get("content") || "");
        if (!currentContent.includes("style=")) {
          block.set(
            "content",
            `<section style="padding:32px 24px;"><div style="max-width:900px;margin:0 auto;padding:20px;border:1px dashed #cbd5e1;border-radius:14px;background:#fff;">${currentContent}</div></section>`,
          );
        }
      }
    }

    const currentMedia = String(block.get("media") || "");
    const nextMedia = resolveBlockThumb(id);
    if (currentMedia !== nextMedia) {
      block.set("media", nextMedia);
    }
  });
};
