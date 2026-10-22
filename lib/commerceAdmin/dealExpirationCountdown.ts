export type DealExpirationCountdownVariant = "none" | "future" | "soon" | "today" | "expired";

export type DealExpirationCountdownState = {
  variant: DealExpirationCountdownVariant;
  /** Primary countdown line (live-updated). */
  label: string;
  /** Optional secondary detail, e.g. exact time for today. */
  sublabel: string | null;
};

function pad2(n: number) {
  return String(Math.max(0, n)).padStart(2, "0");
}

function formatHmMs(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function formatDaysHours(ms: number) {
  const days = Math.floor(ms / 86400000);
  const rem = ms % 86400000;
  const hours = Math.floor(rem / 3600000);
  if (days <= 0) return formatHmMs(ms);
  if (hours <= 0) return `${days}d left`;
  return `${days}d ${hours}h left`;
}

export function dealExpirationCountdownState(
  iso: string,
  dealStatusLabel: string,
  nowMs: number = Date.now(),
): DealExpirationCountdownState {
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) {
    return { variant: "none", label: "", sublabel: null };
  }

  const statusLower = String(dealStatusLabel ?? "").toLowerCase();
  const diff = end - nowMs;

  if (statusLower === "renew" || diff < 0) {
    const ago = Math.abs(diff);
    const days = Math.floor(ago / 86400000);
    const rem = ago % 86400000;
    const label = days > 0 ? `Expired · ${days}d ago` : `Expired · ${formatHmMs(rem)} ago`;
    return { variant: "expired", label, sublabel: "Renew to reactivate" };
  }

  const active = statusLower === "active";
  if (!active) {
    return { variant: "none", label: "", sublabel: null };
  }

  if (diff <= 86400000) {
    return {
      variant: "today",
      label: diff <= 0 ? "Expired" : `Today · ${formatHmMs(diff)}`,
      sublabel: diff <= 0 ? "Renew to reactivate" : "Ends today",
    };
  }

  const days = Math.floor(diff / 86400000);
  if (days > 90) {
    return {
      variant: "future",
      label: formatDaysHours(diff),
      sublabel: `${days} days remaining`,
    };
  }

  if (days > 7) {
    return {
      variant: "soon",
      label: formatDaysHours(diff),
      sublabel: null,
    };
  }

  return {
    variant: "soon",
    label: formatDaysHours(diff),
    sublabel: formatHmMs(diff % 86400000),
  };
}

/** Poll interval for live updates (ms). */
export function dealExpirationTickMs(iso: string, nowMs: number = Date.now()): number {
  const end = Date.parse(iso);
  if (!Number.isFinite(end)) return 60000;
  const diff = Math.abs(end - nowMs);
  if (diff <= 7 * 86400000) return 1000;
  if (diff <= 30 * 86400000) return 15000;
  return 60000;
}
