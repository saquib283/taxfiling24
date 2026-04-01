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
    rawSettings.contact_email ||
    process.env.EMAIL_FROM_EMAIL ||
    rawSettings.SMTP_USER ||
    process.env.SMTP_USER ||
    "";

  const replyTo =
    rawSettings.EMAIL_REPLY_TO ||
    rawSettings.contact_email ||
    process.env.EMAIL_REPLY_TO ||
    fromEmail;

  return {
    selectedProvider: normalizeEmailProvider(
      rawSettings.EMAIL_PROVIDER || process.env.EMAIL_PROVIDER
    ),
    fromName:
      rawSettings.EMAIL_FROM_NAME || process.env.EMAIL_FROM_NAME || DEFAULT_FROM_NAME,
    fromEmail,
    replyTo,
    resendApiKey: rawSettings.RESEND_API_KEY || process.env.RESEND_API_KEY || "",
    resendAudienceId:
      rawSettings.RESEND_AUDIENCE_ID || process.env.RESEND_AUDIENCE_ID || "",
    resendWebhookSecret:
      rawSettings.RESEND_WEBHOOK_SECRET || process.env.RESEND_WEBHOOK_SECRET || "",
    mailgunApiKey: rawSettings.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY || "",
    mailgunDomain: rawSettings.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || "",
    mailgunRegion: (rawSettings.MAILGUN_REGION ||
      process.env.MAILGUN_REGION ||
      "US").toUpperCase() === "EU"
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

export function getProviderStatuses(
  config: EmailProviderConfig
): ProviderStatuses {
  return {
    SMTP: Boolean(
      config.smtpHost && config.smtpPort && config.smtpUser && config.smtpPass
    ),
    RESEND: Boolean(config.resendApiKey && config.fromEmail),
    MAILGUN: Boolean(config.mailgunApiKey && config.mailgunDomain && config.fromEmail),
  };
}

export function getProviderLabel(provider: EmailProvider): string {
  switch (provider) {
    case "RESEND":
      return "Resend";
    case "MAILGUN":
      return "Mailgun";
    case "SMTP":
    default:
      return "SMTP";
  }
}

export function getBaseUrl(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost || request.headers.get("host");
  const protocol = forwardedProto || "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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

export function withPreheader(html: string, preheader?: string | null): string {
  if (!preheader?.trim()) {
    return html;
  }

  return [
    `<div style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;">${escapeHtml(
      preheader
    )}</div>`,
    html,
  ].join("");
}

export function chunkValues<T>(values: T[], size: number): T[][]
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
