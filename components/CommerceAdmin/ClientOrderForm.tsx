import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import OrderProductDetailsPanel from "@/components/CommerceAdmin/OrderProductDetailsPanel";
import { buildClientDealRows, domainTypeFromHostname, formatDealAmount, transactionClientName, transactionDealName, transactionDomainName } from "@/lib/commerceAdmin/clientDealHelpers";
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
  parseDealNames,
  joinDealNames,
  parseDealMeta,
  DEAL_STAGE_OPTIONS,
  DEAL_STATUS_OPTIONS,
  DOMAIN_REGISTRAR_OPTIONS,
  DOMAIN_TYPE_OPTIONS,
  emptyClientOrderForm,
  INVOICE_STATUS_OPTIONS,
  mergeDealMetaIntoNotes,
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_MODE_OPTIONS,
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
import { clientDisplayName, assignablePersonLabel, clientDealStatusFromCustomer, resolveAssignableSelectValue, withCurrentAssignablePerson } from "@/lib/commerceAdmin/clientHelpers";
import { isWebDesignPlan, looksLikeDomain } from "@/lib/serviceCategory";
import { HOSTING_PLANS, UNIVERSAL_HOSTING_ADDONS, WEBDESIGN_PACKAGES } from "@/lib/servicesCatalog";
import { getAllPublicHostingAddons } from "@/services/publicHostingService";
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
import { getCustomers, getCustomer, updateCustomer, createCustomerCrmAccount, type CustomerRow } from "@/services/customerService";
import { getServices } from "@/services/serviceService";
import {
  checkDomainAvailability,
  MORE_TLDS,
  normalizeDomainInput,
  PRIMARY_TLDS,
  type DomainCheckResult,
} from "@/services/domainSearchService";
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

const NEW_CLIENT_VALUE = "__new_client__";

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
  const isSelect = childArray.some((child) => {
    if (!isValidElement(child)) return false;
    if (child.type === "select") return true;
    const props = child.props as { "data-select-control"?: boolean | string };
    return props["data-select-control"] === true || props["data-select-control"] === "true";
  });
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

