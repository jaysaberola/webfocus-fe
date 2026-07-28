import { useEffect, useRef, useState, useMemo } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { getUsers, toggleUserActive, UserRow, createUser } from "@/services/userService";
import { fetchRoles, Role } from "@/services/roleService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import { TableRowActions } from "@/components/UI/TableRowActions";
import CmsModuleShell, { CmsModuleAdvancedSearchButton } from "@/components/Modules/CmsModuleShell";
import CmsFormModal from "@/components/Modules/CmsFormModal";
import { CmsSettingsField, CmsSettingsGrid } from "@/components/Modules/CmsSettingsForm";
import {
  CmsModuleStatusBadge,
  CmsModuleRowActions,
  cmsModuleTableProps,
} from "@/components/Modules/moduleTableUi";

type AdvancedSearchValues = Record<string, string>;

function ManageUsers() {
  const router = useRouter();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<string>("asc");
  const [showInactiveOnly, setShowInactiveOnly] = useState<boolean>(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const silentSortFetchRef = useRef(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  const sortRowsClientSide = (rows: UserRow[], sortByKey: string, order: string) => {
    const direction = String(order).toLowerCase() === "asc" ? 1 : -1;
    const copy = [...rows];

    const getName = (r: UserRow) => (r?.name ?? "").toString().toLowerCase();
    const getEmail = (r: UserRow) => (r?.email ?? "").toString().toLowerCase();
    const getModifiedMs = (r: any) => {
      const raw = r?.updated_at ?? r?.updated_at_formatted ?? r?.updated;
      if (!raw) return 0;
      const ms = new Date(raw).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    copy.sort((a: any, b: any) => {
      if (sortByKey === "email") {
        const av = getEmail(a);
        const bv = getEmail(b);
        if (av < bv) return -1 * direction;
        if (av > bv) return 1 * direction;
        return 0;
      }
      if (sortByKey === "updated_at") {
        return (getModifiedMs(a) - getModifiedMs(b)) * direction;
      }

      const av = getName(a);
      const bv = getName(b);
      if (av < bv) return -1 * direction;
      if (av > bv) return 1 * direction;
      return 0;
    });

    return copy;
  };

  const fetchUsers = async (opts?: { silent?: boolean }) => {
    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const res = await getUsers({
        search,
        name: advancedSearchValues.name || undefined,
        email: advancedSearchValues.email || undefined,
        role: advancedSearchValues.role || undefined,
        status: advancedSearchValues.status || (showInactiveOnly ? "inactive" : undefined),
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      }, { silent });

      const apiRows: UserRow[] = Array.isArray(res?.data?.data) ? res.data.data : [];

      const filteredRows = showInactiveOnly
        ? apiRows.filter((u) => String(u.status ?? "").toLowerCase() !== "active")
        : apiRows;

      const sortedRows = sortRowsClientSide(filteredRows, sortBy, sortOrder);

      setUsers(sortedRows);
      setTotalPages(res?.meta?.last_page ?? 1);
    } finally {
      if (!(opts?.silent ?? false)) setLoading(false);
    }
  };

  const isActiveUser = (row: UserRow) => String(row.status ?? "").toLowerCase() === "active";

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(users.map((u) => u.id));
    else setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const bulkSetActive = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(selectedIds.map((id) => toggleUserActive(id, active)));
      toast.success(`${active ? "Activated" : "Deactivated"} ${selectedIds.length} user(s)`);
      setSelectedIds([]);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update selected users");
    }
  };

  const handleToggleActive = async (row: UserRow) => {
    try {
      await toggleUserActive(row.id, !isActiveUser(row));
      toast.success(`User ${!isActiveUser(row) ? "activated" : "deactivated"}`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to update user status");
    }
  };

  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const timeout = setTimeout(() => fetchUsers({ silent }), 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly, advancedSearchValues]);

  useEffect(() => {
    setSelectedIds([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly]);

  const userStats = useMemo(() => {
    const active = users.filter((u) => isActiveUser(u)).length;
    const inactive = users.filter((u) => !isActiveUser(u)).length;
    return { visible: users.length, active, inactive };
  }, [users]);

  const resetCreateForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setRole("");
  };

  const openCreateModal = async () => {
    resetCreateForm();
    setShowCreateModal(true);

    if (roles.length === 0) {
      try {
        setLoadingRoles(true);
        const loadedRoles = await fetchRoles();
        setRoles(loadedRoles);
      } catch {
        toast.error("Failed to load roles");
      } finally {
        setLoadingRoles(false);
      }
    }
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateForm();
  };

  const handleCreateUser = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !role) {
      toast.error("All fields are required");
      return;
    }

    try {
      setSavingUser(true);
      await createUser({
        fname: firstName.trim(),
        lname: lastName.trim(),
        email: email.trim(),
        role,
      });
      toast.success("User created successfully");
      closeCreateModal();
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create user");
    } finally {
      setSavingUser(false);
    }
  };

  const columns: Column<UserRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={users.length > 0 && users.every((u) => selectedIds.includes(u.id))}
          onChange={(e) => toggleSelectAll(e.target.checked)}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={(e) => toggleRow(row.id, e.target.checked)}
        />
      ),
    },
    {
      key: "name",
      header: "Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => <span className="fw-bold">{row.name}</span>,
    },
    {
      key: "email",
      header: "Email",
      sortable: true,
      sortField: "email",
      defaultSortOrder: "asc",
      render: (row) => (
        <span style={{ fontFamily: "monospace" }}>{row.email}</span>
      ),
    },
    {
      key: "role",
      header: "Role",
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortField: "status",
      defaultSortOrder: "asc",
      render: (row) => (
        <CmsModuleStatusBadge
          status={isActiveUser(row) ? "active" : "inactive"}
          label={row.status}
        />
      ),
    },
    {
      key: "options",
      header: "Actions",
      render: (row) => (
        <CmsModuleRowActions>
        <TableRowActions>
          <button
            className="btn btn-link p-0 text-secondary"
            title="View"
            onClick={() => router.push(`/users/view/${row.id}`)}
            type="button"
          >
            <i className="fas fa-eye" />
          </button>

          <button
            className="btn btn-link p-0 text-secondary"
            title="Edit"
            onClick={() => router.push(`/users/edit/${row.id}`)}
            type="button"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0"
            title={isActiveUser(row) ? "Deactivate" : "Activate"}
            onClick={() => handleToggleActive(row)}
            style={{ color: isActiveUser(row) ? "#059669" : "#64748b" }}
            type="button"
          >
            <i className={`fas ${isActiveUser(row) ? "fa-toggle-on" : "fa-toggle-off"}`} />
          </button>
        </TableRowActions>
        </CmsModuleRowActions>
      ),
    },
  ];

  return (
    <CmsModuleShell
      title="Manage Users"
      description="View and manage admin user accounts. Activate or deactivate users, or filter to show inactive accounts only."
      icon="fa-solid fa-users"
      actions={(
        <button
          type="button"
          className="btn btn-primary cms-module__create-btn"
          onClick={openCreateModal}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Create User
        </button>
      )}
      stats={[
        { label: "Showing", value: userStats.visible },
        { label: "Active", value: userStats.active, tone: "published" },
        { label: "Inactive", value: userStats.inactive, tone: "private" },
      ]}
      toolbar={(
      <SearchBar
        placeholder="Search users"
        value={search}
        onChange={(v) => {
          setSearch(v);
          setCurrentPage(1);
        }}
        actionsMenu={(
          <>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkSetActive(true)}
              type="button"
              disabled={selectedIds.length === 0 || loading}
            >
              Activate
            </button>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkSetActive(false)}
              type="button"
              disabled={selectedIds.length === 0 || loading}
            >
              Deactivate
            </button>
          </>
        )}
        rightExtras={(
          <CmsModuleAdvancedSearchButton onClick={() => setShowAdvancedModal(true)} />
        )}
        filtersOpen={showAdvancedModal}
        onFiltersOpenChange={(open) => {
          if (!open) setShowAdvancedModal(false);
        }}
        externalOpenAsModal={true}
        advancedSearchUpdatesInput={false}
        onAdvancedSearch={(values) => setAdvancedSearchValues(values)}
        advancedFields={[
          { name: "name", label: "Name" },
          { name: "email", label: "Email" },
          { name: "role", label: "Role" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "- All Statuses -", value: "" },
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, showDeleted: sInactiveOnly, perPage: sPerPage, advancedValues }) => {
          setSortBy(sBy === "modified" ? "updated_at" : sBy === "title" ? "name" : sBy);
          setSortOrder(sOrder);
          setShowInactiveOnly(sInactiveOnly);
          setPerPage(sPerPage);
          setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
          setCurrentPage(1);
        }}
        initialSortBy={sortBy === "updated_at" ? "modified" : sortBy === "name" ? "title" : sortBy}
        initialSortOrder={sortOrder}
        initialPerPage={perPage}
        initialShowDeleted={showInactiveOnly}
        showDeletedLabel="Show inactive only"
      />
      )}
    >
      <DataTable<UserRow>
        columns={columns}
        data={users}
        loading={loading}
        {...cmsModuleTableProps}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n: number) => { setPerPage(n); setCurrentPage(1); }}
        sortBy={sortBy}
        sortOrder={(String(sortOrder).toLowerCase() === "asc" ? "asc" : "desc") as any}
        onSortChange={(nextBy, nextOrder) => {
          silentSortFetchRef.current = true;
          setSortBy(nextBy);
          setSortOrder(nextOrder);
          setCurrentPage(1);
        }}
      />

      <CmsFormModal
        show={showCreateModal}
        title="Create User"
        description="Add a new admin user account and assign a role."
        icon="fa-solid fa-user-plus"
        submitLabel={savingUser ? "Creating..." : "Create User"}
        onClose={closeCreateModal}
        onSubmit={handleCreateUser}
      >
        <CmsSettingsGrid columns={2}>
          <CmsSettingsField label="First Name" required>
            <input
              type="text"
              className="form-control"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              disabled={savingUser}
              autoFocus
            />
          </CmsSettingsField>
          <CmsSettingsField label="Last Name" required>
            <input
              type="text"
              className="form-control"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              disabled={savingUser}
            />
          </CmsSettingsField>
          <CmsSettingsField label="Email" required span={2}>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              disabled={savingUser}
            />
          </CmsSettingsField>
          <CmsSettingsField label="Role" required span={2} hint="Controls what this user can access in the admin portal.">
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={savingUser || loadingRoles || roles.length === 0}
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select role"}
              </option>
              {roles.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </CmsSettingsField>
        </CmsSettingsGrid>
      </CmsFormModal>
    </CmsModuleShell>
  );
}

ManageUsers.Layout = AdminLayout;
export default ManageUsers;
