import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { sendProposalToClient } from "@/lib/lead-crm";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { proposalId } = await params;
    const body = await request.json().catch(() => ({}));
    const { channel = "EMAIL", customMessage } = body;

    const result = await sendProposalToClient({
      proposalId,
      channel,
      customMessage,
      performedBy: (admin as any).name || admin.role || "Admin",
    });

    return NextResponse.json({
      success: true,
      proposal: result,
      message: `Proposal dispatched successfully via ${channel}`,
    });
  } catch (error: any) {
    console.error("Failed to send proposal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

