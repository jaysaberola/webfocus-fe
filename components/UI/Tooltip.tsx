"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type TooltipProps = {
  text: string;
  children?: ReactNode;
};

type TooltipCoords = {
  top: number;
  left: number;
  arrowLeft: number;
  placement: "top" | "bottom";
};

const TOOLTIP_MAX_WIDTH = 260;
const VIEWPORT_PAD = 10;
const GAP = 8;

export default function Tooltip({ text, children }: TooltipProps) {
  const tipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const boxRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<TooltipCoords | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const box = boxRef.current;
    if (!trigger || !box) return;

    const rect = trigger.getBoundingClientRect();
    const tipRect = box.getBoundingClientRect();
    const tipWidth = Math.min(Math.max(tipRect.width, 1), TOOLTIP_MAX_WIDTH);
    const tipHeight = Math.max(tipRect.height, 1);

    let left = rect.left + rect.width / 2 - tipWidth / 2;
    left = Math.max(VIEWPORT_PAD, Math.min(left, window.innerWidth - tipWidth - VIEWPORT_PAD));

    const spaceAbove = rect.top - VIEWPORT_PAD;
    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD;
    const preferTop = spaceAbove >= tipHeight + GAP || spaceAbove >= spaceBelow;

    const placement: TooltipCoords["placement"] = preferTop ? "top" : "bottom";
    const top = preferTop
      ? Math.max(VIEWPORT_PAD, rect.top - tipHeight - GAP)
      : Math.min(window.innerHeight - tipHeight - VIEWPORT_PAD, rect.bottom + GAP);

    const arrowLeft = Math.min(
      Math.max(rect.left + rect.width / 2 - left, 12),
      tipWidth - 12
    );

    setCoords({ top, left, arrowLeft, placement });
  }, []);

  useEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }

    updatePosition();
    const frame = window.requestAnimationFrame(updatePosition);

    const onReposition = () => updatePosition();
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open, text, updatePosition]);

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  const boxStyle: CSSProperties | undefined = coords
    ? {
        top: coords.top,
        left: coords.left,
        opacity: 1,
        visibility: "visible",
        ["--cms-tooltip-arrow-left" as string]: `${coords.arrowLeft}px`,
      }
    : {
        // Measure off-screen before the first positioned paint.
        top: -9999,
        left: -9999,
        opacity: 0,
        visibility: "hidden",
      };

  return (
    <>
      <span
        ref={triggerRef}
        className="cms-tooltip-trigger"
        tabIndex={0}
        aria-describedby={open ? tipId : undefined}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children ? (
          children
        ) : (
          <i className="fa-solid fa-circle-info cms-tooltip-icon" aria-hidden="true" />
        )}
        <span className="visually-hidden">{text}</span>
      </span>

      {mounted && open
        ? createPortal(
            <span
              ref={boxRef}
              id={tipId}
              role="tooltip"
              className={`cms-tooltip-box cms-tooltip-box--${coords?.placement || "top"}`}
              style={boxStyle}
            >
              {text}
            </span>,
            document.body
          )
        : null}

      <style jsx>{`
        .cms-tooltip-trigger {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-left: 6px;
          width: 1.15rem;
          height: 1.15rem;
          cursor: help;
          outline: none;
          vertical-align: middle;
          border-radius: 999px;
          color: #64748b;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .cms-tooltip-trigger:hover,
        .cms-tooltip-trigger:focus-visible {
          color: #2563eb;
          background: rgba(37, 99, 235, 0.08);
        }

        .cms-tooltip-trigger:focus-visible {
          box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.35);
        }

        :global(.cms-tooltip-icon) {
          font-size: 0.8125rem;
          line-height: 1;
          color: inherit;
        }
      `}</style>

      <style jsx global>{`
        .cms-tooltip-box {
          position: fixed;
          z-index: 20050;
          max-width: ${TOOLTIP_MAX_WIDTH}px;
          width: max-content;
          padding: 0.5rem 0.7rem;
          border-radius: 0.5rem;
          background: #0f172a;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 500;
          line-height: 1.4;
          letter-spacing: 0;
          text-transform: none;
          white-space: normal;
          word-break: break-word;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.28);
          pointer-events: none;
        }

        .cms-tooltip-box::after {
          content: "";
          position: absolute;
          left: var(--cms-tooltip-arrow-left, 50%);
          width: 8px;
          height: 8px;
          margin-left: -4px;
          background: #0f172a;
          transform: rotate(45deg);
        }

        .cms-tooltip-box--top::after {
          bottom: -4px;
        }

        .cms-tooltip-box--bottom::after {
          top: -4px;
        }
      `}</style>
    </>
  );
}
