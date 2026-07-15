import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import ConfirmModal from "@/components/UI/ConfirmModal";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import { Coupon, createCoupon, deleteCoupon, getCoupons, updateCoupon } from "@/services/couponService";
import { toast } from "@/lib/toast";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  discount_type: "fixed",
  discount_value: 0,
  usage_limit: "",
  starts_at: "",
  ends_at: "",
  status: "active",
};

function ManageCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const fetchCoupons = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const res = await getCoupons({ search, page: currentPage, per_page: perPage }, opts);
      setCoupons(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.last_page ?? 1);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchCoupons({ silent: true }), 350);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  const openCreate = () => {
    setSelected(null);
    setForm(emptyForm);
    setModalMode("create");
  };

  const openEdit = (coupon: Coupon) => {
    setSelected(coupon);
    setForm({
      code: coupon.code ?? "",
      name: coupon.name ?? "",
      description: coupon.description ?? "",
      discount_type: coupon.discount_type ?? "fixed",
      discount_value: coupon.discount_value ?? 0,
      usage_limit: coupon.usage_limit ?? "",
      starts_at: formatDateInput(coupon.starts_at),
      ends_at: formatDateInput(coupon.ends_at),
      status: coupon.status ?? "active",
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
  };

  const submit = async () => {
    if (!form.code || !form.name) {
      toast.error("Code and name are required");
      return;
    }

    const payload = {
      ...form,
      usage_limit: form.usage_limit === "" ? null : Number(form.usage_limit),
      discount_value: Number(form.discount_value || 0),
      starts_at: form.starts_at || null,
      ends_at: form.ends_at || null,
    };

    try {
      if (modalMode === "edit" && selected) {
        await updateCoupon(selected.id, payload);
        toast.success("Coupon updated");
      } else {
        await createCoupon(payload);
        toast.success("Coupon created");
      }
      closeModal();
      fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save coupon");
    }
  };

  const remove = (coupon: Coupon) => {
    setDeleteTarget(coupon);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteCoupon(deleteTarget.id);
      toast.success("Coupon deleted");
      setDeleteTarget(null);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete coupon");
    }
  };

  const columns: Column<Coupon>[] = [
    { key: "code", header: "Code", sortable: true, render: (row) => <span className="fw-bold">{row.code}</span> },
    { key: "name", header: "Name", sortable: true },
    {
      key: "discount",
      header: "Discount",
      render: (row) => row.discount_type === "percent" ? `${row.discount_value}%` : money(row.discount_value),
    },
    {
      key: "usage",
      header: "Usage",
      render: (row) => `${row.used_count ?? 0}${row.usage_limit ? ` / ${row.usage_limit}` : ""}`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <span className={`badge ${row.status === "active" ? "bg-success" : "bg-secondary"}`}>{row.status}</span>,
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          <button className="btn btn-link p-0 me-2 text-secondary" title="View" onClick={() => { setSelected(row); setModalMode("view"); }} type="button">
            <i className="fas fa-eye" />
          </button>
          <button className="btn btn-link p-0 me-2 text-secondary" title="Edit" onClick={() => openEdit(row)} type="button">
            <i className="fas fa-edit" />
          </button>
          <button className="btn btn-link p-0 text-danger" title="Delete" onClick={() => remove(row)} type="button">
            <i className="fas fa-trash" />
          </button>
        </>
      ),
    },
  ];

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-3">Manage Coupons</h3>

      <SearchBar
        placeholder="Search coupons"
        value={search}
        onChange={(v) => { setSearch(v); setCurrentPage(1); }}
        showFiltersButton={false}
        showActionsButton={false}
        rightExtras={(
          <button className="btn btn-primary" onClick={openCreate} type="button" style={{ height: 40, whiteSpace: "nowrap" }}>
            Create Coupon
          </button>
        )}
      />

      <DataTable<Coupon>
        columns={columns}
        data={coupons}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n) => { setPerPage(n); setCurrentPage(1); }}
      />

      {modalMode && (
        <CouponModal
          mode={modalMode}
          coupon={selected}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={submit}
        />
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Coupon"
        message={<>Are you sure you want to delete <strong>{deleteTarget?.code}</strong>?</>}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function CouponModal({ mode, coupon, form, setForm, onClose, onSubmit }: any) {
  const readonly = mode === "view";
  const title = mode === "create" ? "Create Coupon" : mode === "edit" ? "Edit Coupon" : "View Coupon";
  const display = coupon ?? form;

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ background: "rgba(15,23,42,0.35)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>
          <div className="modal-body">
            {readonly ? (
              <div className="row g-3">
                <ReadField label="Code" value={display.code} />
                <ReadField label="Name" value={display.name} />
                <ReadField label="Discount" value={display.discount_type === "percent" ? `${display.discount_value}%` : money(display.discount_value)} />
                <ReadField label="Usage" value={`${display.used_count ?? 0}${display.usage_limit ? ` / ${display.usage_limit}` : ""}`} />
                <ReadField label="Starts At" value={formatDate(display.starts_at)} />
                <ReadField label="Ends At" value={formatDate(display.ends_at)} />
                <ReadField label="Status" value={display.status} />
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <div className="form-control bg-light" style={{ minHeight: 80 }}>{display.description || "-"}</div>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Code *</label>
                  <input className="form-control" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Name *</label>
                  <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Discount Type</label>
                  <select className="form-select" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
                    <option value="fixed">Fixed</option>
                    <option value="percent">Percent</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Discount Value</label>
                  <input type="number" min="0" step="0.01" className="form-control" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Usage Limit</label>
                  <input type="number" min="0" className="form-control" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Starts At</label>
                  <input type="date" className="form-control" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
                </div>
                <div className="col-md-4">
                  <label className="form-label">Ends At</label>
                  <input type="date" className="form-control" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button className="btn btn-outline-secondary" onClick={onClose} type="button">Close</button>
            {!readonly && <button className="btn btn-primary" onClick={onSubmit} type="button">Save</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: any }) {
  return (
    <div className="col-md-6">
      <label className="form-label">{label}</label>
      <div className="form-control bg-light">{value || "-"}</div>
    </div>
  );
}

const money = (value: any) => Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";
const formatDateInput = (value?: string | null) => value ? String(value).slice(0, 10) : "";

ManageCoupons.Layout = AdminLayout;
export default ManageCoupons;
