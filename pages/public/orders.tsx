import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getSalesTransactions, SalesTransaction } from "@/services/salesTransactionService";
import { fetchCurrentCustomer, getStoredCustomer, PublicCustomer } from "@/services/publicCustomerService";
import { CustomerShell, CustomerStyles, money } from "./cart";

function OrdersPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<PublicCustomer | null>(null);
  const [orders, setOrders] = useState<SalesTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = getStoredCustomer();
    if (stored) setCustomer(stored);
    fetchCurrentCustomer({ silent: true })
      .then((user) => {
        setCustomer(user);
        return getSalesTransactions({ customer_id: user.id, per_page: 50 }, { silent: true });
      })
      .then((res) => setOrders(Array.isArray(res?.data) ? res.data : []))
      .catch(() => router.push("/public/login?redirect=/public/orders"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <CustomerShell active="orders">
      <div className="customer-panel">
        <div className="panel-title">Order History</div>
        <div className="orders-wrap">
          {loading ? (
            <p>Loading orders...</p>
          ) : orders.length === 0 ? (
            <p>No orders yet for {customer?.fname || "your account"}.</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Transaction No.</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th className="text-end">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td><strong>{order.transaction_no}</strong></td>
                    <td>{order.transacted_at ? new Date(order.transacted_at).toLocaleDateString() : "-"}</td>
                    <td>{order.order_status}</td>
                    <td>{order.payment_status}</td>
                    <td className="text-end">{money(order.grand_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <CustomerStyles />
      <style jsx>{`
        .orders-wrap {
          padding: 26px;
          overflow: auto;
        }
        .orders-table {
          width: 100%;
          min-width: 720px;
          border-collapse: collapse;
        }
        th {
          background: #f8fafc;
          color: #64748b;
          padding: 10px;
          text-transform: uppercase;
          font-size: 12px;
        }
        td {
          border-top: 1px solid #eef2f7;
          padding: 12px 10px;
        }
      `}</style>
    </CustomerShell>
  );
}

OrdersPage.Layout = function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <LandingPageLayout pageData={{ title: "Order History", meta: { title: "Order History" } }}>
      {children}
    </LandingPageLayout>
  );
};
export default OrdersPage;
