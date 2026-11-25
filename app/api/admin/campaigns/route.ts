import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import { requireRole } from "@/lib/auth";
import {
  buildWebhookUrls,
  EMAIL_SETTING_KEYS,
  getProviderStatuses,
  normalizeCampaignProvider,
  resolveEmailProviderConfig,
  settingsToMap,
} from "@/lib/email-campaigns";

type CampaignPayload = {
  id?: string;
  audience?: string;
  channel?: "EMAIL" | "WHATSAPP";
  content?: string;
  fromEmail?: string;
  fromName?: string;
  name?: string;
  preheader?: string;
  provider?: string;
  replyTo?: string;
  status?: string;
  subject?: string;
  templateId?: string | null;
};

function buildSummary(
  campaigns: Array<{
    bouncedCount: number;
    clickedCount: number;
    deliveredCount: number;
    openedCount: number;
    recipientCount: number;
    sentCount: number;
    status: string;
  }>,
  subscriberCount: number,
  activeSubscriberCount: number,
  templateCount: number
) {
  const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sentCount, 0);
  const totalDelivered = campaigns.reduce(
    (sum, campaign) => sum + campaign.deliveredCount,
    0
  );
  const totalOpens = campaigns.reduce((sum, campaign) => sum + campaign.openedCount, 0);
  const totalClicks = campaigns.reduce((sum, campaign) => sum + campaign.clickedCount, 0);
  const totalBounces = campaigns.reduce(
    (sum, campaign) => sum + campaign.bouncedCount,
    0
  );
  const campaignsWithRecipients = campaigns.filter(
    (campaign) => campaign.recipientCount > 0
  );
  const averageOpenRate = campaignsWithRecipients.length
    ? campaignsWithRecipients.reduce((sum, campaign) => {
        return sum + campaign.openedCount / Math.max(campaign.recipientCount, 1);
      }, 0) / campaignsWithRecipients.length
    : 0;
  const averageClickRate = campaignsWithRecipients.length
    ? campaignsWithRecipients.reduce((sum, campaign) => {
        return sum + campaign.clickedCount / Math.max(campaign.recipientCount, 1);
      }, 0) / campaignsWithRecipients.length
    : 0;

  return {
    activeSubscriberCount,
    averageClickRate,
    averageOpenRate,
    draftCount: campaigns.filter((campaign) => campaign.status === "DRAFT").length,
    sentCampaignCount: campaigns.filter((campaign) => campaign.sentCount > 0).length,
    subscriberCount,
    suppressedSubscriberCount: Math.max(subscriberCount - activeSubscriberCount, 0),
    templateCount,
    totalBounces,
    totalClicks,
    totalDelivered,
    totalOpens,
    totalSent,
  };
}

export async function GET(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const canReadAudiencePii = auth.user.role === "ADMIN" || auth.user.role === "EDITOR";

    const [
      campaigns,
      templates,
      subscribers,
      subscriberCount,
      activeSubscriberCount,
      settings,
    ] = await Promise.all([
      prisma.campaign.findMany({
        include: {
          template: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
        orderBy: [{ sentAt: "desc" }, { createdAt: "desc" }],
        take: 200,
      }),
      prisma.campaignTemplate.findMany({
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
        take: 100,
      }),
      canReadAudiencePii
        ? prisma.subscriber.findMany({
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              company: true,
              source: true,
              tags: true,
              isActive: true,
              createdAt: true,
            },
            orderBy: { createdAt: "desc" },
            take: 2000,
          })
        : Promise.resolve([]),
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { isActive: true } }),
      prisma.setting.findMany({
        where: {
          key: { in: [...EMAIL_SETTING_KEYS] },
        },
        select: {
          key: true,
          value: true,
        },
      }),
    ]);

    const settingsMap = settingsToMap(settings);
    const providerConfig = resolveEmailProviderConfig(settingsMap);
    const providerStatuses = getProviderStatuses(providerConfig);

    return NextResponse.json({
      campaigns,
      provider: {
        fromEmail: providerConfig.fromEmail,
        fromName: providerConfig.fromName,
        mailgunDomain: providerConfig.mailgunDomain,
        mailgunRegion: providerConfig.mailgunRegion,
        replyTo: providerConfig.replyTo,
        resendAudienceId: providerConfig.resendAudienceId,
        selectedProvider: providerConfig.selectedProvider,
        statuses: providerStatuses,
        webhookUrls: buildWebhookUrls(request),
      },
      subscribers,
      summary: buildSummary(
        campaigns,
        subscriberCount,
        activeSubscriberCount,
        templates.length
      ),
      templates,
    });
  } catch (error) {
    console.error("Failed to fetch campaign workspace", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign workspace" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const payload = (await request.json()) as CampaignPayload;

    if (!payload.subject?.trim()) {
      return NextResponse.json(
        { error: "Campaign subject is required." },
        { status: 400 }
      );
    }

    if (!payload.content?.trim()) {
      return NextResponse.json(
        { error: "Campaign content is required." },
        { status: 400 }
      );
    }

    const effectiveProvider =
      payload.channel === "WHATSAPP"
        ? "WHATSAPP"
        : normalizeCampaignProvider(payload.provider);

    const data = {
      audience: payload.audience || "ALL_ACTIVE",
      content: payload.content.trim(),
      fromEmail: payload.fromEmail?.trim() || null,
      fromName: payload.fromName?.trim() || null,
      name: payload.name?.trim() || payload.subject.trim(),
      preheader: payload.preheader?.trim() || null,
      provider: effectiveProvider,
      replyTo: payload.replyTo?.trim() || null,
      status: "DRAFT",
      subject: payload.subject.trim(),
      templateId: payload.templateId || null,
    };

    let campaign;
    if (payload.id) {
      const existing = await prisma.campaign.findUnique({
        where: { id: payload.id },
        select: { id: true, status: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Campaign draft not found." }, { status: 404 });
      }

      if (existing.status !== "DRAFT") {
        // Protect sent campaign records & analytics by creating a new draft copy instead
        campaign = await prisma.campaign.create({ data });
      } else {
        campaign = await prisma.campaign.update({
          where: { id: payload.id },
          data,
        });
      }
    } else {
      campaign = await prisma.campaign.create({ data });
    }

    await logActivity(
      payload.id ? "UPDATED" : "CREATED",
      "Campaign",
      `${payload.id ? "Updated" : "Created"} campaign draft: ${campaign.subject}`,
      campaign.id,
      auth.user.userId
    );

    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("Failed to save campaign draft", error);
    return NextResponse.json(
      { error: "Failed to save campaign draft" },
      { status: 500 }
    );
  }
}
