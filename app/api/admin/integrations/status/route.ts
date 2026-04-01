import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  getProviderStatuses,
  resolveEmailProviderConfig,
  settingsToMap,
} from "@/lib/email-campaigns";

/**
 * Returns a map of integration key -> boolean (configured or not).
 * Never returns actual values — only presence checks.
 */
export async function GET() {
  try {
    const statuses: Record<string, boolean> = {};

    const settings = await prisma.setting.findMany({
      where: {
        key: {
          in: [
            "ga_id",
            "GEMINI_API_KEY",
            "RESEND_API_KEY",
            "MAILGUN_API_KEY",
            "MAILGUN_DOMAIN",
            "MAILGUN_REGION",
            "MAILGUN_WEBHOOK_SIGNING_KEY",
            "EMAIL_FROM_EMAIL",
            "SMTP_HOST",
            "SMTP_PORT",
            "SMTP_USER",
            "SMTP_PASS",
            "contact_email",
          ],
        },
      },
    });
    const settingsMap = settingsToMap(settings);
    const providerConfig = resolveEmailProviderConfig(settingsMap);
    const providerStatuses = getProviderStatuses(providerConfig);

    statuses["SMTP_HOST"] = !!providerConfig.smtpHost;
    statuses["SMTP_PORT"] = !!providerConfig.smtpPort;
    statuses["SMTP_USER"] = !!providerConfig.smtpUser;
    statuses["SMTP_PASS"] = !!providerConfig.smtpPass;
    statuses["RESEND_API_KEY"] = !!providerConfig.resendApiKey;
    statuses["MAILGUN_API_KEY"] = !!providerConfig.mailgunApiKey;
    statuses["MAILGUN_DOMAIN"] = !!providerConfig.mailgunDomain;
    statuses["DATABASE_URL"] = !!process.env.DATABASE_URL;
    statuses["EMAIL_PROVIDER_SMTP"] = providerStatuses.SMTP;
    statuses["EMAIL_PROVIDER_RESEND"] = providerStatuses.RESEND;
    statuses["EMAIL_PROVIDER_MAILGUN"] = providerStatuses.MAILGUN;

    for (const s of settings) {
      statuses[s.key] = !!s.value && s.value.trim() !== "";
    }

    if (!statuses["GEMINI_API_KEY"]) {
      statuses["GEMINI_API_KEY"] = !!process.env.GEMINI_API_KEY;
    }

    return NextResponse.json(statuses);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to read integrations" },
      { status: 500 }
    );
  }
}
