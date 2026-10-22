import {
  commerceStatusBadgeVariant,
  formatCommerceStatusLabel,
  type CommerceStatusContext,
} from "@/lib/commerceAdmin/statusDisplay";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  value?: string | null;
  context?: CommerceStatusContext;
  className?: string;
};

const VARIANT_CLASS: Record<ReturnType<typeof commerceStatusBadgeVariant>, string> = {
  paid: styles.badgePaid,
  pending: styles.badgePending,
  provisioning: styles.badgeProvisioning,
  muted: styles.badgeMuted,
  purple: styles.badgePurple,
};

export default function CommerceStatusBadge({ value, context = "deal", className }: Props) {
  const label = formatCommerceStatusLabel(value);
  if (label === "—") {
    return <span className={className}>—</span>;
  }
  const variant = commerceStatusBadgeVariant(label, context);
  return (
    <span className={[VARIANT_CLASS[variant], className].filter(Boolean).join(" ") || undefined}>{label}</span>
  );
}
