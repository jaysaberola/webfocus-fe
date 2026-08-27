import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  label: string;
  className?: string;
};

export default function ResizableTableHead({ label, className }: Props) {
  return (
    <th className={[styles.resizableTh, className].filter(Boolean).join(" ")}>
      <span className={styles.resizableThLabel}>{label}</span>
    </th>
  );
}
