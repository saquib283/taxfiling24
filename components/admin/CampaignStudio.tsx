"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Eye,
  Layers,
  Loader2,
  Mail,
  RefreshCw,
  Save,
  Send,
  Settings2,
  Sparkles,
  Trash2,
  Users,
  Wand2,
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
  name: string;
  subject: string;
  preheader: string;
  content: string;
  provider: EmailProvider;
  audience: string;
  templateId: string | null;
};

type TemplateDraftState = {
  id?: string;
  name: string;
  description: string;
  category: string;
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
      "<h2>Stay ahead of this month's compliance deadline</h2><p>Hello,</p><p>We are sharing a quick reminder so your team can file on time without the last-minute rush.</p><ul><li>Deadline: add the due date</li><li>Who it impacts: add the segment</li><li>Documents needed: add the checklist</li></ul><p>Reply to this email if you want our team to handle the filing.</p>",
    description: "Fast due-date reminder for ongoing compliance campaigns.",
    name: "Deadline Reminder",
    preheader: "Quick deadline reminder with a checklist and CTA.",
    subject: "Important filing reminder for this month",
  },
  {
    category: "Newsletter",
    content:
      "<h2>What's new this month</h2><p>Hello,</p><p>Here is a quick round-up of practical updates for your business.</p><ul><li>Policy change and what it means</li><li>Action item to close this week</li><li>How our team can help</li></ul><p>Reply if you want a tailored checklist.</p>",
    description: "Simple monthly update for newsletters and digest mails.",
    name: "Monthly Update",
    preheader: "A clean monthly newsletter with actionable takeaways.",
    subject: "Your monthly TaxFiling24 updates and practical tips",
  },
];

function createDefaultCampaign(provider: EmailProvider): CampaignFormState {
  return {
    audience: "ALL_ACTIVE",
    content:
      "<h2>Hello from TaxFiling24</h2><p>Start drafting your campaign here. You can also generate a first draft with AI or load a saved template.</p>",
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
    MAILGUN_REGION:
      ((raw.MAILGUN_REGION as "US" | "EU") || providerInfo.mailgunRegion || "US"),
    RESEND_API_KEY: raw.RESEND_API_KEY || "",
    RESEND_AUDIENCE_ID: raw.RESEND_AUDIENCE_ID || providerInfo.resendAudienceId || "",
    SMTP_HOST: raw.SMTP_HOST || "",
    SMTP_PASS: raw.SMTP_PASS || "",
    SMTP_PORT: raw.SMTP_PORT || "",
    SMTP_USER: raw.SMTP_USER || "",
  };
}

