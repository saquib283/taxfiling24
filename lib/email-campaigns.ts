import crypto from "crypto";

export type EmailProvider = "SMTP" | "RESEND" | "MAILGUN";

export const EMAIL_PROVIDERS: EmailProvider[] = ["SMTP", "RESEND", "MAILGUN"];

export const EMAIL_SETTING_KEYS = [
  "EMAIL_PROVIDER",
  "EMAIL_FROM_NAME",
  "EMAIL_FROM_EMAIL",
  "EMAIL_REPLY_TO",
  "RESEND_API_KEY",
  "RESEND_AUDIENCE_ID",
  "RESEND_WEBHOOK_SECRET",
  "MAILGUN_API_KEY",
  "MAILGUN_DOMAIN",
  "MAILGUN_REGION",
  "MAILGUN_WEBHOOK_SIGNING_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "contact_email",
] as const;

export type SettingsMap = Partial<Record<(typeof EMAIL_SETTING_KEYS)[number], string>>;

export interface EmailProviderConfig {
  selectedProvider: EmailProvider;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  resendApiKey: string;
  resendAudienceId: string;
  resendWebhookSecret: string;
  mailgunApiKey: string;
  mailgunDomain: string;
  mailgunRegion: "US" | "EU";
  mailgunWebhookSigningKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
}

export interface ProviderStatuses {
  SMTP: boolean;
  RESEND: boolean;
  MAILGUN: boolean;
}

const DEFAULT_FROM_NAME = "TaxFiling24";

export function normalizeEmailProvider(value?: string | null): EmailProvider {
  const normalized = value?.toUpperCase();
  if (normalized === "RESEND" || normalized === "MAILGUN" || normalized === "SMTP") {
    return normalized;
  }

  return "SMTP";
}

export function normalizeCampaignProvider(
  value?: string | null
): EmailProvider | "WHATSAPP" {
  const normalized = value?.toUpperCase();
  if (normalized === "WHATSAPP") return "WHATSAPP";
  return normalizeEmailProvider(normalized);
}

export function settingsToMap(
  rows: Array<{ key: string; value: string }>
): Record<string, string> {
  return rows.reduce<Record<string, string>>((acc, row) => {
    acc[row.key] = row.value;
    return acc;
  }, {});
}

export function resolveEmailProviderConfig(
  rawSettings: Record<string, string | undefined>
): EmailProviderConfig {
  const fromEmail =
    rawSettings.EMAIL_FROM_EMAIL ||
    process.env.EMAIL_FROM_EMAIL ||
    rawSettings.contact_email ||
    (rawSettings.SMTP_USER?.includes("@") ? rawSettings.SMTP_USER : "") ||
    (process.env.SMTP_USER?.includes("@") ? process.env.SMTP_USER : "") ||
    "";

  const replyTo =
    rawSettings.EMAIL_REPLY_TO ||
    process.env.EMAIL_REPLY_TO ||
    rawSettings.contact_email ||
    fromEmail;

  const resendApiKey =
    rawSettings.RESEND_API_KEY ||
    process.env.RESEND_API_KEY ||
    (rawSettings.SMTP_PASS?.startsWith("re_") ? rawSettings.SMTP_PASS : "") ||
    (process.env.SMTP_PASS?.startsWith("re_") ? process.env.SMTP_PASS : "") ||
    "";

  const configuredProvider = rawSettings.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER;
  const selectedProvider = configuredProvider
    ? normalizeEmailProvider(configuredProvider)
    : resendApiKey
    ? "RESEND"
    : "SMTP";

  return {
    selectedProvider,
    fromName:
      rawSettings.EMAIL_FROM_NAME || process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME,
    fromEmail,
    replyTo,
    resendApiKey,
    resendAudienceId:
      rawSettings.RESEND_AUDIENCE_ID || process.env.RESEND_AUDIENCE_ID || "",
    resendWebhookSecret:
      rawSettings.RESEND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET || "",
    mailgunApiKey: rawSettings.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY || "",
    mailgunDomain: rawSettings.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || "",
    mailgunRegion:
      (rawSettings.MAILGUN_REGION || process.env.MAILGUN_REGION || "US").toUpperCase() ===
      "EU"
        ? "EU"
        : "US",
    mailgunWebhookSigningKey:
      rawSettings.MAILGUN_WEBHOOK_SIGNING_KEY ||
      process.env.MAILGUN_WEBHOOK_SIGNING_KEY ||
      "",
    smtpHost: rawSettings.SMTP_HOST || process.env.SMTP_HOST || "",
    smtpPort: rawSettings.SMTP_PORT || process.env.SMTP_PORT || "",
    smtpUser: rawSettings.SMTP_USER || process.env.SMTP_USER || "",
    smtpPass: rawSettings.SMTP_PASS || process.env.SMTP_PASS || "",
  };
}

export function getProviderStatuses(config: EmailProviderConfig): ProviderStatuses {
  return {
    SMTP: Boolean(
      config.smtpHost && config.smtpPort && config.smtpUser && config.smtpPass
    ),
    RESEND: Boolean(config.resendApiKey && config.fromEmail),
    MAILGUN: Boolean(config.mailgunApiKey && config.mailgunDomain && config.fromEmail),
  };
}

