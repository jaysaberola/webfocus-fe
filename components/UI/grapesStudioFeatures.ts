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
      editor.Canvas?.fitViewport?.({ ignoreHeight: true, gap: 20, zoom: 100 });
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
      canvas?.fitViewport?.({ ignoreHeight: true, gap: 20, zoom: next });
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
    wrapper?.append?.(content);
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
