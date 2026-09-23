import { compactDealName, displayDomainType } from "@/lib/commerceAdmin/clientDealHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  names: Array<string | null | undefined> | string | null | undefined;
  domain?: string | null;
  domainType?: string | null;
  onClick?: () => void;
};

export default function DealNameCell({ names, domain, domainType, onClick }: Props) {
  const compact = compactDealName(names);
  const type = displayDomainType(domainType, domain);
  const title = [compact.title !== "—" ? compact.title : "", type].filter(Boolean).join(" + ") || undefined;
  const content = (
    <span className={styles.dealNameStack}>
      <span className={styles.dealNameRow}>
        <span className={styles.dealNamePrimary}>{compact.primary}</span>
        {compact.extra > 0 ? <span className={styles.dealNameMore}>+{compact.extra}</span> : null}
      </span>
      {type ? <span className={styles.dealNameType}>{type}</span> : null}
    </span>
  );

  if (onClick) {
    return (
      <button type="button" className={styles.dealNameLink} onClick={onClick} title={title}>
        {content}
      </button>
    );
  }

  return (
    <span className={styles.dealNameText} title={title}>
      {content}
    </span>
  );
}
