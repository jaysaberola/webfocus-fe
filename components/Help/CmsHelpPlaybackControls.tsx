"use client";

import {
  ARIA_SPEEDS,
  type AriaPrefs,
  type AriaSpeedId,
} from "@/lib/cmsHelp/ariaSpeech";

type Variant = "bar" | "compact";

type Props = {
  prefs: AriaPrefs;
  onChange: (partial: Partial<AriaPrefs>) => void;
  variant?: Variant;
};

export default function CmsHelpPlaybackControls({ prefs, onChange, variant = "bar" }: Props) {
  const compact = variant === "compact";

  return (
    <div className={`cms-help-playback cms-help-playback--${variant}`}>
      <div className="cms-help-playback__toggles">
        <button
          type="button"
          className={`cms-help-playback__toggle${prefs.voice ? " is-on" : ""}`}
          aria-pressed={prefs.voice}
          title={prefs.voice ? "Turn voice off" : "Turn voice on"}
          onClick={() => onChange({ voice: !prefs.voice })}
        >
          <i className={`fa-solid ${prefs.voice ? "fa-volume-high" : "fa-volume-xmark"}`} aria-hidden="true" />
          Voice
        </button>
        <button
          type="button"
          className={`cms-help-playback__toggle${prefs.captions ? " is-on" : ""}`}
          aria-pressed={prefs.captions}
          title={prefs.captions ? "Hide caption popup" : "Show caption popup"}
          onClick={() => onChange({ captions: !prefs.captions })}
        >
          <i className="fa-solid fa-closed-captioning" aria-hidden="true" />
          Captions
        </button>
      </div>

      <div className="cms-help-playback__speed" role="group" aria-label="Reading speed">
        {compact ? null : <span>Speed</span>}
        {ARIA_SPEEDS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`cms-help-playback__speed-btn${prefs.speed === item.id ? " is-active" : ""}`}
            title={item.hint}
            onClick={() => onChange({ speed: item.id as AriaSpeedId })}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
