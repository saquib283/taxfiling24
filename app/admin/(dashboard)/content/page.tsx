"use client";

import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";

const CONTENT_SECTIONS = [
  {
    label: "Hero Section",
    fields: [
      { key: "hero_badge", label: "Badge Text", placeholder: "Complete Business Solutions" },
      { key: "hero_headline", label: "Headline", placeholder: "Complete Business, Tax & Compliance Solutions" },
      { key: "hero_subheading", label: "Subheading", placeholder: "Your Trusted Partner for Business Registration..." },
      { key: "hero_cta_primary", label: "Primary Button Text", placeholder: "Talk To Expert" },
      { key: "hero_cta_secondary", label: "Secondary Button Text", placeholder: "Explore Services" },
    ]
  },
  {
    label: "About Section",
    fields: [
      { key: "about_title", label: "Title", placeholder: "Why Choose TaxFiling24?" },
      { key: "about_description", label: "Description", placeholder: "We provide expert financial...", type: "textarea" },
    ]
  },
  {
    label: "Stats (Numbers)",
    fields: [
      { key: "stats_clients", label: "Happy Clients", placeholder: "2000+" },
      { key: "stats_experience", label: "Years Experience", placeholder: "15+" },
      { key: "stats_services", label: "Services Offered", placeholder: "50+" },
      { key: "stats_satisfaction", label: "Satisfaction Rate", placeholder: "99%" },
    ]
  },
  {
    label: "CTA Section",
    fields: [
      { key: "cta_headline", label: "Headline", placeholder: "Ready to Get Started?" },
      { key: "cta_subtext", label: "Subtext", placeholder: "Book a free consultation..." },
      { key: "cta_button_text", label: "Button Text", placeholder: "Schedule Consultation" },
    ]
  },
  {
    label: "Contact Info",
    fields: [
      { key: "contact_phone", label: "Phone", placeholder: "+91 7011246157" },
      { key: "contact_email", label: "Email", placeholder: "support@taxfiling24.com" },
      { key: "contact_address", label: "Address", placeholder: "E-244/G First Floor...", type: "textarea" },
      { key: "contact_whatsapp", label: "WhatsApp Number", placeholder: "917011246157" },
    ]
  },
  {
    label: "Social Links",
    fields: [
      { key: "social_facebook", label: "Facebook URL", placeholder: "https://facebook.com/..." },
      { key: "social_linkedin", label: "LinkedIn URL", placeholder: "https://linkedin.com/..." },
      { key: "social_twitter", label: "Twitter / X URL", placeholder: "https://x.com/..." },
      { key: "social_instagram", label: "Instagram URL", placeholder: "https://instagram.com/..." },
    ]
  },
  {
    label: "Footer",
    fields: [
      { key: "footer_tagline", label: "Footer Tagline", placeholder: "Taxfiling24 makes tax and compliance simple..." },
      { key: "footer_copyright", label: "Copyright Text", placeholder: "© 2025 TaxFiling24. All rights reserved." },
    ]
  },
  {
    label: "Announcement Banner",
    fields: [
      { key: "announcement_active", label: "Banner Active (true/false)", placeholder: "false" },
      { key: "announcement_text", label: "Banner Text", placeholder: "ITR filing deadline extended!" },
      { key: "announcement_link", label: "Banner Link (optional)", placeholder: "/services" },
      { key: "announcement_bg", label: "Banner Color", placeholder: "#0F4C81" },
    ]
  },
];

export default function ContentEditorPage() {
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

  if (!loaded) return <div className="p-6 text-gray-400">Loading content settings...</div>;

  const section = CONTENT_SECTIONS[activeTab];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Content Editor</h1>
          <p className="text-gray-600">Manage all text content on the website</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Tabs */}
        <div className="w-56 shrink-0 space-y-1">
          {CONTENT_SECTIONS.map((s, i) => (
            <button key={i} onClick={() => setActiveTab(i)} className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === i ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">{section.label}</h2>
          <div className="space-y-5">
            {section.fields.map(field => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{field.label}</label>
                {(field as any).type === "textarea" ? (
                  <textarea
                    value={values[field.key] || ""}
                    onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <input
                    type="text"
                    value={values[field.key] || ""}
                    onChange={e => setValues({ ...values, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
                <p className="text-xs text-gray-400 mt-1">Key: <code className="bg-gray-100 px-1 rounded">{field.key}</code></p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
