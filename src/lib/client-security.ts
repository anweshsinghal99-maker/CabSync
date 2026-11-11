/**
 * Client-safe security and sanitization utilities.
 * Uses browser-compatible primitives without Node.js crypto module.
 */

export function sanitizeChatMessage(input: unknown): string {
  if (typeof input !== "string") {
    input = String(input ?? "");
  }
  return (input as string)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")
    .replace(/vbscript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 280);
}

export function validUpiId(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}

export function generatePodHandshakeCode(podId: string): string {
  let hash = 0;
  for (let i = 0; i < podId.length; i++) {
    hash = (hash * 31 + podId.charCodeAt(i)) >>> 0;
  }
  const pin = String(hash % 10000).padStart(4, "0");
  return `SYNC-${pin}`;
}

export function isCampusEmailAllowed(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return (
    /@(?:[a-z0-9-]+\.)*(?:edu|ac\.in)$/i.test(normalized) ||
    /@thapar\.edu$/i.test(normalized)
  );
}

export function maskPNRDisplay(pnr: string): string {
  const digits = pnr.replace(/\D/g, "");
  const normalized = digits.length >= 6 ? digits : pnr.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const unmaskedLength = 3;
  const maskedCount = Math.max(0, normalized.length - unmaskedLength);
  return `PNR: ${"•".repeat(maskedCount)}${normalized.slice(-unmaskedLength)}`;
}
