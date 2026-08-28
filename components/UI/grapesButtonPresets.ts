import { CMS_ELEMENTS_CATEGORY, CMS_BUTTONS_CATEGORY, normalizeStudioCategory } from "./grapesStudio";
import { resolveBlockThumb } from "./grapesBlockThumbs";

export type CmsButtonStyle = "primary" | "outline" | "ghost" | "soft" | "gradient" | "dark" | "light" | "success" | "danger" | "glass";
export type CmsButtonShape = "rounded" | "pill" | "square";
export type CmsButtonSize = "sm" | "md" | "lg";
export type CmsButtonIcon = "none" | "arrow" | "plus" | "play" | "download" | "chevron";

type ButtonPreset = {
  id: string;
  label: string;
  category: string;
  text: string;
  href?: string;
  style: CmsButtonStyle;
  shape: CmsButtonShape;
  size: CmsButtonSize;
  icon: CmsButtonIcon;
};

const STYLE_OPTIONS = [
  { id: "primary", name: "Primary", label: "Primary" },
  { id: "outline", name: "Outline", label: "Outline" },
  { id: "ghost", name: "Ghost", label: "Ghost" },
  { id: "soft", name: "Soft", label: "Soft" },
  { id: "gradient", name: "Gradient", label: "Gradient" },
  { id: "dark", name: "Dark", label: "Dark" },
  { id: "light", name: "Light", label: "Light" },
  { id: "success", name: "Success", label: "Success" },
  { id: "danger", name: "Danger", label: "Danger" },
  { id: "glass", name: "Glass", label: "Glass" },
];

const SHAPE_OPTIONS = [
  { id: "rounded", name: "Rounded", label: "Rounded" },
  { id: "pill", name: "Pill", label: "Pill" },
  { id: "square", name: "Square", label: "Square" },
];

const SIZE_OPTIONS = [
  { id: "sm", name: "Small", label: "Small" },
  { id: "md", name: "Medium", label: "Medium" },
  { id: "lg", name: "Large", label: "Large" },
];

const ICON_OPTIONS = [
  { id: "none", name: "None", label: "None" },
  { id: "arrow", name: "Arrow", label: "Arrow" },
  { id: "chevron", name: "Chevron", label: "Chevron" },
  { id: "plus", name: "Plus", label: "Plus" },
  { id: "play", name: "Play", label: "Play" },
  { id: "download", name: "Download", label: "Download" },
];

export const CMS_BUTTON_STYLE_TRAITS = [
  {
    type: "select",
    name: "data-btn",
    label: "Style",
    options: STYLE_OPTIONS,
  },
  {
    type: "select",
    name: "data-btn-shape",
    label: "Shape",
    options: SHAPE_OPTIONS,
  },
  {
    type: "select",
    name: "data-btn-size",
    label: "Size",
    options: SIZE_OPTIONS,
  },
  {
    type: "select",
    name: "data-btn-icon",
    label: "Icon",
    options: ICON_OPTIONS,
  },
];

