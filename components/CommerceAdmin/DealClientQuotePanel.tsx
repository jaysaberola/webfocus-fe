import type { ClientOrderFormState } from "@/lib/commerceAdmin/clientOrderFormHelpers";
import {
  annualSrpInputState,
  buildHostingClientQuoteSnapshot,
  hostingClientQuoteLines,
  hostingQuoteVatBreakdown,
} from "@/lib/commerceAdmin/hostingClientQuote";
import {
  downloadHostingClientQuoteExcel,
  downloadHostingClientQuotePdf,
  splitPesoDisplay,
} from "@/lib/commerceAdmin/hostingClientQuoteExport";
import { toast } from "@/lib/toast";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  clientName: string;
  dealName: string;
  form: ClientOrderFormState;
  setField: <K extends keyof ClientOrderFormState>(key: K, value: ClientOrderFormState[K]) => void;
  inputClass: (required?: boolean, extra?: string) => string;
  /** True when deal lines still need Finance pricing — client PDF should wait for Annual SRP. */
  awaitingFinancePrice?: boolean;
};

export default function DealClientQuotePanel({
  clientName,
  dealName,
  form,
  setField,
  inputClass,
  awaitingFinancePrice = false,
}: Props) {
  const snapshot = buildHostingClientQuoteSnapshot({
    clientName,
    dealName,
    quoteDataCenter: form.quoteDataCenter,
    quoteProcessor: form.quoteProcessor,
    quoteCores: form.quoteCores,
    quoteThreads: form.quoteThreads,
    quoteRam: form.quoteRam,
    quoteStorage: form.quoteStorage,
    quoteAnnualSrp: form.quoteAnnualSrp,
  });
  const preview = hostingClientQuoteLines(snapshot);
  const vat = hostingQuoteVatBreakdown(form.quoteAnnualSrp);
  const annualState = annualSrpInputState(form.quoteAnnualSrp);

  const fields: Pick<
    ClientOrderFormState,
    | "quoteDataCenter"
    | "quoteProcessor"
    | "quoteCores"
    | "quoteThreads"
    | "quoteRam"
    | "quoteStorage"
    | "quoteAnnualSrp"
  > = {
    quoteDataCenter: form.quoteDataCenter,
    quoteProcessor: form.quoteProcessor,
    quoteCores: form.quoteCores,
    quoteThreads: form.quoteThreads,
    quoteRam: form.quoteRam,
    quoteStorage: form.quoteStorage,
    quoteAnnualSrp: form.quoteAnnualSrp,
  };

  return (
    <section className={styles.dealClientQuotePanel}>
      <h5 className={styles.dealClientQuoteTitle}>Client quote (PDF / Excel)</h5>
      <p className={styles.dealClientQuoteHint}>
        Fill specs for Finance (kasama sa Send price request). Annual SRP (net) — iwan blank hanggang may price; pag may
        value na, pwede na ang PDF/Excel para sa client (Gross = Net × 1.12).
      </p>
      {awaitingFinancePrice && !form.quoteAnnualSrp.trim() ? (
        <p className={styles.dealClientQuoteAwaiting} role="status">
          No price yet — specs lang muna sa request; client file pag may Annual SRP na.
        </p>
      ) : null}
      {annualState === "invalid" ? (
        <p className={styles.dealClientQuoteAwaiting} role="status">
          Annual SRP must be a number only (e.g. 900 or 10000). Letters like &quot;asa&quot; will not compute Gross /
          Net.
        </p>
      ) : null}

      <div className={styles.dealClientQuoteGrid}>
        <label className={styles.dealPricingRequestField}>
          <span className={styles.dealPricingRequestLabel}>Data Center</span>
          <input
            className={inputClass()}
            value={form.quoteDataCenter}
            onChange={(e) => setField("quoteDataCenter", e.target.value)}
            placeholder="e.g. HiVelocity"
          />
        </label>
        <label className={styles.dealPricingRequestField}>
          <span className={styles.dealPricingRequestLabel}>Processor</span>
          <input
            className={inputClass()}
            value={form.quoteProcessor}
            onChange={(e) => setField("quoteProcessor", e.target.value)}
            placeholder="e.g. 7413 3.6Ghz EPYC AMD"
          />
        </label>
        <label className={styles.dealPricingRequestField}>
          <span className={styles.dealPricingRequestLabel}>Cores</span>
          <input
            className={inputClass()}
            inputMode="numeric"
            value={form.quoteCores}
            onChange={(e) => setField("quoteCores", e.target.value)}
          />
        </label>
        <label className={styles.dealPricingRequestField}>
          <span className={styles.dealPricingRequestLabel}>Threads</span>
          <input
            className={inputClass()}
            inputMode="numeric"
            value={form.quoteThreads}
            onChange={(e) => setField("quoteThreads", e.target.value)}
          />
        </label>
        <label className={styles.dealPricingRequestField}>
          <span className={styles.dealPricingRequestLabel}>RAM</span>
          <input
            className={inputClass()}
            value={form.quoteRam}
            onChange={(e) => setField("quoteRam", e.target.value)}
            placeholder="e.g. 512GB"
          />
        </label>
        <label className={styles.dealPricingRequestField}>
          <span className={styles.dealPricingRequestLabel}>Storage</span>
          <input
            className={inputClass()}
            value={form.quoteStorage}
            onChange={(e) => setField("quoteStorage", e.target.value)}
            placeholder="e.g. 2.0TB NVMe SSD"
          />
        </label>
        <label className={`${styles.dealPricingRequestField} ${styles.dealClientQuoteFieldWide}`}>
          <span className={styles.dealPricingRequestLabel}>Annual SRP (net, excl. VAT) — editable</span>
          <input
            className={inputClass()}
            inputMode="decimal"
            value={form.quoteAnnualSrp}
            onChange={(e) => setField("quoteAnnualSrp", e.target.value)}
            placeholder="e.g. 10000"
          />
        </label>
      </div>

      <div className={styles.dealClientQuotePreview}>
        <div className={styles.dealClientQuotePreviewBrand}>
          <img
            src="/images/webfocus-logo.svg"
            alt="WebFocus Solutions, Inc."
            className={styles.dealClientQuotePreviewLogo}
          />
          <p className={styles.dealClientQuotePreviewTagline}>Your solution in innovative digital transformation</p>
        </div>
        <p className={styles.dealClientQuotePreviewTitle}>Preview (same layout in PDF &amp; Excel)</p>
        <dl className={styles.dealClientQuotePreviewList}>
          <motionlessPreview clientName={clientName} dealName={dealName} />
          {preview.slice(2).map((row) => {
            const display =
              row.label === "Gross Amount"
                ? vat.grossAmount || "—"
                : row.label === "Net of VAT"
                  ? vat.netOfVat || "—"
                  : row.value;
            const money = splitPesoDisplay(display);
            return (
              <div key={row.label} className={styles.dealClientQuotePreviewRow}>
                <dt>{row.label}:</dt>
                <dd>
                  {money.isMoney ? (
                    <span className={styles.dealClientQuoteMoney}>
                      <span className={styles.dealClientQuotePeso} aria-hidden="true">
                        ₱
                      </span>
                      <span className={styles.dealClientQuoteMoneyNum}>{money.amount}</span>
                    </span>
                  ) : (
                    display
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>

      <div className={styles.dealClientQuoteDownloadActions}>
        <button
          type="button"
          className={styles.dealClientQuoteBtnPdf}
          onClick={() => {
            if (annualState === "invalid") {
              toast.error("Enter a valid Annual SRP number before sending a client PDF.");
              return;
            }
            if (annualState === "empty") {
              toast.info("Annual SRP is empty — OK for internal specs; add a number before sending to the client.");
            }
            void downloadHostingClientQuotePdf(clientName, dealName, fields).catch(() => {
              toast.error("Could not generate PDF.");
            });
          }}
        >
          <i className="fa-regular fa-file-pdf" aria-hidden="true" /> Download PDF
        </button>
        <button
          type="button"
          className={styles.dealClientQuoteBtnExcel}
          onClick={() => {
            if (annualState === "invalid") {
              toast.error("Enter a valid Annual SRP number before sending a client Excel.");
              return;
            }
            if (annualState === "empty") {
              toast.info("Annual SRP is empty — OK for internal specs; add a number before sending to the client.");
            }
            void downloadHostingClientQuoteExcel(clientName, dealName, fields).catch(() => {
              toast.error("Could not generate Excel.");
            });
          }}
        >
          <i className="fa-regular fa-file-excel" aria-hidden="true" /> Download Excel
        </button>
      </div>
    </section>
  );
}

function motionlessPreview({ clientName, dealName }: { clientName: string; dealName: string }) {
  return (
    <>
      <div className={styles.dealClientQuotePreviewRow}>
        <dt>Client Name:</dt>
        <dd>{clientName.trim() || "—"}</dd>
      </div>
      <div className={styles.dealClientQuotePreviewRow}>
        <dt>Deal Name:</dt>
        <dd>{dealName.trim() || "—"}</dd>
      </div>
    </>
  );
}
