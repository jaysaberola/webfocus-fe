export type TemplateSlideDirection = "prev" | "next";

/** Icon-only carousel controls */
export const TEMPLATE_CAROUSEL_PREV_ICON = "fa-solid fa-circle-chevron-left";
export const TEMPLATE_CAROUSEL_NEXT_ICON = "fa-solid fa-circle-chevron-right";

/** Text navigation controls (preview modal, setup wizard) */
export const TEMPLATE_NAV_PREV_ICON = "fa-solid fa-chevron-left";
export const TEMPLATE_NAV_NEXT_ICON = "fa-solid fa-chevron-right";

export function templateSlideClass(
  styles: Record<string, string>,
  direction: TemplateSlideDirection
) {
  return direction === "next" ? styles.templateSlideNext : styles.templateSlidePrev;
}
