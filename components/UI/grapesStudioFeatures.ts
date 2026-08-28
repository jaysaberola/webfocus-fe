import { resolveStorageAssetUrl } from "@/lib/storageAssets";

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

export function isEditorCanvasEmpty(editor: any): boolean {
  try {
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
  if (Array.isArray(component)) return component[0] || null;
  if (component.models?.length) return component.models[0] || null;
  return component;
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

function isStackedPageSection(component: any) {
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

function appendSectionToPageBottom(editor: any, root: any) {
  const wrapper = editor.getWrapper?.();
  if (!wrapper || !root) return;

  try {
    if (root.parent?.() !== wrapper) {
      wrapper.append?.(root);
    }
  } catch {
    try {
      root.move?.(wrapper, { at: wrapper.components?.()?.length ?? 0 });
    } catch {
      // keep current parent if move is blocked
    }
  }

  try {
    const collection = wrapper.components?.();
    const models = collection?.models || [];
    const currentIndex = typeof collection?.indexOf === "function" ? collection.indexOf(root) : models.indexOf(root);
    const lastIndex = Math.max(0, (collection?.length ?? models.length) - 1);
    if (currentIndex >= 0 && currentIndex !== lastIndex) {
      root.move?.(wrapper, { at: lastIndex });
    }
  } catch {
    // ignore reorder errors
  }
}

function scrollCanvasToComponent(editor: any, root: any) {
  const run = () => {
    try {
      unlockCanvasPageScroll(editor);
      const el = root?.getEl?.() as HTMLElement | undefined;
      el?.scrollIntoView?.({ block: "nearest", inline: "nearest" });
    } catch {
      // ignore scroll errors
    }
  };

  run();
  [40, 140, 280].forEach((ms) => window.setTimeout(run, ms));
}

/**
 * Page sections stack at the bottom of the page.
 * Smaller elements stay centered in the current view.
 */
export function centerComponentOnCanvas(editor: any, component: any) {
  const root = resolveDroppedRoot(component);
  if (!editor || !root) return;

  try {
    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;

    if (isStackedPageSection(root)) {
      appendSectionToPageBottom(editor, root);

      const nextStyle: Record<string, string> = {
        position: "relative",
        left: "auto",
        top: "auto",
        right: "auto",
        bottom: "auto",
        width: "100%",
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
      editor.select?.(root);
      scrollCanvasToComponent(editor, root);
      return;
    }

    const parent = root.parent?.();
    if (parent && parent !== wrapper) {
      try {
        root.move?.(wrapper, { at: wrapper.components?.()?.length ?? 0 });
      } catch {
        // keep current parent if move is blocked
      }
    }

    root.set?.("dmode", "absolute");
    root.setDragMode?.("absolute");

    const frameEl = editor.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    const body = frameEl?.contentDocument?.body as HTMLElement | undefined;
    const canvasEl = editor.Canvas?.getElement?.() as HTMLElement | undefined;
    if (!body) return;

    // Center on the white page (frame body), not the outer editor chrome.
    const pageWidth = Math.max(body.clientWidth || 0, 960);
    const viewHeight = Math.max(canvasEl?.clientHeight || 0, 560);
    const scrollTop = body.ownerDocument?.defaultView?.scrollY || canvasEl?.scrollTop || 0;

    const el = root.getEl?.() as HTMLElement | null | undefined;
    let width = el?.offsetWidth || 0;
    let height = el?.offsetHeight || 0;
    const compact = isCompactCanvasElement(root) || (width > 0 && width < pageWidth * 0.55 && height > 0 && height < 96);

    if (compact) {
      width = Math.max(width || 160, 80);
      height = Math.max(height || 44, 36);
    } else {
      if (!width || width > pageWidth * 0.9) {
        width = Math.min(720, Math.round(pageWidth * 0.7));
      }
      if (!height || height < 48) {
        height = 180;
      }
    }

    const left = Math.max(0, Math.round((pageWidth - width) / 2));
    const top = Math.max(32, Math.round(scrollTop + (viewHeight - height) / 2));

    const nextStyle: Record<string, string> = compact
      ? {
          position: "absolute",
          left: `${left}px`,
          top: `${top}px`,
          width: "auto",
          height: "auto",
          maxWidth: "100%",
          margin: "0",
          transform: "none",
        }
      : {
          position: "absolute",
          left: `${left}px`,
          top: `${top}px`,
          width: `${width}px`,
          maxWidth: "100%",
          margin: "0",
          transform: "none",
        };

    if (typeof root.setStyle === "function") {
      const current = root.getStyle?.() || {};
      root.setStyle({ ...current, ...nextStyle });
    }
    root.addStyle?.(nextStyle);
    applyComponentLayout(el, nextStyle);
    editor.select?.(root);
  } catch {
    // ignore centering errors
  }
}

/** Re-apply center a couple of times so Grapes mouse-drop coords cannot win the race. */
export function scheduleCenterComponentOnCanvas(editor: any, component: any) {
  if (!editor || !component) return;
  cancelPendingCanvasCenters();
  [0, 24, 80].forEach((ms) => {
    const id = window.setTimeout(() => {
      pendingCenterTimers.delete(id);
      centerComponentOnCanvas(editor, component);
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
    const parent = selected.parent?.();
    if (!parent?.components) return;
    const collection = parent.components();
    const index = collection.indexOf(selected);
    const nextIndex = Math.max(0, Math.min(collection.length - 1, index + direction));
    if (nextIndex === index) return;
    selected.move?.(parent, { at: nextIndex });
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
    const rawHtml = String(editor.getHtml?.() || packed).trim();
    const rawCss = String(editor.getCss?.() || "");
    const scriptMatch = packed.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
    const js = String(scriptMatch?.[1] || "").trim();
    const origin = window.location.origin;
    const imageMap = snapshotCanvasImageUrls(editor);
    const html = rewritePreviewAssets(rawHtml, origin, imageMap);
    const css = rewritePreviewAssets(rawCss, origin, imageMap);
    const documentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base href="${origin}/">
  <title>Page Preview</title>
  <link rel="stylesheet" href="${origin}/css/cms-studio-buttons.css">
  <style>
    html, body { margin: 0; background: #fff; color: #0f172a; font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif; }
    img, video, iframe { max-width: 100%; height: auto; }
    ${css}
  </style>
</head>
<body>
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
    if (editor.Commands.has(id)) return;
    editor.Commands.add(id, { run, stop() {} });
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

export function unlockCanvasPageScroll(editor: any) {
  try {
    const frame = editor?.Canvas?.getFrameEl?.() as HTMLIFrameElement | undefined;
    const canvas = editor?.Canvas?.getElement?.() as HTMLElement | undefined;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow;
    const html = doc?.documentElement;
    const body = doc?.body;
    if (!frame || !canvas || !doc || !win || !html || !body) return;

    html.style.setProperty("height", "100%", "important");
    html.style.setProperty("min-height", "100%", "important");
    html.style.setProperty("overflow", "visible", "important");
    body.style.setProperty("height", "auto", "important");
    body.style.setProperty("min-height", "100%", "important");
    body.style.setProperty("overflow", "visible", "important");
    body.style.setProperty("padding-bottom", "0", "important");

    const wrapper = (
      body.matches?.('[data-gjs-type="wrapper"]')
        ? body
        : body.querySelector('[data-gjs-type="wrapper"]')
    ) as HTMLElement | null;
    wrapper?.style.setProperty("height", "auto", "important");
    wrapper?.style.setProperty("min-height", "100%", "important");
    wrapper?.style.setProperty("overflow", "visible", "important");
    wrapper?.style.setProperty("padding-bottom", "0", "important");

    const measureContentHeight = () => {
      const source = wrapper || body;
      const kids = Array.from(source.children) as HTMLElement[];
      if (!kids.length) return canvas.clientHeight || 640;

      let bottom = 0;
      kids.forEach((el) => {
        if (!(el instanceof HTMLElement)) return;
        if (el.style.display === "none") return;
        bottom = Math.max(bottom, el.offsetTop + el.offsetHeight);
      });
      return Math.max(bottom, 1);
    };

    const sizeToContent = () => {
      const wrapEl = frame.parentElement as HTMLElement | null;
      const framesEl = canvas.querySelector(".gjs-cv-canvas__frames") as HTMLElement | null;
      const contentHeight = measureContentHeight();
      const nextHeight = Math.max(contentHeight, canvas.clientHeight || 0);
      const currentHeight = parseFloat(frame.style.height) || 0;
      if (Math.abs(currentHeight - nextHeight) < 2) return;

      const next = `${nextHeight}px`;
      frame.style.setProperty("height", next, "important");
      frame.style.setProperty("min-height", "0", "important");
      wrapEl?.style.setProperty("height", next, "important");
      wrapEl?.style.setProperty("min-height", "0", "important");
      wrapEl?.style.setProperty("overflow", "visible", "important");
      framesEl?.style.setProperty("height", "auto", "important");
      framesEl?.style.setProperty("min-height", "0", "important");
      canvas.style.setProperty("overflow-x", "hidden", "important");
      canvas.style.setProperty("overflow-y", "auto", "important");
    };

    sizeToContent();
    window.requestAnimationFrame(sizeToContent);

    if (frame.dataset.cmsPageScroll === "1") return;
    frame.dataset.cmsPageScroll = "1";

    const observer = new ResizeObserver(() => sizeToContent());
    observer.observe(body);
    if (wrapper) observer.observe(wrapper);

    win.addEventListener(
      "wheel",
      (event: WheelEvent) => {
        if (event.ctrlKey) return;
        const maxScroll = Math.max(0, canvas.scrollHeight - canvas.clientHeight);
        if (maxScroll <= 1) return;
        const next = Math.min(maxScroll, Math.max(0, canvas.scrollTop + event.deltaY));
        if (next === canvas.scrollTop) return;
        canvas.scrollTop = next;
        event.preventDefault();
      },
      { passive: false },
    );

    win.addEventListener("unload", () => observer.disconnect());
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

  const getCanvasElement = () => editor.Canvas?.getElement?.() as HTMLElement | undefined;

  const pinCanvasScroll = () => {
    if (!isEditorAlive() || !dragging || blockDragActive) return;

    try {
      const canvas = getCanvasElement();
      if (canvas && (canvas.scrollTop !== 0 || canvas.scrollLeft !== 0)) {
        canvas.scrollTop = 0;
        canvas.scrollLeft = 0;
      }
    } catch {
      // ignore scroll pin errors
    }
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
    if (dragging) pinCanvasScroll();
  };

  const onPointerOverCanvas = (event: DragEvent | MouseEvent) => {
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

  const onDragStart = () => {
    if (!isEditorAlive()) return;
    cancelPendingCanvasCenters();
    dragging = true;
    shellEl?.classList.add("cms-grapes-shell--dragging");
    unlockComponentLayout(editor.getSelected?.());
    pinCanvasScroll();
  };

  const onComponentMoveStart = () => {
    if (!isEditorAlive()) return;
    cancelPendingCanvasCenters();
    dragging = true;
    shellEl?.classList.add("cms-grapes-shell--dragging");
    unlockComponentLayout(editor.getSelected?.());
  };

  const onBlockDragStart = (block: any) => {
    pendingBlock = block;
    countAtDragStart = wrapperComponentCount(editor);
    pointerOverCanvas = false;
    blockDragActive = true;
    dragging = true;
    cancelPendingCanvasCenters();
    shellEl?.classList.add("cms-grapes-shell--dragging");
    bindPointerTracking();
  };

  const onDragEnd = () => {
    dragging = false;
    shellEl?.classList.remove("cms-grapes-shell--dragging");
  };

  const centerDropped = (component: any) => {
    const dropped = resolveDroppedRoot(component) || editor.getSelected?.();
    if (!dropped) return;
    scheduleCenterComponentOnCanvas(editor, dropped);
  };

  const placePendingBlock = () => {
    const content = getBlockContent(pendingBlock);
    if (!content) return null;
    try {
      return resolveDroppedRoot(editor.addComponents(content));
    } catch {
      return null;
    }
  };

  const onBlockDragStop = (component: any) => {
    unbindPointerTracking();
    blockDragActive = false;
    onDragEnd();

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
  };

  const onCanvasDrop = (_dataTransfer: unknown, model: any) => {
    if (blockDragActive && model) centerDropped(model);
  };

  const preventCanvasPan = () => {
    if (dragging) pinCanvasScroll();
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

  editor.on("sorter:drag:start", onDragStart);
  editor.on("sorter:drag:end", onDragEnd);
  editor.on("block:drag:start", onBlockDragStart);
  editor.on("block:drag:stop", onBlockDragStop);
  editor.on("canvas:drop", onCanvasDrop);
  editor.on("canvas:move", preventCanvasPan);
  editor.on("canvas:move:end", preventCanvasPan);
  editor.on("run:tlb-move", onComponentMoveStart);
  editor.on("run:core:component-drag", onComponentMoveStart);
  editor.on("stop:core:component-drag", onDragEnd);
  editor.on("component:selected", onComponentSelected);
  editor.on("load", () => {
    attachCanvasListeners();
  });

  return {
    isDragging: () => dragging,
    pinViewport: pinCanvasScroll,
    rememberViewport: () => {},
    cleanup: () => {
      unbindPointerTracking();
      pendingBlock = null;
      onDragEnd();
      blockDragActive = false;
      detachCanvasListeners();
      editor.off("sorter:drag:start", onDragStart);
      editor.off("sorter:drag:end", onDragEnd);
      editor.off("block:drag:start", onBlockDragStart);
      editor.off("block:drag:stop", onBlockDragStop);
      editor.off("canvas:drop", onCanvasDrop);
      editor.off("canvas:move", preventCanvasPan);
      editor.off("canvas:move:end", preventCanvasPan);
      editor.off("run:tlb-move", onComponentMoveStart);
      editor.off("run:core:component-drag", onComponentMoveStart);
      editor.off("stop:core:component-drag", onDragEnd);
      editor.off("component:selected", onComponentSelected);
    },
  };
}
