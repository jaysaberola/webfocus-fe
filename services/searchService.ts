import { axiosInstance } from "./axios";

export interface SearchResultItem {
  id?: number | string;
  title?: string;
  slug?: string;
  excerpt?: string;
  url?: string;
  type?: string;
  raw?: any;
  score?: number;
  excerptHtml?: string;
}

export interface SearchSiteResponse {
  pages: SearchResultItem[];
  articles: SearchResultItem[];
  general: any[];
  raw?: any;
}

/**
 * searchSite
 * Try a few common backend endpoints and aggregate results so the frontend
 * can offer a single-site search experience even when the API varies.
 */
export const searchSite = async (q: string): Promise<SearchSiteResponse> => {
  if (!q || q.trim() === "") {
    return { pages: [], articles: [], general: [], raw: {} };
  }

  const params = { search: q, per_page: 6 };

  // Run requests in parallel and tolerate endpoints that don't exist.
  const [resSearch, resPublicSearch, resPages, resPublicArticles] = await Promise.all([
    axiosInstance.get(`/search`, { params: { q } }).catch((e) => null),
    axiosInstance.get(`/public/search`, { params: { q } }).catch((e) => null),
    axiosInstance.get(`/pages`, { params }).catch((e) => null),
    axiosInstance.get(`/public-articles`, { params }).catch((e) => null),
  ]);

  const pages: SearchResultItem[] = [];
  const articles: SearchResultItem[] = [];
  const general: any[] = [];

  const lcq = q.toLowerCase();

  const stripHtml = (html: string | undefined) => {
    if (!html) return "";
    try {
      return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    } catch (e) {
      return String(html);
    }
  };

  const extractText = (obj: any, depth = 0): string => {
    if (obj == null) return "";
    if (typeof obj === 'string') return stripHtml(obj);
    if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
    if (depth > 5) return '';
    if (Array.isArray(obj)) return obj.map(i => extractText(i, depth + 1)).join(' ');
    if (typeof obj === 'object') {
      let parts: string[] = [];
      for (const k of Object.keys(obj)) {
        try {
          parts.push(extractText(obj[k], depth + 1));
        } catch (e) {}
        if (parts.join(' ').length > 5000) break;
      }
      return parts.join(' ');
    }
    return '';
  };

  const escapeHtml = (str: string) => {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const highlight = (text: string, q: string) => {
    if (!text || !q) return escapeHtml(text || "");
    const pattern = new RegExp(`(${q.replace(/[.*+?^${}()|[\\]\\]/g, "\\\$&")})`, "ig");
    return escapeHtml(text).replace(pattern, "<mark>$1</mark>");
  };

  const makeSnippet = (content: string, q: string, maxLen = 200) => {
    if (!content) return "";
    const lc = content.toLowerCase();
    const idx = lc.indexOf(q.toLowerCase());
    if (idx === -1) {
      const s = content.slice(0, maxLen);
      return highlight(s, q);
    }
    const start = Math.max(0, idx - Math.floor(maxLen / 4));
    const end = Math.min(content.length, idx + Math.floor((3 * maxLen) / 4));
    let snippet = content.slice(start, end).trim();
    if (start > 0) snippet = `...${snippet}`;
    if (end < content.length) snippet = `${snippet}...`;
    return highlight(snippet, q);
  };

  // Normalize /pages response (Laravel-style pagination or plain array)
  if (resPages && resPages.data) {
    const d = resPages.data;
    const rows = d.data || d.rows || d.items || d;
    if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          try {
            const content = extractText(r);
            const score = ((r.title || r.name || '').toLowerCase().includes(lcq) ? 20 : 0) + (content.toLowerCase().split(lcq).length - 1) * 2;
            pages.push({ id: r.id, title: r.name || r.title, slug: r.slug, excerpt: r.teaser || r.excerpt || undefined, excerptHtml: makeSnippet(content, q), url: r.slug ? `/public/${r.slug}` : undefined, type: 'page', raw: r, score });
          } catch (e) {
            pages.push({ id: r.id, title: r.name || r.title, slug: r.slug, excerpt: r.teaser || r.excerpt || undefined, url: r.slug ? `/public/${r.slug}` : undefined, type: 'page', raw: r });
          }
        });
    }
  }

  // Normalize /public-articles
  if (resPublicArticles && resPublicArticles.data) {
    const d = resPublicArticles.data;
    const rows = d.data || d.rows || d.items || d;
    if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          try {
            const content = extractText(r);
            const score = ((r.title || '').toLowerCase().includes(lcq) ? 15 : 0) + (content.toLowerCase().split(lcq).length - 1) * 2;
            articles.push({ id: r.id, title: r.title || r.name, slug: r.slug, excerpt: r.teaser || r.excerpt || undefined, excerptHtml: makeSnippet(content, q), url: r.slug ? `/public/news/${r.slug}` : undefined, type: 'article', raw: r, score });
          } catch (e) {
            articles.push({ id: r.id, title: r.title || r.name, slug: r.slug, excerpt: r.teaser || r.excerpt || undefined, url: r.slug ? `/public/news/${r.slug}` : undefined, type: 'article', raw: r });
          }
        });
    }
  }

  // Generic search endpoints may return an array of hits
  if (resSearch && resSearch.data) {
    const d = resSearch.data;
    if (Array.isArray(d)) {
      general.push(...d);
    } else if (d.hits || d.results || d.data) {
      const arr = d.hits || d.results || d.data;
      if (Array.isArray(arr)) general.push(...arr);
    } else {
      general.push(d);
    }
  }

  if (resPublicSearch && resPublicSearch.data) {
    const d = resPublicSearch.data;
    if (Array.isArray(d)) general.push(...d);
    else if (d.hits || d.results || d.data) {
      const arr = d.hits || d.results || d.data;
      if (Array.isArray(arr)) general.push(...arr);
    } else {
      general.push(d);
    }
  }

  // Fallback: if backend search didn't include content matches, try fetching
  // a bigger batch of pages/articles and search their contents client-side.
  try {
    const [allPagesRes, allArticlesRes] = await Promise.all([
      axiosInstance.get('/pages', { params: { per_page: 200 } }).catch(() => null),
      axiosInstance.get('/articles', { params: { per_page: 200 } }).catch(() => null),
    ]);

    if (allPagesRes && allPagesRes.data) {
      const d = allPagesRes.data;
      const rows = d.data || d.rows || d.items || d;
      if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          const content = extractText(r);
          if (content.toLowerCase().includes(lcq)) {
            // avoid duplicates: only add if not already present
            if (!pages.find(p => String(p.id) === String(r.id))) {
              const score = ((r.title || r.name || '').toLowerCase().includes(lcq) ? 30 : 0) + (content.toLowerCase().split(lcq).length - 1) * 4;
              pages.push({ id: r.id, title: r.name || r.title, slug: r.slug, excerpt: content.slice(0, 200), excerptHtml: makeSnippet(content, q), url: r.slug ? `/public/${r.slug}` : undefined, type: 'page', raw: r, score });
            }
          }
        });
      }
    }

    if (allArticlesRes && allArticlesRes.data) {
      const d = allArticlesRes.data;
      const rows = d.data || d.rows || d.items || d;
      if (Array.isArray(rows)) {
        rows.forEach((r: any) => {
          const content = extractText(r);
          if (content.toLowerCase().includes(lcq) || (r.title || '').toLowerCase().includes(lcq)) {
            if (!articles.find(a => String(a.id) === String(r.id))) {
              const score = ((r.title || '').toLowerCase().includes(lcq) ? 25 : 0) + (content.toLowerCase().split(lcq).length - 1) * 3;
              articles.push({ id: r.id, title: r.title || r.name, slug: r.slug, excerpt: content.slice(0, 200), excerptHtml: makeSnippet(content, q), url: r.slug ? `/public/news/${r.slug}` : undefined, type: 'article', raw: r, score });
            }
          }
        });
      }
    }
  } catch (e) {
    // ignore fallback errors
  }

  // Enrich pages by fetching individual page details (useful when list endpoints
  // return only summaries and TinyMCE content is stored in the detail payload).
  try {
    const pagesToCheck: any[] = [];
    // gather candidate page ids from earlier pages list or from resPages list
    if (resPages && resPages.data) {
      const d = resPages.data;
      const rows = d.data || d.rows || d.items || d;
      if (Array.isArray(rows)) pagesToCheck.push(...rows);
    }
    // also include any pages we found earlier (ensure uniqueness)
    pages.forEach(p => pagesToCheck.push(p.raw || p));

    // dedupe by id/slug
    const byId: Record<string, any> = {};
    pagesToCheck.forEach((r: any) => {
      const key = r.id ? `id:${r.id}` : (r.slug ? `slug:${r.slug}` : JSON.stringify(r));
      byId[key] = r;
    });

    const uniq = Object.values(byId).slice(0, 80); // limit
    const detailFetches = uniq.map((r: any) => {
      if (r.id) return axiosInstance.get(`/pages/${r.id}`).catch(() => null);
      if (r.slug) return axiosInstance.get(`/public/pages/${r.slug}`).catch(() => null);
      return Promise.resolve(null);
    });

    const details = await Promise.all(detailFetches);
    details.forEach((res: any) => {
      if (!res || !res.data) return;
      const detail = res.data.data || res.data;
      const content = extractText(detail);
      if (content.toLowerCase().includes(lcq) || (detail.title || detail.name || '').toLowerCase().includes(lcq)) {
        if (!pages.find(p => String(p.id) === String(detail.id))) {
          const score = ((detail.title || detail.name || '').toLowerCase().includes(lcq) ? 60 : 0) + (content.toLowerCase().split(lcq).length - 1) * 5;
          pages.push({ id: detail.id, title: detail.name || detail.title, slug: detail.slug, excerpt: content.slice(0, 200), excerptHtml: makeSnippet(content, q), url: detail.slug ? `/public/${detail.slug}` : undefined, type: 'page', raw: detail, score });
        }
      }
    });
  } catch (e) {
    // ignore
  }

  // Extra fallback: check public menu pages (frontend) and search their public content
  try {
    const menuRes = await axiosInstance.get('/public/menus/active').catch(() => null);
    if (menuRes && menuRes.data) {
      const menu = menuRes.data.data || menuRes.data || null;
      const items: any[] = (menu && menu.items) || [];

      function walk(list: any[]): any[] {
        return list.reduce((acc: any[], it: any) => {
          acc.push(it);
          if (it.children && Array.isArray(it.children)) acc.push(...walk(it.children));
          return acc;
        }, [] as any[]);
      }

      const pageItems = walk(items).filter(i => i.type === 'page' && i.target);

      const pageFetches: Array<Promise<any>> = [];
      pageItems.forEach(it => {
        const rawTarget = String(it.target || '').trim();
        // normalize a target that may be a URL path
        const slug = rawTarget.replace(/^\/+|\/+$/g, '');
        const candidates = slug ? [slug] : ["home", "index", ""];
        candidates.forEach(s => {
          // use public API endpoint for pages by slug; empty slug may or may not resolve
          const path = s === '' ? '/public/pages/' : `/public/pages/${s}`;
          pageFetches.push(axiosInstance.get(path).catch(() => null));
        });
      });
      const pageResults = await Promise.all(pageFetches);
      pageResults.forEach((r: any) => {
        if (!r || !r.data) return;
        const p = r.data.data || r.data;
        const content = extractText(p);
        if (content.toLowerCase().includes(lcq) || (p.title || p.name || '').toLowerCase().includes(lcq)) {
          if (!pages.find(x => String(x.slug) === String(p.slug))) {
            const score = ((p.title || p.name || '').toLowerCase().includes(lcq) ? 40 : 0) + (content.toLowerCase().split(lcq).length - 1) * 4;
            pages.push({ id: p.id, title: p.title || p.name, slug: p.slug, excerpt: content.slice(0, 200), excerptHtml: makeSnippet(content, q), url: p.slug ? `/public/${p.slug}` : undefined, type: 'page', raw: p, score });
          }
        }
      });
    }
  } catch (e) {
    // ignore
  }

  // final: sort pages and articles by score desc
  pages.sort((a, b) => (b.score || 0) - (a.score || 0));
  articles.sort((a, b) => (b.score || 0) - (a.score || 0));

  return { pages, articles, general, raw: { resSearch, resPublicSearch, resPages, resPublicArticles } };
};

export default { searchSite };
