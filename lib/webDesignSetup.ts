export type WebDesignFeaturePath = "member-portal" | "online-services";

export type WebDesignSetupSelection = {
  path: WebDesignFeaturePath;
  templateLabel?: string;
  templateId?: string;
  packageName: string;
  packagePrice: number;
  serviceFeatures: string[];
  paymentMethods: string[];
  clientNotes?: string;
};

export type WebDesignCartMeta = {
  packageName: string;
  packagePrice?: number;
  templateId?: string;
  templateLabel?: string;
  serviceFeatures: string[];
  paymentMethods?: string[];
  clientNotes?: string;
};

export const SERVICE_CHECKLIST_ITEMS = [
  "Dashboard",
  "Pop up Message/Advisory",
  "Mailing List",
  "Members Portal",
  "Members Directory",
  "Registration",
  "Billing and Subscription (Annual Membership fee)",
  "Account Access and Management",
  "Forum Page",
  "Event Calendar",
  "Payment Method",
] as const;

export const WEBDESIGN_PAYMENT_METHODS = [
  { id: "cc", label: "Credit / Debit Card" },
  { id: "gc", label: "GCash" },
  { id: "bn", label: "Online Bank Transfer" },
  { id: "ecpay", label: "Over-the-Counter (ECPay)" },
] as const;

export const WEBDESIGN_META_PREFIX = "[WEBDESIGN_META]";

export function formatWebDesignSetupDetail(selection: WebDesignSetupSelection): string {
  const parts: string[] = ["Agency Web Design", "Pending Quotation"];

  if (selection.templateLabel) {
    parts.push(`Template: ${selection.templateLabel}`);
  }

  if (selection.path === "member-portal") {
    parts.push("Selected website template");
  } else {
    parts.push(`Service checklist: ${selection.serviceFeatures.join(", ") || "None selected"}`);
    if (selection.paymentMethods.length > 0) {
      const labels = selection.paymentMethods
        .map((id) => WEBDESIGN_PAYMENT_METHODS.find((method) => method.id === id)?.label || id)
        .join(", ");
      parts.push(`Payment methods: ${labels}`);
    }
  }

  return parts.join(" · ");
}

export function buildWebDesignMeta(selection: WebDesignSetupSelection): WebDesignCartMeta {
  const clientNotes = String(selection.clientNotes ?? "").trim();
  return {
    packageName: selection.packageName,
    packagePrice: selection.packagePrice,
    templateId: selection.templateId,
    templateLabel: selection.templateLabel,
    serviceFeatures: [...selection.serviceFeatures],
    paymentMethods: [...selection.paymentMethods],
    ...(clientNotes ? { clientNotes } : {}),
  };
}

export function buildWebDesignMetaLine(selection: WebDesignSetupSelection): string {
  return `${WEBDESIGN_META_PREFIX}${JSON.stringify(buildWebDesignMeta(selection))}`;
}

function paymentMethodLabels(ids: string[] = []) {
  return ids
    .map((id) => WEBDESIGN_PAYMENT_METHODS.find((method) => method.id === id)?.label || id)
    .filter(Boolean);
}

