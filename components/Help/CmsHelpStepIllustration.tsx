"use client";

import type { CmsHelpStep } from "@/lib/cmsHelp/types";
import { resolveStepVisual } from "@/lib/cmsHelp/resolveStepVisual";
import HelpGuideSvgImage from "@/components/Help/HelpGuideSvgImage";

type CmsHelpStepIllustrationProps = {
  step: CmsHelpStep;
  stepTitle: string;
  compact?: boolean;
};

export default function CmsHelpStepIllustration({ step, stepTitle, compact = false }: CmsHelpStepIllustrationProps) {
  const visual = resolveStepVisual(step);

  return (
    <figure className={`cms-help-visual-wrap${compact ? " cms-help-visual-wrap--compact" : ""}`}>
      <figcaption className="cms-help-visual-wrap__caption">
        <i className="fa-solid fa-image" aria-hidden="true" />
        <span>Look for this highlighted area on your screen</span>
      </figcaption>

      <div className="cms-help-visual-wrap__frame">
        {step.image ? (
          <img
            src={step.image}
            alt={`Guide illustration: ${stepTitle}`}
            className="cms-help-guide-image cms-help-guide-image--photo"
          />
        ) : null}

        <HelpGuideSvgImage
          layout={visual.layout}
          highlight={visual.highlight}
          title={stepTitle}
          compact={compact}
        />
      </div>
    </figure>
  );
}