function normalizeCatalogName(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SHARED_CLOUD_ALIASES: Record<string, string[]> = {
  "linux cloud starter": ["starter shared", "starter"],
  "windows cloud starter": ["starter shared", "starter"],
  "linux cloud standard": ["standard shared", "standard"],
  "windows cloud standard": ["standard shared", "standard"],
  "linux cloud deluxe": ["deluxe shared", "deluxe"],
  "windows cloud deluxe": ["deluxe shared", "deluxe"],
  "linux cloud business": ["business shared", "business"],
  "windows cloud business": ["business shared", "business"],
};

const ADDON_CORE_ALIASES: Record<string, string[]> = {
  immunify360: ["imunify360"],
  imunify360: ["immunify360"],
  "giga bit lan": ["gigabit lan", "bare metal gigabit lan"],
  whois: ["who is"],
  "auto back up": ["automatic back up", "auto backup"],
  ssl: ["secure socket layer standard ssl", "standard ssl"],
  "wildcard ssl": ["secure socket layer wildcard ssl"],
  "static ip": ["add ons static ip"],
  "additional ip": ["dedicated ip", "ip address", "static ip"],
};

function hasAddonPrefix(normalized: string) {
  return /^(add ons|add on|addons|addon)\s+/.test(normalized);
}

function stripAddonPrefix(normalized: string) {
  return normalized.replace(/^(add ons|add on|addons|addon)\s+/, "").trim();
}

function addonCoresForName(normalized: string) {
  const core = stripAddonPrefix(normalized);
  if (!core) return [];
  return [core, ...(ADDON_CORE_ALIASES[core] ?? [])];
}

function catalogNeedlesForProduct(productName: string) {
  const needle = normalizeCatalogName(productName);
  if (!needle) return [];
  const needles = [needle, ...(SHARED_CLOUD_ALIASES[needle] ?? [])];
  if (hasAddonPrefix(needle)) {
    for (const core of addonCoresForName(needle)) {
      needles.push(`add ons ${core}`);
      needles.push(`add on ${core}`);
      if (core.length >= 10) needles.push(core);
    }
  }
  return Array.from(new Set(needles.filter(Boolean)));
}

function catalogLabelsForService(row: any) {
  const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const raw = [
    row?.name,
    row?.title,
    row?.plan,
    row?.plan_name,
    row?.subject,
    row?.label,
    metadata.plan_name,
    metadata.display_name,
    metadata.crm_name,
  ];
  return Array.from(
    new Set(
      raw
        .flatMap((value) => String(value ?? "").split(","))
        .map((value) => normalizeCatalogName(value))
        .filter(Boolean),
    ),
  );
}

function readCatalogPrice(row: any) {
  const price = Number(row?.price ?? row?.amount ?? row?.unit_price ?? 0);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function isUniversalAddonRow(row: any) {
  const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata : {};
  const planType = String(metadata.plan_type ?? row?.plan_type ?? "").toLowerCase();
  if (planType === "universal") return true;
  return catalogLabelsForService(row).some((label) => hasAddonPrefix(label));
}

function matchScoreForProduct(row: any, needles: string[], dealNormalized: string) {
  const labels = catalogLabelsForService(row);
  const dealIsAddon = hasAddonPrefix(dealNormalized);
  const dealCores = addonCoresForName(dealNormalized);
  let score = 0;

  for (const label of labels) {
    if (needles[0] === label) score = Math.max(score, 100);
    else if (needles.includes(label) && (hasAddonPrefix(label) || label.length >= 10)) score = Math.max(score, 95);
    else if (needles.includes(label)) score = Math.max(score, 80);
    else if (dealIsAddon && hasAddonPrefix(label) && dealCores.includes(stripAddonPrefix(label))) {
      score = Math.max(score, 90);
    } else if (dealIsAddon && isUniversalAddonRow(row) && dealCores.includes(stripAddonPrefix(label))) {
      score = Math.max(score, 88);
    } else if (dealIsAddon && dealCores.includes(stripAddonPrefix(label))) {
      score = Math.max(score, 40);
    }
  }

  return score;
}

function catalogPriceForProduct(services: any[], productName: string) {
  const needles = catalogNeedlesForProduct(productName);
  if (!needles.length) return null;
  const dealNormalized = needles[0];
  const dealIsAddon = hasAddonPrefix(dealNormalized);

  let best: { price: number; score: number } | null = null;
  const corePrices = new Set<number>();

  for (const row of services) {
    const price = readCatalogPrice(row);
    if (price == null) continue;
    const score = matchScoreForProduct(row, needles, dealNormalized);
    if (score <= 0) continue;
    if (score === 40) corePrices.add(price);
    if (!best || score > best.score) best = { price, score };
  }

  if (best && best.score >= 85) return best.price;
  if (best && !dealIsAddon && best.score >= 80) return best.price;

  const hosting = HOSTING_PLANS.find((plan) => needles.includes(normalizeCatalogName(plan.name)));
  if (hosting?.price) return hosting.price;
  const design = WEBDESIGN_PACKAGES.find((pkg) => needles.includes(normalizeCatalogName(pkg.name)));
  if (design?.price) return design.price;
  const addon = UNIVERSAL_HOSTING_ADDONS.find((row) => matchScoreForProduct(row, needles, dealNormalized) >= 85);
  if (addon?.price) return addon.price;

  if (dealIsAddon && best?.score === 40 && corePrices.size === 1) return best.price;
  if (!dealIsAddon && best) return best.price;
  return null;
}

function catalogLinesForDealNames(services: any[], dealName: string) {
  return parseDealNames(dealName)
    .map((name) => {
      const price = catalogPriceForProduct(services, name);
      return price != null ? { name, price } : null;
    })
    .filter((row): row is { name: string; price: number } => Boolean(row));
}

function catalogTotalForDealNames(services: any[], dealName: string) {
  const lines = catalogLinesForDealNames(services, dealName);
  if (!lines.length) return null;
  const total = lines.reduce((sum, row) => sum + row.price, 0);
  return Number.isFinite(total) ? total : null;
}

function extractServicesList(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

async function fetchAllServiceCatalog(): Promise<any[]> {
  const collected: any[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const res = await getServices({ per_page: 100, page }, { silent: true }).catch(() => null);
    collected.push(...extractServicesList(res));
    lastPage = Math.max(1, Number(res?.meta?.last_page ?? 1));
    page += 1;
  } while (page <= lastPage && page <= 25);

  const publicAddons = await getAllPublicHostingAddons().catch(() => []);

  return [
    ...collected,
    ...publicAddons.map((addon) => ({
      name: addon.name,
      price: addon.price,
      label: addon.label,
      metadata: { item_type: "addon", plan_type: addon.plan_type },
    })),
    ...HOSTING_PLANS.map((plan) => ({ name: plan.name, price: plan.price })),
    ...WEBDESIGN_PACKAGES.map((pkg) => ({ name: pkg.name, price: pkg.price })),
    ...UNIVERSAL_HOSTING_ADDONS.map((addon) => ({
      name: addon.name,
      price: addon.price,
      metadata: { item_type: "addon", plan_type: "universal" },
    })),
  ];
}

function DealNameMultiSelect({
  options,
  selected,
  required,
  onChange,
}: {
  options: readonly string[];
  selected: string[];
  required?: boolean;
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  const label = selected.length === 0 ? "-None-" : selected.join(", ");
  const removeSelected = (name: string) => {
    onChange(selected.filter((item) => item !== name));
  };

  return (
    <div className={styles.clientOrderMultiSelect} ref={wrapRef}>
      <div
        className={[
          styles.clientOrderMultiSelectBtn,
          required ? styles.clientCrmInputRequired : "",
          selected.length === 0 ? styles.clientOrderMultiSelectPlaceholder : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        tabIndex={0}
        title={label}
      >
        {selected.length === 0 ? (
          <span>-None-</span>
        ) : (
          <span className={styles.clientOrderMultiSelectValues}>
            {selected.map((name) => (
              <span key={name} className={styles.clientOrderMultiSelectChip}>
                <span className={styles.clientOrderMultiSelectChipLabel}>{name}</span>
                <button
                  type="button"
                  className={styles.clientOrderMultiSelectChipRemove}
                  aria-label={`Remove ${name}`}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    removeSelected(name);
                  }}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </span>
            ))}
          </span>
        )}
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </div>
      {open ? (
        <div className={styles.clientOrderMultiSelectPanel} role="listbox" aria-multiselectable="true">
          {options.map((option) => (
            <label key={option} className={styles.clientOrderMultiSelectItem}>
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={() =>
                  onChange(
                    selected.includes(option)
                      ? selected.filter((item) => item !== option)
                      : [...selected, option],
                  )
                }
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
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

const DEAL_DOMAIN_TLDS = Array.from(
  new Set<string>([...PRIMARY_TLDS, ...MORE_TLDS, ".edu.ph", ".gov.ph"]),
);

function DomainNameSuggest({
  value,
  onChange,
  onPick,
}: {
  value: string;
  onChange: (value: string) => void;
  onPick: (domain: string, domainType: string, price?: number) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainCheckResult[]>([]);

  const parsed = normalizeDomainInput(value);
  const baseName = parsed.name.replace(/[^a-z0-9-]/g, "");
  const suggestions = useMemo(() => {
    if (!baseName || baseName.length < 2) return [];
    return DEAL_DOMAIN_TLDS.map((tld) => {
      const domain = `${baseName}${tld}`;
      const match = results.find((row) => row.domain === domain || row.tld === tld);
      return {
        domain,
        tld,
        available: match?.available ?? null,
        price: match?.price ?? 0,
        currency: match?.currency ?? "PHP",
      };
    });
  }, [baseName, results]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!baseName || baseName.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await checkDomainAvailability(baseName, DEAL_DOMAIN_TLDS, { silent: true });
        if (!cancelled) setResults(Array.isArray(response?.results) ? response.results : []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [baseName]);

  return (
    <div className={styles.clientOrderDomainSuggest} ref={wrapRef}>
      <input
        className={inputClass()}
        value={value}
        placeholder="example.com"
        autoComplete="off"
        onFocus={() => {
          if (baseName.length >= 2) setOpen(true);
        }}
        onChange={(event) => {
          const next = event.target.value;
          onChange(next);
          if (normalizeDomainInput(next).name.replace(/[^a-z0-9-]/g, "").length >= 2) {
            setOpen(true);
          } else {
            setOpen(false);
          }
        }}
      />
      {open && suggestions.length ? (
        <div className={styles.clientOrderDomainSuggestPanel} role="listbox">
          {loading ? <div className={styles.clientOrderDomainSuggestHint}>Checking domains…</div> : null}
          {suggestions.map((row) => (
            <button
              key={row.domain}
              type="button"
              className={styles.clientOrderDomainSuggestItem}
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onPick(row.domain, domainTypeFromHostname(row.domain) || "", row.price);
                setOpen(false);
              }}
            >
              <span className={styles.clientOrderDomainSuggestName}>{row.domain}</span>
              <span className={styles.clientOrderDomainSuggestMeta}>
                {row.price > 0 ? formatDealAmount(row.price) : ""}
                {row.available === true ? "Available" : row.available === false ? "Taken" : ""}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
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
  const [newClientName, setNewClientName] = useState("");
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
      fetchAllServiceCatalog().catch(() => [] as any[]),
      transaction?.customer_id
        ? getCustomer(transaction.customer_id, { silent: true }).catch(() => null)
        : Promise.resolve(null),
    ])
      .then(([clientOwners, assignable, clientRes, serviceRes, clientDetail]) => {
        if (cancelled) return;
        const nextOwners = Array.isArray(clientOwners) ? clientOwners : [];
        const nextStaff = Array.isArray(assignable) ? assignable : [];
        const nextClients = Array.isArray(clientRes?.data) ? clientRes.data : [];
        const nextServices = Array.isArray(serviceRes) ? serviceRes : extractServicesList(serviceRes);
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
            dealType:
              clientDealStatusFromCustomer(linkedClient) ||
              nextForm.dealType ||
              "New Client",
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
              dealType: clientDealStatusFromCustomer(defaultClient),
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
  const isNewClient = form.clientId === NEW_CLIENT_VALUE;
  const isWebDesignDeal =
    isWebDesignPlan(form.dealName, form.dealSubType || form.dealType) ||
    Boolean(transaction && isWebDesignTransaction(transaction));

  useEffect(() => {
    if (isNewClient) {
      setForm((current) =>
        current.dealType === "New Client" ? current : { ...current, dealType: "New Client" },
      );
      return;
    }
    if (!form.clientId) {
      if (isEditing) return;
      setForm((current) => (current.dealType ? { ...current, dealType: "" } : current));
      return;
    }
    const nextStatus = clientDealStatusFromCustomer(selectedClient) || "New Client";
    setForm((current) => (current.dealType === nextStatus ? current : { ...current, dealType: nextStatus }));
  }, [form.clientId, selectedClient, isEditing, isNewClient]);

  const applyRotatingOwner = (clientId: string, dealName: string, dealType?: string) => {
    if (isEditing || !clientId || clientId === NEW_CLIENT_VALUE) return;
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
    const fallbackName = transactionClientName(transaction);
    const client =
      selectedClient ??
      clients.find((row) => Number(row.id) === Number(transaction.customer_id)) ??
      ({
        id: Number(transaction.customer_id ?? 0),
        company: fallbackName === "—" ? "" : fallbackName,
        email: transaction.customer_email ?? "",
      } as CustomerRow);
    const rows = buildClientDealRows(client, [transaction], services);
    return rows.find((row) => row.dealName === form.dealName) ?? rows[0] ?? null;
  }, [transaction, selectedClient, clients, services, form.dealName]);

  const dealPriceLines = useMemo(
    () => catalogLinesForDealNames(services, form.dealName || form.productName),
    [services, form.dealName, form.productName],
  );
  const dealPriceTotal = useMemo(
    () => dealPriceLines.reduce((sum, row) => sum + row.price, 0),
    [dealPriceLines],
  );

  useEffect(() => {
    const catalogName = form.dealName || form.productName;
    const price = catalogName ? catalogTotalForDealNames(services, catalogName) : null;
    const nextRevenue = price != null ? String(price) : isEditing ? undefined : "0";
    if (nextRevenue == null) return;
    setForm((current) =>
      current.expectedRevenue === nextRevenue ? current : { ...current, expectedRevenue: nextRevenue },
    );
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

  const applyClientDefaults = (clientId: string, client?: CustomerRow | null) => {
    const nextStatus = clientId ? clientDealStatusFromCustomer(client) || "New Client" : "";
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
      dealType: nextStatus,
    }));
  };

  const handleClientChange = (clientId: string) => {
    if (clientId === NEW_CLIENT_VALUE) {
      setNewClientName("");
      setForm((current) => ({
        ...current,
        clientId,
        contactName: "",
        dealType: "New Client",
      }));
      return;
    }
    setNewClientName("");
    const client = clients.find((row) => String(row.id) === clientId);
    applyClientDefaults(clientId, client);
    applyRotatingOwner(clientId, form.dealName, form.dealSubType || form.dealType);
    if (!clientId) return;
    void getCustomer(Number(clientId), { silent: true })
      .then((detail) => {
        if (!detail) return;
        const merged = { ...(client ?? {}), ...detail } as CustomerRow;
        setClients((current) => {
          const index = current.findIndex((row) => String(row.id) === clientId);
          if (index === -1) return [merged, ...current];
          const next = [...current];
          next[index] = { ...next[index], ...merged };
          return next;
        });
        applyClientDefaults(clientId, merged);
      })
      .catch(() => undefined);
  };

  const handleDealNamesChange = (names: string[]) => {
    const dealName = joinDealNames(names);
    const primary = names[0] || "";
    const domainType = names.find((name) =>
      DOMAIN_TYPE_OPTIONS.includes(name as (typeof DOMAIN_TYPE_OPTIONS)[number]),
    );
    setForm((current) => ({
      ...current,
      dealName,
      productName: dealName,
      productCategory: current.productCategory || subjectForProductName(primary),
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
      dealType: clientDealStatusFromCustomer(defaultClient),
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

    if (form.clientId === NEW_CLIENT_VALUE && !newClientName.trim()) {
      toast.error("Please enter the new client name.");
      return;
    }

    if (!form.clientId || !form.dealName) {
      toast.error("Please select a client and deal name.");
      return;
    }

    setSubmitting(true);
    try {
      let clientId = Number(form.clientId);
      let clientName = selectedClient
        ? clientDisplayName(selectedClient)
        : String(transaction?.customer_name ?? "").trim();
      let clientEmail = selectedClient?.email ?? transaction?.customer_email ?? "";
      const price = Number(form.expectedRevenue || 0);
      const ownerId = Number(form.dealOwnerId);

      if (form.clientId === NEW_CLIENT_VALUE) {
        const company = newClientName.trim();
        const slug = company.toLowerCase().replace(/[^a-z0-9]+/g, "") || "client";
        const createdClient = await createCustomerCrmAccount({
          company,
          email: `${slug}.${Date.now()}@client.ph`,
          contact_person: form.contactName.trim() || company,
          owner_id: ownerId || null,
          billing_in_charge: form.billingInCharge || undefined,
          client_classification: "New",
        });
        clientId = Number(createdClient?.data?.id ?? createdClient?.id);
        if (!clientId) {
          toast.error("Failed to create the new client.");
          return;
        }
        clientName = createdClient?.data?.name || company;
        clientEmail = createdClient?.data?.email || `${slug}.${Date.now()}@client.ph`;
        setForm((current) => ({ ...current, clientId: String(clientId) }));
      }

      if (!clientId) {
        toast.error("Please select a client and deal name.");
        return;
      }

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
        items: parseDealNames(form.dealName).map((name) => {
          const itemPrice = catalogPriceForProduct(services, name) ?? 0;
          return {
            name,
            item_type: isWebDesignPlan(name, form.dealSubType || form.dealType)
              ? "web_design"
              : form.dealSubType || form.dealType || "service",
            price: itemPrice,
            quantity: 1,
            total_price: itemPrice,
          };
        }),
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
        setNewClientName("");
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
    const stored = Number(transaction?.grand_total ?? 0);
    const amount =
      dealPriceTotal > 0
        ? dealPriceTotal
        : Number.isFinite(fromForm) && fromForm > 0
          ? fromForm
          : Number.isFinite(stored) && stored > 0
            ? stored
            : 0;
    return `${dealName} - ${formatDealAmount(amount)}`;
  }, [isEditing, pageTitle, form.dealName, form.expectedRevenue, dealPriceTotal, transaction]);

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
              label="Client Name"
              required
              hint="Client this order belongs to"
              icon="fa-solid fa-file"
              iconCheck
            >
              <div className={styles.clientOrderClientPick} data-select-control="true">
                <select
                  className={inputClass(true)}
                  value={form.clientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  required
                >
                  <option value="">-None-</option>
                  <option value={NEW_CLIENT_VALUE}>New Client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {clientDisplayName(client)}
                    </option>
                  ))}
                  {transaction?.customer_id &&
                  !clients.some((client) => Number(client.id) === Number(transaction.customer_id)) ? (
                    <option value={String(transaction.customer_id)}>
                      {transactionClientName(transaction) === "—"
                        ? `Client #${transaction.customer_id}`
                        : transactionClientName(transaction)}
                    </option>
                  ) : null}
                </select>
                {isNewClient ? (
                  <input
                    className={inputClass(true)}
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    placeholder="Enter new client name"
                    required
                  />
                ) : null}
              </div>
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
            <Field
              label="Client Owner"
              hint="Existing clients keep their assigned sales staff. New clients rotate to the next alternate assignee."
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
            <Field label="Contact Name" hint="Billing or signing contact" icon="fa-solid fa-address-card">
              <input
                className={inputClass()}
                value={form.contactName}
                onChange={(e) => setField("contactName", e.target.value)}
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
            <Field
              label="Client Status"
              required={!isEditing}
              hint="Automatically set from the selected client: Existing Client, New Client, or In-House Account"
              icon="fa-solid fa-lock"
            >
              <select
                className={inputClass(!isEditing)}
                value={form.dealType}
                onChange={(e) => setField("dealType", e.target.value)}
                required={!isEditing}
                disabled
              >
                <option value="">-None-</option>
                {withExtraOption(CLIENT_STATUS_OPTIONS, form.dealType).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
            <Field label="Deal Name" required hint="Select one or more deal names">
              <DealNameMultiSelect
                required
                selected={parseDealNames(form.dealName)}
                options={Array.from(
                  new Set([...parseDealNames(form.dealName), ...DEAL_NAME_OPTIONS]),
                )}
                onChange={handleDealNamesChange}
              />
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
            <Field
              label="Payment Mode"
              hint="Actual mode used on the related payment"
            >
              <select
                className={inputClass()}
                value={form.paymentMode}
                onChange={(e) => setField("paymentMode", e.target.value)}
                disabled={Boolean(transaction?.payment_mode)}
              >
                <option value="">-None-</option>
                {withExtraOption(PAYMENT_MODE_OPTIONS, form.paymentMode).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
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
            <Field label="Status Trigger Date" hint="Date this status took effect">
              <input
                className={inputClass()}
                type="date"
                value={form.statusTriggerDate}
                onChange={(e) => setField("statusTriggerDate", e.target.value)}
              />
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
            <Field label="JO Number" hint="Job order number if already issued">
              <input
                className={inputClass()}
                value={form.joNumber}
                onChange={(e) => setField("joNumber", e.target.value)}
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
            <Field label="Campaign Source" hint="Where this deal originated" icon="fa-solid fa-bullhorn">
              <input
                className={inputClass()}
                value={form.campaignSource}
                onChange={(e) => setField("campaignSource", e.target.value)}
              />
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
            {dealPriceLines.length ? (
              <div className={styles.dealPriceSummarySlot}>
                <div className={styles.dealPriceSummary}>
                  <span className={styles.clientOrderLabel}>
                    <span className={styles.clientOrderLabelText}>Deal Prices</span>
                    <span className={styles.clientCrmHint} title="Prices from Services for the selected deal names">
                      i
                    </span>
                  </span>
                  <div className={styles.dealPriceSummaryBox}>
                    <ul className={styles.dealPriceSummaryList}>
                      {dealPriceLines.map((row) => (
                        <li key={row.name}>
                          <span className={styles.dealPriceSummaryName}>{row.name}</span>
                          <span className={styles.dealPriceSummaryAmount}>{formatDealAmount(row.price)}</span>
                          <button
                            type="button"
                            className={styles.dealPriceSummaryRemove}
                            aria-label={`Remove ${row.name}`}
                            onClick={() =>
                              handleDealNamesChange(
                                parseDealNames(form.dealName).filter((name) => name !== row.name),
                              )
                            }
                          >
                            <i className="fa-solid fa-xmark" aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className={styles.dealPriceSummaryTotal}>
                      <span>Total</span>
                      <span className={styles.dealPriceSummaryAmount}>{formatDealAmount(dealPriceTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            )}
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
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
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
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Payment Date" hint="Date the related payment was received">
              <input
                className={inputClass()}
                type="date"
                value={form.paymentDate}
                onChange={(e) => setField("paymentDate", e.target.value)}
                readOnly={Boolean(transaction?.payment_date)}
              />
            </Field>
            <div className={styles.clientOrderGridSpacer} aria-hidden="true" />
            <Field label="Closing Date" hint="Expected close date">
              <input
                className={inputClass()}
                type="date"
                value={form.closingDate}
                onChange={(e) => setField("closingDate", e.target.value)}
              />
            </Field>
        </div>
      </section>

      <section className={styles.clientCrmSection}>
        <h4 className={styles.clientCrmSectionTitle}>Domain Registration</h4>
        <div className={styles.clientOrderGrid}>
          <Field label="Domain Name" hint="Registered domain for this deal">
            <DomainNameSuggest
              value={form.domainName}
              onChange={(name) => {
                const type = domainTypeFromHostname(name) || "";
                setForm((current) => ({
                  ...current,
                  domainName: name,
                  domainType: type || current.domainType,
                }));
              }}
              onPick={(name, type, price) => {
                setForm((current) => ({
                  ...current,
                  domainName: name,
                  domainType: type || current.domainType,
                  domainRegistrationCost:
                    price != null && price > 0 ? String(price) : current.domainRegistrationCost,
                }));
              }}
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
