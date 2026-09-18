const STORAGE_KEY = "webfocus.paynamicsProofPrompt";
const DISMISS_KEY = "webfocus.paynamicsProofPrompt.dismissed";
const OPEN_UPLOAD_KEY = "webfocus.paynamicsProofPrompt.openUpload";
const TEST_SNOOZE_MS = 8_000;

export type PaynamicsProofPrompt = {
  at: number;
  requestId: string | null;
};

export function markPaynamicsProofNeeded(payload?: { requestId?: string | null }) {
  if (typeof window === "undefined") return;

  const next: PaynamicsProofPrompt = {
    at: Date.now(),
    requestId: payload?.requestId?.trim() || null,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  sessionStorage.removeItem(DISMISS_KEY);
}

export function readPaynamicsProofPrompt(): PaynamicsProofPrompt | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PaynamicsProofPrompt;
    if (!parsed?.at) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isFreshPaynamicsProofPrompt(maxAgeMs = 30 * 60 * 1000): boolean {
  const prompt = readPaynamicsProofPrompt();
  if (!prompt) return false;
  return Date.now() - prompt.at <= maxAgeMs;
}

export function isPaynamicsProofPromptDismissed(): boolean {
  return paynamicsProofPromptSnoozeRemainingMs() > 0;
}

export function paynamicsProofPromptSnoozeRemainingMs(): number {
  if (typeof window === "undefined") return 0;
  const raw = sessionStorage.getItem(DISMISS_KEY);
  if (!raw || raw === "1") return 0;
  const until = Number(raw);
  if (!Number.isFinite(until)) return 0;
  return Math.max(0, until - Date.now());
}

export function dismissPaynamicsProofPrompt(ms = TEST_SNOOZE_MS) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DISMISS_KEY, String(Date.now() + ms));
}

export function clearPaynamicsProofPrompt() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(DISMISS_KEY);
  sessionStorage.removeItem(OPEN_UPLOAD_KEY);
}

export function markOpenProofUpload() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(OPEN_UPLOAD_KEY, "1");
}

export function consumeOpenProofUpload() {
  if (typeof window === "undefined") return false;
  const open = sessionStorage.getItem(OPEN_UPLOAD_KEY) === "1";
  if (open) sessionStorage.removeItem(OPEN_UPLOAD_KEY);
  return open;
}
