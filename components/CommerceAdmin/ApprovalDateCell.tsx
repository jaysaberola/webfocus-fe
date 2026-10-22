import CommerceStatusBadge from "@/components/CommerceAdmin/CommerceStatusBadge";
import type { SalesTransaction } from "@/services/salesTransactionService";
import {
  resolveTechnicalApprovalDate,
  resolveTechnicalApprovalStatus,
} from "@/lib/commerceAdmin/clientDealHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  transaction: SalesTransaction;
  itemName: string;
};

export default function ApprovalDateCell({ transaction, itemName }: Props) {
  const approvalDate = resolveTechnicalApprovalDate(transaction, itemName);
  const approvalStatus = resolveTechnicalApprovalStatus(transaction, itemName);
  const hasDate = approvalDate !== "—";
  const showStatus = !hasDate || approvalStatus !== "Approved";

  if (!hasDate && showStatus) {
    return <CommerceStatusBadge value={approvalStatus} context="technical" />;
  }

  return (
    <div className={styles.approvalDateCell}>
      {hasDate ? (
        <span className={styles.dealDateValue}>{approvalDate}</span>
      ) : (
        <span className={styles.dealDateMuted}>—</span>
      )}
      {showStatus ? (
        <CommerceStatusBadge value={approvalStatus} context="technical" className={styles.approvalDateBadge} />
      ) : null}
    </div>
  );
}
