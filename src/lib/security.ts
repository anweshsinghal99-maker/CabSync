import { createHash, createHmac, timingSafeEqual } from "crypto";

export const ALLOWED_TICKET_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export type AllowedTicketMime = typeof ALLOWED_TICKET_MIMES[number];

export const MAX_TICKET_BYTES = 4 * 1024 * 1024; // 4 MB strict limit

/**
 * Normalizes and extracts digits/alphanumeric characters from a raw PNR string.
 */
export function normalizePNR(pnr: string): string {
  const digitsOnly = pnr.replace(/\D/g, "");
  if (digitsOnly.length >= 6) {
    return digitsOnly;
  }
  return pnr.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

/**
 * IRCTC PNR Privacy & Data Masking:
 * Hashing full PNR for duplicate detection and masking the display string
 * to show only the last 3 digits (e.g., PNR: •••••••842).
 * Prevents unauthorized third parties from querying or modifying tickets online.
 */
export function maskPNR(pnr: string): { display: string; hash: string } {
  const normalized = normalizePNR(pnr || "0000000000");
  const unmaskedLength = 3;
  const maskedCount = Math.max(0, normalized.length - unmaskedLength);
  const display = `PNR: ${"•".repeat(maskedCount)}${normalized.slice(-unmaskedLength)}`;
  const hash = createHash("sha256").update(normalized).digest("hex");
  return { display, hash };
}

/**
 * XSS Sanitization:
 * Strips HTML tags, script vectors, and malicious protocols,
 * removes non-printable / control characters, and caps message length to 280 chars.
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

/**
 * Validates UPI ID format against standard RFC/NPCI VPA schema.
 * Prevents UPI URI parameter injection and rogue payee redirects.
 */
export function validUpiId(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  return /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
}

/**
 * Deterministically generates a 4-digit Pod Handshake Code (e.g., SYNC-4921)
 * visible only to joined members of that pod for physical cab boarding verification.
 */
export function generatePodHandshakeCode(podId: string): string {
  let hash = 0;
  for (let i = 0; i < podId.length; i++) {
    hash = (hash * 31 + podId.charCodeAt(i)) >>> 0;
  }
  const pin = String(hash % 10000).padStart(4, "0");
  return `SYNC-${pin}`;
}

/**
 * Institutional email domain verification.
 * Accepts .edu, .ac.in, or @thapar.edu addresses.
 */
export function isCampusEmailAllowed(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const normalized = email.trim().toLowerCase();
  return (
    /@(?:[a-z0-9-]+\.)*(?:edu|ac\.in)$/i.test(normalized) ||
    /@thapar\.edu$/i.test(normalized)
  );
}

const getSessionSecret = (): string =>
  process.env.SESSION_SECRET ||
  process.env.GEMINI_API_KEY ||
  "cabsync-internal-fallback-secret-2026";

/**
 * Creates an HMAC-SHA256 signature for signed campus session tokens.
 */
export function signSession(payload: string): string {
  const secret = getSessionSecret();
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

/**
 * Constant-time verification of signed campus session tokens to prevent timing attacks.
 */
export function verifySession(payload: string, signature: string): boolean {
  try {
    const expected = signSession(payload);
    const sigBuffer = Buffer.from(signature, "base64url");
    const expBuffer = Buffer.from(expected, "base64url");
    if (sigBuffer.length !== expBuffer.length) return false;
    return timingSafeEqual(sigBuffer, expBuffer);
  } catch {
    return false;
  }
}
