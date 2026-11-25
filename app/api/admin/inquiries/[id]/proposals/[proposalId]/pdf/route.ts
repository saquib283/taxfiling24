import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { generateProposalPdf } from "@/lib/generateProposalPdf";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR", "VIEWER"]);
  if (!auth.ok) return auth.response;

  try {
    const { id, proposalId } = await params;
    const proposal = await prisma.leadProposal.findFirst({
      where: { id: proposalId, inquiryId: id },
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

    const safeFileName = `Quotation-${proposal.proposalNumber.replace(/[^A-Za-z0-9._-]/g, "_")}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate quotation PDF:", error);
    return NextResponse.json({ error: "Failed to generate quotation PDF" }, { status: 500 });
  }
}
