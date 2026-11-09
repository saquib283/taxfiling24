"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Columns2,
  Copy,
  Eye,
  EyeOff,
  Filter,
  Inbox,
  Layers,
  Loader2,
  Mail,
  MessageSquare,
  Monitor,
  PenSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings2,
  Smartphone,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
  Wand2,
  X,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import {
  EMAIL_PROVIDERS,
  getProviderLabel,
  type EmailProvider,
} from "@/lib/email-campaigns";

type CampaignTemplateRecord = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  subject: string;
  preheader: string | null;
  content: string;
  isAiGenerated: boolean;
};

type CampaignRecord = {
  id: string;
  name: string | null;
  subject: string;
  preheader: string | null;
  content: string;
  status: string;
  provider: string;
  audience: string;
  templateId: string | null;
  recipientCount: number;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  failedCount: number;
  lastEventAt: string | null;
  sentAt: string | null;
  updatedAt: string;
  createdAt: string;
};

type SubscriberRecord = {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  createdAt: string;
};

type WorkspaceData = {
  campaigns: CampaignRecord[];
  templates: CampaignTemplateRecord[];
  subscribers: SubscriberRecord[];
  summary: {
    activeSubscriberCount: number;
    averageClickRate: number;
    averageOpenRate: number;
    sentCampaignCount: number;
    subscriberCount: number;
    suppressedSubscriberCount: number;
    templateCount: number;
    totalBounces: number;
    totalDelivered: number;
    totalSent: number;
  };
  provider: {
    fromEmail: string;
    fromName: string;
    mailgunDomain: string;
    mailgunRegion: "US" | "EU";
    replyTo: string;
    resendAudienceId: string;
    selectedProvider: EmailProvider;
    statuses: Record<EmailProvider, boolean>;
    webhookUrls: Record<EmailProvider, string>;
  };
};

type CampaignFormState = {
  id?: string;
  channel?: "EMAIL" | "WHATSAPP";
  name: string;
  subject: string;
  preheader: string;
  content: string;
  provider: EmailProvider | "WHATSAPP";
  audience: string;
  templateId: string | null;
};

type TemplateDraftState = {
  id?: string;
  name: string;
  description: string;
  category: string;
  content?: string;
  subject?: string;
  preheader?: string;
  isAiGenerated: boolean;
};

type ProviderSettingsState = {
  EMAIL_PROVIDER: EmailProvider;
  EMAIL_FROM_NAME: string;
  EMAIL_FROM_EMAIL: string;
  EMAIL_REPLY_TO: string;
  RESEND_API_KEY: string;
  RESEND_AUDIENCE_ID: string;
  MAILGUN_API_KEY: string;
  MAILGUN_DOMAIN: string;
  MAILGUN_REGION: "US" | "EU";
  SMTP_HOST: string;
  SMTP_PORT: string;
  SMTP_USER: string;
  SMTP_PASS: string;
};

type ActiveTab = "composer" | "campaigns" | "templates" | "audience" | "settings";

const DEFAULT_TEMPLATE_DRAFT: TemplateDraftState = {
  category: "Newsletter",
  description: "",
  isAiGenerated: false,
  name: "",
};

const STARTER_TEMPLATES = [
  {
    category: "Compliance Alert",
    content:
      "<h2>Upcoming Compliance &amp; Statutory Due Date Notice</h2><p>Dear Valued Client,</p><p>This is an advance advisory from <strong>TaxFiling24</strong> regarding your upcoming regulatory requirements for this period:</p><ul><li><strong>Compliance:</strong> GST Monthly GSTR-3B / ITR / Advance Tax Installment</li><li><strong>Applicable Quarter:</strong> Current Financial Year</li><li><strong>Required Action:</strong> Verify invoices and submit supporting documents to your assigned CA.</li></ul><p>Avoid last-minute interest charges and late penalties. Reply to this email or book a call on our portal to finalize your filing.</p><p>Warm regards,<br><strong>TaxFiling24 Advisory Team</strong></p>",
    description: "Official statutory due-date reminder for business clients and taxpayers.",
    name: "Statutory Deadline Alert",
    preheader: "Important due date alert with action items and document checklist.",
    subject: "Important Compliance Notice: Upcoming Statutory Deadline",
  },
  {
    category: "Newsletter",
    content:
      "<h2>TaxFiling24 Monthly Insights &amp; Regulatory Digest</h2><p>Hello,</p><p>Here is your monthly brief of essential direct tax changes, GST notifications, and practical business advice:</p><h3>1. Direct Tax &amp; Income Tax Updates</h3><p>Key revisions under the New Tax Regime, revised standard deduction limits (₹75,000 u/s 16), and rebate thresholds under Section 87A.</p><h3>2. Goods &amp; Services Tax (GST)</h3><p>Mandatory input tax credit (ITC) reconciliation with GSTR-2B and revised e-invoicing compliance norms.</p><p>Have questions on how these changes impact your enterprise? Reply directly to speak with our senior tax consultant.</p>",
    description: "Monthly regulatory round-up for clients and registered subscribers.",
    name: "Monthly Regulatory Digest",
    preheader: "Your monthly round-up of tax reforms and compliance advisories.",
    subject: "Monthly Tax Insights & Regulatory Updates — TaxFiling24",
  },
  {
    category: "Advisory",
    content:
      "<h2>Maximize Your Tax Savings with Early Strategic Planning</h2><p>Dear Professional,</p><p>Proactive tax planning shouldn't wait until the fiscal year-end. By structuring investments and allowable deductions early, you can optimize cash flows and minimize net liability.</p><ul><li>Compare New Regime vs. Old Regime tax incidence</li><li>Maximize Section 80C, 80D, and NPS allocations</li><li>Optimize business expense documentation &amp; depreciation</li></ul><p>Schedule a 1-on-1 strategy call with our chartered accountants today.</p>",
    description: "Strategic tax planning advisory for high-earning individuals & SMEs.",
    name: "Tax Planning Advisory",
    preheader: "Actionable strategies to legally optimize your tax liability early.",
    subject: "Strategic Tax Planning Advisory for FY 2025-26",
  },
];

const AI_PROMPTS = [
  "GST GSTR-3B monthly filing deadline reminder with key documents checklist",
  "Income Tax Return (ITR) deadline announcement highlighting New Regime benefits",
  "Quarterly TDS payment and reconciliation reminder for businesses",
  "Annual ROC filing compliance reminder (Forms AOC-4 and MGT-7)",
  "Startup India DPIIT recognition tax exemption guidance newsletter",
];

function createDefaultCampaign(provider: EmailProvider): CampaignFormState {
  return {
    audience: "ALL_ACTIVE",
    content:
      "<h2>Important Update from TaxFiling24</h2><p>Start drafting your message here. You can format text, embed lists or tables, generate drafts with AI, or load a pre-built template from your library.</p><p>Reply to this email if you have any questions.</p>",
    name: "",
    preheader: "",
    provider,
    subject: "",
    templateId: null,
  };
}

function buildProviderSettings(
  raw: Record<string, string>,
  providerInfo: WorkspaceData["provider"]
): ProviderSettingsState {
  return {
    EMAIL_FROM_EMAIL: raw.EMAIL_FROM_EMAIL || providerInfo.fromEmail || "",
    EMAIL_FROM_NAME: raw.EMAIL_FROM_NAME || providerInfo.fromName || "TaxFiling24",
    EMAIL_PROVIDER: (raw.EMAIL_PROVIDER as EmailProvider) || providerInfo.selectedProvider,
    EMAIL_REPLY_TO: raw.EMAIL_REPLY_TO || providerInfo.replyTo || providerInfo.fromEmail || "",
    MAILGUN_API_KEY: raw.MAILGUN_API_KEY || "",
    MAILGUN_DOMAIN: raw.MAILGUN_DOMAIN || providerInfo.mailgunDomain || "",
    MAILGUN_REGION: ((raw.MAILGUN_REGION as "US" | "EU") || providerInfo.mailgunRegion || "US"),
    RESEND_API_KEY: raw.RESEND_API_KEY || "",
    RESEND_AUDIENCE_ID: raw.RESEND_AUDIENCE_ID || providerInfo.resendAudienceId || "",
    SMTP_HOST: raw.SMTP_HOST || "",
    SMTP_PASS: raw.SMTP_PASS || "",
    SMTP_PORT: raw.SMTP_PORT || "",
    SMTP_USER: raw.SMTP_USER || "",
  };
}

