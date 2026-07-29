import type { HelpVisualLayout } from "@/lib/cmsHelp/resolveStepVisual";

type Zone = { x: number; y: number; w: number; h: number; rx?: number };

const PAGE_EDITOR_ZONES: Record<string, Zone> = {
  toolbar: { x: 8, y: 24, w: 464, h: 28, rx: 6 },
  breadcrumb: { x: 14, y: 30, w: 92, h: 16, rx: 4 },
  canvas: { x: 8, y: 52, w: 352, h: 212, rx: 8 },
  sidebar: { x: 368, y: 52, w: 104, h: 212, rx: 8 },
  save: { x: 406, y: 30, w: 58, h: 16, rx: 4 },
  center: { x: 72, y: 56, w: 336, h: 180, rx: 8 },
};

const MODULE_LIST_ZONES: Record<string, Zone> = {
  hero: { x: 12, y: 16, w: 456, h: 48, rx: 8 },
  stats: { x: 12, y: 72, w: 456, h: 28, rx: 6 },
  toolbar: { x: 12, y: 108, w: 456, h: 32, rx: 6 },
  table: { x: 12, y: 148, w: 456, h: 88, rx: 6 },
  center: { x: 72, y: 56, w: 336, h: 180, rx: 8 },
};

const DASHBOARD_ZONES: Record<string, Zone> = {
  hero: { x: 12, y: 16, w: 456, h: 52, rx: 8 },
  stats: { x: 12, y: 76, w: 456, h: 36, rx: 6 },
  actions: { x: 12, y: 120, w: 220, h: 56, rx: 6 },
  activity: { x: 240, y: 120, w: 228, h: 56, rx: 6 },
  center: { x: 72, y: 56, w: 336, h: 180, rx: 8 },
};

const SETTINGS_ZONES: Record<string, Zone> = {
  form: { x: 12, y: 16, w: 456, h: 148, rx: 8 },
  upload: { x: 24, y: 48, w: 432, h: 72, rx: 6 },
  footer: { x: 12, y: 176, w: 456, h: 36, rx: 6 },
  center: { x: 72, y: 56, w: 336, h: 180, rx: 8 },
};

const SIDEBAR_ZONES: Record<string, Zone> = {
  nav: { x: 8, y: 16, w: 108, h: 170, rx: 6 },
  center: { x: 124, y: 16, w: 348, h: 216, rx: 8 },
};

const GENERIC_ZONES: Record<string, Zone> = {
  center: { x: 72, y: 56, w: 336, h: 180, rx: 8 },
};

function getZones(layout: HelpVisualLayout): Record<string, Zone> {
  switch (layout) {
    case "page-editor":
      return PAGE_EDITOR_ZONES;
    case "module-list":
      return MODULE_LIST_ZONES;
    case "dashboard":
      return DASHBOARD_ZONES;
    case "settings":
      return SETTINGS_ZONES;
    case "sidebar":
      return SIDEBAR_ZONES;
    default:
      return GENERIC_ZONES;
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layoutBaseMarkup(layout: HelpVisualLayout) {
  switch (layout) {
    case "page-editor":
      return `
        <rect x="0" y="0" width="480" height="280" fill="#f1f5f9"/>
        <rect x="8" y="24" width="464" height="28" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="8" y="52" width="352" height="212" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="368" y="52" width="104" height="212" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
      `;
    case "module-list":
      return `
        <rect x="0" y="0" width="480" height="280" fill="#f8fafc"/>
        <rect x="12" y="16" width="456" height="48" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="12" y="72" width="456" height="28" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
        <rect x="12" y="108" width="456" height="32" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
        <rect x="12" y="148" width="456" height="88" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
      `;
    case "dashboard":
      return `
        <rect x="0" y="0" width="480" height="280" fill="#f8fafc"/>
        <rect x="12" y="16" width="456" height="52" rx="8" fill="#6366f1"/>
        <rect x="12" y="76" width="456" height="36" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
        <rect x="12" y="120" width="220" height="56" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
        <rect x="240" y="120" width="228" height="56" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
      `;
    case "settings":
      return `
        <rect x="0" y="0" width="480" height="280" fill="#f8fafc"/>
        <rect x="12" y="16" width="456" height="148" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="12" y="176" width="456" height="36" rx="6" fill="#ffffff" stroke="#e2e8f0"/>
      `;
    case "sidebar":
      return `
        <rect x="0" y="0" width="480" height="280" fill="#f1f5f9"/>
        <rect x="8" y="16" width="108" height="216" rx="6" fill="#0f172a"/>
        <rect x="124" y="16" width="348" height="216" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
      `;
    default:
      return `
        <rect x="0" y="0" width="480" height="280" fill="#f8fafc"/>
        <rect x="8" y="12" width="464" height="28" rx="6" fill="#ffffff" stroke="#cbd5e1"/>
        <rect x="72" y="56" width="336" height="180" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
      `;
  }
}

export function buildGuideSvgString(layout: HelpVisualLayout, highlight: string, title: string) {
  const zones = getZones(layout);
  const zone = zones[highlight] ?? zones.center ?? { x: 72, y: 56, w: 336, h: 180, rx: 8 };
  const label = title.length > 28 ? `${title.slice(0, 28)}…` : title;
  const labelY = Math.max(zone.y, 14);

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 280" width="960" height="560">
      ${layoutBaseMarkup(layout)}
      <rect x="${zone.x}" y="${zone.y}" width="${zone.w}" height="${zone.h}" rx="${zone.rx ?? 6}"
        fill="rgba(99,102,241,0.22)" stroke="#6366f1" stroke-width="3"/>
      <rect x="${zone.x}" y="${labelY}" width="${Math.min(Math.max(zone.w, 80), 240)}" height="18" rx="4" fill="#6366f1"/>
      <text x="${zone.x + 6}" y="${labelY + 12}" fill="#ffffff" font-size="10" font-weight="700" font-family="Arial, sans-serif">
        ${escapeXml(label)}
      </text>
    </svg>
  `.trim();
}

export async function svgStringToPngDataUrl(svg: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 960;
        canvas.height = 560;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas is unavailable"));
          return;
        }
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to render guide illustration"));
    };

    image.src = objectUrl;
  });
}
