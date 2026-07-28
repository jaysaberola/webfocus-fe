"use client";

import type { HelpVisualLayout } from "@/lib/cmsHelp/resolveStepVisual";

type Zone = { x: number; y: number; w: number; h: number; rx?: number };

const PAGE_EDITOR_ZONES: Record<string, Zone> = {
  toolbar: { x: 8, y: 24, w: 464, h: 28, rx: 6 },
  breadcrumb: { x: 14, y: 30, w: 92, h: 16, rx: 4 },
  switcher: { x: 112, y: 30, w: 78, h: 16, rx: 4 },
  status: { x: 198, y: 30, w: 58, h: 16, rx: 4 },
  guide: { x: 318, y: 30, w: 44, h: 16, rx: 4 },
  actions: { x: 292, y: 30, w: 108, h: 16, rx: 4 },
  save: { x: 406, y: 30, w: 58, h: 16, rx: 4 },
  toggle: { x: 286, y: 58, w: 118, h: 14, rx: 4 },
  canvas: { x: 8, y: 52, w: 352, h: 212, rx: 8 },
  "grapes-bar": { x: 14, y: 82, w: 340, h: 20, rx: 4 },
  blocks: { x: 14, y: 108, w: 64, h: 148, rx: 4 },
  layers: { x: 14, y: 236, w: 64, h: 22, rx: 4 },
  "grapes-canvas": { x: 84, y: 108, w: 262, h: 148, rx: 4 },
  styles: { x: 352, y: 108, w: 0, h: 0 },
  sidebar: { x: 368, y: 52, w: 104, h: 212, rx: 8 },
  details: { x: 374, y: 62, w: 92, h: 118, rx: 6 },
  seo: { x: 374, y: 188, w: 92, h: 68, rx: 6 },
  "mobile-save": { x: 196, y: 248, w: 88, h: 18, rx: 9 },
};

// styles panel is inside canvas area on the right
PAGE_EDITOR_ZONES.styles = { x: 292, y: 108, w: 54, h: 148, rx: 4 };

const MODULE_LIST_ZONES: Record<string, Zone> = {
  hero: { x: 12, y: 16, w: 456, h: 48, rx: 8 },
  stats: { x: 12, y: 72, w: 456, h: 28, rx: 6 },
  toolbar: { x: 12, y: 108, w: 456, h: 32, rx: 6 },
  search: { x: 18, y: 114, w: 120, h: 20, rx: 4 },
  filters: { x: 148, y: 114, w: 72, h: 20, rx: 4 },
  actions: { x: 360, y: 114, w: 72, h: 20, rx: 4 },
  create: { x: 392, y: 114, w: 68, h: 20, rx: 4 },
  table: { x: 12, y: 148, w: 456, h: 88, rx: 6 },
  pagination: { x: 320, y: 244, w: 148, h: 18, rx: 4 },
};

const DASHBOARD_ZONES: Record<string, Zone> = {
  hero: { x: 12, y: 16, w: 456, h: 52, rx: 8 },
  stats: { x: 12, y: 76, w: 456, h: 36, rx: 6 },
  actions: { x: 12, y: 120, w: 220, h: 56, rx: 6 },
  activity: { x: 240, y: 120, w: 228, h: 56, rx: 6 },
  quicklinks: { x: 12, y: 184, w: 456, h: 64, rx: 6 },
};

const SETTINGS_ZONES: Record<string, Zone> = {
  form: { x: 12, y: 16, w: 456, h: 148, rx: 8 },
  upload: { x: 24, y: 48, w: 432, h: 72, rx: 6 },
  footer: { x: 12, y: 176, w: 456, h: 36, rx: 6 },
};

const SIDEBAR_ZONES: Record<string, Zone> = {
  nav: { x: 8, y: 16, w: 108, h: 170, rx: 6 },
  "view-site": { x: 8, y: 196, w: 108, h: 36, rx: 6 },
};

