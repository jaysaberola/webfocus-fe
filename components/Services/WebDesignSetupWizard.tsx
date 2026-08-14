import { useEffect, useMemo, useState } from "react";
import {
  SERVICE_CHECKLIST_ITEMS,
  WEBDESIGN_PAYMENT_METHODS,
  type WebDesignSetupSelection,
} from "@/lib/webDesignSetup";
import { getWebsiteTemplateById } from "@/lib/servicesCatalog";
import styles from "@/styles/services.module.css";

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

export default function WebDesignSetupWizard({
  open,
  packageName,
  packagePrice,
  templateLabel,
  templateId,
  onClose,
  onComplete,
}: WebDesignSetupWizardProps) {
  const [serviceFeatures, setServiceFeatures] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;

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

  const templatePreview = useMemo(
    () => (templateId ? getWebsiteTemplateById(templateId) : null),
    [templateId]
  );

  const resolvedTemplateLabel =
    templatePreview?.template.label || templateLabel || undefined;

  const showPaymentMethods = serviceFeatures.includes("Payment Method");

  const canContinue = useMemo(() => {
    const hasFeatures = serviceFeatures.length > 0;
    const hasPayments = !showPaymentMethods || paymentMethods.length > 0;
    return hasFeatures && hasPayments;
  }, [serviceFeatures, paymentMethods, showPaymentMethods]);

  if (!open) return null;

  const toggleItem = (value: string, list: string[], setter: (next: string[]) => void) => {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  };

  const handleAddToCart = () => {
    if (!canContinue) return;
    onComplete({
      path: "online-services",
      templateLabel: resolvedTemplateLabel,
      templateId,
      packageName,
      packagePrice,
      serviceFeatures,
      paymentMethods,
    });
  };

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
            <h2 id="webdesign-setup-title">Everything starts with a website</h2>
            <p className={styles.setupWizardHint}>
              These are just some of the website features we can help you create, launch, and grow.
              Choose all that apply.
            </p>
            <p className={styles.setupWizardPackageMeta}>
              {resolvedTemplateLabel ? `${resolvedTemplateLabel} · ` : ""}
              {packageName}
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
        </div>

        <div className={styles.setupWizardFooter}>
          <button type="button" className={styles.secondaryBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.primaryBtnInline}
            disabled={!canContinue}
            onClick={handleAddToCart}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
