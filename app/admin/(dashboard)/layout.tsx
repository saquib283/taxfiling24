import AdminLayout from "@/components/admin/AdminLayout";
import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";
import { requirePageRole } from "@/lib/auth";

export const metadata: Metadata = buildNoIndexMetadata("Admin Dashboard");

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requirePageRole(["ADMIN", "EDITOR", "VIEWER"]);

  return (
    <AdminLayout>
      {children}
    </AdminLayout>
  );
}
