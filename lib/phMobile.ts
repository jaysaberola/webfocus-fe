/** Philippine mobile: exactly 11 digits (09XXXXXXXXX) or +639XXXXXXXXX. */

export const PH_MOBILE_HINT = "Must be 11 digits (09XXXXXXXXX) or +639XXXXXXXXX.";

export function sanitizePhMobileInput(raw: string) {
  let value = String(raw ?? "").replace(/[^\d+]/g, "");
  if (value.includes("+")) {
    value = (value.startsWith("+") ? "+" : "") + value.replace(/\+/g, "");
  }

  if (value.startsWith("+")) return value.slice(0, 13);
  return value.replace(/\D/g, "").slice(0, 11);
}

export function isExactPhMobileInput(raw?: string | null) {
  const text = String(raw ?? "").trim();
  return /^09\d{9}$/.test(text) || /^\+639\d{9}$/.test(text);
}

export function normalizePhMobile(raw?: string | null) {
  const text = String(raw ?? "").trim();
  if (text.startsWith("+") && !/^\+639\d{0,9}$/.test(text) && text !== "+" && text !== "+6" && text !== "+63") {
    return "";
  }

  const digits = text.replace(/\D/g, "");
  if (!digits) return "";

  let local = digits;
  if (local.startsWith("63") && local.length === 12) local = local.slice(2);
  else if (local.startsWith("0") && local.length === 11) local = local.slice(1);

  if (!/^9\d{9}$/.test(local)) return "";
  return `+63${local}`;
}

export function isValidPhMobile(raw?: string | null) {
  return Boolean(normalizePhMobile(raw));
}

export function phMobileLocalDigits(raw?: string | null) {
  const normalized = normalizePhMobile(raw);
  if (normalized) return normalized.slice(3);
  return String(raw ?? "").replace(/\D/g, "").replace(/^63/, "").replace(/^0/, "").slice(0, 10);
}

export function phMobileError(raw?: string | null, required = true) {
  const text = String(raw ?? "").trim();
  if (!text) return required ? "Mobile number is required." : null;
  if (/[a-zA-Z]/.test(text)) return "Mobile number cannot contain letters.";
  if (isExactPhMobileInput(text)) return null;
  if (text.startsWith("+")) {
    return "Use +639XXXXXXXXX (13 characters).";
  }
  return "Mobile number must be 11 digits (09XXXXXXXXX) or +639XXXXXXXXX.";
}

export function phMobileLiveError(raw?: string | null) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  if (/[a-zA-Z]/.test(text)) return "Mobile number cannot contain letters.";
  if (isExactPhMobileInput(text)) return null;
  if (text.startsWith("+")) {
    return "Use +639XXXXXXXXX (13 characters).";
  }
  return "Mobile number must be 11 digits (09XXXXXXXXX) or +639XXXXXXXXX.";
}

export function phMobileMaxLength(raw?: string | null) {
  return String(raw ?? "").trim().startsWith("+") ? 13 : 11;
}

export function rejectLetterKey(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  altKey: boolean;
  preventDefault: () => void;
}) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (event.key.length === 1 && /[a-zA-Z]/.test(event.key)) {
    event.preventDefault();
  }
}
