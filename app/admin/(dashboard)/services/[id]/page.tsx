import ServiceForm from "@/components/admin/ServiceForm";
import prisma from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { notFound } from "next/navigation";

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageRole(["ADMIN", "EDITOR"]);
  const { id } = await params;

  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    return notFound();
  }

  return <ServiceForm service={service} isEdit={true} />;
}