export function parseWebDesignMeta(source?: string | null): WebDesignCartMeta | null {
  const text = String(source ?? "");
  const marker = text.indexOf(WEBDESIGN_META_PREFIX);
  if (marker >= 0) {
    const jsonLine = text
      .slice(marker + WEBDESIGN_META_PREFIX.length)
      .split("\n")[0]
      ?.trim();
    if (jsonLine?.startsWith("{")) {
      try {
        const parsed = JSON.parse(jsonLine) as WebDesignCartMeta;
        if (parsed && typeof parsed === "object") {
          return {
            packageName: String(parsed.packageName ?? "").trim(),
            packagePrice: Number(parsed.packagePrice ?? 0) || undefined,
            templateId: parsed.templateId,
            templateLabel: String(parsed.templateLabel ?? "").trim() || undefined,
            serviceFeatures: Array.isArray(parsed.serviceFeatures)
              ? parsed.serviceFeatures.map((value) => String(value).trim()).filter(Boolean)
              : [],
            paymentMethods: Array.isArray(parsed.paymentMethods)
              ? parsed.paymentMethods.map((value) => String(value).trim()).filter(Boolean)
              : [],
            clientNotes: String(parsed.clientNotes ?? "").trim() || undefined,
          };
        }
      } catch {
        // Fall through to the human-readable detail string.
      }
    }
  }

  const templateMatch = text.match(/Template:\s*([^·\n]+)/i);
  const checklistMatch = text.match(/Service checklist:\s*([^·\n]+)/i);
  const paymentMatch = text.match(/Payment methods:\s*([^·\n]+)/i);
  if (!templateMatch && !checklistMatch) return null;

  const checklist = String(checklistMatch?.[1] ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value && value.toLowerCase() !== "none selected");

  return {
    packageName: "",
    templateLabel: templateMatch?.[1]?.trim() || undefined,
    serviceFeatures: checklist,
    paymentMethods: String(paymentMatch?.[1] ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}

export function resolveWebDesignCartMeta(item: {
  name?: string;
  detail?: string | null;
  notes?: string | null;
  webDesign?: WebDesignCartMeta | null;
}): WebDesignCartMeta | null {
  if (item.webDesign && (item.webDesign.templateLabel || item.webDesign.serviceFeatures?.length)) {
    return {
      ...item.webDesign,
      packageName: item.webDesign.packageName || item.name || "",
    };
  }

  const parsed = parseWebDesignMeta(item.detail) ?? parseWebDesignMeta(item.notes);
  if (!parsed) return null;
  return {
    ...parsed,
    packageName: parsed.packageName || item.name || "",
  };
}

export function webDesignAdditionalServicesLabel(meta: WebDesignCartMeta | null | undefined) {
  if (!meta) return "";
  const features = (meta.serviceFeatures ?? []).filter(
    (value) => value && value.toLowerCase() !== "none selected",
  );
  const payments = paymentMethodLabels(meta.paymentMethods);
  return [...features, ...payments].join(", ");
}

export function webDesignIncludedServices(source?: string | null): string[] {
  const meta = parseWebDesignMeta(source);
  const fromMeta = [
    ...(meta?.serviceFeatures ?? []).filter((value) => value && value.toLowerCase() !== "none selected"),
    ...paymentMethodLabels(meta?.paymentMethods),
  ];
  if (fromMeta.length) return uniqueServiceLabels(fromMeta);

  const match = String(source ?? "").match(/Additional Services:\s*(.+)/i);
  if (!match) return [];
  return uniqueServiceLabels(String(match[1]).split(","));
}

function uniqueServiceLabels(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const value of values) {
    const label = String(value ?? "").trim();
    if (!label || label.toLowerCase() === "none selected") continue;
    const key = label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }
  return labels;
}

export function webDesignClientNotes(source?: string | null): string {
  const fromMeta = String(parseWebDesignMeta(source)?.clientNotes ?? "").trim();
  if (fromMeta) return fromMeta;

  const text = String(source ?? "");
  const match = text.match(/^Notes:\s*(.*)$/im);
  if (!match) return "";

  const start = (match.index ?? 0) + match[0].length;
  const rest = text.slice(start).replace(/^\s+/, "");
  const collected: string[] = [];
  const inline = String(match[1] ?? "").trim();
  if (inline) collected.push(inline);

  for (const line of rest.split(/\r\n|\n|\r/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (collected.length) break;
      continue;
    }
    if (/^(\[WEBDESIGN_META\]|Pricing:|Notify:|Service:|Template:|Additional Services:|Items:|Submitted |Payment |Customer checkout|Web design quotation)/i.test(trimmed)) {
      break;
    }
    collected.push(trimmed);
  }

  return collected.join("\n").trim();
}