export function getProviderLabel(provider: EmailProvider | "WHATSAPP" | string): string {
  switch (provider) {
    case "WHATSAPP":
      return "WhatsApp Cloud API";
    case "RESEND":
      return "Resend";
    case "MAILGUN":
      return "Mailgun";
    case "SMTP":
    default:
      return "SMTP";
  }
}

export function getBaseUrl(request?: Request): string {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }

  // Never trust incoming Host/X-Forwarded-Host headers in production
  if (request && process.env.NODE_ENV !== "production") {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const host = (forwardedHost || request.headers.get("host") || "").trim();
    const protocol = forwardedProto === "https" ? "https" : "http";

    if (host && /^[a-zA-Z0-9.-]+(:\d+)?$/.test(host)) {
      return `${protocol}://${host}`;
    }
  }

  return "https://taxfiling24.com";
}

export function buildWebhookUrls(request: Request): Record<EmailProvider, string> {
  const baseUrl = getBaseUrl(request);

  return {
    SMTP: "",
    RESEND: `${baseUrl}/api/webhooks/email/resend`,
    MAILGUN: `${baseUrl}/api/webhooks/email/mailgun`,
  };
}

export type CampaignMetricUpdate = {
  bouncedCount?: number;
  clickedCount?: number;
  complaintCount?: number;
  deliveredCount?: number;
  failedCount?: number;
  openedCount?: number;
  readCount?: number;
  unsubscribedCount?: number;
};

export function mapResendEventToMetrics(eventType: string): CampaignMetricUpdate {
  switch (eventType) {
    case "email.delivered":
      return { deliveredCount: 1 };
    case "email.opened":
      return { openedCount: 1, readCount: 1 };
    case "email.clicked":
      return { clickedCount: 1 };
    case "email.bounced":
      return { bouncedCount: 1, failedCount: 1 };
    case "email.complained":
      return { complaintCount: 1 };
    case "email.unsubscribed":
      return { unsubscribedCount: 1 };
    default:
      return {};
  }
}

export function mapMailgunEventToMetrics(eventType: string): CampaignMetricUpdate {
  switch (eventType) {
    case "delivered":
      return { deliveredCount: 1 };
    case "opened":
      return { openedCount: 1, readCount: 1 };
    case "clicked":
      return { clickedCount: 1 };
    case "complained":
      return { complaintCount: 1 };
    case "unsubscribed":
      return { unsubscribedCount: 1 };
    case "permanent_fail":
      return { bouncedCount: 1, failedCount: 1 };
    case "temporary_fail":
    case "failed":
    case "rejected":
      return { failedCount: 1 };
    default:
      return {};
  }
}

