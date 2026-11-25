import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { sendProposalToClient } from "@/lib/lead-crm";
import { logActivity } from "@/lib/activity-log";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id, proposalId } = await params;
    const body = await request.json().catch(() => ({}));
    const channel = body?.channel || "EMAIL";
    const customMessage =
      typeof body?.customMessage === "string" ? body.customMessage.slice(0, 2000) : undefined;

    if (channel !== "EMAIL" && channel !== "WHATSAPP") {
      return NextResponse.json(
        { error: "Invalid delivery channel. Must be EMAIL or WHATSAPP." },
        { status: 400 }
      );
    }

    const result = await sendProposalToClient({
      proposalId,
      expectedInquiryId: id,
      channel,
      customMessage,
      performedBy: auth.user.name || auth.user.username || auth.user.role,
    });

    await logActivity(
      "UPDATED",
      "Inquiry",
      `Dispatched quotation ${result.proposalNumber} via ${channel}`,
      result.id,
      auth.user.userId
    );

    return NextResponse.json({
      success: true,
      proposal: result,
      message: `Proposal dispatched successfully via ${channel}`,
    });
  } catch (error: any) {
    const msg = error?.message || "Failed to send proposal";
    const status = msg.includes("not found")
      ? 404
      : msg.includes("Invalid") || msg.includes("does not have")
      ? 400
      : 500;
    console.error("Failed to send proposal:", error);
    return NextResponse.json({ error: msg }, { status });
  }
}
