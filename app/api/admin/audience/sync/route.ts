import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { syncWebsiteLeads } from "@/lib/audience-service";
import { logActivity } from "@/lib/activity-log";

export async function POST() {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const result = await syncWebsiteLeads();
    await logActivity(
      "UPDATED",
      "Subscriber",
      `Synced website leads into audience: ${result.totalSynced} contacts synced`,
      undefined,
      auth.user.userId
    );
    return NextResponse.json({
      success: true,
      ...result,
      message: `Sync completed: Scanned ${result.totalInquiries} inquiries and ${result.totalAppointments} appointments. Synced ${result.totalSynced} contacts into Campaign Audience.`,
    });
  } catch (error: any) {
    console.error("Failed to sync website leads:", error);
    return NextResponse.json(
      { error: "Failed to sync website leads." },
      { status: 500 }
    );
  }
}