const GENERIC_ZONES: Record<string, Zone> = {
  topbar: { x: 8, y: 12, w: 464, h: 28, rx: 6 },
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

function drawPageEditorBase() {
  return (
    <>
      <rect x="0" y="0" width="480" height="280" fill="#f1f5f9" />
      <rect x="8" y="24" width="464" height="28" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="14" y="30" width="92" height="16" rx="4" fill="#e2e8f0" />
      <rect x="112" y="30" width="78" height="16" rx="4" fill="#dbeafe" />
      <rect x="406" y="30" width="58" height="16" rx="4" fill="#6366f1" />
      <rect x="8" y="52" width="352" height="212" rx="8" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="16" y="58" width="88" height="12" rx="3" fill="#94a3b8" />
      <rect x="286" y="58" width="64" height="12" rx="3" fill="#6366f1" opacity="0.35" />
      <rect x="356" y="58" width="64" height="12" rx="3" fill="#cbd5e1" />
      <rect x="12" y="76" width="344" height="182" rx="6" fill="#0f172a" />
      <rect x="14" y="82" width="340" height="20" rx="4" fill="#1e293b" />
      <circle cx="24" cy="92" r="3" fill="#64748b" />
      <circle cx="34" cy="92" r="3" fill="#64748b" />
      <circle cx="44" cy="92" r="3" fill="#64748b" />
      <rect x="14" y="108" width="64" height="148" rx="4" fill="#1e293b" />
      <rect x="84" y="108" width="262" height="148" rx="4" fill="#ffffff" />
      <rect x="292" y="108" width="54" height="148" rx="4" fill="#1e293b" />
      <rect x="98" y="124" width="180" height="12" rx="3" fill="#cbd5e1" />
      <rect x="98" y="142" width="220" height="8" rx="2" fill="#e2e8f0" />
      <rect x="98" y="156" width="200" height="8" rx="2" fill="#e2e8f0" />
      <rect x="368" y="52" width="104" height="212" rx="8" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="374" y="62" width="92" height="118" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
      <rect x="382" y="72" width="56" height="8" rx="2" fill="#94a3b8" />
      <rect x="382" y="86" width="76" height="10" rx="3" fill="#e2e8f0" />
      <rect x="382" y="102" width="76" height="10" rx="3" fill="#e2e8f0" />
      <rect x="374" y="188" width="92" height="68" rx="6" fill="#f8fafc" stroke="#e2e8f0" />
      <rect x="196" y="248" width="88" height="18" rx="9" fill="#6366f1" opacity="0.25" />
    </>
  );
}

function drawModuleListBase() {
  return (
    <>
      <rect x="0" y="0" width="480" height="280" fill="#f8fafc" />
      <rect x="12" y="16" width="456" height="48" rx="8" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="24" y="28" width="160" height="12" rx="3" fill="#64748b" />
      <rect x="24" y="44" width="240" height="8" rx="2" fill="#cbd5e1" />
      <rect x="12" y="72" width="456" height="28" rx="6" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="12" y="108" width="456" height="32" rx="6" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="12" y="148" width="456" height="88" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      {[0, 1, 2, 3].map((row) => (
        <rect key={row} x="20" y={158 + row * 18} width="420" height="10" rx="3" fill="#e2e8f0" />
      ))}
    </>
  );
}

function drawDashboardBase() {
  return (
    <>
      <rect x="0" y="0" width="480" height="280" fill="#f8fafc" />
      <rect x="12" y="16" width="456" height="52" rx="8" fill="url(#helpDashGrad)" />
      <rect x="12" y="76" width="456" height="36" rx="6" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="12" y="120" width="220" height="56" rx="6" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="240" y="120" width="228" height="56" rx="6" fill="#ffffff" stroke="#e2e8f0" />
      <rect x="12" y="184" width="456" height="64" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    </>
  );
}

function drawSettingsBase() {
  return (
    <>
      <rect x="0" y="0" width="480" height="280" fill="#f8fafc" />
      <rect x="12" y="16" width="456" height="148" rx="8" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="24" y="32" width="120" height="10" rx="3" fill="#64748b" />
      <rect x="24" y="48" width="432" height="72" rx="6" fill="#eff6ff" stroke="#bfdbfe" strokeDasharray="6 4" />
      <rect x="24" y="130" width="200" height="10" rx="3" fill="#e2e8f0" />
      <rect x="12" y="176" width="456" height="36" rx="6" fill="#ffffff" stroke="#e2e8f0" />
    </>
  );
}

function drawSidebarBase() {
  return (
    <>
      <rect x="0" y="0" width="480" height="280" fill="#f1f5f9" />
      <rect x="8" y="16" width="108" height="216" rx="6" fill="#0f172a" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x="18" y={28 + i * 22} width="78" height="12" rx="3" fill="#334155" />
      ))}
      <rect x="8" y="196" width="108" height="36" rx="6" fill="#1d4ed8" />
      <rect x="124" y="16" width="348" height="216" rx="8" fill="#ffffff" stroke="#cbd5e1" />
    </>
  );
}

function drawGenericBase() {
  return (
    <>
      <rect x="0" y="0" width="480" height="280" fill="#f8fafc" />
      <rect x="8" y="12" width="464" height="28" rx="6" fill="#ffffff" stroke="#cbd5e1" />
      <rect x="72" y="56" width="336" height="180" rx="8" fill="#ffffff" stroke="#cbd5e1" />
    </>
  );
}

function drawBase(layout: HelpVisualLayout) {
  switch (layout) {
    case "page-editor":
      return drawPageEditorBase();
    case "module-list":
      return drawModuleListBase();
    case "dashboard":
      return drawDashboardBase();
    case "settings":
      return drawSettingsBase();
    case "sidebar":
      return drawSidebarBase();
    default:
      return drawGenericBase();
  }
}

type HelpGuideSvgImageProps = {
  layout: HelpVisualLayout;
  highlight: string;
  title: string;
  compact?: boolean;
};

export default function HelpGuideSvgImage({ layout, highlight, title, compact = false }: HelpGuideSvgImageProps) {
  const zones = getZones(layout);
  const zone = zones[highlight] ?? zones.center ?? { x: 72, y: 56, w: 336, h: 180, rx: 8 };

  return (
    <svg
      viewBox="0 0 480 280"
      className={`cms-help-guide-image${compact ? " cms-help-guide-image--compact" : ""}`}
      role="img"
      aria-label={`Guide illustration: ${title}`}
    >
      <defs>
        <linearGradient id="helpDashGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <filter id="helpGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#6366f1" floodOpacity="0.55" />
        </filter>
      </defs>

      {drawBase(layout)}

      <rect
        x={zone.x}
        y={zone.y}
        width={zone.w}
        height={zone.h}
        rx={zone.rx ?? 6}
        fill="rgba(99,102,241,0.22)"
        stroke="#6366f1"
        strokeWidth="3"
        filter="url(#helpGlow)"
      />

      <rect
        x={zone.x}
        y={Math.max(zone.y, 14)}
        width={Math.min(Math.max(zone.w, 80), 240)}
        height="18"
        rx="4"
        fill="#6366f1"
      />
      <text
        x={zone.x + 6}
        y={Math.max(zone.y, 14) + 12}
        fill="#ffffff"
        fontSize="10"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        {title.length > 28 ? `${title.slice(0, 28)}…` : title}
      </text>
    </svg>
  );
}
