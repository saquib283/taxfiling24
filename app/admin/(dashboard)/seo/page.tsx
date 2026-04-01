"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Globe } from "lucide-react";

const SEO_PAGES = [
  { key: "home", label: "Homepage" },
  { key: "about", label: "About Page" },
  { key: "services", label: "Services Page" },
  { key: "articles", label: "Articles Page" },
  { key: "contact", label: "Contact Page" },
  { key: "tools", label: "Tools Page" },
  { key: "tax_calculator", label: "Tax Calculator" },
  { key: "gst_calculator", label: "GST Calculator" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "terms", label: "Terms Page" },
  { key: "refund", label: "Refund Policy" },
];

export default function SEOManagerPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    fetch("/api/admin/settings").then(r => r.json()).then(data => { setValues(data); setLoaded(true); });
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

  if (!loaded) return <div className="p-6 text-gray-400">Loading SEO settings...</div>;

  const page = SEO_PAGES[activeTab];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">SEO Manager</h1>
          <p className="text-gray-600">Manage meta tags and SEO settings for each page</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="w-48 shrink-0 space-y-1">
          {SEO_PAGES.map((p, i) => (
            <button key={p.key} onClick={() => setActiveTab(i)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === i ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <Globe className="h-4 w-4 inline mr-2" />{p.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{page.label} — SEO</h2>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Title</label>
              <input type="text" value={values[`seo_${page.key}_title`] || ""} onChange={e => setValues({ ...values, [`seo_${page.key}_title`]: e.target.value })} placeholder="Page title for search engines" maxLength={70} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">{(values[`seo_${page.key}_title`] || "").length}/70 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meta Description</label>
              <textarea value={values[`seo_${page.key}_description`] || ""} onChange={e => setValues({ ...values, [`seo_${page.key}_description`]: e.target.value })} placeholder="Brief description for search results" maxLength={160} rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">{(values[`seo_${page.key}_description`] || "").length}/160 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">OG Image URL</label>
              <input type="text" value={values[`seo_${page.key}_og_image`] || ""} onChange={e => setValues({ ...values, [`seo_${page.key}_og_image`]: e.target.value })} placeholder="https://yourdomain.com/images/og-home.png" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Keywords</label>
              <input type="text" value={values[`seo_${page.key}_keywords`] || ""} onChange={e => setValues({ ...values, [`seo_${page.key}_keywords`]: e.target.value })} placeholder="keyword one, keyword two, keyword three" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400 mt-1">Use comma-separated keywords for this page.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Canonical URL (Optional)</label>
              <input type="text" value={values[`seo_${page.key}_canonical`] || ""} onChange={e => setValues({ ...values, [`seo_${page.key}_canonical`]: e.target.value })} placeholder="https://yourdomain.com/page" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Sitewide Defaults</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Description</label>
                  <textarea value={values.seo_default_description || ""} onChange={e => setValues({ ...values, seo_default_description: e.target.value })} placeholder="Fallback description used when a page does not have a custom one." rows={3} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Keywords</label>
                  <input type="text" value={values.seo_default_keywords || ""} onChange={e => setValues({ ...values, seo_default_keywords: e.target.value })} placeholder="tax filing, GST, business compliance" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Default OG Image</label>
                  <input type="text" value={values.seo_default_og_image || ""} onChange={e => setValues({ ...values, seo_default_og_image: e.target.value })} placeholder="https://yourdomain.com/images/og-default.png" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Verification Code</label>
                  <input type="text" value={values.seo_google_verification || ""} onChange={e => setValues({ ...values, seo_google_verification: e.target.value })} placeholder="google-site-verification=..." className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
