"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  Shield,
  CreditCard,
  Mail,
  BarChart3,
  Calendar,
  Users
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

const integrations = [
  {
    id: "1",
    name: "Google Analytics",
    type: "analytics",
    status: "active",
    description: "Track website traffic and user behavior",
    apiKey: process.env.GA_TRACKING_ID ? "•••••••••••••••" : "Not configured",
    lastSync: "2024-03-15 09:30:00",
    config: {
      trackingId: process.env.GA_TRACKING_ID ? "•••••••••••••••" : "Not configured",
      enableEcommerce: true,
      enableEnhancedMeasurement: true
    },
    logo: "/images/integrations/google-analytics.png",
    documentation: "https://developers.google.com/analytics"
  },
  {
    id: "2",
    name: "Stripe Payment",
    type: "payment",
    status: "active",
    description: "Process online payments securely",
    apiKey: process.env.STRIPE_SECRET_KEY ? "•••••••••••••••" : "Not configured",
    lastSync: "2024-03-15 09:45:00",
    config: {
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY ? "•••••••••••••••" : "Not configured",
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ? "•••••••••••••••" : "Not configured",
      enableApplePay: true,
      enableGooglePay: true
    },
    logo: "/images/integrations/stripe.png",
    documentation: "https://stripe.com/docs"
  },
  {
    id: "3",
    name: "SendGrid Email",
    type: "email",
    status: "inactive",
    description: "Send transactional emails and newsletters",
    apiKey: process.env.SENDGRID_API_KEY ? "•••••••••••••••" : "Not configured",
    lastSync: "2024-03-15 09:00:00",
    config: {
      defaultSender: process.env.EMAIL_FROM || "noreply@taxfiling24.com",
      templateEngine: "handlebars",
      enableTracking: true
    },
    logo: "/images/integrations/sendgrid.png",
    documentation: "https://sendgrid.com/docs"
  },
  {
    id: "4",
    name: "MongoDB Atlas",
    type: "database",
    status: "active",
    description: "Cloud database for data storage",
    apiKey: process.env.MONGODB_URI ? "•••••••••••••••" : "Not configured",
    lastSync: "2024-03-15 09:15:00",
    config: {
      cluster: "Cluster0",
      region: "US East 1",
      backupEnabled: true
    },
    logo: "/images/integrations/mongodb.png",
    documentation: "https://docs.mongodb.com/atlas"
  }
];

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState(integrations[0]);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async (integrationId: string) => {
    setIsSyncing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSyncing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50 border-green-200";
      case "inactive":
        return "text-gray-600 bg-gray-50 border-gray-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "analytics":
        return <BarChart3 className="h-5 w-5" />;
      case "payment":
        return <CreditCard className="h-5 w-5" />;
      case "email":
        return <Mail className="h-5 w-5" />;
      case "database":
        return <Shield className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Integrations</h1>
          <p className="text-gray-600">Manage third-party integrations and API connections</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Integration List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Available Integrations</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {integrations.map((integration) => (
                  <motion.div
                    key={integration.id}
                    whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.05)" }}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedIntegration.id === integration.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(integration.type)}
                        <span className="font-medium text-gray-900">{integration.name}</span>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                        {getStatusIcon(integration.status)}
                        <span className="capitalize">{integration.status}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{integration.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Integration Details */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(selectedIntegration.type)}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{selectedIntegration.name}</h2>
                      <p className="text-sm text-gray-600">{selectedIntegration.description}</p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(selectedIntegration.status)}`}>
                    {getStatusIcon(selectedIntegration.status)}
                    <span className="capitalize">{selectedIntegration.status}</span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Configuration</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700">API Key</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                          {selectedIntegration.apiKey}
                        </div>
                      </div>
                      {selectedIntegration.config && Object.entries(selectedIntegration.config).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </label>
                          <div className="mt-1 p-3 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                            {typeof value === 'boolean' ? value.toString() : value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Actions</h3>
                    <div className="space-y-3">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSync(selectedIntegration.id)}
                        disabled={isSyncing}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSyncing ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4" />
                            Sync Integration
                          </>
                        )}
                      </motion.button>
                      
                      <motion.a
                        href={selectedIntegration.documentation}
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Documentation
                      </motion.a>
                    </div>

                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Security Note</h4>
                          <p className="text-sm text-blue-700">
                            API keys and sensitive data are stored securely using environment variables and are never exposed in the client-side code.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Last synced: {selectedIntegration.lastSync}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Connected by: Admin</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
