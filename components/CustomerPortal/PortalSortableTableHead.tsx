import styles from "@/styles/customerPortal.module.css";

type SortableTableHeadProps = {
  label: string;
  active?: boolean;
  direction?: "asc" | "desc";
  onClick?: () => void;
};

export default function PortalSortableTableHead({
  label,
  active = false,
  direction = "asc",
  onClick,
}: SortableTableHeadProps) {
  const iconClass = active
    ? direction === "asc"
      ? "fa-solid fa-arrow-up"
      : "fa-solid fa-arrow-down"
    : "fa-solid fa-sort";

  return (
    <th>
      <button
        type="button"
        className={active ? styles.tableSortBtnActive : styles.tableSortBtn}
        onClick={onClick}
        aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        <i className={iconClass} aria-hidden="true" />
      </button>
    </th>
  );
}
