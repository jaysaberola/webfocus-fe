export const OPEN_DEAL_STORAGE_KEY = "commerceAdmin:openDeal";

export type OpenDealInboxAction = "view" | "set-price" | "upload-proposal" | "proceed-payment";

export type OpenDealInboxIntent = {
  id: number;
  action?: OpenDealInboxAction;
};

export function stashOpenDealFromInbox(intent: OpenDealInboxIntent) {
  if (typeof window === "undefined") return;
  const id = Number(intent.id);
  if (!(id > 0)) return;
  window.sessionStorage.setItem(
    OPEN_DEAL_STORAGE_KEY,
    JSON.stringify({
      id,
      action: intent.action || "view",
    }),
  );
}

export function takeOpenDealFromInbox(): OpenDealInboxIntent | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(OPEN_DEAL_STORAGE_KEY);
  window.sessionStorage.removeItem(OPEN_DEAL_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OpenDealInboxIntent;
    const id = Number(parsed?.id);
    if (!(id > 0)) return null;
    return { id, action: parsed.action || "view" };
  } catch {
    return null;
  }
}
