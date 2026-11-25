"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  MessageSquare,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
  Loader2,
  User,
  Zap,
  FileCode,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { formatDisplayPhone } from "@/lib/whatsapp-shared";

interface WhatsAppLogRecord {
  id: string;
  messageId?: string | null;
  direction: "INBOUND" | "OUTBOUND" | "STATUS_UPDATE";
  fromNumber: string;
  toNumber: string;
  senderName?: string | null;
  messageType: string;
  content?: string | null;
  mediaUrl?: string | null;
  status: string;
  errorCode?: string | null;
  errorMessage?: string | null;
  pricingCategory?: string | null;
  rawPayload?: any;
  inquiryId?: string | null;
  campaignId?: string | null;
  createdAt: string;
  inquiry?: {
    id: string;
    name: string;
    service?: string | null;
    status: string;
  } | null;
  campaign?: {
    id: string;
    subject: string;
  } | null;
}

interface StatsData {
  totalCount: number;
  inboundCount: number;
  outboundCount: number;
  deliveredCount: number;
  readCount: number;
  failedCount: number;
  deliveryRate: number;
  readRate: number;
}

interface WebhookMeta {
  isConfigured: boolean;
  hasVerifyToken: boolean;
  hasAppSecret: boolean;
  canSimulate: boolean;
}

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<WhatsAppLogRecord[]>([]);
  const [stats, setStats] = useState<StatsData>({
    totalCount: 0,
    inboundCount: 0,
    outboundCount: 0,
    deliveredCount: 0,
    readCount: 0,
    failedCount: 0,
    deliveryRate: 0,
    readRate: 0,
  });
  const [webhookMeta, setWebhookMeta] = useState<WebhookMeta>({
    isConfigured: false,
    hasVerifyToken: false,
    hasAppSecret: false,
    canSimulate: false,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterDirection, setFilterDirection] = useState<string>("ALL");
  const [searchInput, setSearchInput] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalFiltered, setTotalFiltered] = useState<number>(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState<string>("/api/webhooks/whatsapp");

  // Inspector Modal
  const [inspectLog, setInspectLog] = useState<WhatsAppLogRecord | null>(null);

  // Simulator Modal
  const [showSimModal, setShowSimModal] = useState(false);
  const [simAction, setSimAction] = useState<"INBOUND_MESSAGE" | "DELIVERY_STATUS" | "FAILED_STATUS">("INBOUND_MESSAGE");
  const [simPhone, setSimPhone] = useState("919999900001");
  const [simText, setSimText] = useState("Hello TaxFiling24 Advisory! I would like to consult on my corporate filing.");
  const [simulating, setSimulating] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);

  // Avoid SSR hydration mismatch for window.location.origin
  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/whatsapp`);
  }, []);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchLogs = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const params = new URLSearchParams();
        if (filterDirection !== "ALL") params.set("direction", filterDirection);
        if (debouncedSearch) params.set("search", debouncedSearch);
        params.set("page", String(page));
        params.set("limit", "30");

        const res = await fetch(`/api/admin/whatsapp/logs?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
          if (data.stats) setStats(data.stats);
          if (data.webhookMeta) setWebhookMeta(data.webhookMeta);
          if (data.pagination) {
            setTotalPages(data.pagination.totalPages || 1);
            setTotalFiltered(data.pagination.totalFiltered || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load WhatsApp logs:", err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filterDirection, debouncedSearch, page]
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSimulateWebhook = async () => {
    setSimulating(true);
    setSimFeedback(null);
    try {
      const res = await fetch("/api/admin/whatsapp/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: simAction,
          phoneNumber: simPhone.trim(),
          customText: simText.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSimFeedback(
          `Simulated event dispatched successfully! Wamid: ${data.simulatedWamid || data.targetWamid}`
        );
        fetchLogs(true);
      } else {
        setSimFeedback(`Simulation failed: ${data.error || "Unknown error"}`);
      }
    } catch (err: any) {
      setSimFeedback(`Error: ${err.message || "Network exception"}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              WhatsApp Command Center
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Meta Cloud API v21.0
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time webhook ingestion, inbound client inquiries, delivery verification checkmarks, and forensic event logs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          {webhookMeta.canSimulate && (
            <button
              type="button"
              onClick={() => setShowSimModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
            >
              <Zap className="h-3.5 w-3.5 text-amber-300" />
              <span>Simulate Webhook Ping</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer shadow-2xs disabled:opacity-60 active:scale-98"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. Meta Webhook Configuration & Security Status Box */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-700/60 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Meta Webhook Configuration &amp; Security Status
            </h2>
          </div>
          <Link
            href="/admin/integrations"
            className="text-[11px] text-indigo-300 hover:text-indigo-200 font-semibold flex items-center gap-1.5"
          >
            <Settings className="h-3.5 w-3.5" />
            Manage Tokens in Integrations
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Callback URL */}
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 space-y-1.5">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Callback Webhook URL</span>
              <span>POST &amp; GET Handshake</span>
            </div>
            <div className="flex items-center justify-between gap-2 bg-slate-900/90 rounded-xl px-3 py-2 font-mono text-[11px] text-emerald-300 border border-slate-700">
              <span className="truncate">{webhookUrl}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(webhookUrl, "url")}
                className="text-slate-400 hover:text-white transition cursor-pointer p-1"
                title="Copy Callback URL"
              >
                {copiedKey === "url" ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              Paste into Meta Developer App &rarr; WhatsApp &rarr; Configuration &rarr; Callback URL
            </p>
          </div>

          {/* Security Verification Status */}
          <div className="bg-slate-800/80 rounded-2xl p-3.5 border border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-slate-400 text-[10px] uppercase font-bold tracking-wider">
              <span>Webhook Authentication Secrets</span>
              <span>Env / Integrations</span>
            </div>
            <div className="flex flex-wrap gap-2 pt-0.5">
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  webhookMeta.hasVerifyToken
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-700/60"
                    : "bg-amber-950/70 text-amber-300 border-amber-700/60"
                }`}
              >
                {webhookMeta.hasVerifyToken ? "Verify Token Configured" : "Set WHATSAPP_WEBHOOK_VERIFY_TOKEN"}
              </span>
              <span
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                  webhookMeta.hasAppSecret
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-700/60"
                    : "bg-rose-950/70 text-rose-300 border-rose-700/60"
                }`}
              >
                {webhookMeta.hasAppSecret ? "HMAC Signature Enforced" : "Warning: Set WHATSAPP_APP_SECRET"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Configure <code className="text-slate-200">WHATSAPP_WEBHOOK_VERIFY_TOKEN</code> and{" "}
              <code className="text-slate-200">WHATSAPP_APP_SECRET</code> in server environment or Integrations for signed webhook verification.
            </p>
          </div>
        </div>
      </div>

      {/* 3. KPI Metrics Cockpit */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Activity</span>
          <div className="text-xl font-black text-slate-900">{stats.totalCount}</div>
          <span className="text-[10px] text-slate-400">Logged events</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Inbound Leads</span>
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-600">{stats.inboundCount}</div>
          <span className="text-[10px] text-emerald-700 font-medium">Client replies</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Outbound Sent</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-600">{stats.outboundCount}</div>
          <span className="text-[10px] text-indigo-700 font-medium">Advisories &amp; Quotes</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Delivery Rate</span>
          <div className="text-xl font-black text-emerald-600">{stats.deliveryRate}%</div>
          <span className="text-[10px] text-slate-400">{stats.deliveredCount} delivered</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Read Receipts</span>
          <div className="text-xl font-black text-sky-600">{stats.readRate}%</div>
          <span className="text-[10px] text-slate-400">{stats.readCount} read receipts</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Failures</span>
            {stats.failedCount > 0 && <AlertCircle className="h-3.5 w-3.5 text-rose-500" />}
          </div>
          <div className={`text-xl font-black ${stats.failedCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {stats.failedCount}
          </div>
          <span className="text-[10px] text-slate-400">Undeliverable</span>
        </div>
      </div>

      {/* 4. Live Events Feed & Search Filter Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-4 p-6">
        {/* Filter & Search Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "ALL", label: "All Activity" },
              { id: "INBOUND", label: "Inbound (Clients)", badge: stats.inboundCount },
              { id: "OUTBOUND", label: "Outbound (Desk)", badge: stats.outboundCount },
              { id: "DELIVERED", label: "Delivered", badge: stats.deliveredCount },
              { id: "READ", label: "Read (✓✓)" },
              { id: "FAILED", label: "Failed", badge: stats.failedCount > 0 ? stats.failedCount : undefined },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilterDirection(tab.id);
                  setPage(1);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  filterDirection === tab.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200/70"
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      filterDirection === tab.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search phone, contact, text, or wamid..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-50 transition"
            />
          </div>
        </div>

        {/* Message Log Table */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            <span className="text-xs font-semibold">Streaming WhatsApp activity records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center space-y-2 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
            <MessageSquare className="h-8 w-8 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700">No WhatsApp messages match your filter</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Messages dispatched via Meta Cloud API or received via the webhook will appear here in real time.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="py-3 px-3">Direction &amp; Type</th>
                    <th className="py-3 px-3">Contact / Phone</th>
                    <th className="py-3 px-4">Message Snippet / Scope</th>
                    <th className="py-3 px-3">Delivery Status</th>
                    <th className="py-3 px-3">Linked Lead CRM</th>
                    <th className="py-3 px-3 text-right">Timestamp &amp; Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {logs.map((log) => {
                    const isInbound = log.direction === "INBOUND";
                    const contactPhone = isInbound ? log.fromNumber : log.toNumber;
                    const displayPhone = formatDisplayPhone(contactPhone);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition group">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span
                              className={`p-1.5 rounded-lg ${
                                isInbound
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : log.direction === "OUTBOUND"
                                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                  : "bg-slate-100 text-slate-600 border border-slate-200"
                              }`}
                            >
                              {isInbound ? (
                                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                              ) : (
                                <ArrowUpRight className="h-3.5 w-3.5 text-indigo-600" />
                              )}
                            </span>
                            <div>
                              <div className="font-bold text-slate-900 text-xs">
                                {isInbound ? "Inbound" : log.direction === "OUTBOUND" ? "Outbound" : "Update"}
                              </div>
                              <div className="text-[10px] text-slate-400 uppercase font-mono">{log.messageType}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {log.senderName || log.inquiry?.name || "Client Contact"}
                            </div>
                            <div className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                              <span>{displayPhone}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(contactPhone, log.id)}
                                className="text-slate-300 hover:text-slate-600 transition"
                                title="Copy Phone"
                              >
                                {copiedKey === log.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              </button>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-xs md:max-w-md">
                          <div className="space-y-0.5">
                            <p className="line-clamp-2 text-slate-800 text-xs leading-relaxed font-sans">
                              {log.content || <span className="italic text-slate-400">No text content</span>}
                            </p>
                            {log.errorMessage && (
                              <div className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 pt-0.5">
                                <AlertCircle className="h-3 w-3 shrink-0" />
                                <span className="truncate">{log.errorMessage}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            {log.status === "delivered" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                <span className="text-emerald-600 font-bold">✓✓</span>
                                Delivered
                              </span>
                            ) : log.status === "read" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-[11px] font-bold border border-sky-200">
                                <span className="text-sky-600 font-bold">✓✓</span>
                                Read
                              </span>
                            ) : log.status === "sent" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                                <span className="text-slate-500 font-bold">✓</span>
                                Sent
                              </span>
                            ) : log.status === "failed" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                                <AlertCircle className="h-3 w-3 text-rose-600" />
                                Failed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Received
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 whitespace-nowrap">
                          {log.inquiry ? (
                            <Link
                              href={`/admin/inquiries/${log.inquiry.id}`}
                              className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold text-xs group-hover:underline"
                            >
                              <User className="h-3 w-3" />
                              <span className="max-w-[120px] truncate">{log.inquiry.name}</span>
                              <ExternalLink className="h-2.5 w-2.5 text-slate-400" />
                            </Link>
                          ) : log.campaign ? (
                            <span className="text-[11px] text-slate-500 font-semibold truncate max-w-[120px]">
                              Campaign: {log.campaign.subject}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] italic">Not linked</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] text-slate-400 font-mono">
                              {new Date(log.createdAt).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <button
                              type="button"
                              onClick={() => setInspectLog(log)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                              title="Inspect Raw Meta Payload"
                            >
                              <FileCode className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page <strong className="text-slate-800">{page}</strong> of{" "}
                <strong className="text-slate-800">{totalPages}</strong> ({totalFiltered} records)
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 5. MODAL: Raw JSON Payload Inspector */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Forensic Meta Payload &amp; Event Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Message ID (wamid)</span>
                  <span className="font-bold text-slate-800 break-all">{inspectLog.messageId || "N/A"}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Direction &amp; Status</span>
                  <span className="font-bold text-slate-800">{inspectLog.direction} &bull; {inspectLog.status}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Sender / From</span>
                  <span className="font-bold text-slate-800">+{inspectLog.fromNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Recipient / To</span>
                  <span className="font-bold text-slate-800">+{inspectLog.toNumber}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-xs font-bold text-slate-700">Raw Meta Webhook JSON Payload</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(JSON.stringify(inspectLog.rawPayload, null, 2), "payload")}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === "payload" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    Copy JSON
                  </button>
                </div>
                <pre className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-[300px]">
                  {JSON.stringify(inspectLog.rawPayload || inspectLog, null, 2)}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. MODAL: Developer Webhook Simulator (ADMIN only) */}
      {showSimModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">Simulate Meta Webhook Ping</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Dispatch a signed synthetic Meta WhatsApp webhook event to test real-time parsing and DB persistence safely without modifying live client logs.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Simulation Event Type
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setSimAction("INBOUND_MESSAGE")}
                    className={`py-1.5 rounded-lg transition cursor-pointer ${
                      simAction === "INBOUND_MESSAGE" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Inbound Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimAction("DELIVERY_STATUS")}
                    className={`py-1.5 rounded-lg transition cursor-pointer ${
                      simAction === "DELIVERY_STATUS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Delivered (✓✓)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimAction("FAILED_STATUS")}
                    className={`py-1.5 rounded-lg transition cursor-pointer ${
                      simAction === "FAILED_STATUS" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600"
                    }`}
                  >
                    Failed (Error)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                  Test Phone Number (E.164 Digits)
                </label>
                <input
                  type="text"
                  value={simPhone}
                  onChange={(e) => setSimPhone(e.target.value)}
                  placeholder="919999900001"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                />
              </div>

              {simAction === "INBOUND_MESSAGE" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">
                    Simulated Message Body
                  </label>
                  <textarea
                    rows={3}
                    value={simText}
                    onChange={(e) => setSimText(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>
              )}
            </div>

            {simFeedback && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 break-all">
                {simFeedback}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulateWebhook}
                disabled={simulating}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer shadow-sm disabled:opacity-60"
              >
                {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                Trigger Simulated Ping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
