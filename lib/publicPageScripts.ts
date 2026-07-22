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
