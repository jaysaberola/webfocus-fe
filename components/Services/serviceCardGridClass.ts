import styles from "@/styles/services.module.css";

type GridOptions = {
  columns?: 3 | 4;
};

export function serviceCardGridClass(count: number, opts?: GridOptions) {
  const base = styles.serviceCardGrid;
  const columns = opts?.columns;

  if (count === 1) return `${base} ${styles.serviceCardGridOne}`;
  if (columns === 2) return `${base} ${styles.serviceCardGridTwo}`;
  if (count === 2 && columns !== 4) return `${base} ${styles.serviceCardGridTwo}`;
  if (columns === 4) return `${base} ${styles.serviceCardGridFour}`;
  return `${base} ${styles.serviceCardGridMany}`;
}
