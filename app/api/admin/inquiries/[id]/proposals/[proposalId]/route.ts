import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { markProposalAccepted, logLeadActivity } from "@/lib/lead-crm";
import { calculateProposalTotals, ProposalLineItem, ProposalMilestone } from "@/lib/proposal-math";
import { logActivity } from "@/lib/activity-log";

const ALLOWED_PROPOSAL_STATUSES = new Set([
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
]);

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

    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error("Failed to fetch proposal:", error);
    return NextResponse.json({ error: "Failed to load proposal" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id, proposalId } = await params;
    const existing = await prisma.leadProposal.findFirst({
      where: { id: proposalId, inquiryId: id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const body = await request.json();
    const {
      status,
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

    if (status !== undefined && !ALLOWED_PROPOSAL_STATUSES.has(String(status))) {
      return NextResponse.json({ error: "Invalid proposal status" }, { status: 400 });
    }

    const actor = auth.user.name || auth.user.username || auth.user.role;

    if (status === "ACCEPTED") {
      const accepted = await markProposalAccepted({
        proposalId,
        expectedInquiryId: id,
        performedBy: actor,
      });
      await logActivity(
        "UPDATED",
        "Inquiry",
        `Marked quotation ${accepted.proposalNumber} ACCEPTED`,
        proposalId,
        auth.user.userId
      );
      return NextResponse.json(accepted);
    }

    const dataToUpdate: Record<string, any> = {};
    if (status) dataToUpdate.status = status;
    if (title !== undefined) {
      const trimmedTitle = String(title).trim();
      if (!trimmedTitle) {
        return NextResponse.json({ error: "Proposal title cannot be empty" }, { status: 400 });
      }
      dataToUpdate.title = trimmedTitle;
    }
    if (validUntil !== undefined) {
      const d = new Date(validUntil);
      if (isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid validUntil date" }, { status: 400 });
      }
      dataToUpdate.validUntil = d;
    }
    if (currency) dataToUpdate.currency = String(currency).trim();
    if (clientGstin !== undefined) dataToUpdate.clientGstin = clientGstin?.trim() || null;
    if (clientPan !== undefined) dataToUpdate.clientPan = clientPan?.trim() || null;
    if (clientAddress !== undefined) dataToUpdate.clientAddress = clientAddress?.trim() || null;
    if (placeOfSupply !== undefined) dataToUpdate.placeOfSupply = placeOfSupply?.trim() || null;
    if (taxType !== undefined) {
      dataToUpdate.taxType = taxType === "CGST_SGST" ? "CGST_SGST" : "IGST";
    }
    if (notes !== undefined) dataToUpdate.notes = notes?.trim() || null;
    if (terms !== undefined) dataToUpdate.terms = terms;

    // Recompute totals & milestone amounts consistently whenever lineItems, discount, or paymentMilestones change
    if (lineItems !== undefined || discount !== undefined || paymentMilestones !== undefined) {
      const effectiveItems =
        lineItems !== undefined
          ? (lineItems as ProposalLineItem[])
          : ((existing.lineItems as unknown as ProposalLineItem[]) || []);
      const effectiveDiscount =
        discount !== undefined ? Number(discount) : Number(existing.discount || 0);
      const effectiveMilestones =
        paymentMilestones !== undefined
          ? (paymentMilestones as ProposalMilestone[])
          : ((existing.paymentMilestones as unknown as ProposalMilestone[]) || undefined);

      const calc = calculateProposalTotals(
        effectiveItems,
        effectiveDiscount,
        effectiveMilestones,
        { strict: true }
      );

      dataToUpdate.lineItems = calc.lineItems;
      dataToUpdate.subtotal = calc.subtotal;
      dataToUpdate.discount = calc.discount;
      dataToUpdate.taxAmount = calc.taxAmount;
      dataToUpdate.totalAmount = calc.totalAmount;
      if (calc.paymentMilestones !== undefined) {
        dataToUpdate.paymentMilestones = calc.paymentMilestones;
      }
    }

    const updated = await prisma.leadProposal.update({
      where: { id: proposalId },
      data: dataToUpdate,
    });

    if (status && status !== existing.status) {
      await logLeadActivity({
        inquiryId: updated.inquiryId,
        type: "STATUS_CHANGE",
        title: `Proposal ${updated.proposalNumber} status updated to ${status}`,
        performedBy: actor,
      });
    }

    await logActivity(
      "UPDATED",
      "Inquiry",
      `Updated quotation ${updated.proposalNumber}`,
      updated.id,
      auth.user.userId
    );

    return NextResponse.json(updated);
  } catch (error: any) {
    const msg = error?.message || "Failed to update proposal";
    const isBadRequest =
      msg.includes("required") ||
      msg.includes("must be") ||
      msg.includes("Cannot accept") ||
      msg.includes("Invalid");
    return NextResponse.json({ error: msg }, { status: isBadRequest ? 400 : 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if (!auth.ok) return auth.response;

  try {
    const { id, proposalId } = await params;
    const existing = await prisma.leadProposal.findFirst({
      where: { id: proposalId, inquiryId: id },
      select: { id: true, proposalNumber: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    await prisma.leadProposal.delete({
      where: { id: existing.id },
    });

    await logActivity(
      "DELETED",
      "Inquiry",
      `Deleted quotation ${existing.proposalNumber}`,
      existing.id,
      auth.user.userId
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Failed to delete proposal:", error);
    return NextResponse.json({ error: "Failed to delete proposal" }, { status: 500 });
  }
}
