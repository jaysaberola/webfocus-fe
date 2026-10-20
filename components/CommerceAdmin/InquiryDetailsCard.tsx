import { inquiryDetailFields } from "@/lib/commerceAdmin/inquiryDetails";
import type { ContactInquiryRow } from "@/services/inquiryService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  inquiry: ContactInquiryRow;
};

export default function InquiryDetailsCard({ inquiry }: Props) {
  const fields = inquiryDetailFields(inquiry);

  return (
    <section className={styles.inquiryDetailsSection} aria-label="Inquiry details">
      <div className={styles.inquiryDetailsSectionHead}>
        <h4 className={styles.inquiryDetailsHeading}>Inquiry details</h4>
        <p className={styles.inquiryDetailsHint}>
          Replies from the bottom-right chat are sent by email to{" "}
          <strong>{inquiry.email || "the address on file"}</strong> (the same email they used on Contact Us).
        </p>
      </div>
      <div className={styles.detailGrid}>
        {fields.map((field) => (
          <div
            key={field.label}
            className={field.wide ? `${styles.detailField} ${styles.detailFieldWide}` : styles.detailField}
          >
            <span className={styles.detailLabel}>{field.label}</span>
            {field.href ? (
              <a className={styles.inquiryDetailsLink} href={field.href}>
                <strong>{field.value}</strong>
              </a>
            ) : (
              <strong>{field.value}</strong>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
