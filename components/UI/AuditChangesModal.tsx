import React from "react";

type AnyRecord = Record<string, any>;

type ChangeKind = "added" | "removed" | "updated" | "unchanged";

interface ChangeRow {
  key: string;
  kind: ChangeKind;
  oldValue: any;
  newValue: any;
}

type DetailKind = Exclude<ChangeKind, "unchanged">;

interface ChangeDetail {
  path: string;
  kind: DetailKind;
  oldValue: any;
  newValue: any;
}

interface HumanChange {
  kind: DetailKind;
  title: string;
  field: string;
  oldValue: any;
  newValue: any;
  meta?: {
    root: string;
    rootHuman: string;
    itemLabel?: string;
    itemId?: string;
    prop?: string;
    propHuman?: string;
  };
}

function isPlainObject(v: any): v is Record<string, any> {
  return v != null && typeof v === "object" && !Array.isArray(v);
}

function normalizeForCompare(v: any): any {
  if (Array.isArray(v)) return v.map(normalizeForCompare);
  if (isPlainObject(v)) {
    const out: Record<string, any> = {};
    for (const k of Object.keys(v).sort()) out[k] = normalizeForCompare(v[k]);
    return out;
  }
  return v;
}

function deepEqual(a: any, b: any) {
  if (a === b) return true;
  try {
    return JSON.stringify(normalizeForCompare(a)) === JSON.stringify(normalizeForCompare(b));
  } catch {
    return false;
  }
}

