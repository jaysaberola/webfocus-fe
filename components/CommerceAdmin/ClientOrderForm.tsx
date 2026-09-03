import { Children, isValidElement, useEffect, useMemo, useState } from "react";
import OrderProductDetailsPanel from "@/components/CommerceAdmin/OrderProductDetailsPanel";
import { buildClientDealRows, formatDealAmount, transactionDealName, transactionDomainName } from "@/lib/commerceAdmin/clientDealHelpers";
import {
  AUTOMATIC_STAGE_OPTIONS,
  buildDealNotes,
  clientOrderFormFromTransaction,
  CLIENT_STATUS_OPTIONS,
  COLLECTION_NOTE_OPTIONS,
  CONTRACT_STATUS_OPTIONS,
  deriveContractFields,
  deriveInvoiceFields,
  DEAL_NAME_OPTIONS,
  parseDealMeta,
  DEAL_STAGE_OPTIONS,
  DEAL_STATUS_OPTIONS,
  DOMAIN_REGISTRAR_OPTIONS,
  DOMAIN_TYPE_OPTIONS,
  emptyClientOrderForm,
  INVOICE_STATUS_OPTIONS,
  mergeDealMetaIntoNotes,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  PAYMENT_TERMS_OPTIONS,
  PRODUCT_STATUS_OPTIONS,
  probabilityForStage,
  subjectForProductName,
  SALES_STATUS_OPTIONS,
  SUBJECT_OPTIONS,
  toApiOrderStatus,
  toApiPaymentStatus,
  validateClientOrderForm,
  type ClientOrderFormState,
} from "@/lib/commerceAdmin/clientOrderFormHelpers";
import { clientDisplayName, assignablePersonLabel, resolveAssignableSelectValue, withCurrentAssignablePerson } from "@/lib/commerceAdmin/clientHelpers";
import { isWebDesignPlan, looksLikeDomain } from "@/lib/serviceCategory";
import {
  isWebDesignTransaction,
  WEB_DESIGN_PENDING_QUOTATION_MARKER,
} from "@/lib/commerceAdmin/webDesignPricing";
import { readStoredCurrentUser } from "@/lib/currentUser";
import { toast } from "@/lib/toast";
import {
  fetchCommerceAssignableUsers,
  assignCommerceSalesTransaction,
  assignCommerceCustomerOwner,
  fetchNextRotatingClientOwner,
  type CommerceAssignableUser,
} from "@/services/commerceAdminService";
import { getCustomers, getCustomer, updateCustomer, type CustomerRow } from "@/services/customerService";
import { getServices } from "@/services/serviceService";
import { createSalesTransaction, updateSalesTransaction, type SalesTransaction } from "@/services/salesTransactionService";
import styles from "@/styles/commerceAdmin.module.css";

type Props = {
  defaultCustomerId?: number | null;
  transaction?: SalesTransaction | null;
  pageTitle?: string;
  pageSubtitle?: string;
  onBack: () => void;
  onSaved: (options?: { andNew?: boolean }) => void;
};

type AutoDateKey =
  | "invoiceSentDate"
  | "invoiceReceivedDate"
  | "contractSentDate"
  | "contractServiceStartDate"
  | "contractServiceEndDate";

function savedAutoDateKeys(notes?: string | null): AutoDateKey[] {
  const meta = parseDealMeta(notes);
  const keys: AutoDateKey[] = [
    "invoiceSentDate",
    "invoiceReceivedDate",
    "contractSentDate",
    "contractServiceStartDate",
    "contractServiceEndDate",
  ];
  return keys.filter((key) => Boolean(String(meta?.[key] ?? "").trim()));
}

function withExtraOption(options: readonly string[], value?: string | null) {
  const text = String(value ?? "").trim();
  if (!text || options.some((option) => option === text)) return options;
  return [text, ...options];
}

function Field({
  label,
  hint,
  icon,
  iconCheck,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  icon?: string;
  iconCheck?: boolean;
  children: React.ReactNode;
}) {
  const childArray = Children.toArray(children);
  const isSelect = childArray.some(
    (child) => isValidElement(child) && child.type === "select",
  );
  const isDate = childArray.some(
    (child) =>
      isValidElement(child) &&
      child.type === "input" &&
      (child.props as { type?: string }).type === "date",
  );
  const isFile = childArray.some((child) => {
    if (!isValidElement(child)) return false;
    if (child.type === "input" && (child.props as { type?: string }).type === "file") return true;
    const props = child.props as { "data-file-control"?: boolean; fileControl?: boolean };
    return props["data-file-control"] === true || props.fileControl === true;
  });
  const controlClass = [
    styles.clientOrderControl,
    isSelect ? styles.clientOrderControlSelect : "",
    icon ? styles.clientOrderControlHasIcon : "",
    iconCheck ? styles.clientOrderControlLookup : "",
    isFile ? styles.clientOrderControlFile : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={styles.clientOrderField}>
      <span className={styles.clientOrderLabel}>
        <span className={styles.clientOrderLabelText}>{label}</span>
        {hint ? (
          <span className={styles.clientCrmHint} title={hint} aria-hidden="true">
            i
          </span>
        ) : null}
      </span>
      <div className={controlClass}>
        {children}
        {isFile ? null : !isDate ? (
          <span className={styles.clientOrderAdornment} aria-hidden="true">
            {icon ? <i className={icon} /> : null}
            {iconCheck ? <i className="fa-solid fa-check" /> : null}
            {isSelect ? <i className="fa-solid fa-chevron-down" /> : null}
          </span>
        ) : null}
      </div>
    </label>
  );
}

