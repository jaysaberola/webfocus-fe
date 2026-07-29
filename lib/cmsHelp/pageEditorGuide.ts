import type { CmsHelpGuide, CmsHelpStep } from "@/lib/cmsHelp/types";
import { tour } from "@/lib/cmsHelp/tourSelectors";

function buildSteps(mode: "create" | "edit"): CmsHelpStep[] {
  const route = mode === "create" ? "/pages/create" : "/pages/edit";
  const isCreate = mode === "create";

  const steps: CmsHelpStep[] = [
    {
      title: "Page editor toolbar",
      body: "This bar stays visible while you work. It shows where you are, page status, and your main actions.",
      details: [
        "Use it to save, preview, switch pages, or return to Manage Pages.",
        "The Guide button (question mark) re-opens this walkthrough anytime.",
      ],
      target: tour.pageEditorToolbar,
      route,
      placement: "bottom",
    },
    {
      title: "Back to Manage Pages",
      body: "Click Manage Pages to return to the full list without losing saved work.",
      details: ["Unsaved changes may prompt you before leaving."],
      target: tour.pageEditorBreadcrumb,
      route,
      placement: "bottom",
    },
  ];

  if (isCreate) {
    steps.push({
      title: "New page title preview",
      body: "As you type the Page Title in the sidebar, this label updates so you always know which page you are building.",
      details: ["The title also drives the URL slug after you save."],
      target: tour.pageEditorPageSwitcher,
      route,
      placement: "bottom",
    });
  } else {
    steps.push(
      {
        title: "Switch between pages",
        body: "Open this dropdown to jump to another page without going back to Manage Pages.",
        details: ["Search by title if you have many pages."],
        target: tour.pageEditorPageSwitcher,
        route,
        placement: "bottom",
      },
      {
        title: "Saved vs unsaved status",
        body: "A green Saved badge means everything is stored. An orange dot means you have changes that are not saved yet.",
        details: ["Always click Save Page before closing the tab when you see unsaved changes."],
        target: tour.pageEditorStatus,
        route,
        placement: "bottom",
      },
      {
        title: "Preview and Live links",
        body: "Preview opens a draft view. Live opens the public page as visitors see it (when published).",
        details: [
          "New Page — start another page from scratch.",
          "Preview — safe to check layout before publishing.",
          "Live — confirm the page on your actual website.",
        ],
        target: tour.pageEditorActions,
        route,
        placement: "bottom",
      }
    );
  }

  steps.push(
    {
      title: "Save Page button",
      body: isCreate
        ? "When Page Details and content look good, click Save Page to save the new page to the site."
        : "Click Save Page whenever you finish a round of edits. Wait for the success message.",
      details: [
        isCreate ? "You need a Page Title before saving." : "Keyboard users: save often so you never lose work.",
        "On mobile, a floating save button appears at the bottom of the screen.",
      ],
      target: tour.pageEditorSave,
      route,
      placement: "left",
    },
    {
      title: "Choose your editor",
      body: "Visual Builder is recommended for layout-heavy pages. TinyMCE is a classic rich-text editor for simpler content.",
      details: [
        "Visual Builder — drag blocks, sections, images, and columns.",
        "TinyMCE — type and format text like a word processor.",
        "You can switch editors, but stick to one per page for best results.",
      ],
      target: tour.pageEditorToggle,
      route,
      placement: "bottom",
    },
    {
      title: "Page content area",
      body: "This is where you design the page body. Everything below the Page Content heading is what visitors will see.",
      target: tour.pageEditorCanvas,
      route,
      placement: "top",
    },
    {
      title: "Visual Builder toolbar",
      body: "When Visual Builder is active, this toolbar controls undo/redo, device preview, zoom, and fullscreen.",
      details: [
        "Desktop / tablet / mobile icons — preview responsive layouts.",
        "Eye icon — quick preview of the current design.",
        "Expand — fullscreen mode for more canvas space.",
      ],
      target: tour.grapesStudioBar,
      route,
      placement: "bottom",
      tip: "Select Visual Builder in the editor toggle if you do not see this toolbar.",
    },
    {
      title: "Blocks panel — drag to build",
      body: "Browse sections, columns, text, images, and more. Drag any block onto the canvas to add it to your page.",
      details: [
        "Use the search box to filter blocks quickly.",
        "Start with a Hero or Section block for a polished layout.",
      ],
      target: tour.grapesBlocks,
      route,
      placement: "right",
      tip: "Select Visual Builder in the editor toggle to open the blocks panel.",
    },
    {
      title: "Design canvas",
      body: "Click any block on the canvas to select it. Double-click text to edit words inline.",
      details: [
        "Selected elements show a blue outline.",
        "Drag handles let you reorder sections.",
        "An empty canvas shows quick-start suggestions.",
      ],
      target: tour.grapesCanvas,
      route,
      placement: "left",
      tip: "Select Visual Builder in the editor toggle to use the drag-and-drop canvas.",
    },
    {
      title: "Layers panel",
      body: "Layers lists every element on the page in tree order. Use it to select nested items that are hard to click.",
      target: tour.grapesLayersTab,
      route,
      placement: "right",
      tip: "Select Visual Builder, then click the Layers tab on the left panel.",
    },
    {
      title: "Styles and settings panel",
      body: "With an element selected, open Styles to change colors, spacing, and typography. Settings holds traits like links and IDs.",
      details: ["Changes apply only to the selected element unless you edit a shared class."],
      target: tour.grapesStyles,
      route,
      placement: "left",
      tip: "Select Visual Builder, click an element on the canvas, then use the Styles tab on the right.",
    },
    {
      title: "Page Details sidebar",
      body: "Set the page title, internal label, album, menu group, and published/private visibility here.",
      details: [
        "Page Title — public name and basis for the URL slug.",
        "Page Label — internal CMS name (not shown on the site).",
        "Published toggle — Private hides the page from visitors.",
      ],
      target: tour.pageEditorDetails,
      route,
      placement: "left",
    },
    {
      title: "SEO Settings",
      body: "Expand SEO Settings to add a search-friendly title, description, and keywords for Google and social previews.",
      details: [
        "SEO Title — ~50–60 characters for search results.",
        "SEO Description — ~150–160 character summary.",
      ],
      target: tour.pageEditorSeo,
      route,
      placement: "left",
      tip: "Click the SEO Settings header to expand this panel if it is collapsed.",
    },
    {
      title: "Mobile save button",
      body: "On small screens the main toolbar may scroll away — this sticky button keeps Save / Create within reach.",
      target: tour.pageEditorMobileSave,
      route,
      placement: "top",
    }
  );

  if (!isCreate) {
    steps.push({
      title: "Verify on the live website",
      body: "After saving, use Live or View Website in the sidebar to confirm the page looks correct to visitors.",
      target: tour.sidebarViewSite,
      route,
      placement: "right",
    });
  }

  return steps;
}

export function buildPageEditorGuide(mode: "create" | "edit"): CmsHelpGuide {
  const isCreate = mode === "create";
  return {
    id: isCreate ? "pages-create" : "pages-edit",
    group: "Pages",
    title: isCreate ? "Create a Page" : "Edit a Page",
    icon: isCreate ? "fa-solid fa-file-circle-plus" : "fa-solid fa-pen-to-square",
    summary: isCreate
      ? "Live walkthrough of the page builder — toolbar, Visual Builder, sidebar settings, and save."
      : "Live walkthrough while editing — switch pages, preview, Visual Builder panels, SEO, and save.",
    steps: buildSteps(mode),
  };
}
