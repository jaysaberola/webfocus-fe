"use client";

import { useEffect, useRef, useState } from "react";
import grapesjs from "grapesjs";
import grapesjsPresetWebpage from "grapesjs-preset-webpage";
import grapesjsBlocksBasic from "grapesjs-blocks-basic";
import grapesjsPluginForms from "grapesjs-plugin-forms";
import {
  cmsStudioCanvasCss,
  configureStudioCategories,
  enhanceFoundationBlocks,
  normalizeStudioCategory,
  registerAdvancedCmsBlocks,
  resolveCmsBlockMedia,
} from "./grapesStudio";
import {
  filterBlockPanel,
  getComponentBreadcrumb,
  isEditorCanvasEmpty,
  installCanvasInteractionGuards,
  registerStudioEditorFeatures,
} from "./grapesStudioFeatures";
import {
  activateStudioTextFormatting,
  deactivateStudioTextFormatting,
  isEditableTextComponent,
  mountStudioRteToolbar,
  registerStudioRteActions,
  runStudioRteAction,
} from "./grapesStudioRteToolbar";
import GrapesRteDocBar from "./GrapesRteDocBar";

type GrapesEditorProps = {
  value?: string;
  onChange: (content: string) => void;
  height?: number;
};

type StudioDeviceKey = "desktop" | "tablet" | "mobile";

const STUDIO_DEVICE_LABELS: Record<StudioDeviceKey, string> = {
  desktop: "Desktop",
  tablet: "Tablet",
  mobile: "Mobile",
};

const STUDIO_DEVICE_KEYS: Record<string, StudioDeviceKey> = {
  Desktop: "desktop",
  Tablet: "tablet",
  Mobile: "mobile",
  desktop: "desktop",
  tablet: "tablet",
  mobile: "mobile",
};

const extractContentParts = (html: string): { body: string; css: string; js: string } => {
  const raw = html || "";
  const styleMatch = raw.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const scriptMatch = raw.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  const css = styleMatch?.[1] || "";
  const js = scriptMatch?.[1] || "";

  let body = raw;
  if (styleMatch?.[0]) body = body.replace(styleMatch[0], "");
  if (scriptMatch?.[0]) body = body.replace(scriptMatch[0], "");

  return { body: body.trim(), css, js };
};

const extractFileList = (input: any): File[] => {
  if (!input) return [];
  if (input instanceof File) return [input];
  if (input instanceof FileList) return Array.from(input);
  if (Array.isArray(input)) return input.filter((item) => item instanceof File);

  const dropFiles = input?.dataTransfer?.files;
  if (dropFiles instanceof FileList) return Array.from(dropFiles);

  const targetFiles = input?.target?.files;
  if (targetFiles instanceof FileList) return Array.from(targetFiles);

  return [];
};

