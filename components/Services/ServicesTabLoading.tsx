import styles from "@/styles/services.module.css";

export default function ServicesTabLoading({ label = "Loading services..." }: { label?: string }) {
  return (
    <div className={styles.tabLoading} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.tabLoadingPulse} aria-hidden="true" />
      <div className={styles.tabLoadingPulse} aria-hidden="true" />
      <div className={styles.tabLoadingPulseShort} aria-hidden="true" />
      <p className={styles.tabLoadingLabel}>{label}</p>
    </div>
  );
}
