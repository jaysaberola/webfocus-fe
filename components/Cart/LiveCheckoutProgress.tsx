import styles from "@/styles/liveCheckoutProgress.module.css";

const STEPS = [
  { id: "cart", label: "Cart", icon: "fa-solid fa-check" },
  { id: "details", label: "Details", icon: "fa-solid fa-check" },
  { id: "login", label: "Login", icon: "fa-solid fa-user-check" },
  { id: "agreement", label: "Agreement", icon: "fa-regular fa-file-lines" },
  { id: "payment", label: "Payment", icon: "fa-regular fa-credit-card" },
  { id: "review", label: "Review", icon: "fa-regular fa-clock" },
  { id: "provision", label: "Provision", icon: "fa-solid fa-box" },
] as const;

type StepStatus = "completed" | "current" | "pending";

function getStepStatuses(isLoggedIn: boolean, hasItems: boolean): StepStatus[] {
  if (!hasItems) {
    return ["current", "pending", "pending", "pending", "pending", "pending", "pending"];
  }

  if (!isLoggedIn) {
    return ["completed", "completed", "current", "pending", "pending", "pending", "pending"];
  }

  return ["completed", "completed", "completed", "current", "pending", "pending", "pending"];
}

type Props = {
  isLoggedIn: boolean;
  hasItems: boolean;
};

export default function LiveCheckoutProgress({ isLoggedIn, hasItems }: Props) {
  const statuses = getStepStatuses(isLoggedIn, hasItems);
  const statusHint = isLoggedIn ? "Review agreement next" : "Sign in before payment";

  return (
    <section className={styles.card} aria-label="Live checkout progress">
      <div className={styles.header}>
        <h2 className={styles.title}>Live Checkout Progress</h2>
        <span className={styles.badge}>
          <span className={styles.badgeDot} aria-hidden="true" />
          {statusHint}
        </span>
      </div>

      <div className={styles.track}>
        {STEPS.map((step, index) => {
          const status = statuses[index];

          return (
            <div key={step.id} className={styles.segment}>
              <div className={styles.nodeWrap}>
                <div
                  className={
                    status === "completed"
                      ? styles.nodeCompleted
                      : status === "current"
                        ? styles.nodeCurrent
                        : styles.nodePending
                  }
                >
                  <i className={step.icon} aria-hidden="true" />
                </div>
                <span
                  className={
                    status === "pending" ? styles.nodeLabelPending : styles.nodeLabelActive
                  }
                >
                  {step.label}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  className={
                    status === "completed" ? styles.connectorCompleted : styles.connectorPending
                  }
                  aria-hidden="true"
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
