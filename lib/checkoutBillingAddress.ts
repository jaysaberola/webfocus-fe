import { findPlaceByCity } from "@/lib/commerceAdmin/phAddressCatalog";
import {
  usableLastName,
  type PublicCustomer,
} from "@/services/publicCustomerService";

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

export const CHECKOUT_NAME_MAX = 50;

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

export function checkoutPersonName(customer: PublicCustomer | null | undefined): {
  fname: string;
  lname: string;
} {
  const company = String(customer?.mname || "").trim();
  let fname = String(customer?.fname || "").trim();
  let lname = usableLastName(customer?.lname, company);
  const parts = fname.split(/\s+/).filter(Boolean);
  if (!lname && parts.length > 1) {
    const rest = parts.slice(1).join(" ");
    if (usableLastName(rest, company)) {
      fname = parts[0];
      lname = rest;
    } else {
      fname = parts[0];
    }
  }
  return { fname, lname };
}

export function customerNeedsCheckoutName(
  customer: PublicCustomer | null | undefined
) {
  const { fname, lname } = checkoutPersonName(customer);
  return !fname || !lname;
}

export function customerNeedsCheckoutProfile(
  customer: PublicCustomer | null | undefined
) {
  return !customer || customerNeedsCheckoutName(customer) || customerNeedsCheckoutBillingAddress(customer);
}

export function checkoutProfileNotice(customer: PublicCustomer | null | undefined) {
  const needsName = !customer || customerNeedsCheckoutName(customer);
  const needsAddress = !customer || customerNeedsCheckoutBillingAddress(customer);
  if (needsName && needsAddress) {
    return "Add your first name, last name, and billing address to continue to Paynamics.";
  }
  if (needsName) {
    return "Add your first name and last name to continue to Paynamics.";
  }
  return "Add your billing address to continue to Paynamics.";
}

export function isCheckoutBillingValidationError(errors: unknown, message?: unknown): boolean {
  if (
    typeof message === "string" &&
    /(billing address|first name|last name)/i.test(message)
  ) {
    return true;
  }
  if (!errors || typeof errors !== "object") return false;
  return Object.keys(errors as Record<string, unknown>).some(
    (key) => key.startsWith("address_") || key === "fname" || key === "lname"
  );
}

export function paynamicsPersonName(customer: PublicCustomer | null | undefined): {
  fname: string;
  lname: string;
} {
  return checkoutPersonName(customer);
}

export function mergeCustomerAddress(
  base: PublicCustomer | null | undefined,
  next: PublicCustomer,
): PublicCustomer {
  return {
    ...(base || {}),
    ...next,
    fname: next.fname ?? base?.fname,
    lname: next.lname ?? base?.lname,
    address_street: next.address_street || base?.address_street,
    address_city: next.address_city || base?.address_city,
    address_municipality: next.address_municipality || base?.address_municipality,
    address_province: next.address_province || base?.address_province,
    address_zip: next.address_zip || base?.address_zip,
  };
}

export function billingAddressFromCustomer(
  customer: PublicCustomer | null | undefined
): CheckoutBillingAddress {
  const raw: CheckoutBillingAddress = {
    address_street: String(customer?.address_street || "").trim(),
    address_city: billingCityFromCustomer(customer),
    address_province: String(customer?.address_province || "").trim(),
    address_zip: String(customer?.address_zip || "").trim(),
  };
  const place = findPlaceByCity(raw.address_city, raw.address_province);
  if (!place) return raw;
  return {
    ...raw,
    address_city: place.city,
    address_province: place.province,
    address_zip: raw.address_zip || place.zip,
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
