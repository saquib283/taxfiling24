import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncWebsiteLeads } from "@/lib/audience-service";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await syncWebsiteLeads();
    return NextResponse.json({
      success: true,
      ...result,
      message: `Sync completed: Scanned ${result.totalInquiries} inquiries and ${result.totalAppointments} appointments. Synced ${result.totalSynced} contacts into Campaign Audience.`,
    });
  } catch (error: any) {
    console.error("Failed to sync website leads:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync website leads." },
      { status: 500 }
    );
  }
}

