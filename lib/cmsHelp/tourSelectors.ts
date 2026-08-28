/** Shared selectors used by live tour highlights */
export const tour = {
  sidebar: ".sb-root",
  sidebarViewSite: ".sb-viewsite",
  topbar: ".cms-topbar",
  topbarAvatar: ".cms-topbar__user-menu-wrap",

  nav: (href: string) => `[data-cms-tour="nav${href}"]`,

  moduleHero: '[data-cms-tour="module-hero"]',
  moduleStats: '[data-cms-tour="module-stats"]',
  moduleToolbar: '[data-cms-tour="module-toolbar"]',
  moduleSearch: '[data-cms-tour="module-search"]',
  moduleFilters: '[data-cms-tour="module-filters"]',
  moduleActions: '[data-cms-tour="module-actions"]',
  moduleAdvancedSearch: '[data-cms-tour="module-advanced-search"]',
  moduleCreate: '[data-cms-tour="module-create"]',
  moduleTable: '[data-cms-tour="module-table"]',
  modulePagination: '[data-cms-tour="module-pagination"]',

  managedTabs: '[data-cms-tour="managed-tabs"]',
  managedCategory: '[data-cms-tour="managed-category"]',

  sidebarUser: ".sb-user",

  settingsLayout: ".cms-settings-layout",
  settingsSection: ".cms-settings-section",
  settingsFooter: ".cms-settings-footer",

  dashboardHero: ".cms-dashboard__hero",
  dashboardStats: ".cms-dashboard__metrics",
  dashboardActions: ".cms-dashboard__actions",
  dashboardActivity: ".cms-dashboard__grid",
  dashboardQuicklinks: ".cms-dashboard__quicklinks",

  menuPanelPages: '[data-cms-tour="menu-panel-pages"]',
  menuPanelCustom: '[data-cms-tour="menu-panel-custom"]',
  menuPanelStructure: '[data-cms-tour="menu-panel-structure"]',

  uploadZone: ".cms-settings-upload-zone",
  settingsFormFooter: ".cms-settings-footer",

  pageEditorToolbar: '[data-cms-tour="page-editor-toolbar"]',
  pageEditorBreadcrumb: '[data-cms-tour="page-editor-breadcrumb"]',
  pageEditorPageSwitcher: '[data-cms-tour="page-editor-page-switcher"]',
  pageEditorStatus: '[data-cms-tour="page-editor-status"]',
  pageEditorActions: '[data-cms-tour="page-editor-actions"]',
  pageEditorSave: '[data-cms-tour="page-editor-save"]',
  pageEditorGuide: '[data-cms-tour="page-editor-guide"]',
  pageEditorToggle: '[data-cms-tour="page-editor-toggle"]',
  pageEditorCanvas: '[data-cms-tour="page-editor-canvas"]',
  pageEditorSidebar: '[data-cms-tour="page-editor-sidebar"]',
  pageEditorDetails: '[data-cms-tour="page-editor-details"]',
  pageEditorSeo: '[data-cms-tour="page-editor-seo"]',
  pageEditorMobileSave: '[data-cms-tour="page-editor-mobile-save"]',

  grapesStudioBar: '[data-cms-tour="grapes-studio-bar"]',
  grapesBlocks: '[data-cms-tour="grapes-blocks"]',
  grapesCanvas: '[data-cms-tour="grapes-canvas"]',
  grapesLayersTab: '[data-cms-tour="grapes-layers-tab"]',
  grapesStyles: '[data-cms-tour="grapes-styles"]',
  grapesGuide: '[data-cms-tour="grapes-guide"]',
  grapesPageSwitcher: '[data-cms-tour="grapes-page-switcher"]',
  grapesSave: '[data-cms-tour="grapes-save"]',
  grapesSettings: '[data-cms-tour="grapes-settings"]',
} as const;

export function pathMatchesRoute(pathname: string, route?: string): boolean {
  if (!route) return true;
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  const normalized = route.replace(/\/$/, "") || "/";
  return path === normalized || path.startsWith(`${normalized}/`);
}
