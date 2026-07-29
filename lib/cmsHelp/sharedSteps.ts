import type { CmsHelpGuide, CmsHelpStep } from "@/lib/cmsHelp/types";
import { tour } from "@/lib/cmsHelp/tourSelectors";

type ListGuideConfig = {
  id: string;
  group: string;
  title: string;
  icon: string;
  summary: string;
  navHref: string;
  navLabel: string;
  parentMenu?: string;
  flatNav?: boolean;
  createLabel: string;
  entityName: string;
  entitySingular: string;
  searchHint?: string;
  filterNotes?: string[];
  actionNotes?: string[];
  optionIcons?: string[];
  extraSteps?: CmsHelpStep[];
};

/** Detailed list-module tour covering every major UI area */
export function detailedListModuleGuide(config: ListGuideConfig): CmsHelpGuide {
  const route = config.navHref;
  const parent = config.parentMenu ?? config.navLabel.split(" ")[0];

  return {
    id: config.id,
    group: config.group,
    title: config.title,
    icon: config.icon,
    summary: config.summary,
    steps: [
      {
        title: "Your profile in the sidebar",
        body: "Before working with content, note your account area at the top of the sidebar. It confirms who is logged in.",
        details: [
          "Your name and role appear under the avatar.",
          "This same avatar appears in the top-right corner of the screen.",
          "If the wrong person is logged in, use Logout from the avatar menu before making changes.",
        ],
        target: tour.sidebarUser,
        route,
        placement: "right",
      },
      {
        title: `Open ${config.navLabel} from the sidebar`,
        body: `The left sidebar is the main navigation for the entire CMS. Every module — including ${config.title} — is accessed from here.`,
        details: config.flatNav
          ? [
              `Scroll the sidebar until you find "${config.navLabel}".`,
              `Click "${config.navLabel}" to open the ${config.title} screen.`,
              "Wait for the page to finish loading before using search or filters.",
            ]
          : [
              `Scroll the sidebar until you find the "${parent}" section.`,
              `If the submenu is collapsed, click "${parent}" once to expand it.`,
              `Click "${config.navLabel}" to open the ${config.title} screen.`,
              "Wait for the page to finish loading before using search or filters.",
            ],
        target: tour.nav(route),
        route,
        placement: "right",
        tip: "You can switch modules anytime without losing saved work on form pages.",
      },
      {
        title: "Top bar: logo, sidebar toggle, and account menu",
        body: "The top bar is always visible. It helps you navigate the shell and manage your account.",
        details: [
          "The left button hides or shows the sidebar on desktop, or opens the drawer on mobile.",
          "Your company logo may appear beside the toggle.",
          "Click your avatar (top right) for Account settings, Help guide, and Logout.",
        ],
        target: tour.topbar,
        route,
        placement: "bottom",
      },
      {
        title: "Page header — title, description, and actions",
        body: "The hero header confirms you are on the correct screen and shows the most important actions for this module.",
        details: [
          `The icon and title "${config.title}" identify this module.`,
          "The gray description text explains what you can accomplish here.",
          "Purple action buttons on the right are primary tasks such as Create.",
          "Some modules also show View Trash or other secondary buttons here.",
        ],
        target: tour.moduleHero,
        route,
        placement: "bottom",
      },
      {
        title: "Summary statistics cards",
        body: "The stat cards below the header give you instant numbers without scanning the entire table.",
        details: [
          "Showing — how many records match your current search and filters.",
          "Other cards vary by module: totals, published count, active users, categories, etc.",
          "Numbers refresh after you save, delete, search, or change filters.",
          "Use these cards to sanity-check before bulk actions.",
        ],
        target: tour.moduleStats,
        route,
        placement: "bottom",
        tip: "If Showing is 0, clear your search or check trash/inactive filters.",
      },
      {
        title: `Primary action — ${config.createLabel}`,
        body: `To add a new ${config.entitySingular}, use the main create button. Do not duplicate rows in the table — always create fresh records.`,
        details: [
          `Click the purple "${config.createLabel}" button in the header.`,
          "Some modules open a full form page; others open a popup modal.",
          "Required fields are marked with a red asterisk (*).",
          "After saving, you return to this list and should see the new row.",
        ],
        target: tour.moduleCreate,
        route,
        placement: "left",
      },
      {
        title: "Toolbar overview",
        body: "The white toolbar card contains search, filters, and bulk actions. This is where you narrow down large lists.",
        details: [
          "The toolbar sits between the summary cards and the data table.",
          "All list modules share a similar toolbar layout for consistency.",
          "Changes in the toolbar affect what appears in the table below.",
        ],
        target: tour.moduleToolbar,
        route,
        placement: "bottom",
      },
      {
        title: "Filters — sort, page size, and special views",
        body: "Filters control how records are ordered, how many appear per page, and whether you see deleted or inactive items.",
        details: [
          'Click the "Filters" button to open the filter panel or modal.',
          "Sort By — choose a column such as title, name, or last modified.",
          "Sort Order — Ascending (A→Z) or Descending (Z→A).",
          "Per Page — number of rows shown (default is 5). Options typically include 5, 10, 25, 50, 100.",
          'Show deleted / trash / inactive — toggles a special view for removed or disabled records.',
          'Click "Apply" to refresh the table with your filter choices.',
          ...(config.filterNotes ?? []),
        ],
        target: tour.moduleFilters,
        route,
        placement: "bottom",
      },
      {
        title: "Search box — quick keyword lookup",
        body: `Type here to instantly filter ${config.entityName} by keyword. This is the fastest way to find one specific record.`,
        details: [
          config.searchHint ?? `Search usually matches titles, names, or labels depending on the module.`,
          "Results update as you type (with a short delay).",
          "Clear the search field to see the full list again.",
          "Search works together with Filters — both apply at the same time.",
        ],
        target: tour.moduleSearch,
        route,
        placement: "bottom",
      },
      {
        title: "Actions — bulk operations on selected rows",
        body: "Actions apply to every row you have checked in the table. Always verify your selection before confirming.",
        details: [
          'Click "Actions" to open the bulk menu.',
          "First, tick the checkboxes on the rows you want to affect.",
          "The header checkbox selects or deselects all visible rows on this page.",
          ...(config.actionNotes ?? [
            "Common bulk actions: Delete, Activate, Deactivate, Restore.",
            "Actions may be disabled until at least one row is selected.",
          ]),
          "Destructive actions usually ask for confirmation.",
        ],
        target: tour.moduleActions,
        route,
        placement: "bottom",
        tip: "Bulk delete is permanent in some modules — use trash view to restore when available.",
      },
      {
        title: "Advanced Search — filter by specific fields",
        body: "When simple search is not enough, Advanced Search lets you filter by exact fields such as slug, email, role, or date.",
        details: [
          'Click the "Advanced Search" button on the right side of the toolbar.',
          "Fill in one or more fields in the modal.",
          'Click "Search" to apply or "Reset" to clear the form.',
          "Advanced filters combine with the main search bar and Filters settings.",
        ],
        target: tour.moduleAdvancedSearch,
        route,
        placement: "left",
      },
      {
        title: "Data table — columns and sorting",
        body: `The table lists every ${config.entitySingular} with its key information. This is the main working area of the module.`,
        details: [
          "Each column shows a specific property: name, status, date, count, etc.",
          "Click a column header to sort when the header shows it is sortable.",
          "The first column is usually a bulk-select checkbox.",
          "The last column is Options with icons for row-level actions.",
          "Rows may appear dimmed or labeled when deleted/inactive.",
        ],
        target: tour.moduleTable,
        route,
        placement: "top",
      },
      {
        title: "Row options — edit, delete, restore, toggle",
        body: "Each row has an Options column with icon buttons for single-record tasks.",
        details: config.optionIcons ?? [
          "Pencil (edit) — open the record for editing.",
          "Trash (delete) — remove or soft-delete the record.",
          "Eye — preview or view details.",
          "Toggle — activate/deactivate users or similar status changes.",
          "Undo/restore — bring back items from trash when available.",
        ],
        target: tour.moduleTable,
        route,
        placement: "top",
      },
      {
        title: "Pagination and entries per page",
        body: "When there are more records than fit on one page, use the footer controls to navigate.",
        details: [
          ' "Show [5] entries" dropdown — change how many rows appear per page.',
          "Prev / Next — move to the previous or next page.",
          "Page numbers — jump directly to a specific page.",
          "The table only loads one page at a time for performance.",
        ],
        target: tour.modulePagination,
        route,
        placement: "top",
      },
      {
        title: "Preview changes on the live website",
        body: "After editing content, always verify the public site looks correct to visitors.",
        details: [
          'Click "View Website" at the bottom of the sidebar.',
          "The public site opens in a new browser tab.",
          "Compare what you changed in the CMS with what appears live.",
        ],
        target: tour.sidebarViewSite,
        route,
        placement: "right",
      },
      ...(config.extraSteps ?? []),
    ],
  };
}

