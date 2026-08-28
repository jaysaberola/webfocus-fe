"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CSSProperties } from "react";
import type { CmsHelpStep, CmsHelpStepPlacement } from "@/lib/cmsHelp/types";
import CmsHelpStepIllustration from "@/components/Help/CmsHelpStepIllustration";

type Rect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type CmsHelpTourOverlayProps = {
  guideTitle: string;
  guideIcon: string;
  step: CmsHelpStep | null;
  stepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  onBrowseTopics: () => void;
  needsNavigation: boolean;
  onNavigate: () => void;
};

const MARGIN = 16;
const GAP = 16;
const TOOLTIP_MAX_WIDTH = 400;
const TOOLTIP_MIN_WIDTH = 320;
const TOOLTIP_EST_HEIGHT = 380;

function expandSidebarForTarget(element: Element | null) {
  if (!element) return;
  const submenu = element.closest(".sb-submenu");
  if (!submenu) return;
  const parentBtn = submenu.previousElementSibling;
  if (parentBtn instanceof HTMLButtonElement) {
    const rect = submenu.getBoundingClientRect();
    const expanded = rect.height > 0 && rect.width > 0;
    if (!expanded) parentBtn.click();
  }
}

function measureTarget(selector?: string, shouldScroll = true): Rect | null {
  if (!selector) return null;
  const element = document.querySelector(selector);
  if (!element) return null;

  expandSidebarForTarget(element);

  const box = element.getBoundingClientRect();
  if (shouldScroll) {
    const inView = box.top >= MARGIN && box.bottom <= window.innerHeight - MARGIN;
    if (!inView) {
      element.scrollIntoView({ behavior: "auto", block: "center", inline: "nearest" });
    }
  }

  const nextBox = shouldScroll ? element.getBoundingClientRect() : box;
  const padding = 8;
  return {
    top: Math.max(8, nextBox.top - padding),
    left: Math.max(8, nextBox.left - padding),
    width: nextBox.width + padding * 2,
    height: nextBox.height + padding * 2,
  };
}

function rectsEqual(a: Rect | null, b: Rect | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.top === b.top && a.left === b.left && a.width === b.width && a.height === b.height;
}

function isLargeTarget(rect: Rect): boolean {
  return rect.height > window.innerHeight * 0.38 || rect.width > window.innerWidth * 0.48;
}

function clampPosition(top: number, left: number, width: number, height: number) {
  return {
    top: Math.min(Math.max(MARGIN, top), window.innerHeight - height - MARGIN),
    left: Math.min(Math.max(MARGIN, left), window.innerWidth - width - MARGIN),
  };
}

function fitTooltipInViewport(
  style: CSSProperties,
  tooltipHeight: number
): CSSProperties {
  const width =
    typeof style.width === "number"
      ? style.width
      : parseFloat(String(style.width ?? TOOLTIP_MAX_WIDTH)) || TOOLTIP_MAX_WIDTH;
  const left =
    typeof style.left === "number"
      ? style.left
      : parseFloat(String(style.left ?? MARGIN)) || MARGIN;
  const requestedTop =
    typeof style.top === "number"
      ? style.top
      : parseFloat(String(style.top ?? MARGIN)) || MARGIN;

  const maxAvailableHeight = window.innerHeight - MARGIN * 2;
  const effectiveHeight = Math.min(Math.max(tooltipHeight, 220), maxAvailableHeight);
  const clampedTop = Math.min(
    Math.max(MARGIN, requestedTop),
    window.innerHeight - effectiveHeight - MARGIN
  );
  const clampedLeft = Math.min(
    Math.max(MARGIN, left),
    window.innerWidth - width - MARGIN
  );

  return {
    ...style,
    top: clampedTop,
    left: clampedLeft,
    maxHeight: window.innerHeight - clampedTop - MARGIN,
  };
}

