export type WebDesignFeaturePath = "member-portal" | "online-services";

export type WebDesignSetupSelection = {
  path: WebDesignFeaturePath;
  templateLabel?: string;
  templateId?: string;
  packageName: string;
  packagePrice: number;
  serviceFeatures: string[];
  paymentMethods: string[];
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
