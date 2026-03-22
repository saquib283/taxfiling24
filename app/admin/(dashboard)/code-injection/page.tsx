"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, Code, AlertTriangle } from "lucide-react";

export default function CodeInjectionPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

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

  if (!loaded) return <div className="p-6 text-gray-400">Loading code injection settings...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Code Injection</h1>
          <p className="text-gray-600">Add custom scripts like Google Analytics, Facebook Pixel, etc.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save All"}
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-800">Be careful with custom code</p>
          <p className="text-xs text-yellow-600 mt-1">Only inject trusted third-party scripts. Invalid code can break the website.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Head Scripts</h3>
          <p className="text-xs text-gray-500 mb-4">Injected inside &lt;head&gt; tag. Best for analytics, fonts, and meta tags.</p>
          <textarea
            value={values["inject_head"] || ""}
            onChange={e => setValues({ ...values, inject_head: e.target.value })}
            placeholder={'<!-- Google Analytics -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXX"></script>'}
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Body Scripts (End)</h3>
          <p className="text-xs text-gray-500 mb-4">Injected before &lt;/body&gt;. Best for chat widgets, tracking pixels.</p>
          <textarea
            value={values["inject_body"] || ""}
            onChange={e => setValues({ ...values, inject_body: e.target.value })}
            placeholder={'<!-- Facebook Pixel -->\n<script>!function(f,b,e,v,n,t,s)...</script>'}
            rows={8}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Custom CSS</h3>
          <p className="text-xs text-gray-500 mb-4">Additional CSS applied globally to the website.</p>
          <textarea
            value={values["inject_css"] || ""}
            onChange={e => setValues({ ...values, inject_css: e.target.value })}
            placeholder="/* Custom styles */\nbody { }"
            rows={6}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="font-semibold text-gray-900">Quick Setup</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Google Analytics ID</label>
              <input type="text" value={values["ga_id"] || ""} onChange={e => setValues({ ...values, ga_id: e.target.value })} placeholder="G-XXXXXXXXXX" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Facebook Pixel ID</label>
              <input type="text" value={values["fb_pixel_id"] || ""} onChange={e => setValues({ ...values, fb_pixel_id: e.target.value })} placeholder="XXXXXXXXXXXXXX" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
