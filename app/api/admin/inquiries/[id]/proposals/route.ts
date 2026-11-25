import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { createProposal } from "@/lib/lead-crm";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const proposals = await prisma.leadProposal.findMany({
      where: { inquiryId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(proposals);
  } catch (error: any) {
    console.error("Failed to fetch proposals:", error);
    return NextResponse.json({ error: "Failed to load proposals" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const inquiry = await prisma.inquiry.findUnique({
      where: { id },
      select: { id: true, name: true },
    });
    if (!inquiry) {
      return NextResponse.json({ error: "Lead inquiry not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      title,
      validUntil,
      lineItems,
      discount,
      currency,
      clientGstin,
      clientPan,
      clientAddress,
      placeOfSupply,
      taxType,
      paymentMilestones,
      notes,
      terms,
    } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: "Proposal title is required" }, { status: 400 });
    }

    if (!validUntil || isNaN(new Date(validUntil).getTime())) {
      return NextResponse.json({ error: "Valid quotation expiry date is required" }, { status: 400 });
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { error: "At least one service line item is required" },
        { status: 400 }
      );
    }

    const proposal = await createProposal({
      inquiryId: id,
      title: String(title).trim(),
      validUntil,
      lineItems,
      discount: discount !== undefined ? Number(discount) : 0,
      currency,
      clientGstin,
      clientPan,
      clientAddress,
      placeOfSupply,
      taxType,
      paymentMilestones,
      notes: notes?.trim() || undefined,
      terms: terms?.trim() || undefined,
      performedBy: auth.user.name || auth.user.username || auth.user.role,
    });

    await logActivity(
      "CREATED",
      "Inquiry",
      `Created quotation ${proposal.proposalNumber} for ${inquiry.name}`,
      proposal.id,
      auth.user.userId
    );

    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    const msg = error?.message || "Failed to create proposal";
    const isValidation =
      msg.includes("required") ||
      msg.includes("must be") ||
      msg.includes("Invalid");
    return NextResponse.json({ error: msg }, { status: isValidation ? 400 : 500 });
  }
}
