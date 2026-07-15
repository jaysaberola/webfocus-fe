export const CMS_STUDIO_BLOCK_COUNT = 30;

export const cmsStudioCanvasCss = `
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    min-height: 100%;
    background: #f6f8fb;
    color: #0f172a;
    font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  body {
    line-height: 1.5;
  }

  img, video, iframe {
    max-width: 100%;
  }

  a {
    color: inherit;
  }

  section, header, footer, main {
    position: relative;
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

const LEGACY_PRESET_CATEGORIES = new Set([
  "CMS Page Starters",
  "CMS Sections",
  "CMS Business",
  "CMS Social Proof",
  "CMS Forms",
  "CMS Commerce",
]);

export const normalizeStudioCategory = (category?: string) => {
  const label = String(category || "").trim();
  return LEGACY_PRESET_CATEGORIES.has(label) ? CMS_PRESETS_CATEGORY : label;
};

const addBlock = (editor: any, id: string, config: any) => {
  const bm = editor.BlockManager;
  if (bm.get(id)) return;
  const nextAttributes = { ...(config?.attributes || {}) };
  const iconClass = nextAttributes.class;
  const normalizedCategory = normalizeStudioCategory(config?.category);
  delete nextAttributes.class;

  bm.add(id, {
    ...config,
    category: normalizedCategory || config?.category,
    attributes: Object.keys(nextAttributes).length ? nextAttributes : undefined,
    media: config?.media || resolveCmsBlockMedia(iconClass),
  });
};

export const configureStudioCategories = (editor: any) => {
  const categories = editor.BlockManager?.getCategories?.();
  if (!categories) return;

  const order = [
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
    const label = normalizeStudioCategory(String(category?.get?.("id") || category?.get?.("label") || ""));
    category?.set?.("open", false);
    if (label === CMS_PRESETS_CATEGORY) {
      category?.set?.("id", CMS_PRESETS_CATEGORY);
      category?.set?.("label", CMS_PRESETS_CATEGORY);
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
