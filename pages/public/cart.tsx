import { useEffect, useState } from "react";
import Link from "next/link";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { cartSubtotal, PublicCartItem, readPublicCart, removePublicCartItem, updatePublicCartQty } from "@/lib/publicCart";

const cityCharges: Record<string, number> = {
  "Quezon City": 400,
  "Makati": 450,
  "Pasig": 350,
  "Taguig": 500,
  "Manila": 400,
  "Other": 500,
};

function CustomerCartPage() {
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryCity, setDeliveryCity] = useState("");

  useEffect(() => setItems(readPublicCart()), []);

  const subtotal = cartSubtotal(items);
  const deliveryCharge = shippingMethod === "delivery" && deliveryCity ? (cityCharges[deliveryCity] ?? 500) : 0;
  const total = subtotal + deliveryCharge;

  const updateQty = (key: string, qty: number) => setItems(updatePublicCartQty(key, qty));
  const removeItem = (key: string) => setItems(removePublicCartItem(key));

  const checkoutHref = `/public/checkout?shipping=${shippingMethod}${deliveryCity ? `&city=${encodeURIComponent(deliveryCity)}` : ""}${deliveryAddress ? `&address=${encodeURIComponent(deliveryAddress)}` : ""}`;

  return (
    <CustomerShell active="cart">
      <div className="customer-panel">
        <div className="panel-title">My Cart</div>
        {items.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty.</p>
            <Link href="/public/products" className="customer-btn">Browse Products</Link>
          </div>
        ) : (
          <>
            {/* ── Cart Items Table ── */}
            <div className="cart-table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-end">Price</th>
                    <th className="text-end">Total</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td>
                        <div className="cart-product">
                          <img src={item.image || "/images/logo.png"} alt="" />
                          <div>
                            <strong>{item.name}</strong>
                            <span>Status: Pending request</span>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <input type="number" min="1" value={item.qty} onChange={(e) => updateQty(item.key, Number(e.target.value || 1))} />
                      </td>
                      <td className="text-end">{money(item.price)}</td>
                      <td className="text-end">{money(item.price * item.qty)}</td>
                      <td className="text-end">
                        <button className="remove-btn" type="button" onClick={() => removeItem(item.key)}>Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Shipping Method ── */}
            <div className="shipping-section">
              <div className="shipping-section-title">
                <i className="fa-solid fa-truck" />
                Shipping Method
              </div>
              <div className="shipping-options">
                <button
                  type="button"
                  className={`shipping-card${shippingMethod === "pickup" ? " is-selected" : ""}`}
                  onClick={() => setShippingMethod("pickup")}
                >
                  <span className="shipping-radio">{shippingMethod === "pickup" ? "●" : "○"}</span>
                  <span className="shipping-icon"><i className="fa-solid fa-store" /></span>
                  <div className="shipping-info">
                    <span className="shipping-label">Store Pickup</span>
                    <span className="shipping-desc">Pick up your order at our store — Free</span>
                  </div>
                  <span className="shipping-price free">FREE</span>
                </button>

                <button
                  type="button"
                  className={`shipping-card${shippingMethod === "delivery" ? " is-selected" : ""}`}
                  onClick={() => setShippingMethod("delivery")}
                >
                  <span className="shipping-radio">{shippingMethod === "delivery" ? "●" : "○"}</span>
                  <span className="shipping-icon"><i className="fa-solid fa-truck-fast" /></span>
                  <div className="shipping-info">
                    <span className="shipping-label">Home Delivery</span>
                    <span className="shipping-desc">We deliver to your door</span>
                  </div>
                  <span className="shipping-price">{deliveryCity ? money(cityCharges[deliveryCity] ?? 500) : "From ₱350"}</span>
                </button>
              </div>

              {shippingMethod === "delivery" && (
                <div className="delivery-fields">
                  <div className="delivery-field">
                    <label>City / Area</label>
                    <select value={deliveryCity} onChange={(e) => setDeliveryCity(e.target.value)}>
                      <option value="">— Select your city —</option>
                      {Object.entries(cityCharges).map(([city, charge]) => (
                        <option key={city} value={city}>{city} — {money(charge)}</option>
                      ))}
                    </select>
                  </div>
                  <div className="delivery-field">
                    <label>Delivery Address</label>
                    <input
                      type="text"
                      placeholder="House no., Street, Barangay"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Order Summary ── */}
            <div className="cart-summary">
              <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
              {shippingMethod === "delivery" && (
                <div className="shipping-line">
                  <span>Shipping {deliveryCity ? `(${deliveryCity})` : ""}</span>
                  <strong>{deliveryCharge ? money(deliveryCharge) : <span className="text-muted" style={{ fontSize: 13 }}>Select city</span>}</strong>
                </div>
              )}
              {shippingMethod === "pickup" && (
                <div><span>Shipping</span><strong className="free-tag">FREE</strong></div>
              )}
              <div className="total-line"><span>Total</span><strong className="grand">{money(total)}</strong></div>
              <Link href={checkoutHref} className="customer-btn checkout-btn">
                <i className="fa-solid fa-lock" style={{ marginRight: 8 }} />
                Proceed to Checkout
              </Link>
            </div>
          </>
        )}
      </div>
      <CustomerStyles />
    </CustomerShell>
  );
}

