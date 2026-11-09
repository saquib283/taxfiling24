"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Globe, ArrowRight } from "lucide-react";

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

  if (!loaded) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-400 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        Loading SEO settings...
      </div>
    );
  }

  const page = SEO_PAGES[activeTab];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            SEO Manager
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Configure indexing meta tags, keyword setups, search engine snippets, and defaults sitewide.
          </p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="inline-flex items-center justify-center gap-1.5 px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-center"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving..." : "Save All SEO"}
        </button>
      </header>

      {/* Main content split */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Tabs Selector */}
        <div className="w-full lg:w-52 shrink-0 space-y-1">
          {SEO_PAGES.map((p, i) => (
            <button 
              key={p.key} 
              onClick={() => setActiveTab(i)} 
              className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-semibold transition duration-150 cursor-pointer flex items-center justify-between group ${
                activeTab === i 
                  ? "bg-slate-950 text-white shadow-md animate-fade-in" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0" />
                {p.label}
              </span>
              <ArrowRight className={`h-3 w-3 transition opacity-0 group-hover:opacity-100 ${activeTab === i ? "text-white" : "text-slate-400"}`} />
            </button>
          ))}
        </div>

        {/* Right Editor Cards */}
        <div className="flex-1 space-y-6 w-full">
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">{page.label} SEO Configuration</h2>
              <p className="text-xs text-slate-500 mt-0.5">Customize metadata tags loaded when visiting this route.</p>
              <div className="h-px bg-slate-100 mt-4" />
            </div>

            {/* Live Google Search Result Preview */}
            <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 space-y-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Google SERP Live Preview</span>
                <span className="text-[10px] text-slate-400 font-mono">Desktop & Mobile snippet</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] text-white font-bold">
                  T
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-slate-800 leading-tight">TaxFiling24</span>
                  <span className="text-[11px] text-slate-500 font-mono leading-tight">
                    https://taxfiling24.com{page.key !== "home" ? ` › ${page.key}` : ""}
                  </span>
                </div>
              </div>
              <h4 className="text-base text-blue-700 hover:underline font-medium cursor-pointer leading-snug line-clamp-1">
                {values[`seo_${page.key}_title`] || `${page.label} | TaxFiling24 - Tax & Compliance`}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {values[`seo_${page.key}_description`] || values.seo_default_description || "Professional chartered accountancy, income tax return filing, GST registration, and corporate advisory services across India."}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Meta Title</label>
                  <span className={`text-[10px] font-bold ${(values[`seo_${page.key}_title`] || "").length > 70 ? "text-rose-500" : "text-slate-400"}`}>
                    {(values[`seo_${page.key}_title`] || "").length}/70 chars
                  </span>
                </div>
                <input 
                  type="text" 
                  value={values[`seo_${page.key}_title`] || ""} 
                  onChange={e => setValues({ ...values, [`seo_${page.key}_title`]: e.target.value })} 
                  placeholder="Enter snippet heading for Google search..." 
                  maxLength={70} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm" 
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Meta Description</label>
                  <span className={`text-[10px] font-bold ${(values[`seo_${page.key}_description`] || "").length > 160 ? "text-rose-500" : "text-slate-400"}`}>
                    {(values[`seo_${page.key}_description`] || "").length}/160 chars
                  </span>
                </div>
                <textarea 
                  value={values[`seo_${page.key}_description`] || ""} 
                  onChange={e => setValues({ ...values, [`seo_${page.key}_description`]: e.target.value })} 
                  placeholder="Provide a short search summary description snippet..." 
                  maxLength={160} 
                  rows={3} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none resize-none shadow-sm leading-relaxed" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Social Sharing Preview Image (OG Image URL)</label>
                <input 
                  type="text" 
                  value={values[`seo_${page.key}_og_image`] || ""} 
                  onChange={e => setValues({ ...values, [`seo_${page.key}_og_image`]: e.target.value })} 
                  placeholder="e.g., https://taxfiling24.com/og/home-preview.png" 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none font-mono shadow-sm" 
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Keywords (Comma Separated)</label>
                  <input 
                    type="text" 
                    value={values[`seo_${page.key}_keywords`] || ""} 
                    onChange={e => setValues({ ...values, [`seo_${page.key}_keywords`]: e.target.value })} 
                    placeholder="e.g., taxes, roc compliance, startup" 
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Canonical Link URL (Optional)</label>
                  <input 
                    type="text" 
                    value={values[`seo_${page.key}_canonical`] || ""} 
                    onChange={e => setValues({ ...values, [`seo_${page.key}_canonical`]: e.target.value })} 
                    placeholder="e.g., https://taxfiling24.com/services" 
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none font-mono shadow-sm" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sitewide defaults block */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sitewide SEO Defaults</h3>
              <p className="text-xs text-slate-500 mt-0.5">Configure fallback metadata values when page metadata is undefined.</p>
              <div className="h-px bg-slate-100 mt-4" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Default Description Fallback</label>
                <textarea 
                  value={values.seo_default_description || ""} 
                  onChange={e => setValues({ ...values, seo_default_description: e.target.value })} 
                  placeholder="Sitewide meta description fallback..." 
                  rows={2} 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none resize-none shadow-sm" 
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Default Keywords Fallback</label>
                  <input 
                    type="text" 
                    value={values.seo_default_keywords || ""} 
                    onChange={e => setValues({ ...values, seo_default_keywords: e.target.value })} 
                    placeholder="e.g., taxation, audit, GST compliance" 
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Default OG Image Fallback</label>
                  <input 
                    type="text" 
                    value={values.seo_default_og_image || ""} 
                    onChange={e => setValues({ ...values, seo_default_og_image: e.target.value })} 
                    placeholder="https://taxfiling24.com/images/default-og.png" 
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none font-mono shadow-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Google Site Verification Code</label>
                <input 
                  type="text" 
                  value={values.seo_google_verification || ""} 
                  onChange={e => setValues({ ...values, seo_google_verification: e.target.value })} 
                  placeholder="google-site-verification=..." 
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none font-mono shadow-sm" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