function campaignToForm(campaign: CampaignRecord): CampaignFormState {
  return {
    audience: campaign.audience || "ALL_ACTIVE",
    content: campaign.content,
    id: campaign.id,
    name: campaign.name || "",
    preheader: campaign.preheader || "",
    provider:
      campaign.provider === "RESEND" || campaign.provider === "MAILGUN"
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
  return value ? new Date(value).toLocaleString() : "Not sent yet";
}

function getRate(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0;
}

export default function CampaignStudio() {
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignFormState>(
    createDefaultCampaign("SMTP")
  );
  const [templateDraft, setTemplateDraft] =
    useState<TemplateDraftState>(DEFAULT_TEMPLATE_DRAFT);
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
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBrief, setAiBrief] = useState("");
  const [feedback, setFeedback] = useState<{ text: string; type: "error" | "success" } | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

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
  }, []);

  useEffect(() => {
    void loadWorkspace({ initial: true, preserveCampaign: false });
  }, [loadWorkspace]);

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
      setFeedback({ text: "Draft saved in the campaign workspace.", type: "success" });
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

  async function sendCampaignNow() {
    if (!campaignForm.subject.trim() || !campaignForm.content.trim()) {
      setFeedback({
        text: "Add a subject and content before sending.",
        type: "error",
      });
      return;
    }

    if (!window.confirm("Send this campaign to all active subscribers now?")) {
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/campaigns/send", {
        body: JSON.stringify({
          ...campaignForm,
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
          ? `Campaign sent with ${data.errors.length} provider warning${data.errors.length > 1 ? "s" : ""}.`
          : "Campaign sent successfully.",
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

  async function generateWithAi() {
    if (!aiBrief.trim()) {
      setFeedback({ text: "Add a short AI brief first.", type: "error" });
      return;
    }

    setAiLoading(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/admin/ai/generate", {
        body: JSON.stringify({
          category: "Email Campaign",
          title: campaignForm.subject || templateDraft.name || "Campaign draft",
          topic: aiBrief.trim(),
          type: "email",
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
      setFeedback({ text: "AI draft added to the editor.", type: "success" });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to generate the AI draft.",
        type: "error",
      });
    } finally {
      setAiLoading(false);
    }
  }

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
      setCampaignForm((current) => ({ ...current, templateId: data.template?.id || null }));
      setFeedback({ text: "Template saved to the library.", type: "success" });
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
    if (!window.confirm("Delete this template?")) {
      return;
    }

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

      setFeedback({ text: "Template deleted.", type: "success" });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text: error instanceof Error ? error.message : "Unable to delete this template.",
        type: "error",
      });
    }
  }

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
        text: `${getProviderLabel(providerSettings.EMAIL_PROVIDER)} settings saved.`,
        type: "success",
      });
      await loadWorkspace({ preserveCampaign: true });
    } catch (error) {
      setFeedback({
        text:
          error instanceof Error ? error.message : "Unable to save provider configuration.",
        type: "error",
      });
    } finally {
      setSavingProvider(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 min-h-[60vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading campaign studio...
        </div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="p-6 min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-rose-600 font-semibold">{feedback?.text || "Failed to load workspace."}</p>
          <button onClick={() => void loadWorkspace({ initial: true, preserveCampaign: false })} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">Retry Loading</button>
        </div>
      </div>
    );
  }

  const templates = workspace.templates.length ? workspace.templates : STARTER_TEMPLATES;
  const providerReady = workspace.provider.statuses[campaignForm.provider];
  const previewWidth = previewMode === "mobile" ? "max-w-[380px]" : "max-w-none";

  return (
    <div className="p-6 space-y-6">
      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_28%),linear-gradient(135deg,_#f8fbff,_#ffffff_45%,_#eef6ff)] shadow-sm">
        <div className="px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
                <Mail className="h-3.5 w-3.5" />
                Campaign Studio
              </div>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                Advanced email campaigns in the admin panel
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                Build campaign templates, draft faster with AI, switch between SMTP, Resend,
                and Mailgun, and keep delivery plus engagement analytics easy to monitor.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Active Reach
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-950">
                  {workspace.summary.activeSubscriberCount}
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Avg Open / Read
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-950">
                  {formatPercent(workspace.summary.averageOpenRate)}
                </div>
              </div>
              <div className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                  Avg Click
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-950">
                  {formatPercent(workspace.summary.averageClickRate)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-rose-200 bg-rose-50 text-rose-700"
          }`}
        >
          {feedback.text}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Total Sent
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-950">
                {workspace.summary.totalSent}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Send className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Delivered
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-950">
                {workspace.summary.totalDelivered}
              </p>
            </div>
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Eye className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Templates
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-950">
                {workspace.summary.templateCount}
              </p>
            </div>
            <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
              <Layers className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                Suppressed
              </p>
              <p className="mt-2 text-3xl font-bold text-gray-950">
                {workspace.summary.suppressedSubscriberCount}
              </p>
            </div>
            <div className="rounded-2xl bg-rose-50 p-3 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(340px,0.95fr)]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-gray-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Compose campaign</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Draft, preview, save, or send to the active audience.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => void loadWorkspace({ preserveCampaign: true })}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
                >
                  {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={saveDraft}
                  disabled={savingDraft}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={sendCampaignNow}
                  disabled={sending || !workspace.summary.activeSubscriberCount}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Send Campaign
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={campaignForm.name}
                onChange={(event) => setCampaignForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Internal campaign name"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
              <input
                value={campaignForm.subject}
                onChange={(event) =>
                  setCampaignForm((current) => ({
                    ...current,
                    name: current.name || event.target.value,
                    subject: event.target.value,
                  }))
                }
                placeholder="Subject line"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
              <div className="md:col-span-2">
                <input
                  value={campaignForm.preheader}
                  onChange={(event) => setCampaignForm((current) => ({ ...current, preheader: event.target.value }))}
                  placeholder="Inbox preheader"
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">Send with</div>
              {EMAIL_PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setCampaignForm((current) => ({ ...current, provider }))}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    campaignForm.provider === provider
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {getProviderLabel(provider)}
                </button>
              ))}
              <span
                className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${
                  providerReady
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {providerReady ? "Connected" : "Setup needed"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
              <RichTextEditor
                value={campaignForm.content}
                onChange={(html) => setCampaignForm((current) => ({ ...current, content: html }))}
              />

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Sparkles className="h-4 w-4 text-blue-600" />
                    AI draft assist
                  </div>
                  <textarea
                    value={aiBrief}
                    onChange={(event) => setAiBrief(event.target.value)}
                    rows={6}
                    placeholder="Describe the email goal, audience, and CTA..."
                    className="mt-4 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                  <button
                    type="button"
                    onClick={generateWithAi}
                    disabled={aiLoading}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
                  >
                    {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Generate With AI
                  </button>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Layers className="h-4 w-4 text-violet-600" />
                    Save as template
                  </div>
                  <div className="mt-4 space-y-3">
                    <input
                      value={templateDraft.name}
                      onChange={(event) => setTemplateDraft((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Template name"
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                    />
                    <div className="grid gap-3 sm:grid-cols-[0.9fr_1.1fr]">
                      <input
                        value={templateDraft.category}
                        onChange={(event) => setTemplateDraft((current) => ({ ...current, category: event.target.value }))}
                        placeholder="Category"
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      />
                      <input
                        value={templateDraft.description}
                        onChange={(event) => setTemplateDraft((current) => ({ ...current, description: event.target.value }))}
                        placeholder="Short note for the team"
                        className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={saveTemplate}
                      disabled={savingTemplate}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Template
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  Open and read analytics rely on provider events. Resend or Mailgun give
                  the best visibility; SMTP is intentionally more limited.
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Preview</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Check the inbox summary and the rendered message body.
                </p>
              </div>
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setPreviewMode("desktop")}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    previewMode === "desktop" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("mobile")}
                  className={`rounded-full px-3 py-1.5 text-sm font-semibold ${
                    previewMode === "mobile" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                  }`}
                >
                  Mobile
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.68fr_1.32fr]">
              <div className="rounded-3xl border border-gray-200 bg-gray-50 p-4">
                <div className="rounded-2xl border border-white bg-white p-4 shadow-sm">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Inbox preview
                  </div>
                  <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-950">
                      {campaignForm.subject || "Add a subject line"}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      {campaignForm.preheader || "Your preheader will appear here."}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                      <span>{providerSettings.EMAIL_FROM_NAME || "TaxFiling24"}</span>
                      <span>{getProviderLabel(campaignForm.provider)}</span>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Expected delivery tracking</span>
                        <span>{formatPercent(providerReady ? 0.9 : 0.35)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${providerReady ? 90 : 35}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Expected open tracking</span>
                        <span>{formatPercent(campaignForm.provider === "SMTP" ? 0.2 : 0.82)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${campaignForm.provider === "SMTP" ? 20 : 82}%` }} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Expected click tracking</span>
                        <span>{formatPercent(campaignForm.provider === "SMTP" ? 0.15 : 0.76)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-rose-500" style={{ width: `${campaignForm.provider === "SMTP" ? 15 : 76}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] bg-slate-950 p-4 sm:p-6">
                <div className={`mx-auto ${previewWidth}`}>
                  <div className="rounded-[24px] bg-white shadow-2xl">
                    <div className="border-b border-gray-100 px-5 py-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-400">
                        Sent via {getProviderLabel(campaignForm.provider)}
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-gray-950">
                        {campaignForm.subject || "Campaign subject"}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {providerSettings.EMAIL_FROM_NAME || "TaxFiling24"} to {workspace.summary.activeSubscriberCount} active subscribers
                      </p>
                    </div>
                    <div
                      className="prose prose-sm max-w-none px-5 py-6 text-gray-700 sm:prose-base"
                      dangerouslySetInnerHTML={{ __html: campaignForm.content }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="border-b border-gray-100 pb-5">
              <h2 className="text-xl font-semibold text-gray-950">Recent campaigns</h2>
              <p className="mt-1 text-sm text-gray-500">
                Load an older campaign back into the editor or compare performance quickly.
              </p>
            </div>
            <div className="mt-5 space-y-4">
              {workspace.campaigns.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center text-sm text-gray-500">
                  No campaigns yet. Save your first draft or send a campaign to populate analytics.
                </div>
              ) : workspace.campaigns.slice(0, 6).map((campaign) => (
                <button
                  key={campaign.id}
                  type="button"
                  onClick={() => setCampaignForm(campaignToForm(campaign))}
                  className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-950">{campaign.subject}</h3>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">{campaign.status}</span>
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          {getProviderLabel(campaign.provider === "RESEND" || campaign.provider === "MAILGUN" ? campaign.provider : "SMTP")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500">{campaign.preheader || "No preheader added"}</p>
                      <p className="mt-2 text-xs text-gray-400">
                        Last activity: {formatDate(campaign.lastEventAt || campaign.sentAt || campaign.updatedAt)}
                      </p>
                    </div>
                    <div className="grid min-w-[260px] gap-3 sm:grid-cols-3">
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Delivery</p>
                        <p className="mt-2 text-lg font-semibold text-gray-950">
                          {formatPercent(getRate(campaign.deliveredCount, campaign.recipientCount))}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Open / Read</p>
                        <p className="mt-2 text-lg font-semibold text-gray-950">
                          {formatPercent(getRate(campaign.openedCount, campaign.recipientCount))}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-gray-50 px-4 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Clicks</p>
                        <p className="mt-2 text-lg font-semibold text-gray-950">
                          {formatPercent(getRate(campaign.clickedCount, campaign.recipientCount))}
                        </p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
        <div className="space-y-6">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="border-b border-gray-100 pb-5">
              <div className="flex items-center gap-2 text-xl font-semibold text-gray-950">
                <Settings2 className="h-5 w-5" />
                Provider setup
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Configure delivery and analytics without leaving the campaign workspace.
              </p>
            </div>
            <div className="mt-5 space-y-4">
              {EMAIL_PROVIDERS.map((provider) => (
                <button
                  key={provider}
                  type="button"
                  onClick={() => setProviderSettings((current) => ({ ...current, EMAIL_PROVIDER: provider }))}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    providerSettings.EMAIL_PROVIDER === provider
                      ? "border-gray-900 bg-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">{getProviderLabel(provider)}</div>
                      <div className={`mt-1 text-xs ${providerSettings.EMAIL_PROVIDER === provider ? "text-gray-200" : "text-gray-500"}`}>
                        {provider === "SMTP" ? "Basic send support with limited analytics" : "Best for event-driven analytics"}
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${workspace.provider.statuses[provider] ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                      {workspace.provider.statuses[provider] ? "Connected" : "Needs setup"}
                    </span>
                  </div>
                </button>
              ))}

              <input value={providerSettings.EMAIL_FROM_NAME} onChange={(event) => setProviderSettings((current) => ({ ...current, EMAIL_FROM_NAME: event.target.value }))} placeholder="From name" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
              <input value={providerSettings.EMAIL_FROM_EMAIL} onChange={(event) => setProviderSettings((current) => ({ ...current, EMAIL_FROM_EMAIL: event.target.value }))} placeholder="from@yourdomain.com" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
              <input value={providerSettings.EMAIL_REPLY_TO} onChange={(event) => setProviderSettings((current) => ({ ...current, EMAIL_REPLY_TO: event.target.value }))} placeholder="Reply-to email" className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />

              {providerSettings.EMAIL_PROVIDER === "RESEND" ? (
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <input type="password" value={providerSettings.RESEND_API_KEY} onChange={(event) => setProviderSettings((current) => ({ ...current, RESEND_API_KEY: event.target.value }))} placeholder="Resend API key" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input value={providerSettings.RESEND_AUDIENCE_ID} onChange={(event) => setProviderSettings((current) => ({ ...current, RESEND_AUDIENCE_ID: event.target.value }))} placeholder="Optional audience id" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 break-all">{workspace.provider.webhookUrls.RESEND}</div>
                </div>
              ) : null}

              {providerSettings.EMAIL_PROVIDER === "MAILGUN" ? (
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <input type="password" value={providerSettings.MAILGUN_API_KEY} onChange={(event) => setProviderSettings((current) => ({ ...current, MAILGUN_API_KEY: event.target.value }))} placeholder="Mailgun API key" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <input value={providerSettings.MAILGUN_DOMAIN} onChange={(event) => setProviderSettings((current) => ({ ...current, MAILGUN_DOMAIN: event.target.value }))} placeholder="mg.yourdomain.com" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <div className="inline-flex rounded-full bg-white p-1 shadow-sm">
                    {(["US", "EU"] as const).map((region) => (
                      <button key={region} type="button" onClick={() => setProviderSettings((current) => ({ ...current, MAILGUN_REGION: region }))} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${providerSettings.MAILGUN_REGION === region ? "bg-gray-900 text-white" : "text-gray-500"}`}>
                        {region}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-700 break-all">{workspace.provider.webhookUrls.MAILGUN}</div>
                </div>
              ) : null}

              {providerSettings.EMAIL_PROVIDER === "SMTP" ? (
                <div className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <input value={providerSettings.SMTP_HOST} onChange={(event) => setProviderSettings((current) => ({ ...current, SMTP_HOST: event.target.value }))} placeholder="SMTP host" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={providerSettings.SMTP_PORT} onChange={(event) => setProviderSettings((current) => ({ ...current, SMTP_PORT: event.target.value }))} placeholder="Port" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                    <input value={providerSettings.SMTP_USER} onChange={(event) => setProviderSettings((current) => ({ ...current, SMTP_USER: event.target.value }))} placeholder="SMTP username" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                  </div>
                  <input type="password" value={providerSettings.SMTP_PASS} onChange={(event) => setProviderSettings((current) => ({ ...current, SMTP_PASS: event.target.value }))} placeholder="SMTP password" className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" />
                </div>
              ) : null}

              <button type="button" onClick={saveProviderConfiguration} disabled={savingProvider} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-60">
                {savingProvider ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
                Save Provider Settings
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="border-b border-gray-100 pb-5">
              <h2 className="text-xl font-semibold text-gray-950">Template library</h2>
              <p className="mt-1 text-sm text-gray-500">
                Apply a saved template or start from a built-in layout.
              </p>
            </div>
            <div className="mt-5 space-y-3">
              {templates.map((template) => {
                const isStarter = !("id" in template);
                const templateId = "id" in template ? template.id : null;
                const templateIsAiGenerated = "id" in template ? template.isAiGenerated : false;
                return (
                  <div key={templateId || template.name} className="rounded-2xl border border-gray-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-950">{template.name}</h3>
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">{template.category}</span>
                          {isStarter ? <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">Starter</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-gray-500">{template.description || "Saved template"}</p>
                      </div>
                      {templateId ? <button type="button" onClick={() => void deleteTemplate(templateId)} className="rounded-xl p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button> : null}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setCampaignForm((current) => ({ ...current, content: template.content, preheader: template.preheader || "", subject: template.subject, templateId }))} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800">
                        Use Template
                      </button>
                      {templateId ? <button type="button" onClick={() => { setCampaignForm((current) => ({ ...current, content: template.content, preheader: template.preheader || "", subject: template.subject, templateId })); setTemplateDraft({ id: templateId, name: template.name, description: template.description || "", category: template.category, isAiGenerated: templateIsAiGenerated }); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Edit</button> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="border-b border-gray-100 pb-5">
              <div className="flex items-center gap-2 text-xl font-semibold text-gray-950">
                <Users className="h-5 w-5" />
                Audience health
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Track active reach, suppression, and recent subscriber growth.
              </p>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-gray-50 p-4"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Subscribers</div><div className="mt-2 text-2xl font-bold text-gray-950">{workspace.summary.subscriberCount}</div></div>
              <div className="rounded-2xl bg-gray-50 p-4"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Sent Campaigns</div><div className="mt-2 text-2xl font-bold text-gray-950">{workspace.summary.sentCampaignCount}</div></div>
              <div className="rounded-2xl bg-gray-50 p-4"><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">Bounces</div><div className="mt-2 text-2xl font-bold text-gray-950">{workspace.summary.totalBounces}</div></div>
            </div>
            <div className="mt-5 space-y-3">
              {workspace.subscribers.slice(0, 8).map((subscriber) => (
                <div key={subscriber.id} className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-950">{subscriber.email}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{subscriber.name || "Subscriber"} · joined {new Date(subscriber.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${subscriber.isActive ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {subscriber.isActive ? "Active" : "Suppressed"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
