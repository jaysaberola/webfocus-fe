import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PortalModal from "@/components/CustomerPortal/PortalModal";
import WebFocusBrandMark from "@/components/CustomerPortal/WebFocusBrandMark";
import {
  fetchPortalDealConversation,
  fetchPortalDealFile,
  notifyPortalNotificationsUpdated,
  replyPortalOrderNote,
} from "@/services/customerPortalService";
import {
  fetchSalesDealConversation,
  fetchSalesDealFile,
  replySalesDealNote,
} from "@/services/salesTransactionService";
import { notifyCommerceNotificationsUpdated } from "@/services/commerceAdminService";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import { formatPeso } from "@/lib/customerPortal/mockData";
import { toast } from "@/lib/toast";
import type { PortalConversationMessage, PortalOrder } from "@/lib/customerPortal/types";
import styles from "@/styles/customerPortal.module.css";

export type DealChatMessage = PortalConversationMessage;

function conversationFingerprint(messages: DealChatMessage[]) {
  return messages
    .map((row) => `${row.from}:${row.text}:${row.file?.name || ""}:${row.at || ""}`)
    .join("|");
}

function splitMessages(value?: string | null) {
  return String(value || "")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function fallbackThread(clientNotes?: string | null, salesNotes?: string | null): DealChatMessage[] {
  return [
    ...splitMessages(clientNotes).map((text) => ({ from: "client" as const, text })),
    ...splitMessages(salesNotes).map((text) => ({ from: "sales" as const, text })),
  ];
}

function seenKey(viewer: "customer" | "sales", recordId?: number | null) {
  return `deal-chat-seen:${viewer}:${recordId || 0}`;
}

function readSeen(viewer: "customer" | "sales", recordId?: number | null) {
  if (typeof window === "undefined" || !recordId) return 0;
  const value = Number(window.localStorage.getItem(seenKey(viewer, recordId)));
  return Number.isFinite(value) ? value : 0;
}

function writeSeen(viewer: "customer" | "sales", recordId: number | null | undefined, count: number) {
  if (typeof window === "undefined" || !recordId) return;
  window.localStorage.setItem(seenKey(viewer, recordId), String(count));
}

function isImageFile(name?: string | null, url?: string | null) {
  return /\.(png|jpe?g|gif|webp)$/i.test(`${name || ""} ${url || ""}`);
}

function peerInitial(name?: string | null) {
  const trimmed = String(name || "").trim();
  return (trimmed.charAt(0) || "C").toUpperCase();
}

function PeerMark({ name, className }: { name?: string | null; className?: string }) {
  return (
    <span className={[styles.chatBrandMark, styles.chatPeerMark, className].filter(Boolean).join(" ")} aria-hidden="true">
      {peerInitial(name)}
    </span>
  );
}

type DealConversationModalProps = {
  open: boolean;
  recordId?: number | null;
  orderNo?: string | null;
  clientNotes?: string | null;
  salesNotes?: string | null;
  conversation?: DealChatMessage[] | null;
  isWebDesign?: boolean;
  viewer?: "customer" | "sales";
  peerName?: string;
  placement?: "center" | "right";
  showLauncher?: boolean;
  quotedPrice?: number | null;
  canSetPrice?: boolean;
  onSetPrice?: () => void;
  onOpen?: () => void;
  onClose: () => void;
  onReplied?: (order: Partial<PortalOrder> & { notes?: string; conversation?: DealChatMessage[] }) => void;
};

export default function DealConversationModal({
  open,
  recordId,
  orderNo,
  clientNotes,
  salesNotes,
  conversation,
  isWebDesign = false,
  viewer = "customer",
  peerName,
  placement = "right",
  showLauncher = true,
  quotedPrice = 0,
  canSetPrice = false,
  onSetPrice,
  onOpen,
  onClose,
  onReplied,
}: DealConversationModalProps) {
  const [draft, setDraft] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [thread, setThread] = useState<DealChatMessage[]>([]);
  const [liveConversation, setLiveConversation] = useState<DealChatMessage[] | null>(null);
  const [liveQuotedPrice, setLiveQuotedPrice] = useState<number | null>(null);
  const [seen, setSeen] = useState(() => readSeen(viewer, recordId));
  const [mounted, setMounted] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const lastFingerprint = useRef("");
  const onRepliedRef = useRef(onReplied);
  const salesView = viewer === "sales";

  useEffect(() => {
    onRepliedRef.current = onReplied;
  }, [onReplied]);
  const otherFrom = salesView ? "client" : "sales";
  const title = salesView ? peerName || "Customer" : "Sales";
  const subtitle = orderNo
    ? `${orderNo}${isWebDesign ? " · Quotation" : ""}`
    : isWebDesign
      ? "Quotation"
      : "Deal conversation";
  const canSend = Boolean(recordId) && !sending && (Boolean(draft.trim()) || Boolean(file));
  const pinnedPrice = Number(liveQuotedPrice ?? quotedPrice ?? 0);

  const resolvedThread = useMemo(() => {
    if (liveConversation && liveConversation.length) return liveConversation;
    return conversation && conversation.length ? conversation : fallbackThread(clientNotes, salesNotes);
  }, [clientNotes, conversation, liveConversation, salesNotes]);

  const otherCount = useMemo(
    () => resolvedThread.filter((message) => message.from === otherFrom).length,
    [otherFrom, resolvedThread],
  );
  const unread = Math.max(0, otherCount - seen);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLiveConversation(null);
    setLiveQuotedPrice(null);
    lastFingerprint.current = "";
  }, [recordId]);

  useEffect(() => {
    setThread(resolvedThread);
    setSeen(readSeen(viewer, recordId));
  }, [open, recordId, resolvedThread, viewer]);

  useEffect(() => {
    if (!open || !recordId) return;
    writeSeen(viewer, recordId, otherCount);
    setSeen(otherCount);
  }, [open, otherCount, recordId, viewer]);

  useEffect(() => {
    if (!open) return;
    const node = scroller.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [open, thread, sending]);

  useEffect(() => {
    if (!recordId) return;

    let cancelled = false;

    const poll = () => {
      if (cancelled || sending) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

      const request = salesView
        ? fetchSalesDealConversation(recordId)
        : fetchPortalDealConversation(recordId);

      void request
        .then((next) => {
          if (cancelled) return;
          const messages = (next.conversation ?? []) as DealChatMessage[];
          if (!messages.length && !next.clientNotes && !next.salesNotes) return;

          const nextThread = messages.length
            ? messages
            : fallbackThread(next.clientNotes, next.salesNotes);
          const fingerprint = conversationFingerprint(nextThread);
          if (fingerprint === lastFingerprint.current) {
            if (typeof next.quotedPrice === "number" && next.quotedPrice > 0) {
              setLiveQuotedPrice(next.quotedPrice);
            }
            return;
          }

          const hadBaseline = lastFingerprint.current !== "";
          lastFingerprint.current = fingerprint;
          setLiveConversation(nextThread);
          if (typeof next.quotedPrice === "number") setLiveQuotedPrice(next.quotedPrice);

          onRepliedRef.current?.({
            notes: next.notes,
            clientNotes: next.clientNotes,
            salesNotes: next.salesNotes,
            conversation: nextThread,
            quotedPrice: next.quotedPrice,
          });

          if (!hadBaseline) return;

          if (salesView) notifyCommerceNotificationsUpdated();
          else notifyPortalNotificationsUpdated();
        })
        .catch(() => {
          // Ignore transient poll failures.
        });
    };

    poll();
    const interval = window.setInterval(poll, open ? 4000 : 8000);
    const onFocus = () => poll();
    const onVisible = () => {
      if (document.visibilityState === "visible") poll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, recordId, salesView, sending]);

  const empty = thread.length === 0;

  const openAttachment = (file: NonNullable<DealChatMessage["file"]>, mode: "view" | "download") => {
    if (!recordId) {
      const fallback = resolveStorageAssetUrl(file.url) || file.url;
      if (fallback) window.open(fallback, "_blank", "noopener,noreferrer");
      else toast.error("This attachment is not available.");
      return;
    }
    const request = salesView
      ? fetchSalesDealFile(recordId, file, mode === "download")
      : fetchPortalDealFile(recordId, file, mode === "download");
    void request
      .then((blob) => {
        const blobUrl = URL.createObjectURL(blob);
        if (mode === "download") {
          const link = document.createElement("a");
          link.href = blobUrl;
          link.download = file.name || "attachment";
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
          return;
        }
        window.open(blobUrl, "_blank", "noopener,noreferrer");
      })
      .catch(() => {
        const fallback = resolveStorageAssetUrl(file.url) || file.url;
        if (fallback) window.open(fallback, "_blank", "noopener,noreferrer");
        else toast.error("Could not open the attachment.");
      });
  };

  const sendReply = () => {
    const message = draft.trim();
    if (!recordId || sending || (!message && !file)) return;
    setSending(true);
    const request = salesView
      ? replySalesDealNote(recordId, message, file)
      : replyPortalOrderNote(recordId, message, file);
    void request
      .then((next) => {
        setDraft("");
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
        let nextThread: DealChatMessage[] = (next.conversation as DealChatMessage[] | undefined) ?? [];
        if (!nextThread.length) {
          nextThread = [
            ...resolvedThread,
            {
              from: (salesView ? "sales" : "client") as DealChatMessage["from"],
              text: message || (file ? `Sent an attachment: ${file.name}` : ""),
              file: file ? { name: file.name, url: "", kind: "file" as const } : undefined,
            },
          ];
        }
        setThread(nextThread);
        setLiveConversation(nextThread);
        lastFingerprint.current = conversationFingerprint(nextThread);
        if (typeof next.quotedPrice === "number") setLiveQuotedPrice(next.quotedPrice);
        onReplied?.(next);
        notifyPortalNotificationsUpdated();
        if (salesView) notifyCommerceNotificationsUpdated();
        const uploadedProposal = next.conversation?.some((row) => row.file?.kind === "proposal" || row.file?.kind === "signed");
        toast.success(
          uploadedProposal
            ? "File uploaded. A confirmation was added to the conversation."
            : salesView
              ? "Reply sent. The customer will be notified."
              : "Reply sent. Sales will be notified.",
        );
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        toast.error(err?.response?.data?.message || "Failed to send reply.");
      })
      .finally(() => setSending(false));
  };

  const launcher =
    showLauncher && !open && recordId && mounted
      ? createPortal(
          <button
            type="button"
            className={`${styles.chatLauncher} ${styles.chatLauncherDock}`}
            onClick={() => onOpen?.()}
            aria-label={unread ? `Open chat, ${unread} new messages` : "Open chat"}
          >
            <WebFocusBrandMark variant="badge" />
            {unread > 0 ? <span className={styles.chatBadge}>{unread > 9 ? "9+" : unread}</span> : null}
          </button>,
          document.body,
        )
      : null;

  return (
    <>
      {launcher}

      <PortalModal
        open={open}
        onClose={onClose}
        ariaLabelledBy="deal-conversation-title"
        dialogClassName={placement === "right" ? `${styles.chatDialog} ${styles.chatWidget}` : styles.chatDialog}
        overlayClassName={placement === "right" ? styles.chatWidgetOverlay : undefined}
        closeOnOverlay={false}
        lockScroll={false}
      >
        <div className={styles.chatHead}>
          {salesView ? (
            <PeerMark name={peerName || title} className={styles.chatHeadMark} />
          ) : (
            <WebFocusBrandMark variant="badge" className={styles.chatHeadMark} />
          )}
          <div className={styles.chatHeadText}>
            <h3 id="deal-conversation-title">{salesView ? title : "WebFocus Solutions, Inc."}</h3>
            <p>{salesView ? subtitle : "Typically replies within a few minutes"}</p>
          </div>
          <button type="button" className={styles.chatClose} onClick={onClose} aria-label="Close">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {pinnedPrice > 0 || canSetPrice ? (
          <div className={styles.chatPricePin}>
            <div>
              <span>Quoted price</span>
              <strong>{pinnedPrice > 0 ? formatPeso(pinnedPrice) : "Not set"}</strong>
            </div>
            {canSetPrice && onSetPrice ? (
              <button type="button" className={styles.chatPriceBtn} onClick={onSetPrice}>
                {pinnedPrice > 0 ? "Update Price" : "Set Price"}
              </button>
            ) : null}
          </div>
        ) : null}

        <div ref={scroller} className={styles.chatThread}>
          {empty ? (
            <p className={styles.chatEmpty}>No messages yet. Start the conversation below.</p>
          ) : (
            thread.map((message, index) => {
              const mine = salesView ? message.from === "sales" : message.from === "client";
              const fileUrl = resolveStorageAssetUrl(message.file?.url);
              const image = Boolean(message.file && isImageFile(message.file.name, message.file.url));
              return (
                <div
                  key={`${message.from}-${index}-${message.text.slice(0, 12)}`}
                  className={mine ? styles.chatRowMine : styles.chatRowTheirs}
                >
                  {mine ? null : salesView ? (
                    <PeerMark name={peerName || title} className={styles.chatBubbleMark} />
                  ) : (
                    <WebFocusBrandMark variant="badge" className={styles.chatBubbleMark} />
                  )}
                  <div
                    className={[
                      mine ? styles.chatBubbleMine : styles.chatBubbleTheirs,
                      /grand total:/i.test(message.text) ? styles.chatQuote : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    {message.text ? <p>{message.text}</p> : null}
                    {message.file ? (
                      <div className={styles.chatFile}>
                        {image && fileUrl ? (
                          <img
                            src={fileUrl}
                            alt=""
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <i className="fa-regular fa-file" aria-hidden="true" />
                        )}
                        <div className={styles.chatFileMeta}>
                          <span>{message.file.name}</span>
                          <div className={styles.chatFileActions}>
                            <button type="button" onClick={() => openAttachment(message.file!, "view")}>
                              View
                            </button>
                            <button type="button" onClick={() => openAttachment(message.file!, "download")}>
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          className={styles.chatComposer}
          onSubmit={(event) => {
            event.preventDefault();
            sendReply();
          }}
        >
          {file ? (
            <div className={styles.chatAttachPreview}>
              <i className="fa-regular fa-file" aria-hidden="true" />
              <span>{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  if (fileInput.current) fileInput.current.value = "";
                }}
                aria-label="Remove attachment"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          ) : null}
          <div className={styles.chatComposerRow}>
            <input
              ref={fileInput}
              className={styles.srOnly}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
              }}
            />
            <button
              type="button"
              className={styles.chatAttach}
              onClick={() => fileInput.current?.click()}
              aria-label={isWebDesign ? "Attach a file or upload the proposal" : "Attach a file"}
              disabled={sending || !recordId}
            >
              <i className="fa-solid fa-paperclip" aria-hidden="true" />
            </button>
            <textarea
              className={styles.chatInput}
              rows={1}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendReply();
                }
              }}
              placeholder={
                isWebDesign
                  ? "Message about the quoted price or attach a proposal..."
                  : "Type a message or attach a file..."
              }
            />
            <button type="submit" className={styles.chatSend} disabled={!canSend}>
              {sending ? "..." : <i className="fa-solid fa-paper-plane" aria-hidden="true" />}
              <span className={styles.srOnly}>{sending ? "Sending" : "Send"}</span>
            </button>
          </div>
        </form>
      </PortalModal>
    </>
  );
}
