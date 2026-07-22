import styles from "@/styles/customerPortal.module.css";

type PortalTabLoaderProps = {
  label?: string;
};

export default function PortalTabLoader({ label = "Loading..." }: PortalTabLoaderProps) {
  return (
    <div className={styles.portalLoading} role="status" aria-live="polite" aria-busy="true">
      <div className={styles.portalLoadingSpinner} aria-hidden="true" />
      <p className={styles.portalLoadingText}>{label}</p>
    </div>
  );
}
