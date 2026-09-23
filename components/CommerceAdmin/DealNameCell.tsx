import { useEffect, useRef, useState } from "react";
import { compactDealName, displayDomainType } from "@/lib/commerceAdmin/clientDealHelpers";
import styles from "@/styles/commerceAdmin.module.css";

const EXPAND_WIDTH = 240;

type Props = {
  names: Array<string | null | undefined> | string | null | undefined;
  domain?: string | null;
  domainType?: string | null;
  onClick?: () => void;
};

export default function DealNameCell({ names, domain, domainType, onClick }: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(false);
  const compact = compactDealName(names);
  const type = displayDomainType(domainType, domain);
  const alreadyListed = compact.all.some((name) => name.trim().toLowerCase() === type.trim().toLowerCase());
  const shownType = type && !alreadyListed ? type : "";
  const title = [compact.title !== "—" ? compact.title : "", shownType].filter(Boolean).join(" + ") || undefined;
  const showAll = expanded && compact.all.length > 1;

  useEffect(() => {
    const host = rootRef.current;
    const node = host?.closest("td") ?? host;
    if (!node) return;

    const update = () => {
      setExpanded(node.getBoundingClientRect().width >= EXPAND_WIDTH);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const content = (
    <span className={styles.dealNameStack}>
      {showAll ? (
        <span className={styles.dealNameFull}>{compact.title}</span>
      ) : (
        <span className={styles.dealNameRow}>
          <span className={styles.dealNamePrimary}>{compact.primary}</span>
          {compact.extra > 0 ? <span className={styles.dealNameMore}>+{compact.extra}</span> : null}
        </span>
      )}
      {shownType ? <span className={styles.dealNameType}>{shownType}</span> : null}
    </span>
  );

  return (
    <span ref={rootRef} className={styles.dealNameHost}>
      {onClick ? (
        <button type="button" className={styles.dealNameLink} onClick={onClick} title={showAll ? undefined : title}>
          {content}
        </button>
      ) : (
        <span className={styles.dealNameText} title={showAll ? undefined : title}>
          {content}
        </span>
      )}
    </span>
  );
}
