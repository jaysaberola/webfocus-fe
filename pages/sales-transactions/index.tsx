import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import ConfirmModal from "@/components/UI/ConfirmModal";
import DataTable, { Column } from "@/components/UI/DataTable";
import {
  SalesTransaction,
  createSalesTransaction,
  deleteSalesTransaction,
  getSalesTransactions,
  updateSalesTransaction,
} from "@/services/salesTransactionService";
import { toast } from "@/lib/toast";

const emptyForm = {
  transaction_no: "",
  customer_name: "",
  customer_email: "",
  subtotal: 0,
  discount_total: 0,
  tax_total: 0,
  shipping_total: 0,
  payment_status: "pending",
  order_status: "pending",
  notes: "",
  transacted_at: "",
  items: [] as any[],
};

function ManageSalesTransactions() {
  const [transactions, setTransactions] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [orderStatus, setOrderStatus] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [orderStart, setOrderStart] = useState("");
  const [orderEnd, setOrderEnd] = useState("");
  const [neededStart, setNeededStart] = useState("");
  const [neededEnd, setNeededEnd] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "view" | null>(null);
  const [selected, setSelected] = useState<SalesTransaction | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesTransaction | null>(null);
  const [form, setForm] = useState<any>(emptyForm);

  const fetchTransactions = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const res = await getSalesTransactions({
        search,
        order_status: orderStatus,
        transacted_at_from: orderStart,
        transacted_at_to: orderEnd,
        source,
        delivery_type: deliveryType,
        delivery_address: deliveryAddress,
        date_needed_from: neededStart,
        date_needed_to: neededEnd,
        page: currentPage,
        per_page: perPage,
      }, opts);
      setTransactions(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.last_page ?? 1);
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchTransactions({ silent: true }), 350);
    return () => clearTimeout(timeout);
  }, [currentPage, deliveryAddress, deliveryType, neededEnd, neededStart, orderEnd, orderStart, orderStatus, perPage, search, source]);

  const resetFilters = () => {
    setSource("");
    setOrderStatus("");
    setDeliveryType("");
    setDeliveryAddress("");
    setOrderStart("");
    setOrderEnd("");
    setNeededStart("");
    setNeededEnd("");
    setSearch("");
    setCurrentPage(1);
  };

  const openEdit = (transaction: SalesTransaction) => {
    setSelected(transaction);
    setForm({
      transaction_no: transaction.transaction_no ?? "",
      customer_name: transaction.customer_name ?? "",
      customer_email: transaction.customer_email ?? "",
      subtotal: transaction.subtotal ?? 0,
      discount_total: transaction.discount_total ?? 0,
      tax_total: transaction.tax_total ?? 0,
      shipping_total: transaction.shipping_total ?? 0,
      payment_status: transaction.payment_status ?? "pending",
      order_status: transaction.order_status ?? "pending",
      notes: transaction.notes ?? "",
      transacted_at: formatDateInput(transaction.transacted_at),
      items: normalizeItems(transaction.items ?? []),
    });
    setModalMode("edit");
  };

  const closeModal = () => {
    setModalMode(null);
    setSelected(null);
  };

  const submit = async () => {
    const items = normalizeItems(form.items ?? []).filter((item) => item.name.trim());
    const itemSubtotal = items.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
    const payload = {
      ...form,
      transaction_no: form.transaction_no || null,
      items,
      subtotal: items.length ? itemSubtotal : Number(form.subtotal || 0),
      discount_total: Number(form.discount_total || 0),
      tax_total: Number(form.tax_total || 0),
      shipping_total: Number(form.shipping_total || 0),
      transacted_at: form.transacted_at || null,
    };

    try {
      if (modalMode === "edit" && selected) {
        await updateSalesTransaction(selected.id, payload);
        toast.success("Sales transaction updated");
      } else {
        await createSalesTransaction(payload);
        toast.success("Sales transaction created");
      }
      closeModal();
      fetchTransactions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to save sales transaction");
    }
  };

  const remove = (transaction: SalesTransaction) => {
    setDeleteTarget(transaction);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteSalesTransaction(deleteTarget.id);
      toast.success("Sales transaction deleted");
      setDeleteTarget(null);
      fetchTransactions();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete sales transaction");
    }
  };

  const columns: Column<SalesTransaction>[] = [
    {
      key: "checklist",
      header: "",
      width: 46,
      render: () => <input className="st-check" type="checkbox" aria-label="Select transaction" />,
    },
    { key: "transaction_no", header: "Transaction No.", sortable: true, minWidth: 170, render: (row) => <span className="fw-bold">{row.transaction_no}</span> },
    { key: "customer_name", header: "Customer", sortable: true, render: (row) => row.customer_name || row.customer_email || "-" },
    { key: "product_name", header: "Service or Product Name", minWidth: 190, render: (row) => transactionItemSummary(row) },
    { key: "grand_total", header: "Total", sortable: true, render: (row) => money(row.grand_total) },
    {
      key: "payment_status",
      header: "Payment Status",
      minWidth: 150,
      render: (row) => (
        <span className={`badge ${String(row.payment_status).toLowerCase() === "paid" ? "bg-success" : "bg-secondary"}`}>
          {row.payment_status}
        </span>
      ),
    },
    {
      key: "order_status",
      header: "Order Status",
      minWidth: 140,
      render: (row) => <span className="badge bg-info text-dark">{row.order_status}</span>,
    },
    { key: "transacted_at", header: "Ordered Date", minWidth: 130, render: (row) => formatDate(row.transacted_at) },
    { key: "date_needed", header: "Date Needed", minWidth: 130, render: () => "-" },
    {
      key: "options",
      header: "Actions",
      minWidth: 130,
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
      <h3 className="mb-4">Sales Transaction Manager</h3>

      <div className="st-filter-grid mb-3">
        <select className="form-select" value={source} onChange={(e) => { setSource(e.target.value); setCurrentPage(1); }}>
          <option value="">0 selected source</option>
          <option value="website">Website</option>
          <option value="walk-in">Walk-in</option>
        </select>
        <select className="form-select" value={orderStatus} onChange={(e) => { setOrderStatus(e.target.value); setCurrentPage(1); }}>
          <option value="">Order Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" className="form-control" aria-label="Start Date Order" value={orderStart} onChange={(e) => { setOrderStart(e.target.value); setCurrentPage(1); }} />
        <input type="date" className="form-control" aria-label="End Date Order" value={orderEnd} onChange={(e) => { setOrderEnd(e.target.value); setCurrentPage(1); }} />
        <input className="form-control" placeholder="Order, Customer" value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
        <button className="btn btn-secondary dropdown-toggle" type="button">Filters</button>
        <button className="btn btn-success" type="button" onClick={() => { setCurrentPage(1); fetchTransactions(); }}>Search</button>
        <button className="btn btn-info text-white" type="button" onClick={resetFilters}>Reset</button>

        <select className="form-select" value={deliveryType} onChange={(e) => { setDeliveryType(e.target.value); setCurrentPage(1); }}>
          <option value="">Delivery Type</option>
          <option value="pickup">Pickup</option>
          <option value="door-to-door">Door-to-door</option>
        </select>
        <input type="date" className="form-control" aria-label="Start Date Needed" value={neededStart} onChange={(e) => { setNeededStart(e.target.value); setCurrentPage(1); }} />
        <input type="date" className="form-control" aria-label="End Date Needed" value={neededEnd} onChange={(e) => { setNeededEnd(e.target.value); setCurrentPage(1); }} />
        <select className="form-select" value={deliveryAddress} onChange={(e) => { setDeliveryAddress(e.target.value); setCurrentPage(1); }}>
          <option value="">0 selected delivery address</option>
        </select>
      </div>

      <DataTable<SalesTransaction>
        columns={columns}
        data={transactions}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n) => { setPerPage(n); setCurrentPage(1); }}
      />

      {modalMode && (
        <TransactionModal
          mode={modalMode}
          transaction={selected}
          form={form}
          setForm={setForm}
          onClose={closeModal}
          onSubmit={submit}
        />
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Sales Transaction"
        message={<>Are you sure you want to delete <strong>{deleteTarget?.transaction_no}</strong>?</>}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style jsx>{`
        .st-filter-grid {
          display: grid;
          grid-template-columns: 150px 170px 180px 210px minmax(200px, 1fr) 90px 80px 80px;
          gap: 3px;
          align-items: stretch;
        }
        .st-filter-grid :global(.form-control),
        .st-filter-grid :global(.form-select),
        .st-filter-grid :global(.btn) {
          min-height: 39px;
          border-radius: 4px;
          font-size: 13px;
        }
        :global(.st-check) {
          width: 18px;
          height: 18px;
          border: 2px solid #94a3b8;
          cursor: pointer;
        }
        @media (max-width: 1300px) {
          .st-filter-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
        @media (max-width: 760px) {
          .st-filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function TransactionModal({ mode, transaction, form, setForm, onClose, onSubmit }: any) {
  const readonly = mode === "view";
  const title = mode === "create" ? "Create Sales Transaction" : mode === "edit" ? "Edit Sales Transaction" : "View Sales Transaction";
  const display = transaction ?? form;
  const displayItems = normalizeItems(readonly ? (display.items ?? []) : (form.items ?? []));
  const itemSubtotal = displayItems.reduce((sum, item) => sum + Number(item.total_price || 0), 0);
  const computedTotal = useMemo(() => {
    return Math.max(
      0,
      Number(itemSubtotal || form.subtotal || 0) - Number(form.discount_total || 0) + Number(form.tax_total || 0) + Number(form.shipping_total || 0)
    );
  }, [itemSubtotal, form.subtotal, form.discount_total, form.tax_total, form.shipping_total]);
  const updateItem = (index: number, key: string, value: any) => {
    const next = normalizeItems(form.items ?? []);
    next[index] = { ...next[index], [key]: value };
    if (key === "price" || key === "quantity") {
      next[index].total_price = Number(next[index].price || 0) * Number(next[index].quantity || 0);
    }
    setForm({ ...form, items: next, subtotal: next.reduce((sum, item) => sum + Number(item.total_price || 0), 0) });
  };
  const addItem = () => {
    setForm({
      ...form,
      items: [...normalizeItems(form.items ?? []), { name: "", item_type: "product", price: 0, quantity: 1, total_price: 0 }],
    });
  };
  const removeItem = (index: number) => {
    const next = normalizeItems(form.items ?? []).filter((_, itemIndex) => itemIndex !== index);
    setForm({ ...form, items: next, subtotal: next.reduce((sum, item) => sum + Number(item.total_price || 0), 0) });
  };

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
                <ReadField label="Transaction No." value={display.transaction_no} />
                <ReadField label="Customer Name" value={display.customer_name} />
                <ReadField label="Customer Email" value={display.customer_email} />
                <ReadField label="Subtotal" value={money(display.subtotal)} />
                <ReadField label="Discount" value={money(display.discount_total)} />
                <ReadField label="Tax" value={money(display.tax_total)} />
                <ReadField label="Shipping" value={money(display.shipping_total)} />
                <ReadField label="Grand Total" value={money(display.grand_total)} />
                <ReadField label="Payment Status" value={display.payment_status} />
                <ReadField label="Order Status" value={display.order_status} />
                <ReadField label="Date" value={formatDate(display.transacted_at)} />
                <div className="col-12">
                  <ItemsTable items={displayItems} />
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <div className="form-control bg-light" style={{ minHeight: 80 }}>{display.notes || "-"}</div>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Transaction No.</label>
                  <input className="form-control" placeholder="Auto-generated if blank" value={form.transaction_no} onChange={(e) => setForm({ ...form, transaction_no: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-control" value={form.transacted_at} onChange={(e) => setForm({ ...form, transacted_at: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Customer Name</label>
                  <input className="form-control" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Customer Email</label>
                  <input type="email" className="form-control" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
                </div>
                <MoneyInput label="Subtotal" value={form.subtotal} onChange={(v: string) => setForm({ ...form, subtotal: v })} />
                <MoneyInput label="Discount" value={form.discount_total} onChange={(v: string) => setForm({ ...form, discount_total: v })} />
                <MoneyInput label="Tax" value={form.tax_total} onChange={(v: string) => setForm({ ...form, tax_total: v })} />
                <MoneyInput label="Shipping" value={form.shipping_total} onChange={(v: string) => setForm({ ...form, shipping_total: v })} />
                <div className="col-12">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label mb-0">Items</label>
                    <button className="btn btn-sm btn-outline-primary" type="button" onClick={addItem}>
                      Add Item
                    </button>
                  </div>
                  <EditableItemsTable items={displayItems} onChange={updateItem} onRemove={removeItem} />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Payment Status</label>
                  <select className="form-select" value={form.payment_status} onChange={(e) => setForm({ ...form, payment_status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="failed">Failed</option>
                    <option value="refunded">Refunded</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Order Status</label>
                  <select className="form-select" value={form.order_status} onChange={(e) => setForm({ ...form, order_status: e.target.value })}>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Grand Total</label>
                  <div className="form-control bg-light">{money(computedTotal)}</div>
                </div>
                <div className="col-12">
                  <label className="form-label">Notes</label>
                  <textarea className="form-control" rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
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
      <style jsx global>{`
        .st-items-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: auto;
        }
        .st-items-table {
          border-collapse: collapse;
          min-width: 720px;
          width: 100%;
        }
        .st-items-table th {
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 800;
          padding: 9px 10px;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .st-items-table td {
          border-top: 1px solid #eef2f7;
          color: #334155;
          font-size: 13px;
          padding: 9px 10px;
          vertical-align: middle;
        }
        .st-items-table .form-control,
        .st-items-table .form-select {
          min-height: 34px;
          font-size: 13px;
        }
      `}</style>
    </div>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: any; onChange: (value: string) => void }) {
  return (
    <div className="col-md-3">
      <label className="form-label">{label}</label>
      <input type="number" min="0" step="0.01" className="form-control" value={value} onChange={(e) => onChange(e.target.value)} />
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

function EditableItemsTable({ items, onChange, onRemove }: { items: any[]; onChange: (index: number, key: string, value: any) => void; onRemove: (index: number) => void }) {
  return (
    <div className="st-items-wrap">
      <table className="st-items-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Type</th>
            <th className="text-end">Price</th>
            <th className="text-end">Qty</th>
            <th className="text-end">Total</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={6} className="text-center text-muted py-3">No items added.</td></tr>
          ) : items.map((item, index) => (
            <tr key={item.id ?? index}>
              <td><input className="form-control" value={item.name} onChange={(e) => onChange(index, "name", e.target.value)} /></td>
              <td>
                <select className="form-select" value={item.item_type || "product"} onChange={(e) => onChange(index, "item_type", e.target.value)}>
                  <option value="product">Product</option>
                  <option value="service">Service</option>
                </select>
              </td>
              <td><input className="form-control text-end" type="number" min="0" step="0.01" value={item.price} onChange={(e) => onChange(index, "price", e.target.value)} /></td>
              <td><input className="form-control text-end" type="number" min="0" step="1" value={item.quantity} onChange={(e) => onChange(index, "quantity", e.target.value)} /></td>
              <td className="text-end fw-bold">{money(item.total_price)}</td>
              <td className="text-end"><button className="btn btn-link text-danger p-0" type="button" onClick={() => onRemove(index)}><i className="fas fa-trash" /></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ItemsTable({ items }: { items: any[] }) {
  return (
    <div className="st-items-wrap">
      <table className="st-items-table">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Type</th>
            <th className="text-end">Price</th>
            <th className="text-end">Qty</th>
            <th className="text-end">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr><td colSpan={5} className="text-center text-muted py-3">No items added.</td></tr>
          ) : items.map((item, index) => (
            <tr key={item.id ?? index}>
              <td>{item.name}</td>
              <td>{pretty(item.item_type)}</td>
              <td className="text-end">{money(item.price)}</td>
              <td className="text-end">{Number(item.quantity || 0).toLocaleString("en-PH")}</td>
              <td className="text-end fw-bold">{money(item.total_price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const money = (value: any) => Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });
const formatDate = (value?: string | null) => value ? new Date(value).toLocaleDateString() : "-";
const formatDateInput = (value?: string | null) => value ? String(value).slice(0, 10) : "";
const pretty = (value?: string | null) => value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";
const normalizeItems = (items: any[]) => items.map((item) => ({
  ...item,
  name: String(item?.name ?? ""),
  item_type: item?.item_type ?? "product",
  price: Number(item?.price || 0),
  quantity: Number(item?.quantity || 0),
  total_price: Number(item?.total_price ?? Number(item?.price || 0) * Number(item?.quantity || 0)),
}));
const transactionItemSummary = (transaction: SalesTransaction) => {
  const items = normalizeItems(transaction.items ?? []);
  if (items.length) return items.length === 1 ? items[0].name : `${items[0].name} + ${items.length - 1} more`;
  return extractProductName(transaction.notes);
};
const extractProductName = (notes?: string | null) => {
  if (!notes) return "-";
  const lines = String(notes).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const itemLine = lines.find((line) => /^\d+\s*x\s+/i.test(line));
  return itemLine ? itemLine.replace(/^\d+\s*x\s+/i, "").replace(/\s*@\s*.+$/, "") : "-";
};

ManageSalesTransactions.Layout = AdminLayout;
export default ManageSalesTransactions;
