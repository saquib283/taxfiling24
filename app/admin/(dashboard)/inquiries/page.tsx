export const dynamic = "force-dynamic";

import prisma from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { getLeadCrmMetrics } from "@/lib/lead-crm";
import InquiryInboxManager from "@/components/admin/InquiryInboxManager";

export default async function InquiriesPage() {
  await requirePageRole(["ADMIN", "EDITOR", "VIEWER"]);

  const [inquiries, metrics] = await Promise.all([
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        followUps: {
          where: { status: "PENDING" },
          orderBy: { scheduledAt: "asc" },
        },
        _count: {
          select: {
            followUps: true,
            activities: true,
            proposals: true,
          },
        },
      },
    }),
    getLeadCrmMetrics(),
  ]);

  return (
    <InquiryInboxManager
      initialInquiries={inquiries as any}
      initialMetrics={metrics}
    />
  );
}
