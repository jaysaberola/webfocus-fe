type BrandLogo = {
  src: string;
  alt: string;
};

const PREV_BUTTON = `
<button type="button" id="wsi-slider-prev" class="wsi-slider-btn" aria-label="Previous clients">
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7"></path></svg>
</button>`;

const NEXT_BUTTON = `
<button type="button" id="wsi-slider-next" class="wsi-slider-btn" aria-label="Next clients">
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7"></path></svg>
</button>`;

function readBrandLogos(section: ParentNode): BrandLogo[] {
  const logos: BrandLogo[] = [];
  const seen = new Set<string>();

  section.querySelectorAll(".wsi-brand-cell img").forEach((img) => {
    const src = img.getAttribute("src") || "";
    const alt = img.getAttribute("alt") || "Client logo";
    if (!src || seen.has(src)) return;
    seen.add(src);
    logos.push({ src, alt });
  });

  return logos;
}

function createBrandCell(logo: BrandLogo, altOverride?: string) {
  const cell = document.createElement("div");
  cell.className = "wsi-brand-cell";

  const img = document.createElement("img");
  img.src = logo.src;
  img.alt = altOverride ?? logo.alt;
  img.loading = "lazy";
  img.decoding = "async";

  cell.appendChild(img);
  return cell;
}

function createMarqueeGroup(logos: BrandLogo[], ariaHidden = false) {
  const group = document.createElement("div");
  group.className = "wsi-brand-marquee-group";
  if (ariaHidden) {
    group.setAttribute("aria-hidden", "true");
  }

  logos.forEach((logo) => {
    group.appendChild(createBrandCell(logo, ariaHidden ? "" : logo.alt));
  });

  return group;
}

function buildMarqueeViewport(logos: BrandLogo[]) {
  const viewport = document.createElement("div");
  viewport.className = "wsi-brand-marquee-viewport";
  viewport.setAttribute("aria-label", "Client brand logos");

  const track = document.createElement("div");
  track.className = "wsi-brand-marquee-track";
  track.appendChild(createMarqueeGroup(logos));
  track.appendChild(createMarqueeGroup(logos, true));

  viewport.appendChild(track);
  return viewport;
}

function wrapWithSliderControls(content: HTMLElement) {
  const wrap = document.createElement("div");
  wrap.className = "wsi-slider-wrap";

  const controls = document.createElement("div");
  controls.className = "wsi-slider-controls";

  const prevHolder = document.createElement("div");
  prevHolder.innerHTML = PREV_BUTTON.trim();
  const nextHolder = document.createElement("div");
  nextHolder.innerHTML = NEXT_BUTTON.trim();

  controls.appendChild(prevHolder.firstElementChild!);
  controls.appendChild(content);
  controls.appendChild(nextHolder.firstElementChild!);
  wrap.appendChild(controls);
  return wrap;
}

function ensureMarqueeStructure(section: Element, logos: BrandLogo[]) {
  const existingViewport = section.querySelector(".wsi-brand-marquee-viewport");
  if (section.querySelector("#wsi-slider-prev") && existingViewport) {
    return existingViewport as HTMLElement;
  }

  let shell = section.querySelector(".wsi-brand-marquee-shell") as HTMLElement | null;
  if (!shell) {
    shell = document.createElement("div");
    shell.className = "wsi-brand-marquee-shell";
    shell.appendChild(buildMarqueeViewport(logos));
  } else if (!shell.querySelector(".wsi-brand-marquee-viewport")) {
    shell.appendChild(buildMarqueeViewport(logos));
  }

  const wrapped = wrapWithSliderControls(shell);
  const replaceTarget =
    section.querySelector(".wsi-slider-wrap") ||
    section.querySelector(".wsi-brand-marquee-shell");

  if (replaceTarget) {
    replaceTarget.replaceWith(wrapped);
  }

  return section.querySelector(".wsi-brand-marquee-viewport") as HTMLElement;
}

function initMarqueeMotion(section: Element, viewport: HTMLElement) {
  const sectionRoot = section as HTMLElement;
  if (sectionRoot.dataset.marqueeMotionInit === "1") return;
  sectionRoot.dataset.marqueeMotionInit = "1";

  const track = viewport.querySelector(".wsi-brand-marquee-track") as HTMLElement | null;
  const prevBtn = section.querySelector("#wsi-slider-prev") as HTMLButtonElement | null;
  const nextBtn = section.querySelector("#wsi-slider-next") as HTMLButtonElement | null;
  if (!track || !prevBtn || !nextBtn) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  let offset = 0;
  let manualHoldUntil = 0;
  let rafId = 0;
  const speed = 0.32;

  const getLoopWidth = () => {
    const group = track.querySelector(".wsi-brand-marquee-group") as HTMLElement | null;
    return group?.getBoundingClientRect().width ?? track.scrollWidth / 2;
  };

  const getStep = () => {
    const cell = track.querySelector(".wsi-brand-cell");
    if (!cell) return 180;
    const group = track.querySelector(".wsi-brand-marquee-group");
    const gap = group ? parseFloat(getComputedStyle(group).gap) || 32 : 32;
    return cell.getBoundingClientRect().width + gap;
  };

  const applyOffset = () => {
    track.style.transform = `translate3d(${-offset}px, 0, 0)`;
  };

  const normalizeOffset = () => {
    const loopWidth = getLoopWidth();
    if (loopWidth <= 0) return;
    while (offset >= loopWidth) offset -= loopWidth;
    while (offset < 0) offset += loopWidth;
    applyOffset();
  };

  const holdManualControl = (ms = 2800) => {
    manualHoldUntil = performance.now() + ms;
  };

  const tick = () => {
    const loopWidth = getLoopWidth();
    if (loopWidth > 0 && performance.now() > manualHoldUntil) {
      offset += speed;
      if (offset >= loopWidth) offset -= loopWidth;
      applyOffset();
    }
    rafId = window.requestAnimationFrame(tick);
  };

  prevBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    holdManualControl();
    offset -= getStep();
    normalizeOffset();
  });

  nextBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    holdManualControl();
    offset += getStep();
    normalizeOffset();
  });

  window.addEventListener("resize", normalizeOffset);
  rafId = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(rafId);
  };
}

export function initHomeBrandMarquee(root: ParentNode | null | undefined) {
  if (!root) return;

  const section = root.querySelector(".wsi-clients-section");
  if (!section) return;

  const logos = readBrandLogos(section);
  if (logos.length < 2) return;

  const viewport = ensureMarqueeStructure(section, logos);
  initMarqueeMotion(section, viewport);
}
