import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import {
  getCanvas7PreviewBootstrap,
  getCanvas7StylesheetMarkup,
  htmlNeedsCanvas7Assets,
} from "@/lib/canvasTemplateCatalog";
import { prefetchSiteTemplateAssets } from "./grapesWebsiteTemplates";

type BuildContentFn = (editor: any) => string;

export function getComponentBreadcrumb(component: any): string {
  if (!component) return "";
  const parts: string[] = [];
  let current = component;
  let depth = 0;

  while (current && depth < 6) {
    const tag = String(current.get?.("tagName") || "div").toLowerCase();
    const name = String(current.getName?.() || "").trim();
    const type = String(current.get?.("type") || "").trim();
    const label = name || (type && type !== tag ? type : tag);
    parts.unshift(label);
    current = current.parent?.();
    depth += 1;
  }

  return parts.join(" › ");
}

function canvasHasVisibleContent(editor: any): boolean {
  try {
    const wrapperEl = editor.getWrapper?.()?.getEl?.() as HTMLElement | undefined;
    if (!wrapperEl) return false;
    const text = String(wrapperEl.innerText || "").replace(/\s+/g, "");
    if (text) return true;
    return Boolean(wrapperEl.querySelector("img, video, iframe, svg, canvas, input, textarea, button, table"));
  } catch {
    return false;
  }
}

function isPlaceholderStudioContent(editor: any) {
  try {
    const html = String(editor?.getHtml?.() || "");
    return /Design this page visually/i.test(html);
  } catch {
    return false;
  }
}

export function isEditorCanvasEmpty(editor: any): boolean {
  try {
    if (isPlaceholderStudioContent(editor)) return true;
    if (!canvasHasVisibleContent(editor)) return true;

    const wrapper = editor.getWrapper?.();
    const components = wrapper?.components?.();
    if (!components) return true;

    const models = components.models || [];
    if (!models.length) return true;

    if (models.length === 1) {
      const only = models[0];
      const html = String(only?.toHTML?.() || "").replace(/\s+/g, "");
      const isEmptyBody =
        String(only?.get?.("tagName") || "").toLowerCase() === "body" &&
        (!only.components?.()?.length || html === "<body></body>");
      if (isEmptyBody) return true;
    }

    const html = String(editor.getHtml?.() || "").replace(/\s+/g, "");
    return !html || html === "<body></body>";
  } catch {
    return false;
  }
}

function resolveDroppedRoot(component: any) {
  if (!component) return null;
  let root = component;
  if (Array.isArray(component)) root = component[0] || null;
  else if (component.models?.length) root = component.models[0] || null;
  if (!root) return null;
  if (isSiteTemplateRoot(root)) return root;
  const parent = root.parent?.();
  if (parent && isSiteTemplateRoot(parent)) return parent;
  const first = root.components?.()?.at?.(0) || root.components?.()?.models?.[0];
  if (first && isSiteTemplateRoot(first)) return first;
  return root;
}

const LAYOUT_STYLE_PROPS = ["position", "left", "top", "right", "bottom", "width", "max-width", "margin", "transform"];

const pendingCenterTimers = new Set<number>();

function cancelPendingCanvasCenters() {
  pendingCenterTimers.forEach((id) => window.clearTimeout(id));
  pendingCenterTimers.clear();
}

