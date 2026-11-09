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

export interface ProposalMilestone {
  title: string;
  percentage: number;
  amount: number;
  dueTrigger: string;
}

export interface ProposalLineItem {
  id?: string;
  category?: string;
  description: string;
  details?: string;
  sacCode?: string;
  qty: number;
  unit?: string;
  rate: number;
  gstPercent: number;
  isGovFee?: boolean;
  amount: number;
}

export interface LeadProposalRecord {
  id: string;
  inquiryId: string;
  proposalNumber: string;
  title: string;
  status: "DRAFT" | "SENT" | "ACCEPTED" | "REJECTED" | "EXPIRED" | string;
  validUntil: string | Date;
  lineItems: ProposalLineItem[];
  subtotal: number;
  discount: number;
  taxAmount: number;
  totalAmount: number;
  currency?: string;
  clientGstin?: string | null;
  clientPan?: string | null;
  clientAddress?: string | null;
  placeOfSupply?: string | null;
  taxType?: "IGST" | "CGST_SGST" | string;
  paymentMilestones?: ProposalMilestone[] | null;
  notes?: string | null;
  terms?: string | null;
  sentAt?: string | Date | null;
  acceptedAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface LeadFollowUpRecord {
  id: string;
  inquiryId: string;
  scheduledAt: string | Date;
  type: FollowUpType | string;
  title: string;
  notes?: string | null;
  status: "PENDING" | "COMPLETED" | "CANCELLED" | "MISSED" | string;
  outcome?: string | null;
  completedAt?: string | Date | null;
  assignedTo?: string | null;
  createdAt: string | Date;
}

export interface LeadActivityRecord {
  id: string;
  inquiryId: string;
  type: string;
  title: string;
  description?: string | null;
  metadata?: any;
  performedBy: string;
  createdAt: string | Date;
}

export interface InquiryLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  status: string;
  priority: LeadPriority | string;
  estimatedValue: number | null;
  assignedTo: string | null;
  company: string | null;
  city: string | null;
  source: string;
  tags?: any;
  lostReason?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  followUps?: LeadFollowUpRecord[];
  activities?: LeadActivityRecord[];
  proposals?: LeadProposalRecord[];
  _count?: {
    followUps: number;
    activities: number;
    proposals: number;
  };
}

export interface LeadMetrics {
  totalLeads: number;
  activeLeads: number;
  pipelineValue: number;
  wonValue: number;
  wonCount: number;
  lostCount: number;
  conversionRate: number;
  todayFollowUpsCount: number;
  overdueFollowUpsCount: number;
  proposalsSentCount: number;
  proposalsAcceptedCount: number;
  stageCounts: Record<string, number>;
}

export const STAGE_META: Record<
  string,
  { label: string; color: string; badge: string; border: string; bg: string }
> = {
  NEW: {
    label: "New Inquiry",
    color: "text-blue-700",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    border: "border-blue-200",
    bg: "bg-blue-50/50",
  },
  CONTACTED: {
    label: "Contacted",
    color: "text-sky-700",
    badge: "bg-sky-50 text-sky-700 ring-sky-600/20",
    border: "border-sky-200",
    bg: "bg-sky-50/50",
  },
  FOLLOW_UP_SCHEDULED: {
    label: "Follow-Up Scheduled",
    color: "text-amber-700",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    border: "border-amber-200",
    bg: "bg-amber-50/50",
  },
  CONSULTATION_BOOKED: {
    label: "Consultation Booked",
    color: "text-purple-700",
    badge: "bg-purple-50 text-purple-700 ring-purple-600/20",
    border: "border-purple-200",
    bg: "bg-purple-50/50",
  },
  PROPOSAL_SENT: {
    label: "Proposal Sent",
    color: "text-indigo-700",
    badge: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
    border: "border-indigo-200",
    bg: "bg-indigo-50/50",
  },
  WON: {
    label: "Won / Converted",
    color: "text-emerald-700",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    border: "border-emerald-200",
    bg: "bg-emerald-50/50",
  },
  LOST: {
    label: "Lost / Closed",
    color: "text-rose-700",
    badge: "bg-rose-50 text-rose-700 ring-rose-600/20",
    border: "border-rose-200",
    bg: "bg-rose-50/50",
  },
  ARCHIVED: {
    label: "Archived",
    color: "text-slate-600",
    badge: "bg-slate-50 text-slate-600 ring-slate-500/20",
    border: "border-slate-200",
    bg: "bg-slate-50/50",
  },
};

export const PRIORITY_META: Record<string, { label: string; badge: string }> = {
  URGENT: {
    label: "Urgent",
    badge: "bg-red-50 text-red-700 ring-red-600/20 font-bold",
  },
  HIGH: {
    label: "High",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20 font-semibold",
  },
  MEDIUM: {
    label: "Medium",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
  },
  LOW: {
    label: "Low",
    badge: "bg-slate-50 text-slate-600 ring-slate-600/20",
  },
};

