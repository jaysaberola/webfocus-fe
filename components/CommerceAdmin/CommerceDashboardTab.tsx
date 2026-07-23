import { useEffect, useMemo, useState } from "react";
import type { CommerceAdminTab } from "@/lib/commerceAdmin/types";
import {
  COMMERCE_MONTHLY_RENEWALS,
  COMMERCE_QUICK_ACTIONS,
  COMMERCE_RECENT_ACTIVITY,
  COMMERCE_SERVICE_STATS,
  formatCommerceMoney,
} from "@/lib/commerceAdmin/mockData";
import { fetchCommerceDashboard, type CommerceDashboardData } from "@/services/commerceAdminService";
import { useCommerceDashboardWidgets } from "@/lib/commerceAdmin/useCommerceDashboardWidgets";
import CommerceCustomizeDashboardModal from "./CommerceCustomizeDashboardModal";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  onTabChange: (tab: CommerceAdminTab) => void;
};

type QueueView = "list" | "grid";

const STAT_WIDGET_MAP = {
  active: "active-summary",
  expiring: "expiring-summary",
  expired: "expired-summary",
  pending: "pending-orders-summary",
} as const;

function monthlyChartGeometry() {
  const maxVal = Math.max(...COMMERCE_MONTHLY_RENEWALS.map((d) => Math.max(d.projected, d.actual)), 1) * 1.1;
  return COMMERCE_MONTHLY_RENEWALS.map((point, index) => {
    const xPercent = ((index + 0.5) / COMMERCE_MONTHLY_RENEWALS.length) * 100;
    return {
      ...point,
      xPercent,
      projectedHeight: Math.round((point.projected / maxVal) * 100),
      actualY: 100 - (point.actual / maxVal) * 88,
    };
  });
}