function toCssProp(prop: string) {
  return prop.includes("-") ? prop : prop.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function applyComponentLayout(el: HTMLElement | null | undefined, styles: Record<string, string>) {
  if (!el) return;
  Object.entries(styles).forEach(([prop, value]) => {
    el.style.setProperty(toCssProp(prop), value);
  });
}

/** GrapesJS dragger writes left/top without !important, so important locks freeze move. */
function unlockComponentLayout(component: any) {
  const el = component?.getEl?.() as HTMLElement | undefined;
  if (el) {
    LAYOUT_STYLE_PROPS.forEach((prop) => {
      const value = el.style.getPropertyValue(prop);
      if (!value) return;
      el.style.setProperty(prop, value);
    });
  }

  const style = component?.getStyle?.();
  if (!style || typeof style !== "object") return;

  const next: Record<string, string> = { ...style };
  let changed = false;
  LAYOUT_STYLE_PROPS.forEach((prop) => {
    const raw = String(next[prop] || "");
    if (!/!important/i.test(raw)) return;
    next[prop] = raw.replace(/\s*!important/gi, "").trim();
    changed = true;
  });
  if (changed) component.setStyle?.(next);
}

function isCompactCanvasElement(component: any) {
  const tag = String(component?.get?.("tagName") || "").toLowerCase();
  if (["a", "button", "span", "img", "svg", "i", "label", "strong", "em"].includes(tag)) return true;

  const attrs = component?.getAttributes?.() || {};
  const className = String(attrs.class || "");
  if (/\bcms-btn\b|\bcms-btn-row\b/.test(className) || Boolean(attrs["data-btn"])) return true;

  const html = String(component?.toHTML?.() || "").trim();
  return /^<(a|button)\b/i.test(html);
}

function isSiteTemplateRoot(component: any) {
  if (!component) return false;
  if (String(component.get?.("type") || "") === "cms-site-template") return true;
  const attrs = component.getAttributes?.() || {};
  if (String(attrs["data-cms-site-template"] || "") === "1") return true;
  return /data-cms-site-template/.test(String(component.toHTML?.() || ""));
}

function applyCanvas7Frame(editor: any) {
  try {
    const doc = editor?.Canvas?.getDocument?.() as Document | undefined;
    doc?.documentElement?.classList?.add("stretched");
    doc?.body?.classList?.add("stretched");
  } catch {
    // keep editing if the iframe document is not ready
  }
}

function replaceCanvasWithTemplate(editor: any, root: any) {
  const wrapper = editor.getWrapper?.();
  if (!wrapper || !root) return;
  const models = [...(wrapper.components?.()?.models || [])];
  models.forEach((model: any) => {
    if (model === root) return;
    try {
      model.remove?.();
    } catch {
      // keep the dropped template
    }
  });
  applyCanvas7Frame(editor);
}

function isStackedPageSection(component: any) {
  if (isSiteTemplateRoot(component)) return true;
  const tag = String(component?.get?.("tagName") || "").toLowerCase();
  if (["section", "header", "footer", "main", "nav"].includes(tag)) return true;

  const html = String(component?.toHTML?.() || "").trim().toLowerCase();
  if (/^<(section|header|footer|main|nav)\b/.test(html)) return true;

  const children = component?.components?.();
  const childCount = children?.length ?? children?.models?.length ?? 0;
  const first = children?.at?.(0) || children?.models?.[0];
  if (first && childCount === 1) {
    const childTag = String(first.get?.("tagName") || "").toLowerCase();
    if (["section", "header", "footer", "main", "nav"].includes(childTag)) return true;
  }

  const name = `${component?.getName?.() || ""} ${component?.get?.("name") || ""} ${component?.get?.("type") || ""}`;
  return /section|hero|footer|header|navbar|showcase|pricing|faq|testimonial|gallery|cta/i.test(name);
}

/** Grapes `Component.move` skips when `at === index + 1`; use `at + 1` when moving down. */
function grapesReorderAt(currentIndex: number, nextIndex: number) {
  if (nextIndex > currentIndex) return nextIndex + 1;
  return nextIndex;
}

function moveBlockToIndex(block: any, parent: any, currentIndex: number, nextIndex: number) {
  if (!block?.move || !parent || currentIndex < 0 || nextIndex === currentIndex) return;

  try {
    if (block.parent?.() !== parent) {
      block.move(parent, { at: grapesReorderAt(Math.max(0, currentIndex), nextIndex) });
      return;
    }
    block.move(parent, { at: grapesReorderAt(currentIndex, nextIndex) });
  } catch {
    // ignore reorder errors
  }
}

function moveRootOnWrapper(editor: any, root: any, nextIndex: number) {
  const wrapper = editor.getWrapper?.();
  if (!wrapper || !root) return;
  const collection = wrapper.components?.();
  const currentIndex = collectionIndexOf(collection, root);
  moveBlockToIndex(root, wrapper, currentIndex, nextIndex);
}

function appendSectionToPageBottom(editor: any, root: any) {
  const wrapper = editor.getWrapper?.();
  const lastIndex = Math.max(0, (wrapper?.components?.()?.length ?? 1) - 1);
  moveRootOnWrapper(editor, root, lastIndex);
}

function applyStackedFlowLayout(root: any, opts?: { fullWidth?: boolean }) {
  if (!root) return;
  const fullWidth = opts?.fullWidth ?? true;
  const nextStyle: Record<string, string> = {
    position: "relative",
    left: "auto",
    top: "auto",
    right: "auto",
    bottom: "auto",
    width: fullWidth ? "100%" : "auto",
    maxWidth: "100%",
    margin: "0",
    transform: "none",
  };

  if (typeof root.setStyle === "function") {
    const current = root.getStyle?.() || {};
    root.setStyle({ ...current, ...nextStyle });
  }
  root.addStyle?.(nextStyle);
  root.set?.("dmode", "");
  root.setDragMode?.("");
  applyComponentLayout(root.getEl?.(), nextStyle);
}

function pinSectionAtPageTop(editor: any, root: any) {
  moveRootOnWrapper(editor, root, 0);
}

function scrollCanvasToTop(editor: any) {
  try {
    const canvas = editor?.Canvas?.getElement?.() as HTMLElement | undefined;
    if (canvas) canvas.scrollTop = 0;
    const frame = editor?.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    const win = frame?.contentWindow;
    if (win) win.scrollTo?.(0, 0);
  } catch {
    // ignore iframe access errors
  }
}

type CanvasViewport = {
  scrollTop: number;
  scrollLeft: number;
  viewHeight: number;
};

function snapshotCanvasViewport(editor: any, override?: Partial<CanvasViewport>): CanvasViewport {
  const canvasEl = editor?.Canvas?.getElement?.() as HTMLElement | undefined;
  return {
    scrollTop: override?.scrollTop ?? canvasEl?.scrollTop ?? 0,
    scrollLeft: override?.scrollLeft ?? canvasEl?.scrollLeft ?? 0,
    viewHeight: override?.viewHeight ?? Math.max(canvasEl?.clientHeight || 0, 560),
  };
}

function restoreCanvasViewport(editor: any, viewport: CanvasViewport) {
  const canvasEl = editor?.Canvas?.getElement?.() as HTMLElement | undefined;
  if (!canvasEl) return;
  canvasEl.scrollTop = viewport.scrollTop;
  canvasEl.scrollLeft = viewport.scrollLeft;
}

function scrollCanvasToComponent(editor: any, root: any, viewport?: CanvasViewport) {
  try {
    const canvas = editor?.Canvas?.getElement?.() as HTMLElement | undefined;
    const el = root?.getEl?.() as HTMLElement | undefined;
    if (!canvas || !el) return;

    const canvasRect = canvas.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const pad = 24;
    if (elRect.top >= canvasRect.top + pad && elRect.bottom <= canvasRect.bottom - pad) {
      if (viewport) restoreCanvasViewport(editor, viewport);
      return;
    }

    const delta = elRect.top - canvasRect.top - pad;
    canvas.scrollTop = Math.max(0, canvas.scrollTop + delta);
  } catch {
    // ignore scroll errors
  }
}

/** Where to place a block: respect Grapes sorter index vs always append on page root. */
export type CanvasDropPlacement = "respect-sorter" | "append-root";

function normalizeStackedComponent(editor: any, component: any) {
  const root = resolveDroppedRoot(component);
  const wrapper = editor?.getWrapper?.();
  if (!root || !wrapper) return null;

  const parent = root.parent?.();
  const onPageRoot = !parent || parent === wrapper;
  applyStackedFlowLayout(root, { fullWidth: onPageRoot && !isCompactCanvasElement(root) });
  return root;
}

function toolbarFaIcon(className: string) {
  return `<i class="${className}" aria-hidden="true"></i>`;
}

const TOOLBAR_ARROW_DOWN_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M11,4H13V16L18.5,10.5L19.92,11.92L12,19.84L4.08,11.92L5.5,10.5L11,16V4Z" /></svg>';

function resolveEditorFromEm(em: any) {
  if (!em || em.destroyed) return null;
  const editor = em.Editor ?? em.get?.("Editor");
  if (!editor || editor.destroyed || typeof editor.getWrapper !== "function") return null;
  return editor;
}

function collectionIndexOf(collection: any, model: any) {
  if (!collection || !model) return -1;
  const models = collection.models || [];
  return models.indexOf(model);
}

/** Section row to reorder and the sibling list it belongs to (wrapper or inner container). */
function findSectionListParent(component: any, editor: any) {
  const wrapper = editor?.getWrapper?.();
  if (!wrapper || !component) return null;

  let wrapperChild = component;
  while (wrapperChild?.parent?.() && wrapperChild.parent() !== wrapper) {
    wrapperChild = wrapperChild.parent();
  }

  if (wrapperChild?.parent?.() === wrapper) {
    const wrapperCollection = wrapper.components?.();
    const wrapperCount = wrapperCollection?.length ?? 0;
    if (wrapperCount > 1) {
      return { block: wrapperChild, parent: wrapper, collection: wrapperCollection };
    }
  }

  const wrapperKids = wrapper.components?.()?.models || [];
  if (wrapperKids.length === 1) {
    const container = wrapperKids[0];
    const innerCollection = container.components?.();
    const innerCount = innerCollection?.length ?? 0;
    if (innerCount > 1) {
      let innerBlock = component;
      while (innerBlock?.parent?.() && innerBlock.parent() !== container) {
        innerBlock = innerBlock.parent();
      }
      if (innerBlock?.parent?.() === container) {
        return { block: innerBlock, parent: container, collection: innerCollection };
      }
    }
  }

  if (wrapperChild?.parent?.() === wrapper) {
    const wrapperCollection = wrapper.components?.();
    return { block: wrapperChild, parent: wrapper, collection: wrapperCollection };
  }

  return null;
}

function resolveReorderContext(component: any, editor: any) {
  const list = findSectionListParent(component, editor);
  if (list) {
    const { block, parent, collection } = list;
    const count = collection?.length ?? 0;
    const index = collectionIndexOf(collection, block);
    if (index < 0) return null;
    return { block, parent, index, count };
  }

  const parent = component?.parent?.();
  const collection = parent?.components?.();
  if (!parent || !collection) return null;
  const count = collection.length ?? 0;
  const index = collectionIndexOf(collection, component);
  if (index < 0 || count <= 1) return null;
  return { block: component, parent, index, count };
}

function movePageBlock(editor: any, component: any, direction: number) {
  const ed = resolveEditorFromEm(editor?.getModel?.()) ?? resolveEditorFromEm(component?.em) ?? editor;
  if (!ed || ed.destroyed || !component) return;
  editor = ed;

  const context = resolveReorderContext(component, editor);
  if (!context) return;

  const { block, parent, index, count } = context;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= count || nextIndex === index) return;

  try {
    block.set?.({ draggable: true, droppable: true });

    const onCanvasRoot = parent === editor.getWrapper?.();
    moveBlockToIndex(block, parent, index, nextIndex);

    applyStackedFlowLayout(block, { fullWidth: onCanvasRoot });
    normalizeStackedComponent(editor, block);
    unlockCanvasPageScroll(editor);
    editor.select?.(block);
    editor.trigger?.("update");
    refreshStudioComponentToolbars(editor);
  } catch {
    // ignore reorder errors during teardown
  }
}

function buildStudioComponentToolbar(component: any, em: any, editor: any) {
  const ppfx = (em && em.getConfig()?.stylePrefix) || "gjs-";
  const tb: any[] = [];
  const ed = resolveEditorFromEm(em) ?? (editor && !editor.destroyed ? editor : null);
  const draggable = component.get?.("draggable") !== false;
  const reorderCtx = ed ? resolveReorderContext(component, ed) : null;
  const showStackArrows = draggable && Boolean(reorderCtx && reorderCtx.count > 1);

  if (showStackArrows) {
    tb.push({
      id: "move-up",
      label: em.getIcon?.("arrowUp") || toolbarFaIcon("fa-solid fa-arrow-up"),
      attributes: { title: "Move section up", class: `${ppfx}no-touch-actions` },
      command: (ed: any) => movePageBlock(ed, component, -1),
    });
    tb.push({
      id: "move-down",
      label: TOOLBAR_ARROW_DOWN_SVG,
      attributes: { title: "Move section down", class: `${ppfx}no-touch-actions` },
      command: (ed: any) => movePageBlock(ed, component, 1),
    });
  } else if (component.collection) {
    tb.push({
      label: em.getIcon("arrowUp"),
      attributes: { title: "Select parent" },
      command: (ed: any) => ed.runCommand("core:component-exit", { force: 1 }),
    });
  }

  if (component.get?.("draggable") !== false) {
    tb.push({
      attributes: { class: `${ppfx}no-touch-actions`, draggable: true, title: "Drag to reorder" },
      label: em.getIcon("move"),
      command: "tlb-move",
    });
  }
  if (component.get?.("copyable") !== false) {
    tb.push({
      label: em.getIcon("copy"),
      attributes: { title: "Duplicate" },
      command: "tlb-clone",
    });
  }
  if (component.get?.("removable") !== false) {
    tb.push({
      label: em.getIcon("delete"),
      attributes: { title: "Delete" },
      command: "tlb-delete",
    });
  }

  return tb;
}

