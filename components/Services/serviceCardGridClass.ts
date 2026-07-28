import styles from "@/styles/services.module.css";

export function serviceCardGridClass(count: number) {
  const base = styles.serviceCardGrid;
  if (count === 1) return `${base} ${styles.serviceCardGridOne}`;
  if (count === 2) return `${base} ${styles.serviceCardGridTwo}`;
  return `${base} ${styles.serviceCardGridMany}`;
}
