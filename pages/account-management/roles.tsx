import { useEffect, useRef, useState } from "react";
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

type SortOrder = "asc" | "desc";
type AdvancedSearchValues = Record<string, string>;

function ManageRoles() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
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
      render: (row) => <span className="fw-bold">{row.name}</span>,
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      sortField: "description",
      defaultSortOrder: "asc",
      render: (row) => row.description || "-",
    },
    {
      key: "updated_at",
      header: "Last Updated",
      sortable: true,
      sortField: "updated_at",
      defaultSortOrder: "desc",
      render: (row) => (row.updated_at ? new Date(row.updated_at).toLocaleString() : "-"),
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          <button
            className="btn btn-link p-0 me-2 text-secondary"
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
        </>
      ),
    },
  ];

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">Manage Roles</h3>

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
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              className="btn btn-success d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 18px", whiteSpace: "nowrap" }}
              onClick={() => setShowAdvancedModal(true)}
            >
              <span style={{ lineHeight: 1, textAlign: "center", display: "inline-block" }}>
                Advanced Search
              </span>
            </button>

            <button
              type="button"
              className="btn btn-primary d-flex align-items-center justify-content-center"
              style={{ height: 40, padding: "10px 24px", whiteSpace: "nowrap" }}
              onClick={openCreateModal}
            >
              Create Role
            </button>
          </div>
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

      <DataTable<RoleRow>
        columns={columns}
        data={roles}
        loading={loading}
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

      {showRoleModal && (
        <div className="modal show d-block" tabIndex={-1} role="dialog" style={{ background: "rgba(15, 23, 42, 0.35)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingRole ? "Edit Role" : "Create Role"}</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={closeRoleModal} />
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Role name</label>
                  <input
                    className="form-control"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeRoleModal}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveRole}>
                  {editingRole ? "Update Role" : "Create Role"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}

ManageRoles.Layout = AdminLayout;
export default ManageRoles;
