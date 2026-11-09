export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import LeadDetailPageClient from "@/components/admin/crm/LeadDetailPageClient";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      followUps: {
        orderBy: { scheduledAt: "asc" },
      },
      activities: {
        orderBy: { createdAt: "desc" },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!lead) {
    notFound();
  }

  return <LeadDetailPageClient initialLead={lead as any} />;
}

