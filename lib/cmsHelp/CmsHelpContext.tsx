"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { useRouter } from "next/router";
import CmsHelpAssistant from "@/components/Help/CmsHelpAssistant";
import CmsHelpTourOverlay from "@/components/Help/CmsHelpTourOverlay";
import { CMS_HELP_GUIDE_MAP } from "@/lib/cmsHelp/guides";
import { resolveGuideIdFromPath } from "@/lib/cmsHelp/resolveGuide";
import { pathMatchesRoute } from "@/lib/cmsHelp/tourSelectors";

type CmsHelpMode = "closed" | "tour" | "browse";

type CmsHelpContextValue = {
  isOpen: boolean;
  mode: CmsHelpMode;
  activeGuideId: string;
  stepIndex: number;
  openHelp: (guideId?: string) => void;
  openBrowse: (guideId?: string) => void;
  closeHelp: () => void;
  setActiveGuideId: (guideId: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
};

const CmsHelpContext = createContext<CmsHelpContextValue | null>(null);

export function CmsHelpProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mode, setMode] = useState<CmsHelpMode>("closed");
  const [activeGuideId, setActiveGuideId] = useState("dashboard");
  const [stepIndex, setStepIndex] = useState(0);

  const guide = CMS_HELP_GUIDE_MAP[activeGuideId] ?? CMS_HELP_GUIDE_MAP.dashboard;
  const currentStep = guide.steps[stepIndex] ?? null;

  const openHelp = useCallback(
    (guideId?: string) => {
      const nextId = guideId ?? resolveGuideIdFromPath(router.pathname);
      setActiveGuideId(nextId);
      setStepIndex(0);
      setMode("tour");
    },
    [router.pathname]
  );

  const openBrowse = useCallback(
    (guideId?: string) => {
      const nextId = guideId ?? activeGuideId;
      setActiveGuideId(nextId);
      setMode("browse");
    },
    [activeGuideId]
  );

  const closeHelp = useCallback(() => {
    setMode("closed");
    setStepIndex(0);
  }, []);

  const nextStep = useCallback(() => {
    setStepIndex((value) => Math.min(value + 1, guide.steps.length - 1));
  }, [guide.steps.length]);

  const prevStep = useCallback(() => {
    setStepIndex((value) => Math.max(value - 1, 0));
  }, []);

  const goToStep = useCallback((index: number) => {
    setStepIndex(Math.max(0, index));
  }, []);

  const handleGuideChange = useCallback((guideId: string) => {
    setActiveGuideId(guideId);
    setStepIndex(0);
    if (mode === "closed") setMode("tour");
  }, [mode]);

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
      openHelp,
      openBrowse,
      closeHelp,
      setActiveGuideId: handleGuideChange,
      nextStep,
      prevStep,
      goToStep,
    }),
    [
      mode,
      activeGuideId,
      stepIndex,
      openHelp,
      openBrowse,
      closeHelp,
      handleGuideChange,
      nextStep,
      prevStep,
      goToStep,
    ]
  );

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
          onNext={() => {
            if (stepIndex >= guide.steps.length - 1) closeHelp();
            else nextStep();
          }}
          onPrev={prevStep}
          onClose={closeHelp}
          onBrowseTopics={() => openBrowse(activeGuideId)}
          needsNavigation={needsNavigation}
          onNavigate={navigateForStep}
        />
      ) : null}

      {mode === "browse" ? (
        <CmsHelpAssistant
          variant="modal"
          activeGuideId={activeGuideId}
          stepIndex={stepIndex}
          onGuideChange={handleGuideChange}
          onClose={closeHelp}
          onStartTour={() => {
            setStepIndex(0);
            setMode("tour");
          }}
          onNext={nextStep}
          onPrev={prevStep}
        />
      ) : null}
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
