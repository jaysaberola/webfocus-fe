"use client";

import { useEffect, useState } from "react";
import type { CmsHelpStep } from "@/lib/cmsHelp/types";
import { resolveStepVisual } from "@/lib/cmsHelp/resolveStepVisual";
import CmsHelpActualScreen, { hasLiveHelpTarget } from "@/components/Help/CmsHelpActualScreen";
import HelpGuideSvgImage from "@/components/Help/HelpGuideSvgImage";

type CmsHelpStepIllustrationProps = {
  step: CmsHelpStep;
  stepTitle: string;
  compact?: boolean;
};

export default function CmsHelpStepIllustration({ step, stepTitle, compact = false }: CmsHelpStepIllustrationProps) {
  const visual = resolveStepVisual(step);
  const live = hasLiveHelpTarget(step.target);
  const photo = Boolean(step.image);
  const [liveReady, setLiveReady] = useState(false);

  useEffect(() => {
    setLiveReady(false);
  }, [step.target, step.image]);

  const showSvg = !photo && (!live || !liveReady);

  return (
    <figure className={`cms-help-visual-wrap${compact ? " cms-help-visual-wrap--compact" : ""}`}>
      <figcaption className="cms-help-visual-wrap__caption">
        <i className="fa-solid fa-camera" aria-hidden="true" />
        <span>
          {liveReady
            ? "This is the actual area on your screen"
            : "Look for this highlighted area on your screen"}
        </span>
      </figcaption>

      <div className="cms-help-visual-wrap__frame">
        {photo ? (
          <img
            src={step.image}
            alt={`Guide illustration: ${stepTitle}`}
            className="cms-help-guide-image cms-help-guide-image--photo"
          />
        ) : null}

        {live && !photo ? (
          <CmsHelpActualScreen
            selector={step.target}
            compact={compact}
            alt={`Actual CMS screen for ${stepTitle}`}
            onReady={() => setLiveReady(true)}
          />
        ) : null}

        {showSvg ? (
          <HelpGuideSvgImage
            layout={visual.layout}
            highlight={visual.highlight}
            title={stepTitle}
            compact={compact}
          />
        ) : null}
      </div>
    </figure>
  );
}

