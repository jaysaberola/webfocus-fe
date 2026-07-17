import type { PortalActiveSession, PortalProfileApproval } from "./types";

export const PORTAL_ACTIVE_SESSIONS: PortalActiveSession[] = [
  {
    id: "sess-current",
    device: "Windows · Chrome",
    location: "Pasig City, Metro Manila",
    ip: "203.177.42.18",
    lastActive: "Active now",
    current: true,
  },
  {
    id: "sess-mobile",
    device: "iPhone · Safari",
    location: "Makati City, Metro Manila",
    ip: "175.176.91.204",
    lastActive: "2 hours ago",
  },
  {
    id: "sess-tablet",
    device: "iPad · Safari",
    location: "Quezon City, Metro Manila",
    ip: "112.198.64.55",
    lastActive: "Yesterday, 9:14 PM",
  },
];

export const PORTAL_2FA_METHODS = [
  { id: "sms", label: "SMS OTP (+63 mobile on file)" },
  { id: "email", label: "Email OTP (business email)" },
] as const;

export function buildProfileApprovalRequest(summary: string): PortalProfileApproval {
  const now = new Date();
  return {
    reference: `APR-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`,
    submittedAt: now.toLocaleString("en-PH", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }),
    status: "Pending Admin Review",
    summary,
  };
}
