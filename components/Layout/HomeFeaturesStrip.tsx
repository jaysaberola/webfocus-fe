import styles from "@/styles/homeFeaturesStrip.module.css";

const FEATURE_ITEMS = [
  "99.9% Core SLA Uptime Guaranteed",
  "SSD Fast Databases Provision Board",
  "Philippine local SEC Clearance Partnership",
];

export default function HomeFeaturesStrip() {
  return (
    <section className={styles.strip} aria-label="Service highlights">
      <div className={styles.inner}>
        {FEATURE_ITEMS.map((item) => (
          <div key={item} className={styles.item}>
            <i className={`fas fa-check ${styles.check}`} aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
