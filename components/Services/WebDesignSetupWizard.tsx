import { useEffect, useMemo, useState } from "react";
import {
  SERVICE_CHECKLIST_ITEMS,
  WEBDESIGN_PAYMENT_METHODS,
  type WebDesignFeaturePath,
  type WebDesignSetupSelection,
} from "@/lib/webDesignSetup";
import { formatPeso, getWebsiteTemplateById, resolveTemplateGroupForPackage } from "@/lib/servicesCatalog";
import {
  TEMPLATE_NAV_NEXT_ICON,
  TEMPLATE_NAV_PREV_ICON,
  templateSlideClass,
  type TemplateSlideDirection,
} from "@/lib/templateNav";
import { openCanvas7TemplatePreview } from "@/lib/canvasTemplateCatalog";
import styles from "@/styles/services.module.css";

type WizardStep = "choose-path" | "preview-template" | "configure";

type WebDesignSetupWizardProps = {
  open: boolean;
  packageId?: string;
  packageName: string;
  packagePrice: number;
  templateLabel?: string;
  templateId?: string;
  onClose: () => void;
  onComplete: (selection: WebDesignSetupSelection) => void;
};

const FEATURE_PATH_OPTIONS: Array<{
  path: WebDesignFeaturePath;
  title: string;
  description?: string;
  icon: string;
}> = [
  {
    path: "member-portal",
    title: "Selected website template",
    description:
      "Preview sample designs linked to your package, view the live layout, and confirm your chosen template before checkout.",
    icon: "fa-solid fa-image",
  },
  {
    path: "online-services",
    title: "Online service checklist",
    description:
      "Pick the exact online modules you need—dashboard, mailing list, registration, billing, forums, events, and more.",
    icon: "fa-solid fa-list-check",
  },
];

