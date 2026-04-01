import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { logActivity } from "@/lib/activity-log";
import {
  buildWebhookUrls,
  EMAIL_SETTING_KEYS,
  getProviderStatuses,
  normalizeEmailProvider,
  resolveEmailProviderConfig,
  settingsToMap,
} from "@/lib/email-campaigns";

type CampaignPayload = {
  id?: string;
  audience?: string;
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
  try {
    const [campaigns, templates, subscribers, settings] = await Promise.all([
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
      }),
      prisma.campaignTemplate.findMany({
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
      }),
      prisma.subscriber.findMany({
        orderBy: { createdAt: "desc" },
      }),
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
    const activeSubscriberCount = subscribers.filter(
      (subscriber: { isActive: boolean }) => subscriber.isActive
    ).length;

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
        subscribers.length,
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

    const data = {
      audience: payload.audience || "ALL_ACTIVE",
      content: payload.content.trim(),
      fromEmail: payload.fromEmail?.trim() || null,
      fromName: payload.fromName?.trim() || null,
      name: payload.name?.trim() || payload.subject.trim(),
      preheader: payload.preheader?.trim() || null,
      provider: normalizeEmailProvider(payload.provider),
      replyTo: payload.replyTo?.trim() || null,
      status: payload.status || "DRAFT",
      subject: payload.subject.trim(),
      templateId: payload.templateId || null,
    };

    const campaign = payload.id
      ? await prisma.campaign.update({
          where: { id: payload.id },
          data,
        })
      : await prisma.campaign.create({
          data,
        });

    await logActivity(
      payload.id ? "UPDATED" : "CREATED",
      "Campaign",
      `${payload.id ? "Updated" : "Created"} campaign draft: ${campaign.subject}`,
      campaign.id
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
