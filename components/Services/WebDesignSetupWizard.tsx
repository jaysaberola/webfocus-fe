import { useEffect, useMemo, useState } from "react";
import {
  APPOINTMENT_FEATURE_ITEMS,
  SERVICE_CHECKLIST_ITEMS,
  WEBDESIGN_PAYMENT_METHODS,
  formatWebDesignSetupDetail,
  type WebDesignFeaturePath,
  type WebDesignSetupSelection,
} from "@/lib/webDesignSetup";
import { formatPeso } from "@/lib/servicesCatalog";
import styles from "@/styles/services.module.css";

type WizardStep = "choose-path" | "configure";

type WebDesignSetupWizardProps = {
  open: boolean;
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
  description: string;
  icon: string;
}> = [
  {
    path: "service-checklist",
    title: "Member portal & services",
    description:
      "Build a member site with dashboards, registration, billing, forums, events, and more.",
    icon: "fa-solid fa-users-gear",
  },
  {
    path: "book-appointments",
    title: "Book appointments online",
    description:
      "Let visitors schedule services online with calendars, reminders, and optional payments.",
    icon: "fa-solid fa-calendar-check",
  },
];

export default function WebDesignSetupWizard({
  open,
  packageName,
  packagePrice,
  templateLabel,
  templateId,
  onClose,
  onComplete,
}: WebDesignSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>("choose-path");
  const [selectedPath, setSelectedPath] = useState<WebDesignFeaturePath | null>(null);
  const [serviceFeatures, setServiceFeatures] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [appointmentFeatures, setAppointmentFeatures] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

    setStep("choose-path");
    setSelectedPath(null);
    setServiceFeatures([]);
    setPaymentMethods([]);
    setAppointmentFeatures([]);

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
  }, [open, onClose]);

  const showPaymentMethods = useMemo(
    () => selectedPath === "service-checklist" && serviceFeatures.includes("Payment Method"),
    [selectedPath, serviceFeatures]
  );

  const canContinue = useMemo(() => {
    if (step === "choose-path") return Boolean(selectedPath);
    if (selectedPath === "service-checklist") {
      const hasFeatures = serviceFeatures.length > 0;
      const hasPayments = !showPaymentMethods || paymentMethods.length > 0;
      return hasFeatures && hasPayments;
    }
    return appointmentFeatures.length > 0;
  }, [
    step,
    selectedPath,
    serviceFeatures,
    paymentMethods,
    appointmentFeatures,
    showPaymentMethods,
  ]);

  if (!open) return null;

  const toggleItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const handlePathSelect = (path: WebDesignFeaturePath) => {
    setSelectedPath(path);
    setServiceFeatures([]);
    setPaymentMethods([]);
    setAppointmentFeatures([]);
  };

  const handleContinue = () => {
    if (step === "choose-path" && selectedPath) {
      setStep("configure");
      return;
    }

    if (!selectedPath) return;

    onComplete({
      path: selectedPath,
      templateLabel,
      templateId,
      packageName,
      packagePrice,
      serviceFeatures,
      paymentMethods,
      appointmentFeatures,
    });
  };

  const handleBack = () => {
    if (step === "configure") {
      setStep("choose-path");
      return;
    }
    onClose();
  };

  const stepTitle =
    step === "choose-path"
      ? "What are some features your website needs?"
      : selectedPath === "service-checklist"
        ? "Select the service features you need"
        : "What do you need for online booking?";

  const stepHint =
    step === "choose-path"
      ? "We use this to recommend the right portal tools and setup for your package."
      : selectedPath === "service-checklist"
        ? "Choose all items that apply. You can select multiple options."
        : "Choose the booking tools your site should include.";

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
              {templateLabel ? `${templateLabel} · ` : ""}
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
                    <strong>{option.title}</strong>
                    <span>{option.description}</span>
                  </button>
                );
              })}
            </div>
          ) : selectedPath === "service-checklist" ? (
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
          ) : (
            <div className={styles.setupWizardChecklist}>
              {APPOINTMENT_FEATURE_ITEMS.map((item) => {
                const checked = appointmentFeatures.includes(item);
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
                      onChange={() => toggleItem(item, appointmentFeatures, setAppointmentFeatures)}
                    />
                    <span>{item}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className={styles.setupWizardFooter}>
          <button type="button" className={styles.secondaryBtn} onClick={handleBack}>
            {step === "configure" ? "Back" : "Cancel"}
          </button>
          <button
            type="button"
            className={styles.primaryBtnInline}
            disabled={!canContinue}
            onClick={handleContinue}
          >
            {step === "configure" ? "Add Package to Cart" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
