import {
  CANVAS7_TEMPLATE_BASE,
  getCanvas7IntroImageUrl,
  getCanvas7ThumbnailUrl,
} from "@/lib/canvasTemplateCatalog";
import {
  CANVAS7_ONEPAGE_DEFAULT,
  CANVAS7_ONEPAGE_DESIGNER,
  CANVAS7_ONEPAGE_PARALLAX,
} from "./grapesCanvas7OnePages";

export const CMS_TEMPLATES_CATEGORY = "Website Templates";
export const CMS_SITE_TEMPLATE_TYPE = "cms-site-template";

const SITE_HTML_BY_KEY: Record<string, string> = {
  "onepage-default": CANVAS7_ONEPAGE_DEFAULT,
  "onepage-designer": CANVAS7_ONEPAGE_DESIGNER,
  "onepage-parallax": CANVAS7_ONEPAGE_PARALLAX,
};

const preparedHtmlCache = new Map<string, string>();
const prefetchedTemplates = new Set<string>();

function prepareFastTemplateHtml(html: string) {
  let imageIndex = 0;
  let next = html.replace(/<img\b([^>]*)>/gi, (full, attrs: string) => {
    if (/\bloading\s*=/.test(attrs)) return full;
    imageIndex += 1;
    const loading = imageIndex <= 6 ? "eager" : "lazy";
    return `<img${attrs} loading="${loading}" decoding="async">`;
  });
  next = next.replace(/<video\b(?![^>]*\bpreload\s*=)/gi, '<video preload="metadata"');
  return next;
}

function normalizeTemplateKey(keyOrBlockId: string) {
  return keyOrBlockId.startsWith("cms-site-") ? keyOrBlockId.slice("cms-site-".length) : keyOrBlockId;
}

export function getPreparedSiteTemplateHtml(keyOrBlockId: string) {
  const key = normalizeTemplateKey(keyOrBlockId);
  const raw = SITE_HTML_BY_KEY[key] || "";
  if (!raw) return "";
  const cached = preparedHtmlCache.get(key);
  if (cached) return cached;
  const prepared = prepareFastTemplateHtml(raw);
  preparedHtmlCache.set(key, prepared);
  return prepared;
}

function extractSiteTemplateInner(html: string) {
  const match = html.match(/^<main\b[^>]*>([\s\S]*)<\/main>\s*$/i);
  return match ? match[1] : html;
}

