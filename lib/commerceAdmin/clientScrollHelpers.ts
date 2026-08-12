const CLIENT_SECTION_SCROLL_OFFSET = 96;

export function scrollToClientSection(element: HTMLElement | null) {
  if (!element || typeof window === "undefined") return;
  const top = element.getBoundingClientRect().top + window.scrollY - CLIENT_SECTION_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

export function scrollToClientSectionById(id: string) {
  scrollToClientSection(document.getElementById(id));
}
