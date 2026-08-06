import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { TemplateSlideDirection } from "@/lib/templateNav";
import {
  ensureCanvasOriginHints,
  preloadTemplateImages,
  warmCanvasPreview,
} from "@/lib/canvasPreviewWarmup";
import {
  TEMPLATE_GROUPS,
  WEBDESIGN_PACKAGES,
  type TemplateGroup,
  type WebsiteTemplate,
} from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import DeferredMount from "./DeferredMount";
import TemplateCatalogCarousel from "./TemplateCatalogCarousel";
import styles from "@/styles/services.module.css";

const TemplatePreviewModal = dynamic(() => import("./TemplatePreviewModal"), {
  ssr: false,
});

const WebDesignSetupWizard = dynamic(() => import("./WebDesignSetupWizard"), {
  ssr: false,
});

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

  const firstPageImages = TEMPLATE_GROUPS[0]?.templates.slice(0, 3).map((t) => t.image) ?? [];

  useEffect(() => {
    ensureCanvasOriginHints();
    preloadTemplateImages(
      TEMPLATE_GROUPS[0]?.templates.slice(0, 3).map((template) => template.image) ?? []
    );
    // Prefetch preview modal chunk early so the first click feels instant.
    void import("./TemplatePreviewModal");
  }, []);

  const openPreview = (group: TemplateGroup, template: WebsiteTemplate) => {
    warmCanvasPreview(template.previewUrl);
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
    const nextTemplate = previewGroup.templates[nextIndex];
    warmCanvasPreview(nextTemplate.previewUrl);
    setPreviewTemplate(nextTemplate);

    // Warm one more step ahead so consecutive Next clicks stay snappy.
    const aheadIndex =
      direction === "next" ? (nextIndex + 1) % total : (nextIndex - 1 + total) % total;
    warmCanvasPreview(previewGroup.templates[aheadIndex].previewUrl);
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
      <Head>
        <link rel="dns-prefetch" href="https://projects.wsiph2.com" />
        <link rel="preconnect" href="https://projects.wsiph2.com" crossOrigin="" />
        {firstPageImages.map((href) => (
          <link key={href} rel="preload" as="image" href={href} />
        ))}
      </Head>

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

          {TEMPLATE_GROUPS.map((group, groupIndex) => (
            <DeferredMount
              key={group.title}
              eager={groupIndex === 0}
              rootMargin={groupIndex === 0 ? "240px 0px" : "40px 0px"}
              delayMs={groupIndex === 0 ? 0 : 450 * groupIndex}
              minHeight={360}
            >
              <section className={`${styles.webdesignTemplateGroup} ${styles.webdesignDeferredSection}`}>
                <h4 className={styles.webdesignTemplateGroupTitle}>{group.title}</h4>
                <TemplateCatalogCarousel
                  group={group}
                  onPreview={openPreview}
                  priorityImages={groupIndex === 0}
                  counterLabel={
                    group.packageId === "design-ecommerce"
                      ? "eCommerce templates"
                      : group.packageId === "design-corporate"
                        ? "listing templates"
                        : "portfolio templates"
                  }
                />
              </section>
            </DeferredMount>
          ))}

          <DeferredMount minHeight={520} rootMargin="200px 0px" delayMs={600}>
            <div className={`${styles.webdesignPackagesSection} ${styles.webdesignDeferredSection}`}>
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
                          Secure your Package
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
          </DeferredMount>

          <DeferredMount minHeight={220} rootMargin="160px 0px" delayMs={800}>
            <section className={`${styles.webdesignCustomQuote} ${styles.webdesignDeferredSection}`}>
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
          </DeferredMount>
        </section>
      </div>

      {previewTemplate && previewGroup ? (
        <TemplatePreviewModal
          open
          template={previewTemplate}
          group={previewGroup}
          onClose={closePreview}
          onContinueSetup={handlePreviewContinue}
          onNavigate={previewGroup.templates.length > 1 ? navigatePreview : undefined}
          slideDirection={previewSlideDirection}
        />
      ) : null}

      {setupContext ? (
        <WebDesignSetupWizard
          open
          packageId={setupContext.packageId}
          packageName={setupContext.packageName}
          packagePrice={setupContext.packagePrice}
          templateLabel={setupContext.templateLabel}
          templateId={setupContext.templateId}
          onClose={closeSetupWizard}
          onComplete={(selection) => {
            addWebDesignSetupToCart(selection);
            closeSetupWizard();
          }}
        />
      ) : null}
    </div>
  );
}
