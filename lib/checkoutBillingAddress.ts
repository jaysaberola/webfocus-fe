import type { PublicCustomer } from "@/services/publicCustomerService";

export type CheckoutBillingAddress = {
  address_street: string;
  address_city: string;
  address_province: string;
  address_zip: string;
};

export const CHECKOUT_BILLING_FIELD_LABELS: Record<
  keyof CheckoutBillingAddress,
  string
> = {
  address_street: "Street address",
  address_city: "City",
  address_province: "Province / Region",
  address_zip: "ZIP / Postal code",
};

/** Paynamics max lengths from backend assertCustomerProfile */
export const CHECKOUT_BILLING_MAX: Record<keyof CheckoutBillingAddress, number> = {
  address_street: 100,
  address_city: 30,
  address_province: 30,
  address_zip: 12,
};

export function billingCityFromCustomer(customer: PublicCustomer | null | undefined) {
  return String(customer?.address_city || customer?.address_municipality || "").trim();
}

export function getMissingCheckoutBillingFields(
  customer: PublicCustomer | null | undefined
): Array<keyof CheckoutBillingAddress> {
  if (!customer) {
    return ["address_street", "address_city", "address_province", "address_zip"];
  }

  const values: CheckoutBillingAddress = {
    address_street: String(customer.address_street || "").trim(),
    address_city: billingCityFromCustomer(customer),
    address_province: String(customer.address_province || "").trim(),
    address_zip: String(customer.address_zip || "").trim(),
  };

  return (Object.keys(values) as Array<keyof CheckoutBillingAddress>).filter(
    (key) => !values[key]
  );
}

export function customerNeedsCheckoutBillingAddress(
  customer: PublicCustomer | null | undefined
) {
  return getMissingCheckoutBillingFields(customer).length > 0;
}

export function isCheckoutBillingValidationError(errors: unknown): boolean {
  if (!errors || typeof errors !== "object") return false;
  return Object.keys(errors as Record<string, unknown>).some((key) =>
    key.startsWith("address_")
  );
}

export function billingAddressFromCustomer(
  customer: PublicCustomer | null | undefined
): CheckoutBillingAddress {
  return {
    address_street: String(customer?.address_street || "").trim(),
    address_city: billingCityFromCustomer(customer),
    address_province: String(customer?.address_province || "").trim(),
    address_zip: String(customer?.address_zip || "").trim(),
  };
}

/** True when all Paynamics-required billing fields are non-empty. */
export function isCheckoutBillingAddressComplete(
  address: CheckoutBillingAddress | null | undefined
) {
  if (!address) return false;
  return (
    Boolean(address.address_street?.trim()) &&
    Boolean(address.address_city?.trim()) &&
    Boolean(address.address_province?.trim()) &&
    Boolean(address.address_zip?.trim())
  );
}
