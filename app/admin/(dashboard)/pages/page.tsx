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
  const [errorMessage, setErrorMessage] = useState("");

  const PAGE_KEYS = PAGES.flatMap((p) => [p.titleKey, p.contentKey]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load static pages");
        return r.json();
      })
      .then((data) => {
        const scoped: Record<string, string> = {};
        for (const key of PAGE_KEYS) {
          if (typeof data?.[key] === "string") scoped[key] = data[key];
        }
        setValues(scoped);
      })
      .catch(() => setErrorMessage("Failed to load static page content."))
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setErrorMessage("");
    try {
      const payload: Record<string, string> = {};
      for (const key of PAGE_KEYS) {
        if (values[key] !== undefined) payload[key] = values[key];
      }
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to save static pages.");
      } else {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3500);
      }
    } catch {
      setErrorMessage("Network error while saving static pages.");
    } finally {
      setSaving(false);
    }
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
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Static Pages</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {PAGES.length} policies
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
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
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
          >
            <ExternalLink className="h-3.5 w-3.5 text-slate-500" />
            View Live
          </Link>
          <button 
            type="button"
            onClick={handleSave} 
            disabled={saving} 
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-xl text-xs font-bold border bg-rose-50 text-rose-800 border-rose-200">
          {errorMessage}
        </div>
      )}

      {/* Main content grid split */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left tabs selector */}
        <div className="w-full lg:w-56 shrink-0 space-y-1">
          {PAGES.map((p, i) => (
            <button 
              type="button"
              key={p.titleKey} 
              onClick={() => { setActiveTab(i); setPreviewMode(false); }} 
              className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition duration-150 cursor-pointer flex items-center justify-between group ${
                activeTab === i 
                  ? "bg-indigo-600 text-white shadow-xs" 
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
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 w-full">
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
              value={values[page.titleKey] ?? page.label}
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