import { isFinanceRfqChatText } from "@/lib/commerceAdmin/priceRequestChatFilter";
import type { PortalConversationMessage } from "@/lib/customerPortal/types";

export type DealChatMessage = PortalConversationMessage;

const LEGACY_STAMP =
  /^(\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2})\s*[—–-]\s*([\s\S]*)$/;

function parseLegacyStampToIso(stamp: string) {
  const normalized = stamp.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

/** Finance RFQ notes — internal only, not deal chat. */
export function isInternalFinancePriceRequest(message: DealChatMessage): boolean {
  return isFinanceRfqChatText(String(message.text ?? ""), message.from);
}

export function visibleDealChatMessages(messages: DealChatMessage[]): DealChatMessage[] {
  return messages.filter((message) => !isInternalFinancePriceRequest(message));
}

export function enrichDealMessages(messages: DealChatMessage[]): DealChatMessage[] {
  return messages.map((message) => {
    if (message.at) return message;
    const match = message.text.match(LEGACY_STAMP);
    if (!match) return message;
    const at = parseLegacyStampToIso(match[1]);
    const text = match[2].trim() || message.text;
    return at ? { ...message, at, text } : { ...message, text };
  });
}

function messageDate(at?: string) {
  if (!at) return null;
  const parsed = new Date(at);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatChatDayLabel(at?: string) {
  const date = messageDate(at) ?? new Date();
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== today.getFullYear() ? "numeric" : undefined,
  });
}

export function formatChatTime(at?: string) {
  const date = messageDate(at);
  if (!date) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function dayKey(at?: string) {
  const date = messageDate(at) ?? new Date();
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export type ChatThreadItem =
  | { type: "date"; label: string; key: string }
  | { type: "message"; message: DealChatMessage; index: number };

export function buildChatThreadItems(messages: DealChatMessage[]): ChatThreadItem[] {
  const enriched = enrichDealMessages(messages);
  const items: ChatThreadItem[] = [];
  let lastDay = "";

  enriched.forEach((message, index) => {
    const key = dayKey(message.at);
    if (key !== lastDay) {
      items.push({
        type: "date",
        label: formatChatDayLabel(message.at),
        key: `day-${key}`,
      });
      lastDay = key;
    }
    items.push({ type: "message", message, index });
  });

  return items;
}

export function lastOutgoingMessageIndex(
  messages: DealChatMessage[],
  viewer: "customer" | "sales",
): number {
  const from = viewer === "sales" ? "sales" : "client";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.from === from) return i;
  }
  return -1;
}

export function isOutgoingMessageSeen(
  messages: DealChatMessage[],
  index: number,
  viewer: "customer" | "sales",
  seenByClientAt?: string | null,
  seenByStaffAt?: string | null,
): boolean {
  const message = messages[index];
  if (!message?.at) return false;
  const lastMine = lastOutgoingMessageIndex(messages, viewer);
  if (lastMine !== index) return false;

  const otherSeen = viewer === "sales" ? seenByClientAt : seenByStaffAt;
  if (!otherSeen) return false;

  return new Date(otherSeen).getTime() >= new Date(message.at).getTime();
}