export function detailedSettingsGuide(config: {
  id: string;
  group: string;
  title: string;
  icon: string;
  summary: string;
  navHref: string;
  navLabel: string;
  includeProfileStep?: boolean;
  sections: Array<{ name: string; details: string[] }>;
}): CmsHelpGuide {
  const route = config.navHref;
  const steps: CmsHelpStep[] = [
    {
      title: "Open settings from the sidebar",
      body: `${config.title} lives under the Settings section of the sidebar.`,
      details: [
        'Click "Settings" in the sidebar to expand the submenu if needed.',
        `Click "${config.navLabel}" to open this page.`,
        "You can also reach Account Settings from the avatar menu → Account.",
      ],
      target: tour.nav(route),
      route,
      placement: "right",
    },
    {
      title: "Settings page layout",
      body: "Settings pages use a sectioned layout. Each section groups related fields and can be collapsed.",
      details: [
        "The page title and description appear at the top.",
        "Each section has an icon, title, and short explanation.",
        "Click a section header to collapse or expand it.",
        "Fields use labels, hints, and required markers (*).",
      ],
      target: tour.moduleHero,
      route,
      placement: "bottom",
    },
  ];

  if (config.includeProfileStep) {
    steps.push({
      title: "Profile card",
      body: "The profile card shows your current avatar and name at a glance.",
      details: [
        "Upload a new photo using the file upload control.",
        "Saving updates the sidebar and top bar avatar immediately.",
      ],
      target: tour.settingsSection,
      route,
      placement: "bottom",
    });
  }

  config.sections.forEach((section, index) => {
    steps.push({
      title: section.name,
      body: `This section controls ${section.name.toLowerCase()} for your site or account.`,
      details: section.details,
      target: tour.settingsSection,
      route,
      placement: index % 2 === 0 ? "bottom" : "center",
    });
  });

  steps.push({
    title: "Save your changes",
    body: "Always save before leaving. Unsaved changes will be lost if you navigate away.",
    details: [
      "Scroll to the sticky footer at the bottom of the page.",
      "Click Save or the primary save button in the footer.",
      "Wait for the success message before leaving the page.",
      "Some sections save independently — check each area if unsure.",
    ],
    target: tour.settingsFooter,
    route,
    placement: "top",
    tip: "After saving website branding, refresh the public site to confirm logo changes.",
  });

  return {
    id: config.id,
    group: config.group,
    title: config.title,
    icon: config.icon,
    summary: config.summary,
    steps,
  };
}
