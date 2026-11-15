"use client";

import { useState, useEffect } from "react";
import { CheckCircle, XCircle, RefreshCw, ExternalLink, Shield } from "lucide-react";

interface Integration {
  name: string;
  description: string;
  envKeys: string[];
  docsUrl: string;
  icon: string;
}

const INTEGRATIONS: Integration[] = [
  {
    name: "Google Analytics",
    description: "Track website traffic, user behavior, and conversion metrics.",
    envKeys: ["ga_id"],
    docsUrl: "https://analytics.google.com",
    icon: "📊",
  },
  {
    name: "SMTP / Email",
    description: "Send campaign emails and transactional notifications to subscribers.",
    envKeys: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS"],
    docsUrl: "https://support.google.com/a/answer/176600",
    icon: "📧",
  },
  {
    name: "Meta WhatsApp Cloud API & Webhooks",
    description: "Official WhatsApp messaging, automated reminders, broadcast campaigns, and bidirectional webhook logs.",
    envKeys: ["WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_WEBHOOK_VERIFY_TOKEN"],
    docsUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
    icon: "💬",
  },
  {
    name: "Gemini AI",
    description: "AI-powered content generation for articles, emails, FAQs, and service descriptions.",
    envKeys: ["GEMINI_API_KEY"],
    docsUrl: "https://ai.google.dev",
    icon: "🤖",
  },
  {
    name: "Database (MySQL)",
    description: "Primary data store for all application data via Prisma ORM.",
    envKeys: ["DATABASE_URL"],
    docsUrl: "https://www.prisma.io/docs",
    icon: "🗄️",
  },
];

export default function IntegrationsPage() {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/integrations/status")
      .then(res => res.json())
      .then(data => {
        setStatuses(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatus = (integration: Integration) => {
    if (loading) return "checking";
    return integration.envKeys.every(key => statuses[key]) ? "connected" : "missing";
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">API & System Integrations</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {INTEGRATIONS.length} services
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            View connection health and environment credentials for external APIs, databases, and mail systems.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const status = getStatus(integration);
          return (
            <div key={integration.name} className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 hover:border-slate-300 transition">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{integration.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{integration.description}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shrink-0 ${
                  status === "connected" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  status === "checking" ? "bg-slate-50 text-slate-500 border-slate-200" :
                  "bg-rose-50 text-rose-700 border-rose-200"
                }`}>
                  {status === "connected" ? <CheckCircle className="h-3.5 w-3.5" /> :
                   status === "checking" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> :
                   <XCircle className="h-3.5 w-3.5" />}
                  {status === "connected" ? "Connected" : status === "checking" ? "Checking..." : "Not Configured"}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                    <Shield className="h-3.5 w-3.5 text-slate-400" />
                    <span>Required: {integration.envKeys.join(", ")}</span>
                  </div>
                  <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 font-bold">
                    Docs <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-indigo-50/70 border border-indigo-200/70 rounded-2xl p-4">
        <p className="text-xs text-indigo-900 leading-relaxed">
          <strong className="font-bold">Security Note:</strong> Integration credentials are configured via environment variables (<code>.env</code>) or the Settings page. API keys and passwords are never exposed to client-side code — only status presence is validated securely.
        </p>
      </div>
    </div>
  );
}
