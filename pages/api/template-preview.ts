import type { NextApiRequest, NextApiResponse } from "next";

export const config = {
  api: {
    responseLimit: false,
  },
};

const ALLOWED_HOST = "projects.wsiph2.com";
const ALLOWED_PATH_PREFIX =
  "/webdirectory/cerebro/webfocusph/template/Package-HTML/Canvas 7 Files/";

const LOGO_FILE = "/images/webfocus-logo.svg";

function isAllowedTemplateUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== "https:" || url.hostname !== ALLOWED_HOST) return false;
    const path = decodeURIComponent(url.pathname);
    return path.startsWith(ALLOWED_PATH_PREFIX) && path.toLowerCase().endsWith(".html");
  } catch {
    return false;
  }
}

function logoUrlForRequest(req: NextApiRequest) {
  const host = req.headers.host || "127.0.0.1:3000";
  const forwarded = req.headers["x-forwarded-proto"];
  const proto = (Array.isArray(forwarded) ? forwarded[0] : forwarded) || "http";
  return `${proto}://${host}${LOGO_FILE}`;
}

function isCanvasLogoTag(tag: string) {
  if (/class\s*=\s*["'][^"']*\blogo-(?:default|dark)\b/i.test(tag)) return true;
  if (/alt\s*=\s*["'][^"']*canvas logo/i.test(tag)) return true;
  return /(?:^|[/\\])logo(?:[-@.][^"'\s]*)?\.(?:png|svg|jpe?g|webp)/i.test(tag);
}

function rewriteCanvasLogos(html: string, logoUrl: string) {
  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    if (!isCanvasLogoTag(tag)) return tag;
    let next = tag.replace(/\s(?:srcset|sizes)\s*=\s*(?:"[^"]*"|'[^']*')/gi, "");
    if (/\ssrc\s*=\s*"/i.test(next)) {
      next = next.replace(/\ssrc\s*=\s*"[^"]*"/i, ` src="${logoUrl}"`);
    } else if (/\ssrc\s*=\s*'/i.test(next)) {
      next = next.replace(/\ssrc\s*=\s*'[^']*'/i, ` src='${logoUrl}'`);
    } else {
      next = next.replace(/<img\b/i, `<img src="${logoUrl}"`);
    }
    if (/\salt\s*=/i.test(next)) {
      next = next.replace(/\salt\s*=\s*(?:"[^"]*"|'[^']*')/i, ' alt="WebFocus"');
    } else {
      next = next.replace(/<img\b/i, '<img alt="WebFocus"');
    }
    return next;
  });
}

function brandTemplateHtml(html: string, pageUrl: string, logoUrl: string) {
  const directory = pageUrl.replace(/[^/]+$/, "");
  let next = rewriteCanvasLogos(html, logoUrl);

  if (!/<base\s/i.test(next)) {
    next = next.replace(/<head[^>]*>/i, (head) => `${head}<base href="${directory}">`);
  }

  const style = `<style id="webfocus-logo-swap">#logo img,img.logo-default,img.logo-dark{height:34px!important;width:auto!important;max-width:148px!important;object-fit:contain!important;background:#fff!important;border-radius:6px!important;padding:4px 8px!important;box-sizing:content-box!important;}</style>`;
  if (/<\/body>/i.test(next)) {
    next = next.replace(/<\/body>/i, `${style}</body>`);
  } else {
    next += style;
  }
  return next;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const rawUrl = typeof req.query.url === "string" ? req.query.url : "";
  if (!rawUrl || !isAllowedTemplateUrl(rawUrl)) {
    return res.status(400).json({ message: "URL not allowed" });
  }

  try {
    const upstream = await fetch(rawUrl, { redirect: "follow" });
    if (!upstream.ok) {
      return res.status(upstream.status).json({ message: `Upstream error: ${upstream.status}` });
    }

    const finalUrl = upstream.url || rawUrl;
    if (!isAllowedTemplateUrl(finalUrl)) {
      return res.status(400).json({ message: "URL not allowed" });
    }

    const html = await upstream.text();
    const branded = brandTemplateHtml(html, finalUrl, logoUrlForRequest(req));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    return res.status(200).send(branded);
  } catch {
    return res.status(502).json({ message: "Preview unavailable" });
  }
}