const normalizePickerColor = (value: string) => {
  const raw = String(value || "").trim();
  if (/^#([0-9a-f]{6})$/i.test(raw)) return raw.toLowerCase();
  if (/^#([0-9a-f]{3})$/i.test(raw)) {
    const match = raw.match(/^#([0-9a-f])([0-9a-f])([0-9a-f])$/i);
    return match ? `#${match[1]}${match[1]}${match[2]}${match[2]}${match[3]}${match[3]}`.toLowerCase() : "#000000";
  }
  const rgbMatch = raw.match(/rgba?\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
  if (rgbMatch) {
    const toHex = (part: string) => Math.max(0, Math.min(255, Number(part) || 0)).toString(16).padStart(2, "0");
    return `#${toHex(rgbMatch[1])}${toHex(rgbMatch[2])}${toHex(rgbMatch[3])}`;
  }
  return "#000000";
};

const isNearBlackColor = (value: string) => normalizePickerColor(value) === "#000000";

let activeColorPopoverCleanup: (() => void) | null = null;

const registerCmsBlocks = (editor: any) => {
  const bm = editor.BlockManager;

  const add = (id: string, config: any) => {
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

  add("cms-hero", {
    label: "Hero Section",
    category: "CMS Sections",
    attributes: { class: "fa fa-flag" },
    content: `
      <section class="cms-hero" style="padding:64px 24px;background:#f8fafc;text-align:center;">
        <div style="max-width:900px;margin:0 auto;">
          <h1 style="font-size:42px;line-height:1.2;margin:0 0 12px;">Build Beautiful Pages Faster</h1>
          <p style="font-size:18px;color:#475569;margin:0 0 24px;">Drop in ready sections and customize text, colors, and spacing in seconds.</p>
          <a href="#" style="display:inline-block;background:#0d6efd;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;">Get Started</a>
        </div>
      </section>
    `,
  });

  add("cms-about", {
    label: "About Section",
    category: "CMS Sections",
    attributes: { class: "fa fa-info-circle" },
    content: `
      <section style="padding:56px 24px;">
        <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:center;">
          <img src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200" alt="About" style="width:100%;border-radius:12px;object-fit:cover;min-height:260px;"/>
          <div>
            <h2 style="margin:0 0 12px;">About Our Brand</h2>
            <p style="margin:0;color:#475569;line-height:1.7;">Share your company story, mission, and what makes your team different.</p>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-features-3", {
    label: "Features 3-Column",
    category: "CMS Sections",
    attributes: { class: "fa fa-th-large" },
    content: `
      <section style="padding:56px 24px;background:#fff;">
        <div style="max-width:1100px;margin:0 auto;">
          <h2 style="text-align:center;margin:0 0 22px;">Why Choose Us</h2>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:12px;"><h3 style="margin-top:0;">Fast Setup</h3><p style="margin:0;color:#475569;">Launch quickly with ready-made building blocks.</p></div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:12px;"><h3 style="margin-top:0;">Responsive</h3><p style="margin:0;color:#475569;">Layouts adapt naturally across desktop and mobile.</p></div>
            <div style="padding:18px;border:1px solid #e2e8f0;border-radius:12px;"><h3 style="margin-top:0;">Customizable</h3><p style="margin:0;color:#475569;">Edit text, spacing, and visuals with full control.</p></div>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-testimonials", {
    label: "Testimonials",
    category: "CMS Sections",
    attributes: { class: "fa fa-commenting" },
    content: `
      <section style="padding:56px 24px;background:#f8fafc;">
        <div style="max-width:1000px;margin:0 auto;">
          <h2 style="text-align:center;margin:0 0 20px;">What Customers Say</h2>
          <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;">
            <blockquote style="margin:0;padding:20px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;">“Great service and excellent quality.”<br/><strong>- Customer A</strong></blockquote>
            <blockquote style="margin:0;padding:20px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;">“Very easy to use and manage content.”<br/><strong>- Customer B</strong></blockquote>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-pricing", {
    label: "Pricing Cards",
    category: "CMS Sections",
    attributes: { class: "fa fa-tags" },
    content: `
      <section style="padding:56px 24px;">
        <div style="max-width:1000px;margin:0 auto;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;">
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:18px;"><h3>Starter</h3><p style="font-size:28px;font-weight:700;margin:8px 0;">₱19</p><p style="color:#475569;">Great for small teams.</p></div>
          <div style="border:2px solid #0d6efd;border-radius:12px;padding:18px;"><h3>Pro</h3><p style="font-size:28px;font-weight:700;margin:8px 0;">₱49</p><p style="color:#475569;">Best for growing teams.</p></div>
          <div style="border:1px solid #e2e8f0;border-radius:12px;padding:18px;"><h3>Business</h3><p style="font-size:28px;font-weight:700;margin:8px 0;">₱99</p><p style="color:#475569;">Advanced needs and support.</p></div>
        </div>
      </section>
    `,
  });

  add("cms-faq", {
    label: "FAQ",
    category: "CMS Sections",
    attributes: { class: "fa fa-question-circle" },
    content: `
      <section style="padding:56px 24px;background:#fff;">
        <div style="max-width:900px;margin:0 auto;">
          <h2 style="margin:0 0 14px;">Frequently Asked Questions</h2>
          <details open style="padding:12px 0;border-bottom:1px solid #e2e8f0;"><summary style="font-weight:600;cursor:pointer;">How do I update content?</summary><p style="margin:8px 0 0;color:#475569;">Use the visual editor and click save when done.</p></details>
          <details style="padding:12px 0;border-bottom:1px solid #e2e8f0;"><summary style="font-weight:600;cursor:pointer;">Is this mobile-friendly?</summary><p style="margin:8px 0 0;color:#475569;">Yes, all section templates are responsive-ready.</p></details>
          <details style="padding:12px 0;"><summary style="font-weight:600;cursor:pointer;">Can I add custom code?</summary><p style="margin:8px 0 0;color:#475569;">Yes, use the code editor option in the top panel.</p></details>
        </div>
      </section>
    `,
  });

  add("cms-gallery-4", {
    label: "Image Gallery",
    category: "CMS Media",
    attributes: { class: "fa fa-image" },
    content: `
      <section style="padding:40px 24px;">
        <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;">
          <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800" alt="Gallery 1" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
          <img src="https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=800" alt="Gallery 2" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
          <img src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800" alt="Gallery 3" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
          <img src="https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?w=800" alt="Gallery 4" style="width:100%;border-radius:10px;object-fit:cover;height:160px;" />
        </div>
      </section>
    `,
  });

  add("cms-cta", {
    label: "Call To Action",
    category: "CMS Sections",
    attributes: { class: "fa fa-bullhorn" },
    content: `
      <section style="padding:48px 24px;background:#0f172a;color:#fff;">
        <div style="max-width:960px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <h2 style="margin:0 0 8px;">Ready to get started?</h2>
            <p style="margin:0;color:#cbd5e1;">Create your next page with reusable visual blocks.</p>
          </div>
          <a href="#" style="display:inline-block;background:#fff;color:#0f172a;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;">Contact Us</a>
        </div>
      </section>
    `,
  });

  add("cms-header", {
    label: "Header / Navbar",
    category: "CMS Sections",
    attributes: { class: "fa fa-header" },
    content: `
      <header style="position:sticky;top:0;z-index:20;background:#0f172a;color:#fff;padding:14px 24px;">
        <div style="max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
          <a href="#" style="color:#fff;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:.4px;">Restaurant Place</a>
          <nav style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
            <a href="#" style="color:#e2e8f0;text-decoration:none;">Home</a>
            <a href="#" style="color:#e2e8f0;text-decoration:none;">Menu</a>
            <a href="#" style="color:#e2e8f0;text-decoration:none;">About</a>
            <a href="#" style="color:#e2e8f0;text-decoration:none;">Contact</a>
            <a href="#" style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;padding:8px 14px;border-radius:999px;font-weight:600;">Book Now</a>
          </nav>
        </div>
      </header>
    `,
  });

  add("cms-footer", {
    label: "Footer",
    category: "CMS Sections",
    attributes: { class: "fa fa-window-minimize" },
    content: `
      <footer style="background:#111827;color:#cbd5e1;padding:34px 24px;">
        <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:18px;">
          <div>
            <h3 style="margin:0 0 10px;color:#fff;">Restaurant Place</h3>
            <p style="margin:0;line-height:1.7;">Serve great food and warm experiences. Update this content with your address and contact details.</p>
          </div>
          <div>
            <h4 style="margin:0 0 10px;color:#fff;">Quick Links</h4>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Home</a></p>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Menu</a></p>
            <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Contact</a></p>
          </div>
          <div>
            <h4 style="margin:0 0 10px;color:#fff;">Follow</h4>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Facebook</a></p>
            <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Instagram</a></p>
            <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Twitter</a></p>
          </div>
        </div>
        <div style="max-width:1120px;margin:18px auto 0;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:13px;color:#94a3b8;">© 2026 Restaurant Place. All rights reserved.</div>
      </footer>
    `,
  });

  add("cms-header-hero-combo", {
    label: "Header + Hero Combo",
    category: "CMS Sections",
    attributes: { class: "fa fa-object-group" },
    content: `
      <section>
        <header style="position:relative;z-index:10;background:#0f172a;color:#fff;padding:14px 24px;">
          <div style="max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;">
            <a href="#" style="color:#fff;text-decoration:none;font-size:20px;font-weight:700;letter-spacing:.4px;">Restaurant Place</a>
            <nav style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">
              <a href="#" style="color:#e2e8f0;text-decoration:none;">Home</a>
              <a href="#" style="color:#e2e8f0;text-decoration:none;">Menu</a>
              <a href="#" style="color:#e2e8f0;text-decoration:none;">About</a>
              <a href="#" style="color:#e2e8f0;text-decoration:none;">Contact</a>
            </nav>
          </div>
        </header>
        <div style="padding:74px 24px;background:linear-gradient(135deg,#111827,#1f2937);color:#fff;text-align:center;">
          <div style="max-width:900px;margin:0 auto;">
            <p style="margin:0 0 8px;color:#93c5fd;letter-spacing:.08em;text-transform:uppercase;font-size:12px;">Welcome</p>
            <h1 style="font-size:44px;line-height:1.2;margin:0 0 12px;">Good Food, Great Moments</h1>
            <p style="font-size:18px;color:#d1d5db;margin:0 0 24px;">Craft your homepage quickly using prebuilt blocks, then customize every detail.</p>
            <a href="#" style="display:inline-block;background:#f43f5e;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;">Explore Menu</a>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-footer-contact-strip", {
    label: "Footer + Contact Strip",
    category: "CMS Sections",
    attributes: { class: "fa fa-address-card" },
    content: `
      <section>
        <div style="background:#f8fafc;padding:14px 24px;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
          <div style="max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#334155;font-size:14px;">
            <span>📍 123 Main Street, Quezon City</span>
            <span>📞 +63 900 123 4567</span>
            <span>✉️ hello@restaurantplace.com</span>
          </div>
        </div>
        <footer style="background:#111827;color:#cbd5e1;padding:34px 24px;">
          <div style="max-width:1120px;margin:0 auto;display:grid;grid-template-columns:2fr 1fr 1fr;gap:18px;">
            <div>
              <h3 style="margin:0 0 10px;color:#fff;">Restaurant Place</h3>
              <p style="margin:0;line-height:1.7;">Serve great food and warm experiences. Update this content with your address and contact details.</p>
            </div>
            <div>
              <h4 style="margin:0 0 10px;color:#fff;">Quick Links</h4>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Home</a></p>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Menu</a></p>
              <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Contact</a></p>
            </div>
            <div>
              <h4 style="margin:0 0 10px;color:#fff;">Follow</h4>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Facebook</a></p>
              <p style="margin:0 0 8px;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Instagram</a></p>
              <p style="margin:0;"><a href="#" style="color:#cbd5e1;text-decoration:none;">Twitter</a></p>
            </div>
          </div>
          <div style="max-width:1120px;margin:18px auto 0;padding-top:14px;border-top:1px solid rgba(255,255,255,0.15);font-size:13px;color:#94a3b8;">© 2026 Restaurant Place. All rights reserved.</div>
        </footer>
      </section>
    `,
  });

  add("cms-map", {
    label: "Map Embed",
    category: "CMS Media",
    attributes: { class: "fa fa-map-marker" },
    content: `
      <section style="padding:24px;">
        <div style="max-width:1000px;margin:0 auto;">
          <iframe
            src="https://www.google.com/maps?q=Manila&output=embed"
            style="width:100%;height:320px;border:0;border-radius:10px;"
            loading="lazy"
            allowfullscreen
          ></iframe>
        </div>
      </section>
    `,
  });

  add("cms-carousel-selection", {
    label: "Carousel (Selection Dots)",
    category: "CMS Media",
    attributes: { class: "fa fa-sliders" },
    content: `
      <section style="padding:40px 24px;background:#f8fafc;">
        <div style="max-width:980px;margin:0 auto;">
          <style>
            .cms-car{position:relative;overflow:hidden;border-radius:14px;background:#0f172a}
            .cms-car-track{display:flex;transition:transform .45s ease}
            .cms-car-slide{width:100%;flex:0 0 100%;position:relative;min-height:320px}
            .cms-car-slide img{width:100%;height:320px;object-fit:cover;display:block;opacity:.9}
            .cms-car-cap{position:absolute;left:24px;bottom:20px;color:#fff;max-width:70%}
            .cms-car-cap h3{margin:0 0 6px;font-size:28px}
            .cms-car-cap p{margin:0;color:#e2e8f0}
            .cms-car-dots{display:flex;justify-content:center;gap:8px;margin-top:12px}
            .cms-car-dot{width:12px;height:12px;border-radius:999px;background:#cbd5e1;cursor:pointer;display:inline-block;border:0;padding:0}
            .cms-car-dot.is-active{background:#0d6efd}
            .cms-car-arrow{position:absolute;top:50%;transform:translateY(-50%);width:38px;height:38px;border-radius:999px;border:0;background:rgba(15,23,42,.62);color:#fff;display:flex;align-items:center;justify-content:center;font-size:20px;cursor:pointer;z-index:2}
            .cms-car-arrow:hover{background:rgba(15,23,42,.82)}
            .cms-car-arrow.prev{left:10px}
            .cms-car-arrow.next{right:10px}
          </style>
          <div class="cms-car js-cms-car" data-autoplay="true" data-interval="4000">
            <div class="cms-car-track">
              <div class="cms-car-slide">
                <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1400" alt="Slide 1"/>
                <div class="cms-car-cap"><h3>Freshly Prepared</h3><p>Highlight your latest offer here.</p></div>
              </div>
              <div class="cms-car-slide">
                <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1400" alt="Slide 2"/>
                <div class="cms-car-cap"><h3>Family Favorites</h3><p>Showcase bestselling dishes.</p></div>
              </div>
              <div class="cms-car-slide">
                <img src="https://images.unsplash.com/photo-1514326640560-7d063ef2aed5?w=1400" alt="Slide 3"/>
                <div class="cms-car-cap"><h3>Reserve a Table</h3><p>Add your CTA and booking link.</p></div>
              </div>
            </div>
            <button type="button" class="cms-car-arrow prev" aria-label="Previous slide">❮</button>
            <button type="button" class="cms-car-arrow next" aria-label="Next slide">❯</button>
            <div class="cms-car-dots">
              <button type="button" class="cms-car-dot" aria-label="Slide 1"></button>
              <button type="button" class="cms-car-dot" aria-label="Slide 2"></button>
              <button type="button" class="cms-car-dot" aria-label="Slide 3"></button>
            </div>
          </div>
          <script>
            (function () {
              var cars = document.querySelectorAll('.js-cms-car');
              cars.forEach(function (car) {
                if (car.getAttribute('data-bound') === '1') return;
                car.setAttribute('data-bound', '1');

                var track = car.querySelector('.cms-car-track');
                var slides = Array.prototype.slice.call(car.querySelectorAll('.cms-car-slide'));
                var dots = Array.prototype.slice.call(car.querySelectorAll('.cms-car-dot'));
                var prevBtn = car.querySelector('.cms-car-arrow.prev');
                var nextBtn = car.querySelector('.cms-car-arrow.next');
                var idx = 0;
                var timer = null;
                var interval = Number(car.getAttribute('data-interval') || 4000);
                var autoplay = String(car.getAttribute('data-autoplay') || 'true') !== 'false';

                var render = function () {
                  if (!track || !slides.length) return;
                  track.style.transform = 'translateX(-' + idx * 100 + '%)';
                  dots.forEach(function (d, i) {
                    if (i === idx) d.classList.add('is-active');
                    else d.classList.remove('is-active');
                  });
                };

                var goTo = function (nextIndex) {
                  if (!slides.length) return;
                  idx = (nextIndex + slides.length) % slides.length;
                  render();
                };

                var start = function () {
                  if (!autoplay || slides.length < 2) return;
                  if (timer) window.clearInterval(timer);
                  timer = window.setInterval(function () { goTo(idx + 1); }, Math.max(1500, interval));
                };

                var stop = function () {
                  if (!timer) return;
                  window.clearInterval(timer);
                  timer = null;
                };

                if (prevBtn) prevBtn.addEventListener('click', function () { goTo(idx - 1); start(); });
                if (nextBtn) nextBtn.addEventListener('click', function () { goTo(idx + 1); start(); });

                dots.forEach(function (dot, i) {
                  dot.addEventListener('click', function () {
                    goTo(i);
                    start();
                  });
                });

                car.addEventListener('mouseenter', stop);
                car.addEventListener('mouseleave', start);

                render();
                start();
              });
            })();
          </script>
        </div>
      </section>
    `,
  });

  add("cms-slicer-slider", {
    label: "Slicer / Slider Section",
    category: "CMS Sections",
    attributes: { class: "fa fa-columns" },
    content: `
      <section style="padding:56px 24px;background:#fff;">
        <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1.2fr .8fr;gap:18px;align-items:stretch;">
          <div style="position:relative;overflow:hidden;border-radius:14px;min-height:300px;">
            <img src="https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1400" alt="Slicer Visual" style="width:100%;height:100%;object-fit:cover;display:block;"/>
            <div style="position:absolute;inset:0;background:linear-gradient(120deg,rgba(15,23,42,.62),rgba(15,23,42,.12));"></div>
            <div style="position:absolute;left:20px;bottom:18px;color:#fff;max-width:70%;">
              <h3 style="margin:0 0 6px;font-size:30px;">Feature Spotlight</h3>
              <p style="margin:0;color:#e2e8f0;">Use this as a sliced hero panel or promo area.</p>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;">
            <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;">
              <h4 style="margin:0 0 6px;">Slice 1</h4>
              <p style="margin:0;color:#475569;">Add text, links, and short details.</p>
            </div>
            <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;">
              <h4 style="margin:0 0 6px;">Slice 2</h4>
              <p style="margin:0;color:#475569;">Perfect for highlights and quick stats.</p>
            </div>
            <div style="padding:14px;border:1px solid #e2e8f0;border-radius:10px;">
              <h4 style="margin:0 0 6px;">Slice 3</h4>
              <p style="margin:0;color:#475569;">Duplicate this card to add more slices.</p>
            </div>
          </div>
        </div>
      </section>
    `,
  });

  add("cms-spacer", {
    label: "Spacer",
    category: "CMS Utility",
    attributes: { class: "fa fa-arrows-v" },
    content: `<div style="height:40px;"></div>`,
  });

  add("cms-divider", {
    label: "Divider",
    category: "CMS Utility",
    attributes: { class: "fa fa-minus" },
    content: `<hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;"/>`,
  });

  add("cms-social-links", {
    label: "Social Links",
    category: "CMS Utility",
    attributes: { class: "fa fa-share-alt" },
    content: `
      <div style="display:flex;gap:12px;justify-content:center;padding:12px 0;">
        <a href="#" style="text-decoration:none;">Facebook</a>
        <a href="#" style="text-decoration:none;">Instagram</a>
        <a href="#" style="text-decoration:none;">Twitter</a>
      </div>
    `,
  });

  add("cms-quick-links", {
    label: "Quick Links",
    category: "CMS Utility",
    attributes: { class: "fa fa-link" },
    content: `
      <section style="padding:20px 24px;">
        <div style="max-width:900px;margin:0 auto;padding:18px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
          <h4 style="margin:0 0 12px;">Quick Links</h4>
          <div style="display:flex;flex-wrap:wrap;gap:10px;">
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Home</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Menu</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Promos</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">About</a>
            <a href="#" style="display:inline-block;padding:8px 12px;border-radius:999px;background:#f1f5f9;color:#0f172a;text-decoration:none;">Contact</a>
          </div>
        </div>
      </section>
    `,
  });
};

const DEFAULT_STUDIO_MARKUP = `
  <main style="min-height:100vh;padding:72px 24px;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);color:#0f172a;">
    <section style="max-width:980px;margin:0 auto;padding:36px;border-radius:32px;background:#ffffff;border:1px solid #e2e8f0;box-shadow:0 24px 60px rgba(15,23,42,.08);">
      <span style="display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;">CMS Studio</span>
      <h1 style="margin:18px 0 12px;font-size:52px;line-height:1.04;max-width:12ch;">Start with a polished page block.</h1>
      <p style="margin:0;max-width:62ch;font-size:18px;line-height:1.8;color:#64748b;">Open the block library and drag in page starters, hero sections, testimonials, service grids, forms, pricing tables, and media layouts.</p>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin-top:28px;">
        <div style="padding:18px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:800;">Page starters</div><div style="margin-top:8px;font-size:20px;font-weight:800;">Drop in a full starter layout.</div></div>
        <div style="padding:18px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:800;">Responsive preview</div><div style="margin-top:8px;font-size:20px;font-weight:800;">Switch between desktop, tablet, and mobile.</div></div>
        <div style="padding:18px;border-radius:22px;background:#f8fafc;border:1px solid #e2e8f0;"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:800;">Custom code</div><div style="margin-top:8px;font-size:20px;font-weight:800;">Fine-tune HTML, CSS, and JS when needed.</div></div>
      </div>
    </section>
  </main>
`;

export default function GrapesEditor({ value = "", onChange, height = 800 }: GrapesEditorProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<any>(null);
  const lastEmittedRef = useRef<string>("");
  const jsRef = useRef<string>("");
  const emitTimerRef = useRef<number | null>(null);
  const fullscreenSenderRef = useRef<any>(null);
  const studioHeightRef = useRef(height);
  const isLeftSidebarHiddenRef = useRef(true);
  const isRightSidebarHiddenRef = useRef(true);
  const leftBlocksRef = useRef<HTMLDivElement | null>(null);
  const leftLayersRef = useRef<HTMLDivElement | null>(null);
  const rightStylesRef = useRef<HTMLDivElement | null>(null);
  const rightTraitsRef = useRef<HTMLDivElement | null>(null);
  const sidebarRefreshTimeoutRef = useRef<number | null>(null);
  const blockSearchQueryRef = useRef("");
  const rteHostRef = useRef<HTMLDivElement | null>(null);
  const rteInstanceRef = useRef<any>(null);
  const rteToolbarCleanupRef = useRef<(() => void) | null>(null);
  const [activeLeftPanel, setActiveLeftPanel] = useState<"blocks" | "layers">("blocks");
  const [activeRightPanel, setActiveRightPanel] = useState<"styles" | "settings">("styles");
  const [isLeftSidebarHidden, setIsLeftSidebarHidden] = useState(true);
  const [isRightSidebarHidden, setIsRightSidebarHidden] = useState(true);
  const [studioHeight, setStudioHeight] = useState(height);
  const [editorReady, setEditorReady] = useState(false);
  const [activeDevice, setActiveDevice] = useState<StudioDeviceKey>("desktop");
  const [blockSearch, setBlockSearch] = useState("");
  const [selectionLabel, setSelectionLabel] = useState("");
  const [hasSelection, setHasSelection] = useState(false);
  const [canvasEmpty, setCanvasEmpty] = useState(true);
  const [canvasZoom, setCanvasZoom] = useState(100);
  const [textToolbarVisible, setTextToolbarVisible] = useState(false);
  const [isShellFullscreen, setIsShellFullscreen] = useState(false);

  useEffect(() => {
    studioHeightRef.current = studioHeight;
  }, [studioHeight]);

  useEffect(() => {
    isLeftSidebarHiddenRef.current = isLeftSidebarHidden;
  }, [isLeftSidebarHidden]);

  useEffect(() => {
    isRightSidebarHiddenRef.current = isRightSidebarHidden;
  }, [isRightSidebarHidden]);

  useEffect(() => {
    document.body.classList.remove("cms-code-modal-open");
    document.querySelectorAll("body > .gjs-mdl-container.cms-code-modal-overlay").forEach((node) => {
      node.remove();
    });
  }, []);

  useEffect(() => {
    const computeHeight = () => {
      const shell = shellRef.current;
      if (shell && document.fullscreenElement === shell) return;
      setStudioHeight(Math.max(640, window.innerHeight - 220));
    };
    computeHeight();
    window.addEventListener("resize", computeHeight);
    return () => window.removeEventListener("resize", computeHeight);
  }, []);

  useEffect(() => {
    if (!hostRef.current || editorRef.current) return;

    let editorAlive = true;
    const pendingTimers: number[] = [];
    const scheduleTimer = (fn: () => void, delay: number) => {
      const id = window.setTimeout(() => {
        const index = pendingTimers.indexOf(id);
        if (index >= 0) pendingTimers.splice(index, 1);
        if (!editorAlive) return;
        fn();
      }, delay);
      pendingTimers.push(id);
    };

    const { body, css, js } = extractContentParts(value);
    const previewFrameMinHeight = `${Math.max(680, studioHeight - 120)}px`;
    jsRef.current = js;

    const editor = grapesjs.init({
      container: hostRef.current,
      fromElement: false,
      height: "100%",
      noticeOnUnload: false,
      storageManager: false,
      dragMode: "absolute",
      forceClass: false,
      avoidInlineStyle: false,
      showOffsets: true,
      richTextEditor: {
        adjustToolbar: false,
        actions: ["bold", "italic", "underline", "strikethrough", "link"],
      },
      plugins: [grapesjsPresetWebpage, grapesjsBlocksBasic, grapesjsPluginForms],
      deviceManager: {
        devices: [
          { id: "desktop", name: "Desktop", width: "", height: "auto", minHeight: previewFrameMinHeight },
          { id: "tablet", name: "Tablet", width: "834px", widthMedia: "992px", height: "auto", minHeight: previewFrameMinHeight },
          { id: "mobile", name: "Mobile", width: "390px", widthMedia: "480px", height: "auto", minHeight: previewFrameMinHeight },
        ],
      },
      canvas: {
        styles: [],
        scrollableCanvas: true,
        infiniteCanvas: false,
      },
      canvasCss: cmsStudioCanvasCss,
      assetManager: {
        upload: false,
        uploadFile: async (event: any) => {
          const files = extractFileList(event);
          if (!files.length) return;

          const addLocalAssets = () => {
            const localAssets = files
              .filter((file) => String(file.type || "").startsWith("image/"))
              .map((file) => ({
                src: URL.createObjectURL(file),
                type: "image",
                name: file.name,
              }));

            if (localAssets.length) {
              editor.AssetManager.add(localAssets);
            }

            return localAssets.length > 0;
          };

          const formData = new FormData();
          files.forEach((file) => formData.append("files", file));

          try {
            const res = await fetch("/api/assets/upload", {
              method: "POST",
              body: formData,
            });

            if (!res.ok) {
              throw new Error("Upload failed");
            }

            const data = await res.json();
            const urls = Array.isArray(data?.urls) ? data.urls.filter(Boolean) : [];

            if (!urls.length) {
              addLocalAssets();
              return;
            }

            editor.AssetManager.add(
              urls.map((url: string) => ({
                src: url,
                type: "image",
              }))
            );
          } catch (error) {
            console.error("Grapes asset upload failed:", error);
            const usedFallback = addLocalAssets();
            if (!usedFallback && typeof window !== "undefined") {
              window.alert("Asset upload failed. Please try again.");
            }
          }
        },
      },
      codeManager: {
        optsCodeViewer: {
          readOnly: 0,
          lineWrapping: true,
          autoRefresh: true,
        },
      },
      selectorManager: { componentFirst: true },
      panels: { defaults: [] },
      blockManager: leftBlocksRef.current
        ? {
            appendTo: leftBlocksRef.current,
          }
        : undefined,
      layerManager: leftLayersRef.current
        ? {
            appendTo: leftLayersRef.current,
          }
        : undefined,
      styleManager: rightStylesRef.current
        ? {
            appendTo: rightStylesRef.current,
          }
        : undefined,
      traitManager: rightTraitsRef.current
        ? {
            appendTo: rightTraitsRef.current,
          }
        : undefined,
      components: body || DEFAULT_STUDIO_MARKUP,
      style: css,
    });

    editor.StyleManager.addType("color", {
      onRender() {
        // Prevent GrapesJS PropertyColorView from injecting its default text/color input.
      },
      setValue(this: any, value: string) {
        const model = this.model;
        const result = typeof value === "undefined" || value === "" ? model.getDefaultValue() : value;

        if (this.update) {
          this.__update(result);
          return;
        }

        this.__setValueInput(result);
      },
      create({ change }: any) {
        const root = document.createElement("div");
        root.className = "cms-gjs-color-field";

        const pickerButton = document.createElement("button");
        pickerButton.type = "button";
        pickerButton.className = "cms-gjs-color-field__picker";
        pickerButton.title = "Choose color";
        pickerButton.setAttribute("aria-haspopup", "dialog");
        pickerButton.setAttribute("aria-expanded", "false");

        const pickerMeta = document.createElement("span");
        pickerMeta.className = "cms-gjs-color-field__meta";

        const pickerPreview = document.createElement("span");
        pickerPreview.className = "cms-gjs-color-field__preview";
        pickerMeta.appendChild(pickerPreview);

        const pickerValue = document.createElement("span");
        pickerValue.className = "cms-gjs-color-field__value";
        pickerValue.textContent = "#000000";
        pickerMeta.appendChild(pickerValue);

        const pickerAffordance = document.createElement("span");
        pickerAffordance.className = "cms-gjs-color-field__affordance";
        pickerAffordance.setAttribute("aria-hidden", "true");

        pickerButton.appendChild(pickerMeta);
        pickerButton.appendChild(pickerAffordance);

        const state = {
          cleanup: null as null | (() => void),
          picker: null as any,
          popoverInput: null as HTMLInputElement | null,
          isSyncingExternal: false,
        };

        const closePopover = () => {
          state.cleanup?.();
        };

        const openPicker = async (event?: Event) => {
          event?.preventDefault?.();
          event?.stopPropagation?.();

          if (state.cleanup) {
            closePopover();
            return;
          }

          activeColorPopoverCleanup?.();

          const iroModule = await import("@jaames/iro");
          const iro = (iroModule as any).default ?? iroModule;
          if (!document.body) return;

          const popover = document.createElement("div");
          popover.className = "cms-gjs-color-field__popover";

          const head = document.createElement("div");
          head.className = "cms-gjs-color-field__popover-head";

          const label = document.createElement("span");
          label.className = "cms-gjs-color-field__popover-label";
          label.textContent = "Color";

          const popoverInput = document.createElement("input");
          popoverInput.type = "text";
          popoverInput.className = "cms-gjs-color-field__popover-input";
          popoverInput.placeholder = "#000000";

          const wheelMount = document.createElement("div");
          wheelMount.className = "cms-gjs-color-field__wheel";

          head.appendChild(label);
          popover.appendChild(head);
          popover.appendChild(popoverInput);
          popover.appendChild(wheelMount);
          document.body.appendChild(popover);

          const setDisplayValue = (nextValue: string) => {
            const displayValue = nextValue || "none";
            pickerPreview.style.background = nextValue ? normalizePickerColor(nextValue) : "transparent";
            pickerPreview.dataset.empty = nextValue ? "false" : "true";
            pickerValue.textContent = displayValue;
            pickerButton.title = displayValue === "none" ? "Choose color" : `Choose color (${displayValue})`;
            popoverInput.value = nextValue;
          };

          const positionPopover = () => {
            const margin = 14;
            const offset = 10;
            const rect = pickerButton.getBoundingClientRect();
            const popoverRect = popover.getBoundingClientRect();

            const left = Math.min(
              Math.max(rect.right - popoverRect.width, margin),
              window.innerWidth - popoverRect.width - margin
            );

            let top = rect.bottom + offset;
            if (top + popoverRect.height > window.innerHeight - margin) {
              top = Math.max(margin, rect.top - popoverRect.height - offset);
            }

            popover.style.left = `${left}px`;
            popover.style.top = `${top}px`;
          };

          const emitValue = (nextValue: string, partial: boolean, source: "picker" | "text") => {
            setDisplayValue(nextValue);
            change({ value: nextValue, partial, source });
          };

          const currentValue = pickerValue.textContent === "none" ? "" : String(pickerValue.textContent || "").trim();
          const currentColor = normalizePickerColor(currentValue);
          const pickerStartColor = isNearBlackColor(currentColor) ? "#ff3b30" : currentColor;
          setDisplayValue(currentValue);

          const picker = new iro.ColorPicker(wheelMount, {
            width: 188,
            color: pickerStartColor,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.14)",
            padding: 6,
            layout: [
              { component: iro.ui.Wheel },
              { component: iro.ui.Slider, options: { sliderType: "hue" } },
              { component: iro.ui.Slider, options: { sliderType: "value" } },
            ],
          });

          const handleColorChange = (color: any) => {
            if (state.isSyncingExternal) return;
            emitValue(normalizePickerColor(color?.hexString), true, "picker");
          };

          const handleInputEnd = (color: any) => {
            if (state.isSyncingExternal) return;
            emitValue(normalizePickerColor(color?.hexString), false, "picker");
          };

          const handleTextInput = () => {
            emitValue(String(popoverInput.value || "").trim(), true, "text");
          };

          const handleTextChange = () => {
            const nextValue = String(popoverInput.value || "").trim();
            emitValue(nextValue, false, "text");
            const nextPickerColor = normalizePickerColor(nextValue);
            if (state.picker?.color && normalizePickerColor(state.picker.color.hexString) !== nextPickerColor) {
              state.isSyncingExternal = true;
              state.picker.color.hexString = nextPickerColor;
              state.isSyncingExternal = false;
            }
          };

          const handlePointerDown = (nextEvent: MouseEvent) => {
            const target = nextEvent.target as Node | null;
            if (!target) return;
            if (popover.contains(target) || pickerButton.contains(target)) return;
            closePopover();
          };

          const handleKeyDown = (nextEvent: KeyboardEvent) => {
            if (nextEvent.key === "Escape") {
              closePopover();
            }
          };

          const handleViewportChange = () => {
            positionPopover();
          };

          picker.on("color:change", handleColorChange);
          picker.on("input:end", handleInputEnd);
          popoverInput.addEventListener("input", handleTextInput);
          popoverInput.addEventListener("change", handleTextChange);

          state.picker = picker;
          state.popoverInput = popoverInput;
          pickerButton.setAttribute("aria-expanded", "true");

          document.addEventListener("mousedown", handlePointerDown, true);
          document.addEventListener("keydown", handleKeyDown);
          window.addEventListener("resize", handleViewportChange);
          window.addEventListener("scroll", handleViewportChange, true);

          const cleanupPopover = () => {
            picker.off("color:change", handleColorChange);
            picker.off("input:end", handleInputEnd);
            popoverInput.removeEventListener("input", handleTextInput);
            popoverInput.removeEventListener("change", handleTextChange);
            document.removeEventListener("mousedown", handlePointerDown, true);
            document.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("resize", handleViewportChange);
            window.removeEventListener("scroll", handleViewportChange, true);
            popover.remove();
            pickerButton.setAttribute("aria-expanded", "false");
            state.cleanup = null;
            state.picker = null;
            state.popoverInput = null;
            if (activeColorPopoverCleanup === cleanupPopover) {
              activeColorPopoverCleanup = null;
            }
          };

          state.cleanup = cleanupPopover;
          activeColorPopoverCleanup = cleanupPopover;
          window.requestAnimationFrame(positionPopover);
          window.setTimeout(positionPopover, 0);
          window.setTimeout(() => {
            popoverInput.focus({ preventScroll: true });
            popoverInput.select();
          }, 0);
        };

        pickerButton.addEventListener("click", (event) => {
          void openPicker(event);
        });
        pickerButton.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            void openPicker(event);
          }
        });

        window.requestAnimationFrame(() => {
          const fieldShell = root.closest(".gjs-field");
          if (!fieldShell) return;
          fieldShell.classList.remove("gjs-field", "gjs-field-color");
          fieldShell.classList.add("cms-gjs-color-field-shell");
        });

        root.appendChild(pickerButton);
        (root as any).__cmsColorState = state;
        return root;
      },
      emit({ updateStyle }: any, { event, value, partial, source }: any) {
        const target = event?.target as HTMLInputElement | null;
        const nextValue = String(value ?? target?.value ?? "").trim();
        if (!nextValue) {
          updateStyle("", { partial });
          return;
        }
        updateStyle(source === "picker" ? normalizePickerColor(nextValue) : nextValue, { partial });
      },
      update({ value, el }: any) {
        const pickerPreview = el.querySelector(".cms-gjs-color-field__preview") as HTMLSpanElement | null;
        const pickerValue = el.querySelector(".cms-gjs-color-field__value") as HTMLSpanElement | null;
        const nextValue = String(value || "").trim();
        const nextPickerColor = normalizePickerColor(nextValue);
        const state = (el as any).__cmsColorState as
          | {
              picker: any;
              popoverInput: HTMLInputElement | null;
              isSyncingExternal: boolean;
            }
          | undefined;
        if (pickerPreview) {
          pickerPreview.style.background = nextValue ? nextPickerColor : "transparent";
          pickerPreview.dataset.empty = nextValue ? "false" : "true";
        }
        if (pickerValue) {
          pickerValue.textContent = nextValue || "none";
        }
        if (state?.popoverInput) {
          state.popoverInput.value = nextValue;
        }
        if (state?.picker?.color) {
          const currentPickerColor = normalizePickerColor(state.picker.color.hexString);
          if (currentPickerColor !== nextPickerColor) {
            state.isSyncingExternal = true;
            state.picker.color.hexString = nextPickerColor;
            state.isSyncingExternal = false;
          }
        }
      },
      destroy({ el }: any) {
        const state = (el as any)?.__cmsColorState as { cleanup?: (() => void) | null } | undefined;
        state?.cleanup?.();
      },
    });

    const syncExistingColorPropertyViews = () => {
      const colorView = editor.StyleManager.getType("color")?.view;
      if (!colorView) return;

      const seen = new WeakSet<object>();

      const syncProperties = (collection: any) => {
        const items = Array.isArray(collection) ? collection : collection?.models;
        if (!items?.length) return;

        items.forEach((property: any) => {
          if (!property || typeof property !== "object" || seen.has(property)) return;
          seen.add(property);

          if (property.get?.("type") === "color") {
            property.typeView = colorView;
          }

          syncProperties(property.get?.("properties") || property.properties);

          const layers = property.layers?.models;
          if (!layers?.length) return;

          layers.forEach((layer: any) => {
            syncProperties(layer?.get?.("properties") || layer?.properties);
          });
        });
      };

      const sectors = editor.StyleManager.getSectors?.({ array: true }) || [];
      sectors.forEach((sector: any) => {
        syncProperties(sector?.get?.("properties") || sector?.properties);
      });
    };

    const suppressNativeStyleColorInputs = () => {
      const stylesRoot = rightStylesRef.current;
      if (!stylesRoot) return;

      stylesRoot.querySelectorAll('input[type="color"]').forEach((input) => {
        const nativeInput = input as HTMLInputElement;
        nativeInput.tabIndex = -1;
        nativeInput.disabled = true;
        nativeInput.setAttribute("aria-hidden", "true");
        nativeInput.dataset.cmsSuppressedColorInput = "true";
      });

      stylesRoot.querySelectorAll(".gjs-property.gjs-color .gjs-input-holder").forEach((holder) => {
        const inputHolder = holder as HTMLElement;
        inputHolder.style.display = "none";
        inputHolder.setAttribute("aria-hidden", "true");
      });
    };

    registerCmsBlocks(editor);
    registerAdvancedCmsBlocks(editor);
    enhanceFoundationBlocks(editor);

    const blockSearchRef = blockSearchQueryRef;

    const syncBlockCategories = () => {
      try {
        configureStudioCategories(editor);

        const blockRoot = leftBlocksRef.current || (editor.getContainer() as HTMLElement);
        blockRoot?.querySelectorAll?.(".gjs-block-category")?.forEach((el) => {
          el.classList.remove("gjs-open");
        });
      } catch {
        // ignore category collapse sync errors
      }
    };

    const mountStudioPanels = () => {
      const isEditorReady = Boolean(editor.getModel?.()?.get?.("ready"));
      const renderInto = (mountPoint: HTMLDivElement | null, nextView?: HTMLElement) => {
        if (!mountPoint || !nextView) return;
        mountPoint.replaceChildren(nextView);
      };

      const safeRender = (renderer: () => HTMLElement | undefined) => {
        try {
          return renderer();
        } catch {
          return undefined;
        }
      };

      renderInto(leftLayersRef.current, isEditorReady ? safeRender(() => editor.LayerManager.render()) : undefined);
      syncExistingColorPropertyViews();
      if (rightStylesRef.current && !rightStylesRef.current.querySelector(".gjs-sm-sectors")) {
        renderInto(rightStylesRef.current, safeRender(() => editor.StyleManager.render()));
      }
      if (rightTraitsRef.current && !rightTraitsRef.current.querySelector(".gjs-trt-traits")) {
        renderInto(rightTraitsRef.current, safeRender(() => editor.TraitManager.render()));
      }
      if (leftBlocksRef.current && !leftBlocksRef.current.querySelector(".gjs-blocks-c")) {
        renderInto(leftBlocksRef.current, safeRender(() => editor.BlockManager.render()));
      }
      suppressNativeStyleColorInputs();
      filterBlockPanel(leftBlocksRef.current, blockSearchRef.current);
    };

    const syncCanvasEmptyState = () => {
      setCanvasEmpty(isEditorCanvasEmpty(editor));
    };
    const syncCanvasZoomState = () => {
      try {
        setCanvasZoom(Math.round(Number(editor.Canvas?.getZoom?.() || 100)));
      } catch {
        setCanvasZoom(100);
      }
    };

    syncBlockCategories();
    requestAnimationFrame(syncBlockCategories);
    setTimeout(syncBlockCategories, 120);

    const applyProductShowcaseTopSpacing = () => {
      const wrapper = editor.getWrapper?.();
      if (!wrapper?.find) return;

      wrapper.find("section").forEach((section: any) => {
        const markup = String(section?.toHTML?.() || "");
        if (!markup.includes("Create a cleaner, premium product spotlight section.")) return;

        const style = section.getStyle?.() || {};
        if (String(style["padding-top"] || "").trim() === "88px") return;

        section.addStyle({
          "padding-top": "88px",
        });
      });
    };

    const clearFrameWrapperInlineStyles = (
      frameWrapper: HTMLElement,
      frameElement: HTMLElement | null,
    ) => {
      ["left", "top", "right", "bottom", "width", "height", "minHeight", "maxHeight"].forEach((prop) => {
        frameWrapper.style.removeProperty(prop);
        frameElement?.style.removeProperty(prop);
      });
    };

    const syncFrameWrapperStyle = () => {
      const editorRoot = editor.getContainer?.() as HTMLElement | null;
      const frameWrapper = editorRoot?.querySelector?.(".gjs-frame-wrapper") as HTMLElement | null;
      const frameElement = editorRoot?.querySelector?.(".gjs-frame") as HTMLElement | null;
      if (!frameWrapper) return;

      clearFrameWrapperInlineStyles(frameWrapper, frameElement);
    };

    const buildContent = (ed: any) => {
      const html = ed.getHtml() || "";
      const styles = ed.getCss() || "";
      const script = (jsRef.current || "").trim();
      const cssTag = styles ? `\n<style>${styles}</style>` : "";
      const jsTag = script ? `\n<script>${script}</script>` : "";
      return `${html}${cssTag}${jsTag}`.trim();
    };

    registerStudioEditorFeatures(editor, buildContent);
    const canvasInteractionGuards = installCanvasInteractionGuards(
      editor,
      shellRef.current,
      () => editorAlive,
    );
    registerStudioRteActions(editor);

    editor.on("rte:enable", (_view: unknown, rte: unknown) => {
      rteInstanceRef.current = rte;
    });
    editor.on("rte:disable", () => {
      rteInstanceRef.current = null;
      const selected = editor.getSelected?.();
      if (isEditableTextComponent(selected)) {
        window.requestAnimationFrame(() => {
          activateStudioTextFormatting(editor);
        });
      }
    });

    const getFullscreenElement = () => {
      const fullscreenDocument = document as Document & {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
      };

      return (
        fullscreenDocument.fullscreenElement ||
        fullscreenDocument.webkitFullscreenElement ||
        fullscreenDocument.mozFullScreenElement ||
        fullscreenDocument.msFullscreenElement ||
        null
      );
    };

    const requestElementFullscreen = (target: HTMLElement): Promise<void> => {
      const fullscreenTarget = target as HTMLElement & {
        webkitRequestFullscreen?: () => Promise<void> | void;
        mozRequestFullScreen?: () => Promise<void> | void;
        msRequestFullscreen?: () => Promise<void> | void;
      };

      const invoke = (request?: () => Promise<void> | void) => {
        if (!request) return Promise.reject(new Error("Fullscreen API unavailable"));
        return Promise.resolve(request.call(fullscreenTarget));
      };

      if (fullscreenTarget.requestFullscreen) {
        return invoke(fullscreenTarget.requestFullscreen.bind(fullscreenTarget));
      }
      if (fullscreenTarget.webkitRequestFullscreen) {
        return invoke(fullscreenTarget.webkitRequestFullscreen.bind(fullscreenTarget));
      }
      if (fullscreenTarget.mozRequestFullScreen) {
        return invoke(fullscreenTarget.mozRequestFullScreen.bind(fullscreenTarget));
      }
      if (fullscreenTarget.msRequestFullscreen) {
        return invoke(fullscreenTarget.msRequestFullscreen.bind(fullscreenTarget));
      }

      return Promise.reject(new Error("Fullscreen API unavailable"));
    };

    const exitElementFullscreen = () => {
      const fullscreenDocument = document as Document & {
        webkitExitFullscreen?: () => Promise<void> | void;
        mozCancelFullScreen?: () => Promise<void> | void;
        msExitFullscreen?: () => Promise<void> | void;
      };

      if (fullscreenDocument.exitFullscreen) {
        return fullscreenDocument.exitFullscreen();
      }
      if (fullscreenDocument.webkitExitFullscreen) {
        return fullscreenDocument.webkitExitFullscreen();
      }
      if (fullscreenDocument.mozCancelFullScreen) {
        return fullscreenDocument.mozCancelFullScreen();
      }
      if (fullscreenDocument.msExitFullscreen) {
        return fullscreenDocument.msExitFullscreen();
      }
    };

    const isShellInFullscreen = () => {
      const shell = shellRef.current;
      return Boolean(shell && getFullscreenElement() === shell);
    };

    if (editor.Commands.has("fullscreen")) {
      editor.Commands.extend("fullscreen", {
        run(this: any, ed: any, sender: any, opts: any = {}) {
          if (isShellInFullscreen()) {
            ed.stopCommand("fullscreen", { sender });
            return;
          }

          fullscreenSenderRef.current = sender || null;
          sender?.set?.("active", true);

          const requestedTarget = opts?.target;
          const fallbackTarget =
            requestedTarget && typeof requestedTarget === "object" && requestedTarget.nodeType === 1
              ? requestedTarget
              : typeof requestedTarget === "string"
                ? document.querySelector(requestedTarget)
                : null;

          const targetEl = shellRef.current || fallbackTarget || ed.getContainer();
          if (!targetEl) {
            ed.stopCommand("fullscreen", { sender });
            return;
          }

          void requestElementFullscreen(targetEl as HTMLElement).catch(() => {
            ed.stopCommand("fullscreen", { sender });
          });
        },
        stop(this: any, _ed: any, sender: any) {
          const resolvedSender = sender || fullscreenSenderRef.current;
          resolvedSender?.set?.("active", false);
          fullscreenSenderRef.current = null;

          if (getFullscreenElement()) {
            void exitElementFullscreen();
          }
        },
      });
    }

    const openCodeModal = async (ed: any) => {
        const modal = ed.Modal;
      const CodeMirror = (await import("codemirror")).default;
      await Promise.all([
        import("codemirror/mode/xml/xml"),
        import("codemirror/mode/javascript/javascript"),
        import("codemirror/mode/css/css"),
        import("codemirror/mode/htmlmixed/htmlmixed"),
      ]);
      const beautifyModule: any = await import("js-beautify");
      const baseEditorHeight = 300;

      const getCodeModalContainer = () =>
        (shellRef.current?.querySelector(".gjs-mdl-container") ||
          document.querySelector(".gjs-mdl-container.cms-code-modal-overlay")) as HTMLElement | null;

      const syncCodeModalViewport = () => {
        const modalContainer = getCodeModalContainer();
        if (!modalContainer) return;

        modalContainer.classList.add("cms-code-modal-overlay");
        document.body.classList.add("cms-code-modal-open");
        shellRef.current?.classList.add("cms-code-modal-open");
      };

      const clearCodeModalViewport = () => {
        document.body.classList.remove("cms-code-modal-open");
        shellRef.current?.classList.remove("cms-code-modal-open");
        getCodeModalContainer()?.classList.remove("cms-code-modal-overlay");
      };

      const resetCodeCommandState = () => {
        try {
          ed?.stopCommand?.("cms:open-code");
          ed?.stopCommand?.("open-code");
          ed?.stopCommand?.("core:open-code");

          const resetButtons = (panelId: string) => {
            const panelButtons = ed?.Panels?.getPanel?.(panelId)?.get?.("buttons");
            if (!panelButtons?.forEach) return;
            panelButtons.forEach((btn: any) => {
              const id = String(btn?.get?.("id") || "");
              const cmd = String(btn?.get?.("command") || "");
              if (id === "open-code" || id === "cms-open-code" || cmd === "cms:open-code" || cmd === "core:open-code" || cmd === "open-code") {
                btn.set?.("active", false);
              }
            });
          };

          resetButtons("views");
          resetButtons("options");
        } catch {
          // ignore state-sync errors
        }
      };

      const beautifyHtml = beautifyModule?.html || beautifyModule?.default?.html;
      const beautifyCss = beautifyModule?.css || beautifyModule?.default?.css;
      const beautifyJs = beautifyModule?.js || beautifyModule?.default?.js;

      const formatByType = (code: string, type: "html" | "css" | "js") => {
        const source = code || "";
        if (!source.trim()) return "";

        const options = {
          indent_size: 2,
          preserve_newlines: true,
          max_preserve_newlines: 2,
          end_with_newline: false,
        };

        try {
          if (type === "html" && typeof beautifyHtml === "function") {
            return beautifyHtml(source, options);
          }
          if (type === "css" && typeof beautifyCss === "function") {
            return beautifyCss(source, options);
          }
          if (type === "js" && typeof beautifyJs === "function") {
            return beautifyJs(source, options);
          }
          return source;
        } catch {
          return source;
        }
      };

      const initialHtml = formatByType(ed.getHtml() || "", "html");
      const initialCss = formatByType(ed.getCss() || "", "css");
      const initialJs = formatByType(jsRef.current || "", "js");

      const createButton = (
        label: string,
        className: string,
        iconClass?: string,
        onClick?: () => void,
      ) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = className;
        if (iconClass) {
          button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i><span>${label}</span>`;
        } else {
          button.textContent = label;
        }
        if (onClick) button.onclick = onClick;
        return button;
      };

      const modalRoot = document.createElement("div");
      modalRoot.className = "cms-code-modal";

      const toolbar = document.createElement("div");
      toolbar.className = "cms-code-modal__toolbar";

      const toolbarCopy = document.createElement("div");
      toolbarCopy.className = "cms-code-modal__intro";
      toolbarCopy.innerHTML = `
        <div class="cms-code-modal__eyebrow">Advanced editing</div>
        <p class="cms-code-modal__hint">Edit HTML structure, CSS styles, and page scripts. Use Format before saving for cleaner code.</p>
      `;

      const toolbarActions = document.createElement("div");
      toolbarActions.className = "cms-code-modal__toolbar-actions";

      const tabList = document.createElement("div");
      tabList.className = "cms-code-modal__tabs";
      tabList.setAttribute("role", "tablist");
      tabList.setAttribute("aria-label", "Code editor panels");

      const panels = document.createElement("div");
      panels.className = "cms-code-modal__panels";

      const panelConfig = [
        { id: "html", label: "HTML", icon: "fa-solid fa-code", hint: "Page markup" },
        { id: "css", label: "CSS", icon: "fa-solid fa-palette", hint: "Stylesheet rules" },
        { id: "js", label: "JavaScript", icon: "fa-solid fa-bolt", hint: "Page scripts" },
      ] as const;

      const htmlInput = document.createElement("textarea");
      htmlInput.value = initialHtml;
      const cssInput = document.createElement("textarea");
      cssInput.value = initialCss;
      const jsInput = document.createElement("textarea");
      jsInput.value = initialJs;

      const inputMap: Record<(typeof panelConfig)[number]["id"], HTMLTextAreaElement> = {
        html: htmlInput,
        css: cssInput,
        js: jsInput,
      };

      let activeTab: (typeof panelConfig)[number]["id"] = "html";
      const tabButtons: Partial<Record<(typeof panelConfig)[number]["id"], HTMLButtonElement>> = {};
      const panelElements: Partial<Record<(typeof panelConfig)[number]["id"], HTMLElement>> = {};

      const setActiveTab = (nextTab: (typeof panelConfig)[number]["id"]) => {
        activeTab = nextTab;
        panelConfig.forEach(({ id }) => {
          tabButtons[id]?.setAttribute("aria-selected", id === nextTab ? "true" : "false");
          tabButtons[id]?.classList.toggle("is-active", id === nextTab);
          panelElements[id]?.classList.toggle("is-active", id === nextTab);
        });
      };

      panelConfig.forEach(({ id, label, icon, hint }) => {
        const tabButton = document.createElement("button");
        tabButton.type = "button";
        tabButton.className = `cms-code-modal__tab cms-code-modal__tab--${id}${id === activeTab ? " is-active" : ""}`;
        tabButton.setAttribute("role", "tab");
        tabButton.setAttribute("aria-selected", id === activeTab ? "true" : "false");
        tabButton.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span>${label}</span>`;
        tabButton.onclick = () => setActiveTab(id);
        tabButtons[id] = tabButton;
        tabList.appendChild(tabButton);

        const panel = document.createElement("section");
        panel.className = `cms-code-modal__panel cms-code-modal__panel--${id}${id === activeTab ? " is-active" : ""}`;
        panel.dataset.panel = id;

        const panelHeader = document.createElement("div");
        panelHeader.className = "cms-code-modal__panel-head";
        panelHeader.innerHTML = `
          <div class="cms-code-modal__panel-title">
            <i class="${icon}" aria-hidden="true"></i>
            <div>
              <strong>${label}</strong>
              <span>${hint}</span>
            </div>
          </div>
        `;

        const panelBody = document.createElement("div");
        panelBody.className = "cms-code-modal__panel-body";
        panelBody.appendChild(inputMap[id]);

        panel.appendChild(panelHeader);
        panel.appendChild(panelBody);
        panelElements[id] = panel;
        panels.appendChild(panel);
      });

      const footer = document.createElement("div");
      footer.className = "cms-code-modal__footer";

      const footerMeta = document.createElement("div");
      footerMeta.className = "cms-code-modal__footer-meta";
      footerMeta.textContent = "Changes apply to the current page after Save.";

      const footerActions = document.createElement("div");
      footerActions.className = "cms-code-modal__footer-actions";

      let htmlEditor: any = null;
      let cssEditor: any = null;
      let jsEditor: any = null;
      let isStretched = true;
      let isExpanded = false;

      const getCodeModalChromeHeight = (dialog: HTMLElement | null) => {
        const header = dialog?.querySelector(".gjs-mdl-header") as HTMLElement | null;
        const toolbarEl = modalRoot.querySelector(".cms-code-modal__toolbar") as HTMLElement | null;
        const tabsEl = modalRoot.querySelector(".cms-code-modal__tabs") as HTMLElement | null;
        const footerEl = modalRoot.querySelector(".cms-code-modal__footer") as HTMLElement | null;
        const panelHeads = modalRoot.querySelectorAll(".cms-code-modal__panel-head");
        let panelHeadHeight = 0;
        panelHeads.forEach((node) => {
          panelHeadHeight = Math.max(panelHeadHeight, (node as HTMLElement).offsetHeight || 0);
        });

        return (
          (header?.offsetHeight || 52) +
          (toolbarEl?.offsetHeight || 88) +
          (tabsEl?.offsetHeight || 0) +
          (footerEl?.offsetHeight || 56) +
          panelHeadHeight +
          72
        );
      };

      const getCodeModalEditorHeight = (dialog: HTMLElement | null) => {
        const chromeHeight = getCodeModalChromeHeight(dialog);
        const viewportPadding = isExpanded ? 40 : 56;
        const available = window.innerHeight - chromeHeight - viewportPadding;
        const maxByMode = isExpanded
          ? Math.floor(window.innerHeight * 0.52)
          : isStretched
            ? Math.floor(window.innerHeight * 0.42)
            : baseEditorHeight;

        return Math.max(220, Math.min(available, maxByMode));
      };

      const stretchBtn = createButton("Stacked layout", "cms-code-modal__btn cms-code-modal__btn--ghost", "fa-solid fa-up-right-and-down-left-from-center");
      const expandBtn = createButton("Expand", "cms-code-modal__btn cms-code-modal__btn--ghost", "fa-solid fa-expand");
      const formatBtn = createButton("Format code", "cms-code-modal__btn cms-code-modal__btn--ghost", "fa-solid fa-wand-magic-sparkles");
      const cancelBtn = createButton("Cancel", "cms-code-modal__btn cms-code-modal__btn--ghost");
      const saveBtn = createButton("Save changes", "cms-code-modal__btn cms-code-modal__btn--primary", "fa-solid fa-floppy-disk");

      cancelBtn.onclick = () => {
        clearCodeModalViewport();
        resetCodeCommandState();
        modal.close();
      };

      const setEditorHeight = (editorHeight: number) => {
        [htmlInput, cssInput, jsInput].forEach((input) => {
          input.style.height = `${editorHeight}px`;
        });

        if (htmlEditor && cssEditor && jsEditor) {
          htmlEditor.setSize("100%", editorHeight);
          cssEditor.setSize("100%", editorHeight);
          jsEditor.setSize("100%", editorHeight);
          htmlEditor.refresh();
          cssEditor.refresh();
          jsEditor.refresh();
        }
      };

      const applyLayout = () => {
        const dialog = (getCodeModalContainer()?.querySelector(".gjs-mdl-dialog") ||
          document.querySelector(".gjs-mdl-dialog")) as HTMLElement | null;
        modalRoot.classList.toggle("is-wide", isStretched);
        modalRoot.classList.toggle("is-expanded", isExpanded);
        panels.classList.toggle("cms-code-modal__panels--wide", isStretched);
        panels.classList.toggle("cms-code-modal__panels--stacked", !isStretched);

        stretchBtn.querySelector("span")!.textContent = isStretched ? "Stacked layout" : "Wide layout";
        expandBtn.querySelector("span")!.textContent = isExpanded ? "Compact" : "Expand";

        if (dialog) {
          const dialogWidth = isExpanded
            ? Math.min(window.innerWidth * 0.98, 1600)
            : isStretched
              ? Math.min(window.innerWidth * 0.96, 1400)
              : Math.min(window.innerWidth * 0.92, 960);

          dialog.classList.toggle("cms-code-modal-dialog--expanded", isExpanded);
          dialog.classList.add("cms-code-modal-dialog");
          dialog.style.width = `${Math.round(dialogWidth)}px`;
          dialog.style.maxWidth = isExpanded ? "98vw" : isStretched ? "96vw" : "92vw";
          dialog.style.minWidth = "320px";
          dialog.style.maxHeight = `calc(100vh - ${isExpanded ? 32 : 48}px)`;
        }

        const height = getCodeModalEditorHeight(dialog);
        setEditorHeight(height);
      };

      stretchBtn.onclick = () => {
        isStretched = !isStretched;
        if (isStretched) isExpanded = false;
        applyLayout();
      };

      expandBtn.onclick = () => {
        isExpanded = !isExpanded;
        if (isExpanded) isStretched = true;
        applyLayout();
      };

      formatBtn.onclick = () => {
        const htmlValue = htmlEditor ? htmlEditor.getValue() : htmlInput.value || "";
        const cssValue = cssEditor ? cssEditor.getValue() : cssInput.value || "";
        const jsValue = jsEditor ? jsEditor.getValue() : jsInput.value || "";

        const prettyHtml = formatByType(htmlValue, "html");
        const prettyCss = formatByType(cssValue, "css");
        const prettyJs = formatByType(jsValue, "js");

        if (htmlEditor) htmlEditor.setValue(prettyHtml);
        else htmlInput.value = prettyHtml;

        if (cssEditor) cssEditor.setValue(prettyCss);
        else cssInput.value = prettyCss;

        if (jsEditor) jsEditor.setValue(prettyJs);
        else jsInput.value = prettyJs;
      };

      saveBtn.onclick = () => {
        const htmlValue = formatByType(htmlEditor ? htmlEditor.getValue() : htmlInput.value || "", "html");
        const cssValue = formatByType(cssEditor ? cssEditor.getValue() : cssInput.value || "", "css");
        const jsValue = formatByType(jsEditor ? jsEditor.getValue() : jsInput.value || "", "js");

        jsRef.current = jsValue;
        ed.setComponents(htmlValue);
        ed.setStyle(cssValue);
        const next = buildContent(ed);
        if (next !== lastEmittedRef.current) {
          lastEmittedRef.current = next;
          onChange(next);
        }
        resetCodeCommandState();
        clearCodeModalViewport();
        modal.close();
      };

      toolbarActions.append(formatBtn, stretchBtn, expandBtn);
      toolbar.append(toolbarCopy, toolbarActions);

      footerActions.append(cancelBtn, saveBtn);
      footer.append(footerMeta, footerActions);

      modalRoot.append(toolbar, tabList, panels, footer);

      modal.setTitle("Custom Code Editor");
      modal.setContent(modalRoot);
      modal.open();
      syncCodeModalViewport();

      const modalModel = modal.getModel?.();
      const onWindowResize = () => applyLayout();
      if (modalModel) {
        const onModalChange = () => {
          const isOpen = modalModel.get?.("open");
          if (!isOpen) {
            window.removeEventListener("resize", onWindowResize);
            clearCodeModalViewport();
            resetCodeCommandState();
            modalModel.off?.("change:open", onModalChange);
          }
        };
        modalModel.on?.("change:open", onModalChange);
      }
      window.addEventListener("resize", onWindowResize);

      requestAnimationFrame(() => {
        syncCodeModalViewport();

        const editorOptions = {
          theme: "material-darker",
          lineNumbers: true,
          lineWrapping: true,
          indentUnit: 2,
          tabSize: 2,
        };

        htmlEditor = CodeMirror.fromTextArea(htmlInput, {
          ...editorOptions,
          mode: "htmlmixed",
        });
        cssEditor = CodeMirror.fromTextArea(cssInput, {
          ...editorOptions,
          mode: "css",
        });
        jsEditor = CodeMirror.fromTextArea(jsInput, {
          ...editorOptions,
          mode: "javascript",
        });

        [htmlEditor, cssEditor, jsEditor].forEach((editorInstance) => {
          const wrapper = editorInstance.getWrapperElement();
          wrapper.classList.add("cms-code-modal__codemirror");
        });

        applyLayout();
      });
    };

    editor.Commands.add("cms:open-code", {
      run(ed: any, sender: any) {
        ed?.stopCommand?.("open-code");
        ed?.stopCommand?.("core:open-code");
        ed?.stopCommand?.("cms:open-code");
        sender?.set?.("active", false);
        openCodeModal(ed);
      },
      stop() {},
    });

    const forceBindCodeButtons = () => {
      if (!editorAlive || !editor.Panels?.getButton) return;

      const panelIds = ["options", "views"];
      const buttonIds = ["open-code", "cms-open-code"];

      panelIds.forEach((panelId) => {
        buttonIds.forEach((buttonId) => {
          const btn = editor.Panels.getButton(panelId, buttonId);
          if (!btn?.set) return;
          btn.set("command", "cms:open-code");
          btn.set("togglable", false);
          btn.set("active", false);
        });
      });
    };

    if (editor.Commands.has("open-code")) {
      editor.Commands.extend("open-code", {
        run(ed: any, sender: any) {
          ed?.stopCommand?.("open-code");
          ed?.stopCommand?.("core:open-code");
          ed?.stopCommand?.("cms:open-code");
          sender?.set?.("active", false);
          openCodeModal(ed);
        },
        stop() {},
      });
    } else {
      editor.Commands.add("open-code", {
        run(ed: any, sender: any) {
          ed?.stopCommand?.("open-code");
          ed?.stopCommand?.("core:open-code");
          ed?.stopCommand?.("cms:open-code");
          sender?.set?.("active", false);
          openCodeModal(ed);
        },
        stop() {},
      });
    }

    if (editor.Commands.has("core:open-code")) {
      editor.Commands.extend("core:open-code", {
        run(ed: any, sender: any) {
          ed?.stopCommand?.("open-code");
          ed?.stopCommand?.("core:open-code");
          ed?.stopCommand?.("cms:open-code");
          sender?.set?.("active", false);
          openCodeModal(ed);
        },
        stop() {},
      });
    } else {
      editor.Commands.add("core:open-code", {
        run(ed: any, sender: any) {
          ed?.stopCommand?.("open-code");
          ed?.stopCommand?.("core:open-code");
          ed?.stopCommand?.("cms:open-code");
          sender?.set?.("active", false);
          openCodeModal(ed);
        },
        stop() {},
      });
    }

    const hideLegacyPanelElement = (panel: HTMLElement | null) => {
      if (!panel) return;
      panel.style.display = "none";
      panel.style.width = "0";
      panel.style.minWidth = "0";
      panel.style.maxWidth = "0";
      panel.style.height = "0";
      panel.style.minHeight = "0";
      panel.style.maxHeight = "0";
      panel.style.opacity = "0";
      panel.style.visibility = "hidden";
      panel.style.pointerEvents = "none";
      panel.style.overflow = "hidden";
      panel.style.border = "0";
      panel.style.boxShadow = "none";
      panel.style.fontSize = "0";
      panel.style.lineHeight = "0";
      panel.style.padding = "0";
      panel.style.margin = "0";
    };

    const removeGrapesTopPanels = () => {
      if (!editorAlive || !editor.Panels?.removePanel) return;

      ["commands", "options", "views", "devices-c"].forEach((panelId) => {
        try {
          editor.Panels.removePanel(panelId);
        } catch {
          // ignore missing panels
        }
      });
    };

    const hideLegacyViewsUi = () => {
      const root = editor.getContainer() as HTMLElement;
      const editorRoot = (root.classList.contains("gjs-editor")
        ? root
        : root.querySelector(".gjs-editor")) as HTMLElement | null;
      const editorCont = root.querySelector(".gjs-editor-cont") as HTMLElement | null;
      const canvas = root.querySelector(".gjs-cv-canvas") as HTMLElement | null;

      root.style.setProperty("--cms-side-panel-width", "0px");
      root.style.setProperty("--gjs-left-width", "0px");
      root.style.setProperty("--gjs-canvas-top", "0px");
      editorRoot?.style.setProperty("--cms-side-panel-width", "0px");
      editorRoot?.style.setProperty("--gjs-left-width", "0px");
      editorRoot?.style.setProperty("--gjs-canvas-top", "0px");
      editorCont?.style.setProperty("--gjs-canvas-top", "0px");
      editorCont?.style.setProperty("--gjs-left-width", "0px");

      root.querySelectorAll(
        ".gjs-pn-commands, .gjs-pn-options, .gjs-pn-devices-c, .gjs-pn-views, .gjs-pn-views-container, .gjs-pn-panel",
      ).forEach((panel) => hideLegacyPanelElement(panel as HTMLElement));

      if (editorCont) {
        editorCont.style.overflow = "hidden";
        editorCont.style.height = "100%";
        editorCont.style.position = "relative";
      }

      if (editorRoot) {
        editorRoot.style.height = "100%";
      }

      if (canvas) {
        canvas.style.position = "absolute";
        canvas.style.top = "0";
        canvas.style.left = "0";
        canvas.style.right = "0";
        canvas.style.bottom = "0";
        canvas.style.width = "auto";
        canvas.style.height = "auto";
        canvas.style.borderRight = "0";
        canvas.style.overflow = "auto";
      }
    };

    const handleCanvasZoomChange = () => {
      syncCanvasZoomState();
      hideLegacyViewsUi();
    };

    const syncStudioDeviceState = () => {
      const current = String(editor.getDevice?.() || "Desktop");
      setActiveDevice(STUDIO_DEVICE_KEYS[current] || "desktop");
    };

    if (editor.Panels?.getPanels) {
      const panels = editor.Panels.getPanels();
      panels.forEach((panel: any) => {
        const buttons = panel.get("buttons");
        if (!buttons) return;
        buttons.forEach((btn: any) => {
          const cmd = btn.get("command");
          const id = btn.get("id");
          if (cmd === "core:open-code" || id === "open-code") {
            btn.set("command", "cms:open-code");
            btn.set("togglable", false);
            btn.set("active", false);
          }
        });
      });
    }

    forceBindCodeButtons();

    const syncEditorChromeState = () => {
      if (!editorAlive) return;
      removeGrapesTopPanels();
      hideLegacyViewsUi();
      syncStudioDeviceState();
    };

    const refreshCanvasLayout = () => {
      if (!editorAlive || canvasInteractionGuards.isDragging()) return;
      hideLegacyViewsUi();
      syncFrameWrapperStyle();

      const isFs = isShellInFullscreen() || editor.Commands.isActive("fullscreen");
      const previewMin = isFs ? "auto" : `${Math.max(680, studioHeightRef.current - 120)}px`;

      try {
        (["desktop", "tablet", "mobile"] as const).forEach((id) => {
          editor.DeviceManager?.get?.(id)?.set?.("minHeight", previewMin);
        });
      } catch {
        // ignore device update errors
      }

      const fitCanvas = () => {
        if (!editorAlive) return;
        try {
          editor.refresh?.({ tools: true });
          const zoom = Number(editor.Canvas?.getZoom?.() || 100);
          const gap = 0;
          editor.Canvas?.fitViewport?.({ ignoreHeight: true, gap, zoom });
          canvasInteractionGuards.rememberViewport();
          if (canvasInteractionGuards.isDragging()) {
            canvasInteractionGuards.pinViewport();
          }
        } catch {
          // ignore canvas fit errors
        }
      };

      requestAnimationFrame(fitCanvas);
      scheduleTimer(fitCanvas, 120);
    };

    const queueCanvasLayoutRefresh = () => {
      requestAnimationFrame(() => {
        if (!editorAlive) return;
        refreshCanvasLayout();
      });
      scheduleTimer(refreshCanvasLayout, 120);
    };

    const syncInitialStudioState = () => {
      syncEditorChromeState();
      applyProductShowcaseTopSpacing();
      queueCanvasLayoutRefresh();
      mountStudioPanels();
      syncBlockCategories();
    };

    const syncStudioDefaults = () => {
      try {
        setActiveLeftPanel("blocks");
        setActiveRightPanel("styles");
        setIsLeftSidebarHidden(true);
        setIsRightSidebarHidden(true);
        editor.setDevice("Desktop");
        hideLegacyViewsUi();
        queueCanvasLayoutRefresh();
        mountStudioPanels();
        syncBlockCategories();
        syncStudioDeviceState();
      } catch {
        // ignore default sync errors
      }
    };

    const handleBrowserFullscreenChange = () => {
      if (!editorAlive) return;

      const fs = isShellInFullscreen();
      setIsShellFullscreen(fs);
      queueCanvasLayoutRefresh();

      if (!fs && editor.Commands.isActive("fullscreen")) {
        editor.stopCommand("fullscreen", {
          sender: fullscreenSenderRef.current || undefined,
        });
      }
    };

    requestAnimationFrame(() => {
      if (!editorAlive) return;
      syncEditorChromeState();
    });
    scheduleTimer(syncEditorChromeState, 80);
    scheduleTimer(syncEditorChromeState, 240);
    handleBrowserFullscreenChange();
    queueCanvasLayoutRefresh();

    let canvasStyleObserver: MutationObserver | null = null;
    const attachCanvasStyleObserver = () => {
      const canvas = editor.getContainer()?.querySelector?.(".gjs-cv-canvas") as HTMLElement | null;
      if (!canvas || canvasStyleObserver) return;
      canvasStyleObserver = new MutationObserver(() => {
        const top = canvas.style.top;
        const height = canvas.style.height;
        const needsReset =
          (top && top !== "0" && top !== "0px") ||
          (height && height !== "auto" && height !== "100%" && height !== "100% !important");
        if (needsReset) {
          hideLegacyViewsUi();
        }
      });
      canvasStyleObserver.observe(canvas, { attributes: true, attributeFilter: ["style"] });
    };

    editor.on("load", attachCanvasStyleObserver);
    editor.on("load", syncInitialStudioState);
    editor.on("load", syncStudioDefaults);
    editor.on("change:device", syncStudioDeviceState);
    editor.on("load", refreshCanvasLayout);
    editor.on("change:device", refreshCanvasLayout);
    editor.on("command:run:fullscreen", refreshCanvasLayout);
    editor.on("command:stop:fullscreen", refreshCanvasLayout);
    editor.on("canvas:zoom", handleCanvasZoomChange);
    window.addEventListener("resize", refreshCanvasLayout);
    document.addEventListener("fullscreenchange", handleBrowserFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleBrowserFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleBrowserFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleBrowserFullscreenChange);

    const ensureUrlTraits = (component: any) => {
      if (!component) return;
      const tagName = String(component.get("tagName") || "").toLowerCase();

      if (tagName === "a") {
        component.set("traits", [
          {
            type: "text",
            name: "href",
            label: "URL",
            placeholder: "https://example.com",
          },
          {
            type: "select",
            name: "target",
            label: "Target",
            options: [
              { id: "", label: "Same tab" },
              { id: "_blank", label: "New tab" },
            ],
          },
          {
            type: "text",
            name: "rel",
            label: "Rel",
            placeholder: "noopener noreferrer",
          },
        ]);
      }

      if (tagName === "button") {
        component.set("traits", [
          {
            type: "text",
            name: "data-url",
            label: "URL",
            placeholder: "https://example.com",
          },
          {
            type: "select",
            name: "data-target",
            label: "Target",
            options: [
              { id: "", label: "Same tab" },
              { id: "_blank", label: "New tab" },
            ],
          },
        ]);
      }

      if (tagName === "video" || tagName === "iframe") {
        component.set("traits", [
          {
            type: "text",
            name: "src",
            label: "URL",
            placeholder: "https://...",
          },
          {
            type: "checkbox",
            name: "allowfullscreen",
            label: "Allow Fullscreen",
            valueTrue: "allowfullscreen",
            valueFalse: "",
          },
        ]);
      }
    };

    const handleComponentDeselected = () => {
      setHasSelection(false);
      setSelectionLabel("");
      setTextToolbarVisible(false);
      deactivateStudioTextFormatting(editor);
    };

    const handleTextComponentSelected = (component: any) => {
      if (!isEditableTextComponent(component)) {
        setTextToolbarVisible(false);
        deactivateStudioTextFormatting(editor);
        return;
      }

      setTextToolbarVisible(true);
      window.requestAnimationFrame(() => {
        activateStudioTextFormatting(editor);
      });
    };

    editor.on("component:selected", (component: any) => {
      ensureUrlTraits(component);
      setHasSelection(true);
      setSelectionLabel(getComponentBreadcrumb(component));
      setIsRightSidebarHidden(false);
      setActiveRightPanel("styles");
      handleTextComponentSelected(component);

      const tagName = String(component?.get?.("tagName") || "").toLowerCase();
      if (["a", "button", "video", "iframe"].includes(tagName)) {
        setActiveRightPanel("settings");
      }
    });

    editor.on("component:deselected", handleComponentDeselected);

    editor.on("component:add", syncCanvasEmptyState);
    editor.on("component:remove", syncCanvasEmptyState);
    editor.on("component:update", syncCanvasEmptyState);
    editor.on("load", syncCanvasEmptyState);
    editor.on("load", syncCanvasZoomState);
    editor.on("update", syncCanvasEmptyState);

    editor.on("component:update:attributes:data-url", (component: any) => {
      const tagName = String(component?.get?.("tagName") || "").toLowerCase();
      if (tagName !== "button") return;

      const attrs = component.getAttributes?.() || {};
      const url = String(attrs["data-url"] || "").trim();
      if (!url) {
        const nextOnClick = String(attrs.onclick || "").replace(/window\.open\([^)]*\);?/g, "").replace(/window\.location\.href\s*=\s*[^;]+;?/g, "").trim();
        component.addAttributes({ onclick: nextOnClick });
        return;
      }

      const target = String(attrs["data-target"] || "").trim();
      const escaped = JSON.stringify(url);
      const onClick = target === "_blank"
        ? `window.open(${escaped}, '_blank');`
        : `window.location.href=${escaped};`;

      component.addAttributes({ onclick: onClick });
    });

    editor.on("component:update:attributes:data-target", (component: any) => {
      const tagName = String(component?.get?.("tagName") || "").toLowerCase();
      if (tagName !== "button") return;
      const attrs = component.getAttributes?.() || {};
      if (!attrs["data-url"]) return;
      const url = String(attrs["data-url"] || "").trim();
      const target = String(attrs["data-target"] || "").trim();
      const escaped = JSON.stringify(url);
      const onClick = target === "_blank"
        ? `window.open(${escaped}, '_blank');`
        : `window.location.href=${escaped};`;
      component.addAttributes({ onclick: onClick });
    });

    editorRef.current = editor;

    const emit = () => {
      if (emitTimerRef.current !== null) {
        window.clearTimeout(emitTimerRef.current);
      }
      emitTimerRef.current = window.setTimeout(() => {
        const next = buildContent(editor);
        if (next !== lastEmittedRef.current) {
          lastEmittedRef.current = next;
          onChange(next);
        }
        emitTimerRef.current = null;
      }, 300);
    };

    const handleEditorReady = () => {
      setEditorReady(true);
      syncCanvasEmptyState();
      syncCanvasZoomState();
      try {
        editor.Canvas?.fitViewport?.({ ignoreHeight: true, gap: 0, zoom: 100 });
      } catch {
        // ignore
      }
    };

    editor.on("update", emit);
    editor.on("load", handleEditorReady);

    return () => {
      editorAlive = false;
      pendingTimers.forEach((id) => window.clearTimeout(id));
      pendingTimers.length = 0;

      try {
        if (emitTimerRef.current !== null) {
          window.clearTimeout(emitTimerRef.current);
        }
        activeColorPopoverCleanup?.();
        editor.off("update", emit);
        editor.off("load", syncInitialStudioState);
        editor.off("load", syncStudioDefaults);
        editor.off("load", handleEditorReady);
        editor.off("component:deselected", handleComponentDeselected);
        editor.off("component:add", syncCanvasEmptyState);
        editor.off("component:remove", syncCanvasEmptyState);
        editor.off("component:update", syncCanvasEmptyState);
        editor.off("change:device", syncStudioDeviceState);
        editor.off("load", refreshCanvasLayout);
        editor.off("change:device", refreshCanvasLayout);
        editor.off("command:run:fullscreen", refreshCanvasLayout);
        editor.off("command:stop:fullscreen", refreshCanvasLayout);
        editor.off("canvas:zoom", handleCanvasZoomChange);
        canvasStyleObserver?.disconnect();
        canvasStyleObserver = null;
        window.removeEventListener("resize", refreshCanvasLayout);
        document.removeEventListener("fullscreenchange", handleBrowserFullscreenChange);
        document.removeEventListener("webkitfullscreenchange", handleBrowserFullscreenChange);
        document.removeEventListener("mozfullscreenchange", handleBrowserFullscreenChange);
        document.removeEventListener("MSFullscreenChange", handleBrowserFullscreenChange);
        rteToolbarCleanupRef.current?.();
        rteToolbarCleanupRef.current = null;
        canvasInteractionGuards.cleanup();
        editor.destroy();
      } catch {
        // ignore destroy errors
      }
      editorRef.current = null;
      setEditorReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const incoming = value || "";
    if (!incoming || incoming === lastEmittedRef.current) return;

    const { body, css, js } = extractContentParts(incoming);
    jsRef.current = js;
    editor.setComponents(body || "");
    editor.setStyle(css || "");
    lastEmittedRef.current = incoming;
  }, [value]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      const shell = shellRef.current;
      const isFs = Boolean(shell && document.fullscreenElement === shell);
      if (!isFs) {
        const previewMin = `${Math.max(680, studioHeight - 120)}px`;
        (["desktop", "tablet", "mobile"] as const).forEach((id) => {
          editor.DeviceManager?.get?.(id)?.set?.("minHeight", previewMin);
        });
      }

      editor.setConfig?.({ height: "100%" });
      editor.refresh?.({ tools: true });
      requestAnimationFrame(() => {
        try {
          const canvas = editor.getContainer()?.querySelector?.(".gjs-cv-canvas") as HTMLElement | null;
          const editorRoot = editor.getContainer()?.querySelector?.(".gjs-editor") as HTMLElement | null;
          if (editorRoot) {
            editorRoot.style.height = "100%";
          }
          if (canvas) {
            canvas.style.position = "absolute";
            canvas.style.top = "0";
            canvas.style.left = "0";
            canvas.style.right = "0";
            canvas.style.bottom = "0";
            canvas.style.width = "auto";
            canvas.style.height = "auto";
            canvas.style.overflow = "auto";
          }
          const zoom = Number(editor.Canvas?.getZoom?.() || 100);
          editor.Canvas?.fitViewport?.({ ignoreHeight: true, gap: 0, zoom });
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore resize errors
    }
  }, [studioHeight]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const refreshViewport = () => {
      try {
        editor.refresh?.({ tools: true });
        editor.refreshCanvas?.({ tools: true });
        editor.Canvas?.refresh?.({ all: true });
        const zoom = Number(editor.Canvas?.getZoom?.() || 100);
        editor.Canvas?.fitViewport?.({
          ignoreHeight: true,
          gap: 0,
          zoom,
        });
      } catch {
        // ignore canvas refresh errors
      }
    };

    if (sidebarRefreshTimeoutRef.current !== null) {
      window.clearTimeout(sidebarRefreshTimeoutRef.current);
      sidebarRefreshTimeoutRef.current = null;
    }

    requestAnimationFrame(() => {
      refreshViewport();

      sidebarRefreshTimeoutRef.current = window.setTimeout(() => {
        refreshViewport();
        sidebarRefreshTimeoutRef.current = null;
      }, 240);
    });

    return () => {
      if (sidebarRefreshTimeoutRef.current !== null) {
        window.clearTimeout(sidebarRefreshTimeoutRef.current);
        sidebarRefreshTimeoutRef.current = null;
      }
    };
  }, [isLeftSidebarHidden, isRightSidebarHidden]);

  useEffect(() => {
    blockSearchQueryRef.current = blockSearch;
    filterBlockPanel(leftBlocksRef.current, blockSearch);
  }, [blockSearch]);

  useEffect(() => {
    const editor = editorRef.current;
    const host = rteHostRef.current;
    if (!editor || !host || !editorReady) return;

    rteToolbarCleanupRef.current?.();
    rteToolbarCleanupRef.current = mountStudioRteToolbar(editor, host);

    return () => {
      rteToolbarCleanupRef.current?.();
      rteToolbarCleanupRef.current = null;
    };
  }, [editorReady]);

  const handleDocMenuAction = (action: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (action.startsWith("device:")) {
      const deviceKey = action.replace("device:", "") as StudioDeviceKey;
      if (STUDIO_DEVICE_LABELS[deviceKey]) {
        editor.setDevice?.(STUDIO_DEVICE_LABELS[deviceKey]);
        setActiveDevice(deviceKey);
      }
      return;
    }

    if (action.startsWith("rte:")) {
      handleDocRteAction(action.replace(/^rte:/, ""));
      return;
    }

    editor.runCommand?.(action);
    if (action === "cms:canvas-zoom-in" || action === "cms:canvas-zoom-out" || action === "cms:canvas-fit") {
      window.setTimeout(() => {
        try {
          setCanvasZoom(Math.round(Number(editor.Canvas?.getZoom?.() || 100)));
        } catch {
          // ignore
        }
      }, 60);
    }
  };

  const handleDocRteAction = (action: string) => {
    const editor = editorRef.current;
    if (!editor) return;

    activateStudioTextFormatting(editor);

    if (action.startsWith("formatBlock:")) {
      const tag = action.split(":")[1] || "p";
      rteInstanceRef.current?.exec?.("formatBlock", `<${tag}>`);
      return;
    }

    runStudioRteAction(editor, action);
  };

  const runEditorCommand = (command: string) => {
    editorRef.current?.runCommand?.(command);
    if (command === "cms:canvas-zoom-in" || command === "cms:canvas-zoom-out" || command === "cms:canvas-fit") {
      window.setTimeout(() => {
        try {
          const editor = editorRef.current;
          if (!editor) return;
          setCanvasZoom(Math.round(Number(editor.Canvas?.getZoom?.() || 100)));
        } catch {
          // ignore
        }
      }, 60);
    }
    if (command === "cms:insert-hero") {
      setIsLeftSidebarHidden(false);
      setActiveLeftPanel("blocks");
      window.setTimeout(syncCanvasEmptyStateFromEditor, 120);
    }
  };

  const toggleShellFullscreen = () => {
    const editor = editorRef.current;
    if (!editor) return;

    if (isShellFullscreen || editor.Commands?.isActive?.("fullscreen")) {
      editor.stopCommand?.("fullscreen");
      return;
    }

    editor.runCommand?.("fullscreen");
  };

  const syncCanvasEmptyStateFromEditor = () => {
    const editor = editorRef.current;
    if (!editor) return;
    setCanvasEmpty(isEditorCanvasEmpty(editor));
  };

  return (
    <div
      ref={shellRef}
      className={`cms-grapes-shell${isLeftSidebarHidden ? " cms-grapes-shell--left-hidden" : ""}${isRightSidebarHidden ? " cms-grapes-shell--right-hidden" : ""}${isShellFullscreen ? " cms-grapes-shell--fullscreen-active" : ""}`}
      data-cms-tour="grapes-shell"
    >
      <div className="cms-grapes-studio-bar" data-cms-tour="grapes-studio-bar">
        <div className="cms-grapes-studio-bar__brand">
          <i className="fa-solid fa-wand-magic-sparkles" />
          <span>Visual Builder</span>
        </div>
        <div className="cms-grapes-studio-bar__tools">
          <button
            type="button"
            className="cms-grapes-studio-btn"
            title="Undo"
            disabled={!editorReady}
            onClick={() => editorRef.current?.UndoManager?.undo?.()}
          >
            <i className="fa-solid fa-rotate-left" />
          </button>
          <button
            type="button"
            className="cms-grapes-studio-btn"
            title="Redo"
            disabled={!editorReady}
            onClick={() => editorRef.current?.UndoManager?.redo?.()}
          >
            <i className="fa-solid fa-rotate-right" />
          </button>
          <span className="cms-grapes-studio-bar__divider" />
          {(["desktop", "tablet", "mobile"] as const).map((device) => (
            <button
              key={device}
              type="button"
              className={`cms-grapes-studio-btn${activeDevice === device ? " is-active" : ""}`}
              title={device.charAt(0).toUpperCase() + device.slice(1)}
              disabled={!editorReady}
              onClick={() => {
                editorRef.current?.setDevice?.(STUDIO_DEVICE_LABELS[device]);
                setActiveDevice(device);
              }}
            >
              <i className={`fa-solid fa-${device === "desktop" ? "desktop" : device === "tablet" ? "tablet-screen-button" : "mobile-screen-button"}`} />
            </button>
          ))}
          {hasSelection && (
            <>
              <span className="cms-grapes-studio-bar__divider" />
              <button
                type="button"
                className="cms-grapes-studio-btn"
                title="Duplicate (Ctrl+D)"
                disabled={!editorReady}
                onClick={() => runEditorCommand("cms:duplicate")}
              >
                <i className="fa-solid fa-clone" />
              </button>
              <button
                type="button"
                className="cms-grapes-studio-btn"
                title="Move up"
                disabled={!editorReady}
                onClick={() => runEditorCommand("cms:move-up")}
              >
                <i className="fa-solid fa-arrow-up" />
              </button>
              <button
                type="button"
                className="cms-grapes-studio-btn"
                title="Move down"
                disabled={!editorReady}
                onClick={() => runEditorCommand("cms:move-down")}
              >
                <i className="fa-solid fa-arrow-down" />
              </button>
              <button
                type="button"
                className="cms-grapes-studio-btn cms-grapes-studio-btn--danger"
                title="Delete (Del)"
                disabled={!editorReady}
                onClick={() => runEditorCommand("cms:delete")}
              >
                <i className="fa-solid fa-trash-can" />
              </button>
            </>
          )}
        </div>
        <div className="cms-grapes-studio-bar__actions">
          <button
            type="button"
            className="cms-grapes-studio-btn"
            title="Zoom out"
            disabled={!editorReady}
            onClick={() => runEditorCommand("cms:canvas-zoom-out")}
          >
            <i className="fa-solid fa-magnifying-glass-minus" />
          </button>
          <span className="cms-grapes-studio-bar__zoom">{canvasZoom}%</span>
          <button
            type="button"
            className="cms-grapes-studio-btn"
            title="Zoom in"
            disabled={!editorReady}
            onClick={() => runEditorCommand("cms:canvas-zoom-in")}
          >
            <i className="fa-solid fa-magnifying-glass-plus" />
          </button>
          <button
            type="button"
            className="cms-grapes-studio-btn"
            title="Fit canvas"
            disabled={!editorReady}
            onClick={() => runEditorCommand("cms:canvas-fit")}
          >
            <i className="fa-solid fa-compress" />
          </button>
          <span className="cms-grapes-studio-bar__divider" />
          <button
            type="button"
            className="cms-grapes-studio-btn"
            title="Preview page (Ctrl+Shift+P)"
            disabled={!editorReady}
            onClick={() => runEditorCommand("cms:preview-page")}
          >
            <i className="fa-solid fa-eye" />
          </button>
          <button
            type="button"
            className={`cms-grapes-studio-btn${isShellFullscreen ? " is-active" : ""}`}
            title={isShellFullscreen ? "Exit fullscreen (Esc)" : "Fullscreen"}
            disabled={!editorReady}
            onClick={toggleShellFullscreen}
          >
            <i className={`fa-solid ${isShellFullscreen ? "fa-compress" : "fa-expand"}`} />
          </button>
          <button
            type="button"
            className="cms-grapes-studio-btn cms-grapes-studio-btn--code"
            title="Edit code"
            disabled={!editorReady}
            onClick={() => editorRef.current?.runCommand?.("cms:open-code")}
          >
            {"</>"}
          </button>
        </div>
      </div>

      <GrapesRteDocBar
        editorReady={editorReady}
        textToolbarVisible={textToolbarVisible}
        rteHostRef={rteHostRef}
        onMenuAction={handleDocMenuAction}
        onRteAction={handleDocRteAction}
      />

      {selectionLabel && (
        <div className="cms-grapes-selection-bar">
          <i className="fa-solid fa-crosshairs" />
          <span>{selectionLabel}</span>
        </div>
      )}
      <div className="cms-grapes-shell__workspace">
        <aside className={`cms-grapes-sidebar cms-grapes-sidebar--left${isLeftSidebarHidden ? " is-hidden" : ""}`} data-cms-tour="grapes-blocks">
          <div className="cms-grapes-sidebar__toolbar">
            <button
              type="button"
              className={`cms-grapes-sidebar__tab${activeLeftPanel === "blocks" ? " is-active" : ""}`}
              onClick={() => setActiveLeftPanel("blocks")}
            >
              Blocks
            </button>
            <button
              type="button"
              className={`cms-grapes-sidebar__tab${activeLeftPanel === "layers" ? " is-active" : ""}`}
              data-cms-tour="grapes-layers-tab"
              onClick={() => setActiveLeftPanel("layers")}
            >
              Layers
            </button>
          </div>
          {activeLeftPanel === "blocks" && (
            <div className="cms-grapes-sidebar__search">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                value={blockSearch}
                onChange={(event) => setBlockSearch(event.target.value)}
                placeholder="Search blocks..."
                aria-label="Search blocks"
              />
            </div>
          )}
          <div
            ref={leftBlocksRef}
            className={`cms-grapes-sidebar__panel${activeLeftPanel === "blocks" ? " is-active" : ""}`}
          />
          <div
            ref={leftLayersRef}
            className={`cms-grapes-sidebar__panel${activeLeftPanel === "layers" ? " is-active" : ""}`}
          />
        </aside>

        <div className="cms-grapes-shell__host-wrap" data-cms-tour="grapes-canvas">
          <div ref={hostRef} className="cms-grapes-shell__host" />
          {editorReady && canvasEmpty && (
            <div className="cms-grapes-empty-guide">
              <div className="cms-grapes-empty-guide__card">
                <i className="fa-solid fa-wand-magic-sparkles" />
                <h3>Start building your page</h3>
                <p>Drag a section from the blocks panel, or use a quick starter below.</p>
                <div className="cms-grapes-empty-guide__actions">
                  <button
                    type="button"
                    className="cms-grapes-empty-guide__btn cms-grapes-empty-guide__btn--primary"
                    onClick={() => {
                      setIsLeftSidebarHidden(false);
                      setActiveLeftPanel("blocks");
                    }}
                  >
                    <i className="fa-solid fa-table-cells-large" /> Browse blocks
                  </button>
                  <button
                    type="button"
                    className="cms-grapes-empty-guide__btn"
                    onClick={() => runEditorCommand("cms:insert-hero")}
                  >
                    <i className="fa-solid fa-flag" /> Add Hero section
                  </button>
                </div>
                <p className="cms-grapes-empty-guide__tips">
                  Tip: Click any element to style it · Ctrl+D duplicate · Del delete · Ctrl+Shift+P preview
                </p>
              </div>
            </div>
          )}
        </div>

        <aside
          className={`cms-grapes-sidebar cms-grapes-sidebar--right${isRightSidebarHidden ? " is-hidden" : ""}`}
          data-cms-tour="grapes-styles"
        >
          <div className="cms-grapes-sidebar__toolbar">
            <button
              type="button"
              className={`cms-grapes-sidebar__tab${activeRightPanel === "styles" ? " is-active" : ""}`}
              onClick={() => setActiveRightPanel("styles")}
            >
              Styles
            </button>
            <button
              type="button"
              className={`cms-grapes-sidebar__tab${activeRightPanel === "settings" ? " is-active" : ""}`}
              onClick={() => setActiveRightPanel("settings")}
            >
              Settings
            </button>
          </div>
          <div
            ref={rightStylesRef}
            className={`cms-grapes-sidebar__panel${activeRightPanel === "styles" ? " is-active" : ""}`}
          />
          <div
            ref={rightTraitsRef}
            className={`cms-grapes-sidebar__panel${activeRightPanel === "settings" ? " is-active" : ""}`}
          />
        </aside>
      </div>

      <button
        type="button"
        className="cms-grapes-shell__edge-toggle cms-grapes-shell__edge-toggle--left"
        onClick={() => setIsLeftSidebarHidden((hidden) => !hidden)}
        title={isLeftSidebarHidden ? "Show left sidebar" : "Hide left sidebar"}
        aria-label={isLeftSidebarHidden ? "Show left sidebar" : "Hide left sidebar"}
      >
        <span className={`fa ${isLeftSidebarHidden ? "fa-chevron-right" : "fa-chevron-left"}`} aria-hidden="true" />
      </button>

      <button
        type="button"
        className="cms-grapes-shell__edge-toggle cms-grapes-shell__edge-toggle--right"
        onClick={() => setIsRightSidebarHidden((hidden) => !hidden)}
        title={isRightSidebarHidden ? "Show right sidebar" : "Hide right sidebar"}
        aria-label={isRightSidebarHidden ? "Show right sidebar" : "Hide right sidebar"}
      >
        <span className={`fa ${isRightSidebarHidden ? "fa-chevron-left" : "fa-chevron-right"}`} aria-hidden="true" />
      </button>

      <style jsx global>{`
        .cms-grapes-shell {
          --cms-left-sidebar-width: 320px;
          --cms-right-sidebar-width: 300px;
          --cms-canvas-padding: 0px;
          --cms-grapes-accent: #6366f1;
          --cms-grapes-accent-dark: #4f46e5;
          position: relative;
          border: 1px solid rgba(99, 102, 241, 0.12);
          border-radius: 16px;
          overflow: hidden;
          background: #0f172a;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
          display: flex;
          flex-direction: column;
        }

        .cms-grapes-studio-bar {
          display: grid;
          grid-template-columns: minmax(120px, 1fr) auto minmax(120px, 1fr);
          align-items: center;
          gap: 12px;
          padding: 8px 16px;
          min-height: 52px;
          background: linear-gradient(180deg, #111827 0%, #0f172a 100%);
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          flex-shrink: 0;
        }

        .cms-grapes-studio-bar__brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          justify-self: start;
          color: #f1f5f9;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }

        .cms-grapes-studio-bar__brand i {
          color: #818cf8;
          font-size: 14px;
        }

        .cms-grapes-studio-bar__tools {
          justify-self: center;
        }

        .cms-grapes-studio-bar__actions {
          justify-self: end;
        }

        .cms-grapes-studio-bar__tools,
        .cms-grapes-studio-bar__actions {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .cms-grapes-studio-bar__divider {
          width: 1px;
          height: 22px;
          background: rgba(148, 163, 184, 0.25);
          margin: 0 4px;
        }

        .cms-grapes-studio-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: transparent;
          color: #94a3b8;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 13px;
          transition: background 0.12s, border-color 0.12s, color 0.12s;
        }

        .cms-grapes-studio-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(148, 163, 184, 0.2);
          color: #f1f5f9;
        }

        .cms-grapes-studio-btn.is-active {
          background: rgba(99, 102, 241, 0.22);
          border-color: rgba(129, 140, 248, 0.4);
          color: #e0e7ff;
        }

        .cms-grapes-studio-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .cms-grapes-studio-btn--code {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: -0.02em;
          min-width: 42px;
        }

        .cms-grapes-studio-btn--danger:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.18);
          border-color: rgba(248, 113, 113, 0.35);
          color: #fecaca;
        }

        .cms-grapes-studio-bar__zoom {
          min-width: 42px;
          text-align: center;
          font-size: 12px;
          font-weight: 700;
          color: #cbd5e1;
        }

        .cms-grapes-doc-bar {
          display: flex;
          align-items: center;
          min-height: 38px;
          background: #fff;
          border-bottom: 1px solid #e2e8f0;
          flex-shrink: 0;
        }

        .cms-grapes-doc-bar.is-rte-mode {
          padding: 4px 10px;
          overflow-x: auto;
          overflow-y: hidden;
        }

        .cms-grapes-doc-bar__menus {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 2px 8px;
          padding: 4px 10px;
          width: 100%;
        }

        .cms-grapes-doc-bar__hint {
          margin-left: auto;
          font-size: 12px;
          color: #64748b;
        }

        .cms-grapes-doc-bar__menu {
          position: relative;
        }

        .cms-grapes-doc-bar__menu-btn {
          border: 0;
          background: transparent;
          color: #334155;
          font-size: 12px;
          font-weight: 600;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
        }

        .cms-grapes-doc-bar__menu-btn:hover:not(:disabled),
        .cms-grapes-doc-bar__menu-btn.is-open {
          background: #eef2ff;
          color: #4338ca;
        }

        .cms-grapes-doc-bar__dropdown {
          position: absolute;
          top: calc(100% + 4px);
          left: 0;
          z-index: 40;
          min-width: 220px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.14);
          padding: 6px;
        }

        .cms-grapes-doc-bar__dropdown-item {
          width: 100%;
          border: 0;
          background: transparent;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 12px;
          color: #334155;
          text-align: left;
          cursor: pointer;
        }

        .cms-grapes-doc-bar__dropdown-item:hover:not(:disabled) {
          background: #f1f5f9;
        }

        .cms-grapes-doc-bar__dropdown-item:disabled {
          opacity: 0.55;
          cursor: default;
        }

        .cms-grapes-doc-bar__shortcut {
          font-size: 11px;
          color: #94a3b8;
        }

        .cms-grapes-rte-host {
          display: none;
          align-items: center;
          flex: 1 1 auto;
          min-width: 0;
        }

        .cms-grapes-rte-host.is-active {
          display: flex;
        }

        .cms-grapes-rte-host__actions {
          display: inline-flex;
          flex-wrap: nowrap;
          align-items: center;
          gap: 4px;
          width: max-content;
          max-width: none;
        }

        .cms-grapes-rte-host__btn,
        .cms-grapes-rte-host__actions .gjs-rte-action,
        .cms-grapes-rte-host__actions span {
          flex: 0 0 auto;
          width: auto !important;
          min-width: 28px;
          height: 28px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          background: #fff;
          color: #334155;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 12px;
          padding: 0 6px;
          box-sizing: border-box;
        }

        .cms-grapes-rte-host__actions select.cms-gjs-rte-format,
        .cms-grapes-rte-host__actions .cms-gjs-rte-format {
          height: 28px;
          min-width: 108px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 12px;
          padding: 0 8px;
          background: #fff;
        }

        .cms-grapes-shell .gjs-rte-toolbar {
          display: none !important;
        }

        .cms-grapes-selection-bar {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(99, 102, 241, 0.12);
          border-bottom: 1px solid rgba(99, 102, 241, 0.18);
          color: #c7d2fe;
          font-size: 12px;
          font-weight: 600;
        }

        .cms-grapes-selection-bar i {
          color: #818cf8;
          font-size: 11px;
        }

        .cms-grapes-selection-bar__hint {
          margin-left: auto;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 500;
        }

        .cms-grapes-sidebar__search {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .cms-grapes-sidebar__search i {
          color: #64748b;
          font-size: 12px;
        }

        .cms-grapes-sidebar__search input {
          width: 100%;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
          font-size: 12px;
          padding: 7px 10px;
          outline: none;
        }

        .cms-grapes-sidebar__search input:focus {
          border-color: rgba(129, 140, 248, 0.45);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
        }

        .cms-grapes-sidebar__search input::placeholder {
          color: #64748b;
        }

        .cms-grapes-shell__host-wrap {
          position: relative;
          min-width: 0;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .cms-grapes-empty-guide {
          position: absolute;
          inset: 0;
          z-index: 6;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          pointer-events: none;
        }

        .cms-grapes-empty-guide__card {
          pointer-events: auto;
          max-width: 420px;
          width: 100%;
          padding: 24px 22px;
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(15, 23, 42, 0.88);
          color: #e2e8f0;
          text-align: center;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
          backdrop-filter: blur(8px);
        }

        .cms-grapes-empty-guide__card > i {
          font-size: 28px;
          color: #818cf8;
          margin-bottom: 10px;
        }

        .cms-grapes-empty-guide__card h3 {
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 700;
          color: #f8fafc;
        }

        .cms-grapes-empty-guide__card p {
          margin: 0;
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.5;
        }

        .cms-grapes-empty-guide__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 16px;
        }

        .cms-grapes-empty-guide__btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          color: #e2e8f0;
          font-size: 12px;
          font-weight: 600;
          padding: 8px 12px;
          cursor: pointer;
        }

        .cms-grapes-empty-guide__btn--primary {
          background: linear-gradient(135deg, var(--cms-grapes-accent), var(--cms-grapes-accent-dark));
          border-color: transparent;
          color: #fff;
        }

        .cms-grapes-empty-guide__btn:hover {
          filter: brightness(1.06);
        }

        .cms-grapes-empty-guide__tips {
          margin-top: 14px !important;
          font-size: 11px !important;
          color: #64748b !important;
        }

        .cms-grapes-shell__workspace {
          flex: 1 1 auto;
          min-height: 0;
        }

        .cms-grapes-shell:fullscreen,
        .cms-grapes-shell:-webkit-full-screen,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active {
          display: flex;
          flex-direction: column;
          width: 100vw;
          height: 100vh;
          max-width: none;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          overflow: hidden;
        }

        .cms-grapes-shell:fullscreen .cms-grapes-shell__workspace,
        .cms-grapes-shell:-webkit-full-screen .cms-grapes-shell__workspace,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .cms-grapes-shell__workspace {
          flex: 1 1 auto;
          min-height: 0 !important;
          height: auto !important;
        }

        .cms-grapes-shell:fullscreen .cms-grapes-sidebar,
        .cms-grapes-shell:-webkit-full-screen .cms-grapes-sidebar,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .cms-grapes-sidebar {
          height: auto !important;
          min-height: 0 !important;
        }

        .cms-grapes-shell:fullscreen .cms-grapes-shell__host-wrap,
        .cms-grapes-shell:-webkit-full-screen .cms-grapes-shell__host-wrap,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .cms-grapes-shell__host-wrap,
        .cms-grapes-shell:fullscreen .cms-grapes-shell__host,
        .cms-grapes-shell:-webkit-full-screen .cms-grapes-shell__host,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .cms-grapes-shell__host,
        .cms-grapes-shell:fullscreen .gjs-editor,
        .cms-grapes-shell:-webkit-full-screen .gjs-editor,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .gjs-editor,
        .cms-grapes-shell:fullscreen .cms-grapes-shell__host .gjs-editor-cont,
        .cms-grapes-shell:-webkit-full-screen .cms-grapes-shell__host .gjs-editor-cont,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .cms-grapes-shell__host .gjs-editor-cont {
          height: 100% !important;
          min-height: 0 !important;
          max-height: none !important;
        }

        .cms-grapes-shell:fullscreen .gjs-cv-canvas__frames,
        .cms-grapes-shell:-webkit-full-screen .gjs-cv-canvas__frames,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .gjs-cv-canvas__frames {
          min-height: auto;
        }

        .cms-grapes-shell:fullscreen .gjs-cv-canvas,
        .cms-grapes-shell:-webkit-full-screen .gjs-cv-canvas,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .gjs-cv-canvas {
          overflow: auto !important;
          overscroll-behavior: auto;
        }

        .cms-grapes-shell:fullscreen .cms-grapes-shell__host-wrap,
        .cms-grapes-shell:-webkit-full-screen .cms-grapes-shell__host-wrap,
        .cms-grapes-shell.cms-grapes-shell--fullscreen-active .cms-grapes-shell__host-wrap {
          overflow: hidden;
          min-height: 0;
        }

        .cms-grapes-shell.cms-grapes-shell--left-hidden {
          --cms-left-sidebar-width: 0px;
          --cms-canvas-padding: 0px;
        }

        .cms-grapes-shell.cms-grapes-shell--right-hidden {
          --cms-right-sidebar-width: 0px;
          --cms-canvas-padding: 0px;
        }

        .cms-grapes-shell.cms-grapes-shell--left-hidden.cms-grapes-shell--right-hidden {
          --cms-canvas-padding: 0px;
        }

        .cms-grapes-shell__workspace {
          display: grid;
          grid-template-columns: var(--cms-left-sidebar-width) minmax(0, 1fr) var(--cms-right-sidebar-width);
          height: ${studioHeight}px;
          min-height: 640px;
        }

        .cms-grapes-sidebar {
          display: flex;
          flex-direction: column;
          height: ${studioHeight}px;
          min-width: 0;
          min-height: ${studioHeight}px;
          background: linear-gradient(180deg, #0c0f1a 0%, #0f172a 55%, #0a0e18 100%);
          color: #e2e8f0;
          overflow: hidden;
          transition: opacity 180ms ease, border-color 180ms ease;
        }

        .cms-grapes-sidebar.is-hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          border-color: transparent;
        }

        .cms-grapes-sidebar--left {
          border-right: 1px solid rgba(148, 163, 184, 0.16);
        }

        .cms-grapes-sidebar--right {
          border-left: 1px solid rgba(148, 163, 184, 0.16);
        }

        .cms-grapes-sidebar__toolbar {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          padding: 12px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .cms-grapes-sidebar__tab {
          min-height: 36px;
          padding: 8px 10px;
          border: 0;
          border-radius: 8px;
          background: transparent;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          transition: background-color 120ms ease, color 120ms ease;
        }

        .cms-grapes-sidebar__tab:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #e2e8f0;
        }

        .cms-grapes-sidebar__tab.is-active {
          background: rgba(99, 102, 241, 0.2);
          color: #e0e7ff;
          box-shadow: none;
        }

        .cms-grapes-sidebar__panel {
          display: none;
          flex: 1 1 0;
          min-height: 0;
          overflow: auto;
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.32) transparent;
        }

        .cms-grapes-sidebar__panel::-webkit-scrollbar {
          width: 10px;
        }

        .cms-grapes-sidebar__panel::-webkit-scrollbar-track {
          background: transparent;
        }

        .cms-grapes-sidebar__panel::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.28);
          border-radius: 999px;
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .cms-grapes-sidebar__panel::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.42);
          border: 2px solid transparent;
          background-clip: padding-box;
        }

        .cms-grapes-sidebar__panel.is-active {
          display: block;
        }

        .cms-grapes-sidebar--right input[type="color"] {
          position: absolute !important;
          width: 0 !important;
          height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
          visibility: hidden !important;
        }

        .cms-grapes-sidebar--right .gjs-field-colorp,
        .cms-grapes-sidebar--right .gjs-sm-colorp-c,
        .cms-grapes-sidebar--right .gjs-field-color-picker,
        .cms-grapes-sidebar--right .gjs-sm-color-picker {
          display: none !important;
          pointer-events: none !important;
        }

        .cms-grapes-sidebar--right .gjs-property.gjs-color .gjs-input-holder {
          display: none !important;
        }

        .cms-grapes-shell__host {
          position: relative;
          flex: 1 1 auto;
          height: 100% !important;
          min-height: 0;
          min-width: 0;
          overflow: hidden;
        }

        .cms-grapes-shell__host .gjs-editor-cont {
          position: relative !important;
          height: 100% !important;
          min-height: 100% !important;
          overflow: hidden !important;
        }

        .cms-grapes-shell__edge-toggle {
          position: absolute;
          top: 50%;
          z-index: 40;
          width: 28px;
          height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          background: #1e293b;
          color: #94a3b8;
          box-shadow: 0 4px 16px rgba(15, 23, 42, 0.3);
          transform: translateY(-50%);
          transition: left 220ms ease, right 220ms ease, border-color 120ms ease, color 120ms ease, background-color 120ms ease;
        }

        .cms-grapes-shell__edge-toggle:hover {
          border-color: rgba(129, 140, 248, 0.45);
          background: #334155;
          color: #e2e8f0;
        }

        .cms-grapes-shell__edge-toggle--left {
          left: calc(var(--cms-left-sidebar-width) - 8px);
        }

        .cms-grapes-shell__edge-toggle--right {
          right: calc(var(--cms-right-sidebar-width) - 8px);
        }

        .cms-grapes-shell.cms-grapes-shell--left-hidden .cms-grapes-shell__edge-toggle--left {
          left: 10px;
        }

        .cms-grapes-shell.cms-grapes-shell--right-hidden .cms-grapes-shell__edge-toggle--right {
          right: 10px;
        }

        .cms-grapes-shell .gjs-editor {
          --cms-side-panel-width: 0px;
          --gjs-left-width: 0px !important;
          --gjs-canvas-top: 0px !important;
          position: relative;
          height: 100% !important;
          min-height: 0 !important;
          background: #0f172a;
          overflow: hidden;
        }

        .cms-grapes-shell .gjs-one-bg {
          background-color: #0f172a;
        }

        .cms-grapes-shell .gjs-two-color {
          color: #cbd5e1;
        }

        .cms-grapes-shell .gjs-three-bg {
          background: linear-gradient(135deg, var(--cms-grapes-accent), var(--cms-grapes-accent-dark));
          color: #ffffff;
        }

        .cms-grapes-shell .gjs-four-color {
          color: #ffffff;
        }

        .cms-grapes-shell .gjs-cv-canvas {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: auto !important;
          height: auto !important;
          transition: right 220ms ease;
          background-color: #0f172a;
          background-image: none;
          padding: 0;
          box-sizing: border-box;
          overflow: auto !important;
          overscroll-behavior: auto;
          -webkit-overflow-scrolling: touch;
        }

        .cms-grapes-shell.cms-grapes-shell--dragging .gjs-cv-canvas {
          user-select: none;
        }

        .cms-grapes-shell .gjs-cv-canvas__frames {
          min-height: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
        }

        .cms-grapes-shell .gjs-frame-wrapper {
          margin: 0 auto;
          flex: 0 0 auto;
          width: 100%;
          max-width: 100%;
          border-radius: 0;
          overflow: visible !important;
          border: 0;
          box-shadow: none;
          background: #ffffff;
        }

        .cms-grapes-shell .gjs-frame {
          width: 100% !important;
          display: block;
        }

        .cms-grapes-shell .gjs-pn-commands,
        .cms-grapes-shell .gjs-pn-panel {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          height: 0 !important;
          min-height: 0 !important;
          max-height: 0 !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
          border: 0 !important;
          box-shadow: none !important;
          font-size: 0 !important;
          line-height: 0 !important;
          padding: 0 !important;
          margin: 0 !important;
        }

        .cms-grapes-shell .gjs-pn-panel {
          background: linear-gradient(180deg, #0c0f1a 0%, #0f172a 55%, #0a0e18 100%);
          color: #cbd5e1;
          border: 0;
        }

        .cms-grapes-shell .gjs-pn-panel.gjs-pn-devices-c {
          display: none !important;
        }

        .cms-grapes-shell .gjs-pn-panel.gjs-pn-options {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          height: 0 !important;
          min-height: 0 !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        .cms-grapes-shell .gjs-pn-views-container,
        .cms-grapes-shell .gjs-pn-panel.gjs-pn-views {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
          overflow: hidden !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        .cms-grapes-shell .gjs-pn-btn {
          min-width: 38px;
          height: 38px;
          border-radius: 12px;
          border: 1px solid transparent;
          color: #cbd5e1;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: transform 120ms ease, background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
        }

        .cms-grapes-shell .gjs-pn-btn:hover {
          transform: translateY(-1px);
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(148, 163, 184, 0.18);
          color: #ffffff;
        }

        .cms-grapes-shell .gjs-pn-btn.gjs-pn-active {
          background: linear-gradient(135deg, var(--cms-grapes-accent), var(--cms-grapes-accent-dark));
          border-color: rgba(129, 140, 248, 0.45);
          color: #ffffff;
          box-shadow: 0 14px 24px rgba(99, 102, 241, 0.28);
        }

        .cms-grapes-shell .cms-device-btn {
          min-width: 38px;
        }

        .cms-grapes-shell .cms-open-code-btn {
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          min-width: 30px;
        }

        .cms-grapes-shell .cms-open-code-btn::before {
          content: "</>";
          font-size: 12px;
          line-height: 1;
          font-weight: 700;
          letter-spacing: -0.2px;
        }

        .cms-grapes-shell .gjs-block-categories {
          display: flex;
          flex-direction: column;
        }

        .cms-grapes-shell .gjs-block-category {
          margin: 0;
          width: auto;
          border-radius: 0;
          overflow: visible;
          border: 0;
          background: transparent;
          box-shadow: none;
        }

        .cms-grapes-shell .gjs-block-category .gjs-title {
          padding: 16px 14px 8px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #64748b;
          background: transparent;
          border-bottom: 0;
        }

        .cms-grapes-shell .gjs-block-category .gjs-blocks-c {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          padding: 0 10px 12px;
        }

        .cms-grapes-shell .gjs-block {
          width: 100%;
          min-height: 0;
          padding: 10px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.12);
          border-radius: 10px;
          color: #e2e8f0;
          box-shadow: none;
          cursor: grab;
          touch-action: none;
          transition: background-color 120ms ease, border-color 120ms ease;
        }

        .cms-grapes-shell .gjs-block:active {
          cursor: grabbing;
        }

        .cms-grapes-shell .gjs-block:hover {
          transform: none;
          border-color: rgba(129, 140, 248, 0.35);
          box-shadow: none;
          background: rgba(99, 102, 241, 0.14);
        }

        .cms-grapes-shell .gjs-block .gjs-block__media {
          width: 36px;
          min-width: 36px;
          height: 36px;
          min-height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          line-height: 1;
          margin-bottom: 0;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.07);
          border: 0;
          flex: 0 0 auto;
        }

        .cms-grapes-shell .cms-gjs-block-media {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #f8fafc;
        }

        .cms-grapes-shell .gjs-block .gjs-block__media svg {
          width: 34px !important;
          height: 34px !important;
        }

        .cms-grapes-shell .gjs-block .gjs-block-label {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0;
          line-height: 1.25;
          font-size: 10px;
          text-align: center;
          white-space: normal;
          word-break: normal;
          overflow-wrap: anywhere;
          font-weight: 600;
          flex: 1 1 auto;
          min-width: 0;
          min-height: 0;
          color: #cbd5e1;
        }

        .cms-grapes-shell .gjs-sm-sector,
        .cms-grapes-shell .gjs-layer-manager,
        .cms-grapes-shell .gjs-trt-traits {
          margin: 8px;
          padding: 12px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(148, 163, 184, 0.1);
          color: #e2e8f0;
        }

        .cms-grapes-shell .gjs-sm-sector {
          position: relative;
          box-shadow: none;
          transition: border-color 180ms ease, background 220ms ease;
          animation: none;
        }

        .cms-grapes-shell .gjs-sm-sector::before {
          content: "";
          position: absolute;
          top: 0;
          left: 14px;
          right: 14px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(96, 165, 250, 0),
            rgba(96, 165, 250, 0.5),
            rgba(96, 165, 250, 0)
          );
          opacity: 0;
          transform: translateY(-6px);
          transition: opacity 220ms ease, transform 220ms ease;
          pointer-events: none;
        }

        .cms-grapes-shell .gjs-sm-sector:nth-child(1) {
          animation-delay: 40ms;
        }

        .cms-grapes-shell .gjs-sm-sector:nth-child(2) {
          animation-delay: 80ms;
        }

        .cms-grapes-shell .gjs-sm-sector:nth-child(3) {
          animation-delay: 120ms;
        }

        .cms-grapes-shell .gjs-sm-sector:nth-child(4) {
          animation-delay: 160ms;
        }

        .cms-grapes-shell .gjs-sm-sector:nth-child(5) {
          animation-delay: 200ms;
        }

        .cms-grapes-shell .gjs-sm-sector:nth-child(6) {
          animation-delay: 240ms;
        }

        .cms-grapes-shell .gjs-sm-sector:hover {
          transform: translateY(-2px);
          border-color: rgba(96, 165, 250, 0.28);
          box-shadow: 0 24px 42px rgba(8, 15, 30, 0.28);
        }

        .cms-grapes-shell .gjs-sm-sector:hover::before,
        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open::before {
          opacity: 1;
          transform: translateY(0);
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open {
          background: rgba(15, 23, 42, 0.72);
          border-color: rgba(96, 165, 250, 0.24);
          box-shadow: 0 22px 40px rgba(8, 15, 30, 0.3);
        }

        .cms-grapes-shell .gjs-sm-properties,
        .cms-grapes-shell .gjs-sm-property,
        .cms-grapes-shell .gjs-sm-label,
        .cms-grapes-shell .gjs-sm-property__label,
        .cms-grapes-shell .gjs-layer-item,
        .cms-grapes-shell .gjs-layer-name,
        .cms-grapes-shell .gjs-layer-children,
        .cms-grapes-shell .gjs-trt-trait,
        .cms-grapes-shell .gjs-trt-trait__label,
        .cms-grapes-shell .gjs-label,
        .cms-grapes-shell .gjs-radio-items label,
        .cms-grapes-shell .gjs-clm-tags,
        .cms-grapes-shell .gjs-sm-empty,
        .cms-grapes-shell .gjs-sm-sector .gjs-sm-field,
        .cms-grapes-shell .gjs-field select,
        .cms-grapes-shell .gjs-field input,
        .cms-grapes-shell .gjs-field textarea {
          color: #e2e8f0;
        }

        .cms-grapes-shell .gjs-sm-properties {
          padding: 12px 4px 4px;
          transform-origin: top center;
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-properties {
          animation: cms-style-sector-open 240ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-property {
          animation: cms-style-property-enter 260ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-property:nth-child(1) {
          animation-delay: 25ms;
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-property:nth-child(2) {
          animation-delay: 50ms;
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-property:nth-child(3) {
          animation-delay: 75ms;
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-property:nth-child(4) {
          animation-delay: 100ms;
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-property:nth-child(5) {
          animation-delay: 125ms;
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-property:nth-child(6) {
          animation-delay: 150ms;
        }

        .cms-grapes-shell .gjs-sm-sector-title,
        .cms-grapes-shell .gjs-layer-title,
        .cms-grapes-shell .gjs-trt-trait__label {
          color: #f8fafc;
          font-weight: 700;
        }

        .cms-grapes-shell .gjs-sm-sector-title {
          padding: 14px 16px;
          border-radius: 14px;
          background: rgba(10, 17, 33, 0.42);
          transition:
            background 220ms ease,
            box-shadow 220ms ease,
            transform 180ms ease;
        }

        .cms-grapes-shell .gjs-sm-sector:hover .gjs-sm-sector-title {
          background: rgba(15, 23, 42, 0.68);
        }

        .cms-grapes-shell .gjs-sm-sector.gjs-sm-open .gjs-sm-sector-title {
          background: linear-gradient(
            180deg,
            rgba(37, 99, 235, 0.18),
            rgba(15, 23, 42, 0.52)
          );
          box-shadow: inset 0 0 0 1px rgba(96, 165, 250, 0.14);
        }

        .cms-grapes-shell .gjs-sm-sector-caret,
        .cms-grapes-shell .gjs-layer-caret,
        .cms-grapes-shell .gjs-field-arrow-u,
        .cms-grapes-shell .gjs-two-color {
          color: #cbd5e1;
        }

        .cms-grapes-shell .gjs-sm-sector-caret {
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), color 180ms ease;
        }

        .cms-grapes-shell .gjs-field,
        .cms-grapes-shell .gjs-input-holder input,
        .cms-grapes-shell .gjs-input-holder select,
        .cms-grapes-shell .gjs-input-holder textarea {
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .cms-grapes-shell .gjs-field:focus-within,
        .cms-grapes-shell .gjs-input-holder input:focus,
        .cms-grapes-shell .gjs-input-holder select:focus,
        .cms-grapes-shell .gjs-input-holder textarea:focus {
          border-color: rgba(96, 165, 250, 0.45);
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
          transform: translateY(-1px);
        }

        .cms-grapes-shell .cms-gjs-color-field-shell {
          width: 100%;
          min-height: 0;
          padding: 0 !important;
          border: 0 !important;
          background: transparent !important;
          box-shadow: none !important;
        }

        .cms-grapes-shell .cms-gjs-color-field-shell:focus-within {
          box-shadow: none;
          transform: none;
        }

        .cms-grapes-shell .cms-gjs-color-field {
          display: block;
          width: 100%;
        }

        .cms-grapes-shell .cms-gjs-color-field__picker {
          width: 100%;
          min-height: 40px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease,
            transform 180ms ease;
        }

        .cms-grapes-shell .cms-gjs-color-field__picker {
          display: flex;
          align-items: center;
          gap: 12px;
          justify-content: space-between;
          padding: 6px 10px;
          cursor: pointer;
          appearance: none;
          text-align: left;
        }

        .cms-grapes-shell .cms-gjs-color-field__meta {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1 1 auto;
        }

        .cms-grapes-shell .cms-gjs-color-field__preview {
          display: inline-block;
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          border-radius: 8px;
          background: #000000;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.35);
        }

        .cms-grapes-shell .cms-gjs-color-field__preview[data-empty="true"] {
          background:
            linear-gradient(45deg, rgba(148, 163, 184, 0.18) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.18) 75%),
            linear-gradient(45deg, rgba(148, 163, 184, 0.18) 25%, transparent 25%, transparent 75%, rgba(148, 163, 184, 0.18) 75%);
          background-position: 0 0, 6px 6px;
          background-size: 12px 12px;
          background-color: rgba(255, 255, 255, 0.06);
        }

        .cms-grapes-shell .cms-gjs-color-field__value {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: #e2e8f0;
          font-size: 12px;
          line-height: 1;
          font-family: "Consolas", "SFMono-Regular", ui-monospace, monospace;
        }

        .cms-grapes-shell .cms-gjs-color-field__affordance {
          width: 10px;
          height: 10px;
          flex: 0 0 10px;
          margin-right: 2px;
          border-right: 2px solid rgba(148, 163, 184, 0.72);
          border-bottom: 2px solid rgba(148, 163, 184, 0.72);
          transform: rotate(45deg) translateY(-1px);
          transition: transform 180ms ease, border-color 180ms ease;
        }

        .cms-grapes-shell .cms-gjs-color-field__picker:hover .cms-gjs-color-field__affordance,
        .cms-grapes-shell .cms-gjs-color-field__picker:focus .cms-gjs-color-field__affordance,
        .cms-grapes-shell .cms-gjs-color-field__picker[aria-expanded="true"] .cms-gjs-color-field__affordance {
          border-right-color: #e2e8f0;
          border-bottom-color: #e2e8f0;
        }

        .cms-grapes-shell .cms-gjs-color-field__picker[aria-expanded="true"] .cms-gjs-color-field__affordance {
          transform: rotate(-135deg) translateY(-1px);
        }

        .cms-grapes-shell .cms-gjs-color-field__picker:focus,
        .cms-grapes-shell .cms-gjs-color-field__picker[aria-expanded="true"] {
          outline: none;
          border-color: rgba(96, 165, 250, 0.45);
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
          transform: translateY(-1px);
        }

        .cms-gjs-color-field__popover {
          position: fixed;
          z-index: 2147483647;
          width: 224px;
          padding: 14px;
          border-radius: 18px;
          border: 1px solid rgba(96, 165, 250, 0.18);
          background: linear-gradient(180deg, rgba(8, 16, 31, 0.98), rgba(15, 23, 42, 0.98));
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(12px);
        }

        .cms-gjs-color-field__popover-head {
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin-bottom: 10px;
        }

        .cms-gjs-color-field__popover-label {
          color: #94a3b8;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .cms-gjs-color-field__popover-input {
          width: 100%;
          min-height: 40px;
          margin-bottom: 12px;
          padding: 10px 12px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #f8fafc;
          font-family: "Consolas", "SFMono-Regular", ui-monospace, monospace;
          transition:
            border-color 180ms ease,
            background 180ms ease,
            box-shadow 180ms ease;
        }

        .cms-gjs-color-field__popover-input:focus {
          outline: none;
          border-color: rgba(96, 165, 250, 0.45);
          background: rgba(15, 23, 42, 0.8);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12);
        }

        .cms-gjs-color-field__wheel {
          width: 100%;
        }

        .cms-gjs-color-field__wheel .IroColorPicker {
          width: 100% !important;
        }

        .cms-gjs-color-field__wheel svg {
          display: block;
          max-width: 100%;
          height: auto;
        }

        @keyframes cms-style-sector-enter {
          from {
            opacity: 0;
            transform: translateY(14px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cms-style-sector-open {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.985);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes cms-style-property-enter {
          from {
            opacity: 0;
            transform: translateY(8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cms-grapes-shell .gjs-sm-sector,
          .cms-grapes-shell .gjs-sm-sector::before,
          .cms-grapes-shell .gjs-sm-sector-title,
          .cms-grapes-shell .gjs-sm-sector-caret,
          .cms-grapes-shell .gjs-sm-properties,
          .cms-grapes-shell .gjs-sm-property,
          .cms-grapes-shell .gjs-field,
          .cms-grapes-shell .gjs-input-holder input,
          .cms-grapes-shell .gjs-input-holder select,
          .cms-grapes-shell .gjs-input-holder textarea {
            animation: none !important;
            transition: none !important;
          }
        }

        .cms-grapes-shell .gjs-mdl-container.cms-code-modal-overlay,
        .gjs-mdl-container.cms-code-modal-overlay {
          position: fixed !important;
          inset: 0 !important;
          z-index: 100000 !important;
          display: flex !important;
          align-items: flex-start !important;
          justify-content: center !important;
          overflow-x: hidden !important;
          overflow-y: auto !important;
          padding: max(20px, env(safe-area-inset-top, 0px)) 16px 24px !important;
          background: rgba(2, 6, 23, 0.78) !important;
          backdrop-filter: blur(6px);
        }

        .cms-grapes-shell .gjs-mdl-container.cms-code-modal-overlay .gjs-mdl-dialog,
        .gjs-mdl-container.cms-code-modal-overlay .gjs-mdl-dialog {
          position: relative !important;
          top: auto !important;
          left: auto !important;
          right: auto !important;
          bottom: auto !important;
          transform: none !important;
          margin: 0 auto !important;
          width: min(96vw, 1400px);
          min-width: 320px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 34px 90px rgba(15, 23, 42, 0.32);
          display: flex;
          flex-direction: column;
          max-height: calc(100vh - 40px);
        }

        .cms-grapes-shell .gjs-mdl-container.cms-code-modal-overlay .gjs-mdl-header,
        .gjs-mdl-container.cms-code-modal-overlay .gjs-mdl-header {
          flex-shrink: 0;
          padding: 14px 18px;
          background: #08101f;
          color: #ffffff;
          border-bottom: 1px solid rgba(148, 163, 184, 0.16);
        }

        .cms-grapes-shell .gjs-mdl-container.cms-code-modal-overlay .gjs-mdl-content,
        .gjs-mdl-container.cms-code-modal-overlay .gjs-mdl-content {
          background: #0b1220;
          color: #ffffff;
          padding: 0;
          flex: 1 1 auto;
          min-height: 0;
          overflow: auto;
        }

        .cms-grapes-shell.cms-code-modal-open,
        body.cms-code-modal-open .cms-grapes-shell {
          overflow: visible;
        }

        body.cms-code-modal-open {
          overflow: hidden;
        }

        .cms-grapes-shell .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal-dialog--expanded,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal-dialog--expanded {
          max-height: calc(100vh - 24px) !important;
        }

        .cms-grapes-shell .cms-code-modal,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal {
          display: flex;
          flex-direction: column;
          gap: 16px;
          min-height: 480px;
          padding: 18px;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.12), transparent 34%),
            linear-gradient(180deg, #0f172a 0%, #0b1220 100%);
        }

        .cms-grapes-shell .cms-code-modal__toolbar,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__toolbar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cms-grapes-shell .cms-code-modal__intro,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__intro {
          max-width: 560px;
        }

        .cms-grapes-shell .cms-code-modal__eyebrow,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__eyebrow {
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #93c5fd;
          margin-bottom: 6px;
        }

        .cms-grapes-shell .cms-code-modal__hint,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__hint {
          margin: 0;
          font-size: 13px;
          line-height: 1.6;
          color: #94a3b8;
        }

        .cms-grapes-shell .cms-code-modal__toolbar-actions,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__toolbar-actions,
        .cms-grapes-shell .cms-code-modal__footer-actions,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__footer-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cms-grapes-shell .cms-code-modal__tabs,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__tabs {
          display: none;
          gap: 8px;
          flex-wrap: wrap;
        }

        .cms-grapes-shell .cms-code-modal__tab,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          border-radius: 999px;
          background: rgba(15, 23, 42, 0.72);
          color: #cbd5e1;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .cms-grapes-shell .cms-code-modal__tab.is-active,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__tab.is-active {
          background: #2563eb;
          border-color: #2563eb;
          color: #fff;
          box-shadow: 0 10px 24px rgba(37, 99, 235, 0.28);
        }

        .cms-grapes-shell .cms-code-modal__panels,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
          min-height: 0;
          flex: 1 1 auto;
        }

        .cms-grapes-shell .cms-code-modal__panel,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          border: 1px solid rgba(148, 163, 184, 0.16);
          border-radius: 18px;
          overflow: hidden;
          background: rgba(15, 23, 42, 0.88);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .cms-grapes-shell .cms-code-modal__panels--stacked,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--stacked {
          grid-template-columns: 1fr;
        }

        .cms-grapes-shell .cms-code-modal__panels--stacked .cms-code-modal__panel,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--stacked .cms-code-modal__panel {
          display: none;
        }

        .cms-grapes-shell .cms-code-modal__panels--stacked .cms-code-modal__panel.is-active,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--stacked .cms-code-modal__panel.is-active {
          display: flex;
        }

        .cms-grapes-shell .cms-code-modal__panels--wide,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--wide,
        .cms-grapes-shell .cms-code-modal.is-wide .cms-code-modal__panels,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal.is-wide .cms-code-modal__panels {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .cms-grapes-shell .cms-code-modal.is-wide .cms-code-modal__panel,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal.is-wide .cms-code-modal__panel,
        .cms-grapes-shell .cms-code-modal__panels--wide .cms-code-modal__panel,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--wide .cms-code-modal__panel {
          display: flex;
          flex-direction: column;
        }

        .cms-grapes-shell .cms-code-modal__panel-head,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 14px;
          border-bottom: 1px solid rgba(148, 163, 184, 0.12);
          background: rgba(8, 16, 31, 0.92);
        }

        .cms-grapes-shell .cms-code-modal__panel-title,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel-title {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .cms-grapes-shell .cms-code-modal__panel-title i,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel-title i {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          color: #e2e8f0;
          flex-shrink: 0;
        }

        .cms-grapes-shell .cms-code-modal__panel--html .cms-code-modal__panel-title i,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel--html .cms-code-modal__panel-title i {
          color: #fb7185;
        }

        .cms-grapes-shell .cms-code-modal__panel--css .cms-code-modal__panel-title i,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel--css .cms-code-modal__panel-title i {
          color: #60a5fa;
        }

        .cms-grapes-shell .cms-code-modal__panel--js .cms-code-modal__panel-title i,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel--js .cms-code-modal__panel-title i {
          color: #fbbf24;
        }

        .cms-grapes-shell .cms-code-modal__panel-title strong,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel-title strong {
          display: block;
          font-size: 14px;
          color: #f8fafc;
        }

        .cms-grapes-shell .cms-code-modal__panel-title span,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel-title span {
          display: block;
          font-size: 12px;
          color: #94a3b8;
        }

        .cms-grapes-shell .cms-code-modal__panel-body,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel-body {
          min-height: 0;
          padding: 10px;
          flex: 1 1 auto;
          overflow: hidden;
        }

        .cms-grapes-shell .cms-code-modal__codemirror,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__codemirror,
        .cms-grapes-shell .cms-code-modal__panel-body .CodeMirror,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panel-body .CodeMirror {
          height: 100% !important;
          min-height: 220px;
          max-height: 100%;
          border-radius: 12px !important;
          overflow: hidden;
          border: 1px solid rgba(148, 163, 184, 0.14);
        }

        .cms-grapes-shell .cms-code-modal__footer,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 4px;
          border-top: 1px solid rgba(148, 163, 184, 0.12);
        }

        .cms-grapes-shell .cms-code-modal__footer-meta,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__footer-meta {
          font-size: 12px;
          color: #64748b;
        }

        .cms-grapes-shell .cms-code-modal__btn,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          min-height: 40px;
          padding: 0 14px;
          border-radius: 12px;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(15, 23, 42, 0.88);
          color: #e2e8f0;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
        }

        .cms-grapes-shell .cms-code-modal__btn:hover,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__btn:hover {
          border-color: rgba(148, 163, 184, 0.34);
          background: rgba(30, 41, 59, 0.96);
        }

        .cms-grapes-shell .cms-code-modal__btn--primary,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__btn--primary {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          border-color: #2563eb;
          color: #fff;
          box-shadow: 0 12px 28px rgba(37, 99, 235, 0.28);
        }

        .cms-grapes-shell .cms-code-modal__btn--primary:hover,
        .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__btn--primary:hover {
          background: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
        }

        .cms-grapes-shell .CodeMirror,
        .gjs-mdl-container.cms-code-modal-overlay .CodeMirror {
          background: #0b1220;
          color: #e2e8f0;
        }

        .cms-grapes-shell .CodeMirror-gutters,
        .gjs-mdl-container.cms-code-modal-overlay .CodeMirror-gutters {
          background: #08101f;
          border-right: 1px solid rgba(148, 163, 184, 0.14);
        }

        .cms-grapes-shell .cms-side-panel-hidden .gjs-cv-canvas {
          right: 0 !important;
          border-right: 0 !important;
        }

        .cms-grapes-shell .cms-side-panel-hidden .gjs-pn-panel.gjs-pn-options {
          display: none !important;
        }

        .cms-grapes-shell .cms-side-panel-hidden .gjs-pn-views-container,
        .cms-grapes-shell .cms-side-panel-hidden .gjs-pn-panel.gjs-pn-views {
          display: none !important;
          width: 0 !important;
          min-width: 0 !important;
          max-width: 0 !important;
          visibility: hidden !important;
          opacity: 0 !important;
          overflow: hidden !important;
          pointer-events: none !important;
          border: 0 !important;
          box-shadow: none !important;
        }

        @media (max-width: 1100px) {
          .cms-grapes-shell .cms-code-modal__tabs,
          .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__tabs {
            display: flex;
          }

          .cms-grapes-shell .cms-code-modal.is-wide .cms-code-modal__panels,
          .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal.is-wide .cms-code-modal__panels,
          .cms-grapes-shell .cms-code-modal__panels--wide,
          .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--wide {
            grid-template-columns: 1fr;
          }

          .cms-grapes-shell .cms-code-modal.is-wide .cms-code-modal__panel,
          .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal.is-wide .cms-code-modal__panel,
          .cms-grapes-shell .cms-code-modal__panels--wide .cms-code-modal__panel,
          .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--wide .cms-code-modal__panel {
            display: none;
          }

          .cms-grapes-shell .cms-code-modal.is-wide .cms-code-modal__panel.is-active,
          .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal.is-wide .cms-code-modal__panel.is-active,
          .cms-grapes-shell .cms-code-modal__panels--wide .cms-code-modal__panel.is-active,
          .gjs-mdl-container.cms-code-modal-overlay .cms-code-modal__panels--wide .cms-code-modal__panel.is-active {
            display: flex;
          }

          .cms-grapes-shell__workspace {
            display: flex;
            flex-direction: column;
            height: auto;
          }

          .cms-grapes-sidebar.is-hidden {
            display: none;
          }

          .cms-grapes-shell__edge-toggle {
            top: 50%;
          }

          .cms-grapes-sidebar {
            height: auto;
            min-height: 320px;
          }

          .cms-grapes-sidebar--left,
          .cms-grapes-sidebar--right {
            border-left: 0;
            border-right: 0;
          }

          .cms-grapes-sidebar--left {
            border-bottom: 1px solid rgba(148, 163, 184, 0.16);
          }

          .cms-grapes-sidebar--right {
            border-top: 1px solid rgba(148, 163, 184, 0.16);
          }

        }

        @media (max-width: 768px) {
          .cms-grapes-shell .gjs-block-category .gjs-blocks-c {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .cms-grapes-shell .gjs-cv-canvas {
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
}
