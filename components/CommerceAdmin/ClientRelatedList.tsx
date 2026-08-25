import styles from "@/styles/commerceAdmin.module.css";

export type ClientRelatedSection = "info" | "files" | "address" | "timeline" | "orders" | "invoices";

const RELATED_ITEMS: Array<{ id: ClientRelatedSection; label: string; icon: string }> = [
  { id: "info", label: "Client Information", icon: "fa-solid fa-user" },
  { id: "files", label: "File Attachments", icon: "fa-solid fa-paperclip" },
  { id: "address", label: "Address Information", icon: "fa-solid fa-location-dot" },
  { id: "orders", label: "Deals", icon: "fa-solid fa-handshake" },
  { id: "invoices", label: "Invoices", icon: "fa-solid fa-file-invoice" },
  { id: "timeline", label: "Timeline", icon: "fa-solid fa-clock-rotate-left" },
];

type Props = {
  activeSection: ClientRelatedSection;
  onNavigate: (section: ClientRelatedSection) => void;
  onHide?: () => void;
};

export default function ClientRelatedList({ activeSection, onNavigate, onHide }: Props) {
  return (
    <div className={styles.clientRelatedListWrap}>
      <nav className={styles.clientRelatedList} aria-label="Related list">
        <div className={styles.clientRelatedListTitleRow}>
          <h4 className={styles.clientRelatedListTitle}>Related List</h4>
          {onHide ? (
            <button
              type="button"
              className={styles.clientRelatedListHideBtn}
              onClick={onHide}
              aria-label="Hide related list"
              title="Hide related list"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
          ) : null}
        </div>
        <ul className={styles.clientRelatedListItems}>
          {RELATED_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${styles.clientRelatedListBtn}${active ? ` ${styles.clientRelatedListBtnActive}` : ""}`}
                  aria-current={active ? "true" : undefined}
                  onClick={() => onNavigate(item.id)}
                >
                  <i className={item.icon} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
