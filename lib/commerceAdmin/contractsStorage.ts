export type CommerceContractRecord = {
  id: string;
  title: string;
  validity: string;
  status: string;
};

const STORAGE_KEY = "wf_commerce_contracts";

export const DEFAULT_COMMERCE_CONTRACTS: CommerceContractRecord[] = [
  {
    id: "CTR-2026-001",
    title: "Enterprise Cloud SLA - Acme Corp Philippines",
    validity: "Valid: Jan 2026 - Jan 2027 (12 Months)",
    status: "Signed & Active",
  },
  {
    id: "CTR-2026-002",
    title: "Dedicated Hosting SLA - Manila Retail Group Inc.",
    validity: "Valid: Mar 2026 - Mar 2027 (12 Months)",
    status: "Signed & Active",
  },
];

export function readCommerceContracts(): CommerceContractRecord[] {
  if (typeof window === "undefined") return DEFAULT_COMMERCE_CONTRACTS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_COMMERCE_CONTRACTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_COMMERCE_CONTRACTS;
  } catch {
    return DEFAULT_COMMERCE_CONTRACTS;
  }
}

export function writeCommerceContracts(rows: CommerceContractRecord[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function addCommerceContract(row: Omit<CommerceContractRecord, "id">) {
  const current = readCommerceContracts();
  const next = [
    {
      id: `CTR-2026-${String(current.length + 1).padStart(3, "0")}`,
      ...row,
    },
    ...current,
  ];
  writeCommerceContracts(next);
  return next;
}
