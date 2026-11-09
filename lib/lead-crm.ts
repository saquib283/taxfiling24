import prisma from "@/lib/prisma";
import { sendTransactionalEmail } from "@/lib/email-delivery";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import { ProposalLineItem } from "@/lib/generateProposalPdf";

export type LeadStage =
  | "NEW"
  | "CONTACTED"
  | "FOLLOW_UP_SCHEDULED"
  | "CONSULTATION_BOOKED"
  | "PROPOSAL_SENT"
  | "WON"
  | "LOST"
  | "ARCHIVED";

export type LeadPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type FollowUpType = "CALL" | "WHATSAPP" | "EMAIL" | "MEETING" | "TASK";

export type ActivityType =
  | "NOTE"
  | "CALL"
  | "EMAIL"
  | "WHATSAPP"
  | "STATUS_CHANGE"
  | "FOLLOW_UP_CREATED"
  | "FOLLOW_UP_COMPLETED"
  | "VALUE_UPDATED"
  | "PROPOSAL_CREATED"
  | "PROPOSAL_SENT"
  | "PROPOSAL_ACCEPTED";

// ── Activity Logger ──────────────────────────────────────────────────
export async function logLeadActivity(params: {
  inquiryId: string;
  type: ActivityType | string;
  title: string;
  description?: string | null;
  metadata?: any;
  performedBy?: string;
}) {
  return await prisma.leadActivity.create({
    data: {
      inquiryId: params.inquiryId,
      type: params.type,
      title: params.title,
      description: params.description || null,
      metadata: params.metadata || undefined,
      performedBy: params.performedBy || "Admin",
    },
  });
}

// ── Follow-Up Scheduler ──────────────────────────────────────────────
export async function scheduleFollowUp(params: {
  inquiryId: string;
  scheduledAt: Date | string;
  type?: FollowUpType;
  title: string;
  notes?: string;
  assignedTo?: string;
  performedBy?: string;
}) {
  const followUpDate =
    typeof params.scheduledAt === "string"
      ? new Date(params.scheduledAt)
      : params.scheduledAt;

  const followUp = await prisma.leadFollowUp.create({
    data: {
      inquiryId: params.inquiryId,
      scheduledAt: followUpDate,
      type: params.type || "CALL",
      title: params.title,
      notes: params.notes || null,
      assignedTo: params.assignedTo || null,
      status: "PENDING",
    },
  });

  // Automatically adjust lead stage if it was fresh
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: params.inquiryId },
    select: { status: true },
  });

  if (inquiry && (inquiry.status === "NEW" || inquiry.status === "PENDING")) {
    await prisma.inquiry.update({
      where: { id: params.inquiryId },
      data: { status: "FOLLOW_UP_SCHEDULED" },
    });
  }

  // Log activity
  await logLeadActivity({
    inquiryId: params.inquiryId,
    type: "FOLLOW_UP_CREATED",
    title: `Follow-up Scheduled: ${params.title}`,
    description: `Type: ${params.type || "CALL"} | Due: ${followUpDate.toLocaleString("en-IN")}${
      params.notes ? `\nNotes: ${params.notes}` : ""
    }`,
    metadata: {
      followUpId: followUp.id,
      scheduledAt: followUpDate.toISOString(),
      type: params.type || "CALL",
    },
    performedBy: params.performedBy || "Admin",
  });

  return followUp;
}

