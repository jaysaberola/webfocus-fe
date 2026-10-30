import { buildCmsContactFormMarkup } from "@/lib/cmsContactFormMarkup";
import { isContactUsPageSlug } from "@/lib/isContactUsPageSlug";
import { CMS_TEMPLATES_CATEGORY, CANVAS7_WEBSITE_TEMPLATES } from "./grapesWebsiteTemplates";

export const CMS_CONTACT_US_TEMPLATES_CATEGORY = "Contact Us Templates";

const OFFICE = {
  company: "WebFocus Solutions, Inc.",
  address: "Unit 907-909, Antel Global Corporate Center, Julia Vargas Avenue, Ortigas Center, Pasig City",
  phone: "+63 (2) 8706-5796",
  email: "customercare@webfocus.ph",
};

function formCard(extraStyle = "") {
  return `<div style="padding:28px;border-radius:24px;background:#fff;border:1px solid #e2e8f0;box-shadow:0 20px 44px rgba(15,23,42,.08);${extraStyle}">${buildCmsContactFormMarkup()}</div>`;
}

function infoPanel(dark = false) {
  const bg = dark ? "linear-gradient(180deg,#0f172a,#1e293b)" : "#f8fafc";
  const color = dark ? "#fff" : "#0f172a";
  const muted = dark ? "#cbd5e1" : "#64748b";
  return `
    <div style="padding:28px;border-radius:24px;background:${bg};color:${color};">
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:800;opacity:.85;">Our Office</p>
      <h2 style="margin:0 0 14px;font-size:30px;line-height:1.15;">${OFFICE.company}</h2>
      <p style="margin:0 0 18px;color:${muted};line-height:1.75;">${OFFICE.address}</p>
      <p style="margin:0 0 8px;color:${muted};"><strong style="color:${color};">Phone:</strong> ${OFFICE.phone}</p>
      <p style="margin:0;color:${muted};"><strong style="color:${color};">Email:</strong> ${OFFICE.email}</p>
      <p style="margin:18px 0 0;font-size:13px;color:${muted};">Mon–Fri, 8:00 AM – 5:00 PM (PHT)</p>
    </div>`;
}

type ContactTemplateDef = {
  id: string;
  label: string;
  thumb: string;
  content: string;
};

