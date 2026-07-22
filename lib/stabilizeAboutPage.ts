function formatAboutCounter(el: Element) {
  const target = parseFloat(el.getAttribute("data-target") || "0");
  const suffix = el.getAttribute("data-suffix") || "";
  const decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);

  if (decimals > 0) {
    el.textContent = `${target.toFixed(decimals)}${suffix}`;
    return;
  }

  el.textContent = `${Math.round(target)}${suffix}`;
}

export function stabilizeAboutPage(root: ParentNode | null | undefined) {
  if (!root) return;

  root.querySelectorAll(".wsi-about-counter").forEach(formatAboutCounter);

  root.querySelectorAll(".wsi-reveal").forEach((node) => {
    node.classList.add("is-visible");
  });
}
