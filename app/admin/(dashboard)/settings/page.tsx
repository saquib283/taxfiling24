"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [settings, setSettings] = useState<any>({
    GEMINI_API_KEY: "",
    SUPPORT_EMAIL: "support@taxfiling24.com",
    SUPPORT_PHONE: "+91 7011246157",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setSettings((prev: any) => ({ ...prev, ...data }));
        setLoading(false);
      })
      .catch(() => {
        setMessage({ text: "Failed to load settings", type: "error" });
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setMessage({ text: "Settings saved successfully!", type: "success" });
      } else {
        setMessage({ text: "Failed to save settings.", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Something went wrong.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-gray-600">Configure your application keys and metadata</p>
      </div>

      {message.text && (
        <div className={`p-3 mb-6 rounded-lg text-sm border ${
          message.type === "success" 
            ? "bg-green-50 text-green-600 border-green-100" 
            : "bg-red-50 text-red-600 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Integrations</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gemini AI API Key</label>
              <input
                type="password"
                name="GEMINI_API_KEY"
                value={settings.GEMINI_API_KEY || ""}
                onChange={handleChange}
                placeholder="AIzaSy..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">Used for the chatbot assistant model.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2 mb-4">Contact Info</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Email</label>
              <input
                type="email"
                name="SUPPORT_EMAIL"
                value={settings.SUPPORT_EMAIL || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Support Phone/WhatsApp</label>
              <input
                type="text"
                name="SUPPORT_PHONE"
                value={settings.SUPPORT_PHONE || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900"
              />
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit"
          disabled={saving}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </motion.button>
      </form>
    </div>
  );
}
