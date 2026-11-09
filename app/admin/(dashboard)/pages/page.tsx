"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, FileText, ArrowRight, Eye, Edit3, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { sanitizeHtml } from "@/lib/sanitize-html";

const PAGES = [
  { titleKey: "page_privacy_title", contentKey: "page_privacy", label: "Privacy Policy", path: "/privacy", description: "Manage privacy guidelines and compliance logs." },
  { titleKey: "page_terms_title", contentKey: "page_terms", label: "Terms of Service", path: "/terms", description: "Terms, agreement policies, and service rules." },
  { titleKey: "page_refund_title", contentKey: "page_refund", label: "Refund Policy", path: "/refund", description: "Cancellation, return policies, and moneyback terms." },
];

export default function PagesEditorPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(r => r.json())
      .then(data => { setValues(data); setLoaded(true); });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: values }),
    });
    setSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  if (!loaded) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-400 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        Loading pages...
      </div>
    );
  }

  const page = PAGES[activeTab];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header section */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
            Static Pages
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Publish custom terms, privacy statements, policy guidelines, and legal content blocks.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in duration-200">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Saved successfully!
            </span>
          )}
          <Link
            href={page.path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-sm transition active:scale-95 cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            View Live
          </Link>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving} 
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </header>

      {/* Main content grid split */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left tabs selector */}
        <div className="w-full lg:w-56 shrink-0 space-y-1">
          {PAGES.map((p, i) => (
            <button 
              type="button"
              key={p.titleKey} 
              onClick={() => { setActiveTab(i); setPreviewMode(false); }} 
              className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-between group ${
                activeTab === i 
                  ? "bg-slate-950 text-white shadow-md" 
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0" />
                {p.label}
              </span>
              <ArrowRight className={`h-3 w-3 transition opacity-0 group-hover:opacity-100 ${activeTab === i ? "text-white" : "text-slate-400"}`} />
            </button>
          ))}
        </div>

        {/* Right editor box */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm space-y-5 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-950">{page.label} Settings</h2>
              <p className="text-xs text-slate-400 mt-0.5">{page.description}</p>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  !previewMode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Edit3 className="h-3.5 w-3.5 text-indigo-600" />
                Editor
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  previewMode ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                }`}
              >
                <Eye className="h-3.5 w-3.5 text-indigo-600" />
                Live Preview
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Display Page Title</label>
            <input
              value={values[page.titleKey] || page.label}
              onChange={e => setValues({ ...values, [page.titleKey]: e.target.value })}
              placeholder={`Title for ${page.label}`}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition outline-none shadow-sm"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Page Document Body Content
            </label>
            {previewMode ? (
              <div className="min-h-[400px] rounded-xl border border-slate-200 p-6 bg-slate-50/50">
                <div 
                  className="prose prose-sm max-w-none text-slate-800 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(values[page.contentKey] || "<p class='text-slate-400 italic'>No content drafted yet. Switch to Editor to write.</p>") }}
                />
              </div>
            ) : (
              <RichTextEditor
                value={values[page.contentKey] || ""}
                onChange={(html) => setValues({ ...values, [page.contentKey]: html })}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}