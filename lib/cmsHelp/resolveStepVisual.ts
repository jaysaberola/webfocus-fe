import type { CmsHelpStep } from "@/lib/cmsHelp/types";

export type HelpVisualLayout =
  | "page-editor"
  | "module-list"
  | "dashboard"
  | "settings"
  | "menu-builder"
  | "sidebar"
  | "generic";

export type HelpVisualConfig = {
  layout: HelpVisualLayout;
  highlight: string;
  imageSrc: string;
};

function matchTarget(target: string, token: string): boolean {
  return target.includes(token);
}

function buildImageSrc(layout: HelpVisualLayout, highlight: string): string {
  return `/help/guides/${layout}-${highlight}.svg`;
}

export function resolveStepVisual(step: CmsHelpStep): HelpVisualConfig {
  const target = step.image ?? step.visual ?? step.target ?? "";

  if (step.image) {
    return { layout: "generic", highlight: "center", imageSrc: step.image };
  }

  if (step.visual) {
    const [layout, highlight] = step.visual.split(":");
    if (layout && highlight) {
      const resolvedLayout = layout as HelpVisualLayout;
      return {
        layout: resolvedLayout,
        highlight,
        imageSrc: buildImageSrc(resolvedLayout, highlight),
      };
    }
  }

  let layout: HelpVisualLayout = "generic";
  let highlight = "center";

  if (matchTarget(target, "page-editor-toolbar")) highlight = "toolbar";
  else if (matchTarget(target, "page-editor-breadcrumb")) highlight = "breadcrumb";
  else if (matchTarget(target, "page-editor-page-switcher")) highlight = "switcher";
  else if (matchTarget(target, "page-editor-status")) highlight = "status";
  else if (matchTarget(target, "page-editor-actions")) highlight = "actions";
  else if (matchTarget(target, "page-editor-save")) highlight = "save";
  else if (matchTarget(target, "page-editor-guide")) highlight = "guide";
  else if (matchTarget(target, "page-editor-toggle")) highlight = "toggle";
  else if (matchTarget(target, "page-editor-canvas")) highlight = "canvas";
  else if (matchTarget(target, "page-editor-sidebar")) highlight = "sidebar";
  else if (matchTarget(target, "page-editor-details")) highlight = "details";
  else if (matchTarget(target, "page-editor-seo")) highlight = "seo";
  else if (matchTarget(target, "page-editor-mobile-save")) highlight = "mobile-save";
  else if (matchTarget(target, "grapes-studio-bar")) highlight = "grapes-bar";
  else if (matchTarget(target, "grapes-blocks")) highlight = "blocks";
  else if (matchTarget(target, "grapes-canvas")) highlight = "grapes-canvas";
  else if (matchTarget(target, "grapes-layers-tab")) highlight = "layers";
  else if (matchTarget(target, "grapes-styles")) highlight = "styles";
  else if (matchTarget(target, "module-hero")) {
    layout = "module-list";
    highlight = "hero";
  } else if (matchTarget(target, "module-stats")) {
    layout = "module-list";
    highlight = "stats";
  } else if (matchTarget(target, "module-toolbar")) {
    layout = "module-list";
    highlight = "toolbar";
  } else if (matchTarget(target, "module-search")) {
    layout = "module-list";
    highlight = "search";
  } else if (matchTarget(target, "module-filters")) {
    layout = "module-list";
    highlight = "filters";
  } else if (matchTarget(target, "module-actions")) {
    layout = "module-list";
    highlight = "actions";
  } else if (matchTarget(target, "module-create")) {
    layout = "module-list";
    highlight = "create";
  } else if (matchTarget(target, "module-table")) {
    layout = "module-list";
    highlight = "table";
  } else if (matchTarget(target, "module-pagination")) {
    layout = "module-list";
    highlight = "pagination";
  } else if (matchTarget(target, "dashboard-hero") || matchTarget(target, "cms-dashboard__hero")) {
    layout = "dashboard";
    highlight = "hero";
  } else if (matchTarget(target, "dashboard-stats") || matchTarget(target, "dashboard-metrics")) {
    layout = "dashboard";
    highlight = "stats";
  } else if (matchTarget(target, "dashboard-actions")) {
    layout = "dashboard";
    highlight = "actions";
  } else if (matchTarget(target, "dashboard-activity") || matchTarget(target, "dashboard-grid")) {
    layout = "dashboard";
    highlight = "activity";
  } else if (matchTarget(target, "dashboard-quicklinks")) {
    layout = "dashboard";
    highlight = "quicklinks";
  } else if (matchTarget(target, "cms-settings") || matchTarget(target, "settings-section")) {
    layout = "settings";
    highlight = "form";
  } else if (matchTarget(target, "settings-footer")) {
    layout = "settings";
    highlight = "footer";
  } else if (matchTarget(target, "upload-zone")) {
    layout = "settings";
    highlight = "upload";
  } else if (matchTarget(target, "sb-viewsite")) {
    layout = "sidebar";
    highlight = "view-site";
  } else if (matchTarget(target, "sb-root") || matchTarget(target, "nav")) {
    layout = "sidebar";
    highlight = "nav";
  } else if (matchTarget(target, "cms-topbar")) {
    highlight = "topbar";
  } else if (step.route?.includes("/pages/")) {
    layout = "page-editor";
    highlight = "canvas";
  } else if (step.route?.includes("/dashboard")) {
    layout = "dashboard";
    highlight = "hero";
  } else if (
    matchTarget(target, "page-editor") ||
    matchTarget(target, "grapes-")
  ) {
    layout = "page-editor";
    highlight = "canvas";
  }

  if (
    highlight === "center" &&
    (matchTarget(target, "page-editor") ||
      matchTarget(target, "grapes-") ||
      step.route?.includes("/pages/"))
  ) {
    layout = "page-editor";
    highlight = "canvas";
  }

  if (layout === "generic" && highlight === "center" && matchTarget(target, "module-")) {
    layout = "module-list";
    highlight = "table";
  }

  if (
    layout === "page-editor" ||
    matchTarget(target, "page-editor") ||
    matchTarget(target, "grapes-") ||
    step.route?.includes("/pages/")
  ) {
    layout = "page-editor";
  }

  return {
    layout,
    highlight,
    imageSrc: buildImageSrc(layout, highlight),
  };
}