function computeTooltipStyle(
  rect: Rect | null,
  preferred: CmsHelpStepPlacement,
  tooltipWidth: number,
  tooltipHeight: number
): CSSProperties {
  const maxWidth = Math.min(TOOLTIP_MAX_WIDTH, window.innerWidth - MARGIN * 2);
  const minWidth = Math.min(TOOLTIP_MIN_WIDTH, maxWidth);
  const width = Math.min(tooltipWidth, maxWidth);

  if (!rect || preferred === "center") {
    const { top, left } = clampPosition(
      (window.innerHeight - tooltipHeight) / 2,
      (window.innerWidth - width) / 2,
      width,
      tooltipHeight
    );
    return fitTooltipInViewport({ top, left, maxWidth, minWidth, width }, tooltipHeight);
  }

  if (isLargeTarget(rect)) {
    const { top, left } = clampPosition(
      window.innerHeight - tooltipHeight - MARGIN,
      (window.innerWidth - width) / 2,
      width,
      tooltipHeight
    );
    return fitTooltipInViewport({ top, left, maxWidth, minWidth, width }, tooltipHeight);
  }

  const placements: CmsHelpStepPlacement[] = [];
  for (const candidate of [preferred, "bottom", "top", "right", "left"]) {
    if (candidate !== "center" && !placements.includes(candidate)) {
      placements.push(candidate);
    }
  }

  for (const placement of placements) {
    let top = MARGIN;
    let left = MARGIN;

    if (placement === "bottom") {
      top = rect.top + rect.height + GAP;
      left = rect.left + rect.width / 2 - width / 2;
    } else if (placement === "top") {
      top = rect.top - GAP - tooltipHeight;
      left = rect.left + rect.width / 2 - width / 2;
    } else if (placement === "right") {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left + rect.width + GAP;
    } else if (placement === "left") {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - GAP - width;
    }

    const clamped = clampPosition(top, left, width, tooltipHeight);
    const fitsVertically =
      clamped.top >= MARGIN && clamped.top + tooltipHeight <= window.innerHeight - MARGIN;

    if (fitsVertically) {
      return fitTooltipInViewport(
        { top: clamped.top, left: clamped.left, maxWidth, minWidth, width },
        tooltipHeight
      );
    }
  }

  const fallback = clampPosition(
    window.innerHeight - tooltipHeight - MARGIN,
    (window.innerWidth - width) / 2,
    width,
    tooltipHeight
  );

  return fitTooltipInViewport(
    { top: fallback.top, left: fallback.left, maxWidth, minWidth, width },
    tooltipHeight
  );
}

