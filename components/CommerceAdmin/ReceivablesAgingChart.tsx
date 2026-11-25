import { useMemo } from "react";
import { formatDealAmount } from "@/lib/commerceAdmin/clientDealHelpers";
import type { ReceivablesAgingBucket } from "@/lib/commerceAdmin/collectionQueueHelpers";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  buckets: ReceivablesAgingBucket[];
  plotHeightPx?: number;
};

function formatAxisAmount(value: number) {
  if (value === 0) return "₱0";
  return `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;
}

function computeYScale(maxValue: number) {
  if (maxValue <= 0) {
    return { yMax: 400_000, ticks: [0, 100_000, 200_000, 300_000, 400_000] };
  }

  const divisions = 4;
  const roughStep = maxValue / divisions;
  const magnitude = 10 ** Math.floor(Math.log10(Math.max(roughStep, 1)));
  const normalized = roughStep / magnitude;
  let niceUnit = 1;
  if (normalized <= 1) niceUnit = 1;
  else if (normalized <= 2) niceUnit = 2;
  else if (normalized <= 5) niceUnit = 5;
  else niceUnit = 10;

  const step = niceUnit * magnitude;
  const yMax = step * Math.max(divisions, Math.ceil(maxValue / step));
  const tickCount = Math.floor(yMax / step) + 1;
  const ticks = Array.from({ length: tickCount }, (_, index) => index * step);
  return { yMax, ticks };
}

export default function ReceivablesAgingChart({ buckets, plotHeightPx = 208 }: Props) {
  const maxAmount = useMemo(() => Math.max(0, ...buckets.map((item) => item.amount)), [buckets]);
  const { yMax, ticks } = useMemo(() => computeYScale(maxAmount), [maxAmount]);
  const yTicksTopToBottom = useMemo(() => [...ticks].reverse(), [ticks]);

  return (
    <div
      className={styles.collectionAgingChartFrame}
      role="img"
      aria-label="Receivables aging bar chart by days outstanding"
    >
      <div className={styles.collectionAgingYAxis} style={{ height: plotHeightPx }}>
        {yTicksTopToBottom.map((tick) => (
          <span key={tick} className={styles.collectionAgingYTick}>
            {formatAxisAmount(tick)}
          </span>
        ))}
      </div>

      <div className={styles.collectionAgingPlotArea}>
        <div className={styles.collectionAgingGrid} style={{ height: plotHeightPx }} aria-hidden="true">
          {yTicksTopToBottom.map((tick) => (
            <div key={tick} className={styles.collectionAgingGridLine} />
          ))}
        </div>

        <div className={styles.collectionAgingBars} style={{ height: plotHeightPx }}>
          {buckets.map((bucket) => {
            const ratio = yMax > 0 ? bucket.amount / yMax : 0;
            const heightPx = Math.round(ratio * plotHeightPx);
            return (
              <div key={bucket.key} className={styles.collectionAgingBarSlot}>
                <div
                  className={styles.collectionAgingBarSolid}
                  style={{ height: heightPx }}
                  title={`${bucket.label}: ${formatDealAmount(bucket.amount)}`}
                />
              </div>
            );
          })}
        </div>

        <div className={styles.collectionAgingXAxis}>
          {buckets.map((bucket) => (
            <span key={bucket.key} className={styles.collectionAgingXLabel}>
              {bucket.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}