"use client";

import { ReactNode } from "react";

type TooltipProps = {
  text: string;
  children?: ReactNode;
};

export default function Tooltip({ text, children }: TooltipProps) {
  return (
    <span className="tooltip-wrapper">
      {children ? children : <span className="tooltip-icon">ⓘ</span>}
      <span className="tooltip-box">{text}</span>

      <style jsx>{`
        .tooltip-wrapper {
          position: relative;
          display: inline-flex;
          align-items: center;
          margin-left: 6px;
          cursor: pointer;
        }

        .tooltip-icon {
          font-size: 14px;
          color: #6c757d;
        }

        .tooltip-box {
          position: absolute;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          background: #000;
          color: #fff;
          padding: 6px 10px;
          font-size: 12px;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.2s ease;
          z-index: 9999;
        }

        .tooltip-wrapper:hover .tooltip-box {
          opacity: 1;
        }
      `}</style>
    </span>
  );
}