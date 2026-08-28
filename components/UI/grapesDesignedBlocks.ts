import { normalizeStudioCategory } from "./grapesStudio";
import { resolveBlockThumb } from "./grapesBlockThumbs";
import { registerCmsButtonBlocks } from "./grapesButtonPresets";

const addBlock = (editor: any, id: string, config: any) => {
  const bm = editor.BlockManager;
  if (bm.get(id)) return;
  const nextAttributes = { ...(config?.attributes || {}) };
  const iconClass = nextAttributes.class;
  delete nextAttributes.class;

  bm.add(id, {
    ...config,
    category: normalizeStudioCategory(config?.category) || config?.category,
    attributes: Object.keys(nextAttributes).length ? nextAttributes : undefined,
    media: config?.media || resolveBlockThumb(id, iconClass),
  });
};

export const registerDesignedStudioBlocks = (editor: any) => {
  addBlock(editor, "cms-el-heading", {
    label: "Heading",
    category: "Elements",
    attributes: { class: "fa fa-header" },
    content: `<h1 style="margin:0;font-size:48px;line-height:1.1;color:#111827;font-weight:800;">Your headline</h1>`,
  });

  addBlock(editor, "cms-el-text", {
    label: "Text",
    category: "Elements",
    attributes: { class: "fa fa-font" },
    content: `<p style="margin:0;font-size:18px;line-height:1.7;color:#4b5563;max-width:42ch;">Write a short supporting paragraph. Double-click to edit this text.</p>`,
  });

  addBlock(editor, "cms-el-paragraph", {
    label: "Paragraph",
    category: "Elements",
    attributes: { class: "fa fa-align-left" },
    content: `<p style="margin:0;font-size:16px;line-height:1.8;color:#475569;max-width:62ch;">Use this paragraph for longer body copy. Visitors should be able to scan it quickly and understand your offer.</p>`,
  });

  addBlock(editor, "cms-el-richtext", {
    label: "Rich Text",
    category: "Elements",
    attributes: { class: "fa fa-paragraph" },
    content: `
      <div style="max-width:640px;">
        <h3 style="margin:0 0 10px;font-size:28px;color:#111827;">Editable rich text</h3>
        <p style="margin:0 0 12px;color:#4b5563;line-height:1.7;">Double-click to format <strong>bold</strong>, <em>italic</em>, and <a href="#">links</a>.</p>
        <ul style="margin:0;padding-left:18px;color:#4b5563;line-height:1.8;">
          <li>List item one</li>
          <li>List item two</li>
        </ul>
      </div>
    `,
  });

  registerCmsButtonBlocks(editor);

  addBlock(editor, "cms-el-link", {
    label: "Link",
    category: "Elements",
    attributes: { class: "fa fa-link" },
    content: `<a href="#" style="color:#4f46e5;font-weight:700;text-decoration:none;border-bottom:1px solid currentColor;">Learn more</a>`,
  });

  addBlock(editor, "cms-el-icon", {
    label: "Icon",
    category: "Elements",
    attributes: { class: "fa fa-star" },
    content: `<div style="width:56px;height:56px;border-radius:16px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:800;">★</div>`,
  });

  addBlock(editor, "cms-el-shape", {
    label: "Shape",
    category: "Elements",
    attributes: { class: "fa fa-circle" },
    content: `<div style="width:120px;height:120px;border-radius:32px;background:linear-gradient(145deg,#6366f1,#22d3ee);"></div>`,
  });

  addBlock(editor, "cms-el-logo", {
    label: "Logo",
    category: "Elements",
    attributes: { class: "fa fa-bookmark" },
    content: `<div style="display:inline-flex;align-items:center;gap:10px;font-weight:800;color:#111827;font-size:20px;letter-spacing:-.02em;"><span style="width:32px;height:32px;border-radius:10px;background:#4f46e5;display:inline-block;"></span> Studio</div>`,
  });

  addBlock(editor, "cms-el-breadcrumb", {
    label: "Breadcrumb",
    category: "Elements",
    attributes: { class: "fa fa-ellipsis-h" },
    content: `<nav aria-label="Breadcrumb" style="display:flex;gap:8px;align-items:center;font-size:13px;color:#6b7280;"><a href="#" style="color:#6b7280;text-decoration:none;">Home</a><span>/</span><a href="#" style="color:#6b7280;text-decoration:none;">Pages</a><span>/</span><strong style="color:#111827;">Current</strong></nav>`,
  });

  addBlock(editor, "cms-layout-section", {
    label: "Section",
    category: "Layout",
    attributes: { class: "fa fa-square-o" },
    content: `<section style="padding:48px 24px;background:#ffffff;width:100%;"><div style="max-width:1120px;margin:0 auto;min-height:80px;"></div></section>`,
  });

  addBlock(editor, "cms-layout-container", {
    label: "Container",
    category: "Layout",
    attributes: { class: "fa fa-object-group" },
    content: `<div style="max-width:1120px;margin:0 auto;padding:24px;width:100%;"></div>`,
  });

  addBlock(editor, "cms-layout-flex", {
    label: "Flex Container",
    category: "Layout",
    attributes: { class: "fa fa-arrows-h" },
    content: `<div style="display:flex;flex-wrap:wrap;gap:20px;align-items:center;width:100%;padding:16px;"><div style="flex:1 1 240px;min-height:80px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;"></div><div style="flex:1 1 240px;min-height:80px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;"></div></div>`,
  });

  addBlock(editor, "cms-layout-grid", {
    label: "Grid",
    category: "Layout",
    attributes: { class: "fa fa-th-large" },
    content: `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;width:100%;padding:16px;"><div style="min-height:120px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;"></div><div style="min-height:120px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;"></div><div style="min-height:120px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:16px;"></div></div>`,
  });

  addBlock(editor, "cms-layout-card", {
    label: "Card",
    category: "Layout",
    attributes: { class: "fa fa-id-card" },
    content: `<article style="padding:24px;border-radius:24px;background:#fff;border:1px solid #e5e7eb;box-shadow:0 18px 40px rgba(15,23,42,.08);max-width:360px;"><div style="height:140px;border-radius:16px;background:#eef2ff;margin-bottom:16px;"></div><h3 style="margin:0 0 8px;font-size:22px;">Card title</h3><p style="margin:0;color:#6b7280;line-height:1.7;">Short supporting copy for this card.</p></article>`,
  });

  addBlock(editor, "cms-hero-split", {
    label: "Hero Split",
    category: "CMS Sections",
    attributes: { class: "fa fa-flag" },
    content: `
      <section style="padding:88px 24px;background:#fff;width:100%;">
        <div style="max-width:1140px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:36px;align-items:center;">
          <div>
            <p style="margin:0 0 12px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#2563eb;font-weight:800;">Studio builder</p>
            <h1 style="margin:0 0 16px;font-size:56px;line-height:1.05;color:#111827;max-width:11ch;">Design pages visually, then publish.</h1>
            <p style="margin:0 0 28px;font-size:18px;line-height:1.7;color:#64748b;max-width:52ch;">Drag sections onto the canvas, edit any text in place, and style every element from the properties panel.</p>
            <div style="display:flex;flex-wrap:wrap;gap:12px;">
              <a href="#" style="display:inline-flex;padding:14px 22px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;">Start building</a>
              <a href="#" style="display:inline-flex;padding:14px 22px;border-radius:999px;border:1px solid #d1d5db;color:#111827;text-decoration:none;font-weight:600;">See templates</a>
            </div>
          </div>
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1400&q=80" alt="Team collaborating" style="width:100%;height:420px;object-fit:cover;border-radius:32px;box-shadow:0 30px 70px rgba(15,23,42,.18);" />
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-hero-center", {
    label: "Hero Centered",
    category: "CMS Sections",
    attributes: { class: "fa fa-flag" },
    content: `
      <section style="padding:120px 24px;background:linear-gradient(180deg,rgba(15,23,42,.62),rgba(15,23,42,.42)),url('https://images.unsplash.com/photo-1497215728101-856f4ea83613?w=1600&q=80') center/cover no-repeat;color:#fff;text-align:center;width:100%;">
        <div style="max-width:820px;margin:0 auto;">
          <p style="margin:0 0 12px;letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:#bfdbfe;font-weight:800;">Landing page</p>
          <h1 style="margin:0 0 16px;font-size:58px;line-height:1.05;">A cleaner homepage for modern brands.</h1>
          <p style="margin:0 0 28px;font-size:18px;line-height:1.7;color:#e2e8f0;">Replace this copy, swap the background, and connect the buttons to your own pages.</p>
          <a href="mailto:hello@example.com" style="display:inline-flex;padding:14px 24px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:800;">Talk with us</a>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-features-icon", {
    label: "Features",
    category: "CMS Sections",
    attributes: { class: "fa fa-th-large" },
    content: `
      <section style="padding:80px 24px;background:#fff;width:100%;">
        <div style="max-width:1100px;margin:0 auto;">
          <h2 style="margin:0 0 8px;font-size:40px;text-align:center;">Everything you need to launch</h2>
          <p style="margin:0 auto 32px;max-width:52ch;text-align:center;color:#64748b;line-height:1.7;">Swap these cards with your own benefits, service highlights, or product features.</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
            <div style="padding:24px;border-radius:24px;background:#f8fafc;border:1px solid #e5e7eb;"><div style="width:44px;height:44px;border-radius:14px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-weight:800;">01</div><h3 style="margin:16px 0 8px;">Visual editing</h3><p style="margin:0;color:#64748b;line-height:1.7;">Click any element, then change content and style without code.</p></div>
            <div style="padding:24px;border-radius:24px;background:#f8fafc;border:1px solid #e5e7eb;"><div style="width:44px;height:44px;border-radius:14px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-weight:800;">02</div><h3 style="margin:16px 0 8px;">Responsive views</h3><p style="margin:0;color:#64748b;line-height:1.7;">Preview desktop, tablet, and mobile while you design.</p></div>
            <div style="padding:24px;border-radius:24px;background:#f8fafc;border:1px solid #e5e7eb;"><div style="width:44px;height:44px;border-radius:14px;background:#eef2ff;color:#4f46e5;display:flex;align-items:center;justify-content:center;font-weight:800;">03</div><h3 style="margin:16px 0 8px;">Ready-made blocks</h3><p style="margin:0;color:#64748b;line-height:1.7;">Drop in heroes, pricing, FAQs, and contact sections instantly.</p></div>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-portfolio-grid", {
    label: "Portfolio",
    category: "CMS Sections",
    attributes: { class: "fa fa-th-large" },
    content: `
      <section style="padding:80px 24px;background:#f8fafc;width:100%;">
        <div style="max-width:1120px;margin:0 auto;">
          <h2 style="margin:0 0 24px;font-size:40px;">Selected work</h2>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
            <article style="overflow:hidden;border-radius:24px;background:#fff;border:1px solid #e5e7eb;"><img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=900" alt="Project one" style="width:100%;height:200px;object-fit:cover;display:block;" /><div style="padding:18px;"><h3 style="margin:0 0 6px;">Brand refresh</h3><p style="margin:0;color:#64748b;">Identity, website, and campaign system.</p></div></article>
            <article style="overflow:hidden;border-radius:24px;background:#fff;border:1px solid #e5e7eb;"><img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900" alt="Project two" style="width:100%;height:200px;object-fit:cover;display:block;" /><div style="padding:18px;"><h3 style="margin:0 0 6px;">Product launch</h3><p style="margin:0;color:#64748b;">Landing page and conversion flow.</p></div></article>
            <article style="overflow:hidden;border-radius:24px;background:#fff;border:1px solid #e5e7eb;"><img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900" alt="Project three" style="width:100%;height:200px;object-fit:cover;display:block;" /><div style="padding:18px;"><h3 style="margin:0 0 6px;">Team platform</h3><p style="margin:0;color:#64748b;">Internal tools with a public site.</p></div></article>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-youtube", {
    label: "YouTube",
    category: "CMS Media",
    attributes: { class: "fa fa-play" },
    content: `
      <section style="padding:40px 24px;width:100%;">
        <div style="max-width:960px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(15,23,42,.12);">
          <div style="position:relative;padding-top:56.25%;background:#0f172a;">
            <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-vimeo", {
    label: "Vimeo",
    category: "CMS Media",
    attributes: { class: "fa fa-play" },
    content: `
      <section style="padding:40px 24px;width:100%;">
        <div style="max-width:960px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 20px 44px rgba(15,23,42,.12);">
          <div style="position:relative;padding-top:56.25%;background:#0f172a;">
            <iframe src="https://player.vimeo.com/video/76979871" title="Vimeo video" style="position:absolute;inset:0;width:100%;height:100%;border:0;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-image-grid", {
    label: "Image Grid",
    category: "CMS Media",
    attributes: { class: "fa fa-image" },
    content: `
      <section style="padding:48px 24px;width:100%;">
        <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.2fr .8fr;gap:12px;">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200" alt="Large grid image" style="width:100%;height:360px;object-fit:cover;border-radius:20px;" />
          <div style="display:grid;gap:12px;">
            <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=800" alt="Grid image two" style="width:100%;height:174px;object-fit:cover;border-radius:20px;" />
            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800" alt="Grid image three" style="width:100%;height:174px;object-fit:cover;border-radius:20px;" />
          </div>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-nav-menu", {
    label: "Navigation",
    category: "CMS Sections",
    attributes: { class: "fa fa-header" },
    content: `
      <header style="padding:16px 24px;background:#fff;border-bottom:1px solid #e5e7eb;width:100%;">
        <div style="max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <a href="#" style="font-weight:800;color:#111827;text-decoration:none;font-size:18px;">Studio</a>
          <nav style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;">
            <a href="#" style="color:#4b5563;text-decoration:none;">Home</a>
            <a href="#" style="color:#4b5563;text-decoration:none;">Work</a>
            <a href="#" style="color:#4b5563;text-decoration:none;">About</a>
            <a href="#contact" style="display:inline-flex;padding:8px 14px;border-radius:999px;background:#111827;color:#fff;text-decoration:none;font-weight:700;">Contact</a>
          </nav>
        </div>
      </header>
    `,
  });

  addBlock(editor, "cms-tabs-simple", {
    label: "Tabs",
    category: "CMS Sections",
    attributes: { class: "fa fa-folder" },
    content: `
      <section style="padding:64px 24px;background:#fff;width:100%;">
        <div style="max-width:860px;margin:0 auto;">
          <h2 style="margin:0 0 18px;font-size:36px;">Simple tabbed content</h2>
          <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
            <span style="padding:8px 14px;border-radius:999px;background:#111827;color:#fff;font-weight:700;">Overview</span>
            <span style="padding:8px 14px;border-radius:999px;background:#f3f4f6;color:#374151;font-weight:600;">Details</span>
            <span style="padding:8px 14px;border-radius:999px;background:#f3f4f6;color:#374151;font-weight:600;">Support</span>
          </div>
          <p style="margin:0;color:#4b5563;line-height:1.8;">Replace this panel with the copy for the active tab. Duplicate the chips to add more tabs, then style them from the right panel.</p>
        </div>
      </section>
    `,
  });

  addBlock(editor, "cms-cta-banner", {
    label: "CTA Banner",
    category: "CMS Sections",
    attributes: { class: "fa fa-bullhorn" },
    content: `
      <section style="padding:56px 24px;width:100%;">
        <div style="max-width:1080px;margin:0 auto;padding:48px 36px;border-radius:28px;background:linear-gradient(180deg,rgba(15,23,42,.55),rgba(15,23,42,.35)),url('https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=80') center/cover no-repeat;color:#fff;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;">
          <div>
            <h2 style="margin:0 0 8px;font-size:34px;">Ready when you are.</h2>
            <p style="margin:0;color:#e2e8f0;">Publish this page, then keep refining the design anytime.</p>
          </div>
          <a href="mailto:hello@example.com" style="display:inline-flex;padding:14px 22px;border-radius:999px;background:#2563eb;color:#fff;text-decoration:none;font-weight:800;">Email us</a>
        </div>
      </section>
    `,
  });
};
