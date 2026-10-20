import { useEffect, useMemo, useState } from "react";
import { CRM_ATTACHMENT_FIELDS, fileNameFromPath, type ClientFolderFile } from "@/lib/commerceAdmin/clientCrmFileCatalog";
import { fetchCommercePaymentProofs } from "@/services/commerceAdminService";
import { resolveStorageAssetUrl } from "@/lib/storageAssets";
import { getSalesTransactions, type SalesTransaction, type SalesTransactionProposal } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

type FolderKey = "receipts" | "contracts" | "other";

type Props = {
  clientId: number;
  clientName: string;
  clientEmail: string;
  existingFiles: Record<string, string | null>;
  existingFileUrls: Record<string, string | null>;
  pendingFiles?: Record<string, File | null>;
  onOpenUploads?: () => void;
};

const FOLDERS: Array<{ key: FolderKey; title: string; hint: string }> = [
  {
    key: "receipts",
    title: "Receipts",
    hint: "Payment proofs and billing receipts uploaded for this client.",
  },
  {
    key: "contracts",
    title: "Contracts",
    hint: "Proposal quotations and signed contract copies from client deals.",
  },
  {
    key: "other",
    title: "Other attachments",
    hint: "Registration documents and files saved on the client profile.",
  },
];

function extractTransactionRows(payload: unknown): SalesTransaction[] {
  if (Array.isArray(payload)) return payload as SalesTransaction[];
  if (payload && typeof payload === "object") {
    const data = (payload as { data?: unknown }).data;
    if (Array.isArray(data)) return data as SalesTransaction[];
  }
  return [];
}

function proposalLabel(proposal: SalesTransactionProposal) {
  const kind = String(proposal.kind || "").toLowerCase();
  if (kind === "signed") return "Signed contract copy";
  if (kind === "proposal") return "Proposal quotation";
  return "Contract document";
}

function matchesClientEmail(email: string, candidate?: string | null) {
  const left = email.trim().toLowerCase();
  const right = String(candidate ?? "").trim().toLowerCase();
  return Boolean(left && right && left === right);
}

function FileRowActions({ url, fileName }: { url: string; fileName: string }) {
  return (
    <div className={styles.clientFilesRowActions}>
      <a
        className={styles.clientFilesIconBtn}
        href={url}
        target="_blank"
        rel="noreferrer"
        title="View"
        aria-label={`View ${fileName}`}
      >
        <i className="fa-regular fa-eye" aria-hidden="true" />
      </a>
      <a
        className={styles.clientFilesIconBtn}
        href={url}
        download={fileName || undefined}
        title="Download"
        aria-label={`Download ${fileName}`}
      >
        <i className="fa-solid fa-download" aria-hidden="true" />
      </a>
    </div>
  );
}

