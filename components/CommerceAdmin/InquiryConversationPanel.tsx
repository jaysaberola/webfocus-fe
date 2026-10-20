import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { replyInquiry, type ContactInquiryRow } from "@/services/inquiryService";
import { notifyCommerceNotificationsUpdated } from "@/services/commerceAdminService";
import type { PortalConversationMessage } from "@/lib/customerPortal/types";
import WebFocusBrandMark from "@/components/CustomerPortal/WebFocusBrandMark";
import { toast } from "@/lib/toast";
import chatStyles from "@/styles/customerPortal.module.css";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  inquiry: ContactInquiryRow;
  onUpdated: (row: ContactInquiryRow) => void;
};

function peerInitial(name: string) {
  const trimmed = name.trim();
  return (trimmed.charAt(0) || "C").toUpperCase();
}

function PeerMark({ name, className }: { name: string; className?: string }) {
  return (
    <span className={[chatStyles.chatBrandMark, chatStyles.chatPeerMark, className].filter(Boolean).join(" ")} aria-hidden="true">
      {peerInitial(name)}
    </span>
  );
}

function inquiryName(row: ContactInquiryRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ").trim() || row.email || "Customer";
}

function inquiryReference(id: number) {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `INQ-${stamp}-${String(id).padStart(4, "0")}`;
}

export function resolveInquiryConversation(inquiry: ContactInquiryRow): PortalConversationMessage[] {
  const rows = (inquiry.conversation ?? []).filter((row) => String(row.text ?? "").trim() !== "");
  if (rows.length > 0) {
    return rows;
  }
  const text = String(inquiry.message ?? "").trim();
  if (!text) {
    return [];
  }
  return [
    {
      from: "client",
      text,
      at: inquiry.created_at ?? undefined,
    },
  ];
}

/** Customer Care view — staff messages align right (same as deal chat for sales). */
function isStaffMessage(from?: string) {
  return from === "sales" || from === "staff";
}

export default function InquiryConversationPanel({ inquiry, onUpdated }: Props) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [thread, setThread] = useState<PortalConversationMessage[]>(() => resolveInquiryConversation(inquiry));
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(true);
  }, [inquiry.id]);

  const displayName = inquiryName(inquiry);
  const subtitle = `${inquiryReference(inquiry.id)} · ${inquiry.inquiry_type}`;

  useEffect(() => {
    setThread(resolveInquiryConversation(inquiry));
  }, [inquiry]);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [thread, inquiry.id]);

  const sendReply = () => {
    const message = draft.trim();
    if (!message || sending) return;
    setSending(true);
    void replyInquiry(inquiry.id, message)
      .then((result) => {
        setDraft("");
        setThread(resolveInquiryConversation(result.inquiry));
        onUpdated(result.inquiry);
        notifyCommerceNotificationsUpdated();
        if (result.message) {
          toast.success(result.message);
        } else if (result.emailed && result.recipient) {
          toast.success(`Reply sent to ${result.recipient}.`);
        } else {
          toast.success("Reply saved in the conversation.");
        }
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        toast.error(err?.response?.data?.message || "Failed to send reply.");
      })
      .finally(() => setSending(false));
  };

  const dock = (
    <>
      {!open ? (
        <button
          type="button"
          className={`${chatStyles.chatLauncher} ${chatStyles.chatLauncherDock}`}
          onClick={() => setOpen(true)}
          aria-label={`Open chat with ${displayName}`}
        >
          <WebFocusBrandMark variant="badge" />
        </button>
      ) : (
        <div className={`${chatStyles.chatWidgetOverlay} ${styles.inquiryChatDockOverlay}`} role="presentation">
          <div className={`${chatStyles.chatWidget} ${styles.inquiryChatHost}`}>
      <div className={chatStyles.chatHead}>
        <PeerMark name={displayName} className={chatStyles.chatHeadMark} />
        <div className={chatStyles.chatHeadText}>
          <h3>{displayName}</h3>
          <p>{subtitle}</p>
        </div>
        <button type="button" className={chatStyles.chatClose} onClick={() => setOpen(false)} aria-label="Minimize inquiry chat">
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
      </div>

      <div className={chatStyles.chatPricePin}>
        <div>
          <span>Inquiry</span>
          <strong>{inquiry.inquiry_type}</strong>
        </div>
      </div>

      <div ref={scroller} className={`${chatStyles.chatThread} ${styles.inquiryChatThread}`}>
        {thread.length === 0 ? (
          <p className={chatStyles.chatEmpty}>No Contact Us message on file.</p>
        ) : (
          thread.map((message, index) => {
            const mine = isStaffMessage(message.from);
            return (
              <div
                key={`${message.from}-${index}-${message.text.slice(0, 16)}`}
                className={mine ? chatStyles.chatRowMine : chatStyles.chatRowTheirs}
              >
                {mine ? null : <PeerMark name={displayName} className={chatStyles.chatBubbleMark} />}
                <div className={mine ? chatStyles.chatBubbleMine : chatStyles.chatBubbleTheirs}>
                  {message.text ? <p>{message.text}</p> : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        className={chatStyles.chatComposer}
        onSubmit={(event) => {
          event.preventDefault();
          sendReply();
        }}
      >
        <div className={chatStyles.chatComposerRow}>
          <button
            type="button"
            className={chatStyles.chatAttach}
            aria-label="Attach a file"
            disabled
            title="File attachments are not available for inquiries yet"
          >
            <i className="fa-solid fa-paperclip" aria-hidden="true" />
          </button>
          <textarea
            className={chatStyles.chatInput}
            rows={1}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendReply();
              }
            }}
            placeholder="Message the customer about this inquiry..."
            disabled={sending}
          />
          <button type="submit" className={chatStyles.chatSend} disabled={sending || !draft.trim()}>
            {sending ? "..." : <i className="fa-solid fa-paper-plane" aria-hidden="true" />}
            <span className={chatStyles.srOnly}>{sending ? "Sending" : "Send"}</span>
          </button>
        </div>
      </form>
          </div>
        </div>
      )}
    </>
  );

  if (!mounted) return null;

  return createPortal(dock, document.body);
}
