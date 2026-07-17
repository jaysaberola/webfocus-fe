import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import {
  COMMERCE_APPROVALS,
  COMMERCE_CLIENTS,
  COMMERCE_CONTRACTS,
  COMMERCE_NODES,
  COMMERCE_NOTIFICATIONS,
  COMMERCE_REPORTS,
  COMMERCE_TICKETS,
  COMMERCE_TRANSACTIONS,
  formatCommerceMoney,
} from "@/lib/commerceAdmin/mockData";
import CommerceDashboardTab from "./CommerceDashboardTab";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  activeTab: CommerceAdminTab;
  onTabChange: (tab: CommerceAdminTab) => void;
};

function DashboardTab({ onTabChange }: { onTabChange: (tab: CommerceAdminTab) => void }) {
  return <CommerceDashboardTab onTabChange={onTabChange} />;
}

function ClientsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Client Directory & Organizations</h3>
          <p className={styles.panelSubtitle}>Manage registered corporate accounts, domain registrations, and assigned nodes.</p>
        </div>
        <div className={styles.toolbar}>
          <select className={styles.select} defaultValue="name-asc" aria-label="Sort clients">
            <option value="name-asc">Sort: Name (A - Z)</option>
            <option value="newest">Sort: Newest Joined</option>
          </select>
          <button type="button" className={styles.btnPrimary}>Add Client</button>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client ID</th>
              <th>Company / Representative</th>
              <th>Business Email</th>
              <th>Active Services</th>
              <th>Status</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {COMMERCE_CLIENTS.map((client) => (
              <tr key={client.id}>
                <td>{client.id.toUpperCase()}</td>
                <td>
                  <strong>{client.company}</strong>
                  <div className={styles.panelSubtitle}>{client.contact}</div>
                </td>
                <td>{client.email}</td>
                <td>{client.services}</td>
                <td className={client.status === "Active" ? styles.statusActive : styles.statusPending}>{client.status}</td>
                <td>{client.joined}</td>
                <td>
                  <div className={styles.tableActions}>
                    <button type="button" className={styles.btnSm}>View</button>
                    <button type="button" className={styles.btnSm}>Edit</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TransactionsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>All Transactions & Invoices</h3>
          <p className={styles.panelSubtitle}>View and verify all financial invoices, payment gateway checkouts, and receipts.</p>
        </div>
      </div>
      <div className={styles.cardGrid}>
        {COMMERCE_TRANSACTIONS.map((txn) => (
          <article key={txn.id} className={styles.orderCard}>
            <div className={styles.orderCardClient}>{txn.reference}</div>
            <div className={styles.orderCardService}>{txn.client} — {txn.type}</div>
            <div className={styles.orderCardMeta}>
              <span className={styles.orderCardAmount}>{formatCommerceMoney(txn.amount)}</span>
              <span className={styles.statusPill}>{txn.paymentStatus}</span>
            </div>
            <div className={styles.panelSubtitle} style={{ marginTop: "0.5rem" }}>{txn.date}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ApprovalsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Provisioning & Profile Approvals</h3>
          <p className={styles.panelSubtitle}>Review client profile updates and service provisioning requests.</p>
        </div>
      </div>
      <div className={styles.cardGrid}>
        {COMMERCE_APPROVALS.map((item) => (
          <article key={item.id} className={styles.approvalCard}>
            <div className={styles.approvalClient}>{item.client}</div>
            <p className={styles.approvalRequest}>{item.request}</p>
            <div className={styles.approvalMeta}>
              <span>{item.submittedAt}</span>
              <span className={item.priority === "High" ? styles.priorityHigh : styles.priorityNormal}>
                {item.priority} Priority
              </span>
              <div className={styles.tableActions}>
                <button type="button" className={styles.btnSuccess}>Approve</button>
                <button type="button" className={styles.btnSm}>Decline</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ManagedTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Managed NOC Nodes</h3>
          <p className={styles.panelSubtitle}>Infrastructure status across Manila data centers and edge routes.</p>
        </div>
      </div>
      <div className={styles.nodeGrid}>
        {COMMERCE_NODES.map((node) => (
          <article key={node.id} className={styles.nodeCard}>
            <div className={styles.nodeName}>{node.name}</div>
            <div className={styles.nodeLocation}>{node.location}</div>
            <div className={styles.nodeMeta}>
              <span className={node.status === "Online" ? styles.statusActive : styles.statusMaintenance}>{node.status}</span>
              <span>{node.uptime}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ContractsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>SLA Contracts & Renewals</h3>
          <p className={styles.panelSubtitle}>Active service agreements and upcoming renewal dates.</p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Service</th>
              <th>Renews</th>
              <th>Annual Value</th>
            </tr>
          </thead>
          <tbody>
            {COMMERCE_CONTRACTS.map((row) => (
              <tr key={row.id}>
                <td>{row.client}</td>
                <td>{row.service}</td>
                <td>{row.renews}</td>
                <td><strong>{formatCommerceMoney(row.value)}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function UsersTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Commerce Admin Users</h3>
          <p className={styles.panelSubtitle}>Operators with access to billing, provisioning, and NOC modules.</p>
        </div>
        <button type="button" className={styles.btnPrimary}>Invite Operator</button>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Super Admin</td>
              <td>admin@wsi.com</td>
              <td>Super Admin</td>
              <td className={styles.statusActive}>Active</td>
            </tr>
            <tr>
              <td>NOC Operator</td>
              <td>noc@webfocus.ph</td>
              <td>Provisioning</td>
              <td className={styles.statusActive}>Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function NotificationsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>System Notifications</h3>
          <p className={styles.panelSubtitle}>Outbound alerts sent to clients for billing and provisioning events.</p>
        </div>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Audience</th>
              <th>Sent</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {COMMERCE_NOTIFICATIONS.map((row) => (
              <tr key={row.id}>
                <td>{row.title}</td>
                <td>{row.audience}</td>
                <td>{row.sentAt}</td>
                <td className={styles.statusActive}>{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HelpdeskTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Billing & Provisioning Helpdesk</h3>
          <p className={styles.panelSubtitle}>Support tickets from enterprise clients and collection follow-ups.</p>
        </div>
      </div>
      <div className={styles.cardGrid}>
        {COMMERCE_TICKETS.map((ticket) => (
          <article key={ticket.id} className={styles.approvalCard}>
            <div className={styles.approvalClient}>{ticket.id} — {ticket.subject}</div>
            <p className={styles.approvalRequest}>{ticket.client}</p>
            <div className={styles.approvalMeta}>
              <span>{ticket.updatedAt}</span>
              <span className={ticket.priority === "High" ? styles.priorityHigh : styles.priorityNormal}>{ticket.priority}</span>
              <span className={styles.statusPill}>{ticket.status}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ReportsTab() {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <div>
          <h3 className={styles.panelTitle}>Reports & Analytics Export</h3>
          <p className={styles.panelSubtitle}>Generate sales, renewal, collections, and NOC uptime reports.</p>
        </div>
      </div>
      <div className={styles.reportGrid}>
        {COMMERCE_REPORTS.map((report) => (
          <article key={report.id} className={styles.reportCard}>
            <div className={styles.reportIcon}>
              <i className={report.icon} aria-hidden="true" />
            </div>
            <div>
              <div className={styles.reportTitle}>{report.title}</div>
              <div className={styles.reportDesc}>{report.desc}</div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CommerceAdminContent({ activeTab, onTabChange }: Props) {
  return (
    <div className={styles.tabStack}>
      {activeTab === "dashboard" && <DashboardTab onTabChange={onTabChange} />}
      {activeTab === "clients" && <ClientsTab />}
      {activeTab === "transactions" && <TransactionsTab />}
      {activeTab === "approvals" && <ApprovalsTab />}
      {activeTab === "managed" && <ManagedTab />}
      {activeTab === "contracts" && <ContractsTab />}
      {activeTab === "users" && <UsersTab />}
      {activeTab === "notifications" && <NotificationsTab />}
      {activeTab === "helpdesk" && <HelpdeskTab />}
      {activeTab === "reports" && <ReportsTab />}
    </div>
  );
}
