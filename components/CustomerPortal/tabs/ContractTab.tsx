import styles from "@/styles/customerPortal.module.css";

export default function ContractTab() {
  return (
    <div className={styles.tabStack}>
      <section className={styles.panel}>
        <div className={styles.panelHead}>
          <div>
            <span className={styles.regTag}>SEC Reg. A2001128394</span>
            <h2 className={styles.panelTitle}>Enterprise Service Level Agreement (SLA) &amp; Contract</h2>
          </div>
          <button type="button" className={styles.primaryBtnSm}>
            <i className="fa-solid fa-download" aria-hidden="true" /> PDF Contract
          </button>
        </div>

        <div className={styles.contractBody}>
          <h3 className={styles.contractHeading}>WebFocus Solutions, Inc. Master Service Agreement</h3>
          <p>
            This Enterprise Service Level Agreement governs the provision of low-latency NVMe server co-location,
            cloud virtual machines, and Canvas 7 website framework deployments between WebFocus Solutions, Inc.
            and the authorized client.
          </p>
          <div className={styles.contractGrid}>
            <article className={styles.contractCard}>
              <strong>Uptime Commitment</strong>
              <p>Guaranteed 99.99% network availability with redundant PLDT and Globe fiber backbones.</p>
            </article>
            <article className={styles.contractCard}>
              <strong>Digital Signature Status</strong>
              <p className={styles.verified}>
                <i className="fa-solid fa-circle-check" aria-hidden="true" /> Verified &amp; Active (2026 Term)
              </p>
            </article>
            <article className={styles.contractCard}>
              <strong>Data Security &amp; Compliance</strong>
              <p>ISO-27001 certified McKinley Datacenter with 256-bit AES encryption standards.</p>
            </article>
            <article className={styles.contractCard}>
              <strong>Support Response SLA</strong>
              <p>Tier-1 engineering response within 15 minutes for critical infrastructure tickets.</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
