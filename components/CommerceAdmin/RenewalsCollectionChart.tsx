import { useMemo, useState } from "react";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type AnalyticsView = "day" | "month" | "year";

type ChartPoint = {
  label: string;
  target: number;
  actual: number;
};

type AnalyticsConfig = {
  subtitle: string;
  title: string;
  badge: string;
  efficiency: string;
  xAxisLabels: string[];
  points: ChartPoint[];
};

const ANALYTICS_CONFIG: Record<AnalyticsView, AnalyticsConfig> = {
  day: {
    subtitle: "Q3 2026 DAILY RENEWALS (BAR) VS ACTUAL COLLECTIONS (LINE)",
    title: "₱48,500.00 Today Collections (July 07)",
    badge: "+12.4% vs Target",
    efficiency: "97.8%",
    xAxisLabels: ["July 01", "July 03", "July 05", "July 07 (Today)"],
    points: [
      { label: "Jul 01", target: 45000, actual: 44000 },
      { label: "Jul 02", target: 52000, actual: 50000 },
      { label: "Jul 03", target: 38000, actual: 41000 },
      { label: "Jul 04", target: 60000, actual: 58000 },
      { label: "Jul 05", target: 65000, actual: 64200 },
      { label: "Jul 06", target: 35000, actual: 32000 },
      { label: "Jul 07", target: 50000, actual: 48500 },
    ],
  },
  month: {
    subtitle: "2026 MONTHLY RENEWALS (BAR) VS ACTUAL COLLECTIONS (LINE)",
    title: "₱1,447,000.00 Total Q3 MTD Collections",
    badge: "96.5% Efficiency",
    efficiency: "96.5%",
    xAxisLabels: ["Feb", "Mar", "Apr", "May", "Jun", "Jul (MTD)"],
    points: [
      { label: "Feb", target: 380000, actual: 370000 },
      { label: "Mar", target: 420000, actual: 415000 },
      { label: "Apr", target: 390000, actual: 382000 },
      { label: "May", target: 410000, actual: 395300 },
      { label: "Jun", target: 500000, actual: 485000 },
      { label: "Jul", target: 150000, actual: 144700 },
    ],
  },
  year: {
    subtitle: "ANNUAL PROJECT RENEWALS (BAR) VS ACTUAL COLLECTIONS (LINE)",
    title: "₱1,425,000.00 YTD 2026 Collections",
    badge: "+18% YoY Growth",
    efficiency: "95.0%",
    xAxisLabels: ["2024", "2025", "2026 (YTD)"],
    points: [
      { label: "2024", target: 3000000, actual: 2840000 },
      { label: "2025", target: 3200000, actual: 3120000 },
      { label: "2026", target: 1500000, actual: 1425000 },
    ],
  },
};

const BREAKDOWN_ROWS = {
  day: [
    { label: "July 07 (Today)", value: "₱48,500 / ₱50k" },
    { label: "July 06 (Yesterday)", value: "₱32,000 / ₱35k" },
    { label: "July 05", value: "₱64,200 / ₱60k" },
  ],
  month: [
    { label: "July 2026 (MTD)", value: "₱144,700 / ₱150k" },
    { label: "June 2026", value: "₱485,000 / ₱500k" },
    { label: "May 2026", value: "₱395,300 / ₱400k" },
  ],
  year: [
    { label: "2026 (YTD)", value: "₱1,425k / ₱1.5M" },
    { label: "2025 (Full Year)", value: "₱3,120k / ₱3.2M" },
    { label: "2024 (Full Year)", value: "₱2,840k / ₱2.9M" },
  ],
};

function chartGeometry(points: ChartPoint[]) {
  const maxVal = Math.max(...points.map((d) => Math.max(d.target, d.actual)), 1) * 1.15;

  return points.map((point, index) => {
    const xPercent = ((index + 0.5) / points.length) * 100;
    const targetHeight = Math.round((point.target / maxVal) * 100);
    const actualY = 100 - (point.actual / maxVal) * 85;

    return {
      ...point,
      xPercent,
      targetHeight,
      actualY,
    };
  });
}

