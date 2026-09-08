function formatPortfolioCounter(text: string) {
  return text
    .replace(/(\d+\s*\/\s*\d+)(?=\S)/, "$1 · ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function patchCounter(node: HTMLElement) {
  const next = formatPortfolioCounter(node.textContent || "");
  if (next && next !== (node.textContent || "").trim()) {
    node.textContent = next;
  }
}

function restorePortfolioImages(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>(".wsi-portfolio-zoom").forEach((trigger) => {
    const src = trigger.getAttribute("data-src") || "";
    let img = trigger.querySelector("img");

    if (!img && src) {
      img = document.createElement("img");
      img.src = src;
      img.alt = trigger.getAttribute("data-title") || trigger.getAttribute("aria-label") || "";
      trigger.insertBefore(img, trigger.firstChild);
    } else if (img && src && !img.getAttribute("src")) {
      img.src = src;
    }

    Array.from(trigger.childNodes).forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim()) {
        node.textContent = "";
      }
    });
  });
}

function placeSideNav(modal: HTMLElement) {
  const panel = modal.querySelector(".wsi-portfolio-modal-panel");
  const prev = modal.querySelector(".wsi-portfolio-modal-prev");
  const next = modal.querySelector(".wsi-portfolio-modal-next");
  if (!panel || !(prev instanceof HTMLElement) || !(next instanceof HTMLElement)) return;
  if (prev.parentElement !== panel) panel.appendChild(prev);
  if (next.parentElement !== panel) panel.appendChild(next);
}

export function initHomePortfolioModal() {
  if (typeof window === "undefined") return () => undefined;

  const patch = () => {
    restorePortfolioImages();
    document.querySelectorAll<HTMLElement>(".wsi-portfolio-modal").forEach(placeSideNav);
    document.querySelectorAll<HTMLElement>(".wsi-portfolio-modal-counter").forEach(patchCounter);
  };

  patch();

  const observer = new MutationObserver(patch);
  observer.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true,
  });

  return () => observer.disconnect();
}