export default function ClientFilesPanel({
  clientId,
  clientName,
  clientEmail,
  existingFiles,
  existingFileUrls,
  pendingFiles,
  onOpenUploads,
}: Props) {
  const [openFolder, setOpenFolder] = useState<FolderKey>("receipts");
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<ClientFolderFile[]>([]);
  const [contracts, setContracts] = useState<ClientFolderFile[]>([]);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    void (async () => {
      try {
        const [txPayload, proofPayload] = await Promise.all([
          getSalesTransactions({ customer_id: clientId, per_page: 100 }, { silent: true }),
          fetchCommercePaymentProofs("all", 200),
        ]);

        if (!alive) return;

        const transactions = extractTransactionRows(txPayload);
        const contractRows: ClientFolderFile[] = [];
        transactions.forEach((transaction) => {
          const dealLabel = transaction.transaction_no || `Deal #${transaction.id}`;
          (transaction.proposals ?? []).forEach((proposal) => {
            if (!proposal.fileName && !proposal.fileUrl) return;
            contractRows.push({
              id: `proposal-${transaction.id}-${proposal.id}`,
              label: `${dealLabel} — ${proposalLabel(proposal)}`,
              fileName: proposal.fileName || fileNameFromPath(proposal.fileUrl),
              url: resolveStorageAssetUrl(proposal.fileUrl) || proposal.fileUrl,
              meta: proposal.uploadedAt ? `Uploaded ${new Date(proposal.uploadedAt).toLocaleString()}` : undefined,
              source: "contract",
            });
          });
        });

        const proofList = Array.isArray(proofPayload) ? proofPayload : [];
        const receiptRows = proofList
          .filter((row) => row.kind === "payment_proof" || !row.kind)
          .filter(
            (row) =>
              matchesClientEmail(clientEmail, row.email) ||
              (clientName &&
                String(row.client ?? "")
                  .toLowerCase()
                  .includes(clientName.trim().toLowerCase())),
          )
          .map((row) => ({
            id: `receipt-${row.id}`,
            label: row.invoiceId ? `Invoice ${row.invoiceId}` : row.proofNo,
            fileName: row.fileName,
            url: resolveStorageAssetUrl(row.fileUrl) || row.fileUrl,
            meta: [row.proofNo, row.status].filter(Boolean).join(" · "),
            source: "receipt" as const,
          }));

        setContracts(contractRows);
        setReceipts(receiptRows);
      } catch {
        if (!alive) return;
        setContracts([]);
        setReceipts([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [clientId, clientEmail, clientName]);

  const otherAttachments = useMemo(() => {
    const rows: ClientFolderFile[] = [];
    CRM_ATTACHMENT_FIELDS.forEach(({ key, label }) => {
      const pending = pendingFiles?.[key];
      const path = existingFiles[key];
      const url = existingFileUrls[key];
      if (pending) {
        rows.push({
          id: `crm-pending-${key}`,
          label,
          fileName: pending.name,
          meta: "Selected — save client to upload",
          source: "crm",
        });
        return;
      }
      if (!path && !url) return;
      rows.push({
        id: `crm-${key}`,
        label,
        fileName: fileNameFromPath(path) || label,
        url: resolveStorageAssetUrl(url || path) || url || path,
        meta: "On client profile",
        source: "crm",
      });
    });
    return rows;
  }, [existingFiles, existingFileUrls, pendingFiles]);

  const folderFiles: Record<FolderKey, ClientFolderFile[]> = {
    receipts,
    contracts,
    other: otherAttachments,
  };

  const activeFiles = folderFiles[openFolder];
  const activeFolder = FOLDERS.find((folder) => folder.key === openFolder);

  return (
    <div id="client-section-files-tab" className={styles.clientFilesPanel}>
      <div className={styles.clientFilesPanelHead}>
        <div>
          <h4 className={styles.clientCrmSectionTitle}>Client files</h4>
          {clientName ? <p className={styles.panelSubtitle}>{clientName}</p> : null}
        </div>
        {onOpenUploads ? (
          <button type="button" className={styles.secondaryBtnSm} onClick={onOpenUploads}>
            Go to uploads
          </button>
        ) : null}
      </div>

      <div className={styles.clientFilesFolderTabs} role="tablist" aria-label="File folders">
        {FOLDERS.map((folder) => {
          const count = folderFiles[folder.key].length;
          const active = openFolder === folder.key;
          return (
            <button
              key={folder.key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.clientCrmTab}${active ? ` ${styles.clientCrmTabActive}` : ""}`}
              onClick={() => setOpenFolder(folder.key)}
            >
              {folder.title}
              <span className={styles.clientFilesTabCount}>{count}</span>
            </button>
          );
        })}
      </div>

      <p className={styles.clientFilesListHint}>{activeFolder?.hint}</p>

      <div className={styles.clientFilesTableWrap}>
        {loading && openFolder !== "other" ? (
          <p className={styles.emptyState}>Loading files...</p>
        ) : activeFiles.length === 0 ? (
          <p className={styles.emptyState}>No files in this folder yet.</p>
        ) : (
          <table className={styles.clientFilesTable}>
            <thead>
              <tr>
                <th>Document</th>
                <th>File name</th>
                <th>Details</th>
                <th className={styles.clientFilesActionHead} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {activeFiles.map((file) => (
                <tr key={file.id}>
                  <td data-label="Document">{file.label}</td>
                  <td data-label="File name">{file.fileName}</td>
                  <td data-label="Details">{file.meta || "—"}</td>
                  <td className={styles.clientFilesActionCell} data-label="Actions">
                    {file.url ? (
                      <FileRowActions url={file.url} fileName={file.fileName} />
                    ) : (
                      <span className={styles.clientFilesListMeta}>Pending save</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
