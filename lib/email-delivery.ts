import nodemailer from "nodemailer";
import prisma from "@/lib/prisma";
import {
  EMAIL_SETTING_KEYS,
  getProviderStatuses,
  normalizeEmailProvider,
  resolveEmailProviderConfig,
  settingsToMap,
  type EmailProvider,
} from "@/lib/email-campaigns";

export interface TransactionalEmailInput {
  html: string;
  replyTo?: string;
  subject: string;
  tags?: Array<{ name: string; value: string }>;
  text?: string;
  to: string;
}

const VALID_DOMAIN_REGEX =
  /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

export function isBlockedInternalHost(host: string): boolean {
  const normalized = host.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!normalized) return true;
  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized === "::" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal")
  ) {
    return true;
  }
  // Block loopback, RFC1918 private, and cloud metadata IPv4 literals
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(normalized)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(normalized)) return true;
  if (/^(fc|fd|fe80:)/i.test(normalized)) return true;
  return false;
}

export function sanitizeHeaderText(value: string): string {
  return value.replace(/[\r\n"<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

function buildFromHeader(fromName: string, fromEmail: string) {
  const cleanEmail = fromEmail.replace(/[\r\n<>]/g, "").trim();
  const cleanName = sanitizeHeaderText(fromName);
  return cleanName ? `"${cleanName}" <${cleanEmail}>` : cleanEmail;
}

async function sendWithSmtp(
  input: TransactionalEmailInput,
  config: ReturnType<typeof resolveEmailProviderConfig>
) {
  const port = Number.parseInt(config.smtpPort, 10);

  if (!Number.isFinite(port) || port < 1 || port > 65535) {
    throw new Error("SMTP port is missing or invalid.");
  }

  if (isBlockedInternalHost(config.smtpHost)) {
    throw new Error("SMTP host points to a restricted internal address.");
  }

  const transporter = nodemailer.createTransport({
    auth: {
      pass: config.smtpPass,
      user: config.smtpUser,
    },
    host: config.smtpHost.trim(),
    port,
    secure: port === 465,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 8000,
  });

  const result = await transporter.sendMail({
    from: buildFromHeader(config.fromName, config.fromEmail || config.smtpUser),
    html: input.html,
    replyTo: input.replyTo || config.replyTo || undefined,
    subject: input.subject,
    text: input.text || undefined,
    to: input.to,
  });

  return result.messageId || null;
}

async function sendWithResend(
  input: TransactionalEmailInput,
  config: ReturnType<typeof resolveEmailProviderConfig>
) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from: buildFromHeader(config.fromName, config.fromEmail),
      html: input.html,
      reply_to: input.replyTo || config.replyTo || undefined,
      subject: input.subject,
      tags: input.tags,
      text: input.text || undefined,
      to: [input.to],
    }),
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    signal: AbortSignal.timeout(8000),
  });

  const data = (await response.json()) as {
    error?: { message?: string };
    id?: string;
  };

  if (!response.ok) {
    throw new Error(data.error?.message || "Resend rejected the email request.");
  }

  return data.id || null;
}

async function sendWithMailgun(
  input: TransactionalEmailInput,
  config: ReturnType<typeof resolveEmailProviderConfig>
) {
  const cleanDomain = config.mailgunDomain.trim();
  if (!VALID_DOMAIN_REGEX.test(cleanDomain)) {
    throw new Error("Mailgun domain is invalid.");
  }
  const apiHost =
    config.mailgunRegion === "EU" ? "api.eu.mailgun.net" : "api.mailgun.net";
  const endpoint = `https://${apiHost}/v3/${encodeURIComponent(cleanDomain)}/messages`;
  const formData = new FormData();

  formData.set("from", buildFromHeader(config.fromName, config.fromEmail));
  formData.set("to", input.to);
  formData.set("subject", input.subject);
  formData.set("html", input.html);
  formData.set("o:tracking", "yes");
  formData.set("o:tracking-clicks", "yes");
  formData.set("o:tracking-opens", "yes");

  if (input.text) {
    formData.set("text", input.text);
  }

  if (input.replyTo || config.replyTo) {
    formData.set("h:Reply-To", input.replyTo || config.replyTo);
  }

  input.tags?.forEach((tag) => {
    formData.set(`v:${tag.name}`, tag.value);
  });

  const auth = Buffer.from(`api:${config.mailgunApiKey}`).toString("base64");
  const response = await fetch(endpoint, {
    body: formData,
    headers: {
      Authorization: `Basic ${auth}`,
    },
    method: "POST",
    signal: AbortSignal.timeout(8000),
  });

  const data = (await response.json()) as { id?: string; message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Mailgun rejected the email request.");
  }

  return data.id || null;
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const settings = await prisma.setting.findMany({
    where: {
      key: { in: [...EMAIL_SETTING_KEYS] },
    },
    select: {
      key: true,
      value: true,
    },
  });

  const config = resolveEmailProviderConfig(settingsToMap(settings));
  const provider = normalizeEmailProvider(config.selectedProvider);
  const statuses = getProviderStatuses(config);

  if (!config.fromEmail) {
    throw new Error("No sender email is configured for transactional emails.");
  }

  if (!statuses[provider]) {
    throw new Error(`${provider} is not fully configured for email sending.`);
  }

  switch (provider as EmailProvider) {
    case "RESEND":
      return {
        provider,
        providerMessageId: await sendWithResend(input, config),
      };
    case "MAILGUN":
      return {
        provider,
        providerMessageId: await sendWithMailgun(input, config),
      };
    case "SMTP":
    default:
      return {
        provider,
        providerMessageId: await sendWithSmtp(input, config),
      };
  }
}
