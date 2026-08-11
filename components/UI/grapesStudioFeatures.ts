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

/**
 * WebWave-style: force a dropped block into the center of the page canvas.
 * Grapes absolute mode places at the pointer — this overrides that after drop.
 */
export function centerComponentOnCanvas(editor: any, component: any) {
  const root = resolveDroppedRoot(component);
  if (!editor || !root) return;

  try {
    const wrapper = editor.getWrapper?.();
    if (!wrapper) return;

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

    if (!width || width > pageWidth * 0.9) {
      width = Math.min(720, Math.round(pageWidth * 0.7));
    }
    if (!height || height < 48) {
      height = 180;
    }

    const left = Math.max(0, Math.round((pageWidth - width) / 2));
    const top = Math.max(32, Math.round(scrollTop + (viewHeight - height) / 2));

    const nextStyle: Record<string, string> = {
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

    if (el) {
      el.style.setProperty("position", "absolute", "important");
      el.style.setProperty("left", nextStyle.left, "important");
      el.style.setProperty("top", nextStyle.top, "important");
      el.style.setProperty("width", nextStyle.width, "important");
      el.style.setProperty("max-width", "100%", "important");
      el.style.setProperty("margin", "0", "important");
      el.style.setProperty("transform", "none", "important");
    }

    editor.select?.(root);
  } catch {
    // ignore centering errors
  }
}

/** Re-apply center several times so Grapes mouse-drop coords cannot win the race. */
export function scheduleCenterComponentOnCanvas(editor: any, component: any) {
  if (!editor || !component) return;
  [0, 16, 48, 100, 200, 350].forEach((ms) => {
    window.setTimeout(() => centerComponentOnCanvas(editor, component), ms);
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

  const moveSelected = (direction: -1 | 1) => {
    const selected = getSelected();
    if (!selected) return;
    const parent = selected.parent?.();
    if (!parent?.components) return;
    const collection = parent.components();
    const index = collection.indexOf(selected);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= collection.length) return;
    selected.move?.(parent, { at: nextIndex });
  };

  const previewPage = () => {
    const html = buildContent(editor);
    const previewWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!previewWindow) {
      window.alert("Allow pop-ups to preview your page.");
      return;
    }
    previewWindow.document.open();
    previewWindow.document.write(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page Preview</title></head><body>${html}</body></html>`,
    );
    previewWindow.document.close();
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
    { id: "cms:preview-page", run: previewPage },
    { id: "cms:canvas-fit", run: fitCanvas },
    { id: "cms:canvas-zoom-in", run: () => adjustZoom(10) },
    { id: "cms:canvas-zoom-out", run: () => adjustZoom(-10) },
    { id: "cms:insert-hero", run: () => insertBlock("cms-hero") },
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
    { keys: "delete", cmd: "cms:delete" },
    { keys: "backspace", cmd: "cms:delete" },
    { keys: "ctrl+shift+p", cmd: "cms:preview-page" },
  ];

  keymaps.forEach(({ keys, cmd }) => {
    if (editor.Keymaps?.get?.(keys)) return;
    editor.Keymaps?.add?.(keys, cmd);
  });
}

export function installCanvasInteractionGuards(
  editor: any,
  shellEl: HTMLElement | null,
  isEditorAlive: () => boolean,
) {
  let dragging = false;
  let blockDragActive = false;

  const getCanvasElement = () => editor.Canvas?.getElement?.() as HTMLElement | undefined;

  const pinCanvasScroll = () => {
    if (!isEditorAlive() || !dragging) return;

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

  const onCanvasScroll = () => {
    if (dragging) pinCanvasScroll();
  };

  const onDragStart = () => {
    if (!isEditorAlive()) return;
    dragging = true;
    shellEl?.classList.add("cms-grapes-shell--dragging");
    pinCanvasScroll();
  };

  const onBlockDragStart = () => {
    blockDragActive = true;
    onDragStart();
  };

  const onDragEnd = () => {
    dragging = false;
    shellEl?.classList.remove("cms-grapes-shell--dragging");
    pinCanvasScroll();
  };

  const centerDropped = (component: any) => {
    const dropped = resolveDroppedRoot(component) || editor.getSelected?.();
    if (!dropped) return;
    scheduleCenterComponentOnCanvas(editor, dropped);
  };

  const onBlockDragStop = (component: any) => {
    blockDragActive = false;
    onDragEnd();
    centerDropped(component);
  };

  const onCanvasDrop = (_dataTransfer: unknown, model: any) => {
    // Absolute-mode block drops land here with mouse coords — force center.
    if (blockDragActive || model) {
      centerDropped(model);
    }
  };

  const preventCanvasPan = () => {
    if (dragging) pinCanvasScroll();
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
  editor.on("load", () => {
    attachCanvasListeners();
  });

  return {
    isDragging: () => dragging,
    pinViewport: pinCanvasScroll,
    rememberViewport: () => {},
    cleanup: () => {
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
    },
  };
}
