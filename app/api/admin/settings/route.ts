import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import { isSecretSettingKey } from "@/lib/settings";

const VALID_SETTING_KEY_REGEX = /^[A-Za-z0-9_.-]{1,100}$/;

function isSecretKey(key: string): boolean {
  return isSecretSettingKey(key);
}

function isEditorAllowedWriteKey(key: string): boolean {
  return (
    key.startsWith("page_content_") ||
    key === "page_privacy" ||
    key === "page_privacy_title" ||
    key === "page_terms" ||
    key === "page_terms_title" ||
    key === "page_refund" ||
    key === "page_refund_title" ||
    key === "pricing_plans"
  );
}

function isEditorReadableKey(key: string): boolean {
  if (isSecretKey(key)) return false;
  return (
    isEditorAllowedWriteKey(key) ||
    key.startsWith("contact_") ||
    key === "site_logo" ||
    key === "EMAIL_PROVIDER" ||
    key === "EMAIL_FROM_NAME" ||
    key === "EMAIL_FROM_EMAIL" ||
    key === "EMAIL_REPLY_TO" ||
    key === "SMTP_HOST" ||
    key === "SMTP_PORT" ||
    key === "SMTP_USER" ||
    key === "MAILGUN_DOMAIN" ||
    key === "MAILGUN_REGION" ||
    key === "RESEND_AUDIENCE_ID" ||
    key === "WHATSAPP_PHONE_NUMBER" ||
    key === "WHATSAPP_PHONE_NUMBER_ID" ||
    key === "WHATSAPP_BUSINESS_ACCOUNT_ID"
  );
}

function sanitizeSettingValue(key: string, value: string): string {
  if (key === "theme_primary" || key === "theme_accent") {
    return /^#[0-9a-fA-F]{3,8}$/.test(value.trim()) ? value.trim() : "#0A2540";
  }
  if (key === "inject_css") {
    return value.replace(/[<>]/g, "").replace(/@import\b/gi, "");
  }
  if (key === "ga_id") {
    return value.trim().replace(/[^A-Za-z0-9_-]/g, "");
  }
  return value;
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => null);
    const settings = body?.settings;

    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      return NextResponse.json({ error: "Invalid settings payload" }, { status: 400 });
    }

    const entries = Object.entries(settings as Record<string, unknown>)
      .map(([rawKey, val]): [string, unknown] => [typeof rawKey === "string" ? rawKey.trim() : "", val])
      .filter(([key]) => VALID_SETTING_KEY_REGEX.test(key) && !key.startsWith("__"));

    // Enforce RBAC on setting keys
    if (auth.user.role !== "ADMIN") {
      const forbiddenKeys = entries
        .map(([key]) => key)
        .filter((key) => !isEditorAllowedWriteKey(key));
      if (forbiddenKeys.length > 0) {
        return NextResponse.json(
          { error: `Forbidden: editors cannot modify admin settings (${forbiddenKeys.slice(0, 3).join(", ")})` },
          { status: 403 }
        );
      }
    }

    const updatedKeys: string[] = [];

    const updates = entries
      .filter(([key, value]) => {
        if (value === undefined || value === null) return false;
        const strVal = String(value);
        // Never overwrite an existing stored secret with an empty or masked placeholder string
        if (isSecretKey(key) && (strVal.trim() === "" || /^•+$/.test(strVal.trim()))) {
          return false;
        }
        return true;
      })
      .map(([key, value]) => {
        const cleanVal = sanitizeSettingValue(key, String(value));
        updatedKeys.push(key);
        return prisma.setting.upsert({
          where: { key },
          update: { value: cleanVal },
          create: { key, value: cleanVal },
        });
      });

    await Promise.all(updates);

    // Invalidate layouts and public pages so changes take effect immediately
    try {
      revalidatePath("/", "layout");
      revalidatePath("/");
      revalidatePath("/about");
      revalidatePath("/book");
      revalidatePath("/contact");
      revalidatePath("/services");
      revalidatePath("/services/[slug]", "page");
      revalidatePath("/articles");
      revalidatePath("/articles/[slug]", "page");
      revalidatePath("/tools");
      revalidatePath("/tools/tax-calculator");
      revalidatePath("/tools/gst-calculator");
      revalidatePath("/privacy");
      revalidatePath("/terms");
      revalidatePath("/refund");
      revalidatePath("/sitemap.xml");
    } catch (e) {
      console.warn("[Settings] Revalidation warning:", e);
    }

    if (updatedKeys.length > 0) {
      const safeLogKeys = updatedKeys.slice(0, 8).join(", ") + (updatedKeys.length > 8 ? ` (+${updatedKeys.length - 8} more)` : "");
      await logActivity(
        "UPDATED",
        "Setting",
        `Updated ${updatedKeys.length} setting(s): ${safeLogKeys}`,
        undefined,
        auth.user.userId
      );
    }

    return NextResponse.json({ message: "Settings updated successfully", updatedCount: updatedKeys.length });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const settings = await prisma.setting.findMany();
    const config: Record<string, string | Record<string, boolean>> = {};
    const configuredSecrets: Record<string, boolean> = {};

    for (const curr of settings) {
      if (isSecretKey(curr.key)) {
        if (auth.user.role === "ADMIN") {
          configuredSecrets[curr.key] = curr.value.trim().length > 0;
          // Never send plaintext secrets to client JavaScript
          config[curr.key] = "";
        }
        continue;
      }

      if (auth.user.role !== "ADMIN" && !isEditorReadableKey(curr.key)) {
        continue;
      }

      config[curr.key] = curr.value;
    }

    if (auth.user.role === "ADMIN") {
      config.__configuredSecrets = configuredSecrets;
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}
