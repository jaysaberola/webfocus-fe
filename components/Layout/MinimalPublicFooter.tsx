import styles from "@/styles/minimalPublicFooter.module.css";

export default function MinimalPublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <p className={styles.text}>
        Copyright © {year} WebFocus Solutions, Inc. All Rights Reserved.
      </p>
    </footer>
  );
}
