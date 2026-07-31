import Link from "next/link";
import { useState } from "react";
import type { TemplateSlideDirection } from "@/lib/templateNav";
import {
  TEMPLATE_GROUPS,
  WEBDESIGN_PACKAGES,
  type TemplateGroup,
  type WebsiteTemplate,
} from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import { serviceCardGridClass } from "./serviceCardGridClass";
import TemplateCatalogCarousel from "./TemplateCatalogCarousel";
import TemplatePreviewModal from "./TemplatePreviewModal";
import WebDesignSetupWizard from "./WebDesignSetupWizard";
import styles from "@/styles/services.module.css";

type SetupContext = {
  packageId?: string;
  packageName: string;
  packagePrice: number;
  templateLabel?: string;
  templateId?: string;
};

export default function ServicesWebDesignTab() {
  const { addWebDesignSetupToCart } = useServiceCart();
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewGroup, setPreviewGroup] = useState<TemplateGroup | null>(null);
  const [previewSlideDirection, setPreviewSlideDirection] = useState<TemplateSlideDirection>("next");
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

  const navigatePreview = (direction: TemplateSlideDirection) => {
    if (!previewGroup || !previewTemplate) return;
    setPreviewSlideDirection(direction);
    const currentIndex = previewGroup.templates.findIndex((item) => item.id === previewTemplate.id);
    if (currentIndex < 0) return;
    const total = previewGroup.templates.length;
    const nextIndex =
      direction === "next" ? (currentIndex + 1) % total : (currentIndex - 1 + total) % total;
    setPreviewTemplate(previewGroup.templates[nextIndex]);
  };

  const handlePreviewContinue = (packageName: string, packagePrice: number) => {
    openSetupWizard({
      packageId: previewTemplate?.packageId,
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
              Browse Canvas 7 portfolio sample designs for Business Starter Launch. Use previous and
              next to explore templates, then click preview to view the live layout.
            </p>
          </div>

          {TEMPLATE_GROUPS.map((group) => (
            <section key={group.title} className={styles.webdesignTemplateGroup}>
              <h4 className={styles.webdesignTemplateGroupTitle}>{group.title}</h4>
              {group.packageId === "design-starter" ||
              group.packageId === "design-ecommerce" ||
              group.packageId === "design-corporate" ? (
                <TemplateCatalogCarousel
                  group={group}
                  onPreview={openPreview}
                  counterLabel={
                    group.packageId === "design-ecommerce"
                      ? "eCommerce templates"
                      : group.packageId === "design-corporate"
                        ? "listing templates"
                        : "portfolio templates"
                  }
                />
              ) : (
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
              )}
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

            <div className={styles.agencyPlanGrid}>
              {WEBDESIGN_PACKAGES.map((pkg, index) => {
                const cardVariant =
                  index === 1
                    ? styles.agencyPlanCardFeatured
                    : index === 2
                      ? styles.agencyPlanCardPro
                      : styles.agencyPlanCardStarter;

                return (
                  <article key={pkg.id} className={`${styles.agencyPlanCard} ${cardVariant}`}>
                    <div className={styles.agencyPlanHeader}>
                      <span className={styles.agencyPlanBadge}>Agency Code deployment</span>
                      <h4 className={styles.agencyPlanTitle}>{pkg.name}</h4>
                      <button
                        type="button"
                        className={styles.agencyPlanCta}
                        onClick={() =>
                          openSetupWizard({
                            packageId: pkg.id,
                            packageName: pkg.name,
                            packagePrice: pkg.price,
                          })
                        }
                      >
                        + ADD AGENCY PACKAGE
                      </button>
                      <Link href="/public/contact-us" className={styles.agencyPlanCall}>
                        <i className="fa-solid fa-phone" aria-hidden="true" />
                        BOOK A CALL
                      </Link>
                    </div>
                    <div className={styles.agencyPlanFeatures}>
                      <p className={styles.agencyPlanFeaturesLabel}>Features:</p>
                      <ul className={styles.agencyPlanFeaturesList}>
                        {pkg.features.map((feature) => (
                          <li key={feature}>
                            <span className={styles.agencyPlanFeatureIcon} aria-hidden="true">
                              <i className="fa-solid fa-check" />
                            </span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <section className={styles.webdesignCustomQuote}>
            <div className={styles.webdesignCustomQuoteCopy}>
              <span>Bespoke Enterprise Integration</span>
              <h3>Need customized ERP billing or payment gateway integration?</h3>
              <p>
                Our systems team builds PHP/Node service layers, REST API hooks, and invoice
                pipelines aligned with BIR e-invoicing and local tax compliance requirements.
              </p>
            </div>
            <Link href="/public/contact-us" className={styles.webdesignCustomQuoteBtn}>
              <span className={styles.webdesignCustomQuoteBtnLabel}>Get a Quote</span>
              <span className={styles.webdesignCustomQuoteBtnIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25">
                  <path d="M5 12h14" />
                  <path d="m13 6 6 6-6 6" />
                </svg>
              </span>
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
        onNavigate={previewGroup && previewGroup.templates.length > 1 ? navigatePreview : undefined}
        slideDirection={previewSlideDirection}
      />

      <WebDesignSetupWizard
        open={Boolean(setupContext)}
        packageId={setupContext?.packageId}
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
