/**
 * Grapes page scripts (e.g. home portfolio modal) append nodes to document.body.
 * Clean them up when leaving a public page so they do not leak on client navigation.
 */
export function cleanupPublicPageScripts() {
  if (typeof window === "undefined") return;

  const win = window as Window & {
    __wsiHomeCmsInit?: boolean;
    __wsiPortfolioModal?: HTMLElement | null;
    __cmsExecutedScripts?: Set<string>;
    __cmsExecutedInlineScripts?: Set<string>;
    __cmsLoadedScriptSrc?: Set<string>;
  };

  const modal = win.__wsiPortfolioModal;
  if (modal?.parentNode) {
    modal.parentNode.removeChild(modal);
  }

  delete win.__wsiPortfolioModal;
  delete win.__wsiHomeCmsInit;
  delete (win as Window & { __wsiAboutCmsInit?: boolean }).__wsiAboutCmsInit;
  document.body.classList.remove("wsi-portfolio-modal-open");
}

export function activateCmsPageAnimations(root: HTMLElement | null) {
  if (!root || typeof window === "undefined") return () => undefined;

  const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-anim]")).filter((node) => {
    const value = String(node.getAttribute("data-anim") || "").trim();
    return Boolean(value);
  });

  if (!nodes.length) return () => undefined;

  const reveal = (node: HTMLElement) => {
    node.classList.add("is-anim-in");
  };

  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    nodes.forEach(reveal);
    return () => undefined;
  }

  if (typeof IntersectionObserver === "undefined") {
    nodes.forEach(reveal);
    return () => undefined;
  }

  root.classList.add("cms-anim-ready");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18, rootMargin: "0px 0px -8% 0px" },
  );

  nodes.forEach((node) => observer.observe(node));

  return () => {
    observer.disconnect();
    root.classList.remove("cms-anim-ready");
  };
}