export function CustomerShell({ active, children }: { active: string; children: React.ReactNode }) {
  const links = [
    ["account", "Manage Account", "/public/account"],
    ["cart", "My Cart", "/public/cart"],
    ["password", "Change Password", "/public/account#password"],
    ["orders", "Order History", "/public/orders"],
  ];
  return (
    <div className="customer-area">
      <aside className="customer-sidebar">
        <h4>MY ACCOUNT</h4>
        <nav>
          {links.map(([key, label, href]) => (
            <Link key={key} href={href} className={active === key ? "active" : ""}>{label}</Link>
          ))}
        </nav>
      </aside>
      <div className="customer-main">{children}</div>
    </div>
  );
}

export function CustomerStyles() {
  return (
    <style jsx global>{`
      .customer-area {
        display: grid;
        grid-template-columns: 300px minmax(0, 1fr);
        gap: 24px;
        padding: 28px 0 60px;
      }
      .customer-sidebar,
      .customer-panel {
        background: #fff;
        border: 1px solid #d9dee8;
        border-radius: 8px;
        box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
      }
      .customer-sidebar h4 {
        color: #00843d;
        font-weight: 800;
        padding: 22px 26px;
        border-bottom: 1px solid #e2e8f0;
        margin: 0;
      }
      .customer-sidebar nav {
        padding: 18px 0;
      }
      .customer-sidebar a {
        display: block;
        color: #0f172a;
        font-weight: 800;
        padding: 13px 26px;
        text-decoration: none;
      }
      .customer-sidebar a.active {
        color: #f97316;
        border-left: 4px solid #f97316;
        padding-left: 22px;
      }
      .panel-title {
        color: #f97316;
        font-size: 18px;
        font-weight: 800;
        padding: 20px 26px;
        border-bottom: 1px solid #e2e8f0;
        text-transform: uppercase;
      }
      .customer-panel {
        overflow: hidden;
      }
      .customer-area input,
      .customer-area select,
      .customer-area textarea {
        border: 1px solid #94a3b8 !important;
        border-radius: 8px !important;
        background: #fff !important;
        box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
        color: #0f172a;
      }
      .customer-area input:focus,
      .customer-area select:focus,
      .customer-area textarea:focus {
        border-color: #00843d !important;
        box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.16);
        outline: none;
      }
      .customer-area input:disabled {
        background: #f8fafc !important;
        color: #64748b;
      }
      .empty-cart {
        padding: 36px 26px;
      }
      .cart-table-wrap {
        overflow: auto;
      }
      .cart-table {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
      }
      .cart-table th {
        background: #2f7db4;
        color: #fff;
        font-size: 13px;
        padding: 10px;
      }
      .cart-table td {
        border-bottom: 1px solid #eef2f7;
        padding: 12px 10px;
        vertical-align: middle;
      }
      .cart-product {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .cart-product img {
        width: 72px;
        height: 58px;
        object-fit: cover;
        border: 1px solid #e2e8f0;
        border-radius: 4px;
      }
      .cart-product strong,
      .cart-product span {
        display: block;
      }
      .cart-product span {
        color: #92400e;
        font-size: 12px;
        margin-top: 4px;
      }
      .cart-table input {
        width: 64px;
        padding: 6px;
        text-align: center;
      }
      .text-end { text-align: right; }
      .text-center { text-align: center; }
      .remove-btn {
        background: #dc3545;
        border: 0;
        border-radius: 5px;
        color: #fff;
        font-weight: 800;
        padding: 8px 12px;
      }
      .cart-summary {
        margin-left: auto;
        width: min(100%, 380px);
        padding: 22px 26px 26px;
      }
      .cart-summary div {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eef2f7;
        padding: 10px 0;
      }
      .cart-summary .total-line {
        border-bottom: none;
        padding-bottom: 16px;
      }
      .cart-summary .grand {
        font-size: 24px;
        color: #0f172a;
      }
      .free-tag {
        color: #00843d;
        font-size: 13px;
        font-weight: 800;
        background: #dcfce7;
        padding: 2px 8px;
        border-radius: 20px;
      }
      .checkout-btn {
        width: 100%;
        margin-top: 4px;
        font-size: 15px;
        gap: 6px;
      }
      /* ── Shipping Section ── */
      .shipping-section {
        padding: 24px 26px;
        border-top: 1px solid #eef2f7;
      }
      .shipping-section-title {
        font-weight: 800;
        font-size: 15px;
        color: #0f172a;
        margin-bottom: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .shipping-section-title i {
        color: #2f7db4;
      }
      .shipping-options {
        display: flex;
        flex-direction: row;
        gap: 12px;
      }
      .shipping-options .shipping-card {
        flex: 1;
      }
      .shipping-card {
        display: flex;
        align-items: center;
        gap: 14px;
        width: 100%;
        background: #f8fafc;
        border: 2px solid #e2e8f0;
        border-radius: 10px;
        padding: 14px 16px;
        cursor: pointer;
        text-align: left;
        transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
      }
      .shipping-card:hover {
        border-color: #94a3b8;
        background: #f1f5f9;
      }
      .shipping-card.is-selected {
        border-color: #00843d;
        background: #f0fdf4;
        box-shadow: 0 0 0 3px rgba(0,132,61,0.1);
      }
      .shipping-radio {
        font-size: 18px;
        color: #94a3b8;
        flex-shrink: 0;
        line-height: 1;
      }
      .shipping-card.is-selected .shipping-radio {
        color: #00843d;
      }
      .shipping-icon {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        color: #475569;
        flex-shrink: 0;
      }
      .shipping-card.is-selected .shipping-icon {
        background: #dcfce7;
        color: #00843d;
      }
      .shipping-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .shipping-label {
        font-weight: 700;
        font-size: 14px;
        color: #0f172a;
      }
      .shipping-desc {
        font-size: 12px;
        color: #64748b;
      }
      .shipping-price {
        font-weight: 800;
        font-size: 14px;
        color: #0f172a;
        white-space: nowrap;
      }
      .shipping-price.free {
        color: #00843d;
        background: #dcfce7;
        padding: 3px 10px;
        border-radius: 20px;
        font-size: 12px;
      }
      .delivery-fields {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 14px;
        padding: 16px;
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        border-radius: 8px;
      }
      .delivery-field {
        display: flex;
        flex-direction: column;
        gap: 5px;
      }
      .delivery-field label {
        font-size: 12px;
        font-weight: 700;
        color: #475569;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }
      .delivery-field input,
      .delivery-field select {
        padding: 9px 12px;
        font-size: 14px;
      }
      @media (max-width: 600px) {
        .delivery-fields { grid-template-columns: 1fr; }
        .shipping-options { flex-direction: column; }
      }
      .customer-btn {
        display: inline-flex;
        justify-content: center;
        align-items: center;
        min-height: 44px;
        background: #00843d;
        border-radius: 6px;
        color: #fff !important;
        font-weight: 800;
        padding: 10px 18px;
        text-decoration: none;
        border: 0;
      }
      @media (max-width: 900px) {
        .customer-area {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}

export const money = (value: number | string) => Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });

CustomerCartPage.Layout = function CustomerCartLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "My Cart", meta: { title: "Cart" } }}>
      {children}
    </LandingPageLayout>
  );
};
export default CustomerCartPage;
