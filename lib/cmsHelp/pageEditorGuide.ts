import type { CmsHelpGuide, CmsHelpStep } from "@/lib/cmsHelp/types";
import { tour } from "@/lib/cmsHelp/tourSelectors";

function buildSteps(mode: "create" | "edit"): CmsHelpStep[] {
  const route = mode === "create" ? "/pages/create" : "/pages/edit";
  const isCreate = mode === "create";

  const steps: CmsHelpStep[] = [
    {
      title: "Visual Builder studio",
      body: "This fullscreen studio is where you design the page. The top bar holds page switching, devices, preview, save, and publish.",
      details: [
        "Use the back arrow to return to Manage Pages.",
        "Unsaved changes will ask you before you leave.",
      ],
      target: tour.grapesStudioBar,
      route,
      placement: "bottom",
      skipIfMissing: true,
    },
    {
      title: "Switch to another page",
      body: "Click the page name to open the list of other pages. Search, then click a page to jump there without going back to Manage Pages.",
      details: [
        "All pages — return to the full list.",
        "New page — start another page from scratch.",
        "You will be asked to confirm if this page has unsaved changes.",
      ],
      target: `${tour.grapesPageSwitcher}, ${tour.pageEditorPageSwitcher}`,
      route,
      placement: "bottom",
    },
    {
      title: "User guide",
      body: "Open the User guide anytime from this bar, or from Insert / Help. It walks through the studio, library, buttons, and settings.",
      details: ["You can also browse every CMS topic and download a presentation."],
      target: `${tour.grapesGuide}, ${tour.pageEditorGuide}`,
      route,
      placement: "bottom",
    },
    {
      title: "Saved vs unsaved",
      body: "Green Saved means the latest version is stored. Unsaved changes means you still need to click Save.",
      target: `${tour.pageEditorStatus}, ${tour.grapesStudioBar}`,
      route,
      placement: "bottom",
      skipIfMissing: true,
    },
    {
      title: "Library — Elements, Buttons, Layout, Sections",
      body: "The left panel is your block library. Drag a card onto the canvas to add it.",
      details: [
        "Elements — headings, text, images, and links.",
        "Buttons — Primary, Outline, Ghost, Gradient, and more presets.",
        "Layout — sections, columns, cards, and containers.",
        "Sections — ready-made heroes, features, and CTAs.",
        "Use search to filter the library quickly.",
      ],
      target: tour.grapesBlocks,
      route,
      placement: "right",
      skipIfMissing: true,
      tip: "If the panel is collapsed, click the grid icon on the left rail.",
    },
    {
      title: "Button styles",
      body: "Drop a button, then select it and open Settings to change Style, Shape, Size, and Icon. You can also pick a preset from the Buttons category.",
      details: [
        "Style — Primary, Outline, Ghost, Soft, Gradient, Dark, Light, Success, Danger, Glass.",
        "Shape — Rounded, Pill, or Square.",
        "Size — Small, Medium, or Large.",
        "Icon — Arrow, Play, Download, and more.",
        "Set the URL in Settings so the button links to the right page.",
      ],
      target: tour.grapesStyles,
      route,
      placement: "left",
      skipIfMissing: true,
    },
    {
      title: "Design canvas",
      body: "Drop blocks onto the page. Click an element to select it, then drag the move handle to reposition. Double-click text to edit.",
      details: [
        "Empty canvas — drop anywhere; sections stack at the bottom.",
        "Selected items show a blue outline and toolbar.",
        "Desktop / tablet / mobile icons preview responsive layouts.",
      ],
      target: tour.grapesCanvas,
      route,
      placement: "left",
      skipIfMissing: true,
    },
    {
      title: "Layers",
      body: "Layers lists every element in tree order. Use it to select nested items that are hard to click on the canvas.",
      details: ["Drag the four-way arrow in Layers to reorder."],
      target: tour.grapesLayersTab,
      route,
      placement: "right",
      skipIfMissing: true,
    },
    {
      title: "Styles, settings, and page settings",
      body: "With an element selected, Styles changes colors and spacing. Settings holds links, button look, and animation. The gear opens page title, visibility, and SEO.",
      details: [
        "Animation — fade, slide, zoom, and more on the selected block.",
        "Code (</>) — edit HTML and CSS when you need a precise change.",
      ],
      target: `${tour.grapesStyles}, ${tour.grapesSettings}`,
      route,
      placement: "left",
      skipIfMissing: true,
    },
    {
      title: "Save and Publish",
      body: isCreate
        ? "Add a page title in Page settings, then click Save. Publish makes the page visible to visitors."
        : "Click Save whenever you finish a round of edits. Publish updates the live site.",
      details: [
        isCreate ? "A page title is required before saving." : "Save often so you never lose work.",
        "Preview (eye) checks the design first. The external-link icon opens a new tab.",
      ],
      target: `${tour.grapesSave}, ${tour.pageEditorSave}`,
      route,
      placement: "left",
    },
    {
      title: "Classic TinyMCE toolbar",
      body: "If you switched to TinyMCE, this bar has save, preview, and page switching for the text editor.",
      target: tour.pageEditorToolbar,
      route,
      placement: "bottom",
      skipIfMissing: true,
    },
    {
      title: "Choose your editor",
      body: "Visual Builder is recommended for layout-heavy pages. TinyMCE is a classic rich-text editor for simpler content.",
      details: [
        "Visual Builder — drag blocks, sections, images, and columns.",
        "TinyMCE — type and format text like a word processor.",
        "Stick to one editor per page for best results.",
      ],
      target: tour.pageEditorToggle,
      route,
      placement: "bottom",
      skipIfMissing: true,
    },
    {
      title: "Page Details",
      body: "Set the page title, internal label, album, menu group, and published/private visibility here.",
      details: [
        "Page Title — public name and basis for the URL slug.",
        "Page Label — internal CMS name (not shown on the site).",
        "Published toggle — Private hides the page from visitors.",
      ],
      target: tour.pageEditorDetails,
      route,
      placement: "left",
      skipIfMissing: true,
    },
    {
      title: "SEO Settings",
      body: "Add a search-friendly title, description, and keywords for Google and social previews.",
      details: [
        "SEO Title — about 50–60 characters.",
        "SEO Description — about 150–160 characters.",
      ],
      target: tour.pageEditorSeo,
      route,
      placement: "left",
      skipIfMissing: true,
      tip: "Open Page settings (gear) if this panel is hidden in Visual Builder.",
    },
  ];

  if (!isCreate) {
    steps.push({
      title: "Preview and Live",
      body: "Preview opens a draft view. Live opens the public page as visitors see it when published.",
      target: tour.pageEditorActions,
      route,
      placement: "bottom",
      skipIfMissing: true,
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
      ? "Walkthrough of Visual Builder — page switcher, library, buttons, canvas, settings, and save."
      : "Walkthrough while editing — switch pages, button styles, layers, preview, SEO, and publish.",
    steps: buildSteps(mode),
  };
}
