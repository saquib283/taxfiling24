import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email-delivery";
import {
  buildUnsubscribeUrl,
  escapeHtml,
  getBaseUrl,
  wrapEmailHtml,
} from "@/lib/email-campaigns";
import { getDateKey } from "@/lib/booking";
import { isPlaceholderEmail } from "@/lib/audience-service";
import { safeSecretCompare } from "@/lib/rate-limit";

const ALERT_STATE_KEY = "LAST_DEADLINE_ALERT_KEYS";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const authHeader = request.headers.get("authorization") || "";
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (match && match[1] && safeSecretCompare(match[1].trim(), secret)) {
    return true;
  }
  return false;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const future = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const [deadlines, alertStateRow, subscribers] = await Promise.all([
      prisma.complianceDeadline.findMany({
        where: {
          isActive: true,
          date: {
            gte: now,
            lte: future,
          },
        },
        orderBy: { date: "asc" },
      }),
      prisma.setting.findUnique({ where: { key: ALERT_STATE_KEY } }),
      prisma.subscriber.findMany({
        where: { isActive: true },
        select: { email: true },
      }),
    ]);

    if (deadlines.length === 0) {
      return NextResponse.json({ message: "No upcoming active deadlines found.", sentCount: 0 });
    }

    // Load previously alerted deadline keys (pruning entries older than 30 days)
    let alertedMap: Record<string, string> = {};
    if (alertStateRow?.value) {
      try {
        const parsed = JSON.parse(alertStateRow.value);
        if (parsed && typeof parsed === "object") {
          const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
          for (const [k, ts] of Object.entries(parsed)) {
            if (typeof ts === "string" && new Date(ts).getTime() >= cutoff) {
              alertedMap[k] = ts;
            }
          }
        }
      } catch {
        alertedMap = {};
      }
    }

    const unalertedDeadlines = deadlines.filter((d) => {
      const key = `${d.id}:${getDateKey(d.date)}`;
      return !alertedMap[key];
    });

    if (unalertedDeadlines.length === 0) {
      return NextResponse.json({
        message: "All upcoming deadlines within 3 days have already been alerted.",
        sentCount: 0,
      });
    }

    const recipients = subscribers
      .map((s) => s.email.trim().toLowerCase())
      .filter((email) => email && !isPlaceholderEmail(email));

    if (recipients.length === 0) {
      return NextResponse.json({ message: "No active subscribers to alert.", sentCount: 0 });
    }

    const baseUrl = getBaseUrl(request);
    const subject = "Upcoming Compliance & Tax Deadlines Alert | TaxFiling24";
    const deadlineListHtml = unalertedDeadlines
      .map((d) => {
        const formattedDate = new Date(d.date).toLocaleDateString("en-IN", {
          timeZone: "Asia/Kolkata",
          day: "numeric",
          month: "short",
          year: "numeric",
        });
        return `<li style="margin-bottom:10px;"><strong>${escapeHtml(d.title)}</strong> (${escapeHtml(
          d.category
        )}) &mdash; <strong>${escapeHtml(formattedDate)}</strong>${
          d.desc ? `<br /><span style="color:#475569;font-size:13px;">${escapeHtml(d.desc)}</span>` : ""
        }</li>`;
      })
      .join("");

    const bodyContent = `
      <h2>Upcoming Compliance &amp; Tax Deadlines</h2>
      <p>This is an advance reminder from <strong>TaxFiling24</strong> for upcoming statutory compliance deadlines falling within the next 3 days:</p>
      <ul>${deadlineListHtml}</ul>
      <p>Ensure your documents and returns are finalized on time to avoid statutory late fees and interest.</p>
    `;

    let sentCount = 0;
    let failedCount = 0;

    // Send individualized emails via unified transactional delivery (supports Resend/Mailgun/SMTP)
    const batchSize = 5;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (recipientEmail) => {
          try {
            const html = wrapEmailHtml({
              baseUrl,
              content: bodyContent,
              fromName: "TaxFiling24 Alerts",
              recipientEmail,
              subject,
            });
            const unsubUrl = buildUnsubscribeUrl(recipientEmail, baseUrl);
            await sendTransactionalEmail({
              to: recipientEmail,
              subject,
              html,
              text: `Upcoming TaxFiling24 Deadlines:\n${unalertedDeadlines
                .map((d) => `- ${d.title} (${getDateKey(d.date)}): ${d.desc || ""}`)
                .join("\n")}\n\nUnsubscribe: ${unsubUrl}`,
            });
            sentCount++;
          } catch (err) {
            failedCount++;
            console.warn(`[Cron Deadlines] Delivery failed for ${recipientEmail}:`, err);
          }
        })
      );
    }

    // Record alerted keys so daily cron runs do not re-spam the same deadlines
    if (sentCount > 0) {
      const nowIso = now.toISOString();
      for (const d of unalertedDeadlines) {
        alertedMap[`${d.id}:${getDateKey(d.date)}`] = nowIso;
      }

      await prisma.setting.upsert({
        where: { key: ALERT_STATE_KEY },
        update: { value: JSON.stringify(alertedMap) },
        create: {
          key: ALERT_STATE_KEY,
          value: JSON.stringify(alertedMap),
          description: "Tracks compliance deadlines already alerted to prevent duplicate sends",
        },
      });
    }

    return NextResponse.json({
      success: sentCount > 0,
      alertedDeadlines: unalertedDeadlines.length,
      sentCount,
      failedCount,
    });
  } catch (error) {
    console.error("[Cron Deadlines] Error:", error);
    return NextResponse.json(
      { error: "Failed to process deadline alerts" },
      { status: 500 }
    );
  }
}
