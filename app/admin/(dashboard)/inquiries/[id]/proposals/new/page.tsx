export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import QuotationStudioClient from "@/components/admin/crm/QuotationStudioClient";

export default async function NewQuotationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const lead = await prisma.inquiry.findUnique({
    where: { id },
  });

  if (!lead) {
    notFound();
  }

  return (
    <QuotationStudioClient
      lead={lead as any}
      mode="create"
    />
  );
}

