import { useEffect, useRef, useState, useMemo } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import ConfirmModal from "@/components/UI/ConfirmModal";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { toast } from "@/lib/toast";
import {
  getRoles,
  RoleRow,
  createRole,
  updateRole,
  deleteRole,
} from "@/services/roleService";
import CmsModuleShell, { CmsModuleAdvancedSearchButton } from "@/components/Modules/CmsModuleShell";
import CmsFormModal from "@/components/Modules/CmsFormModal";
import {
  CmsSettingsField,
  CmsSettingsGrid,
  CmsSettingsLayout,
  CmsSettingsSection,
} from "@/components/Modules/CmsSettingsForm";
import {
  CmsModuleDate,
  CmsModuleRowActions,
  CmsModuleTitleCell,
  cmsModuleTableProps,
} from "@/components/Modules/moduleTableUi";

type SortOrder = "asc" | "desc";
type AdvancedSearchValues = Record<string, string>;

function ManageRoles() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const silentSortFetchRef = useRef(false);

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const sortRowsClientSide = (rows: RoleRow[], sortByKey: string, order: SortOrder) => {
    const direction = order === "asc" ? 1 : -1;
    const copy = [...rows];

    const getText = (r: RoleRow, key: "name" | "description") =>
      (r?.[key] ?? "").toString().toLowerCase();
    const getModifiedMs = (r: RoleRow) => {
      const ms = new Date(r.updated_at).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };

    copy.sort((a, b) => {
      if (sortByKey === "updated_at") {
        return (getModifiedMs(a) - getModifiedMs(b)) * direction;
      }
      if (sortByKey === "description") {
        return getText(a, "description").localeCompare(getText(b, "description")) * direction;
      }
      return getText(a, "name").localeCompare(getText(b, "name")) * direction;
    });

    return copy;
  };

  const fetchRoles = async (opts?: { silent?: boolean }) => {
    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const res = await getRoles({
        search,
        name: advancedSearchValues.name || undefined,
        description: advancedSearchValues.description || undefined,
        updated_from: advancedSearchValues.updatedFrom || undefined,
        updated_to: advancedSearchValues.updatedTo || undefined,
        page: currentPage,
        per_page: perPage,
      });

      const apiRows: RoleRow[] = Array.isArray(res?.data?.data) ? res.data.data : [];
      setRoles(sortRowsClientSide(apiRows, sortBy, sortOrder));
      setTotalPages(res?.data?.last_page ?? res?.data?.meta?.last_page ?? 1);
    } catch (err) {
      console.error("Failed to load roles", err);
      toast.error("Failed to load roles");
    } finally {
      if (!(opts?.silent ?? false)) setLoading(false);
    }
  };

  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const timeout = setTimeout(() => fetchRoles({ silent }), 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, currentPage, perPage, sortBy, sortOrder, advancedSearchValues]);

  useEffect(() => {
    setSelectedIds([]);
  }, [search, currentPage, perPage, sortBy, sortOrder]);

  const resetRoleForm = () => {
    setEditingRole(null);
    setName("");
    setDescription("");
  };

  const openCreateModal = () => {
    resetRoleForm();
    setShowRoleModal(true);
  };

  const openEditModal = (role: RoleRow) => {
    setEditingRole(role);
    setName(role.name);
    setDescription(role.description || "");
    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    resetRoleForm();
  };

  const handleSaveRole = async () => {
    if (!name.trim()) {
      toast.error("Role name is required");
      return;
    }

    if (!description.trim()) {
      toast.error("Role description is required");
      return;
    }

    try {
      if (editingRole) {
        await updateRole(editingRole.id, {
          name: name.trim(),
          description: description.trim(),
        });
        toast.success("Role updated successfully.");
      } else {
        await createRole({
          name: name.trim(),
          description: description.trim(),
        });
        toast.success("Role created successfully.");
      }

      closeRoleModal();
      fetchRoles();
    } catch (err: any) {
      console.error("Failed to save role", err);
      toast.error(err?.response?.data?.message || "Failed to save role. Please try again.");
    }
  };

  const handleDeleteRole = (role: RoleRow) => {
    setDeleteTarget(role);
  };

  const confirmDeleteRole = async () => {
    if (!deleteTarget) return;

    try {
      await deleteRole(deleteTarget.id);
      toast.success("Role deleted successfully.");
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTarget.id));
      setDeleteTarget(null);
      fetchRoles();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete role.");
    }
  };

  const bulkDeleteRoles = () => {
    if (selectedIds.length === 0) return;
    setConfirmBulkDelete(true);
  };

  const confirmDeleteSelectedRoles = async () => {
    if (selectedIds.length === 0) return;
    const idsToDelete = [...selectedIds];
    try {
      await Promise.all(idsToDelete.map((id) => deleteRole(id)));
      toast.success(`Deleted ${idsToDelete.length} role(s)`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      fetchRoles();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to delete selected roles.");
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(roles.map((role) => role.id));
    else setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? Array.from(new Set([...prev, id])) : prev.filter((selectedId) => selectedId !== id)
    );
  };

  const columns: Column<RoleRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={roles.length > 0 && roles.every((role) => selectedIds.includes(role.id))}
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
      header: "Role Name",
      sortable: true,
      sortField: "name",
      defaultSortOrder: "asc",
      render: (row) => <CmsModuleTitleCell title={row.name} />,
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      sortField: "description",
      defaultSortOrder: "asc",
      render: (row) => row.description || "—",
    },
    {
      key: "updated_at",
      header: "Last Updated",
      sortable: true,
      sortField: "updated_at",
      defaultSortOrder: "desc",
      render: (row) => <CmsModuleDate value={row.updated_at ? new Date(row.updated_at).toLocaleString() : undefined} />,
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <CmsModuleRowActions>
          <button
            className="btn btn-link p-0 text-secondary"
            title="Edit"
            onClick={() => openEditModal(row)}
            type="button"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0 text-danger"
            title="Delete"
            onClick={() => handleDeleteRole(row)}
            type="button"
          >
            <i className="fas fa-trash" />
          </button>
        </CmsModuleRowActions>
      ),
    },
  ];

  const roleStats = useMemo(() => ({ total: roles.length }), [roles]);

  return (
    <CmsModuleShell
      title="Manage Roles"
      description="Create and manage user roles. Assign roles to users and configure access rights per role."
      icon="fa-solid fa-user-shield"
      actions={(
        <button
          type="button"
          className="btn btn-primary cms-module__create-btn"
          onClick={openCreateModal}
        >
          <i className="fa-solid fa-plus" aria-hidden="true" />
          Create Role
        </button>
      )}
      stats={[
        { label: "Showing", value: roleStats.total },
      ]}
      toolbar={(
      <SearchBar
        placeholder="Search roles"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
        actionsMenu={(
          <button
            className="list-group-item list-group-item-action text-danger"
            onClick={bulkDeleteRoles}
            type="button"
            disabled={selectedIds.length === 0 || loading}
          >
            Delete
          </button>
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
          { name: "name", label: "Role Name" },
          { name: "description", label: "Description" },
          { name: "updatedFrom", label: "Last Updated (From)", type: "date" },
          { name: "updatedTo", label: "Last Updated (To)", type: "date" },
        ]}
        onApplyFilters={({ sortBy: sBy, sortOrder: sOrder, perPage: sPerPage, advancedValues }) => {
          setSortBy(sBy === "modified" ? "updated_at" : sBy === "title" ? "name" : sBy);
          setSortOrder(String(sOrder).toLowerCase() === "asc" ? "asc" : "desc");
          setPerPage(sPerPage);
          setAdvancedSearchValues(advancedValues ?? advancedSearchValues);
          setCurrentPage(1);
        }}
        initialSortBy={sortBy === "updated_at" ? "modified" : sortBy === "name" ? "title" : sortBy}
        initialSortOrder={sortOrder}
        initialPerPage={perPage}
        showDeletedToggle={false}
      />
      )}
    >
      <CmsSettingsLayout>
        <CmsSettingsSection
          title="Roles List"
          description="View, edit, and delete roles assigned to admin users."
          icon="fa-solid fa-list"
        >
          <DataTable<RoleRow>
            columns={columns}
            data={roles}
            loading={loading}
            {...cmsModuleTableProps}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={perPage}
            onItemsPerPageChange={(n: number) => {
              setPerPage(n);
              setCurrentPage(1);
            }}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(nextBy, nextOrder) => {
              silentSortFetchRef.current = true;
              setSortBy(nextBy);
              setSortOrder(nextOrder);
              setCurrentPage(1);
            }}
          />
        </CmsSettingsSection>
      </CmsSettingsLayout>

      <CmsFormModal
        show={showRoleModal}
        title={editingRole ? "Edit Role" : "Create Role"}
        description={
          editingRole
            ? "Update the role name and description used across the admin portal."
            : "Add a new role that can be assigned to users and configured in access rights."
        }
        icon="fa-solid fa-user-shield"
        submitLabel={editingRole ? "Update Role" : "Create Role"}
        onClose={closeRoleModal}
        onSubmit={handleSaveRole}
      >
        <CmsSettingsGrid columns={1}>
          <CmsSettingsField label="Role Name" required>
            <input
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Editor, Manager"
            />
          </CmsSettingsField>
          <CmsSettingsField label="Description" required hint="Briefly describe what this role is allowed to do.">
            <textarea
              className="form-control"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the responsibilities for this role"
            />
          </CmsSettingsField>
        </CmsSettingsGrid>
      </CmsFormModal>

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Role"
        message={<>Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?</>}
        confirmLabel="Delete"
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeleteTarget(null)}
      />

      <ConfirmModal
        show={confirmBulkDelete}
        title="Delete Selected Roles"
        message={<>Are you sure you want to delete <strong>{selectedIds.length}</strong> selected role(s)?</>}
        confirmLabel="Delete"
        onConfirm={confirmDeleteSelectedRoles}
        onCancel={() => setConfirmBulkDelete(false)}
      />
    </CmsModuleShell>
  );
}

ManageRoles.Layout = AdminLayout;
export default ManageRoles;