export function shouldSuppressSubscriber(
  provider: EmailProvider,
  eventType: string
): boolean {
  if (provider === "RESEND") {
    return ["email.bounced", "email.complained", "email.unsubscribed"].includes(
      eventType
    );
  }

  return ["complained", "unsubscribed", "permanent_fail"].includes(eventType);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export interface WrapEmailOptions {
  content: string;
  preheader?: string | null;
  subject?: string;
  fromName?: string;
  recipientEmail?: string;
  baseUrl?: string;
}

function getUnsubscribeKey(): Buffer {
  const dedicated = process.env.UNSUBSCRIBE_SECRET?.trim();
  if (dedicated) {
    return Buffer.from(dedicated, "utf8");
  }
  const jwtSecret = process.env.JWT_SECRET?.trim();
  if (!jwtSecret) {
    throw new Error("UNSUBSCRIBE_SECRET or JWT_SECRET environment variable is required to sign unsubscribe tokens.");
  }
  // Domain-separated derived key so raw JWT_SECRET is never reused directly
  return crypto
    .createHmac("sha256", jwtSecret)
    .update("taxfiling24:unsubscribe-key:v1")
    .digest();
}

export function createUnsubscribeToken(email: string): string {
  const key = getUnsubscribeKey();
  return crypto
    .createHmac("sha256", key)
    .update(`unsubscribe:${email.trim().toLowerCase()}`)
    .digest("hex")
    .slice(0, 32);
}

export function buildUnsubscribeUrl(recipientEmail: string, baseUrl?: string): string {
  const origin = (baseUrl || getBaseUrl()).replace(/\/+$/, "");
  const normalized = recipientEmail.trim().toLowerCase();
  const token = createUnsubscribeToken(normalized);
  return `${origin}/unsubscribe?email=${encodeURIComponent(normalized)}&token=${token}`;
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  try {
    const cleanToken = token.trim();
    const expected = createUnsubscribeToken(email);
    const expectedBuf = Buffer.from(expected, "utf8");
    const actualBuf = Buffer.from(cleanToken, "utf8");
    if (expectedBuf.length === actualBuf.length && crypto.timingSafeEqual(expectedBuf, actualBuf)) {
      return true;
    }

    // Backwards-compatible fallback for already-sent emails when dedicated UNSUBSCRIBE_SECRET is not set
    const jwtSecret = process.env.JWT_SECRET?.trim();
    if (!process.env.UNSUBSCRIBE_SECRET?.trim() && jwtSecret) {
      const legacy = crypto
        .createHmac("sha256", jwtSecret)
        .update(`unsubscribe:${email.trim().toLowerCase()}`)
        .digest("hex")
        .slice(0, 32);
      const legacyBuf = Buffer.from(legacy, "utf8");
      if (legacyBuf.length === actualBuf.length && crypto.timingSafeEqual(legacyBuf, actualBuf)) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

export function wrapEmailHtml(options: WrapEmailOptions): string {
  const {
    content,
    preheader,
    subject = "TaxFiling24 Update",
    fromName = DEFAULT_FROM_NAME,
    recipientEmail,
    baseUrl = getBaseUrl(),
  } = options;

  const cleanBaseUrl = baseUrl.replace(/\/+$/, "");
  const preheaderHtml = preheader?.trim()
    ? `<div style="display:none!important;visibility:hidden;mso-hide:all;font-size:1px;color:#f8fafc;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(
        preheader.trim()
      )}</div>`
    : "";

  const unsubscribeUrl = recipientEmail
    ? buildUnsubscribeUrl(recipientEmail, cleanBaseUrl)
    : `${cleanBaseUrl}/unsubscribe`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(subject)}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; }
    p, li, td { font-size: 15px; line-height: 1.6; color: #334155; }
    h1, h2, h3, h4 { color: #0A2540; font-weight: 700; margin-top: 24px; margin-bottom: 12px; }
    h1 { font-size: 24px; line-height: 1.3; }
    h2 { font-size: 20px; line-height: 1.35; }
    h3 { font-size: 17px; line-height: 1.4; }
    a { color: #0A2540; text-decoration: underline; }
    hr { border: none; border-top: 1px solid #E2E8F0; margin: 24px 0; }
    blockquote { margin: 16px 0; padding: 12px 18px; border-left: 4px solid #D4AF37; background-color: #F8FAFC; color: #475569; font-style: italic; }
    ul, ol { padding-left: 20px; margin: 16px 0; }
    li { margin-bottom: 6px; }
    .email-container { max-width: 600px; margin: 0 auto; width: 100%; }
    .email-card { background: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 16px rgba(10, 37, 64, 0.05); }
    .email-header { background: #0A2540; padding: 24px 32px; text-align: left; border-bottom: 3px solid #D4AF37; }
    .email-header h2 { color: #FFFFFF; margin: 0; font-size: 20px; letter-spacing: -0.02em; }
    .email-body { padding: 32px; }
    .email-footer { padding: 24px 32px; background: #F8FAFC; text-align: center; border-top: 1px solid #E2E8F0; }
    .email-footer p { font-size: 12px; line-height: 1.5; color: #64748B; margin: 4px 0; }
    .email-footer a { color: #64748B; text-decoration: underline; }
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; padding: 8px !important; }
      .email-body { padding: 20px !important; }
      .email-header { padding: 18px 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #F8FAFC;">
  ${preheaderHtml}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center">
        <table class="email-container" role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
          <tr>
            <td>
              <div class="email-card">
                <div class="email-header">
                  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                    <tr>
                      <td>
                        <h2 style="color: #FFFFFF; margin: 0; font-size: 20px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                          TaxFiling<span style="color: #D4AF37;">24</span>
                        </h2>
                      </td>
                      <td align="right">
                        <span style="color: #94A3B8; font-size: 11px; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">
                          ${escapeHtml(fromName)}
                        </span>
                      </td>
                    </tr>
                  </table>
                </div>

                <div class="email-body">
                  ${content}
                </div>

                <div class="email-footer">
                  <p style="font-weight: 600; color: #475569; font-size: 12px;">TaxFiling24 &bull; Business, Tax &amp; Compliance Advisory</p>
                  <p>You received this message because you are a registered user or newsletter subscriber.</p>
                  <p style="margin-top: 12px;">
                    <a href="${escapeHtml(unsubscribeUrl)}" target="_blank" style="color: #64748B;">Unsubscribe from these emails</a>
                    &nbsp;&bull;&nbsp;
                    <a href="${escapeHtml(cleanBaseUrl)}/contact" target="_blank" style="color: #64748B;">Contact Support</a>
                  </p>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function withPreheader(html: string, preheader?: string | null): string {
  if (html.includes("<html") || html.includes("<!DOCTYPE")) {
    if (!preheader?.trim()) return html;
    const preheaderDiv = `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(
      preheader
    )}</div>`;
    return html.replace(/<body[^>]*>/i, `$&${preheaderDiv}`);
  }

  return wrapEmailHtml({
    content: html,
    preheader,
  });
}

export function chunkValues<T>(values: T[], size: number): Array<T[]> {
  if (size <= 0) {
    return [values];
  }

  const chunks: Array<T[]> = [];

  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }

  return chunks;
}
