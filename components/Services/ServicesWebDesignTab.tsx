import dynamic from "next/dynamic";
import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { TemplateSlideDirection } from "@/lib/templateNav";
import {
  ensureCanvasOriginHints,
  preloadTemplateImages,
  warmCanvasPreview,
} from "@/lib/canvasPreviewWarmup";
import {
  ALL_WEBSITE_TEMPLATES_GROUP,
  WEBDESIGN_PACKAGES,
  type TemplateGroup,
  type WebsiteTemplate,
} from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import DeferredMount from "./DeferredMount";
import TemplateCategoryGallery from "./TemplateCategoryGallery";
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

const DEFAULT_SETUP: SetupContext = {
  packageId: WEBDESIGN_PACKAGES[1]?.id ?? WEBDESIGN_PACKAGES[0]?.id,
  packageName: WEBDESIGN_PACKAGES[1]?.name ?? WEBDESIGN_PACKAGES[0]?.name ?? "Custom Professional Corporate",
  packagePrice: WEBDESIGN_PACKAGES[1]?.price ?? WEBDESIGN_PACKAGES[0]?.price ?? 32000,
};

export default function ServicesWebDesignTab() {
  const { addWebDesignSetupToCart } = useServiceCart();
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewGroup, setPreviewGroup] = useState<TemplateGroup | null>(null);
  const [previewSlideDirection, setPreviewSlideDirection] = useState<TemplateSlideDirection>("next");
  const [setupContext, setSetupContext] = useState<SetupContext>(DEFAULT_SETUP);
  const setupRef = useRef<HTMLDivElement>(null);

  const firstPageImages = ALL_WEBSITE_TEMPLATES_GROUP.templates.slice(0, 5).map((t) => t.image);

  useEffect(() => {
    ensureCanvasOriginHints();
    preloadTemplateImages(
      ALL_WEBSITE_TEMPLATES_GROUP.templates.slice(0, 5).map((template) => template.image)
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

  const scrollToSetup = () => {
    setupRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openSetupWizard = (context: SetupContext) => {
    setSetupContext(context);
    window.requestAnimationFrame(scrollToSetup);
  };

  const closeSetupWizard = () => {
    setSetupContext(DEFAULT_SETUP);
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
        <section className={styles.webdesignShowcase} aria-label="Web design services overview">
          <div className={styles.webdesignHero}>
            <div className={styles.webdesignHeroInner}>
              <p className={styles.webdesignEyebrow}>Web Design Services</p>
              <h2 className={styles.webdesignHeroTitle}>Website Templates &amp; Agency Packages</h2>
            </div>
          </div>
          <DeferredMount eager rootMargin="240px 0px" delayMs={0} minHeight={360}>
            <TemplateCategoryGallery
              group={ALL_WEBSITE_TEMPLATES_GROUP}
              onPreview={openPreview}
              priorityImages
            />
          </DeferredMount>
        </section>

        <div ref={setupRef} id="webdesign-package-setup">
          <WebDesignSetupWizard
            open
            variant="inline"
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
        </div>

        <section className={styles.webdesignContent}>
          <DeferredMount minHeight={360} rootMargin="200px 0px" delayMs={600}>
            <section className={`${styles.webdesignConvert} ${styles.webdesignDeferredSection}`}>
              <div className={styles.webdesignConvertPanel}>
                <div className={styles.webdesignConvertCopy}>
                  <p className={styles.webdesignConvertEyebrow}>Agency Web Design</p>
                  <h3 className={styles.webdesignConvertTitle}>Our expertise, your prosperity.</h3>
                </div>
                <div className={styles.webdesignConvertBox}>
                  <p className={styles.webdesignConvertBoxLabel}>Launch with us</p>
                  <button
                    type="button"
                    className={styles.webdesignConvertCta}
                    onClick={() => {
                      const pkg = WEBDESIGN_PACKAGES[1] ?? WEBDESIGN_PACKAGES[0];
                      if (!pkg) return;
                      openSetupWizard({
                        packageId: pkg.id,
                        packageName: pkg.name,
                        packagePrice: pkg.price,
                      });
                    }}
                  >
                    SECURE YOUR PACKAGE
                  </button>
                  <Link href="/public/contact-us" className={styles.webdesignConvertCall}>
                    <i className="fa-solid fa-phone" aria-hidden="true" />
                    BOOK A CALL
                  </Link>
                </div>
              </div>
            </section>
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
    </div>
  );
}
