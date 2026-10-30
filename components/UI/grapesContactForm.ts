import { buildCmsContactFormMarkup } from "@/lib/cmsContactFormMarkup";

export function registerCmsContactFormBlock(editor: any) {
  const bm = editor?.BlockManager;
  if (!bm || bm.get("cms-wsi-contact-form-block")) return;

  bm.add("cms-wsi-contact-form-block", {
    label: "WebFocus Contact Form",
    category: "CMS Forms",
    attributes: { class: "fa fa-envelope" },
    content: `<div class="public-contact" style="max-width:720px;margin:0 auto;padding:24px;">${buildCmsContactFormMarkup()}</div>`,
  });
}
