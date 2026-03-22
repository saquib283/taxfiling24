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
    name: "Gemini AI",
    description: "AI-powered content generation for articles, emails, FAQs, and service descriptions.",
    envKeys: ["GEMINI_API_KEY"],
    docsUrl: "https://ai.google.dev",
    icon: "🤖",
  },
  {
    name: "Database (PostgreSQL)",
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
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Integrations</h1>
        <p className="text-gray-600">View the connection status of external services. Configure via environment variables or admin settings.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {INTEGRATIONS.map((integration) => {
          const status = getStatus(integration);
          return (
            <div key={integration.name} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{integration.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{integration.description}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  status === "connected" ? "bg-green-50 text-green-600 border-green-200" :
                  status === "checking" ? "bg-gray-50 text-gray-500 border-gray-200" :
                  "bg-red-50 text-red-500 border-red-200"
                }`}>
                  {status === "connected" ? <CheckCircle className="h-3.5 w-3.5" /> :
                   status === "checking" ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> :
                   <XCircle className="h-3.5 w-3.5" />}
                  {status === "connected" ? "Connected" : status === "checking" ? "Checking..." : "Not Configured"}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Shield className="h-3.5 w-3.5" />
                    <span>Required: {integration.envKeys.join(", ")}</span>
                  </div>
                  <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Docs <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-700">
          <strong>Note:</strong> Integration credentials are configured via environment variables (<code>.env</code>) or the Settings page. API keys are never exposed in the browser — only their presence is checked.
        </p>
      </div>
    </div>
  );
}
