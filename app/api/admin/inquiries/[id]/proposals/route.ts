import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createProposal } from "@/lib/lead-crm";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const proposals = await prisma.leadProposal.findMany({
      where: { inquiryId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(proposals);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
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

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Proposal title is required" }, { status: 400 });
    }

    if (!validUntil) {
      return NextResponse.json({ error: "Validity date is required" }, { status: 400 });
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      return NextResponse.json(
        { error: "At least one service line item is required" },
        { status: 400 }
      );
    }

    const proposal = await createProposal({
      inquiryId: id,
      title: title.trim(),
      validUntil,
      lineItems,
      discount: discount ? Number(discount) : 0,
      currency,
      clientGstin,
      clientPan,
      clientAddress,
      placeOfSupply,
      taxType,
      paymentMilestones,
      notes: notes?.trim() || undefined,
      terms: terms?.trim() || undefined,
      performedBy: (admin as any).name || admin.role || "Admin",
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