const BUTTON_PRESETS: ButtonPreset[] = [
  { id: "cms-el-button", label: "Button", category: CMS_ELEMENTS_CATEGORY, text: "Get started", style: "primary", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-outline", label: "Outline", category: CMS_BUTTONS_CATEGORY, text: "Learn more", style: "outline", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-ghost", label: "Ghost", category: CMS_BUTTONS_CATEGORY, text: "Learn more", style: "ghost", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-soft", label: "Soft", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "soft", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-gradient", label: "Gradient", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "gradient", shape: "pill", size: "md", icon: "none" },
  { id: "cms-btn-dark", label: "Dark", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "dark", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-light", label: "Light", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "light", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-success", label: "Success", category: CMS_BUTTONS_CATEGORY, text: "Confirm", style: "success", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-danger", label: "Danger", category: CMS_BUTTONS_CATEGORY, text: "Delete", style: "danger", shape: "rounded", size: "md", icon: "none" },
  { id: "cms-btn-glass", label: "Glass", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "glass", shape: "pill", size: "md", icon: "none" },
  { id: "cms-btn-pill", label: "Pill", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "primary", shape: "pill", size: "md", icon: "none" },
  { id: "cms-btn-square", label: "Square", category: CMS_BUTTONS_CATEGORY, text: "Shop now", style: "primary", shape: "square", size: "md", icon: "none" },
  { id: "cms-btn-small", label: "Small", category: CMS_BUTTONS_CATEGORY, text: "Small", style: "primary", shape: "rounded", size: "sm", icon: "none" },
  { id: "cms-btn-large", label: "Large", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "primary", shape: "rounded", size: "lg", icon: "none" },
  { id: "cms-btn-arrow", label: "Arrow", category: CMS_BUTTONS_CATEGORY, text: "Get started", style: "primary", shape: "pill", size: "md", icon: "arrow" },
  { id: "cms-btn-play", label: "Play", category: CMS_BUTTONS_CATEGORY, text: "Watch video", style: "dark", shape: "pill", size: "md", icon: "play" },
  { id: "cms-btn-download", label: "Download", category: CMS_BUTTONS_CATEGORY, text: "Download", style: "outline", shape: "rounded", size: "md", icon: "download" },
];

export function isCmsButtonComponent(component: any) {
  const attrs = component?.getAttributes?.() || {};
  const className = String(attrs.class || component?.getClasses?.()?.join?.(" ") || "");
  return /\bcms-btn\b/.test(className) || Boolean(attrs["data-btn"]);
}

export function renderCmsButtonHtml(preset: {
  text: string;
  href?: string;
  style?: CmsButtonStyle;
  shape?: CmsButtonShape;
  size?: CmsButtonSize;
  icon?: CmsButtonIcon;
}) {
  const href = preset.href || "#";
  const style = preset.style || "primary";
  const shape = preset.shape || "rounded";
  const size = preset.size || "md";
  const icon = preset.icon || "none";
  return `<a href="${href}" class="cms-btn" data-btn="${style}" data-btn-shape="${shape}" data-btn-size="${size}" data-btn-icon="${icon}">${preset.text}</a>`;
}

const upsertBlock = (editor: any, id: string, config: any) => {
  const bm = editor.BlockManager;
  const existing = bm.get(id);
  const nextAttributes = { ...(config?.attributes || {}) };
  const iconClass = nextAttributes.class;
  delete nextAttributes.class;
  const payload = {
    ...config,
    category: normalizeStudioCategory(config?.category) || config?.category,
    attributes: Object.keys(nextAttributes).length ? nextAttributes : undefined,
    media: config?.media || resolveBlockThumb(id, iconClass),
  };

  if (existing) {
    existing.set("label", payload.label);
    existing.set("content", payload.content);
    existing.set("category", payload.category);
    existing.set("media", payload.media);
    return;
  }

  bm.add(id, payload);
};

export function registerCmsButtonBlocks(editor: any) {
  BUTTON_PRESETS.forEach((preset) => {
    upsertBlock(editor, preset.id, {
      label: preset.label,
      category: preset.category,
      attributes: { class: "fa fa-square" },
      content: renderCmsButtonHtml(preset),
    });
  });

  upsertBlock(editor, "cms-btn-pair", {
    label: "Button pair",
    category: CMS_BUTTONS_CATEGORY,
    attributes: { class: "fa fa-square" },
    content: `<div class="cms-btn-row">${renderCmsButtonHtml({ text: "Get started", style: "primary", shape: "rounded", size: "md", icon: "none" })}${renderCmsButtonHtml({ text: "Learn more", style: "ghost", shape: "rounded", size: "md", icon: "none" })}</div>`,
  });
}

export function registerCmsButtonType(editor: any) {
  try {
    editor.DomComponents.addType("cms-button", {
      isComponent: (el: HTMLElement) => Boolean(el?.classList?.contains("cms-btn") || el?.getAttribute?.("data-btn")),
      model: {
        defaults: {
          tagName: "a",
          traits: [
            {
              type: "text",
              name: "href",
              label: "URL",
              placeholder: "/public/about-us",
            },
            {
              type: "select",
              name: "target",
              label: "Target",
              options: [
                { id: "", name: "Same tab", label: "Same tab" },
                { id: "_blank", name: "New tab", label: "New tab" },
              ],
            },
            ...CMS_BUTTON_STYLE_TRAITS,
          ],
        },
      },
    });
  } catch {
    // Keep native link/button parsing if the type cannot be registered.
  }
}