function grapesParserReady(editor: any): boolean {
  if (!editor || editor.destroyed) return false;
  const em = editor.getModel?.();
  if (!em || em.destroyed) return false;
  const parser = em?.Parser ?? editor.Parser;
  if (typeof parser?.parseHtml !== "function") return false;
  if (typeof em.Selectors?.getAll !== "function") return false;
  if (typeof em.Css?.getAll !== "function") return false;
  return true;
}

export function refreshStudioComponentToolbars(editor: any) {
  if (!editor || editor.destroyed || typeof editor.getWrapper !== "function") return;
  const wrapper = editor.getWrapper?.();
  if (!wrapper) return;

  const refreshTreeToolbars = (component: any) => {
    if (!component?.set) return;
    component.set("toolbar", null);
    component.initToolbar?.();
    const children = component.components?.()?.models || [];
    children.forEach(refreshTreeToolbars);
  };

  refreshTreeToolbars(wrapper);
  const selected = editor.getSelected?.();
  if (selected) {
    editor.trigger?.("component:toggled", selected);
  }
}

function installStudioComponentToolbar(editor: any) {
  const patchInitToolbar = () => {
    try {
      const defType = editor.DomComponents?.getType?.("default");
      const prototype = defType?.model?.prototype;
      if (!prototype) return;
      prototype.initToolbar = function initCmsStudioToolbar(this: any) {
        const em = this.em;
        if (this.get("toolbar") || !em) return;
        const ed = resolveEditorFromEm(em);
        if (!ed) return;
        this.set("toolbar", buildStudioComponentToolbar(this, em, ed));
      };
    } catch {
      // ignore toolbar patch errors
    }
  };

  const refreshSelectedToolbar = (component: any) => {
    if (!component?.set || !resolveEditorFromEm(component?.em)) return;
    component.set("toolbar", null);
    component.initToolbar?.();
  };

  patchInitToolbar();
  editor.on("load", () => {
    patchInitToolbar();
    let attempts = 0;
    const refreshWhenReady = () => {
      if (resolveEditorFromEm(editor.getModel?.())) {
        refreshStudioComponentToolbars(editor);
        return;
      }
      if (attempts < 60) {
        attempts += 1;
        window.requestAnimationFrame(refreshWhenReady);
      }
    };
    window.requestAnimationFrame(refreshWhenReady);
  });
  editor.on("component:selected", refreshSelectedToolbar);
  const onComponentAdded = (component: any) => {
    window.requestAnimationFrame(() => refreshSelectedToolbar(component));
  };

  editor.on("component:add", onComponentAdded);
  editor.on("destroy", () => {
    editor.off("component:selected", refreshSelectedToolbar);
    editor.off("component:add", onComponentAdded);
  });
}

/**
 * After a drop, keep blocks in normal document flow (stacked), not absolute overlap.
 */
export function centerComponentOnCanvas(
  editor: any,
  component: any,
  viewport?: CanvasViewport,
  placement: CanvasDropPlacement = "append-root",
) {
  const root = resolveDroppedRoot(component);
  if (!editor || !root) return;
  const frozen = viewport || snapshotCanvasViewport(editor);
  const respectSorter = placement === "respect-sorter";

  try {
    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;

    if (isStackedPageSection(root)) {
      const siteTemplate = isSiteTemplateRoot(root);
      const siblingCount = Math.max(0, (wrapper.components?.()?.length ?? 1) - 1);
      const emptyPage = siblingCount <= 0 || isPlaceholderStudioContent(editor);

      if (siteTemplate || emptyPage) {
        replaceCanvasWithTemplate(editor, root);
        pinSectionAtPageTop(editor, root);
      } else if (!respectSorter) {
        appendSectionToPageBottom(editor, root);
      }

      applyStackedFlowLayout(root, { fullWidth: true });
      editor.select?.(root);
      if (siteTemplate || emptyPage) {
        restoreCanvasViewport(editor, { ...frozen, scrollTop: 0 });
        scrollCanvasToTop(editor);
      } else {
        restoreCanvasViewport(editor, frozen);
        scrollCanvasToComponent(editor, root, frozen);
      }
      return;
    }

    const parent = root.parent?.();
    const onPageRoot = !parent || parent === wrapper;

    if (onPageRoot && !respectSorter) {
      appendSectionToPageBottom(editor, root);
    }

    applyStackedFlowLayout(root, { fullWidth: onPageRoot && !isCompactCanvasElement(root) });

    editor.select?.(root);
    restoreCanvasViewport(editor, frozen);
    scrollCanvasToComponent(editor, root, frozen);
  } catch {
    // ignore layout errors
  }
}

/** Re-apply stacked layout so Grapes drop coords cannot restore absolute positioning. */
export function scheduleCenterComponentOnCanvas(
  editor: any,
  component: any,
  viewport?: CanvasViewport,
  placement: CanvasDropPlacement = "append-root",
) {
  if (!editor || !component) return;
  const frozen = viewport || snapshotCanvasViewport(editor);
  cancelPendingCanvasCenters();
  [0, 48].forEach((ms) => {
    const id = window.setTimeout(() => {
      pendingCenterTimers.delete(id);
      centerComponentOnCanvas(editor, component, frozen, placement);
    }, ms);
    pendingCenterTimers.add(id);
  });
}

export function filterBlockPanel(root: HTMLElement | null, query: string) {
  if (!root) return;

  const normalized = query.trim().toLowerCase();
  root.querySelectorAll(".gjs-block-category").forEach((categoryEl) => {
    const category = categoryEl as HTMLElement;
    let visibleCount = 0;

    category.querySelectorAll(".gjs-block").forEach((blockEl) => {
      const block = blockEl as HTMLElement;
      const label = String(block.querySelector(".gjs-block-label")?.textContent || block.getAttribute("title") || "")
        .trim()
        .toLowerCase();
      const match = !normalized || label.includes(normalized);
      block.style.display = match ? "" : "none";
      if (match) visibleCount += 1;
    });

    category.style.display = visibleCount > 0 ? "" : "none";
    if (normalized && visibleCount > 0) category.classList.add("gjs-open");
    else if (!normalized) category.classList.remove("gjs-open");
  });
}

export const CMS_ANIMATION_TRAIT = {
  type: "select",
  name: "data-anim",
  label: "Animation",
  options: [
    { id: "", name: "None" },
    { id: "fade", name: "Fade in" },
    { id: "slide", name: "Slide up" },
    { id: "slide-left", name: "Slide left" },
    { id: "zoom", name: "Zoom in" },
    { id: "scale", name: "Scale in" },
    { id: "bounce", name: "Bounce in" },
  ],
};

export function ensureComponentAnimationTrait(component: any) {
  if (!component?.get || component.is?.("wrapper")) return;

  const traits = component.get("traits");
  const models = traits?.models || (Array.isArray(traits) ? traits : []);
  const hasAnimation = models.some((trait: any) => {
    const name = typeof trait === "string" ? trait : trait?.get?.("name") || trait?.name;
    return name === "data-anim";
  });
  if (hasAnimation) return;

  try {
    component.addTrait?.(CMS_ANIMATION_TRAIT);
  } catch {
    const next = models.concat([CMS_ANIMATION_TRAIT]);
    component.set?.("traits", next);
  }
}

function snapshotCanvasImageUrls(editor: any): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const doc = editor?.Canvas?.getDocument?.() as Document | undefined;
    if (!doc) return map;

    doc.querySelectorAll("img").forEach((node) => {
      const img = node as HTMLImageElement;
      const attr = String(img.getAttribute("src") || "").trim();
      const resolved = String(img.currentSrc || img.src || "").trim();
      let replacement = resolved || attr;
      try {
        if (img.naturalWidth > 0) {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          replacement = canvas.toDataURL();
        }
      } catch {
        // Cross-origin images stay on their resolved URL.
      }
      if (attr && replacement) map.set(attr, replacement);
      if (resolved && replacement) map.set(resolved, replacement);
    });
  } catch {
    // ignore canvas snapshot errors
  }
  return map;
}

