export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import QuotationStudioClient from "@/components/admin/crm/QuotationStudioClient";

export default async function EditQuotationPage({
  params,
}: {
  params: Promise<{ id: string; proposalId: string }>;
}) {
  const { id, proposalId } = await params;

  const [lead, proposal] = await Promise.all([
    prisma.inquiry.findUnique({
      where: { id },
    }),
    prisma.leadProposal.findUnique({
      where: { id: proposalId },
    }),
  ]);

  if (!lead || !proposal) {
    notFound();
  }

  return (
    <QuotationStudioClient
      lead={lead as any}
      initialProposal={proposal as any}
      mode="edit"
    />
  );
}

