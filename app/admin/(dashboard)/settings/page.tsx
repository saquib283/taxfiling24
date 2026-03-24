"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, X } from "lucide-react";
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

        <div className="pt-6 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 text-lg">Navigation Manager</h3>
              <p className="text-xs text-gray-400">Manage links and visibility of your site menu</p>
            </div>
            <button
              type="button"
              onClick={() => {
                const defaultConfig = [
                  { "href": "/", "label": "Home", "visible": true },
                  { "href": "/about", "label": "About", "visible": true },
                  { 
                    "href": "/services", 
                    "label": "Services",
                    "visible": true,
                    "children": [
                      { "href": "/services", "label": "All Services" },
                      { "href": "/services#income-tax", "label": "Income Tax" },
                      { "href": "/services#gst", "label": "GST Filings" },
                      { "href": "/services#business", "label": "Business Registration" }
                    ]
                  },
                  { 
                    "href": "/tools", 
                    "label": "Tools",
                    "visible": true,
                    "children": [
                      { "href": "/tools/tax-calculator", "label": "Tax Calculator" }
                    ]
                  },
                  { "href": "/articles", "label": "Articles", "visible": true },
                  { "href": "/contact", "label": "Contact", "visible": true }
                ];
                setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(defaultConfig) }));
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-3 py-1 bg-blue-50 rounded-full transition-colors"
            >
              Reset to Defaults
            </button>
          </div>
          
          <div className="space-y-3 mb-6">
            {(() => {
              try {
                const navItems = JSON.parse(settings.NAVBAR_CONFIG || "[]");
                if (!Array.isArray(navItems)) return null;

                const updateNavItem = (index: number, updates: any) => {
                  const newItems = [...navItems];
                  newItems[index] = { ...newItems[index], ...updates };
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                const deleteNavItem = (index: number) => {
                  const newItems = navItems.filter((_, i) => i !== index);
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                const addNavItem = () => {
                  const newItems = [...navItems, { label: "New Link", href: "/", visible: true }];
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                return (
                  <>
                    <div className="grid grid-cols-12 gap-4 px-3 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      <div className="col-span-1 text-center">Show</div>
                      <div className="col-span-4">Label</div>
                      <div className="col-span-5">Link / URL</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    {navItems.map((item: any, idx: number) => (
                      <div key={idx} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl border transition-all ${item.visible ? 'bg-white border-gray-100 shadow-sm' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
                        <div className="col-span-1 flex justify-center">
                          <input
                            type="checkbox"
                            checked={item.visible !== false}
                            onChange={(e) => updateNavItem(idx, { visible: e.target.checked })}
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => updateNavItem(idx, { label: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/10 outline-none"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={item.href}
                            onChange={(e) => updateNavItem(idx, { href: e.target.value })}
                            className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500/10 outline-none"
                          />
                        </div>
                        <div className="col-span-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => deleteNavItem(idx)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addNavItem}
                      className="w-full py-2.5 border-2 border-dashed border-gray-100 rounded-xl text-sm text-gray-400 hover:text-blue-500 hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                    >
                      + Add Menu Item
                    </button>
                  </>
                );
              } catch (e) {
                return (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">
                    Configuration Error: Your navigation data is corrupted. Click "Reset to Defaults" to fix it.
                  </div>
                );
              }
            })()}
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
