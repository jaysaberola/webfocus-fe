"use client";

import { useEffect, useMemo, useState } from "react";
import { CMS_HELP_GUIDES, CMS_HELP_GUIDE_MAP, CmsHelpGuide } from "@/lib/cmsHelp/guides";
import { downloadUserGuidePptx } from "@/lib/cmsHelp/downloadUserGuidePptx";
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

const WELCOME_MESSAGE =
  "Hi! I'm your CMS Guide. I'll walk you through every part of the screen — sidebar, toolbar, table, buttons, and forms — one step at a time. Follow the highlighted areas and read each bullet carefully.";

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

  const guide = CMS_HELP_GUIDE_MAP[activeGuideId] ?? CMS_HELP_GUIDE_MAP.dashboard;
  const step = guide.steps[stepIndex];
  const totalSteps = guide.steps.length;

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
    setTyping(true);
    setRevealed(false);
    const timer = window.setTimeout(() => {
      setTyping(false);
      setRevealed(true);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [activeGuideId, stepIndex]);

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
      <div className="cms-help-dock" aria-label="CMS live guide">
        <div className="cms-help-dock__head">
          <span className="cms-help-dock__bot">
            <i className="fa-solid fa-robot" aria-hidden="true" />
          </span>
          <div>
            <strong>{guide.title}</strong>
            <span>Live guide · Step {stepIndex + 1} of {totalSteps}</span>
          </div>
        </div>

        {revealed && step ? (
          <div className="cms-help-dock__body">
            <CmsHelpStepIllustration step={step} stepTitle={step.title} compact />
            <h3>{step.title}</h3>
            <p>{step.body}</p>
            {step.details && step.details.length > 0 ? (
              <ul>
                {step.details.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : (
          <div className="cms-help-dock__typing">
            <span /><span /><span />
          </div>
        )}

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
      aria-label="CMS Help Guide"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cms-help-assistant" onMouseDown={(event) => event.stopPropagation()}>
        <header className="cms-help-assistant__header">
          <div className="cms-help-assistant__header-copy">
            <span className="cms-help-assistant__bot-icon" aria-hidden="true">
              <i className="fa-solid fa-robot" />
            </span>
            <div>
              <h2>CMS Guide Library</h2>
              <p>Browse detailed guides for every module</p>
            </div>
          </div>
          <div className="cms-help-assistant__header-actions">
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              disabled={downloading !== null}
              onClick={() => handleDownload("current")}
            >
              <i className="fa-solid fa-file-powerpoint me-1" aria-hidden="true" />
              {downloading === "current" ? "Preparing..." : "Download topic"}
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm"
              disabled={downloading !== null}
              onClick={() => handleDownload("all")}
            >
              <i className="fa-solid fa-download me-1" aria-hidden="true" />
              {downloading === "all" ? "Preparing..." : "Download all topics"}
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={onStartTour}>
              <i className="fa-solid fa-location-crosshairs me-1" aria-hidden="true" />
              Start live tour
            </button>
            <button type="button" className="cms-help-assistant__close" onClick={onClose} aria-label="Close help">
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="cms-help-assistant__body">
          <aside className="cms-help-assistant__topics">
            <div className="cms-help-assistant__search-wrap">
              <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
              <input
                type="search"
                className="cms-help-assistant__search"
                placeholder="Search modules..."
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
            <div className="cms-help-assistant__messages">
              <article className="cms-help-assistant__message cms-help-assistant__message--bot">
                <span className="cms-help-assistant__message-avatar" aria-hidden="true">
                  <i className="fa-solid fa-robot" />
                </span>
                <div className="cms-help-assistant__bubble">
                  <p>{WELCOME_MESSAGE}</p>
                </div>
              </article>

              <article className="cms-help-assistant__message cms-help-assistant__message--bot">
                <span className="cms-help-assistant__message-avatar" aria-hidden="true">
                  <i className="fa-solid fa-robot" />
                </span>
                <div className="cms-help-assistant__bubble cms-help-assistant__bubble--guide">
                  <div className="cms-help-assistant__guide-head">
                    <i className={guide.icon} aria-hidden="true" />
                    <div>
                      <strong>{guide.title}</strong>
                      <span>{guide.summary}</span>
                    </div>
                  </div>
                </div>
              </article>

              {typing ? (
                <article className="cms-help-assistant__message cms-help-assistant__message--bot">
                  <span className="cms-help-assistant__message-avatar" aria-hidden="true">
                    <i className="fa-solid fa-robot" />
                  </span>
                  <div className="cms-help-assistant__bubble cms-help-assistant__bubble--typing">
                    <span className="cms-help-assistant__dot" />
                    <span className="cms-help-assistant__dot" />
                    <span className="cms-help-assistant__dot" />
                  </div>
                </article>
              ) : revealed && step ? (
                <article className="cms-help-assistant__message cms-help-assistant__message--bot">
                  <span className="cms-help-assistant__message-avatar" aria-hidden="true">
                    <i className="fa-solid fa-robot" />
                  </span>
                  <div className="cms-help-assistant__bubble cms-help-assistant__bubble--step">
                    <div className="cms-help-assistant__step-meta">
                      Step {stepIndex + 1} of {totalSteps}
                    </div>
                    <CmsHelpStepIllustration step={step} stepTitle={step.title} />
                    <h3>{step.title}</h3>
                    <p>{step.body}</p>
                    {step.details && step.details.length > 0 ? (
                      <ul className="cms-help-assistant__details">
                        {step.details.map((line) => (
                          <li key={line}>{line}</li>
                        ))}
                      </ul>
                    ) : null}
                    {step.tip ? (
                      <div className="cms-help-assistant__tip">
                        <i className="fa-solid fa-lightbulb" aria-hidden="true" />
                        <span>{step.tip}</span>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : null}
            </div>

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
                <button
                  type="button"
                  className="btn btn-primary cms-help-assistant__nav-btn"
                  onClick={onStartTour}
                >
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
