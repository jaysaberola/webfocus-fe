import { compactDealName } from "@/lib/commerceAdmin/clientDealHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  names: Array<string | null | undefined> | string | null | undefined;
  onClick?: () => void;
};

export default function DealNameCell({ names, onClick }: Props) {
  const compact = compactDealName(names);
  const content = (
    <>
      <span className={styles.dealNamePrimary}>{compact.primary}</span>
      {compact.extra > 0 ? <span className={styles.dealNameMore}>+{compact.extra}</span> : null}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        className={styles.dealNameLink}
        onClick={onClick}
        title={compact.extra > 0 ? compact.title : undefined}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={styles.dealNameText} title={compact.extra > 0 ? compact.title : undefined}>
      {content}
    </span>
  );
}