function formatWhatsAppPreview(rawText: string): string {
  if (!rawText) return "";
  let text = rawText
    .replace(/\{\{name\}\}/gi, "Rahul Sharma")
    .replace(/\{\{company\}\}/gi, "Acme Solutions Pvt Ltd")
    .replace(/\{\{service\}\}/gi, "Corporate Tax Filing");

  // Escape HTML
  text = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Convert WhatsApp markdown: *bold*, _italic_, ~strike~, ```code```
  text = text.replace(/\*(.*?)\*/g, "<strong>$1</strong>");
  text = text.replace(/_(.*?)_/g, "<em>$1</em>");
  text = text.replace(/~(.*?)~/g, "<del>$1</del>");
  text = text.replace(/```(.*?)```/g, "<code class='bg-black/5 px-1 rounded font-mono text-[11px]'>$1</code>");
  text = text.replace(/\n/g, "<br />");
  text = text.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" target="_blank" rel="noreferrer" class="text-blue-600 underline font-medium break-all">$1</a>'
  );
  return text;
}

function campaignToForm(campaign: CampaignRecord): CampaignFormState {
  const isWa = campaign.provider === "WHATSAPP";
  return {
    audience: campaign.audience || "ALL_ACTIVE",
    channel: isWa ? "WHATSAPP" : "EMAIL",
    content: campaign.content,
    id: campaign.id,
    name: campaign.name || "",
    preheader: campaign.preheader || "",
    provider: isWa
      ? "WHATSAPP"
      : campaign.provider === "RESEND" || campaign.provider === "MAILGUN"
      ? campaign.provider
      : "SMTP",
    subject: campaign.subject,
    templateId: campaign.templateId,
  };
}

