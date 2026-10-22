import { useEffect, useMemo, useState } from "react";
import type { CommerceServiceAdminRow } from "@/services/commerceAdminService";
import type { SalesTransaction } from "@/services/salesTransactionService";
import {
  formatDealDate,
  resolveDealExpirationIso,
  resolveDisplayDealStatus,
  type OrderAdminLineContext,
} from "@/lib/commerceAdmin/clientDealHelpers";
import {
  dealExpirationCountdownState,
  dealExpirationTickMs,
} from "@/lib/commerceAdmin/dealExpirationCountdown";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  transaction?: SalesTransaction | null;
  line?: OrderAdminLineContext;
  adminServices?: CommerceServiceAdminRow[];
  metaDealStatus?: string | null;
};

export default function DealExpirationCell({ transaction, line, adminServices = [], metaDealStatus }: Props) {
  if (!transaction) {
    return <span className={styles.dealDateMuted}>—</span>;
  }
  const iso = resolveDealExpirationIso(transaction, line, adminServices);
  const dealStatus = resolveDisplayDealStatus(transaction, {
    serviceStatus: line?.serviceStatus,
    line,
    adminServices,
    metaDealStatus,
  });

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!iso) return;
    const tick = () => setNow(Date.now());
    tick();
    const ms = dealExpirationTickMs(iso, Date.now());
    const id = window.setInterval(tick, ms);
    return () => window.clearInterval(id);
  }, [iso]);

  const countdown = useMemo(
    () => (iso ? dealExpirationCountdownState(iso, dealStatus, now) : null),
    [iso, dealStatus, now],
  );

  if (!iso) {
    return <span className={styles.dealDateMuted}>—</span>;
  }

  const dateLabel = formatDealDate(iso);
  const variant = countdown?.variant ?? "none";
  const hintClass = [
    styles.dealExpirationHint,
    variant === "expired" ? styles.dealExpirationHintExpired : "",
    variant === "today" ? styles.dealExpirationHintToday : "",
    variant === "soon" ? styles.dealExpirationHintSoon : "",
    variant === "future" ? styles.dealExpirationHintFuture : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.dealExpirationCell}>
      <time className={styles.dealExpirationDateLine} dateTime={iso}>
        {dateLabel}
      </time>
      {countdown && countdown.label ? (
        <div className={styles.dealExpirationMetaRow}>
          <span className={hintClass}>
            <i className="fa-regular fa-clock" aria-hidden="true" />
            <span className={styles.dealExpirationCountdownText}>{countdown.label}</span>
          </span>
          {countdown.sublabel ? (
            <span
              className={[
                styles.dealExpirationSublabel,
                variant === "expired" ? styles.dealExpirationSublabelRenew : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {countdown.sublabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