function inputClass(required?: boolean, extra?: string) {
  return [styles.clientCrmInput, required ? styles.clientCrmInputRequired : "", extra]
    .filter(Boolean)
    .join(" ");
}

function catalogPriceForProduct(services: any[], productName: string) {
  const needle = productName.trim().toLowerCase();
  if (!needle) return null;
  const match =
    services.find((service) => String(service.name ?? service.title ?? "").trim().toLowerCase() === needle) ??
    services.find((service) => String(service.name ?? service.title ?? "").toLowerCase().includes(needle));
  if (!match) return null;
  const price = Number(match.price ?? 0);
  return Number.isFinite(price) ? price : null;
}

function FilePick({
  fileName,
  accept,
  onChange,
}: {
  fileName?: string;
  accept?: string;
  onChange: (file: File | null) => void;
  fileControl?: boolean;
}) {
  return (
    <label className={styles.clientOrderFilePick} data-file-control="true">
      <span className={styles.clientOrderFilePickLabel}>{fileName || "Choose file"}</span>
      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

function rotatingOwnerKind(dealName?: string, dealType?: string) {
  return isWebDesignPlan(dealName, dealType) ? ("web_design" as const) : undefined;
}

export default function ClientOrderForm({
  defaultCustomerId = null,
  transaction = null,
  pageTitle,
  pageSubtitle = "Deals",
  onBack,
  onSaved,
}: Props) {
  const isEditing = Boolean(transaction);
  const [form, setForm] = useState<ClientOrderFormState>(emptyClientOrderForm());
  const [owners, setOwners] = useState<CommerceAssignableUser[]>([]);
  const [staffUsers, setStaffUsers] = useState<CommerceAssignableUser[]>([]);
  const [clients, setClients] = useState<CustomerRow[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [manualDateFields, setManualDateFields] = useState<Set<AutoDateKey>>(() => new Set());

  const setField = <K extends keyof ClientOrderFormState>(key: K, value: ClientOrderFormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const setDateField = (key: AutoDateKey, value: string) => {
    setManualDateFields((current) => {
      const next = new Set(current);
      next.add(key);
      return next;
    });
    setField(key, value);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      fetchCommerceAssignableUsers({ for: "client_owner" }).catch(() => [] as CommerceAssignableUser[]),
      fetchCommerceAssignableUsers({ for: "billing_in_charge" }).catch(() => [] as CommerceAssignableUser[]),
      getCustomers({ per_page: 200 }, { silent: true }).catch(() => ({ data: [] })),
      getServices({ per_page: 200, status: "active" }, { silent: true }).catch(() => ({ data: [] })),
      transaction?.customer_id
        ? getCustomer(transaction.customer_id, { silent: true }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([clientOwners, assignable, clientRes, serviceRes, clientDetail]) => {
        if (cancelled) return;
        const nextOwners = Array.isArray(clientOwners) ? clientOwners : [];
        const nextStaff = Array.isArray(assignable) ? assignable : [];
        const nextClients = Array.isArray(clientRes?.data) ? clientRes.data : [];
        const nextServices = Array.isArray(serviceRes?.data) ? serviceRes.data : [];
        const detailClient = clientDetail as CustomerRow | null;
        const mergedClients =
          detailClient && !nextClients.some((row) => Number(row.id) === Number(detailClient.id))
            ? [detailClient, ...nextClients]
            : nextClients;
        setOwners(nextOwners);
        setStaffUsers(nextStaff);
        setClients(mergedClients);
        setServices(nextServices);

        if (transaction) {
          setManualDateFields(new Set(savedAutoDateKeys(transaction.notes)));
          const nextForm = clientOrderFormFromTransaction(transaction);
          const listedClient = mergedClients.find(
            (row) => Number(row.id) === Number(transaction.customer_id),
          );
          const linkedClient = listedClient || detailClient
            ? {
                ...(listedClient ?? {}),
                ...(detailClient ?? {}),
                owner: detailClient?.owner ?? listedClient?.owner,
                owner_name: detailClient?.owner_name ?? listedClient?.owner_name,
                owner_id: detailClient?.owner_id ?? listedClient?.owner_id,
                billing_in_charge:
                  detailClient?.billing_in_charge ?? listedClient?.billing_in_charge,
                contact_person: detailClient?.contact_person ?? listedClient?.contact_person,
              } as CustomerRow
            : null;
          const clientOwnerId = linkedClient?.owner_id ? String(linkedClient.owner_id) : "";
          const billingFromClient = String(linkedClient?.billing_in_charge ?? "").trim();
          const billingInCharge = resolveAssignableSelectValue(
            billingFromClient || nextForm.billingInCharge,
            nextStaff,
          );
          const resolvedDealName = transactionDealName(transaction);
          const resolvedDomain = transactionDomainName(transaction);
          setForm({
            ...nextForm,
            dealName:
              resolvedDealName && resolvedDealName !== "—"
                ? resolvedDealName
                : nextForm.dealName,
            domainName:
              nextForm.domainName ||
              (resolvedDomain && resolvedDomain !== "—" ? resolvedDomain : ""),
            domainType:
              nextForm.domainType ||
              (DOMAIN_TYPE_OPTIONS.includes(resolvedDealName as (typeof DOMAIN_TYPE_OPTIONS)[number])
                ? resolvedDealName
                : ""),
            productCategory:
              nextForm.productCategory ||
              (looksLikeDomain(nextForm.dealName) ? "Domain Registration" : nextForm.productCategory),
            dealOwnerId: transaction.client_owner_id
              ? String(transaction.client_owner_id)
              : clientOwnerId,
            clientId: transaction.customer_id ? String(transaction.customer_id) : nextForm.clientId,
            billingInCharge,
            contactName: nextForm.contactName || String(linkedClient?.contact_person ?? ""),
          });
          return;
        }

        const currentUser = readStoredCurrentUser();
        const defaultOwner =
          nextOwners.find((owner) => owner.id === currentUser?.id) ?? nextOwners[0];
        const defaultClient = defaultCustomerId
          ? nextClients.find((client) => Number(client.id) === Number(defaultCustomerId))
          : null;
        const fallbackOwnerId = defaultClient?.owner_id
          ? String(defaultClient.owner_id)
          : defaultOwner
            ? String(defaultOwner.id)
            : "";

        const applyCreateForm = (dealOwnerId: string) => {
          if (cancelled) return;
          setManualDateFields(new Set());
          setForm(
            emptyClientOrderForm({
              dealOwnerId,
              clientId: defaultClient ? String(defaultClient.id) : "",
              contactName: String(defaultClient?.contact_person ?? ""),
              billingInCharge: String(defaultClient?.billing_in_charge ?? "").trim(),
            }),
          );
        };

        if (!defaultClient?.id) {
          applyCreateForm(fallbackOwnerId);
          return;
        }

        return fetchNextRotatingClientOwner(Number(defaultClient.id))
          .then((rotating) => applyCreateForm(rotating?.id ? String(rotating.id) : fallbackOwnerId))
          .catch(() => applyCreateForm(fallbackOwnerId));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [defaultCustomerId, transaction]);

  const selectedClient = clients.find((client) => String(client.id) === form.clientId);
  const isWebDesignDeal =
    isWebDesignPlan(form.dealName, form.dealSubType || form.dealType) ||
    Boolean(transaction && isWebDesignTransaction(transaction));

  const applyRotatingOwner = (clientId: string, dealName: string, dealType?: string) => {
    if (isEditing || !clientId) return;
    const kind = rotatingOwnerKind(dealName, dealType);
    void fetchNextRotatingClientOwner(Number(clientId), kind ? { kind } : undefined)
      .then((rotating) => {
        if (!rotating?.id) return;
        setForm((current) =>
          current.clientId === clientId ? { ...current, dealOwnerId: String(rotating.id) } : current,
        );
      })
      .catch(() => undefined);
  };

  const ownerOptions = useMemo(() => {
    let list = withCurrentAssignablePerson(owners, null);
    if (selectedClient?.owner_id) {
      list = withCurrentAssignablePerson(list, {
        id: Number(selectedClient.owner_id),
        name: selectedClient.owner?.name || selectedClient.owner_name,
        email: selectedClient.owner?.email,
      });
    }
    if (transaction?.client_owner) {
      list = withCurrentAssignablePerson(list, {
        id: Number(transaction.client_owner.id),
        name:
          `${transaction.client_owner.fname || ""} ${transaction.client_owner.lname || ""}`.trim() ||
          transaction.client_owner.email,
        email: transaction.client_owner.email,
      });
    }
    if (
      transaction?.user &&
      !(selectedClient && Number(transaction.user.id) === Number(selectedClient.id))
    ) {
      list = withCurrentAssignablePerson(list, {
        id: Number(transaction.user.id),
        name:
          `${transaction.user.fname || ""} ${transaction.user.lname || ""}`.trim() ||
          transaction.user.email,
        email: transaction.user.email,
      });
    }
    if (form.dealOwnerId) {
      list = withCurrentAssignablePerson(list, { id: Number(form.dealOwnerId) });
    }
    return list;
  }, [owners, selectedClient, transaction, form.dealOwnerId]);

  const billingOfficers = useMemo(() => {
    const officers = staffUsers.filter((user) => user.name || user.email);
    const selected = resolveAssignableSelectValue(form.billingInCharge, officers);
    return withCurrentAssignablePerson(officers, selected ? { name: selected } : null);
  }, [staffUsers, form.billingInCharge]);

  const billingSelectValue = resolveAssignableSelectValue(form.billingInCharge, billingOfficers);

  const productDeal = useMemo(() => {
    if (!transaction) return null;
    const client =
      selectedClient ??
      clients.find((row) => Number(row.id) === Number(transaction.customer_id)) ??
      ({
        id: Number(transaction.customer_id ?? 0),
        company: transaction.customer_name ?? "",
        email: transaction.customer_email ?? "",
      } as CustomerRow);
    const rows = buildClientDealRows(client, [transaction], services);
    return rows.find((row) => row.dealName === form.dealName) ?? rows[0] ?? null;
  }, [transaction, selectedClient, clients, services, form.dealName]);

  useEffect(() => {
    if (isEditing) return;
    const catalogName = form.dealName || form.productName;
    if (!catalogName) return;
    const price = catalogPriceForProduct(services, catalogName);
    setForm((current) => ({
      ...current,
      expectedRevenue: price != null ? String(price) : current.expectedRevenue || "0",
    }));
  }, [form.dealName, form.productName, services, isEditing]);

  useEffect(() => {
    const next = deriveInvoiceFields(form, transaction);
    setForm((current) => {
      const invoiceSentDate = manualDateFields.has("invoiceSentDate")
        ? current.invoiceSentDate
        : next.invoiceSentDate;
      const invoiceReceivedDate = manualDateFields.has("invoiceReceivedDate")
        ? current.invoiceReceivedDate
        : next.invoiceReceivedDate;
      const invoiceStatus = invoiceReceivedDate
        ? "Received by Client"
        : invoiceSentDate
          ? "Sent to Client"
          : "";
      if (
        current.invoiceStatus === invoiceStatus &&
        current.invoiceSentDate === invoiceSentDate &&
        current.invoiceReceivedDate === invoiceReceivedDate
      ) {
        return current;
      }
      return { ...current, invoiceStatus, invoiceSentDate, invoiceReceivedDate };
    });
  }, [
    form.paymentStatus,
    form.closingDate,
    form.stage,
    manualDateFields,
    transaction,
  ]);

  useEffect(() => {
    const next = deriveContractFields(form, transaction);
    setForm((current) => {
      const contractSentDate = manualDateFields.has("contractSentDate")
        ? current.contractSentDate
        : next.contractSentDate;
      const contractServiceStartDate = manualDateFields.has("contractServiceStartDate")
        ? current.contractServiceStartDate
        : next.contractServiceStartDate;
      const contractServiceEndDate = manualDateFields.has("contractServiceEndDate")
        ? current.contractServiceEndDate
        : next.contractServiceEndDate;
      if (
        current.contractStatus === next.contractStatus &&
        current.contractSentDate === contractSentDate &&
        current.contractServiceStartDate === contractServiceStartDate &&
        current.contractServiceEndDate === contractServiceEndDate
      ) {
        return current;
      }
      return {
        ...current,
        contractStatus: next.contractStatus,
        contractSentDate,
        contractServiceStartDate,
        contractServiceEndDate,
      };
    });
  }, [
    form.dealStatus,
    form.salesStatus,
    form.paymentStatus,
    form.dealSubType,
    form.stage,
    form.contractFileName,
    form.proposalConformeName,
    form.cancellationDocumentName,
    form.invoiceSentDate,
    form.invoiceStatus,
    form.closingDate,
    form.paymentTerms,
    form.domainSubscriptionStartDate,
    form.domainSubscriptionEndDate,
    form.domainRegistrationStartDate,
    form.domainRegistrationExpirationDate,
    manualDateFields,
    transaction,
  ]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find((row) => String(row.id) === clientId);
    setForm((current) => ({
      ...current,
      clientId,
      contactName: String(client?.contact_person ?? ""),
      dealOwnerId: isWebDesignDeal
        ? current.dealOwnerId
        : client?.owner_id
          ? String(client.owner_id)
          : "",
      billingInCharge: String(client?.billing_in_charge ?? "").trim(),
    }));
    applyRotatingOwner(clientId, form.dealName, form.dealSubType || form.dealType);
  };

  const handleDealNameChange = (dealName: string) => {
    const domainType = DOMAIN_TYPE_OPTIONS.includes(dealName as (typeof DOMAIN_TYPE_OPTIONS)[number])
      ? dealName
      : undefined;
    setForm((current) => ({
      ...current,
      dealName,
      productName: dealName,
      productCategory: current.productCategory || subjectForProductName(dealName),
      domainType: current.domainType || domainType || "",
    }));
    applyRotatingOwner(form.clientId, dealName, form.dealSubType || form.dealType);
  };

  const handleCategoryChange = (category: string) => {
    setForm((current) => ({
      ...current,
      productCategory: category,
    }));
  };

  const handleStageChange = (stage: string) => {
    setForm((current) => ({
      ...current,
      stage,
      probability: probabilityForStage(stage),
    }));
  };

  const blankDealForm = () => {
    const currentUser = readStoredCurrentUser();
    const defaultOwner = owners.find((owner) => owner.id === currentUser?.id) ?? owners[0];
    const defaultClient = defaultCustomerId
      ? clients.find((client) => Number(client.id) === Number(defaultCustomerId))
      : null;
    return emptyClientOrderForm({
      dealOwnerId: defaultClient?.owner_id
        ? String(defaultClient.owner_id)
        : defaultOwner
          ? String(defaultOwner.id)
          : "",
      clientId: defaultClient ? String(defaultClient.id) : "",
      contactName: String(defaultClient?.contact_person ?? ""),
      billingInCharge: String(defaultClient?.billing_in_charge ?? "").trim(),
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await saveDeal(false);
  };

  const saveDeal = async (andNew: boolean) => {
    const validationError = validateClientOrderForm(form, { requireCrmFields: !isEditing });
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const clientId = Number(form.clientId);
    if (!clientId || !form.dealName) {
      toast.error("Please select a client and deal name.");
      return;
    }

    const clientName = selectedClient
      ? clientDisplayName(selectedClient)
      : String(transaction?.customer_name ?? "").trim();
    const clientEmail = selectedClient?.email ?? transaction?.customer_email ?? "";
    const price = Number(form.expectedRevenue || 0);

    setSubmitting(true);
    try {
      const ownerId = Number(form.dealOwnerId);
      if (transaction) {
        await updateSalesTransaction(transaction.id, {
          customer_id: clientId,
          customer_name: clientName || transaction.customer_name,
          customer_email: clientEmail,
          payment_status: toApiPaymentStatus(form.paymentStatus) || transaction.payment_status,
          order_status: toApiOrderStatus(form.salesStatus) || transaction.order_status,
          notes: mergeDealMetaIntoNotes(transaction.notes, form),
          transacted_at: form.closingDate || transaction.transacted_at,
          client_owner_id: ownerId || null,
        });

        if (ownerId && !isWebDesignDeal) {
          try {
            await assignCommerceCustomerOwner(clientId, ownerId);
          } catch {
            // Client owner is shown from the client record even if this update is skipped.
          }
          if (ownerId !== Number(transaction.user_id || 0)) {
            try {
              await assignCommerceSalesTransaction(transaction.id, ownerId);
            } catch {
              // Deal is saved even if assignment is skipped.
            }
          }
        } else if (ownerId && isWebDesignDeal && ownerId !== Number(transaction.user_id || 0)) {
          try {
            await assignCommerceSalesTransaction(transaction.id, ownerId);
          } catch {
            // Deal is saved even if assignment is skipped.
          }
        }
        if (form.billingInCharge && clientEmail) {
          try {
            await updateCustomer(clientId, {
              email: clientEmail,
              billing_in_charge: form.billingInCharge,
            });
          } catch {
            // Billing-in-Charge still displays from the client record.
          }
        }

        toast.success("Deal information saved.");
        if (andNew) {
          onSaved({ andNew: true });
          return;
        }
        onSaved();
        return;
      }

      const created = await createSalesTransaction({
        customer_id: clientId,
        customer_name: clientName,
        customer_email: clientEmail,
        client_owner_id: ownerId || undefined,
        subtotal: price,
        discount_total: 0,
        tax_total: 0,
        shipping_total: 0,
        grand_total: price,
        payment_status: toApiPaymentStatus(form.paymentStatus) || "pending",
        order_status: toApiOrderStatus(form.salesStatus) || "pending",
        notes: isWebDesignDeal
          ? `${WEB_DESIGN_PENDING_QUOTATION_MARKER}\n${buildDealNotes(form)}`
          : buildDealNotes(form),
        transacted_at: form.closingDate || undefined,
        items: [
          {
            name: form.dealName || form.productName,
            item_type: isWebDesignDeal
              ? "web_design"
              : form.dealSubType || form.dealType || "service",
            price,
            quantity: 1,
            total_price: price,
          },
        ],
      });

      const transactionId = Number(created?.data?.id ?? created?.id);
      if (ownerId && !isWebDesignDeal) {
        try {
          await assignCommerceCustomerOwner(clientId, ownerId);
        } catch {
          // Client owner is shown from the client record even if this update is skipped.
        }
      }
      if (form.billingInCharge && clientEmail) {
        try {
          await updateCustomer(clientId, {
            email: clientEmail,
            billing_in_charge: form.billingInCharge,
          });
        } catch {
          // Billing-in-Charge still displays from the client record.
        }
      }
      if (transactionId && ownerId && !isWebDesignDeal) {
        try {
          await assignCommerceSalesTransaction(transactionId, ownerId);
        } catch {
          // Order is saved even if assignment is skipped.
        }
      }

      toast.success("Client order created successfully.");
      onSaved({ andNew });
      if (andNew) {
        setManualDateFields(new Set());
        setForm(blankDealForm());
        return;
      }
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          (isEditing ? "Failed to save deal information." : "Failed to create client order."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const headerTitle = useMemo(() => {
    if (!isEditing) return pageTitle || "Create Deal";
    const formName = String(form.dealName || "").trim();
    const resolved = transaction ? transactionDealName(transaction) : "";
    const dealName = looksLikeDomain(formName)
      ? resolved && resolved !== "—"
        ? resolved
        : formName
      : formName || resolved || "Deal Info";
    const fromForm = Number(form.expectedRevenue);
    const amount =
      Number.isFinite(fromForm) && String(form.expectedRevenue ?? "").trim() !== ""
        ? fromForm
        : Number(transaction?.grand_total ?? 0);
    return `${dealName} - ${formatDealAmount(Number.isFinite(amount) ? amount : 0)}`;
  }, [isEditing, pageTitle, form.dealName, form.expectedRevenue, transaction]);

  if (loading) {
    return <p className={styles.emptyState}>Loading order form...</p>;
  }

  return (
    <form className={styles.clientCrmPage} onSubmit={handleSubmit}>
      <div className={styles.clientCrmTopBar}>
        <div className={styles.clientCrmTitleBlock}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack}>
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back
          </button>
          <div>
            <h3 className={styles.panelTitle}>{headerTitle}</h3>
            <p className={styles.panelSubtitle}>{pageSubtitle}</p>
          </div>
        </div>
        <div className={styles.clientCrmActions}>
          <button type="button" className={styles.secondaryBtnSm} onClick={onBack} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.secondaryBtnSm}
            onClick={() => void saveDeal(true)}
            disabled={submitting}
          >
            Save and New
          </button>
          <button type="submit" className={styles.primaryBtnSm} disabled={submitting}>
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Deal Information</h4>
        <div className={styles.clientOrderGrid}>
            <Field
              label="Client Owner"
              hint={
                isWebDesignDeal
                  ? "New web design orders alternate between Myrna Glorioso and Michelle Durian"
                  : "New orders alternate between Myrna Glorioso and Michelle Durian"
              }
              icon="fa-solid fa-user"
            >
              <select
                className={inputClass()}
                value={form.dealOwnerId}
                onChange={(e) => setField("dealOwnerId", e.target.value)}
              >
                <option value="">-None-</option>
                {ownerOptions.map((owner) => (
                  <option key={owner.id} value={String(owner.id)}>
                    {assignablePersonLabel(owner) || "Current owner"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Billing-in-Charge" hint="Person responsible for billing">
              <select
                className={inputClass()}
                value={billingSelectValue}
                onChange={(e) => setField("billingInCharge", e.target.value)}
              >
                <option value="">-None-</option>
                {billingOfficers.map((owner) => (
                  <option key={`bill-${owner.id}-${assignablePersonLabel(owner)}`} value={assignablePersonLabel(owner)}>
                    {assignablePersonLabel(owner)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Campaign Source" hint="Where this deal originated" icon="fa-solid fa-bullhorn">
              <input
                className={inputClass()}
                value={form.campaignSource}
                onChange={(e) => setField("campaignSource", e.target.value)}
              />
            </Field>
            <Field label="Deal Status" hint="Overall deal state">
              <select
                className={inputClass()}
                value={form.dealStatus}
                onChange={(e) => setField("dealStatus", e.target.value)}
              >
                <option value="">-None-</option>
                {DEAL_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Probability (%)" hint="Likelihood this deal will close">
              <input
                className={inputClass()}
                type="number"
                min="0"
                max="100"
                value={form.probability}
                onChange={(e) => setField("probability", e.target.value)}
              />
            </Field>
            <Field label="Payment Terms" hint="When payment is due">
              <select
                className={inputClass()}
                value={form.paymentTerms}
                onChange={(e) => setField("paymentTerms", e.target.value)}
              >
                <option value="">-None-</option>
                {PAYMENT_TERMS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Expected Revenue" hint="Auto from the selected product price" icon="fa-solid fa-lock">
              <span className={styles.clientCrmPesoPrefix}>₱</span>
              <input
                className={inputClass(false, styles.clientCrmPesoInput)}
                type="number"
                min="0"
                step="0.01"
                value={form.expectedRevenue}
                readOnly
              />
            </Field>
            <Field label="Payment Method" hint="How the client will pay">
              <select
                className={inputClass()}
                value={form.paymentMethod}
                onChange={(e) => setField("paymentMethod", e.target.value)}
              >
                <option value="">-None-</option>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Stage" required hint="Pipeline stage for this deal">
              <select
                className={inputClass(true)}
                value={form.stage}
                onChange={(e) => handleStageChange(e.target.value)}
                required
              >
                <option value="">-None-</option>
                <optgroup label="Manual Create Status">
                  {DEAL_STAGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Automatic Status: WebOrder">
                  {AUTOMATIC_STAGE_OPTIONS.map((option) => (
                    <option key={option} value={option} disabled>
                      {option}
                    </option>
                  ))}
                </optgroup>
              </select>
            </Field>
            <Field label="Payment Status" hint="Current payment state">
              <select
                className={inputClass()}
                value={form.paymentStatus}
                onChange={(e) => setField("paymentStatus", e.target.value)}
              >
                <option value="">-None-</option>
                {withExtraOption(PAYMENT_STATUS_OPTIONS, form.paymentStatus).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Closing Date" hint="Expected close date">
              <input
                className={inputClass()}
                type="date"
                value={form.closingDate}
                onChange={(e) => setField("closingDate", e.target.value)}
              />
            </Field>
            <Field
              label="Invoice Status"
              hint="Automatically set when the invoice is issued or the client receives it"
              icon="fa-solid fa-lock"
            >
              <select className={inputClass()} value={form.invoiceStatus} disabled>
                <option value="">-None-</option>
                {INVOICE_STATUS_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Deal Name" required hint="Select the deal name">
              <select
                className={inputClass(true)}
                value={form.dealName}
                onChange={(e) => handleDealNameChange(e.target.value)}
                required
              >
                <option value="">-None-</option>
                {withExtraOption(DEAL_NAME_OPTIONS, form.dealName).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Invoice Sent Date"
              hint="Auto-filled from the invoice issue date. You can change it if needed."
            >
              <input
                className={inputClass()}
                type="date"
                value={form.invoiceSentDate}
                onChange={(e) => setDateField("invoiceSentDate", e.target.value)}
              />
            </Field>
            <Field
              label="Client Name"
              required
              hint="Client this order belongs to"
              icon="fa-solid fa-file"
              iconCheck
            >
              <select
                className={inputClass(true)}
                value={form.clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                required
              >
                <option value="">-None-</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {clientDisplayName(client)}
                  </option>
                ))}
                {transaction?.customer_id &&
                !clients.some((client) => Number(client.id) === Number(transaction.customer_id)) ? (
                  <option value={String(transaction.customer_id)}>
                    {transaction.customer_name || `Client #${transaction.customer_id}`}
                  </option>
                ) : null}
              </select>
            </Field>
            <Field
              label="Invoice Received Date"
              hint="Auto-filled when the invoice is received. You can change it if needed."
            >
              <input
                className={inputClass()}
                type="date"
                value={form.invoiceReceivedDate}
                onChange={(e) => setDateField("invoiceReceivedDate", e.target.value)}
              />
            </Field>
            <Field label="Contact Name" hint="Billing or signing contact" icon="fa-solid fa-address-card">
              <input
                className={inputClass()}
                value={form.contactName}
                onChange={(e) => setField("contactName", e.target.value)}
              />
            </Field>
            <Field label="Payment Commitment Date">
              <input
                className={inputClass()}
                type="date"
                value={form.paymentCommitmentDate}
                onChange={(e) => setField("paymentCommitmentDate", e.target.value)}
              />
            </Field>
            <Field label="Client Status" required={!isEditing} hint="Deal type for this client">
              <select
                className={inputClass(!isEditing)}
                value={form.dealType}
                onChange={(e) => setField("dealType", e.target.value)}
                required={!isEditing}
              >
                <option value="">-None-</option>
                {withExtraOption(CLIENT_STATUS_OPTIONS, form.dealType).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Collection Note" hint="Collection follow-up note">
              <select
                className={inputClass()}
                value={form.collectionNote}
                onChange={(e) => setField("collectionNote", e.target.value)}
              >
                <option value="">-None-</option>
                {COLLECTION_NOTE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Product Status" required={!isEditing} hint="Deal sub-type for this order">
              <select
                className={inputClass(!isEditing)}
                value={form.dealSubType}
                onChange={(e) => setField("dealSubType", e.target.value)}
                required={!isEditing}
              >
                <option value="">-None-</option>
                {withExtraOption(PRODUCT_STATUS_OPTIONS, form.dealSubType).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Product Category" required={!isEditing} hint="Subject / product category for this deal">
              <select
                className={inputClass(!isEditing)}
                value={form.productCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                required={!isEditing}
              >
                <option value="">-None-</option>
                {withExtraOption(SUBJECT_OPTIONS, form.productCategory).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Sales Status" required={!isEditing} hint="Current sales progress">
              <select
                className={inputClass(!isEditing)}
                value={form.salesStatus}
                onChange={(e) => setField("salesStatus", e.target.value)}
                required={!isEditing}
              >
                <option value="">-None-</option>
                {withExtraOption(SALES_STATUS_OPTIONS, form.salesStatus).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Status Trigger Date" hint="Date this status took effect">
              <input
                className={inputClass()}
                type="date"
                value={form.statusTriggerDate}
                onChange={(e) => setField("statusTriggerDate", e.target.value)}
              />
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="JO Number" hint="Job order number if already issued">
              <input
                className={inputClass()}
                value={form.joNumber}
                onChange={(e) => setField("joNumber", e.target.value)}
              />
            </Field>
        </div>
      </section>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Domain Registration</h4>
        <div className={styles.clientOrderGrid}>
          <Field label="Domain Name" hint="Registered domain for this deal">
            <input
              className={inputClass()}
              value={form.domainName}
              onChange={(e) => setField("domainName", e.target.value)}
              placeholder="example.com"
            />
          </Field>
          <Field label="Domain Registrar" hint="Registrar used for this domain">
            <select
              className={inputClass()}
              value={form.domainRegistrar}
              onChange={(e) => setField("domainRegistrar", e.target.value)}
            >
              <option value="">-None-</option>
              {withExtraOption(DOMAIN_REGISTRAR_OPTIONS, form.domainRegistrar).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Domain Type" hint="Type of domain registration">
            <select
              className={inputClass()}
              value={form.domainType}
              onChange={(e) => setField("domainType", e.target.value)}
            >
              <option value="">-None-</option>
              {withExtraOption(DOMAIN_TYPE_OPTIONS, form.domainType).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Domain Registration Start Date" hint="When domain registration started">
            <input
              className={inputClass()}
              type="date"
              value={form.domainRegistrationStartDate}
              onChange={(e) => setField("domainRegistrationStartDate", e.target.value)}
            />
          </Field>
          <Field label="Domain Subscription Start Date" hint="When the domain subscription starts">
            <input
              className={inputClass()}
              type="date"
              value={form.domainSubscriptionStartDate}
              onChange={(e) => setField("domainSubscriptionStartDate", e.target.value)}
            />
          </Field>
          <Field label="Domain Registration Expiration Date" hint="When domain registration expires">
            <input
              className={inputClass()}
              type="date"
              value={form.domainRegistrationExpirationDate}
              onChange={(e) => setField("domainRegistrationExpirationDate", e.target.value)}
            />
          </Field>
          <Field label="Domain Subscription End Date" hint="When the domain subscription ends">
            <input
              className={inputClass()}
              type="date"
              value={form.domainSubscriptionEndDate}
              onChange={(e) => setField("domainSubscriptionEndDate", e.target.value)}
            />
          </Field>
          <Field label="Domain Registration Cost" hint="Cost of domain registration">
            <span className={styles.clientCrmPesoPrefix}>₱</span>
            <input
              className={inputClass(false, styles.clientCrmPesoInput)}
              type="number"
              min="0"
              step="0.01"
              value={form.domainRegistrationCost}
              onChange={(e) => setField("domainRegistrationCost", e.target.value)}
            />
          </Field>
        </div>
      </section>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Contract And Proposal</h4>
        <div className={styles.clientOrderGrid}>
          <Field
            label="Contract Status"
            hint="Automatically set from uploaded documents, invoice send, and deal status"
            icon="fa-solid fa-lock"
          >
            <select className={inputClass()} value={form.contractStatus} disabled>
              <option value="">-None-</option>
              {withExtraOption(CONTRACT_STATUS_OPTIONS, form.contractStatus).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Proposal/Conforme" hint="Upload the proposal or conforme document">
            <FilePick
              fileControl
              fileName={form.proposalConformeName}
              onChange={(file) => setField("proposalConformeName", file?.name || "")}
            />
          </Field>
          <Field
            label="Contract Sent Date"
            hint="Auto-filled when the invoice is sent. You can change it if needed."
          >
            <input
              className={inputClass()}
              type="date"
              value={form.contractSentDate}
              onChange={(e) => setDateField("contractSentDate", e.target.value)}
            />
          </Field>
          <Field label="Contract" hint="Upload the signed contract">
            <FilePick
              fileControl
              fileName={form.contractFileName}
              onChange={(file) => setField("contractFileName", file?.name || "")}
            />
          </Field>
          <Field
            label="Contract Service Start Date"
            hint="Auto-filled from the product start date. You can change it if needed."
          >
            <input
              className={inputClass()}
              type="date"
              value={form.contractServiceStartDate}
              onChange={(e) => setDateField("contractServiceStartDate", e.target.value)}
            />
          </Field>
          <Field label="Cancellation Document" hint="Upload a cancellation document if needed">
            <FilePick
              fileControl
              fileName={form.cancellationDocumentName}
              onChange={(file) => setField("cancellationDocumentName", file?.name || "")}
            />
          </Field>
          <Field
            label="Contract Service End Date"
            hint="Auto-filled from payment terms or the product end date. You can change it if needed."
          >
            <input
              className={inputClass()}
              type="date"
              value={form.contractServiceEndDate}
              onChange={(e) => setDateField("contractServiceEndDate", e.target.value)}
            />
          </Field>
          <Field label="Total Estimated Cost" hint="Estimated cost for this contract">
            <span className={styles.clientCrmPesoPrefix}>₱</span>
            <input
              className={inputClass(false, styles.clientCrmPesoInput)}
              type="number"
              min="0"
              step="0.01"
              value={form.totalEstimatedCost}
              onChange={(e) => setField("totalEstimatedCost", e.target.value)}
            />
          </Field>
          <Field label="Total Contract Value" hint="Total value of the contract">
            <span className={styles.clientCrmPesoPrefix}>₱</span>
            <input
              className={inputClass(false, styles.clientCrmPesoInput)}
              type="number"
              min="0"
              step="0.01"
              value={form.totalContractValue}
              onChange={(e) => setField("totalContractValue", e.target.value)}
            />
          </Field>
          <Field label="Expected Discount" hint="Expected discount amount">
            <span className={styles.clientCrmPesoPrefix}>₱</span>
            <input
              className={inputClass(false, styles.clientCrmPesoInput)}
              type="number"
              min="0"
              step="0.01"
              value={form.expectedDiscount}
              onChange={(e) => setField("expectedDiscount", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {productDeal ? (
        <section className={styles.clientCrmSection}>
          <OrderProductDetailsPanel order={productDeal} embedded />
        </section>
      ) : null}
    </form>
  );
}
