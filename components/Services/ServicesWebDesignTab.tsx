import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import {
  TEMPLATE_GROUPS,
  WEBDESIGN_PACKAGES,
  type TemplateGroup,
  type WebsiteTemplate,
  formatPeso,
} from "@/lib/servicesCatalog";
import { useServiceCart } from "./useServiceCart";
import TemplatePreviewModal from "./TemplatePreviewModal";
import styles from "@/styles/services.module.css";

export default function ServicesWebDesignTab() {
  const { addToCart } = useServiceCart();
  const [previewTemplate, setPreviewTemplate] = useState<WebsiteTemplate | null>(null);
  const [previewGroup, setPreviewGroup] = useState<TemplateGroup | null>(null);

  const openPreview = (group: TemplateGroup, template: WebsiteTemplate) => {
    setPreviewGroup(group);
    setPreviewTemplate(template);
  };

  const closePreview = () => {
    setPreviewTemplate(null);
    setPreviewGroup(null);
  };

  return (
    <div className={styles.tabPanel}>
      <div className={styles.templatesIntro}>
        <h2>Website Templates</h2>
        <p>
          Browse Canvas 7 sample designs from our template library. Click any template to preview the
          live layout before choosing your package.
        </p>
      </div>

      {TEMPLATE_GROUPS.map((group) => (
        <section key={group.title} className={styles.templateGroup}>
          <h3>{group.title}</h3>
          <div className={styles.templateGrid}>
            {group.templates.map((template) => (
              <article key={template.id} className={styles.templateCard}>
                <button
                  type="button"
                  className={styles.templateCardButton}
                  onClick={() => openPreview(group, template)}
                  aria-label={`Preview ${template.label} template`}
                >
                  <div className={styles.templateImageWrap}>
                    <Image
                      src={template.image}
                      alt={template.alt}
                      width={400}
                      height={260}
                      className={styles.templateImage}
                    />
                    <span className={styles.templatePreview}>Preview</span>
                  </div>
                  <h5>{template.label}</h5>
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}

      <div className={styles.seeMoreRow}>
        <button type="button" className={styles.primaryBtnInline}>
          See More
        </button>
      </div>

      <section className={styles.designPromo}>
        <h2>
          Start your free website, choose
          <br className={styles.promoBreak} /> the right plan
        </h2>
        <p>
          Website is mobile-friendly and comes with built-in marketing and 24/7 support. Upgrade to a
          paid plan for more business building features.
        </p>
      </section>

      <div className={styles.packageGrid}>
        {WEBDESIGN_PACKAGES.map((pkg) => (
          <article key={pkg.id} className={styles.packageCard}>
            <div className={styles.packageBody}>
              <span className={styles.packageKicker}>Agency Code deployment</span>
              <h3>{pkg.name}</h3>
              <p className={styles.packagePrice}>
                {formatPeso(pkg.price)} <span>One-Off Cost</span>
              </p>
              <ul>
                {pkg.features.map((feature) => (
                  <li key={feature}>{feature}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              className={styles.packageBtn}
              onClick={() => addToCart(pkg.name, pkg.price, "Agency Web Design")}
            >
              Add Agency Package
            </button>
          </article>
        ))}
      </div>

      <section className={styles.customQuote}>
        <div className={styles.customQuoteCopy}>
          <span>Bespoke Enterprise Integration</span>
          <h3>Need customized ERP billing or payment gateway loops?</h3>
          <p>
            Our Quezon City systems center compiles special PHP/Node frameworks to align custom
            invoice channels directly with BIR and local standard tax regulations.
          </p>
        </div>
        <Link href="/public/contact-us" className={styles.customQuoteBtn}>
          Technical Intake Form
        </Link>
      </section>

      <TemplatePreviewModal
        open={Boolean(previewTemplate && previewGroup)}
        template={previewTemplate}
        group={previewGroup}
        onClose={closePreview}
        onAddPackage={addToCart}
      />
    </div>
  );
}
