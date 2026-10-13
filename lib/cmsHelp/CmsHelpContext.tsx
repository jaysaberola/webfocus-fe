"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import CmsHelpAssistant from "@/components/Help/CmsHelpAssistant";
import CmsHelpLauncher from "@/components/Help/CmsHelpLauncher";
import CmsHelpTourOverlay from "@/components/Help/CmsHelpTourOverlay";
import { CMS_HELP_GUIDES, CMS_HELP_GUIDE_MAP } from "@/lib/cmsHelp/guides";
import { resolveGuideIdFromPath } from "@/lib/cmsHelp/resolveGuide";
import { pathMatchesRoute } from "@/lib/cmsHelp/tourSelectors";
import {
  fetchCmsGuideProgress,
  saveCmsGuideProgress,
  type CmsGuideProgress,
  type CmsGuideProgressStatus,
} from "@/services/cmsHelpProgressService";

type CmsHelpMode = "closed" | "tour" | "browse";

type CmsHelpContextValue = {
  isOpen: boolean;
  mode: CmsHelpMode;
  activeGuideId: string;
  stepIndex: number;
  progress: Record<string, CmsGuideProgress>;
  openHelp: (guideId?: string) => void;
  openBrowse: (guideId?: string) => void;
  closeHelp: () => void;
  setActiveGuideId: (guideId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  replayGuide: (guideId?: string) => void;
};

const CmsHelpContext = createContext<CmsHelpContextValue | null>(null);

function autoDismissKey(guideId: string) {
  return `cms-help-auto:${guideId}`;
}

export function CmsHelpProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mode, setMode] = useState<CmsHelpMode>("closed");
  const [activeGuideId, setActiveGuideId] = useState("dashboard");
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState<Record<string, CmsGuideProgress>>({});
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const saveTimer = useRef<number | null>(null);
  const autoPlayRef = useRef(false);
  const chainRef = useRef(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  autoPlayRef.current = autoPlay;

  const guide = CMS_HELP_GUIDE_MAP[activeGuideId] ?? CMS_HELP_GUIDE_MAP.dashboard;
  const currentStep = guide.steps[stepIndex] ?? null;

  const remember = useCallback((guideId: string, status: CmsGuideProgressStatus, nextStepIndex: number) => {
    const row: CmsGuideProgress = { guideId, status, stepIndex: nextStepIndex };
    setProgress((current) => ({ ...current, [guideId]: row }));
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void saveCmsGuideProgress(guideId, { status, stepIndex: nextStepIndex }).catch(() => {});
    }, 250);
  }, []);

  useEffect(() => {
    let alive = true;
    fetchCmsGuideProgress()
      .then((rows) => {
        if (!alive) return;
        const map: Record<string, CmsGuideProgress> = {};
        for (const row of rows) map[row.guideId] = row;
        setProgress(map);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setProgressLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!router.isReady || !progressLoaded || mode !== "closed") return;
    const guideId = resolveGuideIdFromPath(router.pathname);
    if (!CMS_HELP_GUIDE_MAP[guideId]) return;
    const row = progress[guideId];
    if (row?.status === "completed") return;
    if (typeof window !== "undefined" && window.sessionStorage.getItem(autoDismissKey(guideId))) return;
    window.sessionStorage.setItem(autoDismissKey(guideId), "1");
    const startAt = Math.max(0, row?.stepIndex ?? 0);
    chainRef.current = true;
    autoPlayRef.current = true;
    setAutoPlay(true);
    setActiveGuideId(guideId);
    setStepIndex(startAt);
    setMode("tour");
    remember(guideId, "in_progress", startAt);
  }, [router.isReady, router.pathname, progressLoaded, mode, progress, remember]);

  const openHelp = useCallback(
    (guideId?: string) => {
      const nextId = guideId ?? resolveGuideIdFromPath(router.pathname);
      const saved = progress[nextId];
      const startAt = saved?.status === "completed" ? 0 : Math.max(0, saved?.stepIndex ?? 0);
      setActiveGuideId(nextId);
      setStepIndex(startAt);
      setMode("tour");
      remember(nextId, "in_progress", startAt);
    },
    [progress, remember, router.pathname]
  );

  const openBrowse = useCallback(
    (guideId?: string) => {
      const nextId = guideId ?? activeGuideId;
      const saved = progress[nextId];
      setActiveGuideId(nextId);
      if (saved && saved.status !== "completed") setStepIndex(Math.max(0, saved.stepIndex));
      setMode("browse");
    },
    [activeGuideId, progress]
  );

  const closeHelp = useCallback(() => {
    chainRef.current = false;
    autoPlayRef.current = false;
    setAutoPlay(false);
    if (mode !== "closed") {
      const existing = progress[activeGuideId];
      if (existing?.status !== "completed") {
        remember(activeGuideId, "in_progress", stepIndex);
      }
    }
    setMode("closed");
  }, [activeGuideId, mode, progress, remember, stepIndex]);

  const finishOrAdvance = useCallback(
    (fromIndex: number) => {
      if (fromIndex >= guide.steps.length - 1) {
        remember(activeGuideId, "completed", guide.steps.length - 1);
        if (chainRef.current && autoPlayRef.current) {
          const nextGuide = CMS_HELP_GUIDES.find(
            (item) => item.id !== activeGuideId && progressRef.current[item.id]?.status !== "completed"
          );
          if (nextGuide) {
            setActiveGuideId(nextGuide.id);
            setStepIndex(0);
            remember(nextGuide.id, "in_progress", 0);
            const route = nextGuide.steps[0]?.route;
            if (route) void router.push(route);
            return;
          }
        }
        chainRef.current = false;
        autoPlayRef.current = false;
        setAutoPlay(false);
        setMode("closed");
        setStepIndex(0);
        return;
      }
      const next = fromIndex + 1;
      setStepIndex(next);
      remember(activeGuideId, "in_progress", next);
    },
    [activeGuideId, guide.steps.length, remember, router]
  );

  const nextStep = useCallback(() => {
    finishOrAdvance(stepIndex);
  }, [finishOrAdvance, stepIndex]);

  const prevStep = useCallback(() => {
    setStepIndex((value) => {
      const next = Math.max(value - 1, 0);
      remember(activeGuideId, progress[activeGuideId]?.status === "completed" ? "completed" : "in_progress", next);
      return next;
    });
  }, [activeGuideId, progress, remember]);

  const goToStep = useCallback(
    (index: number) => {
      const next = Math.max(0, index);
      setStepIndex(next);
      remember(activeGuideId, "in_progress", next);
    },
    [activeGuideId, remember]
  );

  const handleGuideChange = useCallback(
    (guideId: string) => {
      const saved = progress[guideId];
      setActiveGuideId(guideId);
      setStepIndex(saved && saved.status !== "completed" ? Math.max(0, saved.stepIndex) : 0);
      if (mode === "closed") setMode("browse");
    },
    [mode, progress]
  );

  const replayGuide = useCallback(
    (guideId?: string) => {
      const nextId = guideId ?? activeGuideId;
      setActiveGuideId(nextId);
      setStepIndex(0);
      setMode("tour");
      remember(nextId, "in_progress", 0);
    },
    [activeGuideId, remember]
  );

  const needsNavigation = Boolean(
    currentStep?.route && !pathMatchesRoute(router.pathname, currentStep.route)
  );

  const navigateForStep = useCallback(async () => {
    if (!currentStep?.route) return;
    await router.push(currentStep.route);
  }, [currentStep?.route, router]);

  const value = useMemo(
    () => ({
      isOpen: mode !== "closed",
      mode,
      activeGuideId,
      stepIndex,
      progress,
      openHelp,
      openBrowse,
      closeHelp,
      setActiveGuideId: handleGuideChange,
      nextStep,
      prevStep,
      goToStep,
      replayGuide,
    }),
    [
      mode,
      activeGuideId,
      stepIndex,
      progress,
      openHelp,
      openBrowse,
      closeHelp,
      handleGuideChange,
      nextStep,
      prevStep,
      goToStep,
      replayGuide,
    ]
  );

  const completedCount = CMS_HELP_GUIDES.filter((item) => progress[item.id]?.status === "completed").length;

  return (
    <CmsHelpContext.Provider value={value}>
      {children}

      {mode === "tour" ? (
        <CmsHelpTourOverlay
          key={`${activeGuideId}-${stepIndex}-${router.pathname}`}
          guideTitle={guide.title}
          guideIcon={guide.icon}
          step={currentStep}
          stepIndex={stepIndex}
          totalSteps={guide.steps.length}
          onNext={() => finishOrAdvance(stepIndex)}
          onPrev={prevStep}
          onClose={closeHelp}
          onBrowseTopics={() => openBrowse(activeGuideId)}
          needsNavigation={needsNavigation}
          onNavigate={navigateForStep}
          autoPlay={autoPlay}
          onAutoAdvance={() => finishOrAdvance(stepIndex)}
          onToggleAutoPlay={() => {
            setAutoPlay((current) => {
              const next = !current;
              autoPlayRef.current = next;
              if (!next) chainRef.current = false;
              return next;
            });
          }}
        />
      ) : null}

      {mode === "browse" ? (
        <CmsHelpAssistant
          variant="modal"
          activeGuideId={activeGuideId}
          stepIndex={stepIndex}
          progress={progress}
          completedCount={completedCount}
          totalGuides={CMS_HELP_GUIDES.length}
          onGuideChange={handleGuideChange}
          onClose={closeHelp}
          onStartTour={() => openHelp(activeGuideId)}
          onReplay={() => replayGuide(activeGuideId)}
          onNext={nextStep}
          onPrev={prevStep}
        />
      ) : null}

      <CmsHelpLauncher />
    </CmsHelpContext.Provider>
  );
}

export function useCmsHelp() {
  const context = useContext(CmsHelpContext);
  if (!context) {
    throw new Error("useCmsHelp must be used within CmsHelpProvider");
  }
  return context;
}
