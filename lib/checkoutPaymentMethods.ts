export type PaynamicsPaymentMethod = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type PaynamicsPaymentGroup = {
  id: string;
  label: string;
  methods: PaynamicsPaymentMethod[];
};

export const PAYNAMICS_PAYMENT_GROUPS: PaynamicsPaymentGroup[] = [
  {
    id: "card",
    label: "Credit / Debit Card",
    methods: [
      {
        id: "cc",
        label: "Credit / Debit Card",
        description: "Use your Visa or Mastercard to pay.",
        icon: "fa-regular fa-credit-card",
      },
    ],
  },
  {
    id: "installment",
    label: "Installment (Non-Credit Card)",
    methods: [
      {
        id: "billease",
        label: "Billease",
        description: "Pay in installments through Billease.",
        icon: "fa-solid fa-calendar",
      },
    ],
  },
  {
    id: "ewallet",
    label: "E-Wallet",
    methods: [
      {
        id: "gcash",
        label: "GCash",
        description: "Pay using your GCash wallet.",
        icon: "fa-solid fa-wallet",
      },
      {
        id: "maya",
        label: "Maya",
        description: "Pay using your Maya wallet.",
        icon: "fa-solid fa-wallet",
      },
      {
        id: "coinsph",
        label: "coins.ph",
        description: "Pay using your coins.ph wallet.",
        icon: "fa-solid fa-wallet",
      },
      {
        id: "grabpay",
        label: "GrabPay",
        description: "Pay using your GrabPay wallet.",
        icon: "fa-solid fa-wallet",
      },
    ],
  },
  {
    id: "bank",
    label: "Online Bank Transfer",
    methods: [
      {
        id: "bpi",
        label: "BPI",
        description: "Pay through BPI online banking.",
        icon: "fa-solid fa-building-columns",
      },
      {
        id: "bdo",
        label: "BDO",
        description: "Pay through BDO via Brankas.",
        icon: "fa-solid fa-building-columns",
      },
      {
        id: "qrph",
        label: "QRPh",
        description: "Pay through QR Ph.",
        icon: "fa-solid fa-qrcode",
      },
      {
        id: "unionbank",
        label: "UnionBank",
        description: "Pay through UnionBank online banking.",
        icon: "fa-solid fa-building-columns",
      },
      {
        id: "landbank",
        label: "Landbank",
        description: "Pay through Landbank via Brankas.",
        icon: "fa-solid fa-building-columns",
      },
    ],
  },
  {
    id: "bills",
    label: "Online Bills Payment",
    methods: [
      {
        id: "robinsonsbank",
        label: "Robinsons Bank",
        description: "Pay through Robinsons Bank bills payment.",
        icon: "fa-solid fa-receipt",
      },
    ],
  },
];

export const PAYNAMICS_PAYMENT_METHODS: PaynamicsPaymentMethod[] =
  PAYNAMICS_PAYMENT_GROUPS.flatMap((group) => group.methods);

export const PAYNAMICS_PROVIDER_LABELS: Record<string, string> = {
  cc: "Credit / Debit Card",
  installment: "Installment (Non-Credit Card)",
  billease: "Billease",
  ewallet: "E-Wallet",
  gc: "GCash",
  gcash: "GCash",
  maya: "Maya",
  paymaya: "Maya",
  coinsph: "coins.ph",
  grabpay: "GrabPay",
  bn: "Online Bank Transfer",
  bpi: "BPI",
  bdo: "BDO",
  qrph: "QRPh",
  unionbank: "UnionBank",
  landbank: "Landbank",
  ecpay: "Online Bills Payment",
  robinsonsbank: "Robinsons Bank",
};

export function getPaynamicsPaymentLabel(methodId: string) {
  const id = methodId.trim().toLowerCase().replace(/^paynamics[-_]/, "");
  return PAYNAMICS_PROVIDER_LABELS[id] ?? methodId;
}

export function formatPaynamicsPaymentMethod(methodId: string) {
  return `Paynamics-${methodId}`;
}
