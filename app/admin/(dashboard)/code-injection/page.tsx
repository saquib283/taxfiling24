"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Code, AlertTriangle, CheckCircle } from "lucide-react";

export default function CodeInjectionPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const INJECTION_KEYS = ["inject_head", "inject_body", "inject_css", "ga_id"] as const;

  useEffect(() => {
    fetch("/api/admin/settings")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load code injection settings");
        return r.json();
      })
      .then((data) => {
        const scoped: Record<string, string> = {};
        for (const key of INJECTION_KEYS) {
          if (typeof data?.[key] === "string") scoped[key] = data[key];
        }
        setValues(scoped);
      })
      .catch(() => setFeedback({ text: "Failed to load code injection settings.", type: "error" }))
      .finally(() => setLoaded(true));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);
    try {
      const payload: Record<string, string> = {};
      for (const key of INJECTION_KEYS) {
        payload[key] = values[key] || "";
      }
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: payload }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setFeedback({ text: "Scripts and analytics settings saved!", type: "success" });
      } else {
        setFeedback({ text: data.error || "Failed to save scripts.", type: "error" });
      }
    } catch {
      setFeedback({ text: "Network error while saving scripts.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center text-slate-400 font-medium">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mr-2" />
        Loading code injection settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Code Injection</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Custom Scripts
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Inject analytics scripts, verification meta tags, custom widgets, or additional site styles.
          </p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-98 disabled:opacity-50 cursor-pointer shrink-0"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {saving ? "Saving..." : "Save All Scripts"}
        </button>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold border shadow-2xs flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-800 border-rose-200"
          }`}
        >
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Warning Callout Card */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3.5 shadow-2xs">
        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-bold text-amber-900">Be careful with custom code injections</p>
          <p className="text-xs text-amber-700 leading-relaxed">
            Only paste verified third-party scripts. Invalid script setups or unclosed HTML tags can break the layout client-side.
          </p>
        </div>
      </div>

      {/* Code Injection Areas */}
      <div className="space-y-6">
        {/* Head scripts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Head scripts (HTML injected inside &lt;head&gt;)</h3>
            <p className="text-xs text-slate-400 mt-1">Best for web fonts, Google Search Console verifications, or global tracking tags.</p>
          </div>
          <textarea
            value={values["inject_head"] || ""}
            onChange={e => setValues({ ...values, inject_head: e.target.value })}
            placeholder={'<!-- Google Analytics Example -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>'}
            rows={8}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition outline-none resize-none shadow-2xs leading-relaxed"
          />
        </div>

        {/* Body scripts */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Body scripts (HTML injected before &lt;/body&gt;)</h3>
            <p className="text-xs text-slate-400 mt-1">Best for live chat messengers, feedback panels, or conversion pixels.</p>
          </div>
          <textarea
            value={values["inject_body"] || ""}
            onChange={e => setValues({ ...values, inject_body: e.target.value })}
            placeholder={'<!-- Facebook Pixel Example -->\n<script>!function(f,b,e,v,n,t,s)...</script>'}
            rows={8}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition outline-none resize-none shadow-2xs leading-relaxed"
          />
        </div>

        {/* Custom CSS styles */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Custom CSS Stylesheet override</h3>
            <p className="text-xs text-slate-400 mt-1">Additional custom styling rules loaded globally on client screens.</p>
          </div>
          <textarea
            value={values["inject_css"] || ""}
            onChange={e => setValues({ ...values, inject_css: e.target.value })}
            placeholder="/* e.g., body { font-family: 'Inter', sans-serif; } */"
            rows={6}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-xs font-mono text-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition outline-none resize-none shadow-2xs leading-relaxed"
          />
        </div>

        {/* Quick config settings */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Quick third-party setups</h3>
            <p className="text-xs text-slate-400 mt-1">Configure analytic keys directly without inserting raw HTML blocks.</p>
          </div>
          
          <div className="grid gap-5 sm:grid-cols-2 pt-2 border-t border-slate-50">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Google Analytics Tracking ID (GA4)</label>
              <input 
                type="text" 
                value={values["ga_id"] || ""} 
                onChange={e => setValues({ ...values, ga_id: e.target.value })} 
                placeholder="G-XXXXXXXXXX" 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition outline-none font-mono shadow-2xs" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Facebook Pixel Tracking ID</label>
              <input 
                type="text" 
                value={values["fb_pixel_id"] || ""} 
                onChange={e => setValues({ ...values, fb_pixel_id: e.target.value })} 
                placeholder="e.g. 84729104829103" 
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50 transition outline-none font-mono shadow-2xs" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
