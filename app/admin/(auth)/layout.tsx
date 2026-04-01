import type { Metadata } from "next";
import { buildNoIndexMetadata } from "@/lib/seo";

export const metadata: Metadata = buildNoIndexMetadata("Admin Login");

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
