import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateProposalPdf } from "@/lib/generateProposalPdf";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { proposalId } = await params;
    const proposal = await prisma.leadProposal.findUnique({
      where: { id: proposalId },
      include: { inquiry: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const inq = proposal.inquiry;
    const lineItems = (proposal.lineItems as any[]) || [];

    const pdfBytes = await generateProposalPdf({
      proposalNumber: proposal.proposalNumber,
      title: proposal.title,
      clientName: inq.name,
      clientEmail: inq.email,
      clientPhone: inq.phone,
      clientCompany: inq.company,
      clientGstin: proposal.clientGstin,
      clientPan: proposal.clientPan,
      clientAddress: proposal.clientAddress,
      placeOfSupply: proposal.placeOfSupply,
      taxType: proposal.taxType,
      paymentMilestones: (proposal.paymentMilestones as any[]) || null,
      validUntil: proposal.validUntil,
      createdAt: proposal.createdAt,
      lineItems,
      subtotal: proposal.subtotal,
      discount: proposal.discount,
      taxAmount: proposal.taxAmount,
      totalAmount: proposal.totalAmount,
      notes: proposal.notes,
      terms: proposal.terms,
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Quotation-${proposal.proposalNumber}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate quotation PDF:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

