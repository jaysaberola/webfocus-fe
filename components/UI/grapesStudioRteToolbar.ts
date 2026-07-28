import type { Component, Editor, RichTextEditorAction } from "grapesjs";

type RteActionLike = {
  name: string;
  btn?: HTMLElement;
};

type RteInstance = {
  exec: (command: string, value?: string) => unknown;
  insertHTML: (html: string) => void;
};

type StudioRteModule = Editor["RichTextEditor"] & {
  enable?: (view: unknown, target: unknown, opts?: unknown) => unknown;
  disable?: (view?: unknown, rte?: unknown, opts?: unknown) => unknown;
};

const TEXT_TAGS = new Set([
  "p",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "a",
  "li",
  "td",
  "th",
  "label",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "blockquote",
  "figcaption",
  "small",
]);

export function isEditableTextComponent(component: Component | null | undefined): boolean {
  if (!component) return false;
  if (component.get("editable") === false) return false;
  if (component.get("editable") === true) return true;

  const type = String(component.get("type") || "").toLowerCase();
  if (type === "text" || type === "textnode") return true;

  const tag = String(component.get("tagName") || "").toLowerCase();
  return TEXT_TAGS.has(tag);
}

export function ensureStudioRteEnabled(editor: Editor | null): boolean {
  if (!editor?.RichTextEditor?.enable) return false;

  const selected = editor.getSelected?.();
  if (!isEditableTextComponent(selected)) return false;

  const view = selected?.getView?.();
  const el = view?.el;
  if (!view || !el) return false;

  try {
    const rteModule = editor.RichTextEditor as StudioRteModule | undefined;
    rteModule?.enable?.(view, el, {});
    return true;
  } catch {
    return false;
  }
}

const fa = (icon: string) => `<i class="fa ${icon}" aria-hidden="true"></i>`;

export function registerStudioRteActions(editor: Editor) {
  const rte = editor.RichTextEditor;
  if (!rte?.add || !rte?.get) return;

  const rteAdd = rte.add.bind(rte);
  const rteGet = rte.get.bind(rte);

  const addExec = (name: string, command: string, icon: string, title: string, value?: string) => {
    if (rteGet(name)) return;
    rteAdd(name, {
      icon: fa(icon),
      attributes: { title },
      result: (instance: RteInstance) => {
        instance.exec(command, value);
      },
    } as Partial<RichTextEditorAction>);
  };

  addExec("alignLeft", "justifyLeft", "fa-align-left", "Align left");
  addExec("alignCenter", "justifyCenter", "fa-align-center", "Align center");
  addExec("alignRight", "justifyRight", "fa-align-right", "Align right");
  addExec("alignFull", "justifyFull", "fa-align-justify", "Justify");
  addExec("orderedList", "insertOrderedList", "fa-list-ol", "Numbered list");
  addExec("unorderedList", "insertUnorderedList", "fa-list-ul", "Bullet list");
  addExec("indent", "indent", "fa-indent", "Increase indent");
  addExec("outdent", "outdent", "fa-outdent", "Decrease indent");
  addExec("removeFormat", "removeFormat", "fa-eraser", "Clear formatting");
  addExec("subscript", "subscript", "fa-subscript", "Subscript");
  addExec("superscript", "superscript", "fa-superscript", "Superscript");
  addExec("horizontalRule", "insertHorizontalRule", "fa-minus", "Horizontal line");

  if (!rteGet("formatBlock")) {
    rteAdd("formatBlock", {
      icon: `<select class="cms-gjs-rte-format" aria-label="Format">
        <option value="p">Paragraph</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
        <option value="h4">Heading 4</option>
        <option value="blockquote">Quote</option>
      </select>`,
      event: "change",
      result: (instance: RteInstance, action: RichTextEditorAction) => {
        const select = action.btn?.querySelector("select") as HTMLSelectElement | null;
        const tag = select?.value || "p";
        instance.exec("formatBlock", `<${tag}>`);
      },
      update: (instance: RteInstance, action: RichTextEditorAction) => {
        const select = action.btn?.querySelector("select") as HTMLSelectElement | null;
        if (!select) return 0;
        const result = instance.exec("formatBlock");
        const value = typeof result === "string" ? result : "";
        const match = value.match(/<(h[1-6]|p|blockquote)/i);
        if (match?.[1]) select.value = match[1].toLowerCase();
        return 0;
      },
    } as Partial<RichTextEditorAction>);
  }

  if (!rteGet("insertTable")) {
    rteAdd("insertTable", {
      icon: fa("fa-table"),
      attributes: { title: "Insert table" },
      result: (instance: RteInstance) => {
        instance.insertHTML(`
          <table style="width:100%;border-collapse:collapse;margin:12px 0;">
            <thead>
              <tr>
                <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Header</th>
                <th style="border:1px solid #cbd5e1;padding:8px;text-align:left;">Header</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #cbd5e1;padding:8px;">Cell</td>
                <td style="border:1px solid #cbd5e1;padding:8px;">Cell</td>
              </tr>
            </tbody>
          </table>
        `);
      },
    } as Partial<RichTextEditorAction>);
  }

  if (!rteGet("insertImage")) {
    rteAdd("insertImage", {
      icon: fa("fa-image"),
      attributes: { title: "Insert image" },
      result: (instance: RteInstance) => {
        editor.AssetManager?.open?.({
          select: (asset) => {
            const src = asset.get?.("src") || "";
            if (!src) return;
            instance.insertHTML(`<img src="${src}" alt="" style="max-width:100%;height:auto;" />`);
            editor.Modal?.close?.();
          },
        });
      },
    } as Partial<RichTextEditorAction>);
  }

  if (!rteGet("directionLtr")) {
    rteAdd("directionLtr", {
      icon: fa("fa-arrow-right-long"),
      attributes: { title: "Left to right" },
      result: (instance: RteInstance) => {
        instance.exec("dir", "ltr");
      },
    } as Partial<RichTextEditorAction>);
  }

  if (!rteGet("directionRtl")) {
    rteAdd("directionRtl", {
      icon: fa("fa-arrow-left-long"),
      attributes: { title: "Right to left" },
      result: (instance: RteInstance) => {
        instance.exec("dir", "rtl");
      },
    } as Partial<RichTextEditorAction>);
  }
}

