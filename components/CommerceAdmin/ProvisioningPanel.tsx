import { useEffect, useMemo, useState } from "react";
import {
  addProvisioningAction,
  fetchCommerceAssignableUsers,
  fetchProvisioning,
  markProvisioningActionDone,
  startWebDevCountdown,
  type CommerceAssignableUser,
  type ProvisioningDetail,
} from "@/services/commerceAdminService";
import { provisioningCountdownCopy } from "@/lib/customerPortal/orderHelpers";
import { formatCommerceMoney } from "@/lib/commerceAdmin/mockData";
import { toast } from "@/lib/toast";
import ConfirmModal from "@/components/UI/ConfirmModal";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  salesTransactionId: number;
  focusService?: string | null;
  contextLabel?: string | null;
  onClose: () => void;
  onChanged?: () => void;
};

function formatWhen(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClass(status: string) {
  if (status === "Completed") return styles.badgePaid;
  if (status === "Active") return styles.badgeProvisioning;
  return styles.badgePending;
}

function ReadField({ label, value }: { label: string; value: string }) {
  return (
    <label className={styles.provisionReadField}>
      <span>{label}</span>
      <input value={value || "—"} readOnly />
    </label>
  );
}

function orderStatusClass(status: string) {
  if (status === "Completed") return styles.badgePaid;
  if (status === "Provisioning") return styles.badgeProvisioning;
  return styles.badgePending;
}

export default function ProvisioningPanel({ salesTransactionId, focusService, contextLabel, onClose, onChanged }: Props) {
  const [detail, setDetail] = useState<ProvisioningDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState<CommerceAssignableUser[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(45);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "timeline">("overview");
  const [form, setForm] = useState({ description: "", assignedTo: "", checkpoint: "12" });
  const [pendingConfirm, setPendingConfirm] = useState<
    { kind: "save"; serviceNames: string[] } | { kind: "done"; actionId: number } | null
  >(null);

  useEffect(() => {
    if (!salesTransactionId) return;
    let cancelled = false;
    setLoading(true);
    fetchProvisioning(salesTransactionId)
      .then((data) => {
        if (!cancelled) setDetail(data);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err?.response?.data?.message || "Unable to load provisioning.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetchCommerceAssignableUsers()
      .then((rows) => {
        if (!cancelled) setStaff(Array.isArray(rows) ? rows : []);
      })
      .catch(() => {
        if (!cancelled) setStaff([]);
      });
    return () => {
      cancelled = true;
    };
  }, [salesTransactionId]);

  useEffect(() => {
    if (!salesTransactionId) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [salesTransactionId]);

  const countdown = useMemo(
    () => (detail ? provisioningCountdownCopy({ provisioning: { countdown: detail.countdown } }, now) : null),
    [detail, now],
  );

  const openAssignee = () => {
    const names = detail?.services.map((service) => service.name).filter(Boolean) ?? [];
    const initial = focusService && names.includes(focusService) ? [focusService] : names.slice(0, 1);
    const checkpoint = detail?.services.find((service) => service.name === initial[0])?.checkpointHours ?? 12;
    setSelectedServices(initial);
    setForm({ description: "", assignedTo: "", checkpoint: String(checkpoint) });
    setAssigneeOpen(true);
  };

  const toggleService = (name: string) => {
    setSelectedServices((current) =>
      current.includes(name) ? current.filter((item) => item !== name) : [...current, name],
    );
  };

  const handleStart = async () => {
    try {
      setBusy(true);
      const next = await startWebDevCountdown(salesTransactionId, days);
      setDetail(next);
      toast.success(`WebDev countdown started for ${days} days.`);
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unable to start the WebDev countdown.");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (serviceNames: string[]) => {
    if (serviceNames.length === 0) {
      toast.error("Choose at least one service on this order.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Describe the provisioning action.");
      return;
    }
    try {
      setBusy(true);
      const next = await addProvisioningAction(salesTransactionId, {
        service_names: serviceNames,
        description: form.description.trim(),
        assigned_to: form.assignedTo ? Number(form.assignedTo) : null,
        checkpoint_hours: Number(form.checkpoint) === 24 ? 24 : 12,
      });
      setDetail(next);
      setForm({ description: "", assignedTo: "", checkpoint: form.checkpoint });
      setAssigneeOpen(false);
      toast.success(serviceNames.length === 1 ? "Provisioning action added." : "Provisioning actions added.");
      onChanged?.();
    } catch (err: any) {
      const message = err?.response?.data?.errors?.description?.[0]
        || err?.response?.data?.errors?.service_names?.[0]
        || err?.response?.data?.errors?.service_name?.[0]
        || err?.response?.data?.message
        || "Unable to add the action.";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const requestAdd = () => {
    if (selectedServices.length === 0) {
      toast.error("Choose at least one service on this order.");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Describe the provisioning action.");
      return;
    }
    setPendingConfirm({ kind: "save", serviceNames: selectedServices });
  };

  const handleDone = async (actionId: number) => {
    try {
      setBusy(true);
      const next = await markProvisioningActionDone(actionId);
      setDetail(next);
      toast.success("Action marked done.");
      onChanged?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Unable to mark the action done.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.clientCrmPage}>
      <div className={styles.clientCrmTopBar}>
        <div className={styles.clientCrmTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onClose}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h3 className={styles.panelTitle}>Provisioning</h3>
            <p className={styles.panelSubtitle}>{detail?.order?.client || contextLabel || detail?.transactionNo || "Order"}</p>
          </div>
        </div>
        <div className={styles.provisionTopMeta}>
          {countdown ? (
            <div className={styles.provisionCountdown}>
              <strong>{countdown.headline}</strong>
              <span>{countdown.detail}</span>
            </div>
          ) : null}
          {detail?.canStartWebdev ? (
            <div className={styles.provisionStart}>
              <label className={styles.provisionDays}>
                <span>WebDev days</span>
                <input
                  type="number"
                  min={30}
                  max={90}
                  aria-label="WebDev days"
                  value={days}
                  onChange={(event) => setDays(Number(event.target.value))}
                />
              </label>
              <button type="button" className={styles.primaryBtnSm} disabled={busy} onClick={() => void handleStart()}>
                Start countdown
              </button>
            </div>
          ) : null}
          {detail ? <span className={orderStatusClass(detail.displayStatus)}>{detail.displayStatus}</span> : null}
        </div>
      </div>

      {loading && !detail ? <p className={styles.emptyState}>Loading provisioning…</p> : null}

      {detail ? (
        <>
          <div className={styles.clientCrmTabs} role="tablist" aria-label="Provisioning sections">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "overview"}
              className={`${styles.clientCrmTab}${activeTab === "overview" ? ` ${styles.clientCrmTabActive}` : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              Overview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "timeline"}
              className={`${styles.clientCrmTab}${activeTab === "timeline" ? ` ${styles.clientCrmTabActive}` : ""}`}
              onClick={() => setActiveTab("timeline")}
            >
              Timeline
            </button>
          </div>

          {activeTab === "timeline" ? (
            <section className={styles.clientTimeline}>
              <div className={styles.clientTimelineHead}>
                <h4>Provisioning timeline</h4>
              </div>
              {detail.events.length === 0 ? <p className={styles.panelSubtitle}>No provisioning events yet.</p> : null}
              <ol className={styles.clientTimelineList}>
                {detail.events.map((event) => (
                  <li key={event.id} className={styles.clientTimelineItem}>
                    <div className={styles.clientTimelineDate}>{formatWhen(event.createdAt)}</div>
                    <div className={styles.clientTimelineRow}>
                      <div className={styles.clientTimelineRail}>
                        <span className={styles.clientTimelineDot} />
                      </div>
                      <div className={styles.clientTimelineCard}>
                        <div className={styles.clientTimelineMeta}>{event.actor || "System"}</div>
                        <div className={styles.clientTimelineBody}>
                          <p>{event.summary}</p>
                          {(event.changes ?? []).filter((change) => change.to).map((change) => (
                            <p key={`${event.id}-${change.label}`}>
                              {change.label}: {change.from ? `${change.from} → ` : ""}{change.to}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ) : (
        <div className={styles.provisionMain}>
            {detail.order ? (
              <section className={styles.provisionOrder}>
                <h4>Order Information</h4>
                <div className={styles.provisionOrderGrid}>
                  <ReadField label="Order #" value={detail.order.transactionNo || "—"} />
                  <ReadField label="Invoice" value={detail.order.invoiceId || "—"} />
                  <ReadField label="Client" value={detail.order.client || "—"} />
                  <ReadField label="Email" value={detail.order.email || "—"} />
                  <ReadField label="Service Name" value={detail.services.map((service) => service.name).join(", ") || "—"} />
                  <ReadField label="Plan" value={detail.order.plan || "—"} />
                  <ReadField label="Amount" value={formatCommerceMoney(Number(detail.order.amount ?? 0))} />
                  <ReadField label="Payment Status" value={detail.order.paymentStatus || "—"} />
                  <ReadField label="Date Ordered" value={detail.order.issuedDate || "—"} />
                  <ReadField label="Due Date" value={detail.order.dueDate || "—"} />
                  <ReadField label="Approved" value={formatWhen(detail.order.approvedAt)} />
                </div>
              </section>
            ) : null}
            {detail.orderStatus === "not_started" ? (
              <p className={styles.panelSubtitle}>Approve the order to start provisioning. Actions open after approval.</p>
            ) : null}

            <section className={styles.provisionTableSection}>
              <header>
                <h4>Provisioning actions</h4>
                {detail.canManageActions ? (
                  <button
                    type="button"
                    className={styles.primaryBtnSm}
                    onClick={openAssignee}
                  >
                    Assignee
                  </button>
                ) : null}
              </header>
              <div className={styles.provisionTableWrap}>
                <table className={styles.provisionTable}>
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Description</th>
                      <th>Assigned to</th>
                      <th>Checkpoint</th>
                      <th>Done</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.services.flatMap((service) =>
                      service.actions.length > 0
                        ? service.actions.map((action) => (
                            <tr key={action.id}>
                              <td>{service.name}</td>
                              <td>
                                <strong>{action.description}</strong>
                                {action.completedAt ? <span>Completed {formatWhen(action.completedAt)}</span> : null}
                                {action.validatedAt ? <span>Verified {formatWhen(action.validatedAt)}</span> : null}
                              </td>
                              <td>{action.assignee || "Unassigned"}</td>
                              <td>{action.checkpointHours}h</td>
                              <td>{action.doneAt ? formatWhen(action.doneAt) : "—"}</td>
                              <td>
                                <span className={statusClass(action.status)}>{action.status}</span>
                              </td>
                              <td>
                                {detail.canManageActions && action.statusKey === "pending" ? (
                                  <button
                                    type="button"
                                    className={styles.successBtnSm}
                                    disabled={busy}
                                    onClick={() => setPendingConfirm({ kind: "done", actionId: action.id })}
                                  >
                                    Mark done
                                  </button>
                                ) : null}
                              </td>
                            </tr>
                          ))
                        : [
                            <tr key={`${service.name}-empty`}>
                              <td>{service.name}</td>
                              <td colSpan={6}>No actions yet.</td>
                            </tr>,
                          ],
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          )}
        </>
      ) : null}
      {detail?.canManageActions && assigneeOpen ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={() => setAssigneeOpen(false)}>
          <div className={styles.modalCardWide} onClick={(event) => event.stopPropagation()} role="document">
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Assignee</h3>
                <p className={styles.panelSubtitle}>Assign one or more services on this order to Technical Support.</p>
              </div>
              <button type="button" className={styles.modalCloseBtn} onClick={() => setAssigneeOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className={styles.provisionAdd}>
              <div className={styles.provisionServiceField}>
                <span>Service</span>
                <div className={styles.provisionServicePick}>
                  {detail.services.map((service) => (
                    <label key={service.name}>
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(service.name)}
                        onChange={() => toggleService(service.name)}
                      />
                      {service.name}
                    </label>
                  ))}
                </div>
              </div>
              <label>
                <span>Assigned to</span>
                <select
                  value={form.assignedTo}
                  onChange={(event) => setForm((current) => ({ ...current, assignedTo: event.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {staff.map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Checkpoint</span>
                <select
                  value={form.checkpoint}
                  onChange={(event) => setForm((current) => ({ ...current, checkpoint: event.target.value }))}
                >
                  <option value="12">12-hour checkpoint</option>
                  <option value="24">24-hour checkpoint</option>
                </select>
              </label>
              <label className={styles.provisionAddDescription}>
                <span>Action description</span>
                <textarea
                  rows={3}
                  placeholder="What needs to be done?"
                  value={form.description}
                  onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                />
              </label>
              <div className={styles.provisionAddActions}>
                <button type="button" className={styles.secondaryBtnSm} onClick={() => setAssigneeOpen(false)}>
                  Cancel
                </button>
                <button type="button" className={styles.primaryBtnSm} disabled={busy} onClick={requestAdd}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <ConfirmModal
        show={pendingConfirm?.kind === "save"}
        title="Save this action?"
        message={
          pendingConfirm?.kind === "save" && pendingConfirm.serviceNames.length > 1
            ? `Save this action for ${pendingConfirm.serviceNames.length} services and assign them to the same Technical Support?`
            : "Save this provisioning action now? You can still mark it done later."
        }
        confirmLabel={busy ? "Saving..." : "Yes, save"}
        cancelLabel="Go back"
        danger={false}
        onConfirm={() => {
          if (busy || pendingConfirm?.kind !== "save") return;
          const serviceNames = pendingConfirm.serviceNames;
          setPendingConfirm(null);
          void handleAdd(serviceNames);
        }}
        onCancel={() => {
          if (!busy) setPendingConfirm(null);
        }}
      />
      <ConfirmModal
        show={pendingConfirm?.kind === "done"}
        title="Mark this action as done?"
        message="This records the action as done and starts its checkpoint."
        confirmLabel={busy ? "Saving..." : "Yes, mark done"}
        cancelLabel="Go back"
        danger={false}
        confirmVariant="success"
        accentVariant="success"
        onConfirm={() => {
          if (busy || pendingConfirm?.kind !== "done") return;
          const actionId = pendingConfirm.actionId;
          setPendingConfirm(null);
          void handleDone(actionId);
        }}
        onCancel={() => {
          if (!busy) setPendingConfirm(null);
        }}
      />
    </div>
  );
}
