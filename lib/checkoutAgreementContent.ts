export const CHECKOUT_AGREEMENT_SECTIONS = [
  {
    number: 1,
    title: "Purchase Agreement",
    paragraphs: [
      "This order creates a service request with WSI. All selected services are subject to provisioning validation, product availability, fraud prevention checks, billing confirmation, and admin approval before activation.",
      "The products listed in your cart define the scope of this purchase. Any domain, hosting, cloud, SSL, backup, security, or add-on service may require additional details from you before provisioning can begin.",
    ],
  },
  {
    number: 3,
    title: "Terms and Conditions",
    paragraphs: [
      "Billing terms, renewal schedules, cancellation rules, applicable taxes, domain registration rules, acceptable-use requirements, and service-level limitations apply based on the products selected.",
      "You agree to provide accurate account, billing, domain, contact, and technical information. WSI may pause or reject provisioning if required information is incomplete, suspicious, invalid, or conflicts with policy.",
      "Some services renew monthly, yearly, or one time depending on their product configuration. Add-ons may follow a different cycle from the base service where shown in the cart.",
    ],
  },
  {
    number: 4,
    title: "Privacy Policy",
    paragraphs: [
      "WSI may collect and process account, order, billing, domain, and technical information for service delivery, billing, customer support, compliance, security monitoring, audit, and legal requirements.",
      "Customer data is handled with reasonable administrative, technical, and operational safeguards. You are responsible for ensuring that information you submit is lawful, accurate, and authorized.",
    ],
  },
  {
    number: 5,
    title: "Payment and Provisioning",
    paragraphs: [
      "Payment submission does not guarantee immediate activation. Billing review and admin approval must finish before provisioning starts. WSI may contact you for clarification, supporting documents, or corrected information before completing the order.",
      "By accepting this agreement, you confirm that you reviewed the policy and contract, understand the order summary, and are authorized to continue with payment for the listed products.",
    ],
  },
] as const;

export const CHECKOUT_AGREEMENT_TERMS_LABEL =
  "I accept the Purchase Agreement, Terms & Conditions, and order contract for this cart.";

export const CHECKOUT_AGREEMENT_PRIVACY_LABEL =
  "I accept the Privacy Policy and authorize WSI to process my order information.";

/** @deprecated Use CHECKOUT_AGREEMENT_TERMS_LABEL + CHECKOUT_AGREEMENT_PRIVACY_LABEL */
export const CHECKOUT_AGREEMENT_ACCEPT_LABEL = CHECKOUT_AGREEMENT_TERMS_LABEL;
