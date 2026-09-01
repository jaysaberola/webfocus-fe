"use client";

import CmsHelpGuideAvatar from "@/components/Help/CmsHelpGuideAvatar";
import { CMS_GUIDE_NAME } from "@/lib/cmsHelp/guideVoice";
import { currentSpokenSentenceRange, karaokeTokens } from "@/lib/cmsHelp/ariaSpeech";

type CaptionVariant = "chat" | "tour" | "dock";

export function CmsHelpKaraoke({
  text,
  spokenChars,
  hideAhead = false,
}: {
  text: string;
  spokenChars: number;
  hideAhead?: boolean;
}) {
  const tokens = karaokeTokens(text, spokenChars);

  return (
    <span className={`cms-help-karaoke${hideAhead ? " cms-help-karaoke--live" : ""}`}>
      {tokens.map((token, index) => (
        <span
          key={`${index}-${token.part}`}
          className={
            token.isSpace
              ? undefined
              : token.said
                ? "cms-help-karaoke__said"
                : token.current
                  ? "cms-help-karaoke__now"
                  : "cms-help-karaoke__ahead"
          }
        >
          {token.part}
        </span>
      ))}
    </span>
  );
}

export default function CmsHelpLiveCaption({
  fullText,
  spoken,
  speaking,
  variant = "chat",
}: {
  fullText: string;
  spoken: string;
  speaking: boolean;
  variant?: CaptionVariant;
}) {
  if (!fullText || (!spoken && !speaking)) return null;

  const { sentence, spokenInSentence } = currentSpokenSentenceRange(fullText, spoken);
  if (!sentence) return null;

  return (
    <div className={`cms-help-caption cms-help-caption--${variant}`} aria-live="polite">
      <CmsHelpGuideAvatar size="sm" speaking={speaking} />
      <div className="cms-help-caption__bubble">
        <span className="cms-help-caption__name">
          {CMS_GUIDE_NAME} {speaking ? "is saying" : "said"}
        </span>
        <p>
          <CmsHelpKaraoke text={sentence} spokenChars={spokenInSentence} />
        </p>
      </div>
    </div>
  );
}
