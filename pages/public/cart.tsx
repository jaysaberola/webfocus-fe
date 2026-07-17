import LandingPageLayout from "@/components/Layout/GuestLayout";

import PublicCartCheckoutPage from "@/components/Cart/PublicCartCheckoutPage";

import Link from "next/link";



function CustomerCartPage() {

  return <PublicCartCheckoutPage />;

}



export function CustomerShell({ active, children }: { active: string; children: React.ReactNode }) {

  const links = [

    ["account", "Manage Account", "/public/dashboard?tab=account"],

    ["cart", "My Cart", "/public/cart"],

    ["orders", "Order History", "/public/dashboard?tab=orders"],

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



export const money = (value: number | string) =>

  Number(value || 0).toLocaleString("en-PH", { style: "currency", currency: "PHP" });



CustomerCartPage.Layout = function CustomerCartLayout({ children }: { children: React.ReactNode }) {

  return (

    <LandingPageLayout

      pageData={{ title: "Your Cart", meta: { title: "Your Cart" } }}

      layout={{ hideBanner: true, minimalFooter: true, fullWidth: true }}

    >

      {children}

    </LandingPageLayout>

  );

};



export default CustomerCartPage;


