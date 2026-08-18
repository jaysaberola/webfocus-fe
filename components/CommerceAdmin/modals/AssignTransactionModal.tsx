import { useEffect, useMemo, useState } from "react";
import type { SalesTransaction } from "@/services/salesTransactionService";
import {
  assignCommerceSalesTransaction,
  fetchCommerceAssignableUsers,
  type CommerceAssignableUser,
} from "@/services/commerceAdminService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  transaction: SalesTransaction | null;
  restrictRoles?: string[];
  onClose: () => void;
  onAssigned: (transaction: SalesTransaction) => void;
};

export default function AssignTransactionModal({
  open,
  transaction,
  restrictRoles,
  onClose,
  onAssigned,
}: Props) {
  const [users, setUsers] = useState<CommerceAssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setSelectedUserId(transaction?.user_id ?? transaction?.user?.id ?? null);
    setLoading(true);

    fetchCommerceAssignableUsers()
      .then((rows) => setUsers(rows))
      .catch(() => {
        setUsers([]);
        toast.error("Could not load active users.");
      })
      .finally(() => setLoading(false));
  }, [open, transaction]);

  const filteredUsers = useMemo(() => {
    const allowed = (restrictRoles ?? []).map((role) => role.toLowerCase().replace(/[_-]+/g, " "));
    const scoped = allowed.length
      ? users.filter((user) => {
          const names = [user.role, ...(user.roles ?? [])]
            .map((role) => String(role ?? "").toLowerCase().replace(/[_-]+/g, " "));
          return names.some((role) => allowed.includes(role) || role === "admin" || role === "super admin");
        })
      : users;
    const needle = search.trim().toLowerCase();
    if (!needle) return scoped;
    return scoped.filter((user) => {
      const haystack = `${user.name} ${user.email ?? ""} ${user.role ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [users, search, restrictRoles]);

  if (!open || !transaction) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedUserId) {
      toast.warning("Select an active user to assign this transaction.");
      return;
    }

    try {
      setSaving(true);
      const result = await assignCommerceSalesTransaction(transaction.id, selectedUserId);
      toast.success(result?.message || "Transaction assigned.");
      onAssigned(result?.data ?? transaction);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign transaction.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="assign-tx-title">
      <div className={styles.modalCardWide}>
        <div className={styles.modalHeader}>
          <div>
            <h3 id="assign-tx-title" className={styles.modalTitle}>
              Assign To
            </h3>
            <p className={styles.panelSubtitle}>
              {transaction.transaction_no} ·{" "}
              {restrictRoles?.length
                ? "Choose an active Sales Staff user"
                : "Choose an active staff user (customers excluded)"}
            </p>
          </div>
          <button type="button" className={styles.modalCloseBtn} onClick={onClose} aria-label="Close" disabled={saving}>
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <form className={styles.modalForm} onSubmit={handleSubmit}>
          <label className={styles.modalLabel}>
            Search users
            <input
              className={styles.modalInput}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or role..."
              autoFocus
            />
          </label>

          <div className={styles.assignUserList} role="listbox" aria-label="Active users">
            {loading ? (
              <p className={styles.panelSubtitle}>Loading active users...</p>
            ) : filteredUsers.length === 0 ? (
              <p className={styles.panelSubtitle}>No active users found.</p>
            ) : (
              filteredUsers.map((user) => {
                const selected = selectedUserId === user.id;
                return (
                  <button
                    key={user.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={selected ? styles.assignUserRowActive : styles.assignUserRow}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <span className={styles.assignUserAvatar} aria-hidden="true">
                      {(user.name || "?").charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.assignUserMeta}>
                      <strong>{user.name}</strong>
                      <span>{user.email}</span>
                    </span>
                    <span className={styles.assignUserRole}>{user.role || "User"}</span>
                  </button>
                );
              })
            )}
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.secondaryBtnSm} onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.primaryBtnSm} disabled={saving || !selectedUserId}>
              {saving ? "Assigning..." : "Assign Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