export default function WebDesignSetupWizard({
  open,
  packageId,
  packageName,
  packagePrice,
  templateLabel,
  templateId,
  onClose,
  onComplete,
}: WebDesignSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>("choose-path");
  const [selectedPath, setSelectedPath] = useState<WebDesignFeaturePath | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(templateId);
  const [templateSlideDirection, setTemplateSlideDirection] = useState<TemplateSlideDirection>("next");
  const [serviceFeatures, setServiceFeatures] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    setStep("choose-path");
    setSelectedPath(null);
    setSelectedTemplateId(templateId);
    setTemplateSlideDirection("next");
    setServiceFeatures([]);
    setPaymentMethods([]);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, templateId]);

  const packageGroup = useMemo(
    () => resolveTemplateGroupForPackage({ packageId, packageName }),
    [packageId, packageName]
  );

  const templatePreview = useMemo(
    () => (selectedTemplateId ? getWebsiteTemplateById(selectedTemplateId) : null),
    [selectedTemplateId]
  );

  const showTemplateNav = Boolean(
    packageGroup && packageGroup.templates.length > 1 && step === "preview-template"
  );

  const selectedTemplateIndex = useMemo(() => {
    if (!packageGroup || !selectedTemplateId) return 0;
    const index = packageGroup.templates.findIndex((item) => item.id === selectedTemplateId);
    return index >= 0 ? index : 0;
  }, [packageGroup, selectedTemplateId]);

  const navigateTemplate = (direction: TemplateSlideDirection) => {
    if (!packageGroup?.templates.length) return;
    setTemplateSlideDirection(direction);
    const total = packageGroup.templates.length;
    const nextIndex =
      direction === "next"
        ? (selectedTemplateIndex + 1) % total
        : (selectedTemplateIndex - 1 + total) % total;
    setSelectedTemplateId(packageGroup.templates[nextIndex].id);
  };

  const showPaymentMethods = useMemo(
    () => selectedPath === "online-services" && serviceFeatures.includes("Payment Method"),
    [selectedPath, serviceFeatures]
  );

  const canContinue = useMemo(() => {
    if (step === "choose-path") return Boolean(selectedPath);
    if (step === "preview-template") {
      if (!packageGroup?.templates.length) return Boolean(selectedPath);
      return Boolean(selectedPath && selectedTemplateId && templatePreview);
    }
    const hasFeatures = serviceFeatures.length > 0;
    const hasPayments = !showPaymentMethods || paymentMethods.length > 0;
    return hasFeatures && hasPayments;
  }, [step, selectedPath, selectedTemplateId, templatePreview, packageGroup, serviceFeatures, paymentMethods, showPaymentMethods]);

  if (!open) return null;

  const toggleItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const handlePathSelect = (path: WebDesignFeaturePath) => {
    setSelectedPath(path);
    setServiceFeatures([]);
    setPaymentMethods([]);
  };

  const handleContinue = () => {
    if (step === "choose-path" && selectedPath === "member-portal") {
      if (!selectedTemplateId && packageGroup?.templates[0]) {
        setSelectedTemplateId(packageGroup.templates[0].id);
      }
      setStep("preview-template");
      return;
    }

    if (step === "preview-template" && selectedPath === "member-portal") {
      onComplete({
        path: "member-portal",
        templateLabel: templatePreview?.template.label ?? templateLabel,
        templateId: selectedTemplateId,
        packageName,
        packagePrice,
        serviceFeatures: ["Selected website template"],
        paymentMethods: [],
      });
      return;
    }

    if (step === "choose-path" && selectedPath === "online-services") {
      setStep("configure");
      return;
    }

    if (step === "configure" && selectedPath === "online-services") {
      onComplete({
        path: "online-services",
        templateLabel,
        templateId,
        packageName,
        packagePrice,
        serviceFeatures,
        paymentMethods,
      });
    }
  };

  const handleBack = () => {
    if (step === "configure" || step === "preview-template") {
      setStep("choose-path");
      return;
    }
    onClose();
  };

  const stepTitle =
    step === "choose-path"
      ? "What are some features your website needs?"
      : step === "preview-template"
        ? "Review your selected template"
        : "Select the online service features you need";

  const stepHint =
    step === "choose-path"
      ? "We use this to recommend the right portal tools and setup for your package."
      : step === "preview-template"
        ? "Confirm the template you chose before adding this package to your cart."
        : "Choose all items that apply. You can select multiple options.";

  return (
    <div className={styles.setupWizardOverlay} role="presentation">
      <button
        type="button"
        className={styles.setupWizardBackdrop}
        aria-label="Close setup"
        onClick={onClose}
      />
      <div
        className={styles.setupWizardDialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="webdesign-setup-title"
      >
        <div className={styles.setupWizardHeader}>
          <div>
            <p className={styles.setupWizardKicker}>Package setup</p>
            <h2 id="webdesign-setup-title">{stepTitle}</h2>
            <p className={styles.setupWizardHint}>{stepHint}</p>
            <p className={styles.setupWizardPackageMeta}>
              {templatePreview?.template.label || templateLabel
                ? `${templatePreview?.template.label || templateLabel} · `
                : ""}
              {packageName} · {formatPeso(packagePrice)} one-off
            </p>
          </div>
          <button
            type="button"
            className={styles.setupWizardClose}
            aria-label="Close setup"
            onClick={onClose}
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <div className={styles.setupWizardBody}>
          {step === "choose-path" ? (
            <div className={styles.setupWizardChoiceGrid}>
              {FEATURE_PATH_OPTIONS.map((option) => {
                const active = selectedPath === option.path;
                return (
                  <button
                    key={option.path}
                    type="button"
                    className={
                      active
                        ? `${styles.setupWizardChoiceCard} ${styles.setupWizardChoiceCardActive}`
                        : styles.setupWizardChoiceCard
                    }
                    onClick={() => handlePathSelect(option.path)}
                    aria-pressed={active}
                  >
                    <span className={styles.setupWizardChoiceIcon} aria-hidden="true">
                      <i className={option.icon} />
                    </span>
                    <div className={styles.setupWizardChoiceContent}>
                      <strong>{option.title}</strong>
                      {option.description ? (
                        <span className={styles.setupWizardChoiceDescription}>{option.description}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : step === "preview-template" ? (
            <div className={styles.setupWizardTemplatePreview}>
              {showTemplateNav ? (
                <div className={styles.setupWizardTemplateNav}>
                  <button
                    type="button"
                    className={styles.setupWizardTemplateNavBtn}
                    onClick={() => navigateTemplate("prev")}
                    aria-label="Previous template"
                  >
                    <i className={TEMPLATE_NAV_PREV_ICON} aria-hidden="true" />
                    Previous
                  </button>
                  <span className={styles.setupWizardTemplateNavCounter}>
                    {selectedTemplateIndex + 1} / {packageGroup?.templates.length}
                  </span>
                  <button
                    type="button"
                    className={styles.setupWizardTemplateNavBtn}
                    onClick={() => navigateTemplate("next")}
                    aria-label="Next template"
                  >
                    Next
                    <i className={TEMPLATE_NAV_NEXT_ICON} aria-hidden="true" />
                  </button>
                </div>
              ) : null}
              {templatePreview ? (
                <div
                  key={selectedTemplateId}
                  className={`${styles.setupWizardTemplatePreviewContent} ${templateSlideClass(styles, templateSlideDirection)}`}
                >
                  <div className={styles.setupWizardTemplateFrame}>
                    <img
                      src={templatePreview.template.image}
                      alt={templatePreview.template.alt}
                      className={styles.setupWizardTemplateImage}
                    />
                  </div>
                  <div className={styles.setupWizardTemplateMeta}>
                    <p className={styles.setupWizardTemplateGroup}>{templatePreview.group.title}</p>
                    <h3>{templatePreview.template.label}</h3>
                    <p>{templatePreview.template.summary}</p>
                    <button
                      type="button"
                      className={styles.setupWizardTemplateViewBtn}
                      onClick={() => openCanvas7TemplatePreview(templatePreview.template.previewUrl)}
                    >
                      View live template
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.setupWizardTemplateFallback}>
                  <h3>{packageName}</h3>
                  <p>
                    {packageGroup?.templates.length
                      ? "Use previous and next to browse sample templates for this package."
                      : "No template preview is linked to this package yet. You can still add the agency package to your cart."}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className={styles.setupWizardChecklist}>
                {SERVICE_CHECKLIST_ITEMS.map((item) => {
                  const checked = serviceFeatures.includes(item);
                  return (
                    <label
                      key={item}
                      className={
                        checked
                          ? `${styles.setupWizardCheckItem} ${styles.setupWizardCheckItemActive}`
                          : styles.setupWizardCheckItem
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleItem(item, serviceFeatures, setServiceFeatures)}
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>

              {showPaymentMethods ? (
                <div className={styles.setupWizardSubsection}>
                  <h3>Payment methods</h3>
                  <p>Select all payment options your members should be able to use.</p>
                  <div className={styles.setupWizardChecklist}>
                    {WEBDESIGN_PAYMENT_METHODS.map((method) => {
                      const checked = paymentMethods.includes(method.id);
                      return (
                        <label
                          key={method.id}
                          className={
                            checked
                              ? `${styles.setupWizardCheckItem} ${styles.setupWizardCheckItemActive}`
                              : styles.setupWizardCheckItem
                          }
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleItem(method.id, paymentMethods, setPaymentMethods)}
                          />
                          <span>{method.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className={styles.setupWizardFooter}>
          <button type="button" className={styles.secondaryBtn} onClick={handleBack}>
            {step === "choose-path" ? "Cancel" : "Back"}
          </button>
          <button
            type="button"
            className={styles.primaryBtnInline}
            disabled={!canContinue}
            onClick={handleContinue}
          >
            {step === "configure" || step === "preview-template"
              ? "Add to Cart"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
