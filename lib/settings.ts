import { cache } from "react";
import prisma from "@/lib/prisma";

export type SiteSettings = Record<string, string>;

const SECRET_SETTING_KEYS = new Set([
  "GEMINI_API_KEY",
  "SMTP_PASS",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "MAILGUN_API_KEY",
  "MAILGUN_WEBHOOK_SIGNING_KEY",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_APP_SECRET",
  "WHATSAPP_WEBHOOK_VERIFY_TOKEN",
]);

/**
 * Identifies secret or credential keys that must never be exposed to browsers
 * or non-ADMIN roles.
 */
export function isSecretSettingKey(rawKey: string): boolean {
  const key = rawKey.trim();
  if (!key) return false;
  if (SECRET_SETTING_KEYS.has(key)) return true;
  return /(_SECRET|_TOKEN|_PASS|_PASSWORD|_API_KEY|_PRIVATE_KEY|_SIGNING_KEY)$/i.test(key);
}

const PUBLIC_EXACT_KEYS = new Set([
  "site_logo",
  "site_name",
  "NAVBAR_CONFIG",
  "SUPPORT_PHONE",
  "SUPPORT_EMAIL",
  "SUPPORT_ADDRESS",
  "SUPPORT_WHATSAPP",
  "ga_id",
]);

const PUBLIC_KEY_PREFIXES = [
  "contact_",
  "social_",
  "footer_",
  "hero_",
  "stats_",
  "about_",
  "services_",
  "process_",
  "features_",
  "testimonials_",
  "articles_",
  "calendar_",
  "guidance_",
  "cta_",
  "faq_",
  "theme_",
];

/**
 * Positive allowlist of settings keys that are safe to serialize into
 * public Client Component props (Next.js RSC flight payloads).
 * Never includes API keys, passwords, webhook secrets, SMTP/email configs,
 * internal booking configs, or raw HTML injection blocks.
 */
export function isPublicSettingKey(rawKey: string): boolean {
  const key = rawKey.trim();
  if (!key || isSecretSettingKey(key)) return false;
  if (PUBLIC_EXACT_KEYS.has(key)) return true;
  return PUBLIC_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Filters a full settings map down to ONLY explicitly approved public UI/contact keys.
 */
export function pickPublicSettings(settings: SiteSettings): SiteSettings {
  const safe: SiteSettings = {};
  for (const [key, value] of Object.entries(settings)) {
    if (isPublicSettingKey(key)) {
      safe[key] = value;
    }
  }
  return safe;
}

/**
 * Fetches all settings from the database as a key-value map (SERVER-ONLY).
 * Never pass the raw return value to a "use client" component; use
 * pickPublicSettings() or getPublicSettings() instead.
 */
export const getSettings = cache(async (): Promise<SiteSettings> => {
  try {
    const settings = await prisma.setting.findMany();
    return settings.reduce((acc: SiteSettings, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return {};
  }
});

/**
 * Fetches only public-safe settings for Client Components.
 */
export const getPublicSettings = cache(async (): Promise<SiteSettings> => {
  const all = await getSettings();
  return pickPublicSettings(all);
});

/**
 * Get a single setting value with a fallback default.
 * Reuses the request-cached settings map when possible.
 */
export async function getSetting(key: string, fallback: string = ""): Promise<string> {
  const settings = await getSettings();
  return settings[key] || fallback;
}