function rewritePreviewAssetUrl(raw: string, origin: string, imageMap: Map<string, string>): string {
  const value = String(raw || "").trim();
  if (!value) return value;
  if (imageMap.has(value)) return imageMap.get(value) || value;
  if (/^(data:|blob:|mailto:|tel:|javascript:|#)/i.test(value)) return value;

  if (value.includes("storage/")) {
    const storageUrl = resolveStorageAssetUrl(value);
    if (storageUrl) return storageUrl;
  }

  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("//")) return `${window.location.protocol}${value}`;

  try {
    return new URL(value.replace(/^\.\//, ""), `${origin}/`).toString();
  } catch {
    return value;
  }
}

function rewritePreviewAssets(markup: string, origin: string, imageMap: Map<string, string>): string {
  return markup
    .replace(/\s(src|poster|data-src)=(["'])([^"']*)\2/gi, (_full, attr: string, quote: string, url: string) => {
      return ` ${attr}=${quote}${rewritePreviewAssetUrl(url, origin, imageMap)}${quote}`;
    })
    .replace(/\ssrcset=(["'])([^"']*)\1/gi, (_full, quote: string, value: string) => {
      const next = value
        .split(",")
        .map((part) => {
          const trimmed = part.trim();
          const match = trimmed.match(/^(\S+)(\s+.*)?$/);
          if (!match) return trimmed;
          return `${rewritePreviewAssetUrl(match[1], origin, imageMap)}${match[2] || ""}`;
        })
        .join(", ");
      return ` srcset=${quote}${next}${quote}`;
    })
    .replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (_full, quote: string, url: string) => {
      return `url(${quote}${rewritePreviewAssetUrl(url, origin, imageMap)}${quote})`;
    });
}

export function registerStudioEditorFeatures(editor: any, buildContent: BuildContentFn) {
  const getSelected = () => editor.getSelected?.();

  const duplicateSelected = () => {
    const selected = getSelected();
    if (!selected || selected.get?.("removable") === false) return;
    const parent = selected.parent?.();
    if (!parent?.components) return;
    const collection = parent.components();
    const index = collection.indexOf(selected);
    const clone = selected.clone?.();
    if (!clone) return;
    collection.add(clone, { at: index + 1 });
    editor.select(clone);
  };

  const deleteSelected = () => {
    const selected = getSelected();
    if (!selected || selected.get?.("removable") === false) return;
    selected.remove?.();
    editor.select(null);
  };

  const moveSelected = (direction: number) => {
    const selected = getSelected();
    if (!selected) return;
    movePageBlock(editor, selected, direction);
  };

  let copiedStyle: Record<string, string> | null = null;

  const groupSelected = () => {
    const selectedAll = editor.getSelectedAll?.() || [getSelected()].filter(Boolean);
    const models = (Array.isArray(selectedAll) ? selectedAll : [selectedAll]).filter(Boolean);
    if (!models.length) return;
    const parent = models[0].parent?.();
    if (!parent?.append) return;
    const at = parent.components?.()?.indexOf?.(models[0]) ?? 0;
    const wrapperArr = parent.append(
      { tagName: "div", attributes: { class: "cms-group" }, style: { position: "relative", display: "block" } },
      { at },
    );
    const wrapper = Array.isArray(wrapperArr) ? wrapperArr[0] : wrapperArr;
    models.forEach((model: any) => wrapper?.append?.(model));
    editor.select?.(wrapper);
  };

  const ungroupSelected = () => {
    const selected = getSelected();
    if (!selected) return;
    const parent = selected.parent?.();
    const children = selected.components?.()?.models?.slice?.() || [];
    if (!parent || !children.length) return;
    const at = parent.components?.()?.indexOf?.(selected) ?? 0;
    children.forEach((child: any, index: number) => parent.append?.(child, { at: at + index }));
    selected.remove?.();
  };

  const toggleLocked = (locked: boolean) => {
    const selected = getSelected();
    if (!selected) return;
    selected.set?.({ locked, selectable: !locked, hoverable: !locked, draggable: !locked });
  };

  const toggleHidden = (hidden: boolean) => {
    const selected = getSelected();
    if (!selected) return;
    selected.addStyle?.({ display: hidden ? "none" : "block" });
    selected.set?.({ hidden });
  };

  const renameSelected = () => {
    const selected = getSelected();
    if (!selected) return;
    const current = String(selected.getName?.() || selected.get?.("name") || "");
    const next = window.prompt("Element name", current);
    if (next == null) return;
    selected.set?.({ name: next.trim() || current });
  };

  const copyStyle = () => {
    const selected = getSelected();
    if (!selected) return;
    copiedStyle = { ...(selected.getStyle?.() || {}) };
  };

  const pasteStyle = () => {
    const selected = getSelected();
    if (!selected || !copiedStyle) return;
    selected.setStyle?.({ ...(selected.getStyle?.() || {}), ...copiedStyle });
  };

  const alignOnCanvas = (align: "left" | "center" | "right" | "top" | "middle" | "bottom") => {
    const selected = getSelected();
    const el = selected?.getEl?.() as HTMLElement | undefined;
    const frame = editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    const body = frame?.contentDocument?.body as HTMLElement | undefined;
    if (!selected || !el || !body) return;
    const pageW = body.clientWidth || 960;
    const pageH = Math.max(body.scrollHeight, body.clientHeight, 640);
    const style: Record<string, string> = { position: "absolute" };
    if (align === "left") style.left = "24px";
    if (align === "right") style.left = `${Math.max(24, pageW - el.offsetWidth - 24)}px`;
    if (align === "center") style.left = `${Math.max(0, Math.round((pageW - el.offsetWidth) / 2))}px`;
    if (align === "top") style.top = "24px";
    if (align === "bottom") style.top = `${Math.max(24, pageH - el.offsetHeight - 24)}px`;
    if (align === "middle") style.top = `${Math.max(0, Math.round((pageH - el.offsetHeight) / 2))}px`;
    selected.addStyle?.(style);
  };

  const previewPage = () => {
    const packed = String(buildContent(editor) || "");
    let rawHtml = String(editor.getHtml?.() || packed).trim();
    try {
      const painted = editor.Canvas?.getDocument?.()?.querySelector?.("[data-cms-site-template]") as HTMLElement | null;
      if (painted?.outerHTML) rawHtml = painted.outerHTML;
    } catch {
      // keep Grapes HTML if the canvas document is not ready
    }
    const rawCss = String(editor.getCss?.() || "");
    const scriptMatch = packed.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
    const js = String(scriptMatch?.[1] || "").trim();
    const origin = window.location.origin;
    const imageMap = snapshotCanvasImageUrls(editor);
    const html = rewritePreviewAssets(rawHtml, origin, imageMap);
    const css = rewritePreviewAssets(rawCss, origin, imageMap);
    const usesCanvas7 = htmlNeedsCanvas7Assets(html);
    const canvas7Links = usesCanvas7 ? getCanvas7StylesheetMarkup() : "";
    const canvas7Boot = usesCanvas7 ? getCanvas7PreviewBootstrap() : "";
    const documentHtml = `<!DOCTYPE html>
<html lang="en"${usesCanvas7 ? ' class="stretched"' : ""}>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${origin}/">
  <title>Page Preview</title>
  <link rel="stylesheet" href="${origin}/css/cms-studio-buttons.css">
  <style>
    html, body { margin: 0; }
    ${usesCanvas7 ? "" : `html, body { background: #fff; color: #0f172a; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
    img, video, iframe { max-width: 100%; height: auto; }`}
    ${css}
  </style>
  ${canvas7Links}
</head>
<body${usesCanvas7 ? ' class="stretched"' : ""}>
${canvas7Boot}
${html || "<p style=\"padding:24px;color:#64748b;\">This page is empty.</p>"}
${js ? `<script>${js.replace(/<\/script/gi, "<\\/script")}</script>` : ""}
</body>
</html>`;

    const openPreviewWindow = () => {
      const blob = new Blob([documentHtml], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const previewWindow = window.open(url, "_blank");
      if (previewWindow) {
        previewWindow.focus();
        window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        return true;
      }
      URL.revokeObjectURL(url);
      return false;
    };

    if (openPreviewWindow()) return;

    const fallbackWindow = window.open("about:blank", "_blank");
    if (!fallbackWindow) {
      window.alert("Allow pop-ups to preview your page.");
      return;
    }
    fallbackWindow.document.open();
    fallbackWindow.document.write(documentHtml);
    fallbackWindow.document.close();
    fallbackWindow.focus();
  };

  const fitCanvas = () => {
    try {
      editor.Canvas?.fitViewport?.({ ignoreHeight: true, gap: 0, zoom: 100 });
    } catch {
      // ignore
    }
  };

  const adjustZoom = (delta: number) => {
    try {
      const canvas = editor.Canvas;
      const current = Number(canvas?.getZoom?.() || 100);
      const next = Math.max(40, Math.min(160, current + delta));
      if (next === current) return;
      canvas?.fitViewport?.({ ignoreHeight: true, gap: 0, zoom: next });
    } catch {
      // ignore
    }
  };

  const insertBlock = (blockId: string) => {
    const block = editor.BlockManager?.get?.(blockId);
    if (!block) return;
    const content = block.get?.("content");
    if (!content) return;
    const wrapper = editor.getWrapper?.();
    const added = wrapper?.append?.(content);
    const models = Array.isArray(added) ? added : added ? [added] : [];
    models.forEach((model: any) => scheduleCenterComponentOnCanvas(editor, model));
    if (!models.length) {
      const last = wrapper?.components?.()?.last?.();
      if (last) scheduleCenterComponentOnCanvas(editor, last);
    }
    editor.trigger?.("update");
  };

  const commands: Array<{ id: string; run: () => void }> = [
    { id: "cms:duplicate", run: duplicateSelected },
    { id: "cms:delete", run: deleteSelected },
    { id: "cms:move-up", run: () => moveSelected(-1) },
    { id: "cms:move-down", run: () => moveSelected(1) },
    { id: "cms:bring-front", run: () => moveSelected(999) },
    { id: "cms:send-back", run: () => moveSelected(-999) },
    { id: "cms:group", run: groupSelected },
    { id: "cms:ungroup", run: ungroupSelected },
    { id: "cms:lock", run: () => toggleLocked(true) },
    { id: "cms:unlock", run: () => toggleLocked(false) },
    { id: "cms:hide", run: () => toggleHidden(true) },
    { id: "cms:show", run: () => toggleHidden(false) },
    { id: "cms:rename", run: renameSelected },
    { id: "cms:copy-style", run: copyStyle },
    { id: "cms:paste-style", run: pasteStyle },
    { id: "cms:align-left", run: () => alignOnCanvas("left") },
    { id: "cms:align-center", run: () => alignOnCanvas("center") },
    { id: "cms:align-right", run: () => alignOnCanvas("right") },
    { id: "cms:align-top", run: () => alignOnCanvas("top") },
    { id: "cms:align-middle", run: () => alignOnCanvas("middle") },
    { id: "cms:align-bottom", run: () => alignOnCanvas("bottom") },
    { id: "cms:preview-page", run: previewPage },
    { id: "cms:canvas-fit", run: fitCanvas },
    { id: "cms:canvas-zoom-in", run: () => adjustZoom(10) },
    { id: "cms:canvas-zoom-out", run: () => adjustZoom(-10) },
    { id: "cms:insert-hero", run: () => insertBlock("cms-hero") },
    { id: "cms:open-blocks", run: () => editor.trigger?.("cms:open-blocks") },
  ];

  commands.forEach(({ id, run }) => {
    const def = {
      run() {
        run();
      },
      stop() {},
    };
    if (editor.Commands.has(id)) {
      editor.Commands.extend(id, def);
    } else {
      editor.Commands.add(id, def);
    }
  });

  const keymaps = [
    { keys: "ctrl+z", cmd: "core:undo" },
    { keys: "ctrl+y", cmd: "core:redo" },
    { keys: "ctrl+shift+z", cmd: "core:redo" },
    { keys: "ctrl+d", cmd: "cms:duplicate" },
    { keys: "ctrl+c", cmd: "core:copy" },
    { keys: "ctrl+v", cmd: "core:paste" },
    { keys: "delete", cmd: "cms:delete" },
    { keys: "backspace", cmd: "cms:delete" },
    { keys: "ctrl+shift+p", cmd: "cms:preview-page" },
  ];

  keymaps.forEach(({ keys, cmd }) => {
    if (editor.Keymaps?.get?.(keys)) return;
    editor.Keymaps?.add?.(keys, cmd);
  });

  installStudioComponentToolbar(editor);

  ["section", "header", "footer"].forEach((type) => {
    try {
      editor.DomComponents?.addType?.(type, {
        isComponent: (el: HTMLElement) => el?.tagName?.toLowerCase() === type,
        model: {
          defaults: {
            tagName: type,
            traits: ["id", "title", CMS_ANIMATION_TRAIT],
          },
        },
      });
    } catch {
      // type may already exist
    }
  });
}

export function installStudioContextMenu(editor: any) {
  const hideMenu = () => {
    document.querySelectorAll(".cms-grapes-context-menu").forEach((node) => node.remove());
  };

  const run = (command: string) => {
    hideMenu();
    try {
      editor.runCommand?.(command);
    } catch {
      // command may not exist in this Grapes version
    }
  };

  const onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    hideMenu();
    const selected = editor.getSelected?.();
    if (!selected) return;

    const menu = document.createElement("div");
    menu.className = "cms-grapes-context-menu";
    menu.style.left = `${event.clientX}px`;
    menu.style.top = `${event.clientY}px`;

    const actions: Array<{ label: string; command: string }> = [
      { label: "Duplicate", command: "cms:duplicate" },
      { label: "Copy", command: "core:copy" },
      { label: "Paste", command: "core:paste" },
      { label: "Rename", command: "cms:rename" },
      { label: "Group", command: "cms:group" },
      { label: "Ungroup", command: "cms:ungroup" },
      { label: "Bring Forward", command: "cms:move-up" },
      { label: "Send Backward", command: "cms:move-down" },
      { label: "Bring to Front", command: "cms:bring-front" },
      { label: "Send to Back", command: "cms:send-back" },
      { label: "Copy Style", command: "cms:copy-style" },
      { label: "Paste Style", command: "cms:paste-style" },
      { label: "Lock", command: "cms:lock" },
      { label: "Hide", command: "cms:hide" },
      { label: "Delete", command: "cms:delete" },
    ];

    actions.forEach((action) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = action.label;
      button.addEventListener("click", () => run(action.command));
      menu.appendChild(button);
    });

    document.body.appendChild(menu);
  };

  const frame = editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
  const doc = frame?.contentDocument;
  doc?.addEventListener("contextmenu", onContextMenu);
  document.addEventListener("click", hideMenu);

  editor.on("destroy", () => {
    hideMenu();
    doc?.removeEventListener("contextmenu", onContextMenu);
    document.removeEventListener("click", hideMenu);
  });
}

function disableGrapesAutoscroll(editor: any) {
  if (!editor) return;
  const noop = () => {};
  const patch = () => {
    try {
      const canvas = editor.Canvas;
      if (canvas) {
        canvas.startAutoscroll = noop;
        canvas.stopAutoscroll = noop;
      }
      const current = editor.em?.getCurrentFrame?.() || canvas?.getFrame?.();
      if (current) {
        current.startAutoscroll = noop;
        current.stopAutoscroll = noop;
        current.autoScroller?.stop?.();
      }
      const frames = canvas?.getFrames?.();
      const list = frames?.models || frames || [];
      (Array.isArray(list) ? list : []).forEach((frame: any) => {
        const view = frame?.view || frame;
        view.startAutoscroll = noop;
        view.stopAutoscroll = noop;
        view.autoScroller?.stop?.();
      });
    } catch {
      // ignore patch errors
    }
  };

  patch();
  if (editor.__cmsAutoscrollDisabled) return;
  editor.__cmsAutoscrollDisabled = true;
  editor.on("canvas:frame:load", patch);
  editor.on("canvas:frame:load:body", patch);
}

const PAGE_BOTTOM_PAD = 280;
const DRAG_EDGE = 64;
const DRAG_SCROLL_SPEED = 16;

function pinViewportHeightUnits(root: HTMLElement | null, viewportHeight: number) {
  if (!root || viewportHeight < 200) return;
  const nodes = Array.from(root.querySelectorAll("[class*='vh'], [style*='vh']")) as HTMLElement[];
  nodes.forEach((node) => {
    const cls = String(node.className || "");
    const style = String(node.getAttribute("style") || "");
    const classPcts = [...cls.matchAll(/\b(?:min-)?vh(?:-md|-sm|-lg)?-(\d+)\b/g)].map((match) => Number(match[1]));
    const stylePct = style.match(/min-height\s*:\s*([\d.]+)vh/i);
    const pct = Math.max(0, ...classPcts, stylePct ? Number(stylePct[1]) : 0);
    if (!pct) return;
    node.style.setProperty("min-height", `${Math.round((viewportHeight * pct) / 100)}px`, "important");
  });
}

function collapseEmptyStretchElements(root: HTMLElement | null, canvasHeight: number) {
  if (!root) return;
  const nodes = Array.from(root.querySelectorAll("main, section, header, footer, article, div")) as HTMLElement[];
  nodes.forEach((node) => {
    const text = String(node.innerText || "").replace(/\s+/g, "");
    const hasMedia = node.querySelector("img, video, iframe, svg, canvas, input, textarea, button, table");
    if (node.hasAttribute("data-cms-site-template")) return;
    if (text || hasMedia) return;
    const inlineMin = `${node.style.minHeight || node.getAttribute("style") || ""}`.toLowerCase();
    const stretched = inlineMin.includes("vh") || node.offsetHeight > Math.max(400, canvasHeight * 0.6);
    if (!stretched) return;
    node.style.setProperty("min-height", "0px", "important");
    node.style.setProperty("height", "auto", "important");
  });
}

export function unlockCanvasPageScroll(editor: any) {
  try {
    if (!editor || editor.destroyed || typeof editor.Parser?.parseHtml !== "function") return;
    disableGrapesAutoscroll(editor);
    const frame = editor?.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    const canvas = editor?.Canvas?.getElement?.() as HTMLElement | undefined;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow;
    const html = doc?.documentElement;
    const body = doc?.body;
    if (!frame || !canvas || !doc || !win || !html || !body) return;

    if (doc.querySelector("[data-cms-site-template]")) {
      applyCanvas7Frame(editor);
    }

    const wrapper = (
      body.matches?.('[data-gjs-type="wrapper"]')
        ? body
        : body.querySelector('[data-gjs-type="wrapper"]')
    ) as HTMLElement | null;

    const applyArtboardFill = (artboardPx: number) => {
      const fillPx = Math.max(0, Math.round(artboardPx));
      const fill = `${fillPx}px`;
      html.style.setProperty("overflow", "visible", "important");
      html.style.setProperty("height", fill, "important");
      html.style.setProperty("min-height", fill, "important");
      body.style.setProperty("height", "auto", "important");
      body.style.setProperty("min-height", fill, "important");
      body.style.setProperty("overflow", "visible", "important");
      body.style.setProperty("padding-bottom", "0", "important");
      wrapper?.style.setProperty("height", "auto", "important");
      wrapper?.style.setProperty("min-height", fill, "important");
      wrapper?.style.setProperty("overflow", "visible", "important");
      wrapper?.style.setProperty("padding-bottom", `${PAGE_BOTTOM_PAD}px`, "important");
    };

    const measureContentHeight = () => {
      const source = wrapper || body;
      const minCanvas = canvas.clientHeight || 640;
      pinViewportHeightUnits(source, minCanvas);
      collapseEmptyStretchElements(source, minCanvas);
      source.style.setProperty("padding-bottom", `${PAGE_BOTTOM_PAD}px`, "important");

      let bottom = 0;
      Array.from(source.children).forEach((el) => {
        if (!(el instanceof HTMLElement) || el.style.display === "none") return;
        bottom = Math.max(bottom, el.offsetTop + el.offsetHeight);
      });

      if (!canvasHasVisibleContent(editor)) return minCanvas;
      return Math.max(bottom + PAGE_BOTTOM_PAD, minCanvas);
    };

    let sizing = false;
    const sizeToContent = () => {
      if (sizing) return;
      if (canvas.closest(".cms-grapes-shell--dragging")) return;

      sizing = true;
      try {
        const wrapEl = frame.parentElement as HTMLElement | null;
        const framesEl = canvas.querySelector(".gjs-cv-canvas__frames") as HTMLElement | null;
        const minCanvas = canvas.clientHeight || 0;
        const contentHeight = measureContentHeight();
        const nextHeight = Math.max(contentHeight, minCanvas);
        const currentHeight = parseFloat(frame.style.height) || 0;

        if (Math.abs(currentHeight - nextHeight) >= 2) {
          const next = `${nextHeight}px`;
          frame.style.setProperty("height", next, "important");
          frame.style.setProperty("min-height", next, "important");
          wrapEl?.style.setProperty("height", next, "important");
          wrapEl?.style.setProperty("min-height", next, "important");
          wrapEl?.style.setProperty("overflow", "visible", "important");
          framesEl?.style.setProperty("height", next, "important");
          framesEl?.style.setProperty("min-height", next, "important");
        }

        const artboardPx = Math.max(nextHeight, frame.clientHeight || 0, minCanvas);
        applyArtboardFill(artboardPx);

        canvas.style.setProperty("overflow-x", "hidden", "important");
        canvas.style.setProperty("overflow-y", "auto", "important");
        const maxScroll = Math.max(0, canvas.scrollHeight - canvas.clientHeight);
        if (maxScroll <= 1 || !canvasHasVisibleContent(editor)) canvas.scrollTop = 0;
        else if (canvas.scrollTop > maxScroll) canvas.scrollTop = maxScroll;
      } finally {
        sizing = false;
      }
    };

    sizeToContent();
    window.requestAnimationFrame(sizeToContent);

    if (frame.dataset.cmsPageScroll === "1") return;
    frame.dataset.cmsPageScroll = "1";

    let raf = 0;
    const observer = new ResizeObserver(() => {
      if (sizing || canvas.closest(".cms-grapes-shell--dragging")) return;
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        sizeToContent();
      });
    });
    observer.observe(body);
    if (wrapper) observer.observe(wrapper);

    const onCanvasWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return;
      const maxScroll = Math.max(0, canvas.scrollHeight - canvas.clientHeight);
      if (maxScroll <= 1) return;
      const next = Math.min(maxScroll, Math.max(0, canvas.scrollTop + event.deltaY));
      if (next === canvas.scrollTop) return;
      canvas.scrollTop = next;
      event.preventDefault();
    };

    win.addEventListener("wheel", onCanvasWheel, { passive: false });

    const disconnectPageScroll = () => {
      observer.disconnect();
      win.removeEventListener("wheel", onCanvasWheel);
      win.removeEventListener("pagehide", disconnectPageScroll);
    };

    // `unload` is blocked in cross-origin / policy-restricted iframe documents; pagehide is supported.
    win.addEventListener("pagehide", disconnectPageScroll);

    editor?.on?.("destroy", disconnectPageScroll);
  } catch {
    // ignore iframe access errors
  }
}

function getBlockContent(block: any) {
  if (!block) return null;
  if (typeof block.get === "function") {
    const content = block.get("content");
    return content == null || content === "" ? null : content;
  }
  if (typeof block.getContent === "function") return block.getContent() || null;
  return block.content || null;
}

function wrapperComponentCount(editor: any) {
  try {
    return editor.getWrapper?.()?.components?.()?.length ?? 0;
  } catch {
    return 0;
  }
}

/** WebWave-style section drag: full section clone follows pointer; thin insert line. */
function createWebwaveSectionDrag(editor: any) {
  let sourceEl: HTMLElement | null = null;
  let cloneEl: HTMLElement | null = null;
  let pointerOffsetX = 0;
  let pointerOffsetY = 0;
  let moveListener: ((event: PointerEvent) => void) | null = null;

  const getFrame = () => editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;

  const stripCloneIds = (root: HTMLElement) => {
    root.removeAttribute("id");
    root.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
  };

  const positionClone = (clientX: number, clientY: number) => {
    if (!cloneEl) return;
    const frame = getFrame();
    const win = frame?.contentWindow;
    if (!frame || !win) return;

    const frameRect = frame.getBoundingClientRect();
    const left = clientX - frameRect.left - pointerOffsetX + win.scrollX;
    const top = clientY - frameRect.top - pointerOffsetY + win.scrollY;
    cloneEl.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
  };

  const begin = (sourceModel: any, pointer?: { x: number; y: number }) => {
    const el = sourceModel?.getEl?.() as HTMLElement | undefined;
    const doc = getFrame()?.contentDocument;
    if (!el || !doc) return;

    sourceEl = el;
    const rect = el.getBoundingClientRect();
    const frameRect = getFrame()!.getBoundingClientRect();
    const localLeft = rect.left - frameRect.left;
    const localTop = rect.top - frameRect.top;

    if (pointer) {
      pointerOffsetX = pointer.x - frameRect.left - localLeft;
      pointerOffsetY = pointer.y - frameRect.top - localTop;
    } else {
      pointerOffsetX = Math.min(rect.width * 0.5, 120);
      pointerOffsetY = 28;
    }

    el.classList.add("cms-studio-sort-source");

    cloneEl = el.cloneNode(true) as HTMLElement;
    cloneEl.classList.add("cms-ww-drag-clone");
    stripCloneIds(cloneEl);
    cloneEl.style.width = `${Math.round(rect.width)}px`;
    cloneEl.style.minHeight = `${Math.round(rect.height)}px`;
    cloneEl.setAttribute("aria-hidden", "true");
    doc.body.appendChild(cloneEl);

    moveListener = (event: PointerEvent) => positionClone(event.clientX, event.clientY);
    window.addEventListener("pointermove", moveListener, { passive: true });
    doc.addEventListener("pointermove", moveListener, { passive: true });

    positionClone(
      pointer?.x ?? rect.left + pointerOffsetX,
      pointer?.y ?? rect.top + pointerOffsetY,
    );
  };

  const end = () => {
    const doc = getFrame()?.contentDocument;
    if (moveListener) {
      window.removeEventListener("pointermove", moveListener);
      doc?.removeEventListener("pointermove", moveListener);
      moveListener = null;
    }
    cloneEl?.remove();
    cloneEl = null;
    sourceEl?.classList.remove("cms-studio-sort-source");
    sourceEl = null;
  };

  return { begin, end };
}

function isPointerOverCanvas(editor: any, clientX: number, clientY: number) {
  const canvas = editor.Canvas?.getElement?.() as HTMLElement | undefined;
  const host = editor.getContainer?.() as HTMLElement | undefined;
  const target = canvas || host;
  if (!target) return false;
  const rect = target.getBoundingClientRect();
  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

export function installCanvasInteractionGuards(
  editor: any,
  shellEl: HTMLElement | null,
  isEditorAlive: () => boolean,
) {
  let dragging = false;
  let blockDragActive = false;
  let pendingBlock: any = null;
  let countAtDragStart = 0;
  let pointerOverCanvas = false;
  let pinnedScrollTop = 0;
  let pinnedScrollLeft = 0;
  let pinnedFrameHeight = "";
  let pinRaf = 0;

  const getCanvasElement = () => editor.Canvas?.getElement?.() as HTMLElement | undefined;
  const webwaveDrag = createWebwaveSectionDrag(editor);

  disableGrapesAutoscroll(editor);

  let lastPointerY = 0;
  let lastPointerX = 0;

  const trackGlobalPointer = (event: PointerEvent) => {
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
  };
  document.addEventListener("pointermove", trackGlobalPointer, { passive: true });

  const freezeFrameHeight = () => {
    try {
      disableGrapesAutoscroll(editor);
      const frame = editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
      if (frame && pinnedFrameHeight) {
        frame.style.setProperty("height", pinnedFrameHeight, "important");
        frame.parentElement?.style.setProperty("height", pinnedFrameHeight, "important");
      }
    } catch {
      // ignore iframe access errors
    }
  };

  const capturePinnedScroll = () => {
    const canvas = getCanvasElement();
    const frame = editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    pinnedScrollTop = canvas?.scrollTop || 0;
    pinnedScrollLeft = canvas?.scrollLeft || 0;
    pinnedFrameHeight = frame?.style.height || `${canvas?.clientHeight || 0}px`;
  };

  const scrollCanvasFromPointer = () => {
    const canvas = getCanvasElement();
    if (!canvas) return;
    canvas.style.setProperty("overflow-x", "hidden", "important");
    canvas.style.setProperty("overflow-y", "auto", "important");
    const rect = canvas.getBoundingClientRect();
    const maxScroll = Math.max(0, canvas.scrollHeight - canvas.clientHeight);
    if (maxScroll <= 1) return;
    if (lastPointerY > rect.bottom - DRAG_EDGE) {
      canvas.scrollTop = Math.min(maxScroll, canvas.scrollTop + DRAG_SCROLL_SPEED);
    } else if (lastPointerY > 0 && lastPointerY < rect.top + DRAG_EDGE) {
      canvas.scrollTop = Math.max(0, canvas.scrollTop - DRAG_SCROLL_SPEED);
    }
  };

  const pinCanvasScroll = () => {
    if (!isEditorAlive() || !dragging || !blockDragActive) return;
    freezeFrameHeight();
    scrollCanvasFromPointer();
  };

  const stopPinLoop = () => {
    if (!pinRaf) return;
    window.cancelAnimationFrame(pinRaf);
    pinRaf = 0;
  };

  const startPinLoop = () => {
    if (pinRaf) return;
    const tick = () => {
      if (!dragging) {
        pinRaf = 0;
        return;
      }
      pinCanvasScroll();
      pinRaf = window.requestAnimationFrame(tick);
    };
    pinRaf = window.requestAnimationFrame(tick);
  };

  const getFrameDoc = () => {
    try {
      return editor.Canvas?.getFrameEl?.()?.contentDocument as Document | undefined;
    } catch {
      return undefined;
    }
  };

  let frameDoc: Document | undefined;
  let canvasElForDrop: HTMLElement | undefined;

  const onCanvasScroll = () => {
    if (dragging && blockDragActive) freezeFrameHeight();
  };

  const markSortingDragTarget = (sourceEl?: HTMLElement, sourceModel?: any) => {
    try {
      const doc = getFrameDoc();
      doc?.documentElement?.classList?.add("cms-studio-sorting");
      doc?.body?.classList?.add("cms-studio-sorting");
      const model = sourceModel || editor.getSelected?.();
      if (model) {
        webwaveDrag.begin(model, lastPointerY > 0 ? { x: lastPointerX, y: lastPointerY } : undefined);
      } else if (sourceEl) {
        sourceEl.classList.add("cms-studio-sort-source");
      }
    } catch {
      // ignore class setup errors
    }
  };

  const clearSortingDragClasses = () => {
    webwaveDrag.end();
    try {
      const doc = getFrameDoc();
      doc?.querySelectorAll(".cms-studio-sort-source").forEach((node) => {
        node.classList.remove("cms-studio-sort-source");
      });
      doc?.body?.classList?.remove("cms-studio-sorting");
      doc?.documentElement?.classList?.remove("cms-studio-sorting");
    } catch {
      // ignore class cleanup errors
    }
  };

  const onPointerMove = (event: DragEvent | MouseEvent) => {
    lastPointerY = event.clientY;
    lastPointerX = event.clientX;
  };

  const onPointerOverCanvas = (event: DragEvent | MouseEvent) => {
    onPointerMove(event);
    if (event.type === "dragover") {
      event.preventDefault();
      try {
        (event as DragEvent).dataTransfer && ((event as DragEvent).dataTransfer!.dropEffect = "copy");
      } catch {
        // ignore dataTransfer errors
      }
    }

    const frame = editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    if (frame && event.view === frame.contentWindow) {
      pointerOverCanvas = true;
      return;
    }
    pointerOverCanvas = isPointerOverCanvas(editor, event.clientX, event.clientY);
  };

  const onHostDrop = (event: DragEvent) => {
    if (!blockDragActive) return;
    event.preventDefault();
    pointerOverCanvas = true;
  };

  const bindPointerTracking = () => {
    document.addEventListener("dragover", onPointerOverCanvas);
    document.addEventListener("pointermove", onPointerOverCanvas);
    document.addEventListener("drop", onHostDrop);
    frameDoc = getFrameDoc();
    frameDoc?.addEventListener("dragover", onPointerOverCanvas);
    frameDoc?.addEventListener("pointermove", onPointerOverCanvas);
    frameDoc?.addEventListener("drop", onHostDrop);
    canvasElForDrop = getCanvasElement();
    canvasElForDrop?.addEventListener("dragover", onPointerOverCanvas);
    canvasElForDrop?.addEventListener("drop", onHostDrop);
  };

  const unbindPointerTracking = () => {
    document.removeEventListener("dragover", onPointerOverCanvas);
    document.removeEventListener("pointermove", onPointerOverCanvas);
    document.removeEventListener("drop", onHostDrop);
    frameDoc?.removeEventListener("dragover", onPointerOverCanvas);
    frameDoc?.removeEventListener("pointermove", onPointerOverCanvas);
    frameDoc?.removeEventListener("drop", onHostDrop);
    canvasElForDrop?.removeEventListener("dragover", onPointerOverCanvas);
    canvasElForDrop?.removeEventListener("drop", onHostDrop);
    frameDoc = undefined;
    canvasElForDrop = undefined;
  };

  const finishDrag = () => {
    stopPinLoop();
    document.removeEventListener("dragend", onDragEnd);
    document.removeEventListener("dragover", onPointerMove);
    document.removeEventListener("pointermove", onPointerMove);
    dragging = false;
    lastPointerY = 0;
    lastPointerX = 0;
    pinnedFrameHeight = "";
    shellEl?.classList.remove("cms-grapes-shell--dragging", "cms-grapes-shell--block-drag");
    clearSortingDragClasses();
    const canvas = getCanvasElement();
    if (canvas) {
      canvas.style.setProperty("overflow-x", "hidden", "important");
      canvas.style.setProperty("overflow-y", "auto", "important");
    }
    unlockCanvasPageScroll(editor);
    if (isSiteTemplateRoot(editor.getSelected?.())) scrollCanvasToTop(editor);
  };

  const onDragEnd = () => {
    if (blockDragActive) return;
    finishDrag();
  };

  const onSorterDragEnd = (payload?: any) => {
    if (blockDragActive) return;
    try {
      const model =
        payload?.modelToDrop ||
        payload?.validResult?.srcModel ||
        editor.getSelected?.();
      normalizeStackedComponent(editor, model);
    } catch {
      // ignore reorder layout errors
    }
    finishDrag();
  };

  const beginDrag = () => {
    if (!isEditorAlive()) return;
    cancelPendingCanvasCenters();
    const alreadyDragging = dragging;
    const pinScroll = blockDragActive;
    if (!alreadyDragging && pinScroll) capturePinnedScroll();
    dragging = true;
    shellEl?.classList.add("cms-grapes-shell--dragging");
    if (blockDragActive) {
      shellEl?.classList.add("cms-grapes-shell--block-drag");
    } else {
      shellEl?.classList.remove("cms-grapes-shell--block-drag");
    }
    if (pinScroll) {
      freezeFrameHeight();
      pinCanvasScroll();
      startPinLoop();
    }
    if (!alreadyDragging) {
      document.addEventListener("dragend", onDragEnd);
      document.addEventListener("dragover", onPointerMove);
      document.addEventListener("pointermove", onPointerMove);
    }
  };

  const onDragStart = (sourceEl?: HTMLElement, sourceModel?: any) => {
    beginDrag();
    unlockComponentLayout(sourceModel || editor.getSelected?.());
    if (!blockDragActive) markSortingDragTarget(sourceEl, sourceModel);
  };

  const onComponentMoveStart = () => {
    beginDrag();
    unlockComponentLayout(editor.getSelected?.());
  };

  const onBlockDragStart = (block: any) => {
    pendingBlock = block;
    countAtDragStart = wrapperComponentCount(editor);
    pointerOverCanvas = false;
    blockDragActive = true;
    prefetchSiteTemplateAssets(block);
    beginDrag();
    bindPointerTracking();
  };

  const frozenDropViewport = (): CanvasViewport => snapshotCanvasViewport(editor);

  const centerDropped = (component: any) => {
    const dropped = resolveDroppedRoot(component) || editor.getSelected?.();
    if (!dropped) return;
    const frozen = frozenDropViewport();
    centerComponentOnCanvas(editor, dropped, frozen, "respect-sorter");
    scheduleCenterComponentOnCanvas(editor, dropped, frozen, "respect-sorter");
  };

  const placePendingBlock = () => {
    const content = getBlockContent(pendingBlock);
    if (!content) return null;
    if (editor.destroyed || typeof editor.Parser?.parseHtml !== "function") return null;
    try {
      return resolveDroppedRoot(editor.addComponents(content));
    } catch {
      return null;
    }
  };

  const onBlockDragStop = (component: any) => {
    unbindPointerTracking();

    let dropped = resolveDroppedRoot(component) || resolveDroppedRoot(editor.get?.("dragResult"));
    if (!dropped && pointerOverCanvas && pendingBlock) {
      const countNow = wrapperComponentCount(editor);
      if (countNow <= countAtDragStart) {
        dropped = placePendingBlock();
      }
    }

    pendingBlock = null;
    pointerOverCanvas = false;
    if (dropped) centerDropped(dropped);

    blockDragActive = false;
    finishDrag();
  };

  const onCanvasDrop = (_dataTransfer: unknown, model: any) => {
    if (blockDragActive && model) centerDropped(model);
  };

  const preventCanvasPan = () => {
    if (dragging) pinCanvasScroll();
  };

  const onCanvasDragHover = () => {
    if (!dragging) beginDrag();
    pinCanvasScroll();
  };

  const onComponentSelected = (component: any) => {
    unlockComponentLayout(component);
  };

  if (!editor.Commands.has("core:canvas-move")) {
    editor.Commands.add("core:canvas-move", { run() {}, stop() {} });
  } else {
    editor.Commands.extend("core:canvas-move", { run() {}, stop() {} });
  }

  const attachCanvasListeners = () => {
    const canvasEl = getCanvasElement();
    if (!canvasEl || canvasEl.dataset.cmsScrollPinned === "true") return;
    canvasEl.dataset.cmsScrollPinned = "true";
    canvasEl.addEventListener("scroll", onCanvasScroll, { passive: true });
  };

  const detachCanvasListeners = () => {
    const canvasEl = getCanvasElement();
    if (!canvasEl) return;
    delete canvasEl.dataset.cmsScrollPinned;
    canvasEl.removeEventListener("scroll", onCanvasScroll);
  };

  attachCanvasListeners();

  const ensureWrapperReorderable = () => {
    try {
      const wrapper = editor.getWrapper?.();
      wrapper?.set?.({
        droppable: true,
        draggable: false,
        stylable: false,
      });
    } catch {
      // ignore wrapper setup errors
    }
  };

  editor.on("sorter:drag:start", onDragStart);
  editor.on("sorter:drag:end", onSorterDragEnd);
  editor.on("block:drag:start", onBlockDragStart);
  editor.on("block:drag:stop", onBlockDragStop);
  editor.on("canvas:drop", onCanvasDrop);
  editor.on("canvas:dragenter", onCanvasDragHover);
  editor.on("canvas:dragover", onCanvasDragHover);
  editor.on("canvas:dragend", onDragEnd);
  editor.on("canvas:move", preventCanvasPan);
  editor.on("canvas:move:end", preventCanvasPan);
  editor.on("run:tlb-move", onComponentMoveStart);
  editor.on("run:core:component-drag", onComponentMoveStart);
  editor.on("stop:core:component-drag", onDragEnd);
  editor.on("component:selected", onComponentSelected);
  editor.on("load", () => {
    attachCanvasListeners();
    ensureWrapperReorderable();
  });

  ensureWrapperReorderable();

  return {
    isDragging: () => dragging,
    pinViewport: pinCanvasScroll,
    rememberViewport: () => {},
    cleanup: () => {
      document.removeEventListener("pointermove", trackGlobalPointer);
      unbindPointerTracking();
      pendingBlock = null;
      blockDragActive = false;
      finishDrag();
      detachCanvasListeners();
      editor.off("sorter:drag:start", onDragStart);
      editor.off("sorter:drag:end", onSorterDragEnd);
      editor.off("block:drag:start", onBlockDragStart);
      editor.off("block:drag:stop", onBlockDragStop);
      editor.off("canvas:drop", onCanvasDrop);
      editor.off("canvas:dragenter", onCanvasDragHover);
      editor.off("canvas:dragover", onCanvasDragHover);
      editor.off("canvas:dragend", onDragEnd);
      editor.off("canvas:move", preventCanvasPan);
      editor.off("canvas:move:end", preventCanvasPan);
      editor.off("run:tlb-move", onComponentMoveStart);
      editor.off("run:core:component-drag", onComponentMoveStart);
      editor.off("stop:core:component-drag", onDragEnd);
      editor.off("component:selected", onComponentSelected);
    },
  };
}

/** Keep home portfolio cards as image tiles, not GrapesJS form buttons labeled "Send". */
export function registerHomePortfolioComponents(editor: any) {
  try {
    editor.DomComponents.addType("canvas7-button", {
      isComponent: (el: HTMLElement) => {
        if (!el || String(el.tagName || "").toLowerCase() !== "button") return false;
        const className = String(el.className || "");
        return (
          className.includes("button") ||
          className.includes("cnvs-hamburger") ||
          Boolean(el.closest?.("[data-cms-site-template]"))
        );
      },
      model: {
        defaults: {
          tagName: "button",
          droppable: true,
          editable: true,
        },
      },
    });
    editor.DomComponents.addType("wsi-portfolio-zoom", {
      isComponent: (el: HTMLElement) => Boolean(el?.classList?.contains("wsi-portfolio-zoom")),
      model: {
        defaults: {
          tagName: "button",
          droppable: true,
          editable: false,
          stylable: true,
          void: false,
        },
      },
    });
  } catch {
    // Keep native parsing if the type cannot be registered.
  }
}
