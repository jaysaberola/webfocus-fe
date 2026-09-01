"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CMS_HELP_GUIDES, CMS_HELP_GUIDE_MAP, CmsHelpGuide } from "@/lib/cmsHelp/guides";
import { downloadUserGuidePptx } from "@/lib/cmsHelp/downloadUserGuidePptx";
import {
  CMS_GUIDE_NAME,
  CMS_GUIDE_ROLE,
  spokenGuideIntro,
  spokenStepCue,
  spokenStepScript,
  spokenTip,
  spokenWelcome,
} from "@/lib/cmsHelp/guideVoice";
import {
  getAriaPrefs,
  setAriaPrefs,
  speakAria,
  stopAriaSpeech,
  type AriaPrefs,
} from "@/lib/cmsHelp/ariaSpeech";
import CmsHelpGuideAvatar from "@/components/Help/CmsHelpGuideAvatar";
import CmsHelpLiveCaption, { CmsHelpKaraoke } from "@/components/Help/CmsHelpLiveCaption";
import CmsHelpPlaybackControls from "@/components/Help/CmsHelpPlaybackControls";
import CmsHelpStepIllustration from "@/components/Help/CmsHelpStepIllustration";
import { toast } from "@/lib/toast";

type CmsHelpAssistantProps = {
  variant: "modal" | "dock";
  activeGuideId: string;
  stepIndex: number;
  onGuideChange: (guideId: string) => void;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
  onBrowse?: () => void;
  onStartTour?: () => void;
};

