"use client";

import { useId } from "react";

type Size = "sm" | "md" | "lg";

type Props = {
  size?: Size;
  speaking?: boolean;
  className?: string;
};

const PX: Record<Size, number> = {
  sm: 32,
  md: 42,
  lg: 72,
};

export default function CmsHelpGuideAvatar({ size = "md", speaking = false, className }: Props) {
  const px = PX[size];
  const uid = useId().replace(/:/g, "");
  const glowId = `cmsHelpAriaGlow-${uid}`;
  const hairId = `cmsHelpAriaHair-${uid}`;
  const clipId = `cmsHelpAriaClip-${uid}`;

  return (
    <span
      className={["cms-help-avatar", speaking ? "is-speaking" : "", className].filter(Boolean).join(" ")}
      style={{ width: px, height: px }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 80 80" width={px} height={px} role="img">
        <defs>
          <linearGradient id={glowId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#4f46e5" />
          </linearGradient>
          <linearGradient id={hairId} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#312e81" />
          </linearGradient>
          <clipPath id={clipId}>
            <circle cx="40" cy="40" r="36" />
          </clipPath>
        </defs>
        <circle cx="40" cy="40" r="38" fill={`url(#${glowId})`} />
        <g clipPath={`url(#${clipId})`}>
          <circle cx="40" cy="40" r="36" fill="#fde7d6" />
          <ellipse cx="40" cy="78" rx="28" ry="22" fill="#4338ca" />
          <path
            d="M12 38c4-22 18-30 28-30 12 0 26 10 28 30 0 0-6-16-14-18-4 10-8 12-14 12s-10-2-14-12c-8 2-14 18-14 18z"
            fill={`url(#${hairId})`}
          />
          <path d="M18 36c6-18 14-24 22-24 10 0 20 8 22 24-3-12-10-18-22-18S21 24 18 36z" fill="#0f172a" opacity="0.25" />
          <ellipse cx="28" cy="42" rx="3.2" ry="3.6" fill="#1e1b4b" />
          <ellipse cx="52" cy="42" rx="3.2" ry="3.6" fill="#1e1b4b" />
          <path d="M27 41.2c1.4-1 2.8-.8 4 0" fill="none" stroke="#c4b5fd" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M49 41.2c1.4-1 2.8-.8 4 0" fill="none" stroke="#c4b5fd" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M36 48c1.4 2.4 6.6 2.4 8 0" fill="none" stroke="#be185d" strokeWidth="1.4" strokeLinecap="round" />
          <ellipse cx="24" cy="48" rx="4" ry="2.2" fill="#fb7185" opacity="0.35" />
          <ellipse cx="56" cy="48" rx="4" ry="2.2" fill="#fb7185" opacity="0.35" />
        </g>
        <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" />
      </svg>
    </span>
  );
}
