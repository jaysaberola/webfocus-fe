import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/Layout/AdminLayout";
import { toast } from "@/lib/toast";
import { createJobOrder } from "@/services/jobOrderService";
import { getProducts } from "@/services/productService";
import { getServices } from "@/services/serviceService";
import { getCustomers, CustomerRow } from "@/services/customerService";

type LineItem = {
  id: number;
  productId?: number | null;
  itemType: string;
  name: string;
  price: number;
  quantity: number;
};

type PaymentRow = {
  id: number;
  method: string;
  amount: number;
  remarks: string;
  attachment?: File | null;
};

type OrderOption = {
  type: string;
  name: string;
  price: number;
  productId?: number | null;
};

const fallbackProductItems: OrderOption[] = [
  { type: "Product", name: "Whole Lechon (De Leche) 5-6 Kgs.", price: 12800, productId: null },
  { type: "Product", name: "Petite (Lechon Cebu) 3-4 kgs.", price: 9800, productId: null },
];

const fallbackServiceItems: OrderOption[] = [
  { type: "Service", name: "Catering Service", price: 2500, productId: null },
  { type: "Service", name: "Food Tray Setup", price: 1200, productId: null },
];

const locationCharges: Record<string, number> = {
  "Quezon City": 400,
  "Makati": 450,
  "Pasig": 350,
  "Taguig": 500,
  "Manila": 400,
};
const locations = Object.keys(locationCharges);
const paymentMethods = [
  "Bank Deposit",
  "Cash",
  "Check Payment",
  "COD",
  "Credit/Debit Card",
  "Discount (Promo)",
  "Discount (VAT)",
  "Discount (Senior Citizen)",
  "Ex-deal",
  "Gcash",
  "Gift Certificate",
  "M Lhuillier",
  "Ok Order",
  "Online Bank Transfer",
  "Open Date Order",
];

const emptyPayment = (): PaymentRow => ({ id: Date.now(), method: "", amount: 0, remarks: "", attachment: null });

