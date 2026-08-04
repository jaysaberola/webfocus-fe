import { useEffect, useRef, useState, type ReactNode } from "react";

type DeferredMountProps = {
  children: ReactNode;
  /** Keep first N sections mounted immediately for LCP. */
  eager?: boolean;
  rootMargin?: string;
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
  minHeight = 280,
  className,
}: DeferredMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    if (eager || visible) return;
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [eager, visible, rootMargin]);

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
