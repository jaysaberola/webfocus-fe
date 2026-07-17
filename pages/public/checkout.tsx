import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { toast } from "@/lib/toast";
import { cartSubtotal, clearPublicCart, PublicCartItem, readPublicCart } from "@/lib/publicCart";
import { createSalesTransaction } from "@/services/salesTransactionService";
import { fetchCurrentCustomer, getStoredCustomer, PublicCustomer } from "@/services/publicCustomerService";
import { CustomerShell, CustomerStyles, money } from "./cart";

function CheckoutPage() {
  const router = useRouter();
  const [items, setItems] = useState<PublicCartItem[]>([]);
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setItems(readPublicCart());
    const stored = getStoredCustomer();
    setCustomer(stored);
    fetchCurrentCustomer({ silent: true }).then(setCustomer).catch(() => router.push("/public/cart?signin=1"));
  }, []);

  const subtotal = cartSubtotal(items);

  const placeOrder = async () => {
    if (!customer) {
      router.push("/public/cart?signin=1");
      return;
    }
    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }
    try {
      setSaving(true);
      const itemSummary = items.map((item) => `${item.qty} x ${item.name} @ ${money(item.price)}`).join("\n");
      await createSalesTransaction({
        customer_id: customer.id,
        customer_name: `${customer.fname ?? ""} ${customer.lname ?? ""}`.trim(),
        customer_email: customer.email,
        subtotal,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        payment_status: "pending",
        order_status: "pending",
        transacted_at: new Date().toISOString(),
        items: items.map((item) => ({
          product_id: item.id ?? null,
          name: item.name,
          item_type: "product",
          price: item.price,
          quantity: item.qty,
          total_price: item.price * item.qty,
        })),
        notes: `Customer checkout order\n\nItems:\n${itemSummary}${notes ? `\n\nNotes:\n${notes}` : ""}`,
      });
      clearPublicCart();
      toast.success("Order placed");
      router.push("/public/orders");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <CustomerShell active="cart">
      <div className="customer-panel checkout-panel">
        <div className="panel-title">Checkout</div>
        <div className="checkout-grid">
          <section>
            <h4>Order Items</h4>
            {items.map((item) => (
              <div className="checkout-item" key={item.key}>
                <span>{item.qty} x {item.name}</span>
                <strong>{money(item.price * item.qty)}</strong>
              </div>
            ))}
            <textarea placeholder="Order notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </section>
          <aside>
            <h4>Customer</h4>
            <p>{customer ? `${customer.fname ?? ""} ${customer.lname ?? ""}`.trim() : "Loading..."}</p>
            <p>{customer?.email}</p>
            <div className="checkout-total"><span>Total</span><strong>{money(subtotal)}</strong></div>
            <button className="customer-btn" type="button" onClick={placeOrder} disabled={saving}>{saving ? "Placing..." : "Place Order"}</button>
          </aside>
        </div>
      </div>
      <CustomerStyles />
      <style jsx>{`
        .checkout-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 24px;
          padding: 26px;
        }
        h4 {
          font-weight: 800;
          margin-bottom: 14px;
        }
        .checkout-item,
        .checkout-total {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid #eef2f7;
          padding: 10px 0;
        }
        textarea {
          width: 100%;
          min-height: 110px;
          border: 1px solid #94a3b8 !important;
          border-radius: 8px !important;
          background: #fff !important;
          box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.04);
          margin-top: 18px;
          padding: 12px;
        }
        textarea:focus {
          border-color: #00843d !important;
          box-shadow: 0 0 0 3px rgba(0, 132, 61, 0.16);
          outline: none;
        }
        aside {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 18px;
          align-self: start;
        }
        .checkout-total strong {
          font-size: 24px;
          color: #00843d;
        }
        aside :global(.customer-btn) {
          width: 100%;
          margin-top: 18px;
        }
        @media (max-width: 900px) {
          .checkout-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </CustomerShell>
  );
}

CheckoutPage.Layout = function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "Checkout", meta: { title: "Checkout" } }}>
      {children}
    </LandingPageLayout>
  );
};
export default CheckoutPage;
