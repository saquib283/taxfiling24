export interface WhatsAppConfig {
  phoneNumber: string;
  phoneNumberId: string;
  wabaId: string;
  accessToken: string;
  isConfigured: boolean;
  webhookVerifyToken?: string;
  appSecret?: string;
}

export interface SendWhatsAppParams {
  to: string;
  text?: string;
  templateName?: string;
  templateLanguage?: string;
  templateComponents?: any[];
  inquiryId?: string;
  campaignId?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
  code?: number;
  waId?: string;
}

/**
 * Normalizes phone numbers to standard E.164 digits without "+" for Meta WhatsApp API.
 * - Preserves explicit international numbers starting with "+" or "00" (10-15 digits).
 * - Prepends India country code "91" for local 10-digit Indian mobiles (6-9xxx) or 0-prefixed 11-digit mobiles.
 * - Rejects invalid/too-short/too-long inputs by returning "".
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  const trimmed = rawPhone.trim();
  const hasExplicitPlus = trimmed.startsWith("+");
  let digits = trimmed.replace(/\D/g, "");

  if (!digits) return "";

  // Strip international "00" dialing prefix
  if (!hasExplicitPlus && digits.startsWith("00") && digits.length >= 12) {
    digits = digits.slice(2);
    return digits.length >= 10 && digits.length <= 15 ? digits : "";
  }

  // Respect explicit international prefix (e.g., +1..., +44..., +91..., +971...)
  if (hasExplicitPlus) {
    return digits.length >= 10 && digits.length <= 15 ? digits : "";
  }

  // Standard 10-digit Indian mobile starting with 6-9 -> prepend 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  // 11-digit Indian mobile starting with 0 followed by 6-9 -> replace 0 with 91
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }

  // Already includes country code (11-15 digits, e.g., 9198..., 1415..., 447...)
  if (digits.length >= 11 && digits.length <= 15 && !digits.startsWith("0")) {
    return digits;
  }

  return "";
}

/**
 * Extracts normalized last 10 digits for flexible phone lookup across formatted DB fields.
 */
export function getPhoneSuffix10(rawPhone: string): string {
  const digits = (rawPhone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : "";
}

/**
 * Formats phone number for clean human-readable UI display.
 */
export function formatDisplayPhone(rawPhone: string): string {
  const normalized = normalizePhoneNumber(rawPhone);
  if (!normalized) return rawPhone || "N/A";

  if (normalized.startsWith("91") && normalized.length === 12) {
    return `+91 ${normalized.slice(2, 7)} ${normalized.slice(7)}`;
  }

  if (normalized.startsWith("1") && normalized.length === 11) {
    return `+1 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7)}`;
  }

  return `+${normalized}`;
}

/**
 * Builds a click-to-chat WhatsApp Web/App URL (wa.me) as an instant zero-friction fallback.
 */
export function buildWhatsAppWebUrl(phone: string, text?: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return "https://wa.me/";
  const baseUrl = `https://wa.me/${normalized}`;
  return text ? `${baseUrl}?text=${encodeURIComponent(text)}` : baseUrl;
}