export default function RenewalsCollectionChart() {
  const [view, setView] = useState<AnalyticsView>("day");
  const config = ANALYTICS_CONFIG[view];
  const geometry = useMemo(() => chartGeometry(config.points), [config.points]);
  const polylinePoints = geometry.map((point) => `${point.xPercent},${point.actualY}`).join(" ");

  return (
    <section className={styles.panel}>
      <div className={styles.analyticsPanelHeader}>
        <div>
          <h3 className={styles.panelTitle}>
            <i className="fa-solid fa-chart-column" aria-hidden="true" /> Project Renewals vs. Actual Collection Graph Analytics
          </h3>
          <p className={styles.panelSubtitle}>
            Visual comparison of targeted renewal billings against verified cash collections.
          </p>
        </div>
        <div className={styles.analyticsToolbar}>
          <div className={styles.analyticsToggle} role="group" aria-label="Analytics period">
            {(["day", "month", "year"] as AnalyticsView[]).map((option) => (
              <button
                key={option}
                type="button"
                className={view === option ? styles.analyticsToggleBtnActive : styles.analyticsToggleBtn}
                onClick={() => setView(option)}
              >
                {option === "day" ? "Per Day" : option === "month" ? "Per Month" : "Per Year"}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.primaryBtnSm}
            onClick={() => toast.info("Graph export will be available in a future release.")}
          >
            Export Graph
          </button>
        </div>
      </div>

      <div className={styles.analyticsLegend}>
        <div className={styles.analyticsLegendItems}>
          <span><span className={styles.legendDotBlue} />Project Renewals (Target)</span>
          <span><span className={styles.legendDotGreen} />Actual Collection</span>
        </div>
        <span className={styles.analyticsEfficiency}>
          Collection Efficiency: <strong>{config.efficiency}</strong>
        </span>
      </div>

      <div className={styles.analyticsChart}>
        <div className={styles.analyticsChartHeader}>
          <div>
            <div className={styles.analyticsChartSubtitle}>{config.subtitle}</div>
            <div className={styles.analyticsChartTitle}>{config.title}</div>
          </div>
          <div className={styles.analyticsChartBadge}>{config.badge}</div>
        </div>

        <div className={styles.analyticsChartCanvas}>
          <div className={styles.analyticsGridLines} aria-hidden="true">
            <span /><span /><span /><span />
          </div>

          <svg
            className={styles.analyticsLineSvg}
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              points={polylinePoints}
            />
          </svg>

          <div className={styles.analyticsDots} aria-hidden="true">
            {geometry.map((point) => (
              <span
                key={point.label}
                className={styles.analyticsDot}
                style={{ left: `${point.xPercent}%`, top: `${point.actualY}%` }}
                title={`Actual: ${formatCommerceMoney(point.actual)}`}
              />
            ))}
          </div>

          <div className={styles.analyticsBarsRow}>
            {geometry.map((point) => (
              <div key={point.label} className={styles.analyticsBarColumn}>
                <div className={styles.analyticsTooltip}>
                  <div className={styles.analyticsTooltipLabel}>{point.label}</div>
                  <div>Projected: {formatCommerceMoney(point.target)}</div>
                  <div className={styles.analyticsTooltipActual}>Actual: {formatCommerceMoney(point.actual)}</div>
                </div>
                <div className={styles.analyticsBarTrack}>
                  <div className={styles.analyticsTargetBar} style={{ height: `${point.targetHeight}%` }} />
                </div>
                <span className={styles.analyticsBarLabel}>{point.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.analyticsXAxis}>
          {config.xAxisLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>

      <div className={styles.breakdownGrid}>
        <article className={styles.breakdownCard}>
          <div className={styles.breakdownCardHeader}>
            <span className={styles.breakdownTitle}>Actual Collection (Per Day)</span>
            <span className={styles.breakdownBadgeGreen}>Today</span>
          </div>
          <div className={styles.breakdownValue}>{formatCommerceMoney(48500)}</div>
          <p className={styles.breakdownMeta}>3 Verified Remittances Today (Target: ₱50,000)</p>
          <div className={styles.breakdownRows}>
            {BREAKDOWN_ROWS.day.map((row) => (
              <div key={row.label} className={styles.breakdownRow}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.breakdownCard}>
          <div className={styles.breakdownCardHeader}>
            <span className={styles.breakdownTitle}>Actual Collection (Per Month)</span>
            <span className={styles.breakdownBadgeBlue}>Q3 2026 MTD</span>
          </div>
          <div className={styles.breakdownValue}>{formatCommerceMoney(1447000)}</div>
          <p className={styles.breakdownMeta}>12 Renewal Contracts Collected (Target: ₱1.5M)</p>
          <div className={styles.breakdownRows}>
            {BREAKDOWN_ROWS.month.map((row) => (
              <div key={row.label} className={styles.breakdownRow}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className={styles.breakdownCard}>
          <div className={styles.breakdownCardHeader}>
            <span className={styles.breakdownTitle}>Actual Collection (Per Year)</span>
            <span className={styles.breakdownBadgePurple}>YTD 2026</span>
          </div>
          <div className={styles.breakdownValue}>{formatCommerceMoney(1425000)}</div>
          <p className={styles.breakdownMetaGreen}>Target YTD: ₱1,500,000 (95% Collected)</p>
          <div className={styles.breakdownRows}>
            {BREAKDOWN_ROWS.year.map((row) => (
              <div key={row.label} className={styles.breakdownRow}>
                <span>{row.label}</span>
                <strong>{row.value}</strong>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
