"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, FileText } from "lucide-react";

const PAGES = [
  { titleKey: "page_privacy_title", contentKey: "page_privacy", label: "Privacy Policy", description: "Legal privacy policy page" },
  { titleKey: "page_terms_title", contentKey: "page_terms", label: "Terms of Service", description: "Terms and conditions" },
  { titleKey: "page_refund_title", contentKey: "page_refund", label: "Refund Policy", description: "Refund and cancellation policy" },
];

export default function PagesEditorPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => { setValues(data); setLoaded(true); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    setSaving(false);
  };

  if (!loaded) return <div className="p-6 text-gray-400">Loading pages...</div>;

  const page = PAGES[activeTab];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Static Pages</h1>
          <p className="text-gray-600">Edit legal and informational pages on the website</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-52 shrink-0 space-y-1">
          {PAGES.map((p, i) => (
            <button key={p.titleKey} onClick={() => setActiveTab(i)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === i ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <FileText className="h-4 w-4 inline mr-2" />{p.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">{page.label}</h2>
          <p className="text-sm text-gray-500 mb-6">{page.description}</p>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Page Title</label>
            <input
              value={values[page.titleKey] || page.label}
              onChange={e => setValues({ ...values, [page.titleKey]: e.target.value })}
              placeholder={`Enter the title for ${page.label}`}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <textarea
            value={values[page.contentKey] || ""}
            onChange={e => setValues({ ...values, [page.contentKey]: e.target.value })}
            placeholder={`Enter your ${page.label} content here... (Supports HTML or plain text)`}
            rows={20}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
}