export default function CommerceDashboardTab({ onTabChange }: Props) {
  const [queueView, setQueueView] = useState<QueueView>("list");
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<CommerceDashboardData | null>(null);
  const { visibleWidgets, visibleCount, toggleWidget, resetWidgets, isVisible } =
    useCommerceDashboardWidgets();

  useEffect(() => {
    fetchCommerceDashboard()
      .then(setDashboardData)
      .catch(() => setDashboardData(null));
  }, []);

  const newOrders = dashboardData?.newOrders ?? [];
  const expiringServices = dashboardData?.expiringServices ?? [];
  const overdueInvoices = dashboardData?.overdueInvoices ?? [];

  const geometry = useMemo(() => monthlyChartGeometry(), []);
  const polylinePoints = geometry.map((p) => `${p.xPercent},${p.actualY}`).join(" ");

  const projectedTotal = 24120;
  const actualTotal = 36720;
  const collectionRate = ((actualTotal / projectedTotal) * 100).toFixed(2);

  const showQueueSection =
    isVisible("new-orders") || isVisible("expiring-services") || isVisible("overdue");

  const queueLayoutClass = queueView === "list" ? styles.queueStack : styles.queueGrid;

  return (
    <div className={styles.dashboardStack}>
      <section className={styles.dashHeaderCard}>
        <div>
          <p className={styles.dashKicker}>Dashboard Display</p>
          <p className={styles.dashHeaderHint}>Choose which widgets the admin wants to keep visible on this page.</p>
        </div>
        <button type="button" className={styles.secondaryBtnSm} onClick={() => setCustomizeOpen(true)}>
          <i className="fa-solid fa-sliders" aria-hidden="true" />
          Customize Dashboard
          <span className={styles.dashCustomizeCount}>{visibleCount}</span>
        </button>
      </section>

      {showQueueSection && (
        <section className={styles.queueOverviewSection}>
          <div className={styles.queueOverviewHeader}>
            <div>
              <h3 className={styles.queueOverviewTitle}>Queue Overview</h3>
              <p className={styles.queueOverviewSubtitle}>Switch between the standard list and grid layouts.</p>
            </div>
            <div className={styles.dashViewToggleRound} role="group" aria-label="Queue view">
              <button
                type="button"
                className={queueView === "list" ? styles.dashViewRoundActive : styles.dashViewRound}
                onClick={() => setQueueView("list")}
                aria-label="List view"
                title="List view"
              >
                <i className="fa-solid fa-list" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={queueView === "grid" ? styles.dashViewRoundActive : styles.dashViewRound}
                onClick={() => setQueueView("grid")}
                aria-label="Grid view"
                title="Grid view"
              >
                <i className="fa-solid fa-table-cells" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className={queueLayoutClass}>
            {isVisible("new-orders") && (
              <article className={styles.queueCard}>
                <header className={styles.queueCardHeaderBlue}>
                  <span><i className="fa-regular fa-file-lines" aria-hidden="true" /> New Orders</span>
                </header>
                <div className={styles.queueTableWrap}>
                  <table className={styles.queueTable}>
                      <thead>
                        <tr>
                          <th>Order ID</th>
                          <th>Company Name</th>
                          <th>Date Created</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {newOrders.length === 0 ? (
                          <tr>
                            <td colSpan={5}>No new orders in queue.</td>
                          </tr>
                        ) : (
                          newOrders.map((row) => (
                            <tr key={row.id}>
                              <td className={styles.queueCellStrong}>{row.orderId}</td>
                              <td>{row.company}</td>
                              <td>{row.dateCreated}</td>
                              <td className={styles.queueCellAmount}>{formatCommerceMoney(row.amount)}</td>
                              <td><span className={styles.statusNew}>{row.status}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>
                <button type="button" className={styles.queueViewAllLink} onClick={() => onTabChange("transactions")}>
                  View All New Orders
                </button>
              </article>
            )}

            {isVisible("expiring-services") && (
              <article className={styles.queueCard}>
                <header className={styles.queueCardHeaderAmber}>
                  <span><i className="fa-regular fa-calendar" aria-hidden="true" /> Expiring Services</span>
                </header>
                <div className={styles.queueTableWrap}>
                  <table className={styles.queueTable}>
                      <thead>
                        <tr>
                          <th>Service</th>
                          <th>Company Name</th>
                          <th>Expiry Date</th>
                          <th>Days Left</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expiringServices.length === 0 ? (
                          <tr>
                            <td colSpan={5}>No expiring services.</td>
                          </tr>
                        ) : (
                          expiringServices.map((row) => (
                            <tr key={row.id}>
                              <td className={styles.queueCellStrong}>{row.service}</td>
                              <td>{row.company}</td>
                              <td>{row.expiryDate}</td>
                              <td>{row.daysLeft}</td>
                              <td><span className={styles.statusExpiring}>Expiring</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>
                <button type="button" className={styles.queueViewAllLink} onClick={() => onTabChange("contracts")}>
                  View All Expiring Services
                </button>
              </article>
            )}

            {isVisible("overdue") && (
              <article className={styles.queueCard}>
                <header className={styles.queueCardHeaderRed}>
                  <span><i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> Overdue</span>
                </header>
                <div className={styles.queueTableWrap}>
                  <table className={styles.queueTable}>
                      <thead>
                        <tr>
                          <th>SOA / REF #</th>
                          <th>Company Name</th>
                          <th>Due Date</th>
                          <th>Amount</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {overdueInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={5}>No overdue invoices.</td>
                          </tr>
                        ) : (
                          overdueInvoices.map((row) => (
                            <tr key={row.id}>
                              <td className={styles.queueCellStrong}>{row.reference}</td>
                              <td>{row.company}</td>
                              <td>{row.dueDate}</td>
                              <td className={styles.queueCellAmount}>{formatCommerceMoney(row.amount)}</td>
                              <td><span className={styles.statusOverdue}>Overdue</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                </div>
                <button type="button" className={styles.queueViewAllLink} onClick={() => onTabChange("transactions")}>
                  View All Overdue
                </button>
              </article>
            )}
          </div>
        </section>
      )}

      {(isVisible("performance-chart") || isVisible("quick-actions")) && (
        <div className={styles.dashMiddleRow}>
          {isVisible("performance-chart") && (
            <section className={styles.dashPanel}>
              <div className={styles.dashRenewalsHeader}>
                <h3 className={styles.dashSectionTitle}>Projected Renewals vs. Actual Collection</h3>
                <select className={styles.dashMonthSelect} defaultValue="this-month" aria-label="Chart period">
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="ytd">Year to Date</option>
                </select>
              </div>

              <div className={styles.dashRenewalsBody}>
                <div className={styles.dashRenewalsChartWrap}>
                  <div className={styles.dashRenewalsChart}>
                    <div className={styles.dashRenewalsYAxis}>
                      <span>₱775,896</span>
                      <span>₱581,922</span>
                      <span>₱387,948</span>
                      <span>₱193,974</span>
                      <span>₱0</span>
                    </div>
                    <div className={styles.dashRenewalsCanvas}>
                      <svg className={styles.dashRenewalsLine} viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                        <polyline fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" points={polylinePoints} />
                      </svg>
                      <div className={styles.dashRenewalsDots} aria-hidden="true">
                        {geometry.map((point) => (
                          <span key={point.label} className={styles.dashRenewalsDot} style={{ left: `${point.xPercent}%`, top: `${point.actualY}%` }} />
                        ))}
                      </div>
                      <div className={styles.dashRenewalsBars}>
                        {geometry.map((point) => (
                          <div key={point.label} className={styles.dashRenewalsBarCol}>
                            <div className={styles.dashRenewalsBar} style={{ height: `${point.projectedHeight}%` }} />
                            <span>{point.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className={styles.dashRenewalsLegend}>
                    <span><i className={styles.legendSquareBlue} /> Projected Renewals (₱)</span>
                    <span><i className={styles.legendLineGreen} /> Actual Collection (₱)</span>
                  </div>
                </div>

                <aside className={styles.dashRenewalsStats}>
                  <p className={styles.dashRenewalsStatsLabel}>Total (This Month)</p>
                  <div className={styles.dashRenewalsStatRow}>
                    <span>Projected Renewals</span>
                    <strong className={styles.dashStatBlue}>{formatCommerceMoney(projectedTotal)}</strong>
                  </div>
                  <div className={styles.dashRenewalsStatRow}>
                    <span>Actual Collection</span>
                    <strong className={styles.dashStatGreen}>{formatCommerceMoney(actualTotal)}</strong>
                  </div>
                  <div className={styles.dashCollectionRate}>
                    <span>Collection Rate</span>
                    <strong>{collectionRate}%</strong>
                    <p>Based on jul renewals and collected receipts.</p>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {isVisible("quick-actions") && (
            <section className={styles.dashPanel}>
              <h3 className={styles.dashSectionTitle}>Quick Actions</h3>
              <div className={styles.quickActionsGrid}>
                {COMMERCE_QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    className={
                      action.tone === "green"
                        ? styles.quickActionGreen
                        : action.tone === "purple"
                          ? styles.quickActionPurple
                          : styles.quickActionBlue
                    }
                    onClick={() => onTabChange(action.tab)}
                  >
                    <span className={styles.quickActionIcon}><i className={action.icon} aria-hidden="true" /></span>
                    <strong>{action.label}</strong>
                    <span>{action.hint}</span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {isVisible("recent-activity") && (
        <section className={styles.dashPanel}>
          <h3 className={styles.dashSectionTitle}>Recent Activity</h3>
          <div className={styles.activityTableWrap}>
            <table className={styles.activityTable}>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Activity</th>
                  <th>Reference</th>
                  <th>Company Name</th>
                  <th>Performed By</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {COMMERCE_RECENT_ACTIVITY.map((row) => (
                  <tr key={row.id}>
                    <td>{row.dateTime}</td>
                    <td>{row.activity}</td>
                    <td>{row.reference}</td>
                    <td>{row.company}</td>
                    <td>{row.performedBy}</td>
                    <td>
                      <span className={row.status === "In Progress" ? styles.statusInProgress : styles.statusFailed}>
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className={styles.activityViewAll} onClick={() => onTabChange("notifications")}>
            View All Activity
          </button>
        </section>
      )}

      {COMMERCE_SERVICE_STATS.some((stat) => isVisible(STAT_WIDGET_MAP[stat.id as keyof typeof STAT_WIDGET_MAP])) && (
        <div className={styles.serviceStatsGrid}>
          {COMMERCE_SERVICE_STATS.filter((stat) =>
            isVisible(STAT_WIDGET_MAP[stat.id as keyof typeof STAT_WIDGET_MAP])
          ).map((stat) => (
            <article
              key={stat.id}
              className={
                stat.tone === "green"
                  ? styles.serviceStatGreen
                  : stat.tone === "amber"
                    ? styles.serviceStatAmber
                    : stat.tone === "red"
                      ? styles.serviceStatRed
                      : styles.serviceStatPurple
              }
            >
              <div className={styles.serviceStatIcon}><i className={stat.icon} aria-hidden="true" /></div>
              <div>
                <p className={styles.serviceStatLabel}>{stat.label}</p>
                <strong className={styles.serviceStatValue}>{stat.value}</strong>
                <p className={styles.serviceStatHint}>{stat.hint}</p>
              </div>
            </article>
          ))}
        </div>
      )}

      <CommerceCustomizeDashboardModal
        open={customizeOpen}
        visibleWidgets={visibleWidgets}
        onClose={() => setCustomizeOpen(false)}
        onToggle={toggleWidget}
        onReset={resetWidgets}
      />
    </div>
  );
}
