import styles from "@/styles/customerPortal.module.css";

type HeaderProps = {
  allSelected: boolean;
  someSelected: boolean;
  onToggleAll: () => void;
  disabled?: boolean;
  label?: string;
};

export function PortalSelectAllHead({
  allSelected,
  someSelected,
  onToggleAll,
  disabled,
  label = "Select all rows",
}: HeaderProps) {
  return (
    <th className={styles.selectCol}>
      <input
        type="checkbox"
        className={styles.selectCheckbox}
        checked={allSelected}
        ref={(el) => {
          if (el) el.indeterminate = someSelected;
        }}
        onChange={onToggleAll}
        disabled={disabled}
        aria-label={label}
      />
    </th>
  );
}

type RowProps = {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
};

export function PortalSelectRowCell({ checked, onChange, label, disabled }: RowProps) {
  return (
    <td className={styles.selectCol}>
      <input
        type="checkbox"
        className={styles.selectCheckbox}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
    </td>
  );
}