function CreateJobOrder() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [productOptions, setProductOptions] = useState<OrderOption[]>(fallbackProductItems);
  const [serviceOptions, setServiceOptions] = useState<OrderOption[]>(fallbackServiceItems);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [itemType, setItemType] = useState("Product");
  const [customerType, setCustomerType] = useState("Existing");
  const [customerId, setCustomerId] = useState<number | "">("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerContact, setCustomerContact] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("Open Date");
  const [dateNeeded, setDateNeeded] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(fallbackProductItems[0].name);
  const [quantity, setQuantity] = useState(1);
  const [deliveryType, setDeliveryType] = useState("Pickup");
  const [location, setLocation] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [products, setProducts] = useState<LineItem[]>([]);
  const [miscProducts, setMiscProducts] = useState<LineItem[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([emptyPayment()]);

  // New customer expanded fields
  const [newLastName, setNewLastName] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newBirthdate, setNewBirthdate] = useState("");
  const [newAddressUnit, setNewAddressUnit] = useState("");
  const [newAddressStreet, setNewAddressStreet] = useState("");
  const [newAddressBarangay, setNewAddressBarangay] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");

  useEffect(() => {
    getProducts({ per_page: 1000 }, { silent: true })
      .then((res) => {
        const products = Array.isArray(res?.data) ? res.data : [];
        const options = products.map((product: any) => ({
          type: "Product",
          name: product.name,
          price: Number(product.price || 0),
          productId: product.id,
        })).filter((product: OrderOption) => product.name);
        if (options.length) {
          setProductOptions(options);
          if (itemType === "Product") setSelectedOrder(options[0].name);
        }
      })
      .catch(() => setProductOptions(fallbackProductItems));

    getServices({ per_page: 1000 }, { silent: true })
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data
          : Array.isArray(res?.data?.data) ? res.data.data
          : Array.isArray(res) ? res : [];
        const options: OrderOption[] = list
          .map((s: any) => ({
            type: "Service",
            name: s.name ?? s.title ?? "",
            price: Number(s.price ?? s.amount ?? 0),
            productId: s.id ?? null,
          }))
          .filter((s: OrderOption) => s.name);
        if (options.length) {
          setServiceOptions(options);
          if (itemType === "Service") setSelectedOrder(options[0].name);
        }
      })
      .catch(() => setServiceOptions(fallbackServiceItems));

    getCustomers({ per_page: 1000 }, { silent: true })
      .then((res) => {
        const rows = Array.isArray(res?.data?.data) ? res.data.data : [];
        setCustomers(rows);
        if (rows[0]?.id) setCustomerId(rows[0].id);
      })
      .catch(() => setCustomers([]));
  }, []);

  const orderItems = useMemo(() => [...productOptions, ...serviceOptions], [productOptions, serviceOptions]);
  const availableOrders = orderItems.filter((item) => item.type === itemType);
  const selectedItem = orderItems.find((item) => item.name === selectedOrder) ?? availableOrders[0];
  const selectedCustomer = customers.find((customer: any) => customer.id === customerId) as any;

  const pendingItem = useMemo<LineItem | null>(() => {
    if (!selectedItem) return null;
    return {
      id: -1,
      productId: selectedItem.productId ?? null,
      itemType: itemType.toLowerCase(),
      name: selectedItem.name,
      price: selectedItem.price,
      quantity: Number(quantity || 1),
    };
  }, [selectedItem, itemType, quantity]);

  const totals = useMemo(() => {
    const productTotal = products.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const miscTotal = miscProducts.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const totalQuantity = [...products, ...miscProducts].reduce((sum, item) => sum + item.quantity, 0);
    const discountTotal = payments
      .filter((payment) => payment.method.toLowerCase().includes("discount"))
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    const subTotal = productTotal + miscTotal + Number(deliveryCharge || 0);
    return {
      totalQuantity,
      deliveryCharge: Number(deliveryCharge || 0),
      subTotal,
      discountTotal,
      total: Math.max(0, subTotal - discountTotal),
    };
  }, [deliveryCharge, miscProducts, payments, products]);

  const addItem = (bucket: "products" | "misc") => {
    if (!selectedItem) return;
    const item: LineItem = {
      id: Date.now(),
      productId: selectedItem.productId ?? null,
      itemType: itemType.toLowerCase(),
      name: selectedItem.name,
      price: selectedItem.price,
      quantity: Number(quantity || 1),
    };
    if (bucket === "products") setProducts((current) => [...current, item]);
    else setMiscProducts((current) => [...current, item]);
  };

  const removeItem = (bucket: "products" | "misc", id: number) => {
    if (bucket === "products") setProducts((current) => current.filter((item) => item.id !== id));
    else setMiscProducts((current) => current.filter((item) => item.id !== id));
  };

  const updatePayment = (id: number, patch: Partial<PaymentRow>) => {
    setPayments((current) => current.map((payment) => payment.id === id ? { ...payment, ...patch } : payment));
  };

  const removePayment = (id: number) => {
    setPayments((current) => current.length === 1 ? current : current.filter((payment) => payment.id !== id));
  };

  const submit = async () => {
    const items = [...products, ...miscProducts].map((item) => ({
      product_id: item.productId ?? null,
      item_type: item.itemType,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      is_miscellaneous: miscProducts.some((misc) => misc.id === item.id),
    }));

    if (items.length === 0) {
      toast.error("Please add at least one product or service");
      return;
    }

    try {
      setSaving(true);
      await createJobOrder({
        customer_id: customerType === "Existing" && customerId ? Number(customerId) : null,
        customer_type: customerType.toLowerCase(),
        customer_name: customerType === "Existing" ? selectedCustomer?.name : [newLastName, newFirstName].filter(Boolean).join(", "),
        customer_email: customerType === "Existing" ? selectedCustomer?.email : customerEmail,
        customer_contact: customerContact,
        source,
        category: "Order",
        status,
        order_date: new Date().toISOString(),
        date_needed: dateNeeded || null,
        delivery_type: deliveryType,
        delivery_location: location,
        delivery_address: deliveryAddress,
        delivery_charge: deliveryCharge,
        remarks,
        items,
        payments: payments
          .filter((payment) => payment.method)
          .map((payment) => ({
            payment_method: payment.method,
            amount: payment.amount,
            remarks: payment.remarks,
            attachment: payment.attachment ?? null,
          })),
      });
      toast.success("Job order created");
      router.push("/job-orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to create job order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jo-page">
      {/* ── Page header ── */}
      <div className="jo-page-header">
           <h3 className="mb-4">Create Job Orders</h3>
        <div className="jo-header-actions">
          <button className="jo-btn jo-btn-ghost" type="button" onClick={() => router.push("/job-orders")}>Cancel</button>
          <button className="jo-btn jo-btn-primary" type="button" onClick={submit} disabled={saving}>
            <i className="fa-solid fa-floppy-disk" />
            {saving ? "Saving…" : "Save Order"}
          </button>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-xl-7">

          {/* ── Step 1: Customer Details ── */}
          <section className="jo-card">
            <div className="jo-card-header">
              <span className="jo-step">1</span>
              <div>
                <div className="jo-card-title">Customer Details</div>
                <div className="jo-card-subtitle">Select or create the customer for this order</div>
              </div>
            </div>
            <div className="jo-card-body">
            <div className="jo-toggle-group mb-4">
              <button
                type="button"
                className={`jo-toggle-btn${customerType === "Existing" ? " is-active" : ""}`}
                onClick={() => setCustomerType("Existing")}
              >
                <i className="fa-solid fa-user" /> Existing Customer
              </button>
              <button
                type="button"
                className={`jo-toggle-btn${customerType === "New" ? " is-active" : ""}`}
                onClick={() => setCustomerType("New")}
              >
                <i className="fa-solid fa-user-plus" /> New Customer
              </button>
            </div>
            {customerType === "Existing" ? (
              <div className="row g-3">
                <div className="col-12">
                  <label className="jo-label">Select Customer</label>
                  <select className="form-select jo-select" value={customerId} onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}>
                    <option value="">— Select Customer —</option>
                    {customers.map((customer: any) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="jo-label">Last Name <span className="req">*</span></label>
                  <input className="form-control jo-input" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="jo-label">First Name <span className="req">*</span></label>
                  <input className="form-control jo-input" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="jo-label">E-mail Address</label>
                  <input type="email" className="form-control jo-input" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="jo-label">Birthdate</label>
                  <input type="date" className="form-control jo-input" value={newBirthdate} onChange={(e) => setNewBirthdate(e.target.value)} />
                </div>
                <div className="col-12">
                  <label className="jo-label">Address</label>
                  <div className="jo-address-stack">
                    <input className="form-control jo-input" placeholder="Unit / House No., Floor" value={newAddressUnit} onChange={(e) => setNewAddressUnit(e.target.value)} />
                    <input className="form-control jo-input" placeholder="Street" value={newAddressStreet} onChange={(e) => setNewAddressStreet(e.target.value)} />
                    <input className="form-control jo-input" placeholder="Barangay / Subdivision" value={newAddressBarangay} onChange={(e) => setNewAddressBarangay(e.target.value)} />
                    <input className="form-control jo-input" placeholder="City / Province" value={newAddressCity} onChange={(e) => setNewAddressCity(e.target.value)} />
                  </div>
                </div>
                <div className="col-12">
                  <label className="jo-label">Contact Number <span className="req">*</span></label>
                  <input className="form-control jo-input" value={customerContact} onChange={(e) => setCustomerContact(e.target.value)} />
                </div>
              </div>
            )}
            </div>
          </section>

          {/* ── Step 2: Order Information ── */}
          <section className="jo-card">
            <div className="jo-card-header">
              <span className="jo-step">2</span>
              <div>
                <div className="jo-card-title">Order Information</div>
                <div className="jo-card-subtitle">Select a product or service to add to this order</div>
              </div>
            </div>
            <div className="jo-card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="jo-label">Product or Service</label>
                  <select
                    className="form-select jo-select"
                    value={itemType}
                    onChange={(e) => {
                      const nextType = e.target.value;
                      setItemType(nextType);
                      setSelectedOrder(orderItems.find((item) => item.type === nextType)?.name ?? "");
                    }}
                  >
                    <option>Product</option>
                    <option>Service</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="jo-label">Order Details</label>
                  <select className="form-select jo-select" value={selectedOrder} onChange={(e) => setSelectedOrder(e.target.value)}>
                    {availableOrders.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="jo-label">Quantity</label>
                  <input type="number" min="1" className="form-control jo-input" value={quantity} onChange={(e) => setQuantity(Number(e.target.value || 1))} />
                </div>
                <div className="col-md-4">
                  <label className="jo-label">Price / Item</label>
                  <div className="jo-price-display">
                    <span className="jo-price-currency">₱</span>
                    <span className="jo-price-value">{money(selectedItem?.price ?? 0)}</span>
                  </div>
                </div>
                <div className="col-md-4 d-flex align-items-end gap-2">
                  <button className="jo-btn jo-btn-add flex-fill" type="button" onClick={() => addItem("products")}>
                    <i className="fa-solid fa-plus" /> Add
                  </button>
                  <button className="jo-btn jo-btn-misc flex-fill" type="button" onClick={() => addItem("misc")}>
                    <i className="fa-solid fa-layer-group" /> Misc
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ── Step 3: Delivery & Remarks ── */}
          <section className="jo-card">
            <div className="jo-card-header">
              <span className="jo-step">3</span>
              <div>
                <div className="jo-card-title">Delivery &amp; Remarks</div>
                <div className="jo-card-subtitle">Set delivery method, schedule, and notes</div>
              </div>
            </div>
            <div className="jo-card-body">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="jo-label">Source</label>
                  <input className="form-control jo-input" placeholder="Branch / source" value={source} onChange={(e) => setSource(e.target.value)} />
                </div>
                <div className="col-md-4">
                  <label className="jo-label">Status</label>
                  <select className="form-select jo-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option>Open Date</option>
                    <option>Processing Stock</option>
                    <option>Pending</option>
                    <option>Completed</option>
                    <option>Cancelled</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="jo-label">Date Needed</label>
                  <input type="datetime-local" className="form-control jo-input" value={dateNeeded} onChange={(e) => setDateNeeded(e.target.value)} />
                </div>
                <div className="col-md-6">
                  <label className="jo-label">Delivery Type</label>
                  <select
                    className="form-select jo-select"
                    value={deliveryType}
                    onChange={(e) => {
                      const next = e.target.value;
                      setDeliveryType(next);
                      if (next === "Door-to-door" && !deliveryCharge) setDeliveryCharge(400);
                      if (next !== "Door-to-door") { setLocation(""); setDeliveryAddress(""); }
                    }}
                  >
                    <option>Pickup</option>
                    <option>Door-to-door</option>
                    <option>Store delivery</option>
                    <option>Flexible arrangement</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="jo-label">Delivery Charge</label>
                  <div className="jo-price-display">
                    <span className="jo-price-currency">₱</span>
                    <input type="number" min="0" className="jo-price-input" value={deliveryCharge} onChange={(e) => setDeliveryCharge(Number(e.target.value || 0))} />
                  </div>
                </div>
                {deliveryType === "Door-to-door" && (
                  <>
                    <div className="col-md-5">
                      <label className="jo-label">Location</label>
                      <select
                        className="form-select jo-select"
                        value={location}
                        onChange={(e) => {
                          const loc = e.target.value;
                          setLocation(loc);
                          if (loc && locationCharges[loc] !== undefined) {
                            setDeliveryCharge(locationCharges[loc]);
                          }
                        }}
                      >
                        <option value="">— Select Location —</option>
                        {locations.map((item) => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-7">
                      <label className="jo-label">Delivery Address</label>
                      <input className="form-control jo-input" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
                    </div>
                  </>
                )}
                <div className="col-12">
                  <label className="jo-label">Remarks</label>
                  <textarea className="form-control jo-input" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Step 4: Payment ── */}
          <section className="jo-card">
            <div className="jo-card-header">
              <span className="jo-step">4</span>
              <div style={{ flex: 1 }}>
                <div className="jo-card-title">Payment</div>
                <div className="jo-card-subtitle">Add one or more payment entries</div>
              </div>
              <button className="jo-btn jo-btn-ghost-sm" type="button" onClick={() => setPayments((current) => [...current, emptyPayment()])}>
                <i className="fa-solid fa-plus" /> Add Payment
              </button>
            </div>
            <div className="jo-card-body">
              <div className="payment-table">
                <div className="payment-heading">Payment Method</div>
                <div className="payment-heading">Amount (₱)</div>
                <div className="payment-heading">Remarks &amp; Attachment</div>
                <div />
                {payments.map((payment) => (
                  <div className="payment-row" key={payment.id}>
                    <select className="form-select jo-select" value={payment.method} onChange={(e) => updatePayment(payment.id, { method: e.target.value })}>
                      <option value="">— Select —</option>
                      {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                    </select>
                    <input type="number" min="0" className="form-control jo-input" value={payment.amount} onChange={(e) => updatePayment(payment.id, { amount: Number(e.target.value || 0) })} />
                    <div>
                      <textarea className="form-control jo-input mb-2" rows={2} placeholder="Enter payment details" value={payment.remarks} onChange={(e) => updatePayment(payment.id, { remarks: e.target.value })} />
                      <input className="form-control jo-input" type="file" onChange={(e) => updatePayment(payment.id, { attachment: e.target.files?.[0] ?? null })} />
                    </div>
                    <button className="jo-remove-btn" type="button" onClick={() => removePayment(payment.id)} title="Remove">
                      <i className="fa-solid fa-xmark" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <div className="col-xl-5">
          <section className="jo-computation">
            {/* header */}
            <div className="jo-computation-header">
              <div className="jo-computation-header-left">
                <div className="jo-computation-icon"><i className="fa-solid fa-receipt" /></div>
                <div>
                  <div className="jo-computation-label">On-Screen Computation</div>
                  <div className="jo-computation-sub">{products.length + miscProducts.length} item{products.length + miscProducts.length !== 1 ? "s" : ""} added</div>
                </div>
              </div>
              <div className="jo-computation-total-header">₱ {money(totals.total)}</div>
            </div>

            {/* live preview */}
            {pendingItem && (
              <div className="computation-section">
                <div className="computation-section-title">
                  <span><i className="fa-regular fa-eye" style={{ marginRight: 5 }} />Current Selection</span>
                  <span className="computation-badge computation-badge--preview">Preview</span>
                </div>
                <div className="computation-table-wrap">
                  <table className="computation-table">
                    <colgroup><col style={{ width: "42%" }} /><col style={{ width: "20%" }} /><col style={{ width: "14%" }} /><col style={{ width: "20%" }} /><col style={{ width: "36px" }} /></colgroup>
                    <thead><tr><th>Product Name</th><th className="text-end">Price/Item</th><th className="text-center">Qty</th><th className="text-end">Total</th><th /></tr></thead>
                    <tbody>
                      <tr className="preview-row">
                        <td><div className="item-name">{pendingItem.name}</div></td>
                        <td className="text-end">{money(pendingItem.price)}</td>
                        <td className="text-center">{pendingItem.quantity}</td>
                        <td className="text-end">{money(pendingItem.price * pendingItem.quantity)}</td>
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <ComputationItems title="Added Products" accent="#16a34a" items={products} onRemove={(id) => removeItem("products", id)} />
            <ComputationItems title="Added Miscellaneous Products" accent="#7c3aed" items={miscProducts} onRemove={(id) => removeItem("misc", id)} />

            {/* summary */}
            <div className="summary-box">
              <div className="summary-line">
                <span><i className="fa-solid fa-box" style={{ marginRight: 5, color: "#94a3b8" }} />Total Quantity</span>
                <strong>{totals.totalQuantity}</strong>
              </div>
              <div className="summary-line">
                <span><i className="fa-solid fa-truck" style={{ marginRight: 5, color: "#94a3b8" }} />Delivery Charge</span>
                <strong>₱ {money(totals.deliveryCharge)}</strong>
              </div>
              <div className="summary-line">
                <span>Sub Total</span>
                <strong>₱ {money(totals.subTotal)}</strong>
              </div>
              <div className="summary-divider" />
              <div className="summary-line">
                <span><i className="fa-solid fa-tag" style={{ marginRight: 5, color: "#94a3b8" }} />Total Discount</span>
                <strong className="text-danger">− ₱ {money(totals.discountTotal)}</strong>
              </div>
              <div className="summary-total-row">
                <span>Total</span>
                <span className="summary-total-amount">₱ {money(totals.total)}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        /* ── Page shell ── */
        .jo-page {
          padding: 0 24px 64px;
        }
        .jo-page-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 24px 0 20px;
          flex-wrap: wrap;
        }
        .jo-breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
          font-size: 13px;
          color: #64748b;
        }
        .jo-back-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #475569;
          cursor: pointer;
          transition: background .15s, border-color .15s;
        }
        .jo-back-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }
        .jo-breadcrumb-sep { color: #475569; font-weight: 500; }
        .jo-chevron { font-size: 10px; color: #94a3b8; }
        .jo-breadcrumb-current { color: #0f172a; font-weight: 600; }
        .jo-page-title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .jo-header-actions {
          display: flex;
          gap: 10px;
          align-items: center;
          padding-top: 18px;
        }

        /* ── Buttons ── */
        .jo-btn {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 9px 18px;
          border-radius: 8px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity .15s, box-shadow .15s;
          white-space: nowrap;
        }
        .jo-btn:disabled { opacity: .55; cursor: not-allowed; }
        .jo-btn-primary {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff;
          box-shadow: 0 2px 8px rgba(22,163,74,.25);
        }
        .jo-btn-primary:hover:not(:disabled) { box-shadow: 0 4px 14px rgba(22,163,74,.35); }
        .jo-btn-ghost {
          background: #fff;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .jo-btn-ghost:hover { background: #f8fafc; }
        .jo-btn-ghost-sm {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          border-radius: 7px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #16a34a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background .15s;
        }
        .jo-btn-ghost-sm:hover { background: #f0fdf4; border-color: #bbf7d0; }
        .jo-btn-add {
          background: linear-gradient(135deg, #16a34a, #15803d);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: box-shadow .15s;
        }
        .jo-btn-add:hover { box-shadow: 0 4px 12px rgba(22,163,74,.3); }
        .jo-btn-misc {
          background: #fff;
          color: #475569;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 0;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background .15s;
        }
        .jo-btn-misc:hover { background: #f8fafc; }
        .jo-remove-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          border: 1px solid #fecaca;
          background: #fff5f5;
          color: #dc2626;
          cursor: pointer;
          font-size: 15px;
          transition: background .15s;
        }
        .jo-remove-btn:hover { background: #fee2e2; }

        /* ── Cards ── */
        .jo-card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 16px;
          overflow: hidden;
          box-shadow: 0 1px 4px rgba(15,23,42,.04);
        }
        .jo-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        .jo-step {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0f172a;
          color: #fff;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .jo-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }
        .jo-card-subtitle {
          font-size: 12px;
          color: #64748b;
          margin-top: 2px;
        }
        .jo-card-body {
          padding: 20px;
        }

        /* ── Form controls ── */
        .jo-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 6px;
        }
        .req { color: #ef4444; }
        .jo-input {
          border-color: #d1d5db !important;
          border-radius: 8px !important;
          font-size: 14px !important;
          transition: border-color .15s, box-shadow .15s;
        }
        .jo-input:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.12) !important;
        }
        .jo-select {
          border-color: #d1d5db !important;
          border-radius: 8px !important;
          font-size: 14px !important;
        }
        .jo-select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.12) !important;
        }
        .jo-address-stack { display: flex; flex-direction: column; gap: 8px; }
        .jo-price-display {
          display: flex;
          align-items: center;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
          background: #f8fafc;
        }
        .jo-price-currency {
          padding: 9px 11px;
          font-size: 13px;
          font-weight: 700;
          color: #64748b;
          background: #f1f5f9;
          border-right: 1px solid #e2e8f0;
        }
        .jo-price-value {
          padding: 9px 12px;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .jo-price-input {
          flex: 1;
          padding: 9px 12px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
          outline: none;
          min-width: 0;
        }

        /* ── Toggle (customer type) ── */
        .jo-toggle-group {
          display: inline-flex;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          background: #f1f5f9;
        }
        .jo-toggle-btn {
          padding: 9px 20px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 7px;
          transition: background .15s, color .15s;
        }
        .jo-toggle-btn.is-active {
          background: #fff;
          color: #0f172a;
          box-shadow: 0 1px 4px rgba(15,23,42,.1);
          border-radius: 9px;
        }

        /* ── Payment table ── */
        .payment-table {
          display: grid;
          grid-template-columns: 1.1fr 0.7fr 1.6fr 44px;
          gap: 10px 14px;
          align-items: start;
        }
        .payment-heading {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .04em;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .payment-row { display: contents; }

        /* ── Computation panel ── */
        .jo-computation {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          position: sticky;
          top: 18px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(15,23,42,.07);
        }
        .jo-computation-header {
          padding: 18px 20px;
          border-bottom: 1px solid #e2e8f0;
          background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .jo-computation-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .jo-computation-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: rgba(255,255,255,.12);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 16px;
        }
        .jo-computation-label {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
        }
        .jo-computation-sub {
          font-size: 11px;
          color: rgba(255,255,255,.6);
          margin-top: 2px;
        }
        .jo-computation-total-header {
          font-size: 20px;
          font-weight: 800;
          color: #4ade80;
          white-space: nowrap;
        }
        .computation-section {
          padding: 14px 16px 6px;
        }
        .computation-section-title {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
          color: #1f2937;
          font-weight: 700;
          font-size: 13px;
        }
        .computation-count {
          border-radius: 999px;
          background: #dbeafe;
          color: #1d4ed8;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
        }
        .computation-badge {
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 9px;
        }
        .computation-badge--preview { background: #fef9c3; color: #854d0e; }
        .computation-table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .computation-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .computation-table th {
          background: #f8fafc;
          color: #64748b;
          font-size: 11px;
          font-weight: 700;
          padding: 8px;
          border-bottom: 1px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: .04em;
        }
        .computation-table td {
          color: #334155;
          font-size: 12.5px;
          padding: 10px 8px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        .computation-table tbody tr:last-child td { border-bottom: 0; }
        .preview-row td { background: #fefce8; }
        .preview-row .item-name { color: #78350f; }
        .item-name {
          font-weight: 600;
          color: #0f172a;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .text-end { text-align: right; }
        .text-center { text-align: center; }
        .empty-row {
          text-align: center;
          color: #94a3b8 !important;
          padding: 20px 8px !important;
          font-size: 13px !important;
        }

        /* ── Summary ── */
        .summary-box {
          margin: 12px 16px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          padding: 14px 16px;
        }
        .summary-line {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 0;
          color: #64748b;
          font-size: 13px;
          align-items: center;
        }
        .summary-line strong {
          font-weight: 700;
          color: #0f172a;
          text-align: right;
        }
        .summary-divider { height: 1px; background: #e2e8f0; margin: 8px 0; }
        .summary-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin: 12px -16px -14px;
          background: linear-gradient(135deg, #f0fdf4, #dcfce7);
          border-top: 1px solid #bbf7d0;
          border-radius: 0 0 10px 10px;
          font-size: 15px;
          font-weight: 700;
          color: #14532d;
        }
        .summary-total-amount {
          font-size: 22px;
          font-weight: 800;
          color: #15803d;
        }

        /* ── Responsive ── */
        @media (max-width: 720px) {
          .jo-page { padding: 0 12px 48px; }
          .jo-page-header { flex-direction: column; gap: 10px; }
          .jo-header-actions { padding-top: 0; }
          .payment-table, .payment-row { display: block; }
          .payment-heading { display: none; }
          .payment-row > * { margin-bottom: 10px; }
          .jo-computation { position: static; }
          .jo-computation-header { flex-direction: column; align-items: flex-start; gap: 8px; }
        }
      `}</style>
    </div>
  );
}

function ComputationItems({ title, items, onRemove, accent = "#3b82f6" }: { title: string; items: LineItem[]; onRemove: (id: number) => void; accent?: string }) {
  return (
    <div className="ci-section">
      {/* section header */}
      <div className="ci-header">
        <div className="ci-accent-bar" />
        <span className="ci-title">{title}</span>
        <span className="ci-badge">{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div className="ci-empty">
          <i className="fa-regular fa-folder-open" />
          <span>No items added yet</span>
        </div>
      ) : (
        <div className="ci-table-wrap">
          <table className="ci-table">
            <colgroup>
              <col style={{ width: "38%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "34px" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Name</th>
                <th className="r">₱/Item</th>
                <th className="c">Qty</th>
                <th className="r">Total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td><div className="ci-name">{item.name}</div></td>
                  <td className="r ci-num">{money(item.price)}</td>
                  <td className="c ci-qty">{item.quantity}</td>
                  <td className="r ci-total">₱ {money(item.price * item.quantity)}</td>
                  <td className="c">
                    <button className="ci-del" type="button" onClick={() => onRemove(item.id)} title="Remove">
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .ci-section {
          padding: 14px 16px 10px;
          border-bottom: 1px solid #f1f5f9;
        }
        .ci-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }
        .ci-accent-bar {
          width: 4px;
          height: 16px;
          border-radius: 999px;
          background: ${accent};
          flex-shrink: 0;
        }
        .ci-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #1e293b;
          flex: 1;
          letter-spacing: .01em;
        }
        .ci-badge {
          background: #e0f2fe;
          color: #0369a1;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 999px;
          line-height: 1.5;
        }
        .ci-empty {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 14px 10px;
          color: #94a3b8;
          font-size: 13px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px dashed #cbd5e1;
        }
        .ci-empty i { font-size: 15px; }
        .ci-table-wrap {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
          background: #fff;
        }
        .ci-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        .ci-table th {
          background: #f8fafc;
          color: #94a3b8;
          font-size: 10.5px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          padding: 7px 8px;
          border-bottom: 1px solid #e2e8f0;
        }
        .ci-table td {
          padding: 9px 8px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
          font-size: 12.5px;
          color: #334155;
        }
        .ci-table tbody tr:last-child td { border-bottom: 0; }
        .ci-table tbody tr:hover td { background: #f8fafc; }
        .r { text-align: right; }
        .c { text-align: center; }
        .ci-name {
          font-weight: 600;
          color: #0f172a;
          line-height: 1.3;
          overflow-wrap: anywhere;
        }
        .ci-num { color: #475569; }
        .ci-qty {
          background: #f1f5f9;
          border-radius: 4px;
          font-weight: 700;
          color: #334155;
          font-size: 12px;
        }
        .ci-total { font-weight: 700; color: #0f172a; }
        .ci-del {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          border: 1px solid #fecaca;
          background: #fff5f5;
          color: #dc2626;
          font-size: 12px;
          cursor: pointer;
          transition: background .15s;
        }
        .ci-del:hover { background: #fee2e2; }
      `}</style>
    </div>
  );
}

const money = (value: number) => Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

CreateJobOrder.Layout = AdminLayout;
export default CreateJobOrder;
