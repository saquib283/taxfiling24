"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import MediaImageInput from "@/components/admin/MediaImageInput";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [settings, setSettings] = useState<any>({
    GEMINI_API_KEY: "",
    contact_email: "support@taxfiling24.com",
    contact_phone: "+91 7011246157",
    contact_address: "E-244/G First Floor Shaheen Bagh, Okhla New Delhi 110025",
    contact_whatsapp: "https://wa.me/917011246157",
  });

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(res => res.json())
      .then(data => {
        setSettings((prev: any) => ({
          ...prev,
          ...data,
          contact_email: data.contact_email || data.SUPPORT_EMAIL || prev.contact_email,
          contact_phone: data.contact_phone || data.SUPPORT_PHONE || prev.contact_phone,
          contact_address: data.contact_address || prev.contact_address,
          contact_whatsapp: data.contact_whatsapp || prev.contact_whatsapp,
        }));
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
    <div className="space-y-6 max-w-3xl">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure brand assets, API keys, contact channels, and site navigation</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl text-xs font-bold border shadow-2xs ${
          message.type === "success" 
            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
            : "bg-rose-50 text-rose-800 border-rose-200"
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
        {/* Branding & Media Section */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">
            Branding & Visual Media
          </h3>
          <div className="space-y-4">
            <MediaImageInput
              label="Primary Site Logo"
              description="Header and footer brand mark. Upload a transparent PNG/SVG or enter URL."
              value={settings.site_logo || ""}
              defaultImage="/brand-logo.png"
              aspectRatio="auto"
              onChange={(url) => setSettings((prev: any) => ({ ...prev, site_logo: url }))}
            />
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">Integrations</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Gemini AI API Key</label>
              <input
                type="password"
                name="GEMINI_API_KEY"
                value={settings.GEMINI_API_KEY || ""}
                onChange={handleChange}
                placeholder="AIzaSy..."
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Used for the chatbot assistant model and AI drafting tools.</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2 mb-4">Contact Information</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Support Email</label>
              <input
                type="email"
                name="contact_email"
                value={settings.contact_email || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Support Phone / Hotline</label>
              <input
                type="text"
                name="contact_phone"
                value={settings.contact_phone || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Office Address</label>
              <input
                type="text"
                name="contact_address"
                value={settings.contact_address || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 shadow-2xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Chat Link</label>
              <input
                type="text"
                name="contact_whatsapp"
                value={settings.contact_whatsapp || ""}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 shadow-2xs"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Navigation Manager</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage links and visibility of your site menu</p>
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
                      { "href": "/services/taxation-gst-compliance-management", "label": "Taxation & GST Compliance" },
                      { "href": "/services/business-setup-registration-services", "label": "Company & Startup Registration" },
                      { "href": "/services/corporate-roc-secretarial-filings", "label": "ROC & Corporate Filings" },
                      { "href": "/services/virtual-cfo-advisory-services", "label": "Virtual CFO Advisory" }
                    ]
                  },
                  { 
                    "href": "/tools", 
                    "label": "Tools",
                    "visible": true,
                    "children": [
                      { "href": "/tools/tax-calculator", "label": "Tax Calculator" },
                      { "href": "/tools/gst-calculator", "label": "GST Calculator" }
                    ]
                  },
                  { "href": "/articles", "label": "Articles", "visible": true },
                  { "href": "/contact", "label": "Contact", "visible": true }
                ];
                setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(defaultConfig) }));
              }}
              className="text-xs text-indigo-700 hover:text-indigo-800 font-bold px-3 py-1 bg-indigo-50 border border-indigo-200/60 rounded-lg transition"
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

                const updateChildItem = (index: number, childIndex: number, updates: any) => {
                  const newItems = [...navItems];
                  const children = Array.isArray(newItems[index].children) ? [...newItems[index].children] : [];
                  children[childIndex] = { ...children[childIndex], ...updates };
                  newItems[index] = { ...newItems[index], children };
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                const deleteNavItem = (index: number) => {
                  const newItems = navItems.filter((_, i) => i !== index);
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                const addChildItem = (index: number) => {
                  const newItems = [...navItems];
                  const children = Array.isArray(newItems[index].children) ? [...newItems[index].children] : [];
                  children.push({ label: "New Submenu", href: "/", visible: true });
                  newItems[index] = { ...newItems[index], children };
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                const deleteChildItem = (index: number, childIndex: number) => {
                  const newItems = [...navItems];
                  const children = Array.isArray(newItems[index].children) ? [...newItems[index].children] : [];
                  newItems[index] = { ...newItems[index], children: children.filter((_, i) => i !== childIndex) };
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                const addNavItem = () => {
                  const newItems = [...navItems, { label: "New Link", href: "/", visible: true }];
                  setSettings((prev: any) => ({ ...prev, NAVBAR_CONFIG: JSON.stringify(newItems) }));
                };

                return (
                  <>
                    <div className="grid grid-cols-12 gap-4 px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <div className="col-span-1 text-center">Show</div>
                      <div className="col-span-4">Label</div>
                      <div className="col-span-5">Link / URL</div>
                      <div className="col-span-2 text-right">Action</div>
                    </div>
                    {navItems.map((item: any, idx: number) => (
                      <div key={idx} className={`rounded-xl border p-3 transition ${item.visible ? 'bg-white border-slate-200 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
                        <div className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-1 flex justify-center">
                            <input
                              type="checkbox"
                              checked={item.visible !== false}
                              onChange={(e) => updateNavItem(idx, { visible: e.target.checked })}
                              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) => updateNavItem(idx, { label: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div className="col-span-5">
                            <input
                              type="text"
                              value={item.href}
                              onChange={(e) => updateNavItem(idx, { href: e.target.value })}
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div className="col-span-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => deleteNavItem(idx)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 p-3">
                          <div className="mb-2 flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submenu Items</p>
                            <button
                              type="button"
                              onClick={() => addChildItem(idx)}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-700"
                            >
                              + Add submenu
                            </button>
                          </div>

                          {Array.isArray(item.children) && item.children.length > 0 ? (
                            <div className="space-y-2">
                              {item.children.map((child: any, childIndex: number) => (
                                <div key={`${idx}-${childIndex}`} className="grid grid-cols-12 gap-2 items-center">
                                  <div className="col-span-1 flex justify-center">
                                    <input
                                      type="checkbox"
                                      checked={child.visible !== false}
                                      onChange={(e) => updateChildItem(idx, childIndex, { visible: e.target.checked })}
                                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                  </div>
                                  <div className="col-span-4">
                                    <input
                                      type="text"
                                      value={child.label || ""}
                                      onChange={(e) => updateChildItem(idx, childIndex, { label: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-900 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                  <div className="col-span-6">
                                    <input
                                      type="text"
                                      value={child.href || ""}
                                      onChange={(e) => updateChildItem(idx, childIndex, { href: e.target.value })}
                                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:border-indigo-500 outline-none"
                                    />
                                  </div>
                                  <div className="col-span-1 flex justify-end">
                                    <button
                                      type="button"
                                      onClick={() => deleteChildItem(idx, childIndex)}
                                      className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">No submenu items yet.</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addNavItem}
                      className="w-full py-2.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/40 transition flex items-center justify-center gap-2"
                    >
                      + Add Menu Item
                    </button>
                  </>
                );
              } catch (e) {
                return (
                  <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
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
          className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-xs transition active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Settings"}
        </motion.button>
      </form>
    </div>
  );
}