function collectTemplateImageUrls(html: string, limit = 8) {
  const urls: string[] = [];
  const seen = new Set<string>();
  const matches = html.matchAll(/(?:src|srcset)=["']([^"']+)["']/gi);
  for (const match of matches) {
    const first = String(match[1] || "")
      .split(",")[0]
      .trim()
      .split(/\s+/)[0];
    if (!first || seen.has(first) || !/^https?:/i.test(first)) continue;
    if (!/\.(?:avif|gif|jpe?g|png|svg|webp)(?:$|[?#])/i.test(first)) continue;
    seen.add(first);
    urls.push(first);
    if (urls.length >= limit) break;
  }
  return urls;
}

export function prefetchSiteTemplateAssets(block: any) {
  const id = String(typeof block?.get === "function" ? block.get("id") : block?.id || "");
  if (!id || prefetchedTemplates.has(id)) return;
  const html = getPreparedSiteTemplateHtml(id);
  if (!html) return;
  prefetchedTemplates.add(id);
  collectTemplateImageUrls(html).forEach((src) => {
    const image = new Image();
    image.decoding = "async";
    image.src = src;
  });
}

function paintSiteTemplateView(view: any) {
  const el = view?.el as HTMLElement | undefined;
  const model = view?.model;
  if (!el) return;
  const key = String(model?.getAttributes?.()?.["data-cms-template"] || el.getAttribute("data-cms-template") || "");
  const html = String(model?.get?.("templateHtml") || getPreparedSiteTemplateHtml(key) || "");
  if (!html) return;
  if (el.getAttribute("data-cms-painted") === "1" && el.childElementCount > 0) return;
  el.innerHTML = extractSiteTemplateInner(html);
  el.setAttribute("data-cms-site-template", "1");
  if (key) el.setAttribute("data-cms-template", key);
  el.setAttribute("data-cms-painted", "1");
}

export function registerCmsSiteTemplateType(editor: any) {
  const dc = editor?.DomComponents;
  if (!dc) return;

  dc.addType(CMS_SITE_TEMPLATE_TYPE, {
    isComponent: (el: HTMLElement) => {
      const key = String(el?.getAttribute?.("data-cms-template") || "");
      if (!key || !SITE_HTML_BY_KEY[key]) return false;
      if (String(el?.getAttribute?.("data-cms-site-template") || "") !== "1") return false;
      return {
        type: CMS_SITE_TEMPLATE_TYPE,
        tagName: String(el.tagName || "main").toLowerCase(),
      };
    },
    model: {
      defaults: {
        tagName: "main",
        void: true,
        droppable: false,
        selectable: true,
        hoverable: true,
        copyable: true,
        removable: true,
        highlightable: true,
        draggable: true,
        attributes: { "data-cms-site-template": "1" },
      },
      toHTML() {
        const el = this.getEl?.() as HTMLElement | undefined;
        if (el?.childElementCount) return el.outerHTML;
        const key = String(this.getAttributes?.()?.["data-cms-template"] || "");
        return getPreparedSiteTemplateHtml(key) || "";
      },
    },
    view: {
      renderChildren() {},
      onRender() {
        paintSiteTemplateView(this);
      },
    },
  });
}

const img = (path: string) => `${CANVAS7_TEMPLATE_BASE}/${path.replace(/^\//, "")}`;

function siteTemplate(html: string) {
  return html.trim();
}

const SEO_TEMPLATE = siteTemplate(`
<main data-cms-site-template="1" data-cms-template="seo" style="background:#fff;color:#0f172a;font-family:Inter,Segoe UI,Arial,sans-serif;">
  <header style="padding:18px 28px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #e2e8f0;">
    <strong style="font-size:20px;letter-spacing:.04em;">CANVAS SEO</strong>
    <nav style="display:flex;gap:22px;font-size:14px;font-weight:600;">
      <a href="#services" style="color:#0f172a;text-decoration:none;">Services</a>
      <a href="#pricing" style="color:#0f172a;text-decoration:none;">Pricing</a>
      <a href="#work" style="color:#0f172a;text-decoration:none;">Work</a>
      <a href="#contact" style="color:#0f172a;text-decoration:none;">Contact</a>
    </nav>
  </header>
  <section style="min-height:520px;padding:88px 28px;background:linear-gradient(180deg,rgba(15,23,42,.72),rgba(15,23,42,.45)),url('${getCanvas7IntroImageUrl("images/intro/niche/new/seo.jpg")}') center/cover no-repeat;color:#fff;text-align:center;">
    <div style="max-width:820px;margin:0 auto;">
      <p style="margin:0 0 12px;letter-spacing:.16em;text-transform:uppercase;font-size:12px;font-weight:800;color:#c7d2fe;">Search growth studio</p>
      <h1 style="font-size:56px;line-height:1.05;margin:0 0 16px;">Boost your own Awesome, Beautiful, Great Website.</h1>
      <p style="font-size:18px;line-height:1.7;color:#e2e8f0;margin:0 0 28px;">Quia vitae mollitia dignissimos ab qui aspernatur. We plan, optimize, and report the results that move your rankings.</p>
      <a href="#contact" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#fff;color:#0f172a;text-decoration:none;font-weight:800;">Start a campaign</a>
    </div>
  </section>
  <section id="services" style="padding:72px 28px;">
    <div style="max-width:1100px;margin:0 auto;text-align:center;">
      <h2 style="font-size:40px;margin:0 0 12px;">What We Do</h2>
      <p style="color:#64748b;max-width:640px;margin:0 auto 36px;">Dynamically provide access to resource-leveling mindshare vis-a-vis bricks-and-clicks ideas.</p>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;text-align:left;">
        <article style="padding:24px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;"><h3 style="margin:0 0 8px;">SEO optimization</h3><p style="margin:0;color:#64748b;">Technical audits, on-page fixes, and content that actually ranks.</p></article>
        <article style="padding:24px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;"><h3 style="margin:0 0 8px;">Adwords Campaign</h3><p style="margin:0;color:#64748b;">Paid search that protects budget and converts the right traffic.</p></article>
        <article style="padding:24px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;"><h3 style="margin:0 0 8px;">Digital Analysis</h3><p style="margin:0;color:#64748b;">Clear dashboards so you see what is working every week.</p></article>
        <article style="padding:24px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;"><h3 style="margin:0 0 8px;">Social Media Marketing</h3><p style="margin:0;color:#64748b;">Campaigns that turn attention into qualified leads.</p></article>
        <article style="padding:24px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;"><h3 style="margin:0 0 8px;">Customer Experience</h3><p style="margin:0;color:#64748b;">Landing pages and funnels built for trust and action.</p></article>
        <article style="padding:24px;border:1px solid #e2e8f0;border-radius:20px;background:#f8fafc;"><h3 style="margin:0 0 8px;">Content Marketing</h3><p style="margin:0;color:#64748b;">Articles, assets, and briefs your audience wants to share.</p></article>
      </div>
    </div>
  </section>
  <section id="pricing" style="padding:72px 28px;background:#0f172a;color:#fff;">
    <div style="max-width:1100px;margin:0 auto;text-align:center;">
      <h2 style="font-size:40px;margin:0 0 10px;">No Hidden Charges. Choose Your Best Plan.</h2>
      <p style="color:#94a3b8;max-width:620px;margin:0 auto 36px;">Deserunt dolore voluptatem assumenda quae possimus sunt dignissimos tempora officia.</p>
      <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;text-align:left;">
        <article style="padding:28px;border-radius:24px;background:#111827;border:1px solid #1e293b;">
          <h3 style="margin:0 0 8px;">Single User Plan</h3>
          <p style="font-size:32px;font-weight:800;margin:0 0 16px;">$5 <span style="font-size:16px;font-weight:600;color:#94a3b8;">/ month</span></p>
          <p style="margin:0 0 18px;color:#94a3b8;">Limited Support · 1 Free Optimization · 100+ Pages · Phone & Email Support</p>
          <a href="#contact" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#fff;color:#0f172a;text-decoration:none;font-weight:700;">Choose plan</a>
        </article>
        <article style="padding:28px;border-radius:24px;background:#1d4ed8;">
          <h3 style="margin:0 0 8px;">Multiple User Plan</h3>
          <p style="font-size:32px;font-weight:800;margin:0 0 16px;">$12 <span style="font-size:16px;font-weight:600;color:#dbeafe;">/ month</span></p>
          <p style="margin:0 0 18px;color:#dbeafe;">24*7 Support · 10 Free Optimization · 1000+ Pages · Unlimited Users</p>
          <a href="#contact" style="display:inline-block;padding:12px 18px;border-radius:999px;background:#fff;color:#1d4ed8;text-decoration:none;font-weight:700;">Choose plan</a>
        </article>
      </div>
    </div>
  </section>
  <section id="work" style="padding:72px 28px;">
    <div style="max-width:1100px;margin:0 auto;">
      <h2 style="font-size:40px;margin:0 0 24px;text-align:center;">Our Latest Works</h2>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
        <figure style="margin:0;"><img src="${img("images/slider/swiper/1.jpg")}" alt="The Atmosphere" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">The Atmosphere <span style="display:block;color:#64748b;font-weight:500;">Digital Marketing</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/slider/swiper/2.jpg")}" alt="Wavelength Structure" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Wavelength Structure <span style="display:block;color:#64748b;font-weight:500;">SEO</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/slider/swiper/3.jpg")}" alt="Simplicity Pages" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Simplicity Pages <span style="display:block;color:#64748b;font-weight:500;">Analytics</span></figcaption></figure>
      </div>
    </div>
  </section>
  <section id="contact" style="padding:64px 28px;background:#f8fafc;">
    <div style="max-width:800px;margin:0 auto;text-align:center;">
      <h2 style="font-size:36px;margin:0 0 10px;">Ready to grow your search traffic?</h2>
      <p style="color:#64748b;margin:0 0 22px;">Call (10) 22 33445566 or email us and we will map your next 90 days.</p>
      <a href="mailto:hello@example.com" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#0f172a;color:#fff;text-decoration:none;font-weight:800;">Email Us</a>
    </div>
  </section>
  <footer style="padding:28px;text-align:center;color:#64748b;font-size:13px;border-top:1px solid #e2e8f0;">Canvas 7 SEO template · Drag, then edit any text or image</footer>
</main>
`);

const MEDICAL_TEMPLATE = siteTemplate(`
<main data-cms-site-template="1" data-cms-template="medical" style="background:#fff;color:#0f172a;font-family:Inter,Segoe UI,Arial,sans-serif;">
  <header style="padding:14px 28px;display:flex;justify-content:space-between;align-items:center;background:#0b3b5a;color:#fff;">
    <strong style="font-size:18px;">CANVAS MEDICAL</strong>
    <div style="font-size:13px;">Timings · +1-800-9876-221 · medical@canvas.com</div>
  </header>
  <section style="min-height:520px;padding:88px 28px;background:linear-gradient(180deg,rgba(11,59,90,.72),rgba(11,59,90,.4)),url('${getCanvas7IntroImageUrl("images/intro/niche/new/medical.jpg")}') center/cover no-repeat;color:#fff;">
    <div style="max-width:780px;">
      <p style="margin:0 0 10px;letter-spacing:.14em;text-transform:uppercase;font-size:12px;font-weight:800;">Hospital & care</p>
      <h1 style="font-size:56px;line-height:1.05;margin:0 0 14px;">Team of Experts.</h1>
      <p style="font-size:18px;line-height:1.7;color:#e2e8f0;margin:0 0 24px;">Our Team of Doctors are specialized in Various Disciplines to make sure you get the Best Treatment.</p>
      <a href="#book" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#22c55e;color:#052e16;text-decoration:none;font-weight:800;">Book an Appointment</a>
    </div>
  </section>
  <section style="padding:72px 28px;">
    <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;">
      <article style="padding:24px;border-radius:20px;border:1px solid #e2e8f0;"><h3 style="margin:0 0 8px;">Intensive Care</h3><p style="margin:0;color:#64748b;">Responsive care that can be adapted to every patient and every screen.</p></article>
      <article style="padding:24px;border-radius:20px;border:1px solid #e2e8f0;"><h3 style="margin:0 0 8px;">Family Planning</h3><p style="margin:0;color:#64748b;">Clear guidance and ultra-sharp support for families at every stage.</p></article>
      <article style="padding:24px;border-radius:20px;border:1px solid #e2e8f0;"><h3 style="margin:0 0 8px;">Expert Consultation</h3><p style="margin:0;color:#64748b;">Specialists ready with fast, customized treatment plans.</p></article>
      <article style="padding:24px;border-radius:20px;border:1px solid #e2e8f0;"><h3 style="margin:0 0 8px;">Dental Sciences</h3><p style="margin:0;color:#64748b;">Modern dental care with a calm, hospital-grade experience.</p></article>
      <article style="padding:24px;border-radius:20px;border:1px solid #e2e8f0;"><h3 style="margin:0 0 8px;">X-Ray Services</h3><p style="margin:0;color:#64748b;">Diagnostics that stay sharp, fast, and easy to understand.</p></article>
      <article style="padding:24px;border-radius:20px;border:1px solid #e2e8f0;"><h3 style="margin:0 0 8px;">24x7 Emergency</h3><p style="margin:0;color:#64748b;">Always-on emergency support when every minute matters.</p></article>
    </div>
  </section>
  <section id="book" style="padding:72px 28px;background:#f0f9ff;">
    <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:28px;align-items:center;">
      <div>
        <h2 style="font-size:40px;margin:0 0 12px;">Book an Appointment.</h2>
        <p style="color:#475569;line-height:1.7;">Kidney Transplant, Pulmonary Treatment, Eye Care & Lasik, ENT, and Cardiology — choose the department that fits your needs.</p>
        <ul style="padding-left:18px;color:#334155;line-height:1.9;">
          <li>Kidney Transplant</li>
          <li>Pulmonary Treatment</li>
          <li>Eye Care & Lasik Surgery</li>
          <li>Ear, Nose & Throat</li>
          <li>Cardiology Department</li>
        </ul>
      </div>
      <img src="${img("images/slider/swiper/2.jpg")}" alt="Medical care" style="width:100%;height:360px;object-fit:cover;border-radius:28px;"/>
    </div>
  </section>
  <section style="padding:72px 28px;">
    <div style="max-width:1100px;margin:0 auto;text-align:center;">
      <h2 style="font-size:40px;margin:0 0 8px;">Meet our Team of Specialists.</h2>
      <p style="color:#64748b;margin:0 0 28px;">We make sure that your Life is in Good Hands.</p>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
        <figure style="margin:0;"><img src="${img("images/team/1.jpg")}" alt="Dr. John Doe" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Dr. John Doe<span style="display:block;color:#64748b;font-weight:500;">Cardiologist</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/team/2.jpg")}" alt="Dr. Bryan Mcguire" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Dr. Bryan Mcguire<span style="display:block;color:#64748b;font-weight:500;">Orthopedist</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/team/3.jpg")}" alt="Dr. Mary Jane" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Dr. Mary Jane<span style="display:block;color:#64748b;font-weight:500;">Neurologist</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/team/4.jpg")}" alt="Dr. Silvia Bush" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Dr. Silvia Bush<span style="display:block;color:#64748b;font-weight:500;">Dentist</span></figcaption></figure>
      </div>
    </div>
  </section>
  <footer style="padding:32px 28px;background:#0b3b5a;color:#dbeafe;text-align:center;">
    <p style="margin:0 0 6px;font-weight:700;">Call Us: (1) 22 55412474</p>
    <p style="margin:0;">Send an Email: info@canvas.com</p>
  </footer>
</main>
`);

const RESTAURANT_TEMPLATE = siteTemplate(`
<main data-cms-site-template="1" data-cms-template="restaurant" style="background:#fff8f1;color:#1c1917;font-family:Georgia,Times,serif;">
  <header style="padding:18px 28px;display:flex;justify-content:space-between;align-items:center;background:#1c1917;color:#fff;">
    <strong style="letter-spacing:.12em;">CANVAS KITCHEN</strong>
    <nav style="display:flex;gap:20px;font-size:14px;">
      <a href="#menu" style="color:#fff;text-decoration:none;">Menu</a>
      <a href="#dessert" style="color:#fff;text-decoration:none;">Dessert</a>
      <a href="#chefs" style="color:#fff;text-decoration:none;">Chefs</a>
      <a href="#reserve" style="color:#fff;text-decoration:none;">Reserve</a>
    </nav>
  </header>
  <section style="min-height:540px;padding:92px 28px;background:linear-gradient(180deg,rgba(28,25,23,.66),rgba(28,25,23,.35)),url('${getCanvas7IntroImageUrl("images/intro/niche/new/restaurant.jpg")}') center/cover no-repeat;color:#fff;text-align:center;">
    <div style="max-width:760px;margin:0 auto;">
      <p style="margin:0 0 10px;letter-spacing:.18em;text-transform:uppercase;font-size:12px;">Taste from Italy</p>
      <h1 style="font-size:58px;line-height:1.04;margin:0 0 14px;">Hello & Welcome.</h1>
      <p style="font-size:20px;line-height:1.7;margin:0 0 26px;">Who Needs a Boyfriend if Pizza And WiFi are both available. Everything starts with a great Coffee.</p>
      <a href="#menu" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#f59e0b;color:#1c1917;text-decoration:none;font-weight:800;">See the menu</a>
    </div>
  </section>
  <section style="padding:64px 28px;">
    <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;text-align:center;">
      <article style="padding:24px;background:#fff;border-radius:20px;"><h3 style="margin:0 0 8px;">Food Served Hot</h3><p style="margin:0;color:#78716c;">Voluptas omnis nam molestias minus ipsa, placeat!</p></article>
      <article style="padding:24px;background:#fff;border-radius:20px;"><h3 style="margin:0 0 8px;">Ample Options</h3><p style="margin:0;color:#78716c;">Corporis fugit fugiat eaque, accusamus officiis reprehenderit.</p></article>
      <article style="padding:24px;background:#fff;border-radius:20px;"><h3 style="margin:0 0 8px;">In-House Brewery</h3><p style="margin:0;color:#78716c;">Tempore, sequi. Harum nesciunt, magni aperiam est?</p></article>
    </div>
  </section>
  <section id="menu" style="padding:24px 28px 72px;">
    <div style="max-width:1100px;margin:0 auto;">
      <h2 style="font-size:40px;margin:0 0 24px;text-align:center;">Our Food Menu</h2>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
        <article style="background:#fff;border-radius:20px;overflow:hidden;"><img src="${img("images/slider/swiper/1.jpg")}" alt="Multigrain Toast" style="width:100%;height:180px;object-fit:cover;"/><div style="padding:16px;"><h3 style="margin:0 0 6px;">Multigrain Toast. <span style="float:right;">$19.99</span></h3><p style="margin:0;color:#78716c;">Corn, Bacon, Tomato, Cheese, Onion</p></div></article>
        <article style="background:#fff;border-radius:20px;overflow:hidden;"><img src="${img("images/slider/swiper/2.jpg")}" alt="Prawn Mussels Plate" style="width:100%;height:180px;object-fit:cover;"/><div style="padding:16px;"><h3 style="margin:0 0 6px;">Prawn Mussels Plate. <span style="float:right;">$11.59</span></h3><p style="margin:0;color:#78716c;">Prawn, Tomato, Noodles</p></div></article>
        <article style="background:#fff;border-radius:20px;overflow:hidden;"><img src="${img("images/slider/swiper/3.jpg")}" alt="Black Jumbo Burger" style="width:100%;height:180px;object-fit:cover;"/><div style="padding:16px;"><h3 style="margin:0 0 6px;">Black Jumbo Burger. <span style="float:right;">$8.99</span></h3><p style="margin:0;color:#78716c;">Chicken Patty, Bean Bread</p></div></article>
        <article style="background:#fff;border-radius:20px;overflow:hidden;"><img src="${img("images/testimonials/1.jpg")}" alt="Fried Chicken" style="width:100%;height:180px;object-fit:cover;"/><div style="padding:16px;"><h3 style="margin:0 0 6px;">Fried Chicken. <span style="float:right;">$22.99</span></h3><p style="margin:0;color:#78716c;">Chicken, Olive Oil</p></div></article>
        <article style="background:#fff;border-radius:20px;overflow:hidden;"><img src="${img("images/testimonials/2.jpg")}" alt="Smoothie Fruit Bowl" style="width:100%;height:180px;object-fit:cover;"/><div style="padding:16px;"><h3 style="margin:0 0 6px;">Smoothie Fruit Bowl. <span style="float:right;">$19.99</span></h3><p style="margin:0;color:#78716c;">Raspberries, Strawberries, Granola, Banana</p></div></article>
        <article style="background:#fff;border-radius:20px;overflow:hidden;"><img src="${img("images/testimonials/3.jpg")}" alt="Margarita Pizza" style="width:100%;height:180px;object-fit:cover;"/><div style="padding:16px;"><h3 style="margin:0 0 6px;">Margarita Pizza. <span style="float:right;">$14.99</span></h3><p style="margin:0;color:#78716c;">Wheat Flour, Cheese, Tomato, Onion</p></div></article>
      </div>
    </div>
  </section>
  <section id="dessert" style="padding:64px 28px;background:#1c1917;color:#fff7ed;">
    <div style="max-width:900px;margin:0 auto;text-align:center;">
      <h2 style="font-size:40px;margin:0 0 12px;">Delicious Desserts. The Best things in life are Sweet.</h2>
      <p style="color:#d6d3d1;margin:0;">Chocolate Cupcakes, Caramel Cake, Choco Strawberry Waffle, Tuffle Cake, and more from $7.99.</p>
    </div>
  </section>
  <section id="chefs" style="padding:72px 28px;">
    <div style="max-width:1100px;margin:0 auto;text-align:center;">
      <h2 style="font-size:40px;margin:0 0 24px;">Our Chefs</h2>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;">
        <figure style="margin:0;"><img src="${img("images/team/1.jpg")}" alt="Fig Nelson" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Fig Nelson<span style="display:block;color:#78716c;font-weight:500;">Chef</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/team/2.jpg")}" alt="Josh Clark" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Josh Clark<span style="display:block;color:#78716c;font-weight:500;">Chef</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/team/3.jpg")}" alt="Mary Jane" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Mary Jane<span style="display:block;color:#78716c;font-weight:500;">Chef</span></figcaption></figure>
        <figure style="margin:0;"><img src="${img("images/team/4.jpg")}" alt="Nix Maxwell" style="width:100%;height:220px;object-fit:cover;border-radius:18px;"/><figcaption style="padding-top:10px;font-weight:700;">Nix Maxwell<span style="display:block;color:#78716c;font-weight:500;">Chef</span></figcaption></figure>
      </div>
    </div>
  </section>
  <section id="reserve" style="padding:48px 28px 64px;text-align:center;">
    <h2 style="font-size:34px;margin:0 0 10px;">Feel the Taste.</h2>
    <p style="margin:0 0 8px;color:#57534e;">795 Folsom Ave, Suite 600 San Francisco, CA 94107</p>
    <p style="margin:0 0 8px;color:#57534e;">Sun - Thu | 07:00 - 23:00 · Fri - Sat | 08:00 - 01:00</p>
    <p style="margin:0;font-weight:700;">Mobile: +62-111-222-333</p>
  </section>
</main>
`);

SITE_HTML_BY_KEY.seo = SEO_TEMPLATE;
SITE_HTML_BY_KEY.medical = MEDICAL_TEMPLATE;
SITE_HTML_BY_KEY.restaurant = RESTAURANT_TEMPLATE;

export const CANVAS7_WEBSITE_TEMPLATES = [
  {
    id: "cms-site-seo",
    label: "SEO Website",
    demoPage: "demo-seo.html",
    thumb: getCanvas7ThumbnailUrl("seo.jpg"),
    templateKey: "seo",
    fast: true,
    content: SEO_TEMPLATE,
  },
  {
    id: "cms-site-medical",
    label: "Medical Website",
    demoPage: "demo-medical.html",
    thumb: getCanvas7ThumbnailUrl("medical.jpg"),
    templateKey: "medical",
    fast: true,
    content: MEDICAL_TEMPLATE,
  },
  {
    id: "cms-site-restaurant",
    label: "Restaurant Website",
    demoPage: "demo-restaurant.html",
    thumb: getCanvas7ThumbnailUrl("restaurant.jpg"),
    templateKey: "restaurant",
    fast: true,
    content: RESTAURANT_TEMPLATE,
  },
  {
    id: "cms-site-onepage-default",
    label: "Default One-Page",
    demoPage: "index-onepage.html",
    thumb: getCanvas7IntroImageUrl("images/intro/onepage/homepage1.jpg"),
    templateKey: "onepage-default",
    fast: true,
    content: CANVAS7_ONEPAGE_DEFAULT,
  },
  {
    id: "cms-site-onepage-designer",
    label: "Designer One-Page",
    demoPage: "op-designer.html",
    thumb: getCanvas7IntroImageUrl("images/intro/onepage/designer.jpg"),
    templateKey: "onepage-designer",
    fast: true,
    content: CANVAS7_ONEPAGE_DESIGNER,
  },
  {
    id: "cms-site-onepage-parallax",
    label: "Parallax One-Page",
    demoPage: "op-parallax.html",
    thumb: getCanvas7IntroImageUrl("images/intro/onepage/parallax.jpg"),
    templateKey: "onepage-parallax",
    fast: true,
    content: CANVAS7_ONEPAGE_PARALLAX,
  },
];

export function isSiteTemplateComponent(component: any) {
  const attrs = component?.getAttributes?.() || {};
  if (String(attrs["data-cms-site-template"] || "") === "1") return true;
  const html = String(component?.toHTML?.() || "");
  return /data-cms-site-template/.test(html);
}

export function replaceCanvasWithSiteTemplate(editor: any, root: any) {
  const wrapper = editor?.getWrapper?.();
  if (!wrapper || !root) return;
  const collection = wrapper.components?.();
  const models = [...(collection?.models || [])];
  models.forEach((model: any) => {
    if (model === root) return;
    try {
      model.remove?.();
    } catch {
      // keep the dropped template if a sibling cannot be removed
    }
  });
}

export function registerCanvasWebsiteTemplates(editor: any) {
  const bm = editor?.BlockManager;
  if (!bm) return;
  registerCmsSiteTemplateType(editor);
  Object.keys(SITE_HTML_BY_KEY).forEach((id) => {
    getPreparedSiteTemplateHtml(id);
  });

  CANVAS7_WEBSITE_TEMPLATES.forEach((template) => {
    const templateKey = String((template as { templateKey?: string }).templateKey || "");
    const content = {
      type: CMS_SITE_TEMPLATE_TYPE,
      tagName: "main",
      droppable: false,
      attributes: {
        "data-cms-site-template": "1",
        "data-cms-template": templateKey,
        style: "position:relative;width:100%;background:#fff;min-height:640px;",
      },
    };
    const existing = bm.get(template.id);
    if (existing) {
      existing.set?.("content", content);
      return;
    }
    bm.add(template.id, {
      label: template.label,
      category: CMS_TEMPLATES_CATEGORY,
      media: `<img src="${template.thumb}" alt="${template.label}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`,
      content,
    });
  });

  const bindHoverPrefetch = () => {
    const root = editor.getContainer?.() as HTMLElement | undefined;
    const panel = root?.querySelector?.(".gjs-blocks-c, .gjs-block-categories") as HTMLElement | null;
    if (!panel || panel.dataset.cmsTemplatePrefetch === "1") return;
    panel.dataset.cmsTemplatePrefetch = "1";
    panel.addEventListener("pointerenter", (event) => {
      const blockEl = (event.target as HTMLElement | null)?.closest?.("[data-block], .gjs-block") as HTMLElement | null;
      const blockId = String(blockEl?.getAttribute("data-id") || blockEl?.getAttribute("title") || "");
      const label = String(blockEl?.textContent || "").replace(/\s+/g, " ").trim();
      const matched = CANVAS7_WEBSITE_TEMPLATES.find(
        (template) => template.id === blockId || template.label === blockId || label.includes(template.label)
      );
      if (matched) prefetchSiteTemplateAssets({ id: matched.id });
    }, true);
  };
  editor.on?.("load", bindHoverPrefetch);
  setTimeout(bindHoverPrefetch, 0);
}
