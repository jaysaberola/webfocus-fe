export type PaynamicsPaymentMethod = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export const PAYNAMICS_PAYMENT_METHODS: PaynamicsPaymentMethod[] = [
  {
    id: "cc",
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, and other major cards via Paynamics IPG.",
    icon: "fa-regular fa-credit-card",
  },
  {
    id: "gc",
    label: "GCash",
    description: "Pay using your GCash wallet through Paynamics.",
    icon: "fa-solid fa-wallet",
  },
  {
    id: "bn",
    label: "Online Bank Transfer",
    description: "BancNet online banking via Paynamics.",
    icon: "fa-solid fa-building-columns",
  },
  {
    id: "ecpay",
    label: "Over-the-Counter",
    description: "ECPay and partner outlets via Paynamics.",
    icon: "fa-solid fa-store",
  },
];

export function getPaynamicsPaymentLabel(methodId: string) {
  return PAYNAMICS_PAYMENT_METHODS.find((method) => method.id === methodId)?.label ?? methodId;
}

export function formatPaynamicsPaymentMethod(methodId: string) {
  return `Paynamics-${methodId}`;
}