function resolveAssetUrl(path?: string | null): string | undefined {
  const s = (path ?? "").toString().trim();
  if (!s) return undefined;

  if (s.startsWith("data:")) return s;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;

  const normalize = (p: string) => p.replace(/\\/g, "/").replace(/^\.{1,2}\//, "");
  const cleaned = normalize(s);

  let base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  // Some envs might accidentally include /api in the base; strip it for asset URLs.
  base = base.replace(/\/api\/?$/, "");
  if (!base) return undefined;

  if (cleaned.startsWith("/storage/")) return `${base}${cleaned}`;
  if (cleaned.startsWith("storage/")) return `${base}/${cleaned}`;
  if (cleaned.startsWith("/uploads/")) return `${base}${cleaned}`;
  if (cleaned.startsWith("uploads/")) return `${base}/${cleaned}`;

  return `${base}/storage/${cleaned}`;
}

function buildAssetCandidates(value: string): string[] {
  const s = (value ?? "").toString().trim();
  if (!s) return [];
  if (s.startsWith("data:")) return [s];
  if (s.startsWith("http://") || s.startsWith("https://")) return [s];

  const normalize = (p: string) => p.replace(/\\/g, "/").replace(/^\.{1,2}\//, "");
  const cleaned = normalize(s);

  let base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
  base = base.replace(/\/api\/?$/, "");
  if (!base) return [];

  const candidates: string[] = [];

  const add = (url: string) => {
    if (!url) return;
    // encode only spaces to keep simple (avoid breaking already-encoded URLs)
    const safe = url.replace(/ /g, "%20");
    if (!candidates.includes(safe)) candidates.push(safe);
  };

  // Common Laravel/public patterns
  if (cleaned.startsWith("/")) add(`${base}${cleaned}`);
  add(`${base}/storage/${cleaned.replace(/^\//, "")}`);
  add(`${base}/${cleaned.replace(/^\//, "")}`);
  add(`${base}/uploads/${cleaned.replace(/^\//, "")}`);

  return candidates;
}

export function ImagePreview({ fieldKey, value }: { fieldKey: string; value: string }) {
  const candidates = React.useMemo(() => buildAssetCandidates(value), [value]);
  const [idx, setIdx] = React.useState(0);
  const [failed, setFailed] = React.useState(false);
  const src = candidates[idx];

  const W = 110;
  const H = 80;

  React.useEffect(() => {
    setIdx(0);
    setFailed(false);
  }, [value]);

  if (!src || failed) {
    return (
      <div className="d-flex align-items-center gap-2">
        <div
          className="border rounded bg-light d-flex align-items-center justify-content-center"
          style={{ width: W, height: H, overflow: "hidden" }}
          aria-label="Image not available"
          title="Image not available"
        >
          <i className={`fas ${/avatar|user|photo/i.test(fieldKey) ? "fa-user" : "fa-image"} text-muted`} />
        </div>
        <span className="small text-muted">Not available</span>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-2">
      <div className="border rounded bg-light" style={{ width: W, height: H, overflow: "hidden" }}>
        <img
          src={src}
          alt={fieldKey}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          onLoad={() => setFailed(false)}
          onError={() => {
            if (idx < candidates.length - 1) {
              setIdx((v) => v + 1);
              return;
            }
            setFailed(true);
          }}
        />
      </div>
      <a href={src} target="_blank" rel="noreferrer" className="small text-decoration-none">
        Open
      </a>
    </div>
  );
}

export function looksLikeImageValue(fieldKey: string, value: any) {
  if (typeof value !== "string") return false;
  const s = value.trim().toLowerCase();
  if (!s) return false;

  const key = (fieldKey || "").toLowerCase();
  const keyLooks = /(logo|image|img|avatar|photo|favicon|icon)/.test(key);
  const extLooks = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/.test(s);
  const pathLooks = /(storage\/|uploads\/|logos\/|avatars\/|images\/)/.test(s);

  return extLooks || (keyLooks && (pathLooks || s.includes("/")));
}

export function looksLikeHtmlValue(fieldKey: string, value: any) {
  if (typeof value !== "string") return false;
  const s = value.trim();
  if (!s) return false;

  // Heuristic: key suggests rich HTML content, and the value contains tags.
  const key = (fieldKey || "").toLowerCase();
  const keyLooks = /(content|html|body|template|layout|footer|header|section)/.test(key);
  const tagLooks = /<\/?[a-z][\w-]*(\s[^>]*?)?>/i.test(s);

  return keyLooks && tagLooks;
}

function stripDangerousHtml(html: string) {
  // Best-effort client-side hardening. We still sandbox the iframe with no scripts.
  let s = html || "";
  // Remove script blocks.
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
  // Remove inline event handlers (onClick, onload, ...).
  s = s.replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Neutralize javascript: URLs.
  s = s.replace(/\b(href|src)\s*=\s*("|')\s*javascript:[^"']*(\2)/gi, "$1=$2#$3");
  return s;
}

function extractBodyHtml(html: string) {
  const s = html || "";
  const bodyMatch = s.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1] != null) return bodyMatch[1];
  return s
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<html\b[^>]*>/gi, "")
    .replace(/<\/html>/gi, "")
    .replace(/<head\b[^>]*>[\s\S]*?<\/head>/gi, "")
    .replace(/<body\b[^>]*>/gi, "")
    .replace(/<\/body>/gi, "");
}

export function HtmlPreview({
  html,
  zoomable = true,
  height = 320,
}: {
  html: string;
  zoomable?: boolean;
  height?: number;
}) {
  const [zoomOpen, setZoomOpen] = React.useState(false);
  const srcDoc = React.useMemo(() => {
    const fragment = stripDangerousHtml(extractBodyHtml(html));
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <base href="/" />
    <link rel="stylesheet" href="/css/bootstrap.min.css" />
    <link rel="stylesheet" href="/css/public-css.css" />
    <link rel="stylesheet" href="/css/custom.css" />
    <link rel="stylesheet" href="/css/product.css" />
    <link rel="stylesheet" href="/css/banner.css" />
    <link rel="stylesheet" href="/css/navigation.css" />
    <link rel="stylesheet" href="/css/public-overrides.css" />
    <style>
      html, body { margin: 0; padding: 0; }
      img, video { max-width: 100%; height: auto; }
    </style>
  </head>
  <body>
    ${fragment}
  </body>
</html>`;
  }, [html]);

  React.useEffect(() => {
    if (!zoomOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [zoomOpen]);

  return (
    <>
      {zoomable && zoomOpen ? (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ background: "rgba(0, 0, 0, 0.7)", zIndex: 1070 }}
          role="dialog"
          aria-modal="true"
          aria-label="Preview"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setZoomOpen(false);
          }}
        >
          <div
            className="position-relative bg-white shadow-lg"
            style={{ width: "min(1100px, 94vw)", borderRadius: 8, overflow: "hidden" }}
          >
            <button
              type="button"
              className="btn btn-sm btn-light position-absolute"
              style={{ top: 10, right: 10, zIndex: 1 }}
              onClick={() => setZoomOpen(false)}
              aria-label="Close preview"
              title="Close"
            >
              <i className="fas fa-times" />
            </button>

            <div style={{ width: "100%", aspectRatio: "16 / 9", maxHeight: "75vh" }}>
              <iframe
                title="HTML preview (zoomed)"
                sandbox="allow-same-origin"
                srcDoc={srcDoc}
                style={{ width: "100%", height: "100%", border: 0, display: "block" }}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="border rounded overflow-hidden bg-white">
        {zoomable && (
          <div className="d-flex justify-content-end p-1 bg-light border-bottom">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setZoomOpen(true)}
              aria-label="Zoom preview"
              title="Zoom"
            >
              <i className="fas fa-search-plus" />
            </button>
          </div>
        )}
        <iframe
          title="HTML preview"
          sandbox="allow-same-origin"
          srcDoc={srcDoc}
          style={{ width: "100%", height, border: 0, display: "block" }}
        />
      </div>
    </>
  );
}

function stringDiffParts(oldText: string, newText: string) {
  const a = oldText ?? "";
  const b = newText ?? "";

  let prefix = 0;
  const maxPrefix = Math.min(a.length, b.length);
  while (prefix < maxPrefix && a[prefix] === b[prefix]) prefix++;

  let suffix = 0;
  const maxSuffix = Math.min(a.length - prefix, b.length - prefix);
  while (
    suffix < maxSuffix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  )
    suffix++;

  const aMid = a.slice(prefix, a.length - suffix);
  const bMid = b.slice(prefix, b.length - suffix);
  const commonPrefix = a.slice(0, prefix);
  const commonSuffix = a.slice(a.length - suffix);

  return { commonPrefix, commonSuffix, oldMid: aMid, newMid: bMid };
}

function pretty(value: any) {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function humanizeKey(key: string) {
  const s = (key ?? "").toString().trim();
  if (!s) return "Field";
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function summarize(value: any, max = 80): string {
  const v = tryParseJsonString(value);
  if (v === undefined) return "—";
  if (v === null) return "null";
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (typeof v === "string") {
    const s = v.trim();
    if (s.length <= max) return s;
    return `${s.slice(0, max - 1)}…`;
  }
  if (Array.isArray(v)) return `List (${v.length})`;
  if (isPlainObject(v)) {
    const keys = Object.keys(v);
    return `Object (${keys.length} field${keys.length === 1 ? "" : "s"})`;
  }
  return String(v);
}

function parsePath(path: string): {
  root: string;
  rootHuman: string;
  itemLabel?: string;
  itemId?: string;
  prop?: string;
  propHuman?: string;
  humanTitle: string;
  humanField: string;
} {
  const raw = path || "";
  const firstDot = raw.indexOf(".");
  const rootPlus = firstDot >= 0 ? raw.slice(0, firstDot) : raw;
  const rest = firstDot >= 0 ? raw.slice(firstDot + 1) : "";

  // rootPlus may contain [id=...,label=...]
  const bracketStart = rootPlus.indexOf("[");
  const root = bracketStart >= 0 ? rootPlus.slice(0, bracketStart) : rootPlus;
  const bracket = bracketStart >= 0 ? rootPlus.slice(bracketStart) : "";

  let itemLabel: string | undefined;
  let itemId: string | undefined;
  if (bracket) {
    const mLabel = bracket.match(/label=([^\]]+?)(?:,|\])/);
    const mId = bracket.match(/id=([^\],]+)(?:,|\])/);
    if (mLabel?.[1]) itemLabel = mLabel[1];
    if (mId?.[1]) itemId = mId[1];
  }

  const prop = rest || undefined;
  const rootHuman = humanizeKey(root);

  const itemPart = itemLabel ? itemLabel : itemId ? `ID ${itemId}` : undefined;
  const propHuman = prop ? humanizeKey(prop) : undefined;

  const humanTitle =
    itemPart && propHuman
      ? `${rootHuman}: ${itemPart} — ${propHuman}`
      : itemPart
        ? `${rootHuman}: ${itemPart}`
        : propHuman
          ? `${rootHuman} — ${propHuman}`
          : rootHuman;

  const humanField = rootHuman;
  return { root, rootHuman, itemLabel, itemId, prop, propHuman, humanTitle, humanField };
}

function summarizeObjectForUser(value: any): string {
  const v = tryParseJsonString(value);
  if (!v || typeof v !== "object") return summarize(v, 120);
  if (Array.isArray(v)) return `List (${v.length})`;

  const label = displayLabelForItem(v);
  const type = (v as any)?.type;
  const target = (v as any)?.target;

  const bits: string[] = [];
  if (label) bits.push(label);
  if (type) bits.push(String(type));
  if (target) bits.push(String(target));
  if (bits.length) return bits.join(" • ");

  const keys = Object.keys(v);
  return `Object (${keys.length} field${keys.length === 1 ? "" : "s"})`;
}

function getObjectSummaryPairs(value: any): Array<{ k: string; v: any }> {
  const v = tryParseJsonString(value);
  if (!v || typeof v !== "object" || Array.isArray(v)) return [];

  const pairs: Array<{ k: string; v: any }> = [];
  const pushIf = (k: string, vv: any) => {
    if (vv === undefined || vv === null || vv === "") return;
    pairs.push({ k, v: vv });
  };

  pushIf("Label", (v as any).label ?? (v as any).name ?? (v as any).title);
  pushIf("Type", (v as any).type);
  pushIf("Target", (v as any).target ?? (v as any).url ?? (v as any).href);
  pushIf("ID", (v as any).id ?? (v as any).uuid ?? (v as any).key ?? (v as any).slug);
  pushIf("Status", (v as any).status);

  return pairs.slice(0, 6);
}

function getArrayPreview(value: any): { count: number; labels: string[] } | null {
  const v = tryParseJsonString(value);
  if (!Array.isArray(v)) return null;

  const labels: string[] = [];
  for (const item of v) {
    const label = displayLabelForItem(item);
    if (label) labels.push(label);
    if (labels.length >= 5) break;
  }

  return { count: v.length, labels };
}

function changeTitle(kind: DetailKind) {
  if (kind === "added") return "Added";
  if (kind === "removed") return "Removed";
  return "Updated";
}

function tryParseJsonString(value: any): any {
  if (typeof value !== "string") return value;
  const s = value.trim();
  if (!s) return value;
  if (!(s.startsWith("{") || s.startsWith("["))) return value;

  try {
    return JSON.parse(s);
  } catch {
    return value;
  }
}

function isPrimitive(v: any) {
  return v == null || typeof v === "string" || typeof v === "number" || typeof v === "boolean";
}

function displayIdForItem(item: any): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const id = item.id ?? item.key ?? item.uuid ?? item.slug;
  if (id == null) return undefined;
  return String(id);
}

function displayLabelForItem(item: any): string | undefined {
  if (!item || typeof item !== "object") return undefined;
  const label = item.label ?? item.name ?? item.title;
  if (label == null) return undefined;
  return String(label);
}

function diffNested(oldValue: any, newValue: any, basePath: string, out: ChangeDetail[], limits: { max: number; depth: number }) {
  if (out.length >= limits.max) return;
  if (limits.depth <= 0) {
    if (!deepEqual(oldValue, newValue)) {
      out.push({ path: basePath, kind: "updated", oldValue, newValue });
    }
    return;
  }

  if (deepEqual(oldValue, newValue)) return;

  const oldP = tryParseJsonString(oldValue);
  const newP = tryParseJsonString(newValue);

  // If either side is primitive (or type mismatch), treat as leaf update.
  const oldIsArray = Array.isArray(oldP);
  const newIsArray = Array.isArray(newP);
  const oldIsObj = isPlainObject(oldP);
  const newIsObj = isPlainObject(newP);

  if ((isPrimitive(oldP) && isPrimitive(newP)) || (oldIsArray !== newIsArray) || (oldIsObj !== newIsObj)) {
    out.push({ path: basePath, kind: "updated", oldValue: oldP, newValue: newP });
    return;
  }

  if (oldIsObj && newIsObj) {
    const keys = new Set<string>([...Object.keys(oldP), ...Object.keys(newP)]);
    for (const key of Array.from(keys).sort()) {
      if (out.length >= limits.max) return;

      const hasOld = Object.prototype.hasOwnProperty.call(oldP, key);
      const hasNew = Object.prototype.hasOwnProperty.call(newP, key);
      const nextPath = basePath ? `${basePath}.${key}` : key;

      if (!hasOld && hasNew) {
        out.push({ path: nextPath, kind: "added", oldValue: undefined, newValue: newP[key] });
        continue;
      }
      if (hasOld && !hasNew) {
        out.push({ path: nextPath, kind: "removed", oldValue: oldP[key], newValue: undefined });
        continue;
      }

      diffNested(oldP[key], newP[key], nextPath, out, { ...limits, depth: limits.depth - 1 });
    }
    return;
  }

  if (oldIsArray && newIsArray) {
    const oldArr: any[] = oldP;
    const newArr: any[] = newP;

    const oldAllHaveId = oldArr.every((x) => displayIdForItem(x) != null);
    const newAllHaveId = newArr.every((x) => displayIdForItem(x) != null);

    // Match array items by id/key when possible (menu items, etc.)
    if (oldAllHaveId && newAllHaveId) {
      const oldMap = new Map<string, any>(oldArr.map((x) => [displayIdForItem(x)!, x]));
      const newMap = new Map<string, any>(newArr.map((x) => [displayIdForItem(x)!, x]));
      const ids = new Set<string>([...oldMap.keys(), ...newMap.keys()]);

      for (const id of Array.from(ids).sort()) {
        if (out.length >= limits.max) return;
        const o = oldMap.get(id);
        const n = newMap.get(id);
        const label = displayLabelForItem(n ?? o);
        const tag = label ? `id=${id},label=${label}` : `id=${id}`;
        const nextPath = `${basePath}[${tag}]`;

        if (o == null && n != null) {
          out.push({ path: nextPath, kind: "added", oldValue: undefined, newValue: n });
          continue;
        }
        if (o != null && n == null) {
          out.push({ path: nextPath, kind: "removed", oldValue: o, newValue: undefined });
          continue;
        }

        diffNested(o, n, nextPath, out, { ...limits, depth: limits.depth - 1 });
      }
      return;
    }

    // Fallback: index-based diff (still useful for small arrays)
    const maxLen = Math.max(oldArr.length, newArr.length);
    for (let i = 0; i < maxLen; i++) {
      if (out.length >= limits.max) return;
      const o = oldArr[i];
      const n = newArr[i];
      const nextPath = `${basePath}[${i}]`;

      if (i >= oldArr.length) {
        out.push({ path: nextPath, kind: "added", oldValue: undefined, newValue: n });
        continue;
      }
      if (i >= newArr.length) {
        out.push({ path: nextPath, kind: "removed", oldValue: o, newValue: undefined });
        continue;
      }

      diffNested(o, n, nextPath, out, { ...limits, depth: limits.depth - 1 });
    }
    return;
  }

  // Anything else
  out.push({ path: basePath, kind: "updated", oldValue: oldP, newValue: newP });
}

function computeDiff(oldValues?: AnyRecord, newValues?: AnyRecord): ChangeRow[] {
  const oldV = oldValues ?? {};
  const newV = newValues ?? {};

  const keys = new Set<string>([...Object.keys(oldV), ...Object.keys(newV)]);
  const rows: ChangeRow[] = [];

  for (const key of Array.from(keys).sort()) {
    const hasOld = Object.prototype.hasOwnProperty.call(oldV, key);
    const hasNew = Object.prototype.hasOwnProperty.call(newV, key);

    if (!hasOld && hasNew) {
      rows.push({ key, kind: "added", oldValue: undefined, newValue: newV[key] });
      continue;
    }
    if (hasOld && !hasNew) {
      rows.push({ key, kind: "removed", oldValue: oldV[key], newValue: undefined });
      continue;
    }

    const oldValue = oldV[key];
    const newValue = newV[key];
    if (!deepEqual(oldValue, newValue)) rows.push({ key, kind: "updated", oldValue, newValue });
    else rows.push({ key, kind: "unchanged", oldValue, newValue });
  }

  return rows;
}

export interface AuditChangesModalProps {
  show: boolean;
  title?: string;
  subtitle?: React.ReactNode;
  oldValues?: AnyRecord;
  newValues?: AnyRecord;
  onClose: () => void;
}

export default function AuditChangesModal({
  show,
  title = "Changes",
  subtitle,
  oldValues,
  newValues,
  onClose,
}: AuditChangesModalProps) {
  React.useEffect(() => {
    if (!show) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [show, onClose]);

  const diff = React.useMemo(() => computeDiff(oldValues, newValues), [oldValues, newValues]);

  const changed = diff.filter((r) => r.kind !== "unchanged");
  const added = changed.filter((r) => r.kind === "added");
  const removed = changed.filter((r) => r.kind === "removed");
  const updated = changed.filter((r) => r.kind === "updated");

  const [showUnchanged, setShowUnchanged] = React.useState(false);
  React.useEffect(() => {
    if (!show) setShowUnchanged(false);
  }, [show]);

  const rowsToRender = showUnchanged ? diff : changed;

  const humanChanges: HumanChange[] = React.useMemo(() => {
    const out: HumanChange[] = [];

    for (const row of rowsToRender) {
      // For added/removed, show top-level field change.
      if (row.kind === "added" || row.kind === "removed") {
        out.push({
          kind: row.kind,
          title: humanizeKey(row.key),
          field: humanizeKey(row.key),
          oldValue: tryParseJsonString(row.oldValue),
          newValue: tryParseJsonString(row.newValue),
          meta: {
            root: row.key,
            rootHuman: humanizeKey(row.key),
          },
        });
        continue;
      }

      // Updated: try to compute nested diffs for objects/arrays/JSON strings.
      const oldParsed = tryParseJsonString(row.oldValue);
      const newParsed = tryParseJsonString(row.newValue);
      const looksStructured =
        (Array.isArray(oldParsed) || isPlainObject(oldParsed)) &&
        (Array.isArray(newParsed) || isPlainObject(newParsed));

      if (looksStructured) {
        const details: ChangeDetail[] = [];
        diffNested(oldParsed, newParsed, row.key, details, { max: 200, depth: 7 });
        for (const d of details) {
          const info = parsePath(d.path);
          out.push({
            kind: d.kind,
            title: info.humanTitle,
            field: info.humanField,
            oldValue: tryParseJsonString(d.oldValue),
            newValue: tryParseJsonString(d.newValue),
            meta: {
              root: info.root,
              rootHuman: info.rootHuman,
              itemLabel: info.itemLabel,
              itemId: info.itemId,
              prop: info.prop,
              propHuman: info.propHuman,
            },
          });
        }

        // If diffNested can't meaningfully break it down, fall back.
        if (details.length === 0) {
          out.push({
            kind: "updated",
            title: humanizeKey(row.key),
            field: humanizeKey(row.key),
            oldValue: oldParsed,
            newValue: newParsed,
            meta: {
              root: row.key,
              rootHuman: humanizeKey(row.key),
            },
          });
        }
      } else {
        out.push({
          kind: "updated",
          title: humanizeKey(row.key),
          field: humanizeKey(row.key),
          oldValue: tryParseJsonString(row.oldValue),
          newValue: tryParseJsonString(row.newValue),
          meta: {
            root: row.key,
            rootHuman: humanizeKey(row.key),
          },
        });
      }
    }

    return out;
  }, [rowsToRender, showUnchanged]);

  const addedHuman = humanChanges.filter((c) => c.kind === "added");
  const removedHuman = humanChanges.filter((c) => c.kind === "removed");
  const updatedHuman = humanChanges.filter((c) => c.kind === "updated");

  const copyJson = async () => {
    const payload = {
      added: Object.fromEntries(added.map((r) => [r.key, r.newValue])),
      removed: Object.fromEntries(removed.map((r) => [r.key, r.oldValue])),
      updated: Object.fromEntries(updated.map((r) => [r.key, { old: r.oldValue, new: r.newValue }])),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch {
      // ignore if clipboard isn't available
    }
  };

  const renderSimpleValue = (fieldKey: string, value: any) => {
    const v = tryParseJsonString(value);
    const asText = summarize(v, 80);

    if (looksLikeImageValue(fieldKey, v) && typeof v === "string") {
      const url = resolveAssetUrl(v);
      if (url) {
        return (
          <div className="d-flex align-items-center gap-2">
            <div className="border rounded bg-light" style={{ width: 80, height: 60, overflow: "hidden" }}>
              <img src={url} alt={fieldKey} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
            </div>
            <a href={url} target="_blank" rel="noreferrer" className="small text-decoration-none">
              Open
            </a>
          </div>
        );
      }
    }

    if (typeof v === "string" && (v.startsWith("http://") || v.startsWith("https://"))) {
      return (
        <a href={v} target="_blank" rel="noreferrer" className="small text-decoration-none">
          {asText}
        </a>
      );
    }

    return <span className="small">{asText}</span>;
  };

  const renderValueDetailed = (fieldKey: string, value: any) => {
    const v = tryParseJsonString(value);

    if (looksLikeImageValue(fieldKey, v) && typeof v === "string") {
      return <ImagePreview fieldKey={fieldKey} value={v} />;
    }

    if (typeof v === "string") {
      const s = v.trim();
      const isUrl = s.startsWith("http://") || s.startsWith("https://");

      if (looksLikeHtmlValue(fieldKey, s)) {
        return <HtmlPreview html={s} />;
      }

      if (isUrl) {
        return (
          <a href={s} target="_blank" rel="noreferrer" className="small text-decoration-none">
            {summarize(s, 120)}
          </a>
        );
      }

      if (s.length <= 140) return <span className="small">{s || "—"}</span>;

      return (
        <details>
          <summary className="small" style={{ cursor: "pointer" }}>
            {summarize(s, 120)}
          </summary>
          <div className="small text-muted mt-2" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {s}
          </div>
        </details>
      );
    }

    if (Array.isArray(v)) {
      const preview = getArrayPreview(v);
      return (
        <div className="small">
          <div className="text-muted">List ({preview?.count ?? v.length})</div>
          {preview?.labels?.length ? (
            <div>
              <span className="text-muted">Examples:</span> {preview.labels.join(", ")}
              {preview.count > preview.labels.length ? "…" : ""}
            </div>
          ) : null}
        </div>
      );
    }

    if (isPlainObject(v)) {
      const pairs = getObjectSummaryPairs(v);
      return pairs.length ? (
        <div className="small d-flex flex-column gap-1">
          {pairs.map((p) => {
            const vv = String(p.v);
            const isUrl = vv.startsWith("http://") || vv.startsWith("https://");
            return (
              <div key={p.k} className="d-flex gap-2">
                <span className="text-muted" style={{ minWidth: 58 }}>
                  {p.k}:
                </span>
                {p.k === "Target" && isUrl ? (
                  <a href={vv} target="_blank" rel="noreferrer" className="text-decoration-none">
                    {summarize(vv, 140)}
                  </a>
                ) : (
                  <span className="text-break">{summarize(p.v, 140)}</span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="small text-muted">Object changed</div>
      );
    }

    return <span className="small">{summarize(v, 120)}</span>;
  };

  const updatedGroups = React.useMemo(() => {
    const groups = new Map<
      string,
      {
        header: string;
        rootHuman: string;
        itemLabel?: string;
        itemId?: string;
        changes: HumanChange[];
      }
    >();

    for (const c of updatedHuman) {
      const root = c.meta?.root ?? c.field;
      const rootHuman = c.meta?.rootHuman ?? c.field;
      const itemKey = c.meta?.itemId ?? c.meta?.itemLabel ?? "";
      const groupKey = `${root}|${itemKey}`;

      const header = c.meta?.itemLabel
        ? `${rootHuman}: ${c.meta.itemLabel}`
        : c.meta?.itemId
          ? `${rootHuman}: ID ${c.meta.itemId}`
          : rootHuman;

      const existing = groups.get(groupKey);
      if (existing) existing.changes.push(c);
      else {
        groups.set(groupKey, {
          header,
          rootHuman,
          itemLabel: c.meta?.itemLabel,
          itemId: c.meta?.itemId,
          changes: [c],
        });
      }
    }

    // Sort groups for stable display
    return Array.from(groups.values()).sort((a, b) => a.header.localeCompare(b.header));
  }, [updatedHuman]);

  if (!show) return null;

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(2px)", zIndex: 1060 }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="card border-0 shadow-lg rounded-4" style={{ width: "min(980px, 98vw)" }}>
        <div className="card-header bg-white border-0 d-flex align-items-start justify-content-between pt-2 px-2 pb-0">
          <div>
            <h5 className="mb-1">{title}</h5>
            {subtitle ? <div className="text-muted small">{subtitle}</div> : null}
            <div className="d-flex flex-wrap gap-2 mt-2">
              <span className="badge bg-success-subtle text-success">Added: {added.length}</span>
              <span className="badge bg-danger-subtle text-danger">Removed: {removed.length}</span>
              <span className="badge bg-primary-subtle text-primary">Updated: {updated.length}</span>
              <span className="badge bg-secondary-subtle text-secondary">Unchanged: {diff.length - changed.length}</span>
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={copyJson}>
              <i className="fas fa-copy me-1" /> Copy JSON
            </button>
            <button type="button" className="btn btn-sm btn-link text-muted" onClick={onClose} aria-label="Close">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        <div className="card-body px-2 pt-2 pb-2">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="form-check">
              <input
                id="audit-show-unchanged"
                className="form-check-input"
                type="checkbox"
                checked={showUnchanged}
                onChange={(e) => setShowUnchanged(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="audit-show-unchanged">
                Show unchanged fields
              </label>
            </div>
          </div>

          {humanChanges.length === 0 ? (
            <div className="text-center text-muted py-4">No field-level changes found.</div>
          ) : (
            <div className="d-flex flex-column gap-3" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {updatedHuman.length > 0 ? (
                <div>
                  <div className="fw-semibold mb-2">Updated</div>
                  <div className="list-group">
                    {updatedGroups.slice(0, 80).map((g) => (
                      <div key={g.header} className="list-group-item">
                        <div className="fw-semibold mb-2">
                          <span className="badge bg-primary me-2 text-uppercase">Updated</span>
                          {g.header}
                        </div>

                        <div className="d-flex flex-column gap-2">
                          {g.changes
                            .slice()
                            .sort((a, b) => (a.meta?.propHuman ?? a.title).localeCompare(b.meta?.propHuman ?? b.title))
                            .slice(0, 60)
                            .map((c, idx) => {
                              const propLabel = c.meta?.propHuman ?? c.title;
                              return (
                                <div key={`${propLabel}-${idx}`} className="border rounded p-2">
                                  <div className="small fw-semibold mb-1">{propLabel}</div>
                                  <div className="row g-2">
                                    <div className="col-md-6">
                                      <div className="small text-muted">From</div>
                                      {renderValueDetailed(c.field, c.oldValue)}
                                    </div>
                                    <div className="col-md-6">
                                      <div className="small text-muted">To</div>
                                      {renderValueDetailed(c.field, c.newValue)}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>

                        {g.changes.length > 60 ? (
                          <div className="text-muted small mt-2">Showing first 60 fields for this item.</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {addedHuman.length > 0 ? (
                <div>
                  <div className="fw-semibold mb-2">Added</div>
                  <div className="list-group">
                    {addedHuman.slice(0, 200).map((c, idx) => (
                      <div key={`${c.title}-${idx}`} className="list-group-item">
                        <div className="fw-semibold">
                          <span className="badge bg-success me-2 text-uppercase">Added</span>
                          {c.title}
                        </div>
                        <div className="small text-muted mt-1">{summarizeObjectForUser(c.newValue)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {removedHuman.length > 0 ? (
                <div>
                  <div className="fw-semibold mb-2">Removed</div>
                  <div className="list-group">
                    {removedHuman.slice(0, 200).map((c, idx) => (
                      <div key={`${c.title}-${idx}`} className="list-group-item">
                        <div className="fw-semibold">
                          <span className="badge bg-danger me-2 text-uppercase">Removed</span>
                          {c.title}
                        </div>
                        <div className="small text-muted mt-1">{summarizeObjectForUser(c.oldValue)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {(addedHuman.length + removedHuman.length + updatedHuman.length) > 200 ? (
                <div className="text-muted small">Showing first 200 changes.</div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