export default function CmsHelpAssistant({
  variant,
  activeGuideId,
  stepIndex,
  onGuideChange,
  onClose,
  onNext,
  onPrev,
  onBrowse,
  onStartTour,
}: CmsHelpAssistantProps) {
  const [query, setQuery] = useState("");
  const [typing, setTyping] = useState(false);
  const [revealed, setRevealed] = useState(true);
  const [downloading, setDownloading] = useState<"all" | "current" | null>(null);
  const [prefs, setPrefs] = useState<AriaPrefs>({ voice: true, captions: true, speed: "normal" });
  const [spoken, setSpoken] = useState("");
  const [talking, setTalking] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  const guide = CMS_HELP_GUIDE_MAP[activeGuideId] ?? CMS_HELP_GUIDE_MAP.dashboard;
  const step = guide.steps[stepIndex];
  const totalSteps = guide.steps.length;
  const welcome = spokenWelcome(guide.title);
  const intro = spokenGuideIntro(guide.title, guide.summary);
  const stepScript = step ? spokenStepScript(step, stepIndex, totalSteps) : "";
  const script = stepIndex === 0 ? `${welcome} ${intro} ${stepScript}` : stepScript;
  const introStart = welcome.length + 1;
  const stepStart = stepIndex === 0 ? introStart + intro.length + 1 : 0;
  const followAlong = prefs.captions;
  const voiceOn = prefs.voice;
  const stepSpokenChars = followAlong ? Math.max(0, spoken.length - stepStart) : stepScript.length;
  const cue = spokenStepCue(stepIndex);
  const showWelcome = stepIndex === 0 && (!followAlong || spoken.length > 0);
  const showIntro = stepIndex === 0 && (!followAlong || spoken.length >= introStart);
  const showStep = Boolean(step) && (stepIndex > 0 || !followAlong || spoken.length >= stepStart);
  const showVisual = Boolean(step) && (!followAlong || (showStep && stepSpokenChars >= Math.min(cue.length, 24)));
  const showDetails = Boolean(step?.details?.length) && (!followAlong || spoken.toLowerCase().includes("do this with me"));
  const showTip = Boolean(step?.tip) && (!followAlong || spoken.toLowerCase().includes("quick tip from me"));

  const groupedGuides = useMemo(() => {
    const groups = new Map<string, CmsHelpGuide[]>();
    for (const item of CMS_HELP_GUIDES) {
      const list = groups.get(item.group) ?? [];
      list.push(item);
      groups.set(item.group, list);
    }
    return Array.from(groups.entries());
  }, []);

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groupedGuides;

    return groupedGuides
      .map(([group, items]) => [
        group,
        items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.summary.toLowerCase().includes(q) ||
            item.group.toLowerCase().includes(q)
        ),
      ] as const)
      .filter(([, items]) => items.length > 0);
  }, [groupedGuides, query]);

  useEffect(() => {
    setPrefs(getAriaPrefs());
    return () => stopAriaSpeech();
  }, []);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [spoken, showStep, showVisual]);

  useEffect(() => {
    setTyping(true);
    setRevealed(false);
    setSpoken("");
    setTalking(false);
    stopAriaSpeech();
    const delay = followAlong ? 280 : 0;
    const timer = window.setTimeout(() => {
      setTyping(false);
      setRevealed(true);
    }, delay);
    return () => window.clearTimeout(timer);
  }, [activeGuideId, stepIndex, followAlong]);

  useEffect(() => {
    if (typing || !revealed || !step || !script) return;

    if (!voiceOn && !followAlong) {
      setSpoken(script);
      setTalking(false);
      stopAriaSpeech();
      return;
    }

    if (!followAlong) setSpoken(script);
    else setSpoken("");
    setTalking(voiceOn);
    speakAria(script, {
      onProgress: (said) => {
        if (followAlong) setSpoken(said);
      },
      onEnd: () => setTalking(false),
    });
    return () => stopAriaSpeech();
  }, [typing, revealed, step, script, voiceOn, followAlong, prefs.speed]);

  const updatePrefs = (partial: Partial<AriaPrefs>) => {
    setPrefs(setAriaPrefs(partial));
  };

  const handleDownload = async (scope: "all" | "current") => {
    try {
      setDownloading(scope);
      await downloadUserGuidePptx({
        scope,
        guideId: scope === "current" ? guide.id : undefined,
      });
      toast.success(
        scope === "all" ? "Downloaded complete user guide presentation" : `Downloaded ${guide.title} presentation`
      );
    } catch (error) {
      console.error("Failed to export user guide presentation", error);
      toast.error("Failed to download PowerPoint presentation");
    } finally {
      setDownloading(null);
    }
  };

  if (variant === "dock") {
    return (
      <div className="cms-help-dock" aria-label={`${CMS_GUIDE_NAME} live guide`}>
        <div className="cms-help-dock__head">
          <CmsHelpGuideAvatar size="sm" speaking={talking && voiceOn} />
          <div>
            <strong>{CMS_GUIDE_NAME} is guiding you</strong>
            <span>
              {guide.title} · Step {stepIndex + 1} of {totalSteps}
              {!voiceOn ? " · voice off" : talking ? " · speaking" : ""}
            </span>
          </div>
        </div>

        {revealed && step ? (
          <div className="cms-help-dock__body">
            {showVisual ? <CmsHelpStepIllustration step={step} stepTitle={step.title} compact /> : null}
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            {showDetails && step.details && step.details.length > 0 ? (
              <ul>
                {step.details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="cms-help-dock__typing">
            <span />
            <span />
            <span />
          </div>
        )}

        {followAlong ? (
          <CmsHelpLiveCaption fullText={script} spoken={spoken} speaking={talking} variant="dock" />
        ) : null}

        <CmsHelpPlaybackControls prefs={prefs} onChange={updatePrefs} variant="compact" />

        <div className="cms-help-dock__actions">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onBrowse}>
            All topics
          </button>
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onPrev} disabled={stepIndex === 0}>
            Back
          </button>
          <button type="button" className="btn btn-sm btn-primary" onClick={onNext}>
            {stepIndex >= totalSteps - 1 ? "Finish" : "Next"}
          </button>
          <button type="button" className="btn btn-sm btn-link text-secondary" onClick={onClose}>
            End
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="cms-help-assistant__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="CMS Guide Library"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cms-help-assistant" onMouseDown={(event) => event.stopPropagation()}>
        <header className="cms-help-assistant__header">
          <div className="cms-help-assistant__header-copy">
            <CmsHelpGuideAvatar size="md" speaking={talking && voiceOn} />
            <div>
              <p className="cms-help-assistant__kicker">
                {CMS_GUIDE_NAME} · {CMS_GUIDE_ROLE}
              </p>
              <h2>CMS Guide Library</h2>
              <p>Talk through every module with a live walkthrough</p>
            </div>
          </div>
          <div className="cms-help-assistant__header-actions">
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              disabled={downloading !== null}
              onClick={() => handleDownload("current")}
            >
              <i className="fa-solid fa-file-powerpoint me-1" aria-hidden="true" />
              {downloading === "current" ? "Preparing..." : "Download topic"}
            </button>
            <button
              type="button"
              className="btn btn-outline-light btn-sm"
              disabled={downloading !== null}
              onClick={() => handleDownload("all")}
            >
              <i className="fa-solid fa-download me-1" aria-hidden="true" />
              {downloading === "all" ? "Preparing..." : "Download all topics"}
            </button>
            <button type="button" className="btn btn-light btn-sm" onClick={onStartTour}>
              <i className="fa-solid fa-wand-magic-sparkles me-1" aria-hidden="true" />
              Start live tour
            </button>
            <button type="button" className="cms-help-assistant__close" onClick={onClose} aria-label="Close help">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="cms-help-assistant__body">
          <aside className="cms-help-assistant__topics">
            <div className="cms-help-assistant__persona">
              <CmsHelpGuideAvatar size="lg" speaking={talking} />
              <div>
                <strong>{CMS_GUIDE_NAME}</strong>
                <span>
                  {talking && voiceOn
                    ? "Speaking · follow the words"
                    : !voiceOn && !followAlong
                      ? "Read at your own pace"
                      : "Online · ready to walk you through"}
                </span>
              </div>
            </div>

            <div className="cms-help-assistant__search-wrap">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                className="cms-help-assistant__search"
                placeholder="Ask or search a module..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <div className="cms-help-assistant__topic-list">
              {filteredGroups.map(([group, items]) => (
                <div key={group} className="cms-help-assistant__topic-group">
                  <div className="cms-help-assistant__topic-group-label">{group}</div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={`cms-help-assistant__topic-btn${item.id === guide.id ? " is-active" : ""}`}
                      onClick={() => onGuideChange(item.id)}
                    >
                      <i className={item.icon} aria-hidden="true" />
                      <span>{item.title}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </aside>

          <section className="cms-help-assistant__chat">
            <div className="cms-help-assistant__messages" ref={messagesRef}>
              {showWelcome ? (
                <article className="cms-help-assistant__message cms-help-assistant__message--bot cms-help-assistant__message--live">
                  <CmsHelpGuideAvatar size="sm" speaking={talking && spoken.length < introStart} />
                  <div className="cms-help-assistant__bubble">
                    <span className="cms-help-assistant__speaker">{CMS_GUIDE_NAME}</span>
                    <p>
                      <CmsHelpKaraoke
                        text={welcome}
                        spokenChars={followAlong ? Math.min(spoken.length, welcome.length) : welcome.length}
                        hideAhead={followAlong}
                      />
                    </p>
                  </div>
                </article>
              ) : null}

              {showIntro ? (
                <article className="cms-help-assistant__message cms-help-assistant__message--bot cms-help-assistant__message--live">
                  <CmsHelpGuideAvatar size="sm" speaking={talking && spoken.length >= introStart && spoken.length < stepStart} />
                  <div className="cms-help-assistant__bubble cms-help-assistant__bubble--guide">
                    <span className="cms-help-assistant__speaker">{CMS_GUIDE_NAME}</span>
                    <div className="cms-help-assistant__guide-head">
                      <i className={guide.icon} aria-hidden="true" />
                      <div className="cms-help-assistant__guide-text">
                        <strong>{guide.title}</strong>
                        <p>
                          <CmsHelpKaraoke
                            text={intro}
                            spokenChars={followAlong ? Math.max(0, spoken.length - introStart) : intro.length}
                            hideAhead={followAlong}
                          />
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ) : null}

              {typing && followAlong && !showWelcome ? (
                <article className="cms-help-assistant__message cms-help-assistant__message--bot">
                  <CmsHelpGuideAvatar size="sm" speaking />
                  <div className="cms-help-assistant__bubble cms-help-assistant__bubble--typing">
                    <span className="cms-help-assistant__dot" />
                    <span className="cms-help-assistant__dot" />
                    <span className="cms-help-assistant__dot" />
                    <em>Aria is about to speak…</em>
                  </div>
                </article>
              ) : null}

              {showStep && step ? (
                <article className="cms-help-assistant__message cms-help-assistant__message--bot cms-help-assistant__message--live">
                  <CmsHelpGuideAvatar size="sm" speaking={talking && spoken.length >= stepStart} />
                  <div className="cms-help-assistant__bubble cms-help-assistant__bubble--step">
                    <span className="cms-help-assistant__speaker">{CMS_GUIDE_NAME}</span>
                    <div className="cms-help-assistant__step-meta">
                      Step {stepIndex + 1} of {totalSteps} · look here
                    </div>
                    {showVisual ? <CmsHelpStepIllustration step={step} stepTitle={step.title} /> : null}
                    {showVisual ? (
                      <>
                        <h3>{step.title}</h3>
                        <p>{step.body}</p>
                      </>
                    ) : null}
                    {showDetails && step.details && step.details.length > 0 ? (
                      <>
                        <p className="cms-help-assistant__do-this">Do this with me:</p>
                        <ol className="cms-help-assistant__details">
                          {step.details.map((line) => (
                            <li key={line}>{line}</li>
                          ))}
                        </ol>
                      </>
                    ) : null}
                    {showTip && step.tip ? (
                      <div className="cms-help-assistant__tip">
                        <i className="fa-solid fa-lightbulb" aria-hidden="true" />
                        <span>{spokenTip(step.tip)}</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : null}
            </div>

            {followAlong ? (
              <CmsHelpLiveCaption fullText={script} spoken={spoken} speaking={talking} variant="chat" />
            ) : null}

            <CmsHelpPlaybackControls prefs={prefs} onChange={updatePrefs} />

            <footer className="cms-help-assistant__footer">
              <div className="cms-help-assistant__progress" aria-hidden="true">
                {guide.steps.map((_, index) => (
                  <span
                    key={index}
                    className={`cms-help-assistant__progress-dot${index === stepIndex ? " is-active" : ""}${index < stepIndex ? " is-done" : ""}`}
                  />
                ))}
              </div>

              <div className="cms-help-assistant__footer-actions">
                <button
                  type="button"
                  className="btn btn-outline-secondary cms-help-assistant__nav-btn"
                  onClick={onPrev}
                  disabled={stepIndex === 0}
                >
                  <i className="fa-solid fa-arrow-left" aria-hidden="true" />
                  Previous
                </button>
                <button type="button" className="btn btn-primary cms-help-assistant__nav-btn" onClick={onStartTour}>
                  <i className="fa-solid fa-location-crosshairs" aria-hidden="true" />
                  Guide me here
                </button>
                <button
                  type="button"
                  className="btn btn-outline-primary cms-help-assistant__nav-btn"
                  onClick={onNext}
                  disabled={stepIndex >= totalSteps - 1}
                >
                  Next
                  <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                </button>
              </div>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
