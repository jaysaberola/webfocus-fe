const CATEGORY_ICONS: Record<string, string> = {
  BASIC: "fa-cube",
  FORMS: "fa-list-check",
  SECTIONS: "fa-table-cells-large",
  "CMS MEDIA": "fa-photo-film",
  "CMS UTILITY": "fa-toolbox",
  "WEBSITE TEMPLATES": "fa-globe",
  "CMS FORMS": "fa-envelope-open-text",
  "CONTACT US TEMPLATES": "fa-address-book",
  PRESETS: "fa-layer-group",
  ELEMENTS: "fa-shapes",
  BUTTONS: "fa-hand-pointer",
  LAYOUT: "fa-table-columns",
  "CMS BUSINESS": "fa-briefcase",
  "CMS COMMERCE": "fa-cart-shopping",
  "CMS BUTTONS": "fa-square-plus",
};

function normalizeCategoryKey(label: string) {
  return label.replace(/\s+/g, " ").trim().toUpperCase();
}

export function decorateStudioBlockCategories(panelRoot: HTMLElement | null) {
  if (!panelRoot) return;

  panelRoot.querySelectorAll(".gjs-block-category").forEach((categoryEl) => {
    const title = categoryEl.querySelector(".gjs-title") as HTMLElement | null;
    if (!title) return;

    const rawLabel = title.getAttribute("data-cms-cat-label") || title.textContent || "";
    const key = normalizeCategoryKey(rawLabel);
    if (!key) return;

    categoryEl.setAttribute("data-cms-category", key);

    if (title.querySelector(".cms-block-cat-icon")) {
      const countEl = title.querySelector(".cms-block-cat-count");
      const visibleBlocks = categoryEl.querySelectorAll(".gjs-block:not([style*='display: none'])").length;
      if (countEl) countEl.textContent = String(visibleBlocks);
      return;
    }

    const icon = CATEGORY_ICONS[key] || "fa-folder-open";
    const blocks = categoryEl.querySelectorAll(".gjs-block").length;
    const displayLabel = rawLabel.trim() || key;

    title.setAttribute("data-cms-cat-label", displayLabel);
    title.classList.add("cms-block-category-title");
    title.innerHTML = `
      <span class="cms-block-cat-icon" aria-hidden="true"><i class="fa-solid ${icon}"></i></span>
      <span class="cms-block-cat-label">${displayLabel}</span>
      <span class="cms-block-cat-count">${blocks}</span>
    `;
  });
}

export function decorateStudioStyleSectors(panelRoot: HTMLElement | null) {
  if (!panelRoot) return;

  panelRoot.querySelectorAll(".gjs-sm-sector").forEach((sectorEl) => {
    const title = sectorEl.querySelector(".gjs-sm-sector-title, .gjs-sm-title") as HTMLElement | null;
    if (!title || title.dataset.cmsDecorated === "1") return;
    title.dataset.cmsDecorated = "1";
    title.classList.add("cms-style-sector-title");
  });
}