const CONTACT_TEMPLATES: ContactTemplateDef[] = [
  {
    id: "cms-contact-tpl-split-indigo",
    label: "01 · Split Indigo",
    thumb: "https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="split-indigo" style="padding:48px 20px;background:#fff;font-family:Inter,Segoe UI,sans-serif;">
        <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:.95fr 1.05fr;gap:20px;align-items:stretch;">
          ${infoPanel(true)}
          ${formCard()}
        </div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-centered-hero",
    label: "02 · Centered Hero",
    thumb: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="centered-hero" style="padding:0 0 56px;background:#f8fafc;font-family:Inter,Segoe UI,sans-serif;">
        <header style="padding:72px 24px 48px;text-align:center;background:linear-gradient(135deg,#1d4ed8,#6366f1);color:#fff;">
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;font-weight:800;opacity:.9;">Contact Us</p>
          <h1 style="margin:0 0 12px;font-size:44px;line-height:1.08;">We are here to help</h1>
          <p style="margin:0 auto;max-width:560px;line-height:1.7;color:#e0e7ff;">Sales, support, partnerships, and general questions — send a message and our team will respond as soon as possible.</p>
        </header>
        <div style="max-width:760px;margin:-32px auto 0;padding:0 20px;">${formCard()}</div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-map-focus",
    label: "03 · Map & Form",
    thumb: "https://images.unsplash.com/photo-1524661135-423995f22d0b?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="map-focus" style="font-family:Inter,Segoe UI,sans-serif;">
        <div style="min-height:280px;background:linear-gradient(180deg,#e2e8f0,#f8fafc);display:flex;align-items:center;justify-content:center;padding:32px;text-align:center;">
          <div>
            <h1 style="margin:0 0 8px;font-size:36px;color:#0f172a;">Visit our Pasig office</h1>
            <p style="margin:0;color:#64748b;max-width:520px;">${OFFICE.address}</p>
          </div>
        </div>
        <div style="max-width:1120px;margin:0 auto;padding:32px 20px;display:grid;grid-template-columns:1fr 1.1fr;gap:20px;">
          ${infoPanel(false)}
          ${formCard("box-shadow:none;border-radius:20px;")}
        </div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-corporate-cards",
    label: "04 · Corporate Cards",
    thumb: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="corporate-cards" style="padding:56px 20px;background:#fff;font-family:Inter,Segoe UI,sans-serif;">
        <div style="max-width:1120px;margin:0 auto;">
          <h1 style="margin:0 0 8px;font-size:40px;text-align:center;color:#0f172a;">Contact ${OFFICE.company}</h1>
          <p style="margin:0 auto 28px;max-width:620px;text-align:center;color:#64748b;line-height:1.7;">Choose the channel that fits your request, then submit the inquiry form.</p>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-bottom:24px;">
            <div style="padding:20px;border-radius:18px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Address</strong><p style="margin:8px 0 0;color:#64748b;font-size:14px;line-height:1.6;">${OFFICE.address}</p></div>
            <div style="padding:20px;border-radius:18px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Phone</strong><p style="margin:8px 0 0;color:#64748b;font-size:14px;">${OFFICE.phone}</p></div>
            <div style="padding:20px;border-radius:18px;border:1px solid #e2e8f0;background:#f8fafc;"><strong>Email</strong><p style="margin:8px 0 0;color:#64748b;font-size:14px;">${OFFICE.email}</p></div>
          </div>
          ${formCard()}
        </div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-minimal",
    label: "05 · Minimal Light",
    thumb: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="minimal" style="padding:64px 20px;background:#fff;font-family:Inter,Segoe UI,sans-serif;">
        <div style="max-width:680px;margin:0 auto;">
          <h1 style="margin:0 0 10px;font-size:38px;font-weight:800;color:#0f172a;">Contact</h1>
          <p style="margin:0 0 28px;color:#64748b;line-height:1.7;">Questions about hosting, domains, design, or billing? Send us a message.</p>
          ${formCard("padding:0;border:0;box-shadow:none;background:transparent;")}
        </div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-gradient",
    label: "06 · Gradient Band",
    thumb: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="gradient" style="font-family:Inter,Segoe UI,sans-serif;background:#0f172a;">
        <div style="padding:56px 24px;background:linear-gradient(120deg,#312e81,#2563eb 55%,#0ea5e9);color:#fff;text-align:center;">
          <h1 style="margin:0 0 10px;font-size:42px;">Talk to our team</h1>
          <p style="margin:0;color:#dbeafe;">Customer care, sales, and partnerships</p>
        </div>
        <div style="max-width:900px;margin:-40px auto 48px;padding:0 20px;">${formCard()}</div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-support",
    label: "07 · Support First",
    thumb: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="support" style="padding:48px 20px;background:#f0fdf4;font-family:Inter,Segoe UI,sans-serif;">
        <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:1.05fr .95fr;gap:22px;align-items:start;">
          <div>
            <span style="display:inline-block;padding:6px 12px;border-radius:999px;background:#dcfce7;color:#166534;font-size:12px;font-weight:800;margin-bottom:12px;">Customer Care</span>
            <h1 style="margin:0 0 12px;font-size:38px;color:#14532d;">Need help with your service?</h1>
            <p style="margin:0 0 20px;color:#475569;line-height:1.75;">Our support team handles hosting, domains, billing, and technical questions. Include as much detail as you can so we can assist faster.</p>
            ${infoPanel(false)}
          </div>
          ${formCard()}
        </div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-teal",
    label: "08 · Teal Professional",
    thumb: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="teal" style="padding:56px 20px;background:#ecfeff;font-family:Inter,Segoe UI,sans-serif;">
        <div style="max-width:1120px;margin:0 auto;border-radius:28px;overflow:hidden;display:grid;grid-template-columns:1fr 1.15fr;background:#fff;border:1px solid #99f6e4;">
          <div style="padding:32px;background:linear-gradient(180deg,#0f766e,#115e59);color:#fff;">
            <h1 style="margin:0 0 12px;font-size:34px;">Contact Us</h1>
            <p style="margin:0 0 20px;color:#ccfbf1;line-height:1.7;">${OFFICE.company}</p>
            <p style="margin:0 0 8px;color:#99f6e4;">${OFFICE.phone}</p>
            <p style="margin:0;color:#99f6e4;">${OFFICE.email}</p>
          </div>
          <div style="padding:28px;">${buildCmsContactFormMarkup({ title: "Request a callback", hint: "We typically respond within one business day." })}</div>
        </div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-warm",
    label: "09 · Warm Accent",
    thumb: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="warm" style="padding:52px 20px;background:#fff7ed;font-family:Inter,Segoe UI,sans-serif;">
        <div style="max-width:1040px;margin:0 auto;">
          <div style="text-align:center;margin-bottom:28px;">
            <h1 style="margin:0 0 10px;font-size:40px;color:#9a3412;">Let's connect</h1>
            <p style="margin:0;color:#78716c;">Partnerships, quotes, and product questions welcome.</p>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
            ${formCard("border-color:#fed7aa;")}
            <div style="padding:28px;border-radius:24px;background:#ffedd5;border:1px solid #fdba74;">
              <h3 style="margin:0 0 12px;color:#9a3412;">Office hours</h3>
              <p style="margin:0 0 16px;color:#78350f;line-height:1.7;">Monday – Friday<br/>8:00 AM – 5:00 PM (PHT)</p>
              <p style="margin:0;color:#78350f;font-size:14px;line-height:1.7;">${OFFICE.address}</p>
            </div>
          </div>
        </div>
      </div>`,
  },
  {
    id: "cms-contact-tpl-sidebar-light",
    label: "10 · Sidebar Light",
    thumb: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=640&q=80",
    content: `
      <div class="public-contact cms-contact-page" data-cms-contact-page="1" data-cms-contact-template="sidebar-light" style="padding:48px 20px;background:#f1f5f9;font-family:Inter,Segoe UI,sans-serif;">
        <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:320px 1fr;gap:20px;align-items:start;">
          <aside>${infoPanel(false)}</aside>
          <main>${formCard()}</main>
        </div>
      </div>`,
  },
];

export function registerContactUsPageTemplates(editor: any) {
  const bm = editor?.BlockManager;
  if (!bm) return;

  CONTACT_TEMPLATES.forEach((template) => {
    const existing = bm.get(template.id);
    const payload = {
      label: template.label,
      category: CMS_CONTACT_US_TEMPLATES_CATEGORY,
      media: `<img src="${template.thumb}" alt="${template.label}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`,
      content: template.content.trim(),
    };
    if (existing) {
      existing.set(payload);
      return;
    }
    bm.add(template.id, payload);
  });
}

export function syncContactUsTemplateBlockVisibility(editor: any, pageSlug?: string) {
  const bm = editor?.BlockManager;
  if (!bm) return;

  const contactPage = isContactUsPageSlug(pageSlug);

  CONTACT_TEMPLATES.forEach((template) => {
    bm.get(template.id)?.set("visible", contactPage);
  });

  CANVAS7_WEBSITE_TEMPLATES.forEach((template) => {
    bm.get(template.id)?.set("visible", !contactPage);
  });
}

export function applyContactUsPageSlugPolicy(editor: any, pageSlug?: string) {
  registerContactUsPageTemplates(editor);
  syncContactUsTemplateBlockVisibility(editor, pageSlug);
}
