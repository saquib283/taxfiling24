import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { markProposalAccepted, logLeadActivity } from "@/lib/lead-crm";

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

    return NextResponse.json(proposal);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { proposalId } = await params;
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

    if (status === "ACCEPTED") {
      const accepted = await markProposalAccepted({
        proposalId,
        performedBy: (admin as any).name || admin.role || "Admin",
      });
      return NextResponse.json(accepted);
    }

    const dataToUpdate: any = {};
    if (status) dataToUpdate.status = status;
    if (title) dataToUpdate.title = title;
    if (validUntil) dataToUpdate.validUntil = new Date(validUntil);
    if (currency) dataToUpdate.currency = currency;
    if (clientGstin !== undefined) dataToUpdate.clientGstin = clientGstin?.trim() || null;
    if (clientPan !== undefined) dataToUpdate.clientPan = clientPan?.trim() || null;
    if (clientAddress !== undefined) dataToUpdate.clientAddress = clientAddress?.trim() || null;
    if (placeOfSupply !== undefined) dataToUpdate.placeOfSupply = placeOfSupply?.trim() || null;
    if (taxType !== undefined) dataToUpdate.taxType = taxType;
    if (paymentMilestones !== undefined) dataToUpdate.paymentMilestones = paymentMilestones;
    if (notes !== undefined) dataToUpdate.notes = notes;
    if (terms !== undefined) dataToUpdate.terms = terms;

    if (lineItems && Array.isArray(lineItems)) {
      let subtotal = 0;
      let taxAmount = 0;
      for (const item of lineItems) {
        const qty = Number(item.qty || 1);
        const rate = Number(item.rate || 0);
        const lineSubtotal = qty * rate;
        const gstPct = item.isGovFee ? 0 : Number(item.gstPercent ?? 18);
        const lineTax = (lineSubtotal * gstPct) / 100;
        item.amount = lineSubtotal;
        subtotal += lineSubtotal;
        taxAmount += lineTax;
      }
      const disc = discount !== undefined ? Math.max(0, Number(discount)) : 0;
      const taxable = Math.max(0, subtotal - disc);
      const effectiveTax = disc > 0 ? (taxable * 0.18) : taxAmount;
      const totalAmount = Math.round((taxable + effectiveTax) * 100) / 100;

      dataToUpdate.lineItems = lineItems;
      dataToUpdate.subtotal = subtotal;
      dataToUpdate.discount = disc;
      dataToUpdate.taxAmount = effectiveTax;
      dataToUpdate.totalAmount = totalAmount;
    } else if (discount !== undefined) {
      dataToUpdate.discount = Math.max(0, Number(discount));
    }

    const updated = await prisma.leadProposal.update({
      where: { id: proposalId },
      data: dataToUpdate,
    });

    if (status) {
      await logLeadActivity({
        inquiryId: updated.inquiryId,
        type: "STATUS_CHANGE",
        title: `Proposal ${updated.proposalNumber} status updated to ${status}`,
        performedBy: (admin as any).name || admin.role || "Admin",
      });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; proposalId: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { proposalId } = await params;
    await prisma.leadProposal.delete({
      where: { id: proposalId },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

