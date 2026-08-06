import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferredMountProps = {
  children: ReactNode;
  /** Keep first N sections mounted immediately for LCP. */
  eager?: boolean;
  rootMargin?: string;
  /** Extra wait after intersecting so above-the-fold images keep bandwidth. */
  delayMs?: number;
  minHeight?: number | string;
  className?: string;
};

/**
 * Defers mounting heavy below-the-fold sections until near the viewport.
 * Keeps initial Web Design paint light while remote template images load.
 */
export default function DeferredMount({
  children,
  eager = false,
  rootMargin = "240px 0px",
  delayMs = 0,
  minHeight = 280,
  className,
}: DeferredMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager || visible) return;
    const node = ref.current;
    if (!node) return;

    let timeoutId: number | null = null;

    const reveal = () => {
      if (delayMs <= 0) {
        setVisible(true);
        return;
      }
      timeoutId = window.setTimeout(() => setVisible(true), delayMs);
    };

    if (typeof IntersectionObserver === "undefined") {
      reveal();
      return () => {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
      };
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [eager, visible, rootMargin, delayMs]);

  return (
    <div
      ref={ref}
      className={className}
      style={visible ? undefined : { minHeight }}
      aria-busy={!visible}
    >
      {visible ? children : null}
    </div>
  );
}
