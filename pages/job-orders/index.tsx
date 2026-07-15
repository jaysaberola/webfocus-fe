import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/Layout/AdminLayout";
import ConfirmModal from "@/components/UI/ConfirmModal";
import DataTable, { Column } from "@/components/UI/DataTable";
import { toast } from "@/lib/toast";
import { deleteJobOrder, getJobOrder, getJobOrders, JobOrder } from "@/services/jobOrderService";

const sources = ["", "Roces Branch", "Tandang Sora Head Office"];
const deliveryTypes = ["", "Door-to-door", "Pickup", "Store delivery"];

function ManageJobOrders() {
  const [orders, setOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [orderStart, setOrderStart] = useState("");
  const [orderEnd, setOrderEnd] = useState("");
  const [neededStart, setNeededStart] = useState("");
  const [neededEnd, setNeededEnd] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [detailOrder, setDetailOrder] = useState<JobOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<JobOrder | null>(null);

  const fetchOrders = async (opts?: { silent?: boolean }) => {
    try {
      if (!opts?.silent) setLoading(true);
      const res = await getJobOrders({
        search,
        source,
        delivery_type: deliveryType,
        order_date_from: orderStart,
        order_date_to: orderEnd,
        date_needed_from: neededStart,
        date_needed_to: neededEnd,
        page: currentPage,
        per_page: perPage,
      }, opts);
      setOrders(Array.isArray(res?.data) ? res.data : []);
      setTotalPages(res?.last_page ?? 1);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load job orders");
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => fetchOrders({ silent: true }), 350);
    return () => clearTimeout(timeout);
  }, [currentPage, deliveryType, neededEnd, neededStart, orderEnd, orderStart, perPage, search, source]);

  const resetFilters = () => {
    setSource("");
    setDeliveryType("");
    setOrderStart("");
    setOrderEnd("");
    setNeededStart("");
    setNeededEnd("");
    setSearch("");
    setCurrentPage(1);
  };

  const remove = (order: JobOrder) => {
    setDeleteTarget(order);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      await deleteJobOrder(deleteTarget.id);
      toast.success("Job order deleted");
      setDeleteTarget(null);
      fetchOrders();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to delete job order");
    }
  };

  const openDetails = async (order: JobOrder) => {
    try {
      setDetailLoading(true);
      setDetailOrder(order);
      const freshOrder = await getJobOrder(order.id, { silent: true });
      setDetailOrder(freshOrder);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to load job order details");
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: Column<JobOrder>[] = [
    { key: "jo_no", header: "JO No.", sortable: true, minWidth: 130, render: (row) => <strong>{row.jo_no}</strong> },
    { key: "customer_name", header: "Customer/Branch", sortable: true, minWidth: 160, render: (row) => row.customer_name || "-" },
    { key: "product", header: "Product", sortable: true, minWidth: 210, render: (row) => row.items?.[0]?.name || "-" },
    { key: "total_quantity", header: "Qty", sortable: true, render: (row) => Number(row.total_quantity || 0).toFixed(1) },
    { key: "total", header: "Price", sortable: true, render: (row) => money(row.total || 0) },
    { key: "source", header: "Source", minWidth: 160 },
    { key: "category", header: "Category", render: (row) => row.category || "-" },
    { key: "date_needed", header: "Date Needed", minWidth: 150, render: (row) => formatDateTime(row.date_needed) },
    { key: "status", header: "Status", minWidth: 120 },
    {
      key: "action",
      header: "Action",
      minWidth: 140,
      render: (row) => (
        <div className="btn-group btn-group-sm">
          <button className="btn btn-secondary" type="button" onClick={() => openDetails(row)}>Details</button>
          <button className="btn btn-danger" type="button" onClick={() => remove(row)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="container-fluid px-4 pt-3">
      <h3 className="mb-4">Manage Job Orders</h3>

      <div className="jo-filter-grid mb-3">
        <select className="form-select" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">Source</option>
          {sources.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="date" className="form-control" aria-label="Start Date Order" value={orderStart} onChange={(e) => setOrderStart(e.target.value)} />
        <input type="date" className="form-control" aria-label="End Date Order" value={orderEnd} onChange={(e) => setOrderEnd(e.target.value)} />
        <input className="form-control" placeholder="Order, Customer" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn btn-secondary" type="button">Filters</button>
        <button className="btn btn-success" type="button" onClick={() => { setCurrentPage(1); fetchOrders(); }}>Search</button>
        <button className="btn btn-info text-white" type="button" onClick={resetFilters}>Reset</button>
        <button className="btn btn-danger" type="button">Import</button>

        <select className="form-select" value={deliveryType} onChange={(e) => setDeliveryType(e.target.value)}>
          <option value="">Delivery Type</option>
          {deliveryTypes.filter(Boolean).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <input type="date" className="form-control" aria-label="Start Date Needed" value={neededStart} onChange={(e) => setNeededStart(e.target.value)} />
        <input type="date" className="form-control" aria-label="End Date Needed" value={neededEnd} onChange={(e) => setNeededEnd(e.target.value)} />
        <Link className="btn btn-primary" href="/job-orders/create">Create a Job Order</Link>
      </div>

      <DataTable<JobOrder>
        columns={columns}
        data={orders}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={perPage}
        onItemsPerPageChange={(n) => { setPerPage(n); setCurrentPage(1); }}
        wrapperStyle={{ borderRadius: 4 }}
      />

      {detailOrder && (
        <JobOrderDetailsModal
          order={detailOrder}
          loading={detailLoading}
          onClose={() => setDetailOrder(null)}
        />
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete Job Order"
        message={<>Are you sure you want to delete <strong>{deleteTarget?.jo_no}</strong>?</>}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style jsx global>{`
        .jo-filter-grid {
          display: grid;
          grid-template-columns: 140px 160px 160px 200px 80px 68px 62px 80px;
          gap: 3px;
          align-items: stretch;
        }
        .jo-filter-grid :global(.btn),
        .jo-filter-grid :global(.form-control),
        .jo-filter-grid :global(.form-select) {
          min-height: 34px;
          font-size: 12px;
          border-radius: 4px;
        }
        .jo-filter-grid :global(.btn-primary) {
          grid-column: span 2;
        }
        @media (max-width: 1100px) {
          .jo-filter-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .jo-filter-grid :global(.btn-primary) {
            grid-column: span 1;
          }
        }
        @media (max-width: 640px) {
          .jo-filter-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

function JobOrderDetailsModal({ order, loading, onClose }: { order: JobOrder; loading: boolean; onClose: () => void }) {
  const products = order.items?.filter((item) => !item.is_miscellaneous) ?? [];
  const miscItems = order.items?.filter((item) => item.is_miscellaneous) ?? [];

  return (
    <div className="jod-backdrop modal show d-block" tabIndex={-1}>
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content jod-modal">

          {/* ── Header ── */}
          <div className="jod-header">
            <div className="jod-header-left">
              <div className="jod-kicker"><i className="fa-solid fa-file-invoice" /> Job Order</div>
              <div className="jod-jo-no">{order.jo_no}</div>
              <div className="jod-subtitle">
                {order.customer_name || "No customer"}&nbsp;·&nbsp;{formatDateTime(order.order_date)}
              </div>
            </div>
            <div className="jod-header-right">
              <span className={`jod-status-pill jod-status-${statusClass(order.status)}`}>
                {order.status || "Open Date"}
              </span>
              <div className="jod-header-total">₱ {money(order.total || 0)}</div>
            </div>
            <button type="button" className="jod-close" onClick={onClose} aria-label="Close">
              <i className="fa-solid fa-xmark" />
            </button>
          </div>

          <div className="modal-body jod-body">
            {loading && (
              <div className="jod-refresh">
                <i className="fa-solid fa-rotate fa-spin" /> Refreshing details…
              </div>
            )}

            {/* ── Hero tiles ── */}
            <div className="jod-hero">
              <div className="jod-hero-tile jod-hero-customer">
                <div className="jod-hero-icon jod-icon-blue"><i className="fa-solid fa-user" /></div>
                <div className="jod-hero-body">
                  <span className="jod-hero-label">Customer</span>
                  <strong className="jod-hero-name">{order.customer_name || "—"}</strong>
                  <small className="jod-hero-sub">{order.customer_email || order.customer_contact || "No contact details"}</small>
                </div>
              </div>
              <div className="jod-hero-tile">
                <div className="jod-hero-icon jod-icon-slate"><i className="fa-solid fa-truck" /></div>
                <div className="jod-hero-body">
                  <span className="jod-hero-label">Delivery</span>
                  <strong className="jod-hero-name">{order.delivery_type || "—"}</strong>
                  <small className="jod-hero-sub">{order.delivery_location || order.delivery_address || "No delivery location"}</small>
                </div>
              </div>
              <div className="jod-hero-tile jod-hero-total">
                <div className="jod-hero-icon jod-icon-teal"><i className="fa-solid fa-receipt" /></div>
                <div className="jod-hero-body">
                  <span className="jod-hero-label">Total</span>
                  <strong className="jod-hero-name jod-hero-total-val">₱ {money(order.total || 0)}</strong>
                  <small className="jod-hero-sub">{order.total_quantity ?? 0} total item(s)</small>
                </div>
              </div>
            </div>

            {/* ── Info grid ── */}
            <div className="jod-info-grid">
              <div className="jod-info-card">
                <div className="jod-card-head"><span className="jod-card-dot jod-dot-blue" />Order</div>
                <div className="jod-card-body">
                  <div className="jod-rl"><span>JO No.</span><strong>{order.jo_no || "—"}</strong></div>
                  <div className="jod-rl"><span>Source</span><strong>{order.source || "—"}</strong></div>
                  <div className="jod-rl"><span>Category</span><strong>{order.category || "—"}</strong></div>
                  <div className="jod-rl"><span>Order Date</span><strong>{formatDateTime(order.order_date)}</strong></div>
                  <div className="jod-rl"><span>Date Needed</span><strong>{formatDateTime(order.date_needed)}</strong></div>
                </div>
              </div>
              <div className="jod-info-card">
                <div className="jod-card-head"><span className="jod-card-dot jod-dot-violet" />Customer</div>
                <div className="jod-card-body">
                  <div className="jod-rl"><span>Type</span><strong>{pretty(order.customer_type)}</strong></div>
                  <div className="jod-rl"><span>Name</span><strong>{order.customer_name || "—"}</strong></div>
                  <div className="jod-rl"><span>Email</span><strong>{order.customer_email || "—"}</strong></div>
                  <div className="jod-rl"><span>Contact</span><strong>{order.customer_contact || "—"}</strong></div>
                </div>
              </div>
              <div className="jod-info-card">
                <div className="jod-card-head"><span className="jod-card-dot jod-dot-orange" />Delivery</div>
                <div className="jod-card-body">
                  <div className="jod-rl"><span>Delivery Type</span><strong>{order.delivery_type || "—"}</strong></div>
                  <div className="jod-rl"><span>Location</span><strong>{order.delivery_location || "—"}</strong></div>
                  <div className="jod-rl"><span>Address</span><strong>{order.delivery_address || "—"}</strong></div>
                  <div className="jod-rl"><span>Delivery Charge</span><strong>₱ {money(order.delivery_charge || 0)}</strong></div>
                </div>
              </div>
            </div>

            {/* ── Items tables ── */}
            {[
              { label: "Products", items: products, accent: "#16a34a" },
              { label: "Miscellaneous Products", items: miscItems, accent: "#7c3aed" },
            ].map(({ label, items, accent }) => (
              <div className="jod-items-card" key={label}>
                <div className="jod-card-head">
                  <span className="jod-card-dot" style={{ background: accent }} />{label}
                  <span className="jod-items-count">{items.length}</span>
                </div>
                <div className="jod-table-wrap">
                  <table className="jod-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Type</th>
                        <th className="jod-r">Price/Item</th>
                        <th className="jod-c">Qty</th>
                        <th className="jod-r">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="jod-empty">
                            <i className="fa-regular fa-folder-open" /> No {label.toLowerCase()} added.
                          </td>
                        </tr>
                      ) : items.map((item) => (
                        <tr key={item.id ?? `${item.name}-${item.quantity}`}>
                          <td><strong style={{ fontWeight: 600, color: "#0f172a" }}>{item.name}</strong></td>
                          <td><span className="jod-type-pill">{pretty(item.item_type)}</span></td>
                          <td className="jod-r">₱ {money(item.price)}</td>
                          <td className="jod-c"><span className="jod-qty-pill">{item.quantity}</span></td>
                          <td className="jod-r jod-total-cell">₱ {money(item.total_price ?? Number(item.price || 0) * item.quantity)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* ── Payments + Computation ── */}
            <div className="jod-bottom-grid">
              <div className="jod-items-card">
                <div className="jod-card-head"><span className="jod-card-dot jod-dot-blue" />Payments</div>
                <div className="jod-table-wrap">
                  <table className="jod-table">
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th className="jod-r">Amount</th>
                        <th>Remarks</th>
                        <th>Attachment</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.payments ?? []).length === 0 ? (
                        <tr><td colSpan={4} className="jod-empty"><i className="fa-regular fa-folder-open" /> No payments added.</td></tr>
                      ) : order.payments?.map((payment) => (
                        <tr key={payment.id ?? `${payment.payment_method}-${payment.amount}`}>
                          <td><span className="jod-pay-method">{payment.payment_method}</span></td>
                          <td className="jod-r jod-total-cell">₱ {money(payment.amount || 0)}</td>
                          <td className="jod-muted">{payment.remarks || "—"}</td>
                          <td className="jod-muted">{payment.attachment_path || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="jod-computation-card">
                <div className="jod-comp-header">
                  <div className="jod-comp-icon"><i className="fa-solid fa-calculator" /></div>
                  <div>
                    <div className="jod-comp-title">Computation</div>
                    <div className="jod-comp-sub">Order summary</div>
                  </div>
                </div>
                <div className="jod-comp-body">
                  <div className="jod-comp-line"><span>Total Quantity</span><strong>{order.total_quantity ?? 0}</strong></div>
                  <div className="jod-comp-line"><span>Delivery Charge</span><strong>₱ {money(order.delivery_charge || 0)}</strong></div>
                  <div className="jod-comp-line"><span>Sub Total</span><strong>₱ {money(order.subtotal || 0)}</strong></div>
                  <div className="jod-comp-divider" />
                  <div className="jod-comp-line"><span>Total Discount</span><strong className="jod-discount">− ₱ {money(order.discount_total || 0)}</strong></div>
                  <div className="jod-comp-total">
                    <span>Total</span>
                    <span className="jod-comp-total-val">₱ {money(order.total || 0)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Remarks ── */}
            <div className="jod-items-card">
              <div className="jod-card-head"><span className="jod-card-dot jod-dot-slate" />Remarks</div>
              <div className="jod-card-body">
                <div className="jod-remarks">{order.remarks || "—"}</div>
              </div>
            </div>
          </div>

          <div className="jod-footer">
            <button className="jod-close-btn" type="button" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        /* ── Backdrop / shell ── */
        .jod-backdrop { background: rgba(15,23,42,.6); backdrop-filter: blur(3px); }
        .jod-modal {
          border: 0;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(15,23,42,.35);
        }

        /* ── Header ── */
        .jod-header {
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          padding: 20px 22px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .jod-header-left { flex: 1; min-width: 0; }
        .jod-kicker {
          color: #93c5fd;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: .08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .jod-jo-no { color: #fff; font-size: 22px; font-weight: 800; line-height: 1.2; }
        .jod-subtitle { color: #94a3b8; font-size: 12.5px; margin-top: 4px; }
        .jod-header-right {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
          flex-shrink: 0;
        }
        .jod-header-total { color: #4ade80; font-size: 20px; font-weight: 800; white-space: nowrap; }
        .jod-status-pill {
          border-radius: 999px;
          font-size: 11.5px;
          font-weight: 800;
          padding: 5px 12px;
          white-space: nowrap;
        }
        .jod-status-status-open     { background: #fef3c7; color: #92400e; }
        .jod-status-status-processing { background: #dbeafe; color: #1d4ed8; }
        .jod-status-status-completed  { background: #dcfce7; color: #15803d; }
        .jod-status-status-cancelled  { background: #fee2e2; color: #b91c1c; }
        .jod-close {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.08);
          color: #fff;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
          transition: background .15s;
        }
        .jod-close:hover { background: rgba(255,255,255,.18); }

        /* ── Body ── */
        .jod-body { background: #f1f5f9; padding: 18px 20px 10px; overflow-y: auto; }
        .jod-footer {
          background: #fff;
          border-top: 1px solid #e2e8f0;
          padding: 12px 20px;
          display: flex;
          justify-content: flex-end;
        }
        .jod-close-btn {
          padding: 8px 22px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s;
        }
        .jod-close-btn:hover { background: #f8fafc; }

        /* ── Refresh banner ── */
        .jod-refresh {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 8px;
          color: #1d4ed8;
          font-size: 13px;
          margin-bottom: 14px;
          padding: 9px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        /* ── Hero tiles ── */
        .jod-hero {
          display: grid;
          grid-template-columns: 1.3fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 14px;
        }
        .jod-hero-tile {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
          box-shadow: 0 1px 3px rgba(15,23,42,.04);
        }
        .jod-hero-customer { border-left: 4px solid #2563eb; }
        .jod-hero-total    { border-left: 4px solid #0f766e; }
        .jod-hero-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px;
          flex-shrink: 0;
        }
        .jod-icon-blue   { background: #eff6ff; color: #2563eb; }
        .jod-icon-slate  { background: #f1f5f9; color: #475569; }
        .jod-icon-teal   { background: #f0fdfa; color: #0f766e; }
        .jod-hero-label  { display: block; color: #64748b; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; margin-bottom: 4px; }
        .jod-hero-name   { display: block; color: #0f172a; font-size: 14px; font-weight: 700; line-height: 1.3; overflow-wrap: anywhere; }
        .jod-hero-total-val { color: #0f766e !important; }
        .jod-hero-sub    { display: block; color: #94a3b8; font-size: 12px; margin-top: 3px; overflow-wrap: anywhere; }

        /* ── Cards ── */
        .jod-info-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 12px;
          margin-bottom: 14px;
        }
        .jod-info-card, .jod-items-card, .jod-computation-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(15,23,42,.04);
          margin-bottom: 14px;
        }
        .jod-card-head {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 14px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12.5px;
          font-weight: 800;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .jod-card-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          display: inline-block;
        }
        .jod-dot-blue   { background: #2563eb; }
        .jod-dot-violet { background: #7c3aed; }
        .jod-dot-orange { background: #ea580c; }
        .jod-dot-slate  { background: #64748b; }
        .jod-items-count {
          margin-left: auto;
          background: #e0f2fe;
          color: #0369a1;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          text-transform: none;
          letter-spacing: 0;
        }
        .jod-card-body { padding: 12px 14px; }

        /* ── Read lines ── */
        .jod-rl {
          display: grid;
          grid-template-columns: minmax(110px, 44%) minmax(0, 1fr);
          gap: 12px;
          padding: 7px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          align-items: start;
        }
        .jod-rl:last-child { border-bottom: 0; }
        .jod-rl span { color: #64748b; }
        .jod-rl strong { color: #0f172a; font-weight: 600; overflow-wrap: anywhere; text-align: right; }

        /* ── Tables ── */
        .jod-table-wrap { overflow: auto; }
        .jod-table { width: 100%; border-collapse: collapse; min-width: 480px; }
        .jod-table th {
          background: #f8fafc;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          padding: 9px 12px;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
        }
        .jod-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
          color: #334155;
          vertical-align: middle;
        }
        .jod-table tbody tr:last-child td { border-bottom: 0; }
        .jod-table tbody tr:hover td { background: #f8fafc; }
        .jod-r { text-align: right; }
        .jod-c { text-align: center; }
        .jod-empty { text-align: center; color: #94a3b8 !important; padding: 20px 12px !important; font-size: 13px !important; }
        .jod-muted  { color: #64748b; font-size: 12.5px; }
        .jod-type-pill { background: #f1f5f9; color: #475569; font-size: 11.5px; font-weight: 600; padding: 3px 8px; border-radius: 5px; white-space: nowrap; }
        .jod-qty-pill  { background: #e0f2fe; color: #0369a1; font-size: 12px; font-weight: 700; padding: 3px 10px; border-radius: 5px; }
        .jod-pay-method { font-weight: 600; color: #0f172a; }
        .jod-total-cell { font-weight: 700; color: #0f172a !important; }

        /* ── Bottom grid ── */
        .jod-bottom-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 14px;
          align-items: start;
          margin-bottom: 0;
        }
        .jod-bottom-grid .jod-items-card,
        .jod-bottom-grid .jod-computation-card { margin-bottom: 14px; }

        /* ── Computation card ── */
        .jod-comp-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 14px 16px;
          background: linear-gradient(135deg, #0f172a, #1e3a5f);
          border-bottom: 1px solid #1e3a5f;
        }
        .jod-comp-icon {
          width: 32px; height: 32px;
          background: rgba(255,255,255,.12);
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 14px;
        }
        .jod-comp-title { color: #fff; font-size: 13px; font-weight: 700; }
        .jod-comp-sub   { color: rgba(255,255,255,.5); font-size: 11px; }
        .jod-comp-body  { padding: 12px 16px 0; }
        .jod-comp-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 7px 0;
          font-size: 13px;
          border-bottom: 1px solid #f1f5f9;
        }
        .jod-comp-line:last-of-type { border-bottom: 0; }
        .jod-comp-line span   { color: #64748b; }
        .jod-comp-line strong { color: #0f172a; font-weight: 700; }
        .jod-discount { color: #dc2626 !important; }
        .jod-comp-divider { height: 1px; background: #e2e8f0; margin: 4px 0; }
        .jod-comp-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-top: 1px solid #bbf7d0;
          margin: 8px -16px 0;
          padding: 12px 16px;
          font-weight: 700;
          font-size: 14px;
          color: #14532d;
        }
        .jod-comp-total-val { font-size: 20px; font-weight: 800; color: #15803d; }

        /* ── Remarks ── */
        .jod-remarks {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #334155;
          font-size: 13px;
          min-height: 56px;
          padding: 12px;
          white-space: pre-wrap;
        }

        /* ── Responsive ── */
        @media (max-width: 992px) {
          .jod-hero, .jod-info-grid { grid-template-columns: 1fr; }
          .jod-bottom-grid { grid-template-columns: 1fr; }
          .jod-header { flex-direction: column; }
          .jod-header-right { flex-direction: row; align-items: center; }
        }
        @media (max-width: 576px) {
          .jod-rl { grid-template-columns: 1fr; gap: 2px; }
          .jod-rl strong { text-align: left; }
        }
      `}</style>
    </div>
  );
}

const money = (value: number | string) => Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const pretty = (value?: string | null) => value ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : "-";

const statusClass = (value?: string | null) => {
  const status = String(value || "").toLowerCase();
  if (status.includes("complete")) return "status-completed";
  if (status.includes("cancel")) return "status-cancelled";
  if (status.includes("process")) return "status-processing";
  return "status-open";
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

ManageJobOrders.Layout = AdminLayout;
export default ManageJobOrders;