export const CMS_RTE_TOOLBAR_ACTIONS = [
  "bold",
  "italic",
  "underline",
  "strikethrough",
  "formatBlock",
  "alignLeft",
  "alignCenter",
  "alignRight",
  "alignFull",
  "unorderedList",
  "orderedList",
  "outdent",
  "indent",
  "link",
  "insertImage",
  "insertTable",
  "horizontalRule",
  "subscript",
  "superscript",
  "removeFormat",
  "directionLtr",
  "directionRtl",
] as const;

export function runStudioRteAction(editor: Editor | null, action: string) {
  if (!editor?.RichTextEditor?.run) return;
  ensureStudioRteEnabled(editor);
  editor.RichTextEditor.run(action);
}

export function mountStudioRteToolbar(
  editor: Editor,
  container: HTMLElement,
) {
  container.innerHTML = "";
  const toolbar = document.createElement("div");
  toolbar.className = "cms-grapes-rte-host__actions";

  const rteModule = editor.RichTextEditor;
  const actions = (rteModule?.getAll?.() || []) as RteActionLike[];

  CMS_RTE_TOOLBAR_ACTIONS.forEach((name) => {
    const action = actions.find((item) => item.name === name);
    if (!action?.btn) return;

    const clone = action.btn.cloneNode(true) as HTMLElement;
    clone.classList.add("cms-grapes-rte-host__btn");
    clone.style.removeProperty("width");
    clone.style.removeProperty("min-width");
    clone.style.removeProperty("max-width");
    clone.style.removeProperty("flex");
    clone.style.removeProperty("display");

    clone.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    clone.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      ensureStudioRteEnabled(editor);
      rteModule?.run?.(name);
    });

    const nestedSelect = clone.querySelector("select");
    if (nestedSelect) {
      nestedSelect.addEventListener("mousedown", (event) => event.stopPropagation());
      nestedSelect.addEventListener("change", (event) => {
        event.stopPropagation();
        ensureStudioRteEnabled(editor);
        rteModule?.run?.(name);
      });
    }

    toolbar.appendChild(clone);
  });

  container.appendChild(toolbar);

  return () => {
    container.innerHTML = "";
  };
}

export function activateStudioTextFormatting(editor: Editor | null) {
  if (!editor) return false;
  return ensureStudioRteEnabled(editor);
}

export function deactivateStudioTextFormatting(editor: Editor | null) {
  try {
    const rteModule = editor?.RichTextEditor as StudioRteModule | undefined;
    const view = editor?.getSelected?.()?.getView?.();
    if (view) {
      rteModule?.disable?.(view);
      return;
    }
    rteModule?.disable?.();
  } catch {
    // ignore
  }
}
