import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("public/templates/canvas7");
const OUT_TS = path.resolve("components/UI/grapesCanvas7OnePages.ts");
const BASE =
  "https://projects.wsiph2.com/webdirectory/cerebro/webfocusph/template/Package-HTML/Canvas%207%20Files";

const SLIDER_FALLBACK_CSS = `
[data-cms-site-template] .swiper-wrapper { transform: none !important; }
[data-cms-site-template] .swiper-slide { display: none !important; }
[data-cms-site-template] .swiper-slide:first-child { display: block !important; width: 100% !important; }
[data-cms-site-template] #gotoTop { display: none !important; }
[data-cms-site-template] .min-vh-100,
[data-cms-site-template] .min-vh-md-100,
[data-cms-site-template] .vh-100 {
  min-height: 720px !important;
  height: auto !important;
}
[data-cms-site-template] .min-vh-60:not(.min-vh-md-100) {
  min-height: 420px !important;
}
[data-cms-site-template] .social-icons {
  height: 720px !important;
}
[data-cms-site-template] .t-rotate {
  display: inline !important;
}
`;

function isAbsolute(url) {
  return /^(https?:|data:|mailto:|tel:|javascript:|#|\/\/)/i.test(url.trim());
}

function absolutize(url) {
  const trimmed = url.trim();
  if (!trimmed || isAbsolute(trimmed)) return trimmed;
  return `${BASE}/${trimmed.replace(/^\.\//, "").replace(/^\/+/, "")}`;
}

function rewriteSrcset(value) {
  return value
    .split(",")
    .map((part) => {
      const match = part.trim().match(/^(\S+)(\s+.*)?$/);
      if (!match) return part;
      return `${absolutize(match[1])}${match[2] || ""}`;
    })
    .join(", ");
}

function neutralizeHamburgerButtons(html) {
  return html.replace(
    /<button([^>]*class=["'][^"']*cnvs-hamburger[^"']*["'][^>]*)>([\s\S]*?)<\/button>/gi,
    '<div$1 role="button">$2</div>'
  );
}

function flattenRotators(html) {
  return html.replace(/(<span class="t-rotate[^"]*"[^>]*>)([^<]+)(<\/span>)/gi, (_all, open, text, close) => {
    const words = text.split("|").map((word) => word.trim()).filter(Boolean);
    const preferred = words.find((word) => /designer/i.test(word)) || words[0] || text;
    return `${open}${preferred}${close}`;
  });
}

function rewriteHtml(html) {
  let next = neutralizeHamburgerButtons(flattenRotators(html)).replace(/\b(src|poster|data-src|data-bg|href)=["']([^"']+)["']/gi, (all, attr, url) => {
    if (attr.toLowerCase() === "href") {
      if (isAbsolute(url) || url.startsWith("#")) return all;
      if (/\.html?($|[?#])/i.test(url) || /^(index|op-|demo-)/i.test(url)) {
        return `${attr}="#"`;
      }
    }
    return `${attr}="${absolutize(url)}"`;
  });

  next = next.replace(/\bsrcset=["']([^"']+)["']/gi, (_all, value) => `srcset="${rewriteSrcset(value)}"`);

  next = next.replace(/url\((['"]?)([^'")]+)\1\)/gi, (all, quote, url) => {
    if (isAbsolute(url)) return all;
    const abs = absolutize(url);
    return `url(${quote}${abs}${quote})`;
  });

  return next;
}

function extract(html) {
  const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((match) => match[1].trim());
  const start = html.indexOf('<div id="wrapper">');
  const end = html.indexOf("</div><!-- #wrapper end -->");
  if (start < 0 || end < 0) {
    throw new Error("Could not find #wrapper");
  }
  const wrapper = html.slice(start, end + "</div><!-- #wrapper end -->".length);
  return { styles, wrapper };
}

function wrapTemplate(id, html, styles) {
  const styleBlock = [...styles, SLIDER_FALLBACK_CSS].filter(Boolean).join("\n");
  return `<main data-cms-site-template="1" data-cms-template="${id}" class="stretched canvas7-onepage" style="position:relative;width:100%;background:#fff;">
<style>${styleBlock}</style>
${html}
</main>`;
}

const files = [
  { source: "index-onepage.html", id: "onepage-default", exportName: "CANVAS7_ONEPAGE_DEFAULT" },
  { source: "op-designer.html", id: "onepage-designer", exportName: "CANVAS7_ONEPAGE_DESIGNER" },
  { source: "op-parallax.html", id: "onepage-parallax", exportName: "CANVAS7_ONEPAGE_PARALLAX" },
];

const exports = [];

for (const file of files) {
  const raw = fs.readFileSync(path.join(ROOT, file.source), "utf8");
  const { styles, wrapper } = extract(raw);
  const html = wrapTemplate(file.id, rewriteHtml(wrapper), styles.map(rewriteHtml));
  fs.writeFileSync(path.join(ROOT, `${file.id}.html`), html);
  exports.push(`export const ${file.exportName} = ${JSON.stringify(html)};`);
  console.log(`${file.id} ${html.length} chars`);
}

fs.writeFileSync(
  OUT_TS,
  `/* Auto-generated from Canvas 7 One-Page demos. Do not edit by hand. */\n${exports.join("\n\n")}\n`
);
console.log(`wrote ${OUT_TS}`);
