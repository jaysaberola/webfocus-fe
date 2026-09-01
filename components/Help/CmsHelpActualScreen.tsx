"use client";

import { useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

type HighlightBox = {
  top: string;
  left: string;
  width: string;
  height: string;
};

type CaptureState = {
  src: string;
  highlight: HighlightBox | null;
};

const captureCache = new Map<string, CaptureState>();

function isHelpChrome(node: HTMLElement) {
  return Boolean(
    node.closest(".cms-help-assistant__backdrop, .cms-help-tour, .cms-help-launcher, .cms-help-dock")
  );
}

function pickCaptureRoot(target: Element | null): HTMLElement | null {
  const layout = document.querySelector(".cms-admin-layout") as HTMLElement | null;

  if (target instanceof HTMLElement) {
    const sidebar = target.closest(".sb-root");
    if (sidebar instanceof HTMLElement) return sidebar;
    const topbar = target.closest(".cms-topbar");
    if (topbar instanceof HTMLElement) return topbar;
    const grapes = target.closest(".cms-grapes-shell, .gjs-one-bg, .page-editor");
    if (grapes instanceof HTMLElement) return grapes;
    const main = document.querySelector(".cms-admin-main") as HTMLElement | null;
    if (main?.contains(target)) return main;
    if (target.offsetWidth > 40 && target.offsetHeight > 24) return target;
  }

  return layout;
}

function highlightFor(root: HTMLElement, target: Element | null): HighlightBox | null {
  if (!(target instanceof HTMLElement) || !root.contains(target)) return null;
  const rootBox = root.getBoundingClientRect();
  const box = target.getBoundingClientRect();
  if (rootBox.width < 8 || rootBox.height < 8) return null;

  return {
    left: `${((box.left - rootBox.left) / rootBox.width) * 100}%`,
    top: `${((box.top - rootBox.top) / rootBox.height) * 100}%`,
    width: `${(box.width / rootBox.width) * 100}%`,
    height: `${(box.height / rootBox.height) * 100}%`,
  };
}

type Props = {
  selector?: string;
  compact?: boolean;
  alt: string;
  onReady?: () => void;
};

export default function CmsHelpActualScreen({ selector, compact = false, alt, onReady }: Props) {
  const [capture, setCapture] = useState<CaptureState | null>(null);
  const [failed, setFailed] = useState(false);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let cancelled = false;
    const target = selector ? document.querySelector(selector) : null;
    const root = pickCaptureRoot(target);
    if (!root || isHelpChrome(root)) {
      setFailed(true);
      setCapture(null);
      return;
    }

    const cacheKey = `${window.location.pathname}|${selector ?? "layout"}|${root.className}`;
    const cached = captureCache.get(cacheKey);
    if (cached) {
      setCapture({
        src: cached.src,
        highlight: highlightFor(root, target),
      });
      setFailed(false);
      onReadyRef.current?.();
      return;
    }

    setFailed(false);
    setCapture(null);

    const timer = window.setTimeout(() => {
      void toPng(root, {
        cacheBust: true,
        pixelRatio: 1.2,
        quality: 0.92,
        backgroundColor: "#f8fafc",
        skipFonts: true,
        fontEmbedCSS: "",
        filter: (node) => {
          if (!(node instanceof HTMLElement)) return true;
          return !isHelpChrome(node);
        },
      })
        .then((src) => {
          if (cancelled) return;
          const next = { src, highlight: highlightFor(root, target) };
          captureCache.set(cacheKey, next);
          setCapture(next);
          onReadyRef.current?.();
        })
        .catch(() => {
          if (cancelled) return;
          setFailed(true);
        });
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [selector]);

  if (failed || !capture) return null;

  return (
    <div className={`cms-help-actual${compact ? " cms-help-actual--compact" : ""}`}>
      <img src={capture.src} alt={alt} className="cms-help-actual__image" />
      {capture.highlight ? (
        <span className="cms-help-actual__highlight" style={capture.highlight} />
      ) : null}
    </div>
  );
}

export function hasLiveHelpTarget(selector?: string) {
  if (!selector || typeof document === "undefined") return false;
  return Boolean(document.querySelector(selector));
}
