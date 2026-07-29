import Link from "next/link";
import { useState } from "react";
import {
  TEMPLATE_GROUPS,
  WEBDESIGN_PACKAGES,
  type TemplateGroup,
  type WebsiteTemplate,
  formatPeso,
} from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import { serviceCardGridClass } from "./serviceCardGridClass";
import TemplatePreviewModal from "./TemplatePreviewModal";
import WebDesignSetupWizard from "./WebDesignSetupWizard";
import styles from "@/styles/services.module.css";

type SetupContext = {
  packageName: string;
  packagePrice: number;
  templateLabel?: string;
  templateId?: string;
};

export default function ServicesWebDesignTab() {
  const { addWebDesignSetupToCart } = useServiceCart();
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewGroup, setPreviewGroup] = useState<TemplateGroup | null>(null);
  const [setupContext, setSetupContext] = useState<SetupContext | null>(null);

  const openPreview = (group: TemplateGroup, template: WebsiteTemplate) => {
    setPreviewGroup(group);
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setPreviewGroup(null);
  };

  const openSetupWizard = (context: SetupContext) => {
    setSetupContext(context);
  };

  const closeSetupWizard = () => {
    setSetupContext(null);
  };

  const handlePreviewContinue = (packageName: string, packagePrice: number) => {
    openSetupWizard({
      packageName,
      packagePrice,
      templateLabel: previewTemplate?.label,
      templateId: previewTemplate?.id,
    });
    closePreview();
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.webdesignWrap}>
        <section className={styles.webdesignHero} aria-label="Web design services overview">
          <div className={styles.webdesignHeroInner}>
            <p className={styles.webdesignEyebrow}>Web Design Services</p>
            <h2 className={styles.webdesignHeroTitle}>Website Templates &amp; Agency Packages</h2>
          </div>
        </section>

        <section className={styles.webdesignContent}>
          <div className={styles.webdesignSectionHead}>
            <h3 className={styles.webdesignSectionTitle}>Website Templates</h3>
            <p className={styles.webdesignSectionHint}>
              Browse Canvas 7 sample designs from our template library. Click any template to preview
              the live layout before choosing your package.
            </p>
          </div>

          {TEMPLATE_GROUPS.map((group) => (
            <section key={group.title} className={styles.webdesignTemplateGroup}>
              <h4 className={styles.webdesignTemplateGroupTitle}>{group.title}</h4>
              <div className={serviceCardGridClass(group.templates.length)}>
                {group.templates.map((template) => (
                  <article key={template.id} className={styles.templateCatalogCard}>
                    <button
                      type="button"
                      className={styles.templateCatalogButton}
                      onClick={() => openPreview(group, template)}
                      aria-label={`Preview ${template.label} template`}
                    >
                      <div className={styles.templateCatalogImageWrap}>
                        <img
                          src={template.image}
                          alt={template.alt}
                          width={400}
                          height={260}
                          loading="lazy"
                          decoding="async"
                          className={styles.templateCatalogImage}
                        />
                        <span className={styles.templateCatalogPreview}>Preview</span>
                      </div>
                      <div className={styles.templateCatalogFooter}>
                        <h5>{template.label}</h5>
                      </div>
                    </button>
                  </article>
                ))}
              </div>
            </section>
          ))}

          <div className={styles.webdesignPackagesSection}>
            <div className={styles.webdesignSectionHead}>
              <h3 className={styles.webdesignSectionTitle}>Agency Web Design Packages</h3>
              <p className={styles.webdesignSectionHint}>
                Start with a mobile-friendly site and upgrade to a paid plan for more business-building
                features.
              </p>
            </div>

            <div className={serviceCardGridClass(WEBDESIGN_PACKAGES.length)}>
              {WEBDESIGN_PACKAGES.map((pkg) => (
                <article key={pkg.id} className={styles.serviceCard}>
                  <div className={styles.serviceCardTop}>
                    <span className={`${styles.serviceCardBadge} ${styles.serviceCardBadgePurple}`}>
                      Agency Code deployment
                    </span>
                    <h4 className={styles.serviceCardTitle}>{pkg.name}</h4>
                    <p className={styles.serviceCardPrice}>
                      {formatPeso(pkg.price)}
                      <span> One-Off Cost</span>
                    </p>
                  </div>
                  <div className={styles.serviceCardBody}>
                    <ul className={styles.serviceCardFeatures}>
                      {pkg.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    className={`${styles.serviceCardBtn} ${styles.serviceCardBtnViolet}`}
                    onClick={() =>
                      openSetupWizard({
                        packageName: pkg.name,
                        packagePrice: pkg.price,
                      })
                    }
                  >
                    + ADD AGENCY PACKAGE
                  </button>
                </article>
              ))}
            </div>
          </div>

          <section className={styles.webdesignCustomQuote}>
            <div className={styles.webdesignCustomQuoteCopy}>
              <span>Bespoke Enterprise Integration</span>
              <h3>Need customized ERP billing or payment gateway loops?</h3>
              <p>
                Our Quezon City systems center compiles special PHP/Node frameworks to align custom
                invoice channels directly with BIR and local standard tax regulations.
              </p>
            </div>
            <Link href="/public/contact-us" className={styles.webdesignCustomQuoteBtn}>
              Technical Intake Form
            </Link>
          </section>
        </section>
      </div>

      <TemplatePreviewModal
        open={Boolean(previewTemplate && previewGroup)}
        template={previewTemplate}
        group={previewGroup}
        onClose={closePreview}
        onContinueSetup={handlePreviewContinue}
      />

      <WebDesignSetupWizard
        open={Boolean(setupContext)}
        packageName={setupContext?.packageName || ""}
        packagePrice={setupContext?.packagePrice || 0}
        templateLabel={setupContext?.templateLabel}
        templateId={setupContext?.templateId}
        onClose={closeSetupWizard}
        onComplete={(selection) => {
          addWebDesignSetupToCart(selection);
          closeSetupWizard();
        }}
      />
    </div>
  );
}
