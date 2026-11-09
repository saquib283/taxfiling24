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
 * Handles standard 10-digit Indian numbers, numbers with leading 0, and international numbers.
 */
export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return "";
  const digits = rawPhone.replace(/\D/g, "");

  // If 10 digits starting with 6-9, standard Indian mobile -> prepend 91
  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }

  // If 11 digits starting with 0 followed by 6-9 -> replace 0 with 91
  if (digits.length === 11 && digits.startsWith("0") && /^[6-9]/.test(digits.slice(1))) {
    return `91${digits.slice(1)}`;
  }

  // If 12 digits starting with 91 -> return as-is
  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  // If 10 digits starting with US area code (e.g. 555-141-5730) -> prepend 1
  if (digits.length === 10) {
    return `1${digits}`;
  }

  return digits;
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