// ── Complete Follow-Up ───────────────────────────────────────────────
export async function completeFollowUp(params: {
  followUpId: string;
  outcome?: string;
  nextFollowUpAt?: Date | string | null;
  nextFollowUpType?: FollowUpType;
  nextFollowUpTitle?: string;
  performedBy?: string;
}) {
  const followUp = await prisma.leadFollowUp.findUnique({
    where: { id: params.followUpId },
    include: { inquiry: true },
  });

  if (!followUp) {
    throw new Error("Follow-up task not found");
  }

  const updated = await prisma.leadFollowUp.update({
    where: { id: params.followUpId },
    data: {
      status: "COMPLETED",
      outcome: params.outcome || "Completed successfully",
      completedAt: new Date(),
    },
  });

  await logLeadActivity({
    inquiryId: followUp.inquiryId,
    type: "FOLLOW_UP_COMPLETED",
    title: `Follow-up Completed: ${followUp.title}`,
    description: params.outcome ? `Outcome: ${params.outcome}` : "Task marked completed",
    metadata: {
      followUpId: followUp.id,
      outcome: params.outcome,
    },
    performedBy: params.performedBy || "Admin",
  });

  // If next follow up is requested
  if (params.nextFollowUpAt && params.nextFollowUpTitle) {
    await scheduleFollowUp({
      inquiryId: followUp.inquiryId,
      scheduledAt: params.nextFollowUpAt,
      type: params.nextFollowUpType || "CALL",
      title: params.nextFollowUpTitle,
      performedBy: params.performedBy,
    });
  }

  return updated;
}

// ── Lead Stage Management ───────────────────────────────────────────
export async function changeLeadStage(params: {
  inquiryId: string;
  newStatus: LeadStage | string;
  reason?: string;
  performedBy?: string;
}) {
  const current = await prisma.inquiry.findUnique({
    where: { id: params.inquiryId },
  });

  if (!current) throw new Error("Inquiry not found");

  const oldStatus = current.status;
  if (oldStatus === params.newStatus) return current;

  const updated = await prisma.inquiry.update({
    where: { id: params.inquiryId },
    data: {
      status: params.newStatus,
      lostReason: params.newStatus === "LOST" ? params.reason || current.lostReason : current.lostReason,
    },
  });

  await logLeadActivity({
    inquiryId: params.inquiryId,
    type: "STATUS_CHANGE",
    title: `Stage Changed: ${oldStatus} -> ${params.newStatus}`,
    description: params.reason ? `Reason: ${params.reason}` : undefined,
    metadata: { oldStatus, newStatus: params.newStatus, reason: params.reason },
    performedBy: params.performedBy || "Admin",
  });

  return updated;
}

// ── Proposal & Quotation Engine ──────────────────────────────────────
export async function generateProposalNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.leadProposal.count({
    where: {
      createdAt: {
        gte: new Date(`${year}-01-01T00:00:00.000Z`),
      },
    },
  });
  const seq = String(count + 1).padStart(4, "0");
  return `TF24-QT-${year}-${seq}`;
}

export async function createProposal(params: {
  inquiryId: string;
  title: string;
  validUntil: Date | string;
  lineItems: ProposalLineItem[];
  discount?: number;
  currency?: string;
  clientGstin?: string;
  clientPan?: string;
  clientAddress?: string;
  placeOfSupply?: string;
  taxType?: string;
  paymentMilestones?: any[];
  notes?: string;
  terms?: string;
  performedBy?: string;
}) {
  const discount = Math.max(0, Number(params.discount || 0));

  let subtotal = 0;
  let taxAmount = 0;

  for (const item of params.lineItems) {
    const qty = Number(item.qty || 1);
    const rate = Number(item.rate || 0);
    const lineSubtotal = qty * rate;
    const gstPct = item.isGovFee ? 0 : Number(item.gstPercent ?? 18);
    const lineTax = (lineSubtotal * gstPct) / 100;

    item.amount = lineSubtotal;
    subtotal += lineSubtotal;
    taxAmount += lineTax;
  }

  const taxableAmount = Math.max(0, subtotal - discount);
  const effectiveTax = discount > 0 ? (taxableAmount * 0.18) : taxAmount;
  const totalAmount = Math.round((taxableAmount + effectiveTax) * 100) / 100;

  const proposalNumber = await generateProposalNumber();

  const proposal = await prisma.leadProposal.create({
    data: {
      inquiryId: params.inquiryId,
      proposalNumber,
      title: params.title,
      status: "DRAFT",
      validUntil:
        typeof params.validUntil === "string"
          ? new Date(params.validUntil)
          : params.validUntil,
      lineItems: params.lineItems as any,
      subtotal,
      discount,
      taxAmount: effectiveTax,
      totalAmount,
      currency: params.currency || "INR",
      clientGstin: params.clientGstin?.trim() || null,
      clientPan: params.clientPan?.trim() || null,
      clientAddress: params.clientAddress?.trim() || null,
      placeOfSupply: params.placeOfSupply?.trim() || null,
      taxType: params.taxType || "IGST",
      paymentMilestones: params.paymentMilestones || undefined,
      notes: params.notes || null,
      terms: params.terms || null,
    },
  });

  // Optionally set inquiry estimatedValue if none exists
  const inq = await prisma.inquiry.findUnique({
    where: { id: params.inquiryId },
    select: { estimatedValue: true },
  });
  if (!inq?.estimatedValue || inq.estimatedValue === 0) {
    await prisma.inquiry.update({
      where: { id: params.inquiryId },
      data: { estimatedValue: totalAmount },
    });
  }

  // Log activity
  await logLeadActivity({
    inquiryId: params.inquiryId,
    type: "PROPOSAL_CREATED",
    title: `Quotation Drafted: ${proposalNumber}`,
    description: `Title: ${params.title}\nAmount: ₹${totalAmount.toLocaleString("en-IN")} (${params.lineItems.length} deliverables)`,
    metadata: {
      proposalId: proposal.id,
      proposalNumber,
      totalAmount,
    },
    performedBy: params.performedBy || "Admin",
  });

  return proposal;
}