function formatPercent(value: number) {
  return `${(value * 100).toFixed(value > 0 && value < 0.1 ? 1 : 0)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function getRate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export default function CampaignStudio() {
  const searchParams = useSearchParams();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("composer");
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(createDefaultCampaign("SMTP"));
  const [templateDraft, setTemplateDraft] = useState<TemplateDraftState>(DEFAULT_TEMPLATE_DRAFT);
  const [providerSettings, setProviderSettings] = useState<ProviderSettingsState>({
    EMAIL_FROM_EMAIL: "",
    EMAIL_FROM_NAME: "TaxFiling24",
    EMAIL_PROVIDER: "SMTP",
    EMAIL_REPLY_TO: "",
    MAILGUN_API_KEY: "",
    MAILGUN_DOMAIN: "",
    MAILGUN_REGION: "US",
    RESEND_API_KEY: "",
    RESEND_AUDIENCE_ID: "",
    SMTP_HOST: "",
    SMTP_PASS: "",
    SMTP_PORT: "",
    SMTP_USER: "",
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [composeView, setComposeView] = useState<"edit" | "preview" | "split">("edit");
  const [showAiBar, setShowAiBar] = useState(false);
  const [showPreflightDetails, setShowPreflightDetails] = useState(false);
  const [campaignChannel, setCampaignChannel] = useState<"EMAIL" | "WHATSAPP">("EMAIL");
  const [testPhoneNumber, setTestPhoneNumber] = useState("919162712267");

  // Modals & Dialogs
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);

  // Sync audience parameter from URL
  useEffect(() => {
    const audienceParam = searchParams.get("audience");
    if (audienceParam) {
      setCampaignForm((c) => ({ ...c, audience: audienceParam }));
      setActiveTab("composer");
    }
  }, [searchParams]);
  const [showTestEmailModal, setShowTestEmailModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState("");
  const [showSaveTemplateModal, setShowSaveTemplateModal] = useState(false);
  const [showAddSubscriberModal, setShowAddSubscriberModal] = useState(false);
  const [newSubscriberForm, setNewSubscriberForm] = useState({ email: "", name: "" });
  const [addingSubscriber, setAddingSubscriber] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<CampaignRecord | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<CampaignTemplateRecord | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<{ name: string; content: string; subject: string } | null>(null);

  // Filters & Search
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("ALL");
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriberStatusFilter, setSubscriberStatusFilter] = useState<"ALL" | "ACTIVE" | "SUPPRESSED">("ALL");
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState("ALL");
  const [showSecrets, setShowSecrets] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const loadWorkspace = useCallback(async (options?: { initial?: boolean; preserveCampaign?: boolean }) => {
    const preserveCampaign = options?.preserveCampaign ?? true;
    const initial = options?.initial ?? false;

    if (!initial) {
      setRefreshing(true);
    }

    try {
      const [workspaceResponse, settingsResponse] = await Promise.all([
        fetch("/api/admin/campaigns"),
        fetch("/api/admin/settings"),
      ]);

      const isWorkspaceOk = workspaceResponse.ok;
      const parsedWorkspaceData = await workspaceResponse.json().catch(() => null);

      if (!isWorkspaceOk) {
        throw new Error(parsedWorkspaceData?.error || "Unable to load the campaign workspace.");
      }

      const nextWorkspace = parsedWorkspaceData as WorkspaceData;
      const rawSettings = settingsResponse.ok
        ? ((await settingsResponse.json()) as Record<string, string>)
        : {};

      setWorkspace(nextWorkspace);
      const nextProviderSettings = buildProviderSettings(rawSettings, nextWorkspace.provider);
      setProviderSettings(nextProviderSettings);

      if (!testEmailAddress && nextProviderSettings.EMAIL_FROM_EMAIL) {
        setTestEmailAddress(nextProviderSettings.EMAIL_FROM_EMAIL);
      }

      if (!preserveCampaign) {
        const draft =
          nextWorkspace.campaigns.find((campaign) => campaign.status === "DRAFT") ||
          nextWorkspace.campaigns[0];

        setCampaignForm(
          draft ? campaignToForm(draft) : createDefaultCampaign(nextProviderSettings.EMAIL_PROVIDER)
        );
      }
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to load the campaign workspace.",
        type: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [testEmailAddress]);

  useEffect(() => {
    void loadWorkspace({ initial: true, preserveCampaign: false });
  }, [loadWorkspace]);

  // Copy helper
  const handleCopy = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Draft operations
  async function saveDraft() {
    setSavingDraft(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/campaigns", {
        body: JSON.stringify({
          ...campaignForm,
          fromEmail: providerSettings.EMAIL_FROM_EMAIL,
          fromName: providerSettings.EMAIL_FROM_NAME,
          replyTo: providerSettings.EMAIL_REPLY_TO,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = (await response.json()) as { campaign?: CampaignRecord; error?: string };

      if (!response.ok || !data.campaign) {
        throw new Error(data.error || "Unable to save this campaign draft.");
      }

      setCampaignForm((current) => ({ ...current, id: data.campaign?.id || current.id }));
      setFeedback({ text: "Draft saved successfully.", type: "success" });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to save this campaign draft.",
        type: "error",
      });
    } finally {
      setSavingDraft(false);
    }
  }

  // Send Test Email
  async function sendTestEmailNow() {
    const isWa = campaignChannel === "WHATSAPP";
    const recipient = isWa ? testPhoneNumber.trim() : testEmailAddress.trim();

    if (!recipient) {
      setFeedback({
        text: isWa
          ? "Please enter a destination phone number for the test."
          : "Please enter a destination email address for the test.",
        type: "error",
      });
      return;
    }
    if (!campaignForm.subject.trim() || !campaignForm.content.trim()) {
      setFeedback({ text: "Please add a subject and content before sending a test.", type: "error" });
      return;
    }

    setSendingTest(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/campaigns/send", {
        body: JSON.stringify({
          ...campaignForm,
          channel: campaignChannel,
          provider: isWa ? "WHATSAPP" : campaignForm.provider,
          fromEmail: providerSettings.EMAIL_FROM_EMAIL,
          fromName: providerSettings.EMAIL_FROM_NAME,
          replyTo: providerSettings.EMAIL_REPLY_TO,
          testRecipient: recipient,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to deliver test dispatch.");
      }

      setShowTestEmailModal(false);
      setFeedback({
        text: isWa
          ? `Test WhatsApp message dispatched to ${recipient} successfully! Check your phone.`
          : `Test email dispatched to ${recipient} successfully! Check your inbox.`,
        type: "success",
      });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Failed to deliver test dispatch.",
        type: "error",
      });
    } finally {
      setSendingTest(false);
    }
  }

  // Send Campaign Broadcast
  async function sendCampaignNow() {
    if (!campaignForm.subject.trim() || !campaignForm.content.trim()) {
      setFeedback({
        text: "Add a subject line and message body before sending.",
        type: "error",
      });
      return;
    }

    setSending(true);
    setFeedback(null);
    setShowSendConfirmModal(false);

    try {
      const isWa = campaignChannel === "WHATSAPP";
      const response = await fetch("/api/admin/campaigns/send", {
        body: JSON.stringify({
          ...campaignForm,
          channel: campaignChannel,
          provider: isWa ? "WHATSAPP" : campaignForm.provider,
          fromEmail: providerSettings.EMAIL_FROM_EMAIL,
          fromName: providerSettings.EMAIL_FROM_NAME,
          replyTo: providerSettings.EMAIL_REPLY_TO,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = (await response.json()) as {
        campaign?: CampaignRecord;
        error?: string;
        errors?: string[];
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to send this campaign.");
      }

      setCampaignForm((current) => ({ ...current, id: data.campaign?.id || current.id }));
      setFeedback({
        text: data.errors?.length
          ? `Campaign broadcast completed with ${data.errors.length} provider notice(s).`
          : "Campaign broadcast sent successfully to all active subscribers!",
        type: "success",
      });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to send this campaign.",
        type: "error",
      });
    } finally {
      setSending(false);
    }
  }

  // AI draft generator
  async function generateWithAi(promptToUse?: string) {
    const prompt = promptToUse || aiBrief;
    if (!prompt.trim()) {
      setFeedback({ text: "Please enter or pick an AI prompt topic.", type: "error" });
      return;
    }

    setAiLoading(true);
    setFeedback(null);

    try {
      const isWa = campaignChannel === "WHATSAPP";
      const response = await fetch("/api/admin/ai/generate", {
        body: JSON.stringify({
          category: isWa ? "WhatsApp Broadcast Message" : "Email Campaign",
          title: campaignForm.subject || templateDraft.name || (isWa ? "WhatsApp Campaign" : "Campaign draft"),
          topic: prompt.trim() + (isWa ? " (Draft a concise 2-4 sentence WhatsApp broadcast message with emojis, *bold* highlights, and no HTML tags)" : ""),
          type: isWa ? "reply" : "email",
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = (await response.json()) as { error?: string; reply?: string };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || "Unable to generate the AI draft.");
      }

      setCampaignForm((current) => ({ ...current, content: data.reply || current.content }));
      setTemplateDraft((current) => ({ ...current, isAiGenerated: true }));
      setFeedback({ text: "AI draft generated and inserted into the editor.", type: "success" });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to generate AI content.",
        type: "error",
      });
    } finally {
      setAiLoading(false);
    }
  }

  // Template saving & deletion
  async function saveTemplate() {
    if (!templateDraft.name.trim()) {
      setFeedback({ text: "Add a template name before saving.", type: "error" });
      return;
    }

    if (!campaignForm.subject.trim() || !campaignForm.content.trim()) {
      setFeedback({
        text: "The current campaign needs a subject and content before it can become a template.",
        type: "error",
      });
      return;
    }

    setSavingTemplate(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/campaigns/templates", {
        body: JSON.stringify({
          ...templateDraft,
          content: campaignForm.content,
          preheader: campaignForm.preheader,
          subject: campaignForm.subject,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = (await response.json()) as {
        error?: string;
        template?: CampaignTemplateRecord;
      };

      if (!response.ok || !data.template) {
        throw new Error(data.error || "Unable to save this template.");
      }

      setTemplateDraft(DEFAULT_TEMPLATE_DRAFT);
      setShowSaveTemplateModal(false);
      setCampaignForm((current) => ({ ...current, templateId: data.template?.id || null }));
      setFeedback({ text: `Template "${data.template.name}" saved to library.`, type: "success" });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to save this template.",
        type: "error",
      });
    } finally {
      setSavingTemplate(false);
    }
  }

  async function deleteTemplate(templateId: string) {
    try {
      const response = await fetch(`/api/admin/campaigns/templates/${templateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Unable to delete this template.");
      }

      if (campaignForm.templateId === templateId) {
        setCampaignForm((current) => ({ ...current, templateId: null }));
      }

      setTemplateToDelete(null);
      setFeedback({ text: "Template removed from library.", type: "success" });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to delete template.",
        type: "error",
      });
    }
  }

  // Campaign Deletion
  async function deleteCampaign(campaignId: string) {
    try {
      const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete campaign.");
      }

      setCampaignToDelete(null);
      setFeedback({ text: "Campaign deleted successfully.", type: "success" });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Failed to delete campaign.",
        type: "error",
      });
    }
  }

  // Duplicate campaign
  function duplicateCampaign(campaign: CampaignRecord) {
    setCampaignForm({
      audience: campaign.audience,
      content: campaign.content,
      name: `Copy of ${campaign.name || campaign.subject}`,
      preheader: campaign.preheader || "",
      provider:
        campaign.provider === "RESEND" || campaign.provider === "MAILGUN"
          ? campaign.provider
          : "SMTP",
      subject: `${campaign.subject} (Copy)`,
      templateId: campaign.templateId,
    });
    setActiveTab("composer");
    setFeedback({ text: "Campaign duplicated as a new draft in the composer.", type: "success" });
  }

  // Provider configuration
  async function saveProviderConfiguration() {
    setSavingProvider(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/settings", {
        body: JSON.stringify({ settings: providerSettings }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to save provider configuration.");
      }

      setFeedback({
        text: `${getProviderLabel(providerSettings.EMAIL_PROVIDER)} settings saved successfully.`,
        type: "success",
      });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to save provider settings.",
        type: "error",
      });
    } finally {
      setSavingProvider(false);
    }
  }

  // Subscriber actions
  async function addSubscriber() {
    if (!newSubscriberForm.email.trim()) {
      setFeedback({ text: "Please provide an email address.", type: "error" });
      return;
    }

    setAddingSubscriber(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/subscribers", {
        body: JSON.stringify(newSubscriberForm),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to add subscriber.");
      }

      setNewSubscriberForm({ email: "", name: "" });
      setShowAddSubscriberModal(false);
      setFeedback({ text: `Subscriber ${newSubscriberForm.email} added.`, type: "success" });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Failed to add subscriber.",
        type: "error",
      });
    } finally {
      setAddingSubscriber(false);
    }
  }

  async function toggleSubscriberActive(subscriber: SubscriberRecord) {
    try {
      const response = await fetch(`/api/admin/subscribers/${subscriber.id}`, {
        body: JSON.stringify({ isActive: !subscriber.isActive }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error("Failed to update subscriber status.");
      }

      setFeedback({
        text: `Subscriber ${subscriber.email} marked as ${!subscriber.isActive ? "active" : "suppressed"}.`,
        type: "success",
      });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Failed to update subscriber.",
        type: "error",
      });
    }
  }

  async function removeSubscriber(subscriberId: string) {
    if (!window.confirm("Remove this subscriber permanently?")) return;

    try {
      const response = await fetch(`/api/admin/subscribers/${subscriberId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove subscriber.");
      }

      setFeedback({ text: "Subscriber removed.", type: "success" });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Failed to delete subscriber.",
        type: "error",
      });
    }
  }

  // Pre-flight checks
  const preflight = useMemo(() => {
    const isWa = campaignChannel === "WHATSAPP";
    const hasSubject = campaignForm.subject.trim().length >= 3;
    const hasContent = campaignForm.content.trim().length > 10;
    const hasPreheader = isWa ? true : Boolean(campaignForm.preheader?.trim());
    const isProviderReady = isWa ? true : Boolean(workspace?.provider.statuses[campaignForm.provider as EmailProvider]);
    const phoneCount = (workspace?.subscribers as any[])?.filter((s) => s.phone && s.phone.trim().length > 0).length ?? 0;
    const hasActiveSubscribers = isWa ? phoneCount > 0 : (workspace?.summary.activeSubscriberCount ?? 0) > 0;
    const allPassed = hasSubject && hasContent && isProviderReady && hasActiveSubscribers;

    return {
      allPassed,
      hasActiveSubscribers,
      hasContent,
      hasPreheader,
      hasSubject,
      isProviderReady,
      phoneCount,
    };
  }, [campaignForm, workspace, campaignChannel]);

  // Filtered lists
  const filteredCampaigns = useMemo(() => {
    if (!workspace) return [];
    return workspace.campaigns.filter((c) => {
      const matchesSearch =
        c.subject.toLowerCase().includes(campaignSearch.toLowerCase()) ||
        (c.name && c.name.toLowerCase().includes(campaignSearch.toLowerCase()));
      const matchesStatus =
        campaignStatusFilter === "ALL" || c.status === campaignStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workspace, campaignSearch, campaignStatusFilter]);

  const allTemplates = useMemo(() => {
    if (!workspace) return STARTER_TEMPLATES;
    return [...workspace.templates, ...STARTER_TEMPLATES];
  }, [workspace]);

  const filteredTemplates = useMemo(() => {
    if (templateCategoryFilter === "ALL") return allTemplates;
    return allTemplates.filter((t) => t.category === templateCategoryFilter);
  }, [allTemplates, templateCategoryFilter]);

  const filteredSubscribers = useMemo(() => {
    if (!workspace) return [];
    return workspace.subscribers.filter((s) => {
      const matchesSearch =
        s.email.toLowerCase().includes(subscriberSearch.toLowerCase()) ||
        (s.name && s.name.toLowerCase().includes(subscriberSearch.toLowerCase()));
      const matchesStatus =
        subscriberStatusFilter === "ALL" ||
        (subscriberStatusFilter === "ACTIVE" ? s.isActive : !s.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [workspace, subscriberSearch, subscriberStatusFilter]);

  if (loading) {
    return (
      <div className="p-8 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-800" />
        <p className="text-sm font-semibold text-slate-600">Loading Campaign Studio...</p>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-8 min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-600" />
        <p className="text-sm font-bold text-slate-800">{feedback?.text || "Failed to load workspace."}</p>
        <button
          onClick={() => void loadWorkspace({ initial: true, preserveCampaign: false })}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const providerReady =
    campaignForm.provider === "WHATSAPP"
      ? true
      : workspace.provider.statuses[campaignForm.provider as EmailProvider];

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-50/60 min-h-screen">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-3 py-1 text-xs font-bold text-indigo-800">
            <Mail className="h-3.5 w-3.5 text-indigo-600" />
            Email Broadcast &amp; Marketing Hub
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Campaign Studio</h1>
          <p className="text-xs text-slate-500">
            Create newsletters, automate regulatory alerts, inspect analytics, and manage subscriber delivery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-center min-w-[85px]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Audience</div>
            <div className="text-lg font-black text-slate-900">{workspace.summary.activeSubscriberCount}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-center min-w-[85px]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg Open</div>
            <div className="text-lg font-black text-slate-900">{formatPercent(workspace.summary.averageOpenRate)}</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-3.5 py-2 text-center min-w-[85px]">
            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avg Click</div>
            <div className="text-lg font-black text-slate-900">{formatPercent(workspace.summary.averageClickRate)}</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCampaignForm(createDefaultCampaign(providerSettings.EMAIL_PROVIDER));
              setActiveTab("composer");
            }}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition active:scale-95 cursor-pointer shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </button>
        </div>
      </div>

      {/* Floating Feedback Alert */}
      {feedback && (
        <div
          className={`rounded-2xl border px-5 py-3 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in duration-200 ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Prominent Tab Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-200/60 p-1 rounded-2xl shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("composer")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "composer"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <PenSquare className="h-3.5 w-3.5 text-indigo-600" />
            Compose
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("campaigns")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "campaigns"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Inbox className="h-3.5 w-3.5 text-indigo-600" />
            Past Campaigns
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-700">
              {workspace.campaigns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "templates"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-violet-600" />
            Template Library
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-700">
              {allTemplates.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audience")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "audience"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-emerald-600" />
            Audience &amp; Subscribers
            <span className="rounded-full bg-slate-100 px-1.5 py-0.2 text-[10px] font-extrabold text-slate-700">
              {workspace.subscribers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeTab === "settings"
                ? "bg-white text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Settings2 className="h-3.5 w-3.5 text-amber-600" />
            Delivery Providers
            <span
              className={`h-2 w-2 rounded-full ${
                workspace.provider.statuses[providerSettings.EMAIL_PROVIDER]
                  ? "bg-emerald-500"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
          </button>
        </div>

        <button
          type="button"
          onClick={() => void loadWorkspace({ preserveCampaign: true })}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer shadow-sm disabled:opacity-60"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: COMPOSE (CLEAN, FOCUSED WRITING & LIVE PREVIEW)   */}
      {/* ======================================================== */}
      {activeTab === "composer" && (
        <div className="space-y-6">
          {/* Unified Composer Action Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <PenSquare className="h-4 w-4" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 leading-tight">
                    {campaignForm.name || campaignForm.subject || "Untitled Campaign"}
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">
                      {campaignForm.id ? "Draft saved" : "New campaign draft"}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] font-medium text-slate-500">
                      {campaignChannel === "WHATSAPP"
                        ? `Audience: ${preflight.phoneCount} mobile contacts`
                        : `Audience: ${workspace.summary.activeSubscriberCount} contacts`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Channel Selector: Email vs WhatsApp */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setCampaignChannel("EMAIL");
                    setCampaignForm((c) => ({
                      ...c,
                      channel: "EMAIL",
                      provider: c.provider === "WHATSAPP" ? (workspace?.provider.selectedProvider || "SMTP") : c.provider,
                    }));
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    campaignChannel === "EMAIL"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Mail className="h-3.5 w-3.5 text-indigo-600" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCampaignChannel("WHATSAPP");
                    setCampaignForm((c) => ({
                      ...c,
                      channel: "WHATSAPP",
                      provider: "WHATSAPP",
                      content:
                        c.content && !c.content.includes("<p>") && !c.content.includes("<div>")
                          ? c.content
                          : "*Important Compliance Advisory from TaxFiling24* 📄\n\nDear {{name}},\n\nThis is an official advisory regarding statutory compliance for *{{company}}*.\n\nKindly ensure your filings are completed within the designated window to prevent MCA penalties.\n\nFor immediate advisory or queries, reply here or schedule a CA consultation:\nhttps://taxfiling24.com/book\n\nRegards,\n*TaxFiling24 Team*",
                    }));
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    campaignChannel === "WHATSAPP"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-emerald-700"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  WhatsApp
                </button>
              </div>

              {/* Preflight Status Pill */}
              <button
                type="button"
                onClick={() => setShowPreflightDetails(!showPreflightDetails)}
                className={`ml-1 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  preflight.allPassed
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                }`}
              >
                {preflight.allPassed ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Ready to send
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                    Preflight checklist
                    <ChevronDown className={`h-3 w-3 transition-transform ${showPreflightDetails ? "rotate-180" : ""}`} />
                  </>
                )}
              </button>
            </div>

            {/* Actions & View Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* View Mode Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setComposeView("edit")}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    composeView === "edit"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Focused Writing Canvas"
                >
                  <PenSquare className="h-3.5 w-3.5" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setComposeView("preview")}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    composeView === "preview"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Full Live Email Preview"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </button>
                <button
                  type="button"
                  onClick={() => setComposeView("split")}
                  className={`hidden xl:inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    composeView === "split"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Side-by-Side Split View"
                >
                  <Columns2 className="h-3.5 w-3.5" />
                  Split
                </button>
              </div>

              {/* AI Assistant Toggle */}
              <button
                type="button"
                onClick={() => setShowAiBar(!showAiBar)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-sm ${
                  showAiBar
                    ? "bg-amber-50 text-amber-900 border-amber-200"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                AI Assistant
              </button>

              {/* Save Draft */}
              <button
                type="button"
                onClick={saveDraft}
                disabled={savingDraft}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {savingDraft ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </button>

              {/* Send Test */}
              <button
                type="button"
                onClick={() => setShowTestEmailModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition active:scale-95 cursor-pointer shadow-sm"
              >
                <Send className="h-3.5 w-3.5 text-indigo-600" />
                Test
              </button>

              {/* Broadcast */}
              <button
                type="button"
                onClick={() => setShowSendConfirmModal(true)}
                disabled={!preflight.allPassed || sending}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-white font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer disabled:opacity-50 ${
                  campaignChannel === "WHATSAPP"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : campaignChannel === "WHATSAPP" ? (
                  <MessageSquare className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {campaignChannel === "WHATSAPP" ? "Broadcast WhatsApp" : "Broadcast"}
              </button>
            </div>
          </div>

          {/* Collapsible Preflight Checklist Details */}
          {showPreflightDetails && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800">Pre-flight Launch Requirements</span>
                <button
                  type="button"
                  onClick={() => setShowPreflightDetails(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 font-medium"
                >
                  Close
                </button>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Subject line</span>
                  {preflight.hasSubject ? (
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>
                  ) : (
                    <span className="font-bold text-amber-600">Required (min 4 chars)</span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Email content</span>
                  {preflight.hasContent ? (
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>
                  ) : (
                    <span className="font-bold text-amber-600">Required</span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Inbox preheader</span>
                  {preflight.hasPreheader ? (
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Ready</span>
                  ) : (
                    <span className="text-slate-400 font-medium">Recommended</span>
                  )}
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <span className="text-slate-600">Route ({campaignForm.provider})</span>
                  {preflight.isProviderReady ? (
                    <span className="font-bold text-emerald-600 flex items-center gap-1"><Check className="h-3 w-3" /> Connected</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="font-bold text-amber-600 hover:underline"
                    >
                      Setup Route
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Drafting Assistant (Expandable Drawer) */}
          {showAiBar && (
            <div className="bg-gradient-to-r from-amber-50/70 via-indigo-50/50 to-slate-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm space-y-3.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Gemini AI Campaign Assistant
                </div>
                <button
                  type="button"
                  onClick={() => setShowAiBar(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {AI_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => {
                      setAiBrief(prompt);
                      void generateWithAi(prompt);
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-700 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition cursor-pointer"
                  >
                    + {prompt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  placeholder="Or describe the campaign (e.g. Notify private companies of ROC Form AOC-4 deadline)..."
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition outline-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void generateWithAi();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void generateWithAi()}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm shrink-0"
                >
                  {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  Generate
                </button>
              </div>
            </div>
          )}

          {/* Main Body Content: Based on ComposeView Mode */}
          <div className={composeView === "split" ? "grid gap-6 xl:grid-cols-2 items-start" : "space-y-6"}>
            {/* Editor Canvas (Shown in "edit" and "split" views) */}
            {(composeView === "edit" || composeView === "split") && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-7 shadow-sm space-y-5">
                {/* Subject & Preheader */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      {campaignChannel === "WHATSAPP" ? "Campaign Reference / Internal Topic" : "Subject Line"}
                    </label>
                    <input
                      value={campaignForm.subject}
                      onChange={(e) =>
                        setCampaignForm((c) => ({
                          ...c,
                          name: c.name || e.target.value,
                          subject: e.target.value,
                        }))
                      }
                      placeholder={
                        campaignChannel === "WHATSAPP"
                          ? "e.g. MCA Annual Return Compliance Advisory"
                          : "e.g. Action Required: Your statutory compliance checklist"
                      }
                      className="w-full text-base sm:text-lg font-bold text-slate-900 placeholder-slate-300 border-0 border-b border-slate-200 pb-2 focus:border-indigo-600 transition outline-none font-sans"
                    />
                  </div>

                  {campaignChannel === "EMAIL" && (
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Inbox Preheader Preview
                      </label>
                      <input
                        value={campaignForm.preheader}
                        onChange={(e) => setCampaignForm((c) => ({ ...c, preheader: e.target.value }))}
                        placeholder="Add brief summary shown beside subject in email inboxes..."
                        className="w-full text-xs text-slate-700 placeholder-slate-400 border-0 border-b border-slate-100 pb-2 focus:border-indigo-400 transition outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Dispatch & Metadata Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-b border-slate-100 pb-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Provider:</span>
                    {campaignChannel === "WHATSAPP" ? (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Meta WhatsApp Cloud API (v21.0)</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        {EMAIL_PROVIDERS.map((provider) => (
                          <button
                            key={provider}
                            type="button"
                            onClick={() => setCampaignForm((c) => ({ ...c, provider }))}
                            className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                              campaignForm.provider === provider
                                ? "bg-slate-900 text-white shadow-sm"
                                : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {getProviderLabel(provider)}
                          </button>
                        ))}
                      </div>
                    )}
                    {campaignChannel === "EMAIL" && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                          providerReady
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-amber-200 bg-amber-50 text-amber-800"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${providerReady ? "bg-emerald-500" : "bg-amber-400 animate-pulse"}`} />
                        {providerReady ? "Ready" : "Not configured"}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <label className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <span className="font-bold text-slate-400 uppercase">Audience:</span>
                      <select
                        value={campaignForm.audience}
                        onChange={(e) => setCampaignForm((c) => ({ ...c, audience: e.target.value }))}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 transition cursor-pointer"
                      >
                        <option value="ALL_ACTIVE">
                          {campaignChannel === "WHATSAPP"
                            ? `All Contacts with Mobile (${preflight.phoneCount} numbers)`
                            : `All Active Contacts (${workspace?.summary.activeSubscriberCount || 0})`}
                        </option>
                        <option value="INQUIRY">Website Inquiries (Warm Leads)</option>
                        <option value="APPOINTMENT">Consultation Bookings (Clients)</option>
                        <option value="NEWSLETTER">Newsletter Subscribers</option>
                        <option value="CSV_IMPORT">Uploaded Spreadsheets</option>
                        {campaignForm.audience && campaignForm.audience.startsWith("TAG:") && (
                          <option value={campaignForm.audience}>Segment: #{campaignForm.audience.replace("TAG:", "")}</option>
                        )}
                      </select>
                    </label>

                    <label className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                      <span>Label:</span>
                      <input
                        value={campaignForm.name}
                        onChange={(e) => setCampaignForm((c) => ({ ...c, name: e.target.value }))}
                        placeholder="Internal name"
                        className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] text-slate-700 outline-none w-32"
                      />
                    </label>
                    {campaignChannel === "EMAIL" && (
                      <button
                        type="button"
                        onClick={() => setShowSaveTemplateModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer ml-1"
                      >
                        <Layers className="h-3 w-3" />
                        Save Template
                      </button>
                    )}
                  </div>
                </div>

                {/* Message Body Content */}
                {campaignChannel === "WHATSAPP" ? (
                  <div className="space-y-3 pt-1">
                    {/* Toolbars: Variables + Emojis */}
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Insert Variable:</span>
                        {[
                          { tag: "{{name}}", label: "Client Name" },
                          { tag: "{{company}}", label: "Company" },
                          { tag: "{{service}}", label: "Service" },
                        ].map((v) => (
                          <button
                            key={v.tag}
                            type="button"
                            onClick={() =>
                              setCampaignForm((c) => ({
                                ...c,
                                content: (c.content ? c.content + " " : "") + v.tag + " ",
                              }))
                            }
                            className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-emerald-500 hover:text-emerald-700 font-mono text-[11px] font-semibold transition shadow-2xs cursor-pointer"
                          >
                            + {v.tag}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400 mr-1">Emojis:</span>
                        {["👋", "📄", "💼", "⚖️", "📅", "🔔", "🚀", "💬", "✅"].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() =>
                              setCampaignForm((c) => ({
                                ...c,
                                content: (c.content || "") + emoji,
                              }))
                            }
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 transition text-sm cursor-pointer"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Textarea */}
                    <div className="relative border border-slate-200 rounded-2xl overflow-hidden focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-50 transition shadow-sm bg-white">
                      <textarea
                        rows={10}
                        value={campaignForm.content}
                        onChange={(e) => setCampaignForm((c) => ({ ...c, content: e.target.value }))}
                        placeholder="Type your WhatsApp broadcast message here...&#10;&#10;Use *bold* for emphasis, _italic_ for softer tone, and ~strikethrough~.&#10;Variables like {{name}} and {{company}} will be substituted dynamically."
                        className="w-full p-4 text-xs font-sans text-slate-800 leading-relaxed outline-none resize-y min-h-[220px]"
                      />

                      {/* Footer bar */}
                      <div className="flex items-center justify-between px-4 py-2 bg-slate-50/80 border-t border-slate-100 text-[11px] text-slate-500">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-600">Formatting:</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">*bold*</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">_italic_</span>
                          <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[10px]">~strike~</span>
                        </div>
                        <div className={`font-mono text-xs font-bold ${campaignForm.content.length > 1024 ? "text-amber-600" : "text-slate-400"}`}>
                          {campaignForm.content.length} / 1024 chars
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-1">
                    <div className="border border-slate-200 rounded-2xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-50 transition shadow-sm bg-white min-h-[380px]">
                      <RichTextEditor
                        value={campaignForm.content}
                        onChange={(html) => setCampaignForm((c) => ({ ...c, content: html }))}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Live Message Preview (Shown in "preview" and "split" views) */}
            {(composeView === "preview" || composeView === "split") && (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {campaignChannel === "WHATSAPP" ? (
                        <>
                          <MessageSquare className="w-4 h-4 text-emerald-600" />
                          <span>WhatsApp Mobile Simulation</span>
                        </>
                      ) : (
                        "Live Inbox Simulation"
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {campaignChannel === "WHATSAPP"
                        ? "Real-time client device preview with variable replacement"
                        : "Shows exact client rendering on desktop and mobile devices"}
                    </p>
                  </div>
                  {campaignChannel === "EMAIL" && (
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setPreviewMode("desktop")}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          previewMode === "desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                        title="Desktop Preview"
                      >
                        <Monitor className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewMode("mobile")}
                        className={`p-1.5 rounded-lg transition cursor-pointer ${
                          previewMode === "mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        }`}
                        title="Mobile Phone Preview"
                      >
                        <Smartphone className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {campaignChannel === "WHATSAPP" ? (
                  /* Authentic WhatsApp Smartphone Simulator */
                  <div className="py-2 flex justify-center">
                    <div className="w-full max-w-[340px] rounded-[38px] bg-slate-950 p-2.5 shadow-2xl border-4 border-slate-800">
                      {/* Top Speaker / Dynamic Island */}
                      <div className="relative flex justify-center pb-2 pt-1">
                        <div className="w-20 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-slate-950 border border-slate-800" />
                          <span className="w-8 h-1 bg-slate-800 rounded-full" />
                        </div>
                      </div>

                      {/* Phone Screen */}
                      <div className="rounded-[28px] overflow-hidden bg-[#EFEAE2] flex flex-col min-h-[460px] max-h-[500px]">
                        {/* WhatsApp Top App Bar */}
                        <div className="bg-[#075E54] text-white px-3 py-2.5 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4 text-white/90" />
                            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-black text-white border border-white/20 shadow-xs">
                              T24
                            </div>
                            <div className="leading-tight">
                              <div className="text-xs font-bold text-white flex items-center gap-1">
                                <span>TaxFiling24</span>
                                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                              </div>
                              <div className="text-[10px] text-emerald-100/80">Official Business Account</div>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Chat Area */}
                        <div className="flex-1 p-3.5 overflow-y-auto space-y-3">
                          {/* Date separator pill */}
                          <div className="flex justify-center">
                            <span className="px-2.5 py-0.5 rounded-lg bg-white/90 text-slate-600 font-bold text-[10px] shadow-2xs">
                              TODAY
                            </span>
                          </div>

                          {/* Security / Business Notice */}
                          <div className="p-2 rounded-xl bg-amber-50/90 border border-amber-200/60 text-[10px] text-amber-900 text-center leading-relaxed">
                            🔒 Messages and calls are end-to-end encrypted. This is the verified TaxFiling24 advisory channel.
                          </div>

                          {/* Outgoing Message Bubble (TaxFiling24 to Client) */}
                          <div className="flex justify-end">
                            <div className="max-w-[92%] bg-[#D9FDD3] text-slate-900 rounded-2xl rounded-tr-xs p-3 shadow-2xs space-y-1.5 text-xs leading-relaxed">
                              <div
                                className="whitespace-pre-wrap break-words text-slate-800 text-[12px]"
                                dangerouslySetInnerHTML={{
                                  __html: formatWhatsAppPreview(campaignForm.content || "Your message preview will appear here..."),
                                }}
                              />
                              <div className="flex items-center justify-end gap-1 pt-0.5 text-[10px] text-slate-400 font-mono">
                                <span>12:30 PM</span>
                                <span className="text-sky-600 font-bold">✓✓</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Fake Input Footer */}
                        <div className="p-2 bg-[#F0F2F5] border-t border-slate-200 flex items-center gap-2">
                          <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400 shadow-2xs">
                            Message
                          </div>
                          <div className="w-7 h-7 rounded-full bg-[#00A884] flex items-center justify-center text-white shadow-xs">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Inbox Snippet Card */}
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-800 truncate max-w-[180px]">
                          {providerSettings.EMAIL_FROM_NAME || "TaxFiling24"}
                        </span>
                        <span className="text-[10px] text-slate-400">Just now</span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {campaignForm.subject || "Subject line goes here..."}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {campaignForm.preheader || "Inbox preheader preview text will appear here..."}
                      </div>
                    </div>

                    {/* Render Window */}
                    {previewMode === "desktop" ? (
                      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                        {/* Email Client Header */}
                        <div className="bg-slate-100 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-600">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-rose-400" />
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span className="h-2 w-2 rounded-full bg-emerald-400" />
                            <span className="ml-2 font-semibold text-slate-700 truncate max-w-[200px]">
                              {campaignForm.subject || "Untitled Campaign"}
                            </span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-slate-400">{campaignForm.provider}</span>
                        </div>

                        {/* Email Meta */}
                        <div className="p-4 border-b border-slate-100 space-y-1 bg-slate-50/50">
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">From: </span>
                            <span className="text-slate-600">
                              {providerSettings.EMAIL_FROM_NAME || "TaxFiling24"} &lt;{providerSettings.EMAIL_FROM_EMAIL || "notifications@taxfiling24.com"}&gt;
                            </span>
                          </div>
                          <div className="text-xs">
                            <span className="font-bold text-slate-700">To: </span>
                            <span className="text-slate-600">Subscriber &lt;client@example.com&gt;</span>
                          </div>
                        </div>

                        {/* Formatted Body */}
                        <div className="p-5 max-h-[460px] overflow-y-auto">
                          <div className="border-b-2 border-amber-400 pb-3 mb-4 flex items-center justify-between">
                            <div className="font-extrabold text-slate-900 text-base">
                              TaxFiling<span className="text-amber-500">24</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-semibold uppercase">Official Communication</span>
                          </div>

                          <div
                            className="prose prose-sm max-w-none text-slate-700 text-xs leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: campaignForm.content }}
                          />

                          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
                            <p className="font-semibold text-slate-500">TaxFiling24 Advisory Services</p>
                            <p>You received this because you are an active subscriber.</p>
                            <p className="text-slate-400 underline">Unsubscribe preferences</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Mobile Phone Simulation */
                      <div className="mx-auto max-w-[320px] rounded-[36px] border-[8px] border-slate-900 bg-white shadow-xl overflow-hidden">
                        <div className="bg-slate-900 pt-3 pb-2 text-center">
                          <div className="mx-auto h-3.5 w-24 bg-slate-800 rounded-full" />
                        </div>
                        <div className="p-4 max-h-[420px] overflow-y-auto">
                          <div className="border-b border-slate-100 pb-2 mb-3">
                            <div className="text-[10px] font-bold text-slate-400">
                              {providerSettings.EMAIL_FROM_NAME || "TaxFiling24"}
                            </div>
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {campaignForm.subject || "Subject"}
                            </div>
                          </div>

                          <div
                            className="prose prose-sm max-w-none text-slate-700 text-[11px] leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: campaignForm.content }}
                          />

                          <div className="mt-6 pt-3 border-t border-slate-100 text-center text-[9px] text-slate-400">
                            <p>TaxFiling24 &bull; Unsubscribe</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: CAMPAIGNS & HISTORY (ISOLATED PAST BROADCASTS)    */}
      {/* ======================================================== */}
      {activeTab === "campaigns" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Campaign History &amp; Broadcast Logs</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review delivered campaigns, track open/click rates, or load past broadcasts into the composer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={campaignSearch}
                  onChange={(e) => setCampaignSearch(e.target.value)}
                  placeholder="Search campaigns..."
                  className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition"
                />
              </div>

              <select
                value={campaignStatusFilter}
                onChange={(e) => setCampaignStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none bg-white font-medium cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="SENT">Sent</option>
                <option value="DRAFT">Draft</option>
                <option value="PARTIAL_FAILURE">Partial Failure</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredCampaigns.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-xs text-slate-400 font-medium">
                No campaigns match your filter. Create a new campaign from the Compose tab.
              </div>
            ) : (
              filteredCampaigns.map((campaign) => (
                <div
                  key={campaign.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4.5 transition hover:border-slate-300 hover:shadow-sm"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                          {campaign.subject}
                        </h3>
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase border ${
                            campaign.status === "SENT"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : campaign.status === "DRAFT"
                              ? "bg-slate-50 text-slate-600 border-slate-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {campaign.status}
                        </span>
                        {campaign.provider === "WHATSAPP" ? (
                          <span className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase inline-flex items-center gap-1">
                            <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                            WhatsApp
                          </span>
                        ) : (
                          <span className="rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase">
                            {getProviderLabel(
                              campaign.provider === "RESEND" || campaign.provider === "MAILGUN"
                                ? campaign.provider
                                : "SMTP"
                            )}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {campaign.preheader || "No preheader line defined"}
                      </p>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                        <span>Updated: {formatDate(campaign.updatedAt)}</span>
                        {campaign.sentAt && <span>&bull; Sent: {formatDate(campaign.sentAt)}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 min-w-[70px]">
                          <div className="text-[9px] font-bold uppercase text-slate-400">Recipients</div>
                          <div className="text-xs font-bold text-slate-800">{campaign.recipientCount}</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 min-w-[70px]">
                          <div className="text-[9px] font-bold uppercase text-slate-400">Opens</div>
                          <div className="text-xs font-bold text-slate-800">
                            {formatPercent(getRate(campaign.openedCount, campaign.recipientCount))}
                          </div>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 px-3 py-1.5 min-w-[70px]">
                          <div className="text-[9px] font-bold uppercase text-slate-400">Clicks</div>
                          <div className="text-xs font-bold text-slate-800">
                            {formatPercent(getRate(campaign.clickedCount, campaign.recipientCount))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 border-l border-slate-100 pl-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCampaignForm(campaignToForm(campaign));
                            setCampaignChannel(campaign.provider === "WHATSAPP" ? "WHATSAPP" : "EMAIL");
                            setActiveTab("composer");
                          }}
                          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer shadow-sm"
                          title="Open in Composer"
                        >
                          Load
                        </button>
                        <button
                          type="button"
                          onClick={() => duplicateCampaign(campaign)}
                          className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition cursor-pointer shadow-sm"
                          title="Duplicate as new draft"
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          onClick={() => setCampaignToDelete(campaign)}
                          className="rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-100/70 p-2 text-rose-600 transition cursor-pointer"
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: TEMPLATES (ISOLATED TEMPLATE LIBRARY)             */}
      {/* ======================================================== */}
      {activeTab === "templates" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Email Template Library</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Load high-converting layout templates for statutory alerts, newsletters, and advisories.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={templateCategoryFilter}
                onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none bg-white font-medium cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Compliance Alert">Compliance Alert</option>
                <option value="Newsletter">Newsletter</option>
                <option value="Advisory">Advisory</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTemplates.map((template) => {
              const isStarter = !("id" in template);
              const templateId = "id" in template ? template.id : null;
              return (
                <div
                  key={templateId || template.name}
                  className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 hover:shadow-sm transition"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-600">
                        {template.category}
                      </span>
                      {isStarter ? (
                        <span className="rounded-lg bg-indigo-50 border border-indigo-100 px-2 py-0.5 text-[9px] font-extrabold text-indigo-700">
                          Built-in Starter
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setTemplateToDelete(template as CampaignTemplateRecord)}
                          className="text-slate-400 hover:text-rose-600 transition p-1 cursor-pointer"
                          title="Delete template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">{template.name}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2">
                      {template.description || "Pre-styled email template"}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewTemplate({
                          content: template.content,
                          name: template.name,
                          subject: template.subject,
                        })
                      }
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                      Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCampaignForm((c) => ({
                          ...c,
                          content: template.content,
                          preheader: template.preheader || "",
                          subject: template.subject,
                          templateId,
                        }));
                        setActiveTab("composer");
                        setFeedback({ text: `Template "${template.name}" applied to composer.`, type: "success" });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
                    >
                      Use Template
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: AUDIENCE & SUBSCRIBERS (ISOLATED CONTACTS LIST)   */}
      {/* ======================================================== */}
      {activeTab === "audience" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-5">
          {/* Top Banner to Full Audience Hub */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/70 via-white to-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Dedicated Audience &amp; Spreadsheet Upload Studio</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload Excel/CSV files, inspect website leads from Inquiries and Consultations, and manage tag filters in the unified hub.
              </p>
            </div>
            <Link
              href="/admin/campaigns/audience"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition shrink-0"
            >
              <span>Open Audience Data Hub</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Audience &amp; Subscriber Directory</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage contact lists, review active recipients, or manually add subscribers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  value={subscriberSearch}
                  onChange={(e) => setSubscriberSearch(e.target.value)}
                  placeholder="Search subscribers..."
                  className="rounded-xl border border-slate-200 pl-8 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition"
                />
              </div>

              <select
                value={subscriberStatusFilter}
                onChange={(e) => setSubscriberStatusFilter(e.target.value as "ALL" | "ACTIVE" | "SUPPRESSED")}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs text-slate-700 outline-none bg-white font-medium cursor-pointer"
              >
                <option value="ALL">All Contacts</option>
                <option value="ACTIVE">Active Only</option>
                <option value="SUPPRESSED">Suppressed / Opted-out</option>
              </select>

              <button
                type="button"
                onClick={() => setShowAddSubscriberModal(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-sm"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Add Contact
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Subscriber Email</th>
                  <th className="px-4 py-3">Name / Label</th>
                  <th className="px-4 py-3">Joined Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubscribers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-medium">
                      No subscribers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredSubscribers.map((subscriber) => (
                    <tr key={subscriber.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-4 py-3 font-semibold text-slate-900">{subscriber.email}</td>
                      <td className="px-4 py-3 text-slate-600">{subscriber.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(subscriber.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                            subscriber.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {subscriber.isActive ? "Active" : "Suppressed"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleSubscriberActive(subscriber)}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                        >
                          {subscriber.isActive ? "Suppress" : "Reactivate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeSubscriber(subscriber.id)}
                          className="rounded-lg p-1 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                          title="Delete subscriber"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: DELIVERY PROVIDERS (ISOLATED CONFIGURATION)       */}
      {/* ======================================================== */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-slate-700" />
                Delivery Provider Setup
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure SMTP or direct REST APIs (Resend, Mailgun) for delivery and real-time open/click tracking.
              </p>
            </div>

            <button
              type="button"
              onClick={saveProviderConfiguration}
              disabled={savingProvider}
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {savingProvider ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save All Provider Settings
            </button>
          </div>

          {/* Active Provider Selector */}
          <div className="grid gap-3 sm:grid-cols-3">
            {EMAIL_PROVIDERS.map((provider) => {
              const isSelected = providerSettings.EMAIL_PROVIDER === provider;
              const isReady = workspace.provider.statuses[provider];
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setProviderSettings((c) => ({ ...c, EMAIL_PROVIDER: provider }))}
                  className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm">{getProviderLabel(provider)}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                        isReady
                          ? isSelected
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : isSelected
                          ? "bg-amber-400 text-slate-950"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}
                    >
                      {isReady ? "Configured" : "Incomplete"}
                    </span>
                  </div>
                  <p className={`text-xs mt-2 ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                    {provider === "RESEND"
                      ? "Developer-first API with live open & click tracking webhooks"
                      : provider === "MAILGUN"
                      ? "High-volume transactional and bulk delivery network"
                      : "Standard SMTP (Gmail, Zoho, Office365, AWS SES)"}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Sender Identity Form */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Sender Identity (Applies across all outbound campaigns)
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">From Name</span>
                <input
                  value={providerSettings.EMAIL_FROM_NAME}
                  onChange={(e) => setProviderSettings((c) => ({ ...c, EMAIL_FROM_NAME: e.target.value }))}
                  placeholder="e.g. TaxFiling24 Advisory"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Sender Email Address</span>
                <input
                  value={providerSettings.EMAIL_FROM_EMAIL}
                  onChange={(e) => setProviderSettings((c) => ({ ...c, EMAIL_FROM_EMAIL: e.target.value }))}
                  placeholder="e.g. notifications@taxfiling24.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Reply-To Address</span>
                <input
                  value={providerSettings.EMAIL_REPLY_TO}
                  onChange={(e) => setProviderSettings((c) => ({ ...c, EMAIL_REPLY_TO: e.target.value }))}
                  placeholder="e.g. support@taxfiling24.com"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                />
              </label>
            </div>
          </div>

          {/* Provider Specific Credentials Form */}
          <div className="rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {getProviderLabel(providerSettings.EMAIL_PROVIDER)} Credentials &amp; Endpoints
              </h3>
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                {showSecrets ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showSecrets ? "Hide Credentials" : "Show Credentials"}
              </button>
            </div>

            {/* Resend Fields */}
            {providerSettings.EMAIL_PROVIDER === "RESEND" && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Resend API Key</span>
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={providerSettings.RESEND_API_KEY}
                      onChange={(e) => setProviderSettings((c) => ({ ...c, RESEND_API_KEY: e.target.value }))}
                      placeholder="re_..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Resend Audience ID (Optional)</span>
                    <input
                      value={providerSettings.RESEND_AUDIENCE_ID}
                      onChange={(e) => setProviderSettings((c) => ({ ...c, RESEND_AUDIENCE_ID: e.target.value }))}
                      placeholder="Optional list UUID"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                    />
                  </label>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Webhook URL for Resend:</span>
                    <p className="text-xs font-mono text-indigo-900 mt-0.5 break-all">
                      {workspace.provider.webhookUrls.RESEND}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(workspace.provider.webhookUrls.RESEND, "resend_webhook")}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 transition cursor-pointer shrink-0 ml-3"
                  >
                    {copiedKey === "resend_webhook" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === "resend_webhook" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* Mailgun Fields */}
            {providerSettings.EMAIL_PROVIDER === "MAILGUN" && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Mailgun API Key</span>
                    <input
                      type={showSecrets ? "text" : "password"}
                      value={providerSettings.MAILGUN_API_KEY}
                      onChange={(e) => setProviderSettings((c) => ({ ...c, MAILGUN_API_KEY: e.target.value }))}
                      placeholder="key-..."
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 font-mono outline-none focus:border-indigo-500 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Domain</span>
                    <input
                      value={providerSettings.MAILGUN_DOMAIN}
                      onChange={(e) => setProviderSettings((c) => ({ ...c, MAILGUN_DOMAIN: e.target.value }))}
                      placeholder="mg.taxfiling24.com"
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Region</span>
                    <select
                      value={providerSettings.MAILGUN_REGION}
                      onChange={(e) =>
                        setProviderSettings((c) => ({ ...c, MAILGUN_REGION: e.target.value as "US" | "EU" }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition cursor-pointer"
                    >
                      <option value="US">US (api.mailgun.net)</option>
                      <option value="EU">EU (api.eu.mailgun.net)</option>
                    </select>
                  </label>
                </div>

                <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">Webhook URL for Mailgun:</span>
                    <p className="text-xs font-mono text-indigo-900 mt-0.5 break-all">
                      {workspace.provider.webhookUrls.MAILGUN}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(workspace.provider.webhookUrls.MAILGUN, "mailgun_webhook")}
                    className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 transition cursor-pointer shrink-0 ml-3"
                  >
                    {copiedKey === "mailgun_webhook" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedKey === "mailgun_webhook" ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            {/* SMTP Fields */}
            {providerSettings.EMAIL_PROVIDER === "SMTP" && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">SMTP Host</span>
                  <input
                    value={providerSettings.SMTP_HOST}
                    onChange={(e) => setProviderSettings((c) => ({ ...c, SMTP_HOST: e.target.value }))}
                    placeholder="smtp.gmail.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Port</span>
                  <input
                    value={providerSettings.SMTP_PORT}
                    onChange={(e) => setProviderSettings((c) => ({ ...c, SMTP_PORT: e.target.value }))}
                    placeholder="587 or 465"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">SMTP Username</span>
                  <input
                    value={providerSettings.SMTP_USER}
                    onChange={(e) => setProviderSettings((c) => ({ ...c, SMTP_USER: e.target.value }))}
                    placeholder="user@domain.com"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">SMTP Password</span>
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={providerSettings.SMTP_PASS}
                    onChange={(e) => setProviderSettings((c) => ({ ...c, SMTP_PASS: e.target.value }))}
                    placeholder="App password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
                  />
                </label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL DIALOGS                                            */}
      {/* ======================================================== */}

      {/* MODAL 1: TEST EMAIL / WHATSAPP SEND MODAL */}
      {showTestEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {campaignChannel === "WHATSAPP" ? (
                  <>
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    Dispatch Test WhatsApp Message
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 text-indigo-600" />
                    Dispatch Test Email
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowTestEmailModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              {campaignChannel === "WHATSAPP"
                ? "Send a live WhatsApp test message via Meta Cloud API directly to your registered test mobile number."
                : "Verify how the current subject line, header branding, and content render in your personal email client before sending to real subscribers."}
            </p>

            {campaignChannel === "WHATSAPP" ? (
              <label className="block space-y-1">
                <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">
                  Destination Test Mobile Number
                </span>
                <input
                  type="text"
                  value={testPhoneNumber}
                  onChange={(e) => setTestPhoneNumber(e.target.value)}
                  placeholder="919162712267"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 font-mono placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-50 transition"
                />
                <span className="text-[10px] text-slate-400 block pt-0.5">
                  Enter mobile number with country code without + (e.g. 919162712267).
                </span>
              </label>
            ) : (
              <label className="block">
                <span className="mb-1.5 block text-[10px] font-bold text-slate-500 uppercase">Destination Test Email</span>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition"
                />
              </label>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowTestEmailModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={sendTestEmailNow}
                disabled={sendingTest}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60 cursor-pointer shadow-sm ${
                  campaignChannel === "WHATSAPP"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {sendingTest ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : campaignChannel === "WHATSAPP" ? (
                  <MessageSquare className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {campaignChannel === "WHATSAPP" ? "Send Test WhatsApp" : "Send Test Email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: SEND CONFIRMATION MODAL */}
      {showSendConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                {campaignChannel === "WHATSAPP" ? "Confirm WhatsApp Broadcast" : "Confirm Campaign Broadcast"}
              </h3>
              <button
                onClick={() => setShowSendConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {campaignChannel === "WHATSAPP"
                ? "You are about to dispatch this WhatsApp broadcast to all audience contacts with a valid mobile phone number:"
                : "You are about to dispatch this campaign to all active subscribers. Please verify the broadcast parameters below:"}
            </p>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Topic / Subject:</span>
                <span className="font-bold text-slate-800 text-right max-w-[280px] truncate">
                  {campaignForm.subject}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Audience:</span>
                <span className="font-bold text-slate-800">
                  {campaignChannel === "WHATSAPP"
                    ? `${preflight.phoneCount} Active WhatsApp Recipients`
                    : `${workspace.summary.activeSubscriberCount} Active Subscribers`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Channel &amp; Provider:</span>
                <span className="font-bold text-slate-800">
                  {campaignChannel === "WHATSAPP"
                    ? "Meta WhatsApp Cloud API (v21.0)"
                    : getProviderLabel(campaignForm.provider)}
                </span>
              </div>
              {campaignChannel === "EMAIL" && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">From:</span>
                  <span className="font-bold text-slate-800">
                    {providerSettings.EMAIL_FROM_NAME} &lt;{providerSettings.EMAIL_FROM_EMAIL}&gt;
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed font-medium">
              Note: Once initiated, dispatch cannot be canceled. Messages will be queued and sent through the official gateway.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSendConfirmModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Review Again
              </button>
              <button
                type="button"
                onClick={sendCampaignNow}
                disabled={sending}
                className={`inline-flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white transition active:scale-95 disabled:opacity-60 cursor-pointer shadow-md ${
                  campaignChannel === "WHATSAPP"
                    ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {sending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : campaignChannel === "WHATSAPP" ? (
                  <MessageSquare className="h-3.5 w-3.5" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                {campaignChannel === "WHATSAPP" ? "Confirm & Broadcast WhatsApp" : "Confirm & Broadcast Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SAVE TEMPLATE MODAL */}
      {showSaveTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-violet-600" />
                Save as Template
              </h3>
              <button
                onClick={() => setShowSaveTemplateModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Template Name</span>
              <input
                value={templateDraft.name}
                onChange={(e) => setTemplateDraft((d) => ({ ...d, name: e.target.value }))}
                placeholder="e.g. Monthly GST Notice"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Category</span>
              <input
                value={templateDraft.category}
                onChange={(e) => setTemplateDraft((d) => ({ ...d, category: e.target.value }))}
                placeholder="e.g. Compliance Alert, Newsletter, Advisory"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Description (Optional)</span>
              <input
                value={templateDraft.description}
                onChange={(e) => setTemplateDraft((d) => ({ ...d, description: e.target.value }))}
                placeholder="Short note about when to use this template"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSaveTemplateModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveTemplate}
                disabled={savingTemplate}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {savingTemplate ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: TEMPLATE PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{previewTemplate.name}</h3>
                <p className="text-xs text-slate-500">Subject: {previewTemplate.subject}</p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50/50 max-h-[400px] overflow-y-auto">
              <div
                className="prose prose-sm max-w-none text-xs text-slate-700"
                dangerouslySetInnerHTML={{ __html: previewTemplate.content }}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPreviewTemplate(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  setCampaignForm((c) => ({
                    ...c,
                    content: previewTemplate.content,
                    subject: previewTemplate.subject,
                  }));
                  setPreviewTemplate(null);
                  setActiveTab("composer");
                  setFeedback({ text: `Template "${previewTemplate.name}" loaded into composer.`, type: "success" });
                }}
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold cursor-pointer shadow-sm"
              >
                Load into Composer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD SUBSCRIBER MODAL */}
      {showAddSubscriberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-600" />
                Add New Contact
              </h3>
              <button
                onClick={() => setShowAddSubscriberModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Email Address</span>
              <input
                type="email"
                value={newSubscriberForm.email}
                onChange={(e) => setNewSubscriberForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="client@company.com"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[10px] font-bold text-slate-500 uppercase">Full Name (Optional)</span>
              <input
                value={newSubscriberForm.name}
                onChange={(e) => setNewSubscriberForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Rajesh Kumar"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 transition"
              />
            </label>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddSubscriberModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addSubscriber}
                disabled={addingSubscriber}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-60 cursor-pointer shadow-sm"
              >
                {addingSubscriber ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Add Subscriber
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: DELETE CAMPAIGN CONFIRMATION */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Trash2 className="h-4 w-4" />
              Delete Campaign Record?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete &ldquo;{campaignToDelete.subject}&rdquo;? All delivery logs and statistics for this campaign will be removed.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCampaignToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteCampaign(campaignToDelete.id)}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-sm"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 7: DELETE TEMPLATE CONFIRMATION */}
      {templateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-rose-600 font-bold text-sm">
              <Trash2 className="h-4 w-4" />
              Delete Template?
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Remove &ldquo;{templateToDelete.name}&rdquo; from your saved template library?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteTemplate(templateToDelete.id)}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 px-4 py-2 text-xs font-bold text-white cursor-pointer shadow-sm"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
