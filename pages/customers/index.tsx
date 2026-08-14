import { useEffect, useRef, useState, useMemo } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { getCustomers, toggleCustomerActive, CustomerRow } from "@/services/customerService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";
import { readCustomerListCache, writeCustomerDetailCache, writeCustomerListCache } from "@/lib/customerCache";
import CmsModuleShell, { CmsModuleCreateButton, CmsModuleAdvancedSearchButton } from "@/components/Modules/CmsModuleShell";
import {
  CmsModuleStatusBadge,
  CmsModuleDate,
  CmsModuleRowActions,
  cmsModuleTableProps,
} from "@/components/Modules/moduleTableUi";

type AdvancedSearchValues = Record<string, string>;

function ManageCustomers() {
  const router = useRouter();

  const listCache = typeof window !== "undefined" ? readCustomerListCache() : null;

  const [customers, setCustomers] = useState<CustomerRow[]>(() => listCache?.rows ?? []);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(() => listCache?.currentPage ?? 1);
  const [totalPages, setTotalPages] = useState(() => listCache?.totalPages ?? 1);
  const [perPage, setPerPage] = useState(() => listCache?.perPage ?? 5);
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  const [showInactiveOnly, setShowInactiveOnly] = useState<boolean>(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [advancedSearchValues, setAdvancedSearchValues] = useState<AdvancedSearchValues>({});
  const silentSortFetchRef = useRef(false);
  const fetchRequestRef = useRef(0);
  const hasCustomerRowsRef = useRef(Boolean(listCache?.rows?.length));

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [updatingIds, setUpdatingIds] = useState<number[]>([]);

  const getRequestedStatus = () => {
    if (showInactiveOnly) return "inactive";
    return advancedSearchValues.status || "active";
  };

  const sortRowsClientSide = (rows: CustomerRow[], sortByKey: string, order: string) => {
    const direction = String(order).toLowerCase() === "asc" ? 1 : -1;
    const copy = [...rows];

    const getName = (r: CustomerRow) => (r?.name ?? "").toString().toLowerCase();
    const getEmail = (r: CustomerRow) => (r?.email ?? "").toString().toLowerCase();
    const getType = (r: CustomerRow) => (r?.type ?? r?.role ?? "").toString().toLowerCase();
    const getDateRegisteredMs = (r: CustomerRow) => {
      const raw = r?.created_at ?? r?.date_registered;
      if (!raw) return 0;
      const ms = new Date(raw).getTime();
      return Number.isFinite(ms) ? ms : 0;
    };
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
      if (sortByKey === "type") {
        const av = getType(a);
        const bv = getType(b);
        if (av < bv) return -1 * direction;
        if (av > bv) return 1 * direction;
        return 0;
      }
      if (sortByKey === "created_at") {
        return (getDateRegisteredMs(a) - getDateRegisteredMs(b)) * direction;
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

  const fetchCustomers = async (opts?: { silent?: boolean }) => {
    const requestId = fetchRequestRef.current + 1;
    fetchRequestRef.current = requestId;

    try {
      const silent = opts?.silent ?? false;
      if (!silent) setLoading(true);

      const res = await getCustomers({
        search,
        name: advancedSearchValues.name || undefined,
        email: advancedSearchValues.email || undefined,
        date_registered_from: advancedSearchValues.dateRegisteredFrom || undefined,
        date_registered_to: advancedSearchValues.dateRegisteredTo || undefined,
        status: getRequestedStatus(),
        page: currentPage,
        per_page: perPage,
        sort_by: sortBy,
        sort_order: sortOrder,
      }, { silent });

      const apiRows: CustomerRow[] = Array.isArray(res?.data) ? res.data : [];
      const requestedStatus = getRequestedStatus();

      const filteredRows = requestedStatus
        ? apiRows.filter((u) => String(u.status ?? "").toLowerCase() === requestedStatus)
        : apiRows;

      const sortedRows = sortRowsClientSide(filteredRows, sortBy, sortOrder);
      const nextTotalPages = res?.meta?.last_page ?? 1;

      if (requestId !== fetchRequestRef.current) return;

      setCustomers(sortedRows);
      hasCustomerRowsRef.current = sortedRows.length > 0;
      setTotalPages(nextTotalPages);
      writeCustomerListCache({
        rows: sortedRows,
        totalPages: nextTotalPages,
        currentPage,
        perPage,
      });
    } finally {
      if (requestId === fetchRequestRef.current && !(opts?.silent ?? false)) setLoading(false);
    }
  };

  const isActiveCustomer = (row: CustomerRow) => String(row.status ?? "").toLowerCase() === "active";

  const applyCustomerStatus = (rows: CustomerRow[], ids: number[], active: boolean) => {
    const idSet = new Set(ids);
    const nextStatus = active ? "Active" : "Inactive";
    const requestedStatus = getRequestedStatus();

    return rows
      .map((row) => (idSet.has(row.id) ? { ...row, status: nextStatus } : row))
      .filter((row) => String(row.status ?? "").toLowerCase() === requestedStatus);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedIds(customers.map((u) => u.id));
    else setSelectedIds([]);
  };

  const toggleRow = (id: number, checked: boolean) => {
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  };

  const bulkSetActive = async (active: boolean) => {
    if (selectedIds.length === 0) return;
    const ids = selectedIds;
    const previousCustomers = customers;

    setUpdatingIds((prev) => Array.from(new Set([...prev, ...ids])));
    setCustomers((rows) => applyCustomerStatus(rows, ids, active));
    setSelectedIds([]);

    try {
      await Promise.all(ids.map((id) => toggleCustomerActive(id, active)));
      toast.success(`${active ? "Activated" : "Deactivated"} ${ids.length} customer(s)`);
    } catch (err: any) {
      setCustomers(previousCustomers);
      setSelectedIds(ids);
      toast.error(err?.response?.data?.message || "Failed to update selected customers");
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => !ids.includes(id)));
    }
  };

  const handleToggleActive = async (row: CustomerRow) => {
    const nextActive = !isActiveCustomer(row);
    const previousCustomers = customers;

    setUpdatingIds((prev) => Array.from(new Set([...prev, row.id])));
    setCustomers((rows) => applyCustomerStatus(rows, [row.id], nextActive));
    setSelectedIds((prev) => prev.filter((id) => id !== row.id));

    try {
      await toggleCustomerActive(row.id, nextActive);
      toast.success(`Customer ${nextActive ? "activated" : "deactivated"}`);
    } catch (err: any) {
      setCustomers(previousCustomers);
      toast.error(err?.response?.data?.message || "Failed to update customer status");
    } finally {
      setUpdatingIds((prev) => prev.filter((id) => id !== row.id));
    }
  };

  const openCustomer = (row: CustomerRow, path: string) => {
    writeCustomerDetailCache(row);
    router.push(path);
  };

  useEffect(() => {
    const silent = silentSortFetchRef.current;
    silentSortFetchRef.current = false;
    const fetchSilently = silent || hasCustomerRowsRef.current;
    const delay = search.trim() ? 150 : 250;
    const timeout = setTimeout(() => fetchCustomers({ silent: fetchSilently }), delay);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly, advancedSearchValues]);

  useEffect(() => {
    setSelectedIds([]);
  }, [search, currentPage, perPage, sortBy, sortOrder, showInactiveOnly]);

  const customerStats = useMemo(() => {
    const active = customers.filter((c) => isActiveCustomer(c)).length;
    const inactive = customers.filter((c) => !isActiveCustomer(c)).length;
    return { visible: customers.length, active, inactive };
  }, [customers]);

  const columns: Column<CustomerRow>[] = [
    {
      key: "select",
      header: (
        <input
          type="checkbox"
          checked={customers.length > 0 && customers.every((u) => selectedIds.includes(u.id))}
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
      key: "type",
      header: "Type",
      sortable: true,
      sortField: "type",
      render: (row) => row.type ?? row.role ?? "Customer",
    },
    {
      key: "date_registered",
      header: "Date Registered",
      sortable: true,
      sortField: "created_at",
      defaultSortOrder: "desc",
      render: (row) => (
        <CmsModuleDate value={row.date_registered ?? (row.created_at ? new Date(row.created_at).toLocaleDateString() : "")} />
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      sortField: "status",
      defaultSortOrder: "asc",
      render: (row) => (
        <CmsModuleStatusBadge
          status={isActiveCustomer(row) ? "active" : "inactive"}
          label={row.status}
        />
      ),
    },
    {
      key: "options",
      header: "Actions",
      render: (row) => (
        <CmsModuleRowActions>
          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="View"
            onMouseEnter={() => router.prefetch(`/customers/view/${row.id}`)}
            onClick={() => openCustomer(row, `/customers/view/${row.id}`)}
            type="button"
          >
            <i className="fas fa-eye" />
          </button>

          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="Edit"
            onMouseEnter={() => router.prefetch(`/customers/edit/${row.id}`)}
            onClick={() => openCustomer(row, `/customers/edit/${row.id}`)}
            type="button"
          >
            <i className="fas fa-edit" />
          </button>

          <button
            className="btn btn-link p-0"
            title={isActiveCustomer(row) ? "Deactivate" : "Activate"}
            onClick={() => handleToggleActive(row)}
            disabled={updatingIds.includes(row.id)}
            style={{
              color: isActiveCustomer(row) ? "#198754" : "#6c757d",
              opacity: updatingIds.includes(row.id) ? 0.5 : 1,
            }}
            type="button"
          >
            <i className={`fas ${isActiveCustomer(row) ? "fa-toggle-on" : "fa-toggle-off"}`} />
          </button>
        </CmsModuleRowActions>
      ),
    },
  ];

  return (
    <CmsModuleShell
      title="Manage Customers"
      description="View and manage customer accounts. Activate or deactivate customers, or filter to show inactive accounts only."
      icon="fa-solid fa-user-group"
      actions={<CmsModuleCreateButton href="/customers/create" label="Create Customer" />}
      stats={[
        { label: "Showing", value: customerStats.visible },
        { label: "Active", value: customerStats.active, tone: "published" },
        { label: "Inactive", value: customerStats.inactive, tone: "private" },
      ]}
      toolbar={(
      <SearchBar
        placeholder="Search customers"
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
              disabled={selectedIds.length === 0 || loading || updatingIds.length > 0}
            >
              Activate
            </button>
            <button
              className="list-group-item list-group-item-action"
              onClick={() => bulkSetActive(false)}
              type="button"
              disabled={selectedIds.length === 0 || loading || updatingIds.length > 0}
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
          { name: "dateRegisteredFrom", label: "Date Registered (From)", type: "date" },
          { name: "dateRegisteredTo", label: "Date Registered (To)", type: "date" },
          {
            name: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Active", value: "" },
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
      <DataTable<CustomerRow>
        columns={columns}
        data={customers}
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
    </CmsModuleShell>
  );
}

ManageCustomers.Layout = AdminLayout;
export default ManageCustomers;