// ── Send Proposal ────────────────────────────────────────────────────
export async function sendProposalToClient(params: {
  proposalId: string;
  channel?: "EMAIL" | "WHATSAPP";
  customMessage?: string;
  performedBy?: string;
}) {
  const proposal = await prisma.leadProposal.findUnique({
    where: { id: params.proposalId },
    include: { inquiry: true },
  });

  if (!proposal) throw new Error("Proposal not found");

  const channel = params.channel || "EMAIL";
  const inquiry = proposal.inquiry;
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://taxfiling24.com";

  if (channel === "EMAIL") {
    if (!inquiry.email) throw new Error("Inquiry does not have an email address");

    const items = (proposal.lineItems as any[]) || [];
    const itemRowsHtml = items
      .map(
        (it, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-size: 13px; color: #475569;">${idx + 1}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 600;">${it.description}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: center;">${it.qty || 1}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #475569; text-align: right;">₹${(it.rate || 0).toLocaleString("en-IN")}</td>
          <td style="padding: 10px 12px; font-size: 13px; color: #0f172a; font-weight: 700; text-align: right;">₹${((it.qty || 1) * (it.rate || 0)).toLocaleString("en-IN")}</td>
        </tr>`
      )
      .join("");

    const emailSubject = `Formal Fee Quotation ${proposal.proposalNumber} - ${proposal.title} | TaxFiling24`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${emailSubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- Header -->
    <tr>
      <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);">
        <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">TaxFiling24</h1>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Corporate Legal & Tax Advisory Services</p>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
          <div>
            <span style="font-size: 11px; font-weight: 700; color: #6366f1; text-transform: uppercase; letter-spacing: 0.5px;">FEE QUOTATION</span>
            <h2 style="margin: 4px 0 0; font-size: 18px; color: #0f172a;">${proposal.title}</h2>
          </div>
        </div>

        <p style="font-size: 14px; color: #334155; margin: 0 0 16px;">
          Dear <strong>${inquiry.name}</strong>,
        </p>

        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px;">
          ${params.customMessage || "Thank you for consulting TaxFiling24. We are pleased to submit our formal professional fee proposal for your review."}
        </p>

        <!-- Meta Grid -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">Quotation Ref:</td>
            <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #0f172a;">${proposal.proposalNumber}</td>
            <td style="padding: 12px 16px; font-size: 12px; color: #64748b;">Valid Until:</td>
            <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: #0f172a;">${new Date(proposal.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</td>
          </tr>
        </table>

        <!-- Line Items -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
          <thead>
            <tr style="background-color: #0f172a; color: #ffffff;">
              <th style="padding: 10px 12px; font-size: 12px; text-align: left;">#</th>
              <th style="padding: 10px 12px; font-size: 12px; text-align: left;">Service Scope</th>
              <th style="padding: 10px 12px; font-size: 12px; text-align: center;">Qty</th>
              <th style="padding: 10px 12px; font-size: 12px; text-align: right;">Rate</th>
              <th style="padding: 10px 12px; font-size: 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRowsHtml}
          </tbody>
          <tfoot>
            <tr style="background-color: #f8fafc;">
              <td colspan="4" style="padding: 8px 12px; font-size: 13px; text-align: right; color: #64748b;">Subtotal:</td>
              <td style="padding: 8px 12px; font-size: 13px; text-align: right; font-weight: 600; color: #0f172a;">₹${proposal.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            ${
              proposal.discount > 0
                ? `<tr style="background-color: #f8fafc;">
                    <td colspan="4" style="padding: 6px 12px; font-size: 13px; text-align: right; color: #16a34a;">Discount:</td>
                    <td style="padding: 6px 12px; font-size: 13px; text-align: right; font-weight: 600; color: #16a34a;">-₹${proposal.discount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                  </tr>`
                : ""
            }
            <tr style="background-color: #f8fafc;">
              <td colspan="4" style="padding: 6px 12px; font-size: 13px; text-align: right; color: #64748b;">GST (18%):</td>
              <td style="padding: 6px 12px; font-size: 13px; text-align: right; font-weight: 600; color: #0f172a;">₹${proposal.taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr style="background-color: #eff6ff; border-top: 2px solid #3b82f6;">
              <td colspan="4" style="padding: 12px; font-size: 15px; text-align: right; font-weight: 800; color: #1e3a8a;">Grand Total:</td>
              <td style="padding: 12px; font-size: 16px; text-align: right; font-weight: 800; color: #1d4ed8;">₹${proposal.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tfoot>
        </table>

        <!-- Remittance / Payment box -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px; font-size: 12px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">Bank Details for Payment</h4>
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #475569;">
            Bank: HDFC Bank Ltd. | Account: TaxFiling24 Advisory Services<br>
            A/C No: 50200088921134 | IFSC: HDFC0001202 | UPI: taxfiling24@hdfcbank
          </p>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #64748b; margin: 0 0 24px;">
          To accept this proposal and begin your onboarding, please reply directly to this email or contact your assigned engagement manager.
        </p>

        <a href="${siteUrl}/contact" style="display: inline-block; background-color: #0f172a; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
          Accept Quotation & Connect
        </a>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 24px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="margin: 0; font-size: 12px; color: #94a3b8;">
          TaxFiling24 Advisory Services | E-244/G, Shaheen Bagh, Okhla, New Delhi 110025
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await sendTransactionalEmail({
      to: inquiry.email,
      subject: emailSubject,
      html: emailHtml,
    });
  } else if (channel === "WHATSAPP") {
    if (!inquiry.phone) throw new Error("Inquiry does not have a registered phone number.");
    const waText = `Dear *${inquiry.name}*,\n\nTaxFiling24 has prepared your formal fee quotation *${proposal.proposalNumber}* for *${proposal.title}*.\n\n` +
      `📋 *Total Payable:* ₹${proposal.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}\n` +
      `📅 *Valid Until:* ${new Date(proposal.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}\n\n` +
      (params.customMessage ? `${params.customMessage}\n\n` : "") +
      `To accept or discuss this proposal, reply directly to this chat.\n\n` +
      `Warm regards,\n*TaxFiling24 Advisory Team*`;

    const sendRes = await sendWhatsAppMessage({
      to: inquiry.phone,
      text: waText,
    });

    if (!sendRes.success) {
      throw new Error(sendRes.error || "Failed to dispatch proposal via WhatsApp Cloud API.");
    }
  }

  // Update proposal status
  const updatedProposal = await prisma.leadProposal.update({
    where: { id: params.proposalId },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  // Advance lead stage to PROPOSAL_SENT
  await prisma.inquiry.update({
    where: { id: inquiry.id },
    data: { status: "PROPOSAL_SENT" },
  });

  // Log activity
  await logLeadActivity({
    inquiryId: inquiry.id,
    type: "PROPOSAL_SENT",
    title: `Quotation Sent via ${channel} (${proposal.proposalNumber})`,
    description: `Sent to: ${inquiry.email || inquiry.phone}\nTotal Amount: ₹${proposal.totalAmount.toLocaleString("en-IN")}`,
    metadata: {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      channel,
      totalAmount: proposal.totalAmount,
    },
    performedBy: params.performedBy || "Admin",
  });

  return updatedProposal;
}

// ── Mark Proposal Accepted (Converts Lead to WON) ────────────────────
export async function markProposalAccepted(params: {
  proposalId: string;
  performedBy?: string;
}) {
  const proposal = await prisma.leadProposal.findUnique({
    where: { id: params.proposalId },
    include: { inquiry: true },
  });

  if (!proposal) throw new Error("Proposal not found");

  const updatedProposal = await prisma.leadProposal.update({
    where: { id: params.proposalId },
    data: {
      status: "ACCEPTED",
      acceptedAt: new Date(),
    },
  });

  // Advance inquiry to WON and set estimatedValue to proposal total
  await prisma.inquiry.update({
    where: { id: proposal.inquiryId },
    data: {
      status: "WON",
      estimatedValue: proposal.totalAmount,
    },
  });

  // Log activity
  await logLeadActivity({
    inquiryId: proposal.inquiryId,
    type: "PROPOSAL_ACCEPTED",
    title: `Proposal Accepted! Lead Converted to WON`,
    description: `Quotation: ${proposal.proposalNumber}\nFinal Deal Revenue: ₹${proposal.totalAmount.toLocaleString("en-IN")}`,
    metadata: {
      proposalId: proposal.id,
      proposalNumber: proposal.proposalNumber,
      wonAmount: proposal.totalAmount,
    },
    performedBy: params.performedBy || "Admin",
  });

  return updatedProposal;
}

// ── Executive CRM Metrics ────────────────────────────────────────────
export async function getLeadCrmMetrics() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [
    allInquiries,
    todayFollowUpsCount,
    overdueFollowUpsCount,
    proposalsSentCount,
    proposalsAcceptedCount,
  ] = await Promise.all([
    prisma.inquiry.findMany({
      select: {
        id: true,
        status: true,
        priority: true,
        estimatedValue: true,
      },
    }),
    prisma.leadFollowUp.count({
      where: {
        status: "PENDING",
        scheduledAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    }),
    prisma.leadFollowUp.count({
      where: {
        status: "PENDING",
        scheduledAt: {
          lt: startOfToday,
        },
      },
    }),
    prisma.leadProposal.count({
      where: { status: "SENT" },
    }),
    prisma.leadProposal.count({
      where: { status: "ACCEPTED" },
    }),
  ]);

  let pipelineValue = 0;
  let wonValue = 0;
  let activeLeads = 0;
  let wonCount = 0;
  let lostCount = 0;

  const stageCounts: Record<string, number> = {
    NEW: 0,
    CONTACTED: 0,
    FOLLOW_UP_SCHEDULED: 0,
    CONSULTATION_BOOKED: 0,
    PROPOSAL_SENT: 0,
    WON: 0,
    LOST: 0,
    ARCHIVED: 0,
  };

  for (const lead of allInquiries) {
    const st = lead.status?.toUpperCase() || "NEW";
    // Normalize legacy PENDING / RESOLVED statuses
    const normalizedStage =
      st === "PENDING"
        ? "NEW"
        : st === "RESOLVED"
        ? "WON"
        : stageCounts[st] !== undefined
        ? st
        : "NEW";

    stageCounts[normalizedStage] = (stageCounts[normalizedStage] || 0) + 1;

    const val = Number(lead.estimatedValue || 0);

    if (normalizedStage === "WON") {
      wonCount++;
      wonValue += val;
    } else if (normalizedStage === "LOST" || normalizedStage === "ARCHIVED") {
      lostCount++;
    } else {
      activeLeads++;
      pipelineValue += val;
    }
  }

  const totalLeads = allInquiries.length;
  const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  return {
    totalLeads,
    activeLeads,
    pipelineValue,
    wonValue,
    wonCount,
    lostCount,
    conversionRate,
    todayFollowUpsCount,
    overdueFollowUpsCount,
    proposalsSentCount,
    proposalsAcceptedCount,
    stageCounts,
  };
}

