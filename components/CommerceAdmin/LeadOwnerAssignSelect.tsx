import type { CommerceAssignableUser } from "@/services/commerceAdminService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  value: number | null;
  users: CommerceAssignableUser[];
  disabled?: boolean;
  className?: string;
  onChange: (userId: number | null) => void;
  onClick?: (event: React.MouseEvent<HTMLSelectElement>) => void;
};

function displayName(user: CommerceAssignableUser) {
  return user.name || user.email || `User #${user.id}`;
}

export default function LeadOwnerAssignSelect({
  value,
  users,
  disabled,
  className,
  onChange,
  onClick,
}: Props) {
  return (
    <select
      className={className ?? styles.selectInline}
      value={value ?? ""}
      disabled={disabled}
      onClick={onClick}
      onChange={(event) => {
        const next = event.target.value;
        onChange(next === "" ? null : Number(next));
      }}
      aria-label="Assign to staff"
    >
      <option value="">Unassigned</option>
      {users.map((user) => (
        <option key={user.id} value={user.id}>
          {displayName(user)}
        </option>
      ))}
    </select>
  );
}
