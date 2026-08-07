import { useEffect, useMemo, useState } from "react";
import type { CustomerRow } from "@/services/customerService";
import {
  assignCommerceCustomerOwner,
  fetchCommerceAssignableUsers,
  type CommerceAssignableUser,
} from "@/services/commerceAdminService";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  open: boolean;
  client: CustomerRow | null;
  onClose: () => void;
  onAssigned: (payload: {
    id: number;
    owner_id: number | null;
    owner: CustomerRow["owner"];
    owner_name: string | null;
  }) => void;
};

export default function AssignClientOwnerModal({ open, client, onClose, onAssigned }: Props) {
  const [users, setUsers] = useState<CommerceAssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    if (!open) return;

    setSearch("");
    setSelectedUserId(client?.owner_id ?? client?.owner?.id ?? null);
    setLoading(true);

    fetchCommerceAssignableUsers()
      .then((rows) => setUsers(rows))
      .catch(() => {
        setUsers([]);
        toast.error("Could not load active users.");
      })
      .finally(() => setLoading(false));
  }, [open, client]);

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) => {
      const haystack = `${user.name} ${user.email ?? ""} ${user.role ?? ""}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [users, search]);

  if (!open || !client) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      const result = await assignCommerceCustomerOwner(client.id, selectedUserId);
      toast.success(result?.message || "Client owner updated.");
      onAssigned(result?.data ?? {
        id: client.id,
        owner_id: selectedUserId,
        owner: null,
        owner_name: null,
      });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to assign client owner.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="assign-client-owner-title">
      <div className={styles.modalCardWide}>
        <div className={styles.modalHeader}>
          <div>
            <h3 id="assign-client-owner-title" className={styles.modalTitle}>
              Assign Client Owner
            </h3>
            <p className={styles.panelSubtitle}>
              {client.company || client.name} · Choose an active staff user
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
            <button
              type="button"
              role="option"
              aria-selected={selectedUserId === null}
              className={selectedUserId === null ? styles.assignUserRowActive : styles.assignUserRow}
              onClick={() => setSelectedUserId(null)}
            >
              <span className={styles.assignUserAvatar} aria-hidden="true">
                —
              </span>
              <span className={styles.assignUserMeta}>
                <strong>Unassigned</strong>
                <span>No staff owner</span>
              </span>
            </button>
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
            <button type="submit" className={styles.primaryBtnSm} disabled={saving}>
              {saving ? "Saving..." : "Save Owner"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