export default function CmsHelpTourOverlay({
  guideTitle,
  guideIcon,
  step,
  stepIndex,
  totalSteps,
  onNext,
  onPrev,
  onClose,
  onBrowseTopics,
  needsNavigation,
  onNavigate,
}: CmsHelpTourOverlayProps) {
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const targetRectRef = useRef<Rect | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const scrollForStepRef = useRef("");

  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<CSSProperties>({});
  const [missingTarget, setMissingTarget] = useState(false);

  const updateTooltipPosition = useCallback((targetRect: Rect | null) => {
    if (!step) return;

    const tooltipEl = tooltipRef.current;
    const tooltipWidth = tooltipEl?.offsetWidth || Math.min(TOOLTIP_MAX_WIDTH, window.innerWidth - MARGIN * 2);
    const tooltipHeight = tooltipEl?.offsetHeight || TOOLTIP_EST_HEIGHT;
    const placement = step.placement ?? (targetRect ? "bottom" : "center");

    setTooltipStyle(computeTooltipStyle(targetRect, placement, tooltipWidth, tooltipHeight));
  }, [step]);

  const applyTargetRect = useCallback((nextRect: Rect | null) => {
    targetRectRef.current = nextRect;
    setRect(nextRect);
    updateTooltipPosition(nextRect);
  }, [updateTooltipPosition]);

  const syncLayout = useCallback(
    (options?: { allowScroll?: boolean }) => {
      if (!step) return false;

      const allowScroll = options?.allowScroll ?? false;
      const stepKey = `${stepIndex}-${step.target ?? ""}`;
      const shouldScroll = allowScroll && scrollForStepRef.current !== stepKey;

      if (shouldScroll) {
        scrollForStepRef.current = stepKey;
      }

      if (!step.target) {
        setMissingTarget(false);
        if (targetRectRef.current !== null) {
          applyTargetRect(null);
        } else {
          updateTooltipPosition(null);
        }
        return false;
      }

      const nextRect = measureTarget(step.target, shouldScroll);
      const missing = !nextRect;
      setMissingTarget(missing);

      if (!rectsEqual(targetRectRef.current, nextRect)) {
        applyTargetRect(nextRect);
      } else {
        updateTooltipPosition(nextRect);
      }

      return missing;
    },
    [step, stepIndex, applyTargetRect, updateTooltipPosition]
  );

  const refreshTarget = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }

    scrollForStepRef.current = "";

    if (!step?.target) {
      syncLayout();
      return;
    }

    let attempts = 0;
    const maxAttempts = step.skipIfMissing && !needsNavigation ? 3 : 12;
    const attemptDelay = needsNavigation ? 500 : 200;

    const tryMeasure = () => {
      const stillMissing = syncLayout({ allowScroll: attempts === 0 });
      if (!stillMissing) return;

      attempts += 1;
      if (attempts < maxAttempts) {
        retryTimerRef.current = window.setTimeout(tryMeasure, attemptDelay);
        return;
      }

      if (step.skipIfMissing && !needsNavigation) {
        onNext();
      }
    };

    retryTimerRef.current = window.setTimeout(tryMeasure, attemptDelay);
  }, [step, needsNavigation, syncLayout, onNext]);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (retryTimerRef.current !== null) {
        window.clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    refreshTarget();
    const frame = requestAnimationFrame(() => {
      updateTooltipPosition(targetRectRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [refreshTarget, stepIndex, updateTooltipPosition]);

  useEffect(() => {
    const tooltipEl = tooltipRef.current;
    if (!tooltipEl || !step) return;

    const observer = new ResizeObserver(() => {
      updateTooltipPosition(targetRectRef.current);
    });

    observer.observe(tooltipEl);
    return () => observer.disconnect();
  }, [step, stepIndex, updateTooltipPosition]);

  useEffect(() => {
    const onResize = () => syncLayout();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [syncLayout]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!step || !mounted) return null;

  const content = (
    <div className="cms-help-tour" aria-live="polite">
      <div className="cms-help-tour__backdrop" onClick={onClose} aria-hidden="true" />

      {rect ? (
        <div
          className="cms-help-tour__spotlight"
          style={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          }}
        />
      ) : null}

      <div
        ref={tooltipRef}
        className="cms-help-tour__tooltip"
        style={tooltipStyle}
        role="dialog"
        aria-modal="true"
        aria-label={`Guide step ${stepIndex + 1}: ${step.title}`}
      >
        <div className="cms-help-tour__guide-bar">
          <span className="cms-help-tour__guide-icon" aria-hidden="true">
            <i className={guideIcon} />
          </span>
          <div className="cms-help-tour__guide-copy">
            <strong>{guideTitle}</strong>
            <span>
              Step {stepIndex + 1} of {totalSteps}
            </span>
          </div>
          <button type="button" className="cms-help-tour__close" onClick={onClose} aria-label="End guide">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className="cms-help-tour__progress" aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <span
              key={index}
              className={`cms-help-tour__progress-dot${index === stepIndex ? " is-active" : ""}${index < stepIndex ? " is-done" : ""}`}
            />
          ))}
        </div>

        <div className="cms-help-tour__tooltip-body">
          <CmsHelpStepIllustration step={step} stepTitle={step.title} compact />
          <h3>{step.title}</h3>
          <p>{step.body}</p>

          {step.details && step.details.length > 0 ? (
            <ul className="cms-help-tour__details">
              {step.details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}

          {step.tip ? (
            <div className="cms-help-tour__tip">
              <i className="fa-solid fa-lightbulb" aria-hidden="true" />
              <span>{step.tip}</span>
            </div>
          ) : null}

          {missingTarget && step.target ? (
            <div className="cms-help-tour__warn">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              <span>
                I could not find this part on screen yet.
                {needsNavigation ? " Go to the correct page first." : " Try expanding the sidebar or scrolling."}
              </span>
            </div>
          ) : null}
        </div>

        {needsNavigation && step.route ? (
          <button type="button" className="btn btn-primary w-100 cms-help-tour__nav-btn" onClick={onNavigate}>
            <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            Take me to this page
          </button>
        ) : (
          <div className="cms-help-tour__actions">
            <button type="button" className="btn btn-link btn-sm text-secondary" onClick={onBrowseTopics}>
              All topics
            </button>
            <div className="cms-help-tour__actions-main">
              <button type="button" className="btn btn-outline-secondary" onClick={onPrev} disabled={stepIndex === 0}>
                Back
              </button>
              <button type="button" className="btn btn-primary" onClick={onNext}>
                {stepIndex >= totalSteps - 1 ? "Finish" : "Next step"}
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
